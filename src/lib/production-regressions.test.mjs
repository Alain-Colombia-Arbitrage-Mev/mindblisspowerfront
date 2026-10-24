import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import investmentLogic from './InvestmentLogic.js';

function parse(relativePath) {
  const file = new URL(relativePath, import.meta.url);
  return ts.createSourceFile(file.pathname, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
}

function find(source, predicate) {
  let match;
  function visit(node) {
    if (!match && predicate(node)) match = node;
    if (!match) ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(match, 'Expected production contract is missing');
  return match;
}

test('verification glyph depends on an explicitly verified record', () => {
  const source = parse('../legacy-pages/admin/ParticipantsOptimized.jsx');
  const expression = find(source, node => ts.isConditionalExpression(node) &&
    ts.isStringLiteral(node.whenTrue) && node.whenTrue.text === '\u2713' &&
    ts.isStringLiteral(node.whenFalse) && node.whenFalse.text === '\u25cb');
  for (const verified of [true, false, undefined, null, 'false', 1]) {
    const glyph = vm.runInNewContext(expression.getText(source), { p: { verified } });
    assert.equal(glyph, verified === true ? '\u2713' : '\u25cb');
  }
});

test('unconfigured interventions report an error instead of success or mutations', () => {
  const source = parse('../components/admin/WarRoom/WarRoomRightPanel.jsx');
  const declaration = find(source, node => ts.isVariableDeclaration(node) && node.name.getText(source) === 'handleUnsupportedIntervention');
  const panels = [];
  const state = {};
  const callback = vm.runInNewContext(`(${declaration.initializer.getText(source)})`, {
    setPanelType: value => { state.panel = value; },
    setInterventionPanel: value => { state.intervention = value; },
    setActionPanel: value => { panels.push(value); },
  });
  callback();
  assert.equal(state.panel, null);
  assert.equal(state.intervention, false);
  assert.equal(panels.length, 1);
  assert.equal(panels[0].state, 'error');
  assert.match(panels[0].message, /No se aplicaron cambios/);
});

test('legacy intelligence entry uses the implemented view', () => {
  const source = parse('../legacy-pages/admin/AIBrainDashboard.jsx');
  const entry = find(source, node => ts.isExportDeclaration(node));
  assert.equal(entry.moduleSpecifier.text, '@/components/admin/AIBrain');
});

test('investment validation and timestamp arithmetic preserve existing terms', () => {
  assert.equal(investmentLogic.createInvestment('qa-user', 750), null);
  const investment = investmentLogic.createInvestment('qa-user', 500);
  assert.equal(investment.plan, 'Start');
  assert.equal(Date.parse(investment.endDate) - Date.parse(investment.startDate), 30 * 24 * 60 * 60 * 1000);
  const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  assert.deepEqual(investmentLogic.checkInvestmentHealth([
    { status: 'activo', endDate: soon }, { status: 'vencido', endDate: soon },
  ]), { active: 1, expiring: 1, expired: 1 });
});
