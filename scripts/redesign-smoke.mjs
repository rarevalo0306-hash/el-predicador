import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const browser = await chromium.launch({headless:true});
const base=process.argv[2] ?? 'http://localhost:8080';
mkdirSync('screenshots/redesign',{recursive:true});
for(const width of [390,1280,320]) {
 const page=await browser.newPage({viewport:{width,height:844},locale:'es-ES'});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'Un momento para ti.'}).waitFor({timeout:60000});
 await page.locator('.daily-landscape > img').evaluate(img => img.decode());
 await page.screenshot({path:`screenshots/redesign/${base.includes('8081')?'built':'dev'}-${width}.png`,fullPage:true});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw new Error(`overflow ${width}`);
 await page.getByRole('button',{name:'Abrir lectura',exact:true}).click();
 await page.getByRole('navigation').getByRole('button',{name:'Biblia',exact:true}).waitFor();
 if(await page.getByRole('navigation').getByRole('button',{name:'Biblia',exact:true}).getAttribute('aria-current')!=='page')throw new Error('Bible did not open');
 await page.getByRole('navigation').getByRole('button',{name:'Hoy',exact:true}).click();
 await page.getByText('Sigue donde lo dejaste',{exact:true}).waitFor();
 await page.getByRole('button',{name:/Continuar lectura/}).click();
 await page.getByRole('navigation').getByRole('button',{name:'Hoy',exact:true}).click();
 await page.getByRole('button',{name:'Ver temas',exact:true}).click();
 if(await page.getByRole('navigation').getByRole('button',{name:'Temas',exact:true}).getAttribute('aria-current')!=='page')throw new Error('Themes did not open');
 console.log(JSON.stringify({base,width,errors,ok:errors.length===0}));
 await page.close();
}
await browser.close();
