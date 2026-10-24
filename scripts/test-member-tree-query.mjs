import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import ts from "typescript";
import { childCoverage, loadedChildCounts } from "../src/lib/tree-read-model.mjs";

if (!process.argv.includes("--qa-docker")) throw new Error("Use --qa-docker; this test only targets mindbliss-qa-postgres-1/mindbliss_qa.");
const source = ts.createSourceFile("route.js", readFileSync(new URL("../src/app/api/member/tree/route.js", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
const rootEmail = "tree-read-root@example.invalid";
const affiliateFor = email => `(SELECT a.id FROM mlm.affiliate a JOIN mlm.person p ON p.id = a.person_id WHERE p.email = '${email}')`;
const rootId = affiliateFor(rootEmail);
const bindings = { email: `'${rootEmail}'`, "root.id": rootId, depthLimit: "1", queryLimit: "1" };
const inspected = spawnSync("docker", ["inspect", "mindbliss-qa-postgres-1"], { encoding: "utf8", timeout: 10_000 });
assert.equal(inspected.status, 0);
const target = JSON.parse(inspected.stdout)[0];
assert.equal(target.Config.Labels["com.docker.compose.project"], "mindbliss-qa");
assert.ok(target.Config.Env.includes("POSTGRES_DB=mindbliss_qa"));
function query(name) {
  let template;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name && ts.isTaggedTemplateExpression(node.initializer)) template = node.initializer.template;
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(template && ts.isTemplateExpression(template), `Missing ${name} SQL template`);
  let sql = template.head.text;
  for (const span of template.templateSpans) {
    const expression = span.expression.getText(source);
    assert.ok(Object.hasOwn(bindings, expression), `Unrecognized SQL binding: ${expression}`);
    sql += bindings[expression] + span.literal.text;
  }
  return sql;
}
const partialQuery = query("descendantsQuery");
bindings.depthLimit = "0";
bindings.queryLimit = "1000";
const fullQuery = query("descendantsQuery");
const sql = `
BEGIN;
SET LOCAL statement_timeout = '15s';
INSERT INTO mlm.person(first_name,last_name,email,phone_number,status) VALUES
 ('Fixture','Root','${rootEmail}','0','active'),
 ('Fixture','Blocked','tree-read-blocked@example.invalid','0','banned'),
 ('Fixture','Right','tree-read-right@example.invalid','0','active'),
 ('Fixture','Child','tree-read-child@example.invalid','0','active');
INSERT INTO mlm.affiliate(person_id,parent_id,position,sponsor_id,path,depth,status)
 SELECT id,NULL,NULL,NULL,''::ltree,0,'active' FROM mlm.person WHERE email = '${rootEmail}';
INSERT INTO mlm.affiliate(person_id,parent_id,position,sponsor_id,path,depth,status)
 SELECT p.id,${rootId},v.side::mlm.tree_position,${rootId},''::ltree,0,'active'
 FROM (VALUES ('tree-read-blocked@example.invalid','L'),('tree-read-right@example.invalid','R')) v(email,side)
 JOIN mlm.person p ON p.email = v.email;
INSERT INTO mlm.affiliate(person_id,parent_id,position,sponsor_id,path,depth,status)
 SELECT id,${affiliateFor("tree-read-blocked@example.invalid")},'R',${rootId},''::ltree,0,'active'
 FROM mlm.person WHERE email = 'tree-read-child@example.invalid';
SET LOCAL ROLE qa_member_read;
SELECT json_build_object('kind','root','data',row_to_json(q)) FROM (${query("memberQuery")}) q;
SELECT json_build_object('kind','descendant','data',row_to_json(q)) FROM (${partialQuery}) q;
SELECT json_build_object('kind','full','data',row_to_json(q)) FROM (${fullQuery}) q;
ROLLBACK;`;
const result = spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=synthetic-qa-only", "mindbliss-qa-postgres-1", "psql", "-X", "-w", "-h", "127.0.0.1", "-U", "postgres", "-d", "mindbliss_qa", "-t", "-A", "-v", "ON_ERROR_STOP=1"], { input: sql, encoding: "utf8", timeout: 30000 });
assert.equal(result.status, 0, result.stderr || result.error?.message);
const records = result.stdout.split(/\r?\n/).filter(line => line.startsWith("{")).map(line => JSON.parse(line));
const root = records.find(row => row.kind === "root")?.data;
const descendants = records.filter(row => row.kind === "descendant").map(row => row.data);
const full = records.filter(row => row.kind === "full").map(row => row.data);
assert.ok(root);
assert.equal(root.child_count, 2);
assert.equal(descendants.length, 1);
assert.equal(descendants[0].parent_id, root.id);
assert.equal(descendants[0].position, "L");
assert.equal(descendants[0].display_name, "Not Available");
assert.equal(descendants[0].unavailable, true);
assert.equal(descendants[0].child_count, 1);
const counts = loadedChildCounts(descendants);
assert.equal(childCoverage(root.id, root.child_count, counts).childrenComplete, false);
assert.equal(childCoverage(descendants[0].id, descendants[0].child_count, counts).childrenComplete, false);
assert.equal(full.length, 3);
const blocked = full.find(row => row.unavailable);
const right = full.find(row => row.parent_id === root.id && row.position === "R");
const child = full.find(row => row.parent_id === blocked.id);
assert.equal(blocked.position, "L");
assert.equal(blocked.sponsor_id, null);
assert.equal(right.unavailable, false);
assert.equal(child.position, "R");
assert.equal(child.root_side, "L");
assert.equal(child.level, 2);
const fullCounts = loadedChildCounts(full);
assert.equal(childCoverage(root.id, root.child_count, fullCounts).childrenComplete, true);
assert.equal(childCoverage(blocked.id, blocked.child_count, fullCounts).childrenComplete, true);
console.log("PASS: actual member-tree SQL under the QA read role preserves blocked L, active R, the blocked node's R child, all positions and partial/full coverage; fixtures rolled back.");
