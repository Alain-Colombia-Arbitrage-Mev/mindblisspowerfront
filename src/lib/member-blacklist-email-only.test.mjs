import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const sources = Object.fromEntries(['tree', 'referral'].map(name => [name,
  readFileSync(new URL(`../app/api/member/${name}/route.js`, import.meta.url), 'utf8')]));

test('all six tree/referral blacklist predicates match CSV email only and retain explicit restrictions and topology', () => {
  for (const [name, source] of Object.entries(sources)) {
    assert.equal((source.match(/FROM mlm\.blacklist b/g) || []).length, name === 'tree' ? 4 : 2);
    assert.equal((source.match(/WHERE b\.email_norm = mlm\.norm_email\((?:p|rp)\.email\)/g) || []).length, name === 'tree' ? 4 : 2);
    assert.doesNotMatch(source, /phone_last10|name_norm|norm_phone10|norm_name|b\.birthdate/);
    assert.match(source, /row\.blacklisted \|\| row\.listed_by_blacklist/);
    assert.match(source, /\["suspended", "banned", "deleted"\]\.includes\(row\.status\)/);
    assert.match(source, /NOT COALESCE\(p\.blacklisted, false\)/);
    assert.doesNotMatch(source, /\b(?:UPDATE|INSERT INTO|DELETE FROM|TRUNCATE)\s+mlm\./);
  }
  const tree = sources.tree;
  assert.equal((tree.match(/OR COALESCE\(p\.blacklisted, false\)/g) || []).length, 2);
  assert.match(tree, /JOIN sub ON a\.parent_id = sub\.id/);
  assert.match(tree, /AND NOT \(a\.id = ANY\(sub\.path_ids\)\)/);
  assert.match(tree, /CASE WHEN d\.unavailable THEN 'Not Available'/);
  assert.match(tree, /CASE WHEN d\.unavailable THEN NULL ELSE d\.sponsor_id END/);
});

function query(route, name, bindings) {
  const ast = ts.createSourceFile('route.js', sources[route], ts.ScriptTarget.Latest, true);
  let template;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) {
      const value = ts.isAwaitExpression(node.initializer) ? node.initializer.expression : node.initializer;
      if (ts.isTaggedTemplateExpression(value)) template = value.template;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(template && ts.isTemplateExpression(template), `missing ${route}/${name} actual SQL`);
  let sql = template.head.text;
  for (const span of template.templateSpans) {
    const expression = span.expression.getText(ast);
    assert.ok(Object.hasOwn(bindings, expression), `unrecognized fixture SQL binding ${expression}`);
    sql += bindings[expression] + span.literal.text;
  }
  return sql;
}

// Explicit opt-in only: an isolated, disposable PostgreSQL with no ports or
// network. No .env, CSV, customer tables or host/cloud connection is consulted.
test('actual PostgreSQL SQL permits phone/name collisions, denies CSV mail and preserves masked nodes', {
  skip: process.env.MEMBER_BLACKLIST_SYNTHETIC_DOCKER !== 'true', timeout: 60_000,
}, async () => {
  const name = `member-email-only-${randomBytes(6).toString('hex')}`;
  const password = randomBytes(24).toString('hex');
  const childEnv = { ...process.env, POSTGRES_PASSWORD: password };
  function docker(args, input) {
    const result = spawnSync('docker', args, { env: childEnv, input, encoding: 'utf8', timeout: 30_000, windowsHide: true });
    assert.equal(result.status, 0, (result.stderr || 'synthetic Docker failed').replaceAll(password, '[redacted]'));
    return result.stdout;
  }
  let created = false;
  try {
    docker(['run', '--pull=never', '-d', '--name', name, '--network', 'none', '--tmpfs', '/var/lib/postgresql/data',
      '-e', 'POSTGRES_PASSWORD', '-e', 'POSTGRES_DB=member_email_synthetic',
      'postgres:17.11-bookworm@sha256:858bb5e98eed02eb8cafbcdc007f9a65d1b613972028944a8ec2133ccaf80d27']);
    created = true;
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (spawnSync('docker', ['exec', name, 'pg_isready', '-U', 'postgres'], { stdio: 'ignore', windowsHide: true }).status === 0) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.ok(ready, 'synthetic PostgreSQL did not start');
    const allowed = { email: "'allowed@example.test'", 'root.id': '1', depthLimit: '4', queryLimit: '100', 'affiliate.id': '1' };
    const blocked = { ...allowed, email: "'csv-blocked@example.test'" };
    const flagged = { ...allowed, email: "'flagged@example.test'" };
    const resultQuery = (kind, sql) => `SELECT jsonb_build_object('kind','${kind}','data',COALESCE(jsonb_agg(to_jsonb(q)),'[]'::jsonb)) FROM (${sql}) q;`;
    const snapshot = `SELECT jsonb_build_object('kind','snapshot','data',jsonb_agg(to_jsonb(a) ORDER BY a.id)) FROM mlm.affiliate a;`;
    const output = docker(['exec', '-i', name, 'psql', '-X', '-U', 'postgres', '-d', 'member_email_synthetic', '-t', '-A', '-v', 'ON_ERROR_STOP=1'], `
CREATE SCHEMA mlm;
CREATE FUNCTION mlm.norm_email(text) RETURNS text LANGUAGE sql IMMUTABLE AS 'SELECT lower(btrim($1))';
CREATE TABLE mlm.person(id bigint PRIMARY KEY,email text,status text,blacklisted boolean,first_name text,last_name text,phone_number text,birthday date);
CREATE TABLE mlm.affiliate(id bigint PRIMARY KEY,person_id bigint,parent_id bigint,sponsor_id bigint,depth int,position text,status text,current_rank_id int,invitation_link text,created_at timestamptz DEFAULT now());
CREATE TABLE mlm.blacklist(email_norm text,phone_last10 text,name_norm text,birthdate date);
CREATE TABLE mlm.rank(id int,code text,name_es text,display_order int);
CREATE TABLE mlm.affiliate_package(affiliate_id bigint,status text);
INSERT INTO mlm.person VALUES
 (1,'allowed@example.test','active',false,'Shared','Synthetic','12125550100','1990-01-01'),
 (2,'collision@example.test','active',false,'Shared','Synthetic','12125550100','1990-01-01'),
 (3,'csv-blocked@example.test','active',false,'Shared','Synthetic','12125550100','1990-01-01'),
 (4,'grandchild@example.test','active',false,'Shared','Synthetic','12125550100','1990-01-01'),
 (5,'flagged@example.test','active',true,'Shared','Synthetic','12125550100','1990-01-01');
INSERT INTO mlm.affiliate(id,person_id,parent_id,sponsor_id,depth,position,status,current_rank_id,invitation_link) VALUES
 (1,1,NULL,NULL,0,NULL,'active',1,'SyntheticHandle'),(2,2,1,1,1,'L','active',1,NULL),
 (3,3,1,1,1,'R','active',1,NULL),(4,4,3,1,2,'R','active',1,NULL),(5,5,NULL,NULL,0,NULL,'active',1,NULL);
INSERT INTO mlm.rank VALUES(1,'BRONZE','Bronce',1);
INSERT INTO mlm.blacklist VALUES('csv-blocked@example.test','2125550100','shared synthetic','1990-01-01'),
 (NULL,'2125550100','shared synthetic','1990-01-01');
CREATE ROLE member_email_fixture NOLOGIN;
GRANT USAGE ON SCHEMA mlm TO member_email_fixture;
GRANT SELECT ON ALL TABLES IN SCHEMA mlm TO member_email_fixture;
SET ROLE member_email_fixture;
BEGIN READ ONLY;
${snapshot}
${resultQuery('tree-access-allowed', query('tree', 'accessQuery', allowed))}
${resultQuery('tree-access-csv', query('tree', 'accessQuery', blocked))}
${resultQuery('tree-member-allowed', query('tree', 'memberQuery', allowed))}
${resultQuery('tree-member-csv', query('tree', 'memberQuery', blocked))}
${resultQuery('tree-member-flagged', query('tree', 'memberQuery', flagged))}
${resultQuery('tree-descendants', query('tree', 'descendantsQuery', allowed))}
${resultQuery('referral-access-allowed', query('referral', 'access', allowed))}
${resultQuery('referral-access-csv', query('referral', 'access', blocked))}
${resultQuery('referral-directs', query('referral', 'referrals', allowed))}
${snapshot}
ROLLBACK;
`);
    const results = output.split(/\r?\n/).filter(line => line.startsWith('{')).map(line => JSON.parse(line));
    const data = kind => results.find(row => row.kind === kind)?.data;
    assert.equal(data('tree-access-allowed')[0].listed_by_blacklist, false);
    assert.equal(data('referral-access-allowed')[0].listed_by_blacklist, false);
    assert.equal(data('tree-access-csv')[0].listed_by_blacklist, true);
    assert.equal(data('referral-access-csv')[0].listed_by_blacklist, true);
    assert.equal(data('tree-member-allowed')[0].id, 1);
    assert.deepEqual(data('tree-member-csv'), []);
    assert.deepEqual(data('tree-member-flagged'), []);
    const descendants = data('tree-descendants');
    assert.deepEqual(descendants.map(row => [row.id, row.parent_id, row.position, row.root_side]), [[2, 1, 'L', 'L'], [3, 1, 'R', 'R'], [4, 3, 'R', 'R']]);
    assert.equal(descendants[0].unavailable, false);
    assert.equal(descendants[1].unavailable, true);
    assert.equal(descendants[1].display_name, 'Not Available');
    assert.equal(descendants[1].sponsor_id, null);
    assert.equal(descendants[1].rank_code, null);
    assert.equal(descendants[2].unavailable, false, 'masked parent never removes or moves an eligible descendant');
    assert.deepEqual(data('referral-directs').map(row => row.id).sort(), [2, 4]);
    assert.deepEqual(results.filter(row => row.kind === 'snapshot')[0].data, results.filter(row => row.kind === 'snapshot')[1].data);
  } finally {
    if (created) { assert.match(name, /^member-email-only-[a-f0-9]{12}$/); docker(['rm', '-f', name]); }
  }
});
