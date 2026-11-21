// Production WebGL smoke test and matching baseline photos in Chromium.
const {chromium}=require('playwright');
const {mkdir,writeFile}=require('node:fs/promises');
const assert=require('node:assert/strict');
const base=new URL(process.argv[2]), folder=process.argv[3];
const portrait=process.argv[4]==='portrait';
const viewport=portrait?{width:390,height:844}:{width:1440,height:900};
const errors=[], captures=[];

async function run(){
  await mkdir(folder,{recursive:true});
  const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const context=await browser.newContext({viewport,hasTouch:portrait,isMobile:portrait});
    await context.addInitScript(()=>{
      const request=requestAnimationFrame.bind(window);
      window.requestAnimationFrame=fn=>{
        if(fn.name!=='frame') return request(fn);
        window.captureFrame=fn;
        return 0;
      };
    });
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('console',message=>{
      if(message.type()==='error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text());
    });
    page.on('response',response=>{
      if(response.status()>=400 && !response.url().endsWith('/favicon.ico')) errors.push(response.status()+' '+response.url());
    });

    async function capture(release,view,suffix=view){
      const measure=await page.evaluate(view=>{
        S.setView(view);
        captureFrame(performance.now());
        const {calls,triangles}=S.renderer.info.render;
        return {calls,triangles,batches:S.staticSceneryStats};
      },view);
      assert(measure.calls>0);
      captures.push({release,view,suffix,...measure});
      console.log(release,suffix,JSON.stringify(measure));
      await page.screenshot({path:folder+'/'+release+'-'+suffix+'.jpg',type:'jpeg',quality:88,timeout:60000});
    }

    for(const release of ['before','after']){
      const url=new URL(release==='before'?'baseline-v6/':'./',base);
      url.searchParams.set('quality',portrait?'low':'high');
      url.searchParams.set('shot','1');
      await page.goto(url.href);
      await page.waitForFunction(()=>window.S?.coolerSampleState==='ready' && window.captureFrame,{},{timeout:60000});
      if(release==='after') await page.waitForFunction(()=>S.streetArtState==='ready',{},{timeout:30000});
      for(const view of ['corner','overview','entrance','stop','diner']) await capture(release,view);
      if(release==='after'){
        await capture(release,'alley');
        await page.evaluate(()=>{
          S.rainIntensity=1.28;
          for(let i=0;i<16;i++) S.updaters.forEach(fn=>fn(5+i*.06,.06));
        });
        await capture(release,'entrance','heavy-rain');
        await page.evaluate(()=>{
          S.rainIntensity=1;
          S.setView('stop');
          let t;
          for(let i=0;i<1400 && !S.bus.canBoard;i++){
            t=i*.05; S.updateTraffic(t); S.updaters.forEach(fn=>fn(t,.05));
          }
          if(!S.bus.canBoard) throw Error('Bus did not stop and open its doors');
          S.camera.position.set(11.55,1.72,3.73);
          S.camera.lookAt(11.62,1.35,7.0);
          captureFrame(performance.now());
        });
        await page.screenshot({path:folder+'/after-bus-arrival.jpg',type:'jpeg',quality:88,timeout:60000});
      }
    }
    // Exercise the same public controls users touch, then integrate keyboard
    // movement in fixed increments to keep SwiftShader timings out of the test.
    await page.locator('#exit-photo').click();
    if(portrait) await page.locator('#views-toggle').click();
    await page.locator('[data-view="street-walk"]').click();
    await page.locator('#street-walk-hint').waitFor({state:'visible'});
    await page.locator('#inspect-product').waitFor({state:'hidden'});
    if(portrait){
      const cdp=await context.newCDPSession(page);
      const rect=await page.locator('#joystick').boundingBox();
      assert(rect);
      const x=rect.x+rect.width/2, y=rect.y+rect.height/2;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-25,id:1}]});
      const moved=await page.evaluate(()=>{
        const p=S.camera.position.z;
        S.updateWalk(.12);
        return p-S.camera.position.z;
      });
      assert(moved>.08,'Touch joystick did not move the camera');
      const before=await page.evaluate(()=>S.camera.quaternion.toArray());
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y-25,id:1},{x:284,y:386,id:2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-25,id:1},{x:319,y:374,id:2}]});
      const turn=await page.evaluate(()=>S.camera.quaternion.toArray());
      assert(turn.some((v,i)=>Math.abs(v-before[i])>.016),'Right thumb should turn the camera while joystick is held');
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.screenshot({path:folder+'/after-touch-controls.jpg',type:'jpeg',quality:88,timeout:60000});
    }
    await page.evaluate(()=>{S.setView('street-walk');S.bus.phase='away';S.updateTraffic(14);});
    await page.keyboard.down('KeyW');
    const crossed=await page.evaluate(()=>{
      function walkTo(x,z){
        const p=S.camera.position;
        S.camera.lookAt(x,p.y,z);
        for(let i=0;i<220 && Math.hypot(x-p.x,z-p.z)>.1;i++) S.updateWalk(.03);
        return Math.hypot(x-p.x,z-p.z)<.11;
      }
      if(!walkTo(12.18,2.15)||!walkTo(3.83,2.15)||!walkTo(3.83,.32)||!walkTo(-.8,.32)) return false;
      walkTo(-.8,-2.36);
      if(!S.cameraAtDoor()) return false;
      for(let i=0;i<50;i++) S.updaters.forEach(fn=>fn(310+i/30,1/30));
      return walkTo(-.8,-2.36) && S.isStoreView(S.view);
    });
    await page.keyboard.up('KeyW');
    assert(crossed,'Walking controls did not follow the crossing into the store');
    await page.evaluate(()=>captureFrame(performance.now()));
    await page.locator('#inspect-product').waitFor({state:'visible'});
    assert.deepEqual(errors,[]);
    await writeFile(folder+'/check.json',JSON.stringify({viewport,errors,captures,walk:true,touch:portrait},null,2));
  }finally{await browser.close();}
}
run().catch(error=>{console.error(error,errors);process.exitCode=1;});
