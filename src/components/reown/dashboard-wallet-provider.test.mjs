import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ts from 'typescript';
import { personalWalletBalanceSessionKey } from '../../lib/personal-wallet-balance-store.mjs';

const require = createRequire(import.meta.url);
const member = { subject: 'owner-a', email: 'one@example.test' };
const content = React.createElement('main', null, 'dashboard content');
function harness() {
  let pathname = '/dashboard', session = member, state = '', dependency, queued;
  const Provider = ({ children }) => children;
  const code = ts.transpileModule(readFileSync(new URL('./DashboardWalletProvider.jsx',import.meta.url),'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS }
  }).outputText;
  const module = { exports: {} };
  new Function('require','module','exports',code)(id => {
    if(id==='react')return { useState: () => [state,value=>{state=value;}],useEffect: (effect,deps)=>{
      if(!dependency||deps.some((value,index)=>value!==dependency[index])){dependency=deps;queued=effect;}
    } };
    if(id==='react/jsx-runtime')return require(id);
    if(id==='next/navigation')return {usePathname:()=>pathname};
    if(id==='next/dynamic')return {default:()=>Provider};
    if(id==='@/lib/member-session-context')return {useMemberSession:()=>session};
    if(id==='@/lib/personal-wallet-balance-store.mjs')return {personalWalletBalanceSessionKey};
    if(id==='@/i18n/LanguageProvider')return {useI18n:()=>({t:()=> 'Checking wallet'})};
    assert.fail(`An ordinary dashboard must not load a wallet SDK or initiate an operation: ${id}`);
  },module,module.exports);
  return { Provider, render(path=pathname,owner=session,props={}) {
    pathname=path;session=owner;const tree=module.exports.default({children:content,...props});
    if(queued){const effect=queued;queued=null;effect();}return tree;
  } };
}

test('ordinary authenticated dashboards keep AppKit unloaded; wallet routes wait for their owner projection',()=>{
  const h=harness();assert.equal(h.render(),content);
  const unknown=h.render('/dashboard/wallet-personal/pay',null);
  assert.notEqual(unknown,content);assert.notEqual(unknown.type,h.Provider);
  assert.equal(h.render('/dashboard/wallet-personal-foreign',member),content);
  assert.equal(h.render('/dashboard/packages-foreign',member),content);
});

test('a direct legacy payments bookmark still receives the same wallet provider',()=>{
  const h=harness(),page=h.render('/dashboard/packages',member);
  assert.equal(page.type,h.Provider);
  assert.equal(h.render('/dashboard/wallet-personal/pay',member).key,page.key);
});

test('one lazy owner-keyed provider survives wallet, payment, history and summary navigation without remount keys changing',()=>{
  const h=harness(),first=h.render('/dashboard/wallet-personal',member);
  assert.equal(first.type,h.Provider);const key=first.key;
  for(const route of ['/dashboard/wallet-personal/pay','/dashboard/wallet-personal/requests','/dashboard']){
    const next=h.render(route,member);assert.equal(next.type,first.type);assert.equal(next.key,key);
    assert.equal(next.props.children,content);
  }
  const other={subject:'owner-b',email:'two@example.test'};
  assert.equal(h.render('/dashboard',other),content,'A different owner must never inherit the prior activation');
  const changed=h.render('/dashboard/wallet-personal/pay',other);
  assert.equal(changed.type,h.Provider);assert.notEqual(changed.key,key);
  assert.notEqual(h.render('/dashboard/wallet-personal/pay',null).type,h.Provider);
});
