// Run against Vite on 5175 (demo) and 5176 (development). See README M11.2.
const { chromium } = require(process.env.M10_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const now = '2026-09-09T10:00:00Z';
const customers = Array.from({ length: 32 }, (_, i) => ({
  id: `account-${i}`, full_name: i === 0 ? 'Alex Rivera' : `Customer ${i}`,
  company: i === 0 ? 'Northstar Logistics' : `Company ${i}`, email: `customer${i}@example.test`,
  account_value: i === 0 ? 0 : i === 1 ? 9876543210.25 : 180000,
  owner: i === 0 ? null : i % 2 ? 'Jamie Santos' : 'Morgan Lee',
  customer_health_status: i % 2 ? 'at_risk' : 'healthy', lifecycle_status: i % 2 ? 'active' : 'onboarding',
  last_activity_at: i === 0 ? null : now, created_at: now, updated_at: now,
}));
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
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
 for (const [port, demo] of [[5175,true],[5176,false]]) {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  let writes=0;
  await page.route(url=>url.pathname.startsWith('/api/'), async route=>{
   const p=new URL(route.request().url()).pathname;
   if(route.request().method()==='POST') {
    if(p.endsWith('/ai-assistance')) return route.fulfill({json:{provider:'fallback',data:{risk_summary:'Demo summary',recommended_next_action:'Review',draft_message:'Hello'}}});
    writes++; return route.fulfill({json:{data:seedInterventions[0]}});
   }
   let data;
   if(p==='/api/customers') data=customers;
   else if(p==='/api/interventions') data=seedInterventions;
   else if(p==='/api/analytics') data=analytics;
   else if(p.endsWith('/risk')) data={score:85,risk_level:'critical'};
   else if(p.endsWith('/events')||p.endsWith('/signals')) data=[];
   else data=customers[3];
   return route.fulfill({json:{data}});
  });
  const go=async path=>{await page.goto('http://127.0.0.1:'+port+path); await page.locator('main h1').waitFor();};
  await go('/approvals');
  await page.getByRole('button',{name:'Approve',exact:true}).first().waitFor();
  for(const name of ['Approve','Reject','Execute','Retry','Mark Recovered','Mark Not Recovered']) {
   const buttons=page.getByRole('button',{name,exact:true});
   assert(await buttons.count()>0,name);
   for(const b of await buttons.all()) assert.equal(await b.isDisabled(),demo,name);
  }
  assert.equal(await page.getByText('Public demo',{exact:true}).count(),demo?1:0);
  if(demo) assert(await page.getByText('Actions disabled',{exact:true}).isVisible());
  await go('/customers/account-3');
  const approval=page.getByRole('button',{name:'Request Approval',exact:true});
  await approval.waitFor(); assert.equal(await approval.isDisabled(),demo);
  await page.getByRole('button',{name:'Generate AI Assistance',exact:true}).click();
  await page.getByText('Demo summary',{exact:true}).waitFor();
  // Exercise the actual client module, bypassing disabled UI.
  const results=await page.evaluate(async()=>{
   const client=await import('/src/api/client.ts');
   return Promise.all([
    ()=>client.createIntervention({customer_id:'test',playbook_id:'test',type:'test',recommended_action:'test'}),
    ()=>client.approveIntervention('test'),()=>client.rejectIntervention('test'),
    ()=>client.executeIntervention('test'),()=>client.recordInterventionOutcome('test','recovered')
   ].map(async call=>{try{await call();return 'allowed';}catch(e){return e.message;}}));
  });
  assert(results.every(r=>r===(demo?'Actions are disabled in the public demo.':'allowed')));
  assert.equal(writes,demo?0:5);
  await go('/customers');
  await page.getByLabel('Search customers',{exact:true}).fill('Northstar');
  await page.waitForFunction(()=>document.querySelectorAll('.customer-table tbody tr').length===1);
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Refresh customers',exact:true}).isDisabled(),false);
  await page.getByRole('button',{name:'Refresh customers',exact:true}).click();
  const previousTheme=await page.evaluate(()=>document.documentElement.dataset.theme);
  await page.getByRole('button',{name:/Switch to .* mode/}).click();
  assert.notEqual(await page.evaluate(()=>document.documentElement.dataset.theme),previousTheme);
  await page.getByRole('link',{name:'Analytics',exact:true}).click();
  await page.getByRole('button',{name:'Refresh analytics',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Refresh analytics',exact:true}).isDisabled(),false);
  for(const width of [320,1440]) {
   await page.setViewportSize({width,height:1000});
   if(demo) {
    assert(await page.getByText('Public demo',{exact:true}).isVisible());
    assert(await page.getByText('Actions disabled',{exact:true}).isVisible());
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(demo) await page.screenshot({path:process.env.M11_SCREENSHOT_DIR+'/m112-demo-'+width+'.png',fullPage:true});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS '+(demo?'demo':'development')+': controls, client guards, assistance, filters, refresh, navigation, responsive layout');
  await page.close();
 }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
