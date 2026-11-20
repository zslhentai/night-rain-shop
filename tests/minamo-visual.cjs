// Isolated Chromium check for the exterior shader and the existing indoor scene.
const { chromium } = require('playwright');
const { mkdir, writeFile } = require('node:fs/promises');
const assert = require('node:assert/strict');
const base = new URL(process.argv[2]);
const folder = process.argv[3];
const mobile = process.argv[4] === 'portrait';
const viewport = mobile ? {width:390,height:844} : {width:1440,height:900};
const errors = [];

async function run() {
  await mkdir(folder,{recursive:true});
  const browser = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const context = await browser.newContext({viewport,hasTouch:mobile,isMobile:mobile});
    await context.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => {
        if (callback.name !== 'frame') return request(callback);
        window.captureFrame = callback;
        return 0;
      };
    });
    const page = await context.newPage();
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('console',message=>{
      if (message.type()==='error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text());
    });
    page.on('response',response=>{
      if (response.status()>=400 && !response.url().endsWith('/favicon.ico')) errors.push(response.status()+' '+response.url());
    });
    for (const [release,dir] of [['v6','baseline-v6/'],['fusion','./']]) {
      const url = new URL(dir,base);
      url.searchParams.set('quality',mobile?'low':'high');
      url.searchParams.set('shot','1');
      url.searchParams.set('view','overview');
      await page.goto(url.href);
      await page.waitForFunction(()=>window.S?.coolerSampleState==='ready' && window.captureFrame,{},{timeout:60000});
      for (const view of ['overview','entrance', ...(release==='fusion'?['corner','aisle']:[])]) {
        await page.evaluate(view=>{
          S.setView(view);
          captureFrame(performance.now());
          if(view==='aisle') S.queueNightStock();
        },view);
        if(view==='aisle'){
          await page.waitForFunction(()=>S.stockArtState.aisle==='ready');
          await page.evaluate(()=>captureFrame(performance.now()));
        }
        const measures = await page.evaluate(()=>{
          const reflection=S.scene.getObjectByName('Wet storefront reflections');
          const target=reflection?.material.uniforms.mirrorMap.value.image;
          return {calls:S.renderer.info.render.calls,triangles:S.renderer.info.render.triangles,
            reflection:reflection?.visible??false,reflectionWidth:target?.width,reflectionHeight:target?.height};
        });
        assert(measures.calls>0);
        if(release==='fusion'){
          assert.equal(measures.reflection,view!=='aisle');
          assert.equal(Math.max(measures.reflectionWidth,measures.reflectionHeight),mobile?300:640);
        }
        console.log(release,view,JSON.stringify(measures));
        await page.screenshot({path:folder+'/'+release+'-'+view+'.jpg',type:'jpeg',quality:88,timeout:60000});
      }
      if(release==='fusion'){
        await page.locator('#exit-photo').click();
        // Refresh the disabled shopping action after lazy stock and cabinet mounts.
        await page.evaluate(()=>{for(let i=0;i<6;i++)S.updaters.forEach(fn=>fn(.1*i,.1));});
        await page.locator('#errand-start').click();
        await page.locator('#errand-message').waitFor({state:'visible'});
      }
    }
    assert.deepEqual(errors,[]);
    await writeFile(folder+'/check.json',JSON.stringify({viewport,errors},null,2));
  } finally {
    await browser.close();
  }
}
run().catch(error=>{console.error(error,errors);process.exitCode=1;});
