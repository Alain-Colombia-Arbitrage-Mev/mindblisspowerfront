import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the dashboard uses one centered responsive content rail', () => {
  const shell = read('../../app/dashboard/_components/DashboardShell.jsx');
  const css = read('./panel-shell.css');

  assert.match(shell, /className="vp-dashboard-content"/);
  assert.match(shell, /className="vp-dashboard-notice/);
  assert.match(css, /\.vp-dashboard-content\s*\{[^}]*max-width:\s*1440px;[^}]*margin-inline:\s*auto;/s);
  assert.match(css, /\.vp-dashboard-notice\s*\{[^}]*margin:\s*0 20px 16px;/s);
  assert.match(css, /@media \(min-width: 640px\)[\s\S]*?\.vp-dashboard-notice\s*\{[^}]*margin-inline:\s*28px;/);
});
