// Run from the repository root; see M10_6_VERIFICATION.md. No package installation required.
const { chromium } = require(process.env.M10_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const now = '2026-09-09T10:00:00Z';
const customers = Array.from({ length: 32 }, (_, i) => ({
  id: `account-${i}`, full_name: i === 0 ? 'Alex Rivera' : `Customer ${i}`,
  company: i === 0 ? 'Northstar Logistics' : `Company ${i}`, email: `customer${i}@example.test`,
  account_value: i === 0 ? 0 : i === 1 ? 9876543210.25 : 180000,
  owner: i === 0 ? null : i % 2 ? 'Jamie Santos' : 'Morgan Lee',
  customer_health_status: i % 2 ? 'at_risk' : 'healthy', lifecycle_status: i % 2 ? 'active' : 'onboarding',
  last_activity_at: i === 0 ? null : now, created_at: now, updated_at: now,
}));
const levels = ['low', 'medium', 'high', 'critical', null];
const statuses = ['pending_approval', 'pending_approval', 'approved', 'executing', 'failed', 'sent', 'sent', 'sent', 'rejected'];
const seedInterventions = statuses.map((status, i) => ({
  id: `intervention-${i}`, customer_id: `account-${i}`, playbook_id: 'playbook-1', type: 'email', status,
  recommended_action: 'Review payment history and coordinate recovery outreach with the account owner.',
  draft_message: null, approved_at: ['pending_approval', 'rejected'].includes(status) ? null : now,
  executed_at: status === 'sent' ? now : null, outcome: i === 6 ? 'recovered' : i === 7 ? 'not_recovered' : null,
  outcome_recorded_at: [6, 7].includes(i) ? now : null, created_at: now,
  execution_error: status === 'failed' ? 'Delivery endpoint returned a temporary error. Please retry.' : null,
  execution_attempts: ['failed', 'executing', 'sent'].includes(status) ? 2 : 0, last_execution_at: null,
  customers: customers[i], recovery_playbooks: { name: 'Billing Recovery Outreach', requires_approval: true, action_type: 'email' },
}));
const analytics = { total_customers: 32, at_risk_customers: 12, critical_customers: 6, revenue_exposure: 2160000,
 recovered_customers: 1, recovery_success_rate: 50, risk_distribution: {low:7,medium:7,high:6,critical:6,uncalculated:6},
 revenue_exposure_by_risk: {low:1080000,medium:1260000,high:1080000,critical:1080000},
 intervention_outcomes: {pending:1,recovered:1,not_recovered:1}, recent_recovery_activity: [{intervention_id:'intervention-6',customer_id:'account-6',company:'Company 6',outcome:'recovered',occurred_at:now}] };
const results = [];
const pass = name => { results.push(name); console.log(`PASS ${name}`); };
(async () => {
 const browser = await chromium.launch({channel:'msedge', headless:true});
 const context = await browser.newContext({ viewport:{width:1440,height:1000}, colorScheme:process.env.M106_THEME || 'dark', reducedMotion:'reduce' });
 const page = await context.newPage();
 let data = structuredClone(seedInterventions), mode = 'normal', calls = [], readFailure = false, writesFail = false;
 let delay = 0, postDelay = 0, riskFailure = false;
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.route(url => url.pathname.startsWith('/api/'), async route => {
   const req = route.request(), path = new URL(req.url()).pathname, method = req.method();
   calls.push({ path, method });
   if (delay) await new Promise(resolve => setTimeout(resolve, delay));
   const send = (value, status=200) => route.fulfill({status, json: status === 200 ? {data:value} : {error:'Isolated test request failure'}});
   if (method === 'POST') {
     if (postDelay) await new Promise(resolve => setTimeout(resolve, postDelay));
     if (writesFail) return send(null, 503);
     if (path.endsWith('/ai-assistance')) return route.fulfill({json:{data:{risk_summary:'Fixture risk summary',recommended_next_action:'Review the account.',draft_message:'Fixture outreach draft'},provider:'fallback'}});
     if (path === '/api/interventions') return send({ ...seedInterventions[0] });
     const id = path.split('/')[3], action = path.split('/')[4], item = data.find(item => item.id === id);
     if (action === 'approve') item.status = 'approved';
     if (action === 'reject') item.status = 'rejected';
     if (action === 'execute') item.status = 'executing';
     if (action === 'outcome') { item.outcome = req.postDataJSON().outcome; item.outcome_recorded_at = now; }
     return send(item);
   }
   if (mode === 'error' || (readFailure && path === '/api/interventions')) return send(null,503);
   if (path === '/api/customers') return send(mode === 'empty' ? [] : customers);
   if (path === '/api/interventions') return send(mode === 'empty' ? [] : data);
   if (path === '/api/analytics') return send(analytics);
   const index = Number(path.split('/')[3]?.replace('account-','')) || 0;
   if (path.endsWith('/risk')) return riskFailure && index === 0 ? send(null,503) : send(levels[index % 5] ? {id:`risk-${index}`,customer_id:`account-${index}`,score:85,risk_level:levels[index % 5],calculated_at:now} : null);
   if (path.endsWith('/events') || path.endsWith('/signals')) return send([]);
   if (/\/api\/customers\/[^/]+$/.test(path)) return send(customers[index]);
   throw new Error(`Unmocked API route: ${method} ${path}`);
 });
 const go = async path => { await page.goto(`http://127.0.0.1:5173${path}`); await page.locator('main h1').waitFor(); await page.waitForFunction(() => !document.querySelector('main [aria-busy="true"]')); };
 const readyCustomers = async () => { await page.getByRole('button',{name:'Refresh customers'}).waitFor(); await page.waitForFunction(() => !document.querySelector('.operations-header button')?.disabled); };
 const noOverflow = async label => { assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label); pass(label); };
 for (const width of [320,768,1440]) {
   await page.setViewportSize({width,height:1000});
   for (const path of ['/customers','/approvals','/dashboard','/analytics','/customers/account-3']) {
     await go(path); if(path === '/customers') await readyCustomers();
     await noOverflow(`${path} at ${width}px has no page overflow`);
     if (['/customers','/approvals'].includes(path) && width !== 768) await page.screenshot({path:`screenshots/m106-${path.slice(1)}-${width}.png`,fullPage:width===320});
   }
 }
 await page.setViewportSize({width:1440,height:1000});
 await go('/customers'); await readyCustomers();
 assert.equal(await page.locator('.customer-table tbody tr').count(),32);
 for (const query of ['Alex Rivera','northstar','customer0@example.test','Jamie Santos']) {
   await page.getByLabel('Search customers',{exact:true}).fill(query);
   assert(await page.locator('.customer-table tbody tr').count() > 0);
 }
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();
 await page.getByLabel('Risk',{exact:true}).selectOption('critical'); assert.equal(await page.locator('.customer-table tbody tr').count(),6);
 await page.getByLabel('Health',{exact:true}).selectOption('at_risk'); assert.equal(await page.locator('.customer-table tbody tr').count(),3);
 await page.getByLabel('Owner',{exact:true}).selectOption('Jamie Santos'); assert.equal(await page.locator('.customer-table tbody tr').count(),3);
 await page.getByLabel('Lifecycle',{exact:true}).selectOption('active'); assert.equal(await page.locator('.customer-table tbody tr').count(),3);
 pass('Search matches name, company, email and owner; all four filters combine');
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();
 await page.getByLabel('Search customers',{exact:true}).fill('no-such-customer'); await page.getByText('No customers match your current filters.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Clear filters',exact:true}).first().click();
 await page.getByLabel('Risk',{exact:true}).selectOption('uncalculated'); assert.equal(await page.locator('.customer-table tbody tr').count(),6);
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();
 const firstRow = page.locator('.customer-table tbody tr').first();
 assert((await firstRow.innerText()).includes('₱0')); assert((await firstRow.innerText()).includes('Unassigned')); assert((await firstRow.innerText()).includes('No activity'));
 assert((await page.locator('.customer-table tbody tr').nth(1).innerText()).includes('9,876,543,210.25'));
 await page.keyboard.press('Tab');
 await page.getByRole('link',{name:'Alex Rivera',exact:true}).focus();
 assert.equal(await page.getByRole('link',{name:'Alex Rivera',exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
 await page.keyboard.press('Enter'); await page.waitForURL('**/customers/account-0');
 pass('No-results/reset, uncalculated risk, zero/large currency, owner/activity fallbacks and keyboard customer navigation');
 riskFailure = true; await go('/customers'); await readyCustomers();
 assert((await page.locator('.customer-table tbody tr').first().innerText()).toUpperCase().includes('UNAVAILABLE'));
 await page.getByText('Some risk scores are unavailable',{exact:true}).waitFor();
 riskFailure = false; await page.getByRole('button',{name:'Refresh customers'}).click(); await readyCustomers();
 assert((await page.locator('.customer-table tbody tr').first().innerText()).toUpperCase().includes('LOW'));
 pass('Failed risk requests stay distinct from uncalculated risk and recover on refresh');
 for(const path of ['/customers','/approvals']) {
   mode='empty'; await go(path); await page.getByText(path==='/customers'?'No customers yet':'No approvals waiting',{exact:true}).waitFor();
   if(path==='/approvals') await page.getByText('No decisions yet',{exact:true}).waitFor();
   mode='error'; await go(path); assert(await page.getByRole('alert').count());
   mode='normal'; await page.getByRole('button',{name:path==='/customers'?'Try again':'Refresh approvals',exact:true}).click();
   await page.waitForFunction(()=>!document.querySelector('main [aria-busy="true"]')); if(path==='/customers') await readyCustomers();
   assert.equal(await page.getByRole('alert').count(),0);
   delay=600; await page.goto(`http://127.0.0.1:5173${path}`); await page.getByText(path==='/customers'?'Loading customers…':'Loading approvals…',{exact:true}).waitFor(); delay=0;
   await page.waitForFunction(()=>!document.querySelector('main [aria-busy="true"]')); if(path==='/customers') await readyCustomers();
 }
 pass('Customers and Approvals loading, empty, error and retry states');
 await go('/approvals');
 const card = id => page.locator('.intervention-card').filter({has:page.getByRole('link',{name:id,exact:true})});
 // Cards use fixture company identities; verify each lifecycle control independently.
 assert.equal(await card('Company 3').getByRole('button').isDisabled(),true);
 assert.equal(await card('Company 6').getByRole('button').count(),0);
 assert.equal(await card('Company 7').getByRole('button').count(),0);
 assert.equal(await card('Company 8').getByRole('button').count(),0);
 assert((await card('Company 4').innerText()).includes('Execution attempts'));
 postDelay=400; calls=[];
 await card('Northstar Logistics').getByRole('button',{name:'Approve',exact:true}).evaluate(el=>{el.click();el.click();});
 assert(await card('Company 1').getByRole('button',{name:'Reject',exact:true}).isDisabled());
 await page.waitForFunction(()=>!document.querySelector('.approval-feedback')?.textContent);
 assert.equal(calls.filter(c=>c.method==='POST').length,1);
 assert.equal(await card('Northstar Logistics').getByRole('button',{name:'Execute',exact:true}).count(),1);
 postDelay=0;
 await card('Company 1').getByRole('button',{name:'Reject',exact:true}).click(); await card('Company 1').getByText('This intervention was rejected and cannot be executed.').waitFor();
 await card('Company 2').getByRole('button',{name:'Execute',exact:true}).click(); await card('Company 2').getByRole('button',{name:'Executing…',exact:true}).waitFor();
 await card('Company 4').getByRole('button',{name:'Retry',exact:true}).click(); await card('Company 4').getByRole('button',{name:'Executing…',exact:true}).waitFor();
 await card('Company 5').getByRole('button',{name:'Mark Recovered',exact:true}).click(); await card('Company 5').getByText('Final outcome recorded.').waitFor();
 assert.equal(data[5].outcome,'recovered');
 data[5].outcome=null; await page.getByRole('button',{name:'Refresh approvals'}).click(); await card('Company 5').getByRole('button',{name:'Mark Not Recovered',exact:true}).click(); await card('Company 5').getByText('Final outcome recorded.').waitFor();
 assert.equal(data[5].outcome,'not_recovered');
 pass('Approve, reject, execute, retry, both outcomes, final/read-only states and rapid duplicate prevention through isolated HTTP fixtures');
 data=structuredClone(seedInterventions); await go('/approvals'); writesFail=true;
 await card('Northstar Logistics').getByRole('button',{name:'Approve',exact:true}).click(); await page.getByRole('alert').waitFor(); writesFail=false;
 assert.equal(data[0].status,'pending_approval');
 readFailure=true;
 await card('Northstar Logistics').getByRole('button',{name:'Approve',exact:true}).click(); await page.getByText('Unable to refresh approvals',{exact:true}).waitFor();
 assert.equal(await page.locator('.intervention-card button').count(),0);
 readFailure=false; await page.getByRole('button',{name:'Refresh approvals'}).click(); await card('Northstar Logistics').getByRole('button',{name:'Execute',exact:true}).waitFor();
 pass('Action failure remains recoverable; failed post-action refresh prevents stale lifecycle actions');
 // Stress long unbroken content and missing optional relations in the real rendered components.
 customers[0].full_name='VeryLongCustomerName'.repeat(18); customers[0].company='VeryLongCompanyName'.repeat(18);
 data=structuredClone(seedInterventions); data[0].customers=customers[0]; data[0].recovery_playbooks.name='LongPlaybookName'.repeat(24);
 data[4].execution_error='VeryLongExecutionError'.repeat(300); data[1].customers=null; data[1].recovery_playbooks=null; data[1].recommended_action=null;
 for(const width of [320,768,1440]) { await page.setViewportSize({width,height:1000}); for(const path of ['/customers','/approvals']) {await go(path); if(path==='/customers')await readyCustomers(); await noOverflow(`${path} long-content stress at ${width}px`);} }
 customers[0].full_name='Alex Rivera';customers[0].company='Northstar Logistics';data=structuredClone(seedInterventions);
 await go('/customers/account-3');
 await page.getByRole('button',{name:'Generate AI Assistance'}).click(); await page.getByText('Fixture risk summary',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Request Approval',exact:true}).click(); await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Requesting...'));
 assert(calls.some(c=>c.path==='/api/interventions'&&c.method==='POST'));
 pass('Customer 360 AI assistance and approval-request UI/HTTP wiring preserved (fixtures)');
 await go('/approvals');
 const badgeContrast = await page.locator('.c360-badge').evaluateAll(nodes => {
   const luminance = rgb => rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
   return nodes.map(node=>{const s=getComputedStyle(node), a=luminance(s.color), b=luminance(s.backgroundColor); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
 });
 assert(badgeContrast.every(value=>value>=4.5));
 await page.keyboard.press('Tab');
 const approvalButton = page.getByRole('button',{name:'Approve',exact:true}).first();
 await approvalButton.focus(); assert.equal(await approvalButton.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
 await go('/customers'); await readyCustomers();
 await page.keyboard.press('Tab');
 await page.getByLabel('Risk',{exact:true}).focus(); assert.equal(await page.getByLabel('Risk',{exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
 await page.setViewportSize({width:320,height:1000});
 await page.locator('.customer-table-scroll').focus();
 await page.keyboard.press('ArrowRight');
 await page.waitForFunction(()=>document.querySelector('.customer-table-scroll').scrollLeft>0);
 pass('Status badge contrast >= 4.5:1, visible button/input focus and keyboard table scrolling');

 await page.setViewportSize({width:1440,height:1000});
 await go('/dashboard');
 const segments = await page.locator('.risk-ring circle[data-level]').evaluateAll(nodes=>nodes.map(n=>({level:n.dataset.level,share:Number(n.getAttribute('stroke-dasharray').split(' ')[0])})));
 for(const segment of segments) assert(Math.abs(segment.share-analytics.risk_distribution[segment.level]/analytics.total_customers*100)<.001);
 assert.equal(await page.locator('.risk-legend li').count(),5);
 assert((await page.locator('.exposure-value').innerText()).includes('2,160,000'));
 assert(await page.locator('.exposure-value').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>parseFloat(getComputedStyle(document.querySelector('.supporting-kpis dd')).fontSize)));
 pass('Risk ring exactly represents API shares; all five legend counts remain; exposure has primary hierarchy');
 await go('/analytics');
 const widths = await page.locator('.outcome-stack span').evaluateAll(nodes=>nodes.map(n=>parseFloat(n.style.width)));
 assert(widths.every(value=>Math.abs(value-100/3)<.001));
 assert.equal(await page.locator('.performance-value').innerText(),'50%');
 assert((await page.locator('.risk-coverage').innerText()).includes('26'));
 pass('Mixed outcome distribution, server success rate and scored-account coverage render accurately');
 const savedAnalytics = structuredClone(analytics);
 Object.assign(analytics,{total_customers:0,at_risk_customers:0,critical_customers:0,revenue_exposure:0,recovered_customers:0,recovery_success_rate:0,risk_distribution:{low:0,medium:0,high:0,critical:0,uncalculated:0},revenue_exposure_by_risk:{low:0,medium:0,high:0,critical:0},intervention_outcomes:{pending:0,recovered:0,not_recovered:0},recent_recovery_activity:[]});
 for(const path of ['/dashboard','/analytics']) {await go(path); assert(!(await page.locator('main').innerText()).match(/NaN|Infinity/));assert.equal(await page.locator('circle[data-level]').count(),0);}
 assert.equal(await page.locator('.performance-value').innerText(),'0%');
 Object.assign(analytics,savedAnalytics,{total_customers:24,risk_distribution:{low:2,medium:1,high:0,critical:1,uncalculated:20}});
 await go('/dashboard');assert.equal(await page.locator('.risk-ring circle[data-level="high"]').count(),0);
 assert((await page.locator('.risk-coverage').innerText()).includes('16.7%'));
 Object.assign(analytics,savedAnalytics);
 for(const path of ['/dashboard','/analytics']) {
   mode='error'; await go(path);await page.getByRole('alert').waitFor();mode='normal';await page.getByRole('button',{name:'Try again',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('main [aria-busy="true"]'));assert.equal(await page.getByRole('alert').count(),0);
   delay=600;await page.goto('http://127.0.0.1:5173'+path);await page.getByText('Loading account risk and recovery outcomes…',{exact:true}).waitFor();delay=0;await page.waitForFunction(()=>!document.querySelector('main [aria-busy="true"]'));
 }
 pass('Analytics empty/zero, majority-uncalculated, loading/error/retry states render without invented segments or invalid math');
 assert.deepEqual(errors,[]); pass('No uncaught browser errors');
 fs.writeFileSync('screenshots/m106-browser-results.json',JSON.stringify({scope:'Isolated HTTP fixtures; no external mutations',checks:results},null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});

