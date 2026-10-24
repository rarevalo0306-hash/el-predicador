import { chromium } from 'playwright';
const browser=await chromium.launch();
const base=process.argv[2]??'http://localhost:8080';
try {for(const colorScheme of ['light','dark']) for(const locale of ['es-ES','en-US']) {
 const page=await browser.newPage({viewport:{width:390,height:844},colorScheme,locale});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.getByRole('heading',{name:locale==='es-ES'?'Un momento para ti.':'A moment for you.'}).waitFor({timeout:60000});
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode().catch(()=>{}))));
 const state=await page.locator('.app-tab-bar').evaluate(el=>({blur:getComputedStyle(el).backdropFilter,bottom:el.getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth>innerWidth}));
 if(state.overflow||state.bottom>844||state.blur==='none'||errors.length)throw new Error(JSON.stringify({state,errors}));
 await page.screenshot({path:`screenshots/redesign/glass-${base.includes('8081')?'built':'dev'}-${colorScheme}-${locale}.png`});
 await page.locator('.app-tab-bar').getByRole('button',{name:locale==='es-ES'?'Más':'More',exact:true}).click();
 await page.getByRole('dialog').waitFor();
 console.log(JSON.stringify({colorScheme,locale,state,ok:true}));await page.close();
}}finally{await browser.close();}
