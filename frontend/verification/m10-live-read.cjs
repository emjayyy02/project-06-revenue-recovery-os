// Run from the repository root; see M10_VERIFICATION.md. No package installation required.
const {chromium}=require(process.env.M10_PLAYWRIGHT || 'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(url=>url.pathname.startsWith('/api/'),async route=>{if(route.request().method()!=='GET')return route.abort();const response=await route.fetch({url:'http://127.0.0.1:8787'+new URL(route.request().url()).pathname});return route.fulfill({response,headers:{...response.headers(),'access-control-allow-origin':'*'}})});
await page.goto('http://127.0.0.1:5175/customers');
await page.waitForFunction(()=>document.querySelector('.customer-table tbody tr')&&!document.querySelector('.operations-header button').disabled);
console.log('Live customers:',await page.locator('tbody tr').count());
assert.equal(await page.getByRole('alert').count(),0);
const customerLink=await page.locator('.customer-table tbody a').first().getAttribute('href');
await page.screenshot({path:'screenshots/m10-customers-live.png'});
for(const path of ['/approvals','/dashboard','/analytics',customerLink]){
await page.goto('http://127.0.0.1:5175'+path);
await page.locator('main h1').waitFor();
await page.waitForFunction(()=>!document.querySelector('main [aria-busy="true"]'));
await page.waitForLoadState('networkidle');
assert.equal(await page.getByRole('alert').count(),0);
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
console.log('Live read-only page PASS:',path.startsWith('/customers/')?'Customer 360':path);
if(path==='/approvals') await page.screenshot({path:'screenshots/m10-approvals-live.png'});
}
assert.deepEqual(errors,[]);
await page.unrouteAll({behavior:'wait'});
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
