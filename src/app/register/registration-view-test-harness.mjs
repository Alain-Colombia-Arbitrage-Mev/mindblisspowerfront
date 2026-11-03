import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ts from 'typescript';
import * as deadline from '../../lib/browser-request-deadline.mjs';

const require = createRequire(import.meta.url);

// Exercise real JSX event handlers without a browser, network or real messages.
export function registrationViewHarness(filename, mocks) {
  const state = [], refs = [], effects = [], callbacks = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0, callbackIndex = 0;
  const queued = [];
  const hooks = { ...React, useState(initial) {
    const index = stateIndex++;
    if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
    return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
  }, useRef(initial) {
    const index = refIndex++;
    if (!(index in refs)) refs[index] = { current: initial };
    return refs[index];
  }, useCallback(callback, dependencies) {
    const index = callbackIndex++, previous = callbacks[index];
    if (!previous || !dependencies || dependencies.length !== previous.dependencies?.length
      || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
      callbacks[index] = { callback, dependencies };
    }
    return callbacks[index].callback;
  }, useEffect(effect, dependencies) {
    const index = effectIndex++;
    const previous = effects[index];
    if (!previous || dependencies?.some((value, i) => value !== previous.dependencies[i])) queued.push(() => {
      previous?.cleanup?.(); effects[index] = { dependencies, effect, cleanup: effect() };
    });
  } };
  const source = readFileSync(new URL(filename, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react') return hooks;
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === '@/lib/browser-request-deadline.mjs') return deadline;
    if (id === 'react/jsx-runtime') return require(id);
    assert.fail(`Unexpected test dependency: ${id}`);
  }, module, module.exports);
  return { render(props = {}) {
    stateIndex = 0; refIndex = 0; effectIndex = 0; callbackIndex = 0;
    const tree = module.exports.default(props);
    while (queued.length) queued.shift()();
    return tree;
  }, state, replayEffects() {
    // React StrictMode replays mounted effects before user interaction.
    for (const entry of effects) entry?.cleanup?.();
    for (const entry of effects) if (entry) entry.cleanup = entry.effect();
  }, unmount() { for (const effect of effects) effect?.cleanup?.(); } };
}

export function findRegistrationNode(node, predicate) {
  if (predicate(node)) return node;
  return React.Children.toArray(node?.props?.children).map(child => findRegistrationNode(child, predicate)).find(Boolean);
}

export const registrationFieldStub = ({ inputRef, error, helper, label, ...props }) => React.createElement('label', null, label,
  React.createElement('input', props), error || helper);
export const registrationButtonStub = ({ loading, children, ...props }) => React.createElement('button', props, children);
