// Live GET-only visual acceptance. All writes are blocked; no business records change.
const { chromium } = require(process.env.M10_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const context = await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'reduce'});
 const page = await context.newPage();
 const errors = [], results = [], contrastIssues = [];
 page.on('pageerror', e => errors.push(e.message));
 await page.route(url => url.pathname.startsWith('/api/'), async route => {
   if (route.request().method() !== 'GET') throw Error('Unexpected live mutation');
   const response = await route.fetch({url:(process.env.M106_API || 'http://127.0.0.1:8788')+new URL(route.request().url()).pathname});
   await route.fulfill({response,headers:{...response.headers(),'access-control-allow-origin':'*'}});
 });
 const go = async path => {
   await page.goto('http://127.0.0.1:5173'+path);
   await page.locator('main h1').waitFor();
   await page.waitForLoadState('networkidle');
   assert.equal(await page.getByRole('alert').count(),0);
 };
 await go('/customers');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
 const customer = await page.locator('tbody a').first().getAttribute('href');
 assert(customer);
 await page.getByRole('button',{name:'Switch to dark mode'}).click();
 await page.reload();
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await page.emulateMedia({colorScheme:'light'});
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 results.push('System preference on first load; toggle persists across reload and overrides system');
 fs.mkdirSync('screenshots/m106',{recursive:true});
 for (const theme of ['dark','light']) {
   if (await page.locator('html').getAttribute('data-theme') !== theme) await page.getByRole('button',{name:`Switch to ${theme} mode`}).click();
   for (const width of [320,768,1440]) {
     await page.setViewportSize({width,height:1000});
     for (const path of ['/dashboard','/customers','/approvals','/analytics',customer]) {
       await go(path);
       assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
       assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${theme} ${width} ${path}`);
       const name = path.startsWith('/customers/')?'customer360':path.slice(1);
       await page.screenshot({path:`screenshots/m106/${name}-${theme}-${width}.png`,fullPage:true});
       const issues = await page.locator('.rr-shell').evaluate(root => {
         const rgb = c => (c.match(/[\d.]+/g)||[]).map(Number);
         const lum = c => c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
         const found=[];
         for(const el of root.querySelectorAll('*')) {
           if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()) || !el.getClientRects().length || el.closest('button:disabled'))continue;
           const s=getComputedStyle(el); let ancestor=el,bg;
           while(ancestor){const c=rgb(getComputedStyle(ancestor).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}ancestor=ancestor.parentElement;}
           if(!bg)continue;
           const a=lum(rgb(s.color)),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
           const large=parseFloat(s.fontSize)>=24 || (parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700);
           if(ratio<(large?3:4.5))found.push({text:el.textContent.trim().slice(0,55),class:el.className,ratio});
         }
         return found;
       });
       if(issues.length)contrastIssues.push({theme,width,path,issues});
       await page.keyboard.press('Tab');
       await page.locator('.theme-toggle').focus();
       assert.equal(await page.locator('.theme-toggle').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
       results.push(`${name} ${theme} ${width}: live data, no overflow, screenshot, keyboard focus`);
     }
   }
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync('screenshots/m106/results.json',JSON.stringify({results,contrastIssues,errors},null,2));
 console.log(JSON.stringify({checks:results.length,contrastIssues},null,2));
 assert.equal(contrastIssues.length,0);
 // Storage-denied users can still open the app and switch for this session.
 const blocked = await browser.newContext({colorScheme:'dark'});
 await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}}));
 const blockedPage=await blocked.newPage();
 await blockedPage.route('**/api/**',r=>r.fulfill({status:503,json:{error:'offline'}}));
 await blockedPage.goto('http://127.0.0.1:4173/dashboard');
 await blockedPage.getByRole('button',{name:'Switch to light mode'}).click();
 assert.equal(await blockedPage.locator('html').getAttribute('data-theme'),'light');
 results.push('Production build: storage denied fallback and toggle');
 fs.writeFileSync('screenshots/m106/results.json',JSON.stringify({results,contrastIssues,errors},null,2));
 console.log('PASS storage denied fallback and toggle');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
