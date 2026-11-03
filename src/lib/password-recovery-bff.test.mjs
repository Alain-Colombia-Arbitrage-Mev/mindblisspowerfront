import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { proxyBetterAuth } from './better-auth-bridge.mjs';
const env = { AUTH_PROVIDER:'better-auth',NODE_ENV:'production',BETTER_AUTH_BACKEND_URL:'https://auth.example.test',
  AUTH_PUBLIC_ORIGIN:'https://portal.example.test',AUTH_BFF_SHARED_SECRET:'synthetic-recovery-bff-secret-longer-than-32' };
const send='email-otp/request-password-reset',reset='email-otp/reset-password';
const body={email:' Member@Example.test ',otp:'123456',password:' Synthetic-long-password '};
function request(path,value=body,headers={},query='') {
  return new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/${path}${query}`,{method:'POST',headers:{origin:env.AUTH_PUBLIC_ORIGIN,
    'content-type':'application/json','cf-connecting-ip':'192.0.2.10',cookie:'better-auth.session_token=must-not-forward',...headers},body:JSON.stringify(value)});
}
test('password recovery forwards only normalized email and exact credential proof, with signed empty-cookie context and no tokens or session installation',async()=>{
  for(const path of [send,reset]) {
    let calls=0;
    const response=await proxyBetterAuth(request(path,{...body,newEmail:'attacker@example.test',userId:'another',type:'sign-in',role:'admin',redirectTo:'https://evil.test'}),path,{env,fetchImpl:async(url,options)=>{
      calls++;assert.equal(url,`${env.BETTER_AUTH_BACKEND_URL}/api/auth/${path}`);
      const expected=path===send?{email:'member@example.test'}:{email:'member@example.test',otp:body.otp,password:body.password};
      assert.deepEqual(JSON.parse(options.body),expected);assert.equal(options.headers.cookie,'');assert.equal(options.redirect,'manual');assert.equal(options.cache,'no-store');
      const hash=value=>createHash('sha256').update(value).digest('hex');
      assert.equal(options.headers['x-vp-auth-signature'],createHmac('sha256',env.AUTH_BFF_SHARED_SECRET).update(['POST',`/api/auth/${path}`,options.headers['x-vp-auth-timestamp'],'192.0.2.10',hash(''),hash(options.body)].join('\n')).digest('hex'));
      return Response.json({success:true},{headers:{'set-cookie':'better-auth.session_token=must-not-install; HttpOnly','set-auth-jwt':'must-not-expose',location:'https://evil.test'}});
    }});
    assert.equal(calls,1);assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
    for(const header of ['set-cookie','set-auth-jwt','location']) assert.equal(response.headers.get(header),null);
    assert.equal(response.headers.get('cache-control'),'private, no-store');
  }
});
test('recovery rejects unsafe origin, MIME, query, encoding and invalid email/OTP/password before any private request',async()=>{
  const forbidden=()=>assert.fail('invalid recovery touched private auth');
  for(const headers of [{origin:'https://evil.test'},{'content-type':'text/plain'},{'content-encoding':'gzip'}]) assert.ok((await proxyBetterAuth(request(reset,body,headers),reset,{env,fetchImpl:forbidden})).status>=400);
  assert.equal((await proxyBetterAuth(request(reset,body,{},'?email=another@example.test'),reset,{env,fetchImpl:forbidden})).status,400);
  for(const change of [{email:''},{email:'not-an-email'},{email:'a'.repeat(255)+'@example.test'},{otp:123456},{otp:'１２３４５６'},{otp:'12345'},{password:'short'},{password:'x'.repeat(129)},{password:12}]) {
    const response=await proxyBetterAuth(request(reset,{...body,...change}),reset,{env,fetchImpl:forbidden});assert.equal(response.status,400);assert.equal(response.headers.get('cache-control'),'private, no-store');
  }
});
test('malformed successes and transient/reset errors never confirm a password change, install cookies or automatically retry',async()=>{
  for(const value of [{},{success:false},{success:true,token:'secret'},{success:true,user:{emailVerified:true}},{ok:true}]) {
    let calls=0;const response=await proxyBetterAuth(request(reset),reset,{env,fetchImpl:async()=>{calls++;return Response.json(value);}});
    assert.equal(calls,1);assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'authentication_unavailable'});
  }
  for(const status of [201,202]) {
    const response=await proxyBetterAuth(request(reset),reset,{env,fetchImpl:async()=>Response.json({success:true},{status})});
    assert.equal(response.status,503,'accepted/created is not proof of a completed password reset');
  }
  for(const code of ['USER_NOT_FOUND','ACCOUNT_NOT_FOUND','REGISTRATION_REQUIRED','private_diagnostic']) {
    const response=await proxyBetterAuth(request(reset),reset,{env,fetchImpl:async()=>Response.json({code,email:'must-not-reflect',password:'secret'},{status:400})});
    assert.deepEqual(await response.json(),{error:'authentication_failed',code:'PASSWORD_RECOVERY_FAILED'});
  }
  let calls=0;const failed=await proxyBetterAuth(request(send),send,{env,fetchImpl:async()=>{calls++;throw Error('private-diagnostic');}});
  assert.equal(calls,1);assert.equal(failed.status,503);assert.equal(failed.headers.get('set-cookie'),null);
});
test('only reviewed reset errors and bounded Retry-After pass through without exposing account state',async()=>{
  const response=await proxyBetterAuth(request(reset),reset,{env,fetchImpl:async()=>Response.json({code:'TOO_MANY_ATTEMPTS',message:'private'},{status:429,headers:{'retry-after':'420','set-cookie':'better-auth.session_token=secret'}})});
  assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'420');assert.deepEqual(await response.json(),{error:'authentication_failed',code:'TOO_MANY_ATTEMPTS'});assert.equal(response.headers.get('set-cookie'),null);
});
