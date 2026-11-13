import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

import { registrationViewHarness, findRegistrationNode as find } from '../../../register/registration-view-test-harness.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';
import * as tutorial from '../../../../lib/wallet-funding-tutorial.mjs';

const componentPath = '../dashboard/_components/executive-pages/';
const icons = new Proxy({}, { get: () => () => null });
const styles = { default: new Proxy({}, { get: (_target, key) => key }) };
const i18n = { useI18n: () => ({ locale: 'es', t: (key, values) => translateMessage('es', key, values) }) };
const primitive = name => Object.defineProperty(({ children }) => children, 'name', { value: name });
const dialog = Object.fromEntries(['Root', 'Portal', 'Overlay', 'Content', 'Title', 'Description', 'Close'].map(name => [name, primitive(name)]));
function WalletTutorialVideo() { return null; }
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => all(child, predicate))];
const players = tree => all(tree, node => node?.type === WalletTutorialVideo);
const dialogRoot = tree => find(tree, node => node?.type === dialog.Root);
const manualOpen = tree => find(tree, node => node?.type === 'button' && node.props.className === 'openButton').props.onClick();
const browserFixtures = new WeakMap();

function browserStorage() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

function browser(t, storage, visibilityState = 'visible') {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const document = new EventTarget(), listeners = new Set(), cleanups = [];
  document.visibilityState = visibilityState;
  document.addEventListener = (name, listener, options) => {
    if (name === 'visibilitychange') listeners.add(listener);
    EventTarget.prototype.addEventListener.call(document, name, listener, options);
  };
  document.removeEventListener = (name, listener, options) => {
    if (name === 'visibilitychange') listeners.delete(listener);
    EventTarget.prototype.removeEventListener.call(document, name, listener, options);
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { get localStorage() { return typeof storage === 'function' ? storage() : storage; } } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
  const fixture = { document, listeners, cleanups };
  browserFixtures.set(t, fixture);
  t.after(() => {
    for (const cleanup of cleanups) cleanup();
    if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window;
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument); else delete globalThis.document;
  });
  t.mock.method(globalThis, 'fetch', () => assert.fail('Tutorial interactions cannot make auth, pricing, or payment requests'));
  return fixture;
}

function registerHarness(t, harness) {
  const unmount = harness.unmount;
  let mounted = true;
  harness.unmount = () => { if (mounted) { mounted = false; unmount(); } };
  browserFixtures.get(t).cleanups.push(harness.unmount);
  return harness;
}

function tutorialHarness(t) {
  // The harness rejects every unlisted dependency, including Reown and auth hooks.
  const harness = registrationViewHarness(`${componentPath}WalletFundingTutorial.jsx`, {
    'lucide-react': icons, '@radix-ui/react-dialog': dialog, '@/i18n/LanguageProvider': i18n,
    '@/lib/wallet-funding-tutorial.mjs': tutorial, './WalletTutorialVideo': { default: WalletTutorialVideo },
    './wallet-funding-tutorial.module.css': styles,
  });
  return registerHarness(t, harness);
}

function mediaHarness(t, props = {}) {
  const harness = registrationViewHarness(`${componentPath}WalletTutorialVideo.jsx`, {
    'lucide-react': icons, '@/i18n/LanguageProvider': i18n, '@/lib/wallet-funding-tutorial.mjs': tutorial,
    './wallet-funding-tutorial.module.css': styles,
  });
  const media = { paused: true, pauses: 0, plays: 0, loads: 0,
    pause() { this.pauses++; this.paused = true; },
    play() { this.plays++; this.paused = false; return Promise.resolve(); },
    load() { this.loads++; },
  };
  let tree = harness.render(props);
  find(tree, node => node?.type === 'video').ref.current = media;
  // Attach an inert native-media ref before replaying effects as StrictMode does.
  harness.replayEffects();
  return { ...registerHarness(t, harness), media, tree };
}

test('the first valid owner automatically opens once and only the open popup may autoplay', t => {
  const storage = browserStorage(); browser(t, storage);
  const harness = tutorialHarness(t), props = { ownerId: 'tutorial-view-first-owner' };
  let tree = harness.render(props);
  assert.equal(dialogRoot(tree).props.open, false, 'The popup starts after the client effect');
  assert.equal(players(tree).length, 1);
  assert.ok(!players(tree)[0].props.autoplay);
  tree = harness.render(props);
  assert.equal(dialogRoot(tree).props.open, true);
  assert.equal(players(tree).length, 2);
  assert.equal(players(tree)[0].props.paused, true);
  assert.ok(!players(tree)[0].props.autoplay, 'The card never receives an autoplay instruction');
  assert.equal(players(tree)[1].props.autoplay, true);
  assert.equal(all(tree, node => node?.type === dialog.Content).length, 1);
  assert.deepEqual([...storage.values.values()], ['seen']);
  harness.replayEffects();
  tree = harness.render(props);
  assert.equal(players(tree).length, 2, 'Effect replay cannot mount another popup');

  dialogRoot(tree).props.onOpenChange(false);
  tree = harness.render(props);
  assert.equal(dialogRoot(tree).props.open, false);
  assert.equal(players(tree).length, 1, 'Closing unmounts the autoplay player');
  assert.equal(find(tree, node => node?.type === dialog.Portal), undefined);
  assert.ok(!players(tree)[0].props.autoplay);
  harness.replayEffects();
  assert.equal(dialogRoot(harness.render(props)).props.open, false, 'StrictMode replay does not reopen a dismissed tutorial');

  harness.unmount();
  const remounted = tutorialHarness(t);
  remounted.render(props);
  assert.equal(dialogRoot(remounted.render(props)).props.open, false, 'The preference survives remounting');
});

test('a returning owner can reopen and close the tutorial manually without wallet or payment dependencies', t => {
  const storage = browserStorage(); browser(t, storage);
  const ownerId = 'tutorial-view-returning-owner';
  assert.equal(tutorial.claimWalletTutorial(ownerId, storage), true);
  const harness = tutorialHarness(t), props = { ownerId };
  harness.render(props); let tree = harness.render(props);
  assert.equal(dialogRoot(tree).props.open, false);
  manualOpen(tree); tree = harness.render(props);
  assert.equal(dialogRoot(tree).props.open, true);
  assert.equal(players(tree)[1].props.autoplay, true);
  assert.equal(all(tree, node => node?.type === dialog.Close).length, 2, 'Both explicit close controls remain available');
  assert.ok(find(tree, node => node?.type === 'button' && node.props['aria-label'] === translateMessage('es', 'walletTutorial.close')));
  dialogRoot(tree).props.onOpenChange(false); tree = harness.render(props);
  assert.equal(players(tree).length, 1);
  manualOpen(tree);
  assert.equal(dialogRoot(harness.render(props)).props.open, true, 'Manual playback remains available after another dismissal');
});

test('blocked browser storage still limits auto-open to once per owner in this document', t => {
  browser(t, () => { throw new Error('Synthetic blocked preferences'); });
  const props = { ownerId: 'tutorial-view-blocked-storage-owner' }, first = tutorialHarness(t);
  first.render(props);
  let tree = first.render(props);
  assert.equal(dialogRoot(tree).props.open, true);
  dialogRoot(tree).props.onOpenChange(false); first.render(props); first.unmount();
  const second = tutorialHarness(t);
  second.render(props); tree = second.render(props);
  assert.equal(dialogRoot(tree).props.open, false);
  manualOpen(tree);
  assert.equal(dialogRoot(second.render(props)).props.open, true);
  const nextOwner = tutorialHarness(t), nextProps = { ownerId: 'tutorial-view-blocked-storage-other-owner' };
  nextOwner.render(nextProps);
  assert.equal(dialogRoot(nextOwner.render(nextProps)).props.open, true, 'A different owner keeps an independent preference');
});

test('an unknown owner has a manual card and never automatically opens a popup', t => {
  const storage = browserStorage(); browser(t, storage);
  for (const ownerId of [undefined, '', '   ', null]) {
    const harness = tutorialHarness(t), props = { ownerId };
    harness.render(props); harness.replayEffects();
    const tree = harness.render(props);
    assert.equal(dialogRoot(tree).props.open, false);
    assert.equal(players(tree).length, 1);
    assert.ok(!players(tree)[0].props.autoplay);
    harness.unmount();
  }
  assert.equal(storage.values.size, 0);
});

test('a hidden tab defers the claim and popup until visible and removes its visibility listener on unmount', t => {
  const storage = browserStorage(), { document, listeners } = browser(t, storage, 'hidden');
  const harness = tutorialHarness(t), props = { ownerId: 'tutorial-view-hidden-owner' };
  harness.render(props); let tree = harness.render(props);
  assert.equal(dialogRoot(tree).props.open, false);
  assert.equal(players(tree).length, 1);
  assert.equal(storage.values.size, 0, 'A hidden mount cannot consume the first-view preference');
  assert.equal(listeners.size, 1);
  harness.replayEffects();
  assert.equal(listeners.size, 1, 'Effect replay replaces its listener');
  document.visibilityState = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
  tree = harness.render(props);
  assert.equal(dialogRoot(tree).props.open, true);
  assert.deepEqual([...storage.values.values()], ['seen']);
  dialogRoot(tree).props.onOpenChange(false); tree = harness.render(props);
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(dialogRoot(harness.render(props)).props.open, false, 'Returning to a tab cannot reopen a dismissed popup');
  harness.unmount();
  assert.equal(listeners.size, 0);

  document.visibilityState = 'hidden';
  const abandoned = tutorialHarness(t), abandonedProps = { ownerId: 'tutorial-view-abandoned-hidden-owner' };
  abandoned.render(abandonedProps); abandoned.unmount();
  assert.equal(listeners.size, 0);
  document.visibilityState = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(storage.values.size, 1, 'An abandoned hidden page cannot claim its owner after cleanup');
  assert.equal(dialogRoot(abandoned.render(abandonedProps)).props.open, false);
});

test('native card media waits for Play and never resumes itself after the popup closes', t => {
  browser(t, browserStorage());
  const harness = mediaHarness(t), { media } = harness;
  const video = find(harness.tree, node => node?.type === 'video');
  assert.equal(video.props.src, tutorial.WALLET_TUTORIAL_VIDEO_URL);
  assert.equal(video.props.poster, tutorial.WALLET_TUTORIAL_POSTER);
  assert.equal(video.props.controls, true);
  assert.equal(video.props.playsInline, true);
  assert.equal(video.props.autoPlay, false);
  assert.equal(video.props.muted, false);
  assert.equal(video.props.preload, 'none');
  assert.equal(media.plays, 0);
  media.paused = false; // A user started this card through its native controls.
  harness.render({ paused: true });
  assert.equal(media.paused, true);
  assert.equal(media.pauses, 1);
  harness.render({ paused: false });
  assert.equal(media.paused, true, 'Closing the popup does not resume a card the popup paused');
  assert.equal(media.plays, 0);
  harness.unmount();
  assert.equal(media.pauses, 2, 'Removing a player always pauses its captured native element');
});

test('native popup media enables muted inline autoplay and stops when unmounted', t => {
  browser(t, browserStorage());
  const harness = mediaHarness(t, { autoplay: true }), { media } = harness;
  const video = find(harness.tree, node => node?.type === 'video');
  assert.equal(video.props.autoPlay, true);
  assert.equal(video.props.muted, true);
  assert.equal(video.props.playsInline, true);
  assert.equal(video.props.controls, true);
  assert.equal(video.props.preload, 'auto');
  media.paused = false;
  harness.unmount();
  assert.equal(media.paused, true);
  assert.equal(media.pauses, 1);
});

test('a card media failure exposes a safe local retry that reloads only video without starting playback', t => {
  browser(t, browserStorage());
  const harness = mediaHarness(t), { media } = harness;
  find(harness.tree, node => node?.type === 'video').props.onError();
  let tree = harness.render();
  const failure = find(tree, node => node?.props?.role === 'status');
  assert.ok(failure);
  const fallback = find(failure, node => node?.type === 'a');
  assert.equal(fallback.props.href, tutorial.WALLET_TUTORIAL_VIDEO_URL);
  assert.equal(fallback.props.target, '_blank');
  assert.equal(fallback.props.rel, 'noopener noreferrer');
  find(failure, node => node?.type === 'button').props.onClick();
  tree = harness.render();
  assert.equal(find(tree, node => node?.props?.role === 'status'), undefined);
  assert.equal(media.loads, 1);
  assert.equal(media.plays, 0);
});

test('popup video retry tolerates denied playback and a media error cannot control the parent dialog', async t => {
  browser(t, browserStorage());
  const parent = tutorialHarness(t), props = { ownerId: 'tutorial-view-media-error-owner' };
  parent.render(props); let tree = parent.render(props);
  const harness = mediaHarness(t, { autoplay: true });
  harness.media.play = function () { this.plays++; return Promise.reject(new Error('Synthetic browser autoplay denial')); };
  find(harness.tree, node => node?.type === 'video').props.onError();
  const failure = find(harness.render({ autoplay: true }), node => node?.props?.role === 'status');
  assert.equal(dialogRoot(tree).props.open, true);
  find(failure, node => node?.type === 'button').props.onClick();
  await Promise.resolve();
  assert.equal(harness.media.loads, 1);
  assert.equal(harness.media.plays, 1);
  assert.equal(find(harness.render({ autoplay: true }), node => node?.props?.role === 'status'), undefined);
  dialogRoot(tree).props.onOpenChange(false); tree = parent.render(props);
  assert.equal(dialogRoot(tree).props.open, false);
  assert.equal(players(tree).length, 1, 'Media recovery cannot interfere with dismissing the popup');
});
