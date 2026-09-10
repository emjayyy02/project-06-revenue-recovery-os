// Offline only: no DB client, credentials, network calls, or SQL execution.
// node supabase/verification/demo-data.cjs          verifies checked-in SQL
// node supabase/verification/demo-data.cjs --write  regenerates demo_seed.sql
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('../../backend/node_modules/typescript');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const snapshot = '2026-09-09T12:00:00.000Z';
const created = '2026-08-01T00:00:00.000Z';
const tables = ['customers', 'recovery_playbooks', 'customer_events', 'risk_signals', 'risk_scores', 'interventions'];

// Run the real pure application functions; type-only imports disappear.
function loadPure(file) {
  const output = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function('exports', output)(exports);
  return exports;
}
const { calculateRiskFromEvents } = loadPure('backend/src/services/risk-engine.ts');
const { calculateAnalytics } = loadPure('backend/src/services/analytics.ts');

// Deliberately narrow parser for literal INSERT VALUES statements in these seeds.
// Reject unsupported expressions rather than silently interpreting arbitrary SQL.
function split(text, separator = ',') {
  let quote = false, depth = 0, start = 0;
  const parts = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "'") {
      if (quote && text[i + 1] === "'") { i++; continue; }
      quote = !quote;
    }
    if (!quote) {
      if (text[i] === '(') depth++;
      if (text[i] === ')') depth--;
      if (text[i] === separator && depth === 0) { parts.push(text.slice(start, i).trim()); start = i + 1; }
    }
  }
  assert.equal(quote, false); assert.equal(depth, 0);
  if (text.slice(start).trim()) parts.push(text.slice(start).trim());
  return parts;
}
function literal(text) {
  if (text === 'null') return null;
  if (text === 'true' || text === 'false') return text === 'true';
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  const relative = text.match(/^now\(\)(?: - interval '(\d+) (days?|hours?)')?$/);
  if (relative) return new Date(Date.parse(snapshot) - Number(relative[1] || 0) * (relative[2]?.startsWith('day') ? 86400000 : 3600000)).toISOString();
  const quoted = text.match(/^'((?:[^']|'')*)'(::jsonb)?$/s);
  assert(quoted, `Unsupported SQL literal: ${text}`);
  const value = quoted[1].replace(/''/g, "'");
  return quoted[2] ? JSON.parse(value) : value;
}
function parseInserts(sql) {
  const result = {};
  const clean = sql.replace(/^\s*--.*$/gm, '');
  for (const statement of split(clean, ';')) {
    const match = statement.match(/^insert into public\.(\w+)\s*\(([^)]+)\)\s*values\s*([\s\S]+)$/i);
    if (!match) continue;
    assert(tables.includes(match[1])); assert(!result[match[1]], 'Duplicate INSERT block');
    const columns = match[2].split(',').map(s => s.trim());
    result[match[1]] = split(match[3]).map(tuple => {
      assert(tuple.startsWith('(') && tuple.endsWith(')'));
      const values = split(tuple.slice(1, -1)).map(literal);
      assert.equal(values.length, columns.length);
      return Object.fromEntries(columns.map((key, i) => [key, values[i]]));
    });
  }
  return result;
}
const uuid = (prefix, index) => `${prefix}-0000-4000-8000-${String(index).padStart(12, '0')}`;
const eventOrder = (a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.id.localeCompare(b.id);

function build() {
  const base = parseInserts(read('supabase/seed.sql'));
  const customers = base.customers.map(c => ({ ...c, created_at: created, updated_at: snapshot }));
  const recovery_playbooks = base.recovery_playbooks.map(p => ({ ...p, created_at: created }));
  const customer_events = base.customer_events.map(e => ({ ...e, description: `Fictional demo: ${e.description}`, metadata: { fictional: true }, created_at: e.occurred_at }));
  const risk_signals = [], risk_scores = [];
  customers.forEach((customer, index) => {
    const result = calculateRiskFromEvents(customer.id, customer_events.filter(e => e.customer_id === customer.id).sort(eventOrder));
    risk_scores.push({ id: uuid('41000000', index + 1), customer_id: customer.id, score: result.score, risk_level: result.riskLevel, calculated_at: snapshot });
    for (const signal of result.signals) risk_signals.push({ id: uuid('42000000', risk_signals.length + 1), ...signal, created_at: snapshot });
  });
  const scenarios = [
    ['Apex Digital', 0, 'pending_approval', null, '2026-09-09T10:00:00.000Z', null],
    ['NovaTech', 1, 'approved', null, '2026-09-08T10:00:00.000Z', null],
    ['Northstar Solutions', 1, 'sent', null, '2026-09-08T10:00:00.000Z', null],
    ['SyncPoint', 1, 'sent', 'recovered', '2026-09-05T10:00:00.000Z', '2026-09-09T06:00:00.000Z'],
    ['PrismWorks', 0, 'sent', 'not_recovered', '2026-09-06T10:00:00.000Z', '2026-09-09T08:00:00.000Z'],
    ['MetricForge', 1, 'failed', null, '2026-09-08T10:00:00.000Z', null],
  ];
  const interventions = scenarios.map(([company, playbookIndex, status, outcome, time, outcomeTime], index) => {
    const customer = customers.find(c => c.company === company);
    const attempted = status === 'sent' || status === 'failed';
    const after = minutes => new Date(Date.parse(time) + minutes * 60000).toISOString();
    return {
      id: uuid('43000000', index + 1), customer_id: customer.id, playbook_id: recovery_playbooks[playbookIndex].id,
      type: 'recovery_outreach', status,
      recommended_action: recovery_playbooks[playbookIndex].name,
      draft_message: `Fictional demo draft: Hi ${customer.full_name.split(' ')[0]}, could we review your account concerns and agree on a helpful next step?`,
      created_at: time, approved_at: status === 'pending_approval' ? null : after(5),
      executed_at: status === 'sent' ? after(11) : null,
      execution_attempts: attempted ? 1 : 0, last_execution_at: attempted ? after(10) : null,
      execution_error: status === 'failed' ? 'Fictional demo: delivery did not complete. Review before retrying.' : null,
      outcome, outcome_recorded_at: outcomeTime,
    };
  });
  return { customers, recovery_playbooks, customer_events, risk_signals, risk_scores, interventions };
}
function sqlValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${value.replace(/'/g, "''")}'`;
}
function render(data) {
  let sql = `-- FICTIONAL PORTFOLIO DEMO. No real customers, deliveries, or recovery claims.\n-- Fixed snapshot: ${snapshot}. Generated/verified by verification/demo-data.cjs.\n-- CLEAN PROJECT ONLY: apply after all reviewed migrations as owner/admin.\n-- Never apply to development; never run the existing seed.sql first.\n-- Refuses nonempty tables (including repeat application); no deletes or upserts.\n-- Not registered in config.toml. No SQL is executed by the generator.\n\nbegin;\n\nlock table ${tables.map(t => `public.${t}`).join(', ')} in exclusive mode;\n\ndo $demo$\nbegin\n  if ${tables.map(t => `exists (select 1 from public.${t})`).join('\n    or ')} then\n    raise exception 'Demo seed requires six empty application tables; nothing was changed.';\n  end if;\nend\n$demo$;\n\n`;
  for (const table of tables) {
    const columns = Object.keys(data[table][0]);
    sql += `insert into public.${table} (${columns.join(', ')})\nvalues\n`;
    sql += data[table].map(row => `  (${columns.map(c => sqlValue(row[c])).join(', ')})`).join(',\n') + ';\n\n';
  }
  return sql.replace('end\n$demo$;', 'end;\n$demo$;') + 'commit;\n';
}

function verify(data) {
  assert.deepEqual(Object.keys(data).sort(), [...tables].sort());
  const source = ts.createSourceFile('database.ts', read('backend/src/types/database.ts'), ts.ScriptTarget.Latest, true);
  const property = (type, name) => type.members.find(m => m.name?.getText(source).replace(/"/g, '') === name).type;
  const database = source.statements.find(s => ts.isTypeAliasDeclaration(s) && s.name.text === 'Database').type;
  const schema = property(property(database, 'public'), 'Tables');
  for (const table of tables) {
    const tableType = property(schema, table);
    const columns = property(tableType, 'Row').members.map(m => m.name.getText(source));
    const required = property(tableType, 'Insert').members.filter(m => !m.questionToken).map(m => m.name.getText(source));
    for (const row of data[table]) {
      assert(Object.keys(row).every(k => columns.includes(k)), `${table}: unknown column`);
      assert(required.every(k => row[k] !== undefined && row[k] !== null), `${table}: missing required value`);
    }
  }
  const ids = new Set();
  for (const rows of Object.values(data)) for (const row of rows) {
    assert.match(row.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert(!ids.has(row.id)); ids.add(row.id);
    for (const [key, value] of Object.entries(row)) {
      if (key.endsWith('_at') && value !== null) {
        assert.equal(new Date(value).toISOString(), value);
        assert(Date.parse(value) <= Date.parse(snapshot));
      }
    }
  }
  const customers = new Map(data.customers.map(c => [c.id, c]));
  const events = new Map(data.customer_events.map(e => [e.id, e]));
  const playbooks = new Set(data.recovery_playbooks.map(p => p.id));
  const eventTypes = ['login','usage_decline','login_inactivity','payment_failed','negative_support','negative_feedback','customer_reply','successful_payment','usage_recovered'];
  for (const c of data.customers) {
    assert.match(c.email, /^[a-z.]+@[a-z]+\.demo$/);
    assert(['healthy','at_risk','recovering'].includes(c.customer_health_status));
    assert(['active','onboarding','renewal_pending','past_due'].includes(c.lifecycle_status));
    assert(c.account_value >= 0);
    assert(c.created_at <= c.last_activity_at && c.last_activity_at <= c.updated_at);
  }
  for (const e of data.customer_events) {
    assert(customers.has(e.customer_id)); assert(eventTypes.includes(e.event_type));
    assert(e.description.startsWith('Fictional demo: ')); assert.deepEqual(e.metadata, { fictional: true });
    assert.match(e.source, /_demo$/); assert(customers.get(e.customer_id).created_at <= e.occurred_at);
  }
  for (const s of data.risk_signals) {
    assert(events.has(s.source_event_id)); assert.equal(events.get(s.source_event_id).customer_id, s.customer_id);
    assert(events.get(s.source_event_id).occurred_at <= s.created_at);
  }
  for (const customer of data.customers) {
    const result = calculateRiskFromEvents(customer.id, data.customer_events.filter(e => e.customer_id === customer.id).sort(eventOrder));
    const stored = data.risk_scores.filter(r => r.customer_id === customer.id);
    assert.equal(stored.length, 1); assert.equal(stored[0].score, result.score); assert.equal(stored[0].risk_level, result.riskLevel);
    const signals = data.risk_signals.filter(s => s.customer_id === customer.id).map(({ id, created_at, ...signal }) => signal);
    assert.deepEqual(signals, result.signals);
  }
  const pending = new Set();
  for (const i of data.interventions) {
    assert(customers.has(i.customer_id)); assert(playbooks.has(i.playbook_id));
    assert(['pending_approval','approved','sent','failed'].includes(i.status));
    assert([null,'recovered','not_recovered'].includes(i.outcome));
    assert.equal(i.type, 'recovery_outreach');
    if (i.status === 'pending_approval') {
      const key = i.customer_id + i.playbook_id; assert(!pending.has(key)); pending.add(key);
      assert.equal(i.approved_at, null);
    } else assert(i.approved_at && i.created_at <= i.approved_at);
    if (['pending_approval','approved'].includes(i.status)) {
      assert.equal(i.executed_at, null); assert.equal(i.execution_attempts, 0); assert.equal(i.last_execution_at, null);
    } else {
      assert(i.execution_attempts > 0); assert(i.approved_at <= i.last_execution_at);
    }
    if (i.status === 'sent') { assert(i.executed_at && i.last_execution_at <= i.executed_at); assert.equal(i.execution_error, null); }
    if (i.status === 'failed') { assert.equal(i.executed_at, null); assert(i.execution_error.startsWith('Fictional demo:')); }
    if (i.outcome) { assert.equal(i.status, 'sent'); assert(i.outcome_recorded_at && i.executed_at <= i.outcome_recorded_at); }
    else assert.equal(i.outcome_recorded_at, null);
  }
  const serialized = JSON.stringify(data);
  assert(!/https?:|webhook|slack|sb_secret_|sk-or-|xox[baprs]-|Bearer |[A-Z]:\\/i.test(serialized));
  const analytics = calculateAnalytics(data.customers, data.risk_scores, data.interventions);
  assert.equal(analytics.total_customers, 24); assert.equal(analytics.recovered_customers, 1);
  assert.equal(analytics.recovery_success_rate, 50);
  assert.deepEqual(analytics.intervention_outcomes, { pending: 1, recovered: 1, not_recovered: 1 });
  assert.equal(analytics.recent_recovery_activity.length, 5);
  for (const [company, score] of [['Apex Digital',75],['NovaTech',35],['Vertex Labs',0],['SyncPoint',15]]) {
    assert.equal(data.risk_scores.find(r => r.customer_id === data.customers.find(c => c.company === company).id).score, score);
  }
  return analytics;
}

const expected = build();
verify(expected);
const output = render(expected);
if (process.argv.includes('--write')) fs.writeFileSync(path.join(root, 'supabase/demo_seed.sql'), output);
const checkedIn = read('supabase/demo_seed.sql');
assert.equal(checkedIn.replace(/\r\n/g, '\n'), output, 'Seed drift: review then regenerate deliberately');
const actual = parseInserts(checkedIn);
assert.deepEqual(actual, expected);
const analytics = verify(actual);
const security = read('supabase/migrations/20260910090000_harden_application_table_access.sql').replace(/^\s*--.*$/gm, '');
const statements = split(security, ';').map(s => s.replace(/\s+/g, ' ').trim());
assert.equal(statements.length, 16); // transaction, six RLS, two revokes, six grants
assert.equal(statements[0], 'begin'); assert.equal(statements.at(-1), 'commit');
const permissions = { customers: 'select', customer_events: 'select, insert', risk_signals: 'select, insert, delete', risk_scores: 'select, insert', recovery_playbooks: 'select', interventions: 'select, insert, update' };
for (const table of tables) {
  assert(statements.includes(`alter table public.${table} enable row level security`));
  assert(statements.includes(`grant ${permissions[table]} on table public.${table} to service_role`));
}
for (const roles of ['anon, authenticated, public', 'service_role']) {
  const revoke = statements.find(s => s.startsWith('revoke all privileges on table ') && s.endsWith(` from ${roles}`));
  assert(revoke); assert.deepEqual([...revoke.matchAll(/public\.(\w+)/g)].map(m => m[1]).sort(), [...tables].sort());
}
console.log('PASS: security migration statement scope, six RLS enables, client revokes, exact service grants, no policies/default changes');
console.log('PASS: deterministic SQL round trip; IDs, references, enums, dates, lifecycle, sanitization, all engine scores/signals, real analytics');
console.log(JSON.stringify({ counts: Object.fromEntries(tables.map(t => [t, actual[t].length])), analytics }, null, 2));
console.log(JSON.stringify(actual.customers.map(c => ({ company: c.company, ...Object.fromEntries(Object.entries(actual.risk_scores.find(r => r.customer_id === c.id)).filter(([k]) => ['score','risk_level'].includes(k))) })), null, 2));
