// Optional browser QA. Serve this checkout from any static server and point
// this runner at it; Playwright and an installed Chromium are test-only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = new URL(process.argv[2] || 'http://localhost:8000/');
const directory = path.resolve(process.argv[3] || 'browser-results');
const output = { rooms: [], errors: [] };
const shots = ['front', 'angle', 'inside', 'shelves', 'checkout', 'cooler', 'fresh'];
fs.mkdirSync(directory, { recursive: true });

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    headless: process.env.HEADED !== '1'
  });
  try {
    for (const [device, width, height] of [['desktop',1440,900], ['mobile',390,844]]) {
      const page = await browser.newPage({ viewport: {width,height}, hasTouch: device==='mobile', isMobile: device==='mobile' });
      await page.addInitScript(() => {
        const frames = window.qaFrames = [];
        const request = window.requestAnimationFrame;
        window.requestAnimationFrame = callback => request(time => {
          frames.push(time);
          if (frames.length > 180) frames.shift();
          callback(time);
        });
      });
      page.on('pageerror', error => output.errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) output.errors.push(message.text());
      });

      await page.goto(base.href);
      await page.waitForFunction(() => Boolean(window.S?.renderer && S.simulationTime > 0), {}, {timeout:12000});
      assert.equal(await page.title(), '雨夜便利店 5.0');
      await page.locator('[data-view="interior"]').click();
      if (device === 'mobile') assert(await page.locator('#joystick').isVisible());
      else {
        const initial = await page.evaluate(() => S.camera.position.z);
        await page.keyboard.down('w');
        try { await page.waitForFunction(z => S.camera.position.z < z-.15, initial, {timeout:3000}); }
        finally { await page.keyboard.up('w'); }
      }
      await page.locator('#photo').click();
      assert(!await page.locator('#controls').isVisible());
      await page.locator('#exit-photo').click();

      for (const quality of ['high','low']) {
        await page.locator('#quality').selectOption(quality);
        for (const view of ['entrance','interior','aisle','checkout','drinks','bento','overview']) {
          const select=page.locator('[data-view="'+view+'"]');
          await select.click();
          await page.evaluate(() => { qaFrames.length=0; });
          await page.waitForFunction(() => qaFrames.length>=35, {}, {timeout:30000});
          output.rooms.push(await page.evaluate(({device,quality,view}) => {
            const info=S.renderer.info;
            let meshes=0;
            S.world.traverse(object => { if (object.isMesh) meshes++; });
            return {
              device,quality,view,meshes,drawCalls:info.render.calls,
              triangles:info.render.triangles,geometryBuffers:info.memory.geometries,textures:info.memory.textures,
              frameRate:Number((1000*(qaFrames.length-1)/(qaFrames.at(-1)-qaFrames[0])).toFixed(1)),
              renderer:S.renderer.getContext().getParameter(S.renderer.getContext().RENDERER)
            };
          }, {device,quality,view}));
        }
      }
      for (const version of ['before','after']) {
        for (const shot of shots) {
          await page.goto(new URL('compare/'+version+'.html?shot='+shot,base).href);
          await page.waitForFunction(() => Boolean(window.S?.renderer && S.renderer.info.render.calls > 0));
          await page.screenshot({path:path.join(directory,[device,version,shot].join('-')+'.png')});
        }
      }
      await page.close();
    }
    assert.deepEqual(output.errors,[]);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  output.failure=String(error);
  console.error(error);
  process.exitCode=1;
}).finally(() => {
  fs.writeFileSync(path.join(directory,'metrics.json'),JSON.stringify(output,null,2));
});
