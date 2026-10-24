import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

if (!process.argv.includes("--fixtures")) throw new Error("Requires --fixtures; no real services or credentials are used");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const build = await Bun.build({ entrypoints: [join(root, "scripts/ui-preview/member-data.jsx")], target: "browser", jsx: { runtime: "automatic" },
  define: { "process.env.NODE_ENV": '"production"' }, plugins: [{ name: "member-fixture", setup(builder) {
    builder.onResolve({ filter: /^next\/(link|navigation)$/ }, () => ({ path: join(root, "scripts/ui-preview/next-stubs.jsx") }));
    builder.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, ({ path }) => ({ path: require.resolve(path) }));
    builder.onResolve({ filter: /^@\// }, ({ path, importer }) => ({ path: Bun.resolveSync(join(root, "src", path.slice(2)), dirname(importer)) }));
    builder.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "css" }));
  } }] });
if (!build.success) throw new Error(build.logs.join("\n"));
const bundle = build.outputs.find(file => file.path.endsWith(".js"));
const css = [];
for (const file of await readdir(join(root, ".next/static/chunks"), { recursive: true })) if (file.endsWith(".css")) css.push(await readFile(join(root, ".next/static/chunks", file), "utf8"));
css.push(await readFile(join(root, "src/components/panel/panel-shell.css"), "utf8"));
const me = { affiliateId: "101", name: "Cuenta de prueba", parentId: null, sponsorId: null, side: null, depth: 0, status: "active", activePackage: true, hasChildren: true, childrenComplete: true, rankProgress: null };
const nodes = [
  { id: "102", parentId: "101", side: "L", rootSide: "L", level: 1, name: "Not Available", status: "unavailable", unavailable: true, hasChildren: true, childrenComplete: true },
  { id: "103", parentId: "101", side: "R", rootSide: "R", level: 1, name: "Miembro derecho de prueba", status: "active", activePackage: true, hasChildren: false, childrenComplete: true },
  { id: "104", parentId: "102", side: "R", rootSide: "L", level: 2, name: "Descendiente conservado", status: "active", activePackage: true, hasChildren: false, childrenComplete: true },
];
const summary = { wallet_balance_usd: "0", available_for_withdrawal_usd: "0", commission_available_usd: "0", commission_maturing_usd: "0", active_packages: 1, payments: [] };
const referral = { positioned: true, code: "MP101", link: "https://example.test/register?ref=MP101&side=L", links: { left: "https://example.test/register?ref=MP101&side=L", right: "https://example.test/register?ref=MP101&side=R" } };
const server = Bun.serve({ hostname: "127.0.0.1", port: Number(process.env.UI_PREVIEW_PORT || 0), async fetch(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method !== "GET") return Response.json({ error: "read_only_fixture" }, { status: 403 });
  if (path.startsWith("/api/")) {
    if (path === "/api/auth/session") return Response.json({ name: me.name, email: "member@example.test" });
    const state = new URL(request.headers.get("referer") || request.url).searchParams.get("state");
    if (state === "error") return Response.json({ error: "fixture-unavailable" }, { status: 503 });
    if (state === "unauthorized") return Response.json({ error: "session-invalid" }, { status: 401 });
    if (state === "forbidden") return Response.json({ error: "account_suspended" }, { status: 403 });
    if (state === "malformed") return Response.json({});
    if (path === "/api/payments/me") {
      if (state === "payments-error") return Response.json({ error: "private-fixture-diagnostic" }, { status: 503 });
      if (state === "payments-unauthorized") return Response.json({ error: "session-invalid" }, { status: 401 });
      if (state === "slow-payments") await Bun.sleep(8000);
      if (state === "hung-payments") await Bun.sleep(20000);
      return Response.json(state === "unpositioned" ? { ...summary, active_packages: 0 } : summary);
    }
    if (path === "/api/member/referral") {
      if (state === "referral-error") return Response.json({ error: "fixture-unavailable" }, { status: 503 });
      return Response.json(state === "unpositioned" ? { positioned: false } : referral);
    }
    if (path === "/api/member/tree") {
      if (state === "unpositioned") return Response.json({ positioned: false });
      const visible = state === "partial" ? nodes.filter(node => node.id !== "103") : nodes;
      return Response.json({ positioned: true, me: { ...me, childrenComplete: state !== "partial" }, tree: visible, meta: { depth: 4, returned: visible.length, limit: 64, truncated: state === "partial" } });
    }
    return Response.json({ error: "fixture-not-implemented" }, { status: 404 });
  }
  if (path === "/fixture.js") return new Response(bundle, { headers: { "content-type": "text/javascript" } });
  if (path === "/styles.css") return new Response(css.join("\n"), { headers: { "content-type": "text/css" } });
  if (path.startsWith("/mindbliss/")) {
    const publicRoot = join(root, "public");
    const target = resolve(publicRoot, `.${path}`);
    if (!target.startsWith(publicRoot + sep)) return new Response(null, { status: 403 });
    const file = Bun.file(target);
    return await file.exists() ? new Response(file) : new Response(null, { status: 404 });
  }
  return new Response('<!doctype html><html lang="es" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mindbliss - cliente QA sintetico</title><link rel="stylesheet" href="/styles.css"></head><body style="margin:0"><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>', { headers: { "content-type": "text/html; charset=utf-8" } });
} });
console.log(`Synthetic member preview: http://127.0.0.1:${server.port}/dashboard/network`);
