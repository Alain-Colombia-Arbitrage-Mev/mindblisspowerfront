import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the dashboard support launcher is an accessible controlled popup with working fallbacks', () => {
  const widget = source('./SupportWidget.jsx');
  const messages = source('../../i18n/messages.js');
  const shell = source('../../app/dashboard/_components/DashboardShell.jsx');
  assert.match(shell, /<SupportWidget\s*\/>/);
  assert.match(widget, /<Popover\.Root open=\{open\} onOpenChange=\{setOpen\}>/);
  assert.match(widget, /<Popover\.Trigger asChild>/);
  assert.match(widget, /<Popover\.Content[\s\S]*side="top"[\s\S]*align="end"/);
  assert.match(widget, /window\.\$chatwoot\?\.toggle/);
  assert.match(widget, /href="\/dashboard\/support"/);
  assert.match(widget, /mailto:\$\{supportEmail\}/);
  for (const key of ['support.chat', 'support.whatsapp', 'support.email', 'support.tickets']) assert.ok(widget.includes(`t("${key}")`));
  for (const label of ['Chat en la plataforma', 'WhatsApp', 'Correo electrónico', 'Mis solicitudes']) assert.match(messages, new RegExp(label));
});

test('Chatwoot loads with the member support widget without drawing a duplicate launcher', () => {
  const widget = source('./SupportWidget.jsx');
  const chatwoot = source('../../app/_components/ChatwootWidget.jsx');
  assert.match(widget, /<ChatwootWidget\s*\/>/);
  assert.match(chatwoot, /hideMessageBubble:\s*true/);
  assert.match(chatwoot, /__mindblissChatwootLoaded/);
});
