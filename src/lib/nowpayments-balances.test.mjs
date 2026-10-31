import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as balances from './nowpayments-balances.mjs';
import {validMemberSummary} from './member-read.mjs';

const model = () => ({read_model_status:'operational',withdrawals_enabled:false,
 commissions:{pending_usd:'10.00',available_usd:'5.00',funding_held_usd:'3.00',credited_usd:'20.00',paid_external_usd:'0.00',
  items:[{generated_at:'2026-01-31T15:20:00Z',available_at:'2026-02-28T15:20:00Z',kind:'direct_bonus',status:'pending_maturity',amount_usd:'10.00',credited_usd:'7.00',liquid_credited_usd:'2.00',funding_held_usd:'3.00',cap_excluded_usd:'0.00'}]},
 membership:{principal_locked_usd:'100.00',principal_available_usd:'0.00',roi_locked_usd:'2.00',roi_available_usd:'0.00',
  items:[{principal_usd:'100.00',started_at:'2026-01-01T15:20:00Z',lock_until:'2027-01-01T15:20:00Z',eligibility:'locked',roi_locked_usd:'2.00',roi_available_usd:'0.00'}]}});

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/panel/NOWPaymentsBalances.jsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{}};
new Function('require','module','exports',code)(id=>id==='@/lib/nowpayments-balances.mjs'?balances:require(id),module,module.exports);
const View=module.exports.default;
const render=data=>renderToStaticMarkup(React.createElement(View,{data}));

test('NOW read model displays independent backend totals without combining principal, ROI, credits or historical funds',()=>{
 const data=model(),before=JSON.stringify(data);
 assert.equal(balances.nowpaymentsBalanceView(data).status,'operational');
 const html=render(data);
 for(const text of ['Comisiones pendientes de liberación','Comisiones vencidas disponibles (contables)','Comisiones retenidas por financiación',
  'Acreditadas internamente, no pagadas al banco','Retiros externos NOW registrados','Capital de membresías bloqueado','Capital vencido, elegible para solicitud','ROI de CD bloqueado']) assert.ok(html.includes(text),text);
 assert.match(html,/un mes calendario desde su generación, no a los 30 días/);
 assert.match(html,/retiros externos de NOWPayments siguen deshabilitados/);
 assert.match(html,/crédito interno no es un pago recibido/);
 assert.match(html,/Crédito líquido/); assert.match(html,/liberada sólo parcialmente/);
 assert.match(html,/\$2\.00 USD/);
 assert.match(html,/365 días.*elegible para solicitud/s);
 assert.match(html,/sin perjuicio de los derechos aplicables/);
 assert.doesNotMatch(html,/<button|<form|pago automático garantizado|\$150\.00/);
 assert.equal(JSON.stringify(data),before);
});

test('malformed or unavailable NOW details cannot hide a valid historical summary or invent zero balances',()=>{
 const legacy={active_packages:0,payments:[],wallet_balance_usd:'5.00',available_for_withdrawal_usd:'2.00',commission_available_usd:'2.00',commission_maturing_usd:'3.00'};
 for(const value of [undefined,null,{}, {read_model_status:'unavailable',withdrawals_enabled:false,commissions:null,membership:null},
  {...model(),withdrawals_enabled:true}, {...model(),commissions:{...model().commissions,pending_usd:null}},
  {...model(),membership:{...model().membership,principal_locked_usd:'NaN'}}]) {
  assert.equal(balances.nowpaymentsBalanceView(value).status,'unavailable');
  assert.equal(validMemberSummary({...legacy,nowpayments:value}),true);
  const html=render(value);
  assert.match(html,/No pudimos consultar el detalle operativo/);
  assert.match(html,/datos históricos se conservan por separado/);
  assert.doesNotMatch(html,/\$0|\bNaN\b|<table|Capital vencido, elegible/);
 }
});

test('dates and eligibility are supplied by the backend, not advanced by a browser timer or 30-day arithmetic',()=>{
 const html=render(model());
 assert.ok(html.includes(balances.nowpaymentsDate(model().commissions.items[0].generated_at)));
 assert.ok(html.includes(balances.nowpaymentsDate(model().commissions.items[0].available_at)));
 assert.match(html,/Pendiente de vencimiento/);
 assert.match(html,/Capital bloqueado/);
 assert.doesNotMatch(source,/Date\.now|setMonth|setDate|setInterval|\bfetch\s*\(/);
 const helper=readFileSync(new URL('./nowpayments-balances.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(helper,/Date\.now|setMonth|setDate|30\s*\*\s*24/);
});

test('unknown statuses and private fields are not reflected or promoted to available money',()=>{
 const data=model();data.commissions.items[0].status='<script>secret@example.test</script>';
 data.membership.items[0].eligibility='constructor';data.private_token='must-not-leak';
 const html=render(data);
 assert.match(html,/En revisión/);assert.match(html,/Elegibilidad en revisión/);
 assert.doesNotMatch(html,/<script|secret@example|must-not-leak|function Object/);
 for(const status of ['constructor','__proto__',null,{}]) {
  assert.equal(balances.nowpaymentsCommissionStatus(status),'En revisión');
  assert.equal(balances.nowpaymentsMembershipStatus(status),'Elegibilidad en revisión');
 }
});

test('money formatting preserves exact decimal strings and unknown amounts never become zero',()=>{
 assert.equal(balances.nowpaymentsMoney('9007199254740993.01'),'$9,007,199,254,740,993.01 USD');
 assert.equal(balances.nowpaymentsMoney('0.0050'),'$0.005 USD');
 assert.equal(balances.nowpaymentsMoney('0'),'$0.00 USD');
 for(const value of [null,undefined,'','1e6','-1.00',' 1.00 ',false,Infinity,1.01]) assert.equal(balances.nowpaymentsMoney(value),'No disponible');
});

test('all requested portal surfaces consume only the nested NOW read model and checkout has a notice, not fabricated consent',()=>{
 for(const path of ['../components/panel/overview/OverviewDashboard.jsx','../app/dashboard/packages/MyPaymentsPanel.jsx','../app/dashboard/_components/executive-pages/FinanceDashboardPage.jsx']) {
  const page=readFileSync(new URL(path,import.meta.url),'utf8');assert.match(page,/NOWPaymentsBalances data=\{(?:summary\?|d|data)\.nowpayments\}/);
 }
 const page=readFileSync(new URL('../app/dashboard/packages/page.jsx',import.meta.url),'utf8');
 assert.match(page,/un mes calendario desde su generación, no 30 días/);
 assert.match(page,/capital de la membresía y el ROI del CD permanecen bloqueados durante 365 días/);
 assert.match(page,/Sin reembolso anticipado ordinario, sin perjuicio de los derechos aplicables/);
 assert.ok(page.indexOf('Sin reembolso anticipado ordinario')<page.indexOf('<ActivatePackageButton'));
 const button=readFileSync(new URL('../app/dashboard/packages/ActivatePackageButton.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(button,/accepts_membership|policy_version|termsAccepted|type="checkbox"/);
});
