// One active WebGL scene at a time. The two releases use matching camera poses.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=new URL(process.argv[2]);
const output=path.resolve(process.argv[3] || 'review-output');
fs.mkdirSync(output,{recursive:true});
const result={renderer:'Chromium headless / ANGLE SwiftShader',views:[],errors:[]};

async function run(){
  const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    for(const [device,width,height] of [['desktop',1440,900],['portrait',390,844]]){
      for(const release of ['v5','v6']){
        const context=await browser.newContext({viewport:{width,height},hasTouch:device==='portrait',isMobile:device==='portrait'});
        const page=await context.newPage();
        page.setDefaultTimeout(45000);
        page.on('pageerror',e=>result.errors.push(String(e)));
        page.on('console',e=>{if(e.type()==='error') result.errors.push(e.text());});
        page.on('response',r=>{if(r.status()>=400 && !r.url().endsWith('favicon.ico')) result.errors.push(r.status()+' '+r.url());});
        const url=new URL(release==='v5'?'compare/night-v5.html':'./',base);
        url.search='?view=aisle&quality=high';
        await page.goto(url.href);
        await page.waitForFunction(()=>window.S?.coolerSampleState==='ready');
        if(release==='v5') await page.locator('#exit-photo').click();
        if(release==='v6') await page.waitForFunction(()=>S.stockArtState.aisle==='ready' && S.stockArtState.fresh==='ready');
        for(const view of ['aisle','bento','checkout','entrance','cooler-art']){
          const button=page.locator('[data-view="'+view+'"]');
          if(!await button.isVisible()) await page.locator('#views-toggle').click();
          await button.click();
          if(release==='v6')await page.locator('#settings-toggle').click();
          await page.locator('#photo').click();
          await page.waitForFunction(v=>S.view===v,view);
          await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
          const stats=await page.evaluate(()=>({calls:S.renderer.info.render.calls,triangles:S.renderer.info.render.triangles,
            eye:S.camera.position.toArray(),fov:S.camera.fov,objects:S.renderer.info.memory.geometries,textures:S.renderer.info.memory.textures}));
          assert(stats.calls>0 && stats.triangles>1000);
          await page.screenshot({path:path.join(output,[device,release,view].join('-')+'.jpg'),type:'jpeg',quality:88});
          result.views.push({device,release,view,...stats});
          await page.locator('#exit-photo').click();
          if(release==='v6' && await page.locator('#settings-list').isVisible()) await page.locator('#settings-toggle').click();
        }
        if(release==='v6'){
          if(device==='portrait') await page.locator('#views-toggle').click();
          await page.locator('[data-view="bento"]').click();
          await page.locator('#errand-start').click();
          await page.locator('#errand-message').waitFor({state:'visible'});
          await page.screenshot({path:path.join(output,device+'-shopping-ui.jpg'),type:'jpeg',quality:88});
          await page.locator('#errand-exit').click();
        }
        await context.close();
      }
    }
    for(const before of result.views.filter(v=>v.release==='v5')){
      const after=result.views.find(v=>v.device===before.device && v.view===before.view && v.release==='v6');
      assert.deepEqual(before.eye,after.eye);assert.equal(before.fov,after.fov);
    }
    assert.deepEqual(result.errors,[]);
  }finally{await browser.close();}
}
run().catch(e=>{result.failure=String(e);console.error(e);process.exitCode=1;}).finally(()=>{
  fs.writeFileSync(path.join(output,'review.json'),JSON.stringify(result,null,2));
});
