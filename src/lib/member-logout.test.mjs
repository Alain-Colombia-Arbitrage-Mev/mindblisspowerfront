import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { logoutMember, clearMemberBrowserState } from './member-logout.mjs';
import { proxyBetterAuth } from './better-auth-bridge.mjs';

test('logout posts once with same-origin cookies and only clears local state and hard-navigates after the exact success acknowledgement', async () => {
  let finish, calls=0;const events=[];
  const response=new Promise(resolve=>{finish=resolve;});
  const options={fetchImpl:async(url,init)=>{
    calls++;assert.equal(url,'/api/auth/logout');assert.equal(init.method,'POST');assert.equal(init.body,'{}');
    assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
    assert.equal(init.headers['content-type'],'application/json');assert.ok(init.signal instanceof AbortSignal);
    return response;
  },clearCaches:()=>events.push('clear'),navigate:path=>events.push(path)};
  const first=logoutMember(options),second=logoutMember(options);
  assert.equal(first,second);assert.equal(calls,1);assert.deepEqual(events,[]);
  finish(Response.json({ok:true}));await first;await second;
  assert.deepEqual(events,['clear','/login']);
});

test('redirects, rejected sessions, malformed/oversized acknowledgements and transport errors never claim revocation or silently retry', async () => {
  for(const result of [()=>Response.json({error:'private-server-details'},{status:503}),()=>Response.json({ok:true},{status:401}),
    ()=>new Response(null,{status:302,headers:{location:'https://attacker.example.test'}}),()=>Response.json({success:true}),
    ()=>Response.json({ok:true,error:'private-token'}),()=>Response.json({ok:true,padding:'x'.repeat(1100)}),
    ()=>new Response('<html>ok</html>',{headers:{'content-type':'text/html'}}),()=>{throw Error('private-token@example.test');}]) {
    let calls=0,cleared=0,navigated=0;
    await assert.rejects(logoutMember({fetchImpl:async()=>{calls++;return result();},clearCaches:()=>{cleared++;},navigate:()=>{navigated++;}}),
      {message:'No pudimos confirmar el cierre de sesión. Intenta de nuevo.'});
    assert.equal(calls,1);assert.equal(cleared,0);assert.equal(navigated,0);
  }
  let calls=0;
  await logoutMember({fetchImpl:async()=>{calls++;return Response.json({ok:true});},clearCaches:()=>{},navigate:()=>{}});
  assert.equal(calls,1,'a later explicit retry is allowed');
});

test('confirmed logout removes only member presentation keys and leaves admin, saved accounts and preferences alone',()=>{
  const removed=[];
  const browser={localStorage:{removeItem:key=>removed.push(`local:${key}`)},sessionStorage:{removeItem:key=>removed.push(`session:${key}`)}};
  clearMemberBrowserState(browser);
  for(const key of ['user_auth','user_id','user_status','user_data','user_role','onboarding_step','vp_onboarding','vicion_session']) assert.ok(removed.includes(`local:${key}`));
  assert.ok(removed.includes('session:vicion_session'));
  assert.doesNotMatch(removed.join(','),/admin|vp_user_accounts|theme|referral/);
  assert.doesNotThrow(()=>clearMemberBrowserState({get localStorage(){throw Error('storage denied');},get sessionStorage(){throw Error('storage denied');}}));
});

test('the existing sign-out bridge retains exact-origin CSRF checks and validates upstream success before deleting host-only HttpOnly cookies',async()=>{
  const env={AUTH_PROVIDER:'better-auth',NODE_ENV:'production',BETTER_AUTH_BACKEND_URL:'https://auth.example.test',AUTH_PUBLIC_ORIGIN:'https://portal.example.test',AUTH_BFF_SHARED_SECRET:'synthetic-auth-proxy-secret-longer-than-32'};
  const request=(origin=env.AUTH_PUBLIC_ORIGIN)=>new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/logout`,{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.1',cookie:'better-auth.session_token=synthetic; unrelated=private'},body:'{}'});
  let calls=0;
  const dependencies={env,fetchImpl:async(url,options)=>{
    calls++;assert.equal(url,'https://auth.example.test/api/auth/sign-out');assert.equal(options.method,'POST');
    assert.equal(options.headers.origin,env.AUTH_PUBLIC_ORIGIN);assert.equal(options.headers.cookie,'better-auth.session_token=synthetic');
    return Response.json({success:true},{headers:{'set-cookie':'better-auth.session_token=; Max-Age=0; Path=/; Domain=.example.test'}});
  }};
  assert.equal((await proxyBetterAuth(request('https://attacker.example.test'),'sign-out',dependencies)).status,403);assert.equal(calls,0);
  const response=await proxyBetterAuth(request(),'sign-out',dependencies);
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});assert.equal(calls,1);
  const cookie=response.headers.get('set-cookie');assert.match(cookie,/Max-Age=0/);assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Secure/);assert.doesNotMatch(cookie,/Domain=/);
  const invalid=await proxyBetterAuth(request(),'sign-out',{env,fetchImpl:async()=>Response.json({success:false},{headers:{'set-cookie':'better-auth.session_token=; Max-Age=0'}})});
  assert.equal(invalid.status,503);assert.equal(invalid.headers.get('set-cookie'),null);
});

test('the actual shell logout button blocks duplicate clicks and exposes a generic accessible retry when logout is uncertain',async()=>{
  const require=createRequire(import.meta.url),states=[],refs=[];let stateIndex=0,refIndex=0,calls=0,reject;
  const react={...React,useState:initial=>{const i=stateIndex++;if(!(i in states))states[i]=initial;return[states[i],value=>{states[i]=value;}];},
    useRef:initial=>refs[refIndex++]||(refs[refIndex-1]={current:initial}),useId:()=> 'synthetic-logout-error'};
  const source=readFileSync(new URL('../components/panel/LogoutButton.jsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',code)(id=>id==='react'?react:id==='@/lib/member-logout.mjs'?{logoutMember:()=>{calls++;return new Promise((_resolve,fail)=>{reject=fail;});}}
    :id==='@/lib/utils'?{cn:(...values)=>values.filter(Boolean).join(' ')}:require(id),module,module.exports);
  const tree=(props={})=>{stateIndex=refIndex=0;return module.exports.default({children:'Cerrar sesión',className:'vp-sidebar-link',...props});};
  const button=value=>React.Children.toArray(value.props.children).find(child=>child.type==='button');
  let initial=tree();assert.match(renderToStaticMarkup(initial),/<button[^>]*type="button"/);assert.doesNotMatch(renderToStaticMarkup(initial),/<a|href=/);
  button(initial).props.onClick();button(initial).props.onClick();assert.equal(calls,1);
  let html=renderToStaticMarkup(tree());assert.match(html,/disabled=""/);assert.match(html,/aria-busy="true"/);assert.match(html,/role="status"/);
  reject(Error('private-session-token'));await new Promise(resolve=>setImmediate(resolve));
  const failed=tree();html=renderToStaticMarkup(failed);assert.match(html,/role="alert"/);assert.match(html,/aria-describedby="synthetic-logout-error"/);
  assert.match(html,/No pudimos confirmar el cierre de sesión/);assert.doesNotMatch(html,/private-session-token/);assert.equal(button(failed).props.disabled,false);
  const alert=value=>React.Children.toArray(value.props.children).find(child=>child.props?.role==='alert');
  assert.match(alert(failed).props.className,/\bright-0\b.*\btop-full\b/);assert.doesNotMatch(alert(failed).props.className,/bottom-full/);
  const footer=tree({errorPlacement:'above'});
  assert.match(alert(footer).props.className,/\bbottom-full\b.*\bleft-0\b.*\bmax-w-full\b/);
  assert.doesNotMatch(alert(footer).props.className,/top-full|right-0/);
  assert.equal(button(footer).props['aria-describedby'],alert(footer).props.id,'the repositioned error stays associated with the retry button');
  button(failed).props.onClick();assert.equal(calls,2);reject(Error('private'));await new Promise(resolve=>setImmediate(resolve));
});
