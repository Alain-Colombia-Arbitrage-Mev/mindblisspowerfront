import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { referralLinkCode } from '../lib/referral-links.mjs';
import { registrationUrl } from './register/registration-model.mjs';

function home() {
  const source = readFileSync(new URL('./page.jsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const mocks = {
    'next/navigation': { redirect(destination) { throw Object.assign(new Error('synthetic_redirect'), { destination }); } },
    '@/lib/referral-links.mjs': { referralLinkCode },
    './register/registration-model.mjs': { registrationUrl },
  };
  new Function('require','module','exports',compiled)(name => {
    assert.ok(Object.hasOwn(mocks,name), `unexpected homepage dependency ${name}`);
    return mocks[name];
  },module,module.exports);
  assert.equal(module.exports.dynamic, 'force-dynamic', 'a cached root redirect must not erase or share referral hints');
  return async params => {
    let result;
    try { await module.exports.default(params === undefined ? undefined : { searchParams: Promise.resolve(params) }); }
    catch (error) { if (error.message !== 'synthetic_redirect') throw error; result = error.destination; }
    assert.equal(typeof result,'string');
    return result;
  };
}

test('the actual root page sends legacy referral URLs to registration with the same opaque code and binary branch', async t => {
  t.mock.method(globalThis,'fetch',()=>assert.fail('entry redirects must not query accounts or send messages'));
  const destination = home();
  for (const side of ['L','R']) assert.equal(await destination({ref:'Diamond1',side}), `/register?ref=Diamond1&side=${side}`);
  assert.equal(await destination({ref:' @Diamond1 ',side:'r'}), '/register?ref=%40Diamond1&side=R');
  assert.equal(await destination({ref:'A&B#?+',side:'L'}), '/register?ref=A%26B%23%3F%2B&side=L');
  assert.equal(await destination({ref:'MP50793'}), '/register?ref=MP50793');
});

test('root referral navigation copies no recipient, session, role, payment or external redirect authority', async () => {
  const destination = await home()({ref:'SponsorA',side:'R',email:'private@example.test',subject:'other',role:'super_admin',
    next:'https://evil.example.test',redirect:'//evil.example.test',emailVerified:'true',plan:'100',otp:'000000'});
  assert.equal(destination,'/register?ref=SponsorA&side=R');
  const encoded = await home()({ref:'https://evil.example.test?role=admin',side:'R'});
  const parsed = new URL(encoded,'https://mindblisspower.com');
  assert.equal(parsed.origin,'https://mindblisspower.com'); assert.equal(parsed.pathname,'/register');
  assert.deepEqual([...parsed.searchParams],[['ref','https://evil.example.test?role=admin'],['side','R']]);
});

test('ordinary home visits retain their existing dashboard destination and invalid or duplicate-shaped hints cannot select a sponsor', async () => {
  const destination = home();
  for (const input of [undefined,{},null,{side:'R'},{ref:''},{ref:'bad code'},{ref:'x'.repeat(65)},
    {ref:['SponsorA','SponsorB'],side:'R'},{ref:{code:'SponsorA'}},{ref:'bad\u0000code'}]) {
    assert.equal(await destination(input),'/dashboard');
  }
  for (const side of ['ROOT',true,['L','R'],{}]) {
    assert.equal(await destination({ref:'SponsorA',side}),'/register?ref=SponsorA');
  }
});
