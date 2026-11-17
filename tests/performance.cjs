const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const elements=new Map();
let now=0;
const document={
  getElementById(id){
    if(!elements.has(id)) elements.set(id,{
      setAttribute(){}, value:'', hidden:true,
      select(){}, getContext(){return {clearRect(){},fillRect(){},beginPath(){},lineTo(){},moveTo(){},stroke(){}};}
    });
    return elements.get(id);
  },
  addEventListener(){}
};
const window={S:{coolerSampleState:'ready',quality:'high',view:'cooler-art'},devicePixelRatio:3};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/performance.js'),'utf8'),{
  window, document, location:{search:'?perf=1'}, URLSearchParams, innerWidth:390, innerHeight:844,
  performance:{now:()=>now}, navigator:{}
});
const {S}=window;
const renderer={
  info:{reset(){},render:{calls:321,triangles:48123},programs:[],memory:{geometries:11,textures:4}},
  shadowMap:{enabled:true}, domElement:{width:624,height:1350}, getPixelRatio:()=>1.6
};
S.installPerformancePanel(renderer);
assert.equal(renderer.info.autoReset,false);
S.perf.mark('场景首帧提交');
S.perf.assetFrame();
S.perf.interaction('开柜门');
document.getElementById('perf-show-graph').checked=true;
for(let i=0;i<150;i++){
  now+=i===10?56:1000/60;
  const started=S.perf.beforeFrame();
  S.perf.frame(now,started);
}
const report=S.perf.report();
assert(report.fps>58 && report.fps<=60);
assert.equal(report.frameMaxMs,56);
assert.equal(report.frameP95Ms,16.7);
assert.equal(report.calls,321);
assert.equal(report.triangles,48123);
assert.equal(report.pixelRatio,1.6);
assert.equal(report.assetFirst1500msPeak,56);
assert.equal(report.interactions['开柜门'],56);
document.getElementById('perf-copy').onclick();
assert.equal(JSON.parse(document.getElementById('perf-export').value).fps,report.fps);
S.perf.reset();
assert.equal(S.perf.report(),null);
document.getElementById('perf-close').onclick();
assert.equal(renderer.info.autoReset,true);
assert.equal(S.perf.beforeFrame(),0);
console.log('PASS: diagnostic FPS, P95, draw calls, startup/interaction spikes, export and toggle');
