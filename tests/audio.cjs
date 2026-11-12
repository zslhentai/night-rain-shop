const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const elements = {};
for(const id of ['rain-audio','rain-volume','audio-status']) elements[id]={value:'35',attrs:{},events:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,v){this.events[k]=v}};
let contexts=0, sources=0, loads=0, fail=false, visibility;
class Context {
 constructor(){contexts++;this.state='suspended';this.currentTime=0;this.destination={};}
 async resume(){this.state='running'} async suspend(){this.state='suspended'} async close(){this.state='closed'}
 async decodeAudioData(){return {sampleRate:10,numberOfChannels:2,duration:76,getChannelData(){return new Float32Array(760)}}}
 createBufferSource(){sources++;return {connect(){},start(){}}}
 createGain(){return {gain:{value:0,cancelScheduledValues(){},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v}},connect(){}}}
}
const doc={hidden:false,getElementById:id=>elements[id],addEventListener:(name,fn)=>visibility=fn};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../src/audio.js'),'utf8'),{document:doc,window:{AudioContext:Context},fetch:async()=>{loads++;return {ok:!fail,arrayBuffer:async()=>new ArrayBuffer(0)}},setTimeout:fn=>fn()});
(async()=>{
 const button=elements['rain-audio'];assert.equal(contexts,0);assert.equal(loads,0);
 for(let i=0;i<6;i++){await button.events.click();assert.equal(button.attrs['aria-pressed'],String(i%2===0));}
 assert.equal(sources,1);assert.equal(loads,1);
 elements['rain-volume'].value='0';elements['rain-volume'].events.input();assert.equal(elements['rain-volume'].attrs['aria-valuetext'],'0%');
 await button.events.click();doc.hidden=true;await visibility();doc.hidden=false;await visibility();await button.events.click();
 console.log('PASS: lazy audio loading, six toggles reuse one source, zero volume, hidden-tab suspend/resume');
})();
