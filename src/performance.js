/* Optional in-browser diagnostics. Time measurements run on the browser CPU. */
(function(S){
  var options=new URLSearchParams(location.search);
  var startupMarks=Object.create(null);
  var maxWindowSize=240;

  S.perf={
    mark:function(label){startupMarks[label]=performance.now();},
    interaction:function(){}
  };

  function rounded(value){return Math.round(value*10)/10;}

  S.installPerformancePanel=function(renderer){
    var panel=document.getElementById('perf-panel'), toggle=document.getElementById('perf-toggle');
    if(!panel || !toggle) return;
    var output=document.getElementById('perf-readout'), graph=document.getElementById('perf-graph');
    var showGraph=document.getElementById('perf-show-graph'), details=document.getElementById('perf-marks');
    var copy=document.getElementById('perf-copy'), exportField=document.getElementById('perf-export');
    var frames=new Float32Array(maxWindowSize), interactions=Object.create(null);
    var length=0, cursor=0, previous=0, lastDraw=0;
    var firstSceneWindow=0, scenePeak=0, firstAssetWindow=0, assetPeak=0;
    var currentInteraction=null, submit=0, open=false;
    var latest=null;

    function reset(){
      length=0;
      cursor=0;
      previous=0;
      lastDraw=0;
      latest=null;
      output.textContent='采样中…';
    }
    function setOpen(value){
      open=value;
      panel.hidden=!value;
      toggle.setAttribute('aria-expanded',String(value));
      renderer.info.autoReset=!value;
      if(value) reset();
    }
    toggle.disabled=false;
    toggle.onclick=function(){setOpen(!open);};
    document.getElementById('perf-close').onclick=function(){setOpen(false);};
    document.getElementById('perf-reset').onclick=function(){
      reset();
      interactions=Object.create(null);
      currentInteraction=null;
      exportField.hidden=true;
    };
    showGraph.onchange=function(){graph.hidden=!showGraph.checked;};
    document.addEventListener('visibilitychange',function(){if(open) reset();});
    setOpen(options.get('perf')==='1');

    function drawGraph(values){
      var ctx=graph.getContext('2d'), width=graph.width,height=graph.height;
      if(!ctx) return;
      ctx.clearRect(0,0,width,height);
      [16.7,33.3].forEach(function(limit){
        var heightAt=height-limit/70*height;
        ctx.fillStyle='#556670';
        ctx.fillRect(0,heightAt,width,1);
      });
      ctx.beginPath();
      ctx.strokeStyle='#aee1c7';
      var step=width/Math.max(1,values.length-1);
      values.forEach(function(ms,index){
        var y=height-Math.min(ms,70)/70*height;
        if(index) ctx.lineTo(index*step,y);
        else ctx.moveTo(0,y);
      });
      ctx.stroke();
    }

    function snapshot(){
      var values=[];
      for(var i=0;i<length;i++) values.push(frames[(cursor-length+i+maxWindowSize)%maxWindowSize]);
      var total=values.reduce(function(sum,value){return sum+value;},0);
      var sorted=values.slice().sort(function(a,b){return a-b;});
      var avg=total/length, timing=renderer.info.render;
      var report={
        variant:S.coolerSampleState, tuning:S.legacyTuning?'legacy':'optimized', quality:S.quality, view:S.view,
        viewport:innerWidth+' × '+innerHeight, devicePixelRatio:window.devicePixelRatio||1,
        buffer:renderer.domElement.width+' × '+renderer.domElement.height, pixelRatio:renderer.getPixelRatio(),
        samples:length, approximateSeconds:rounded(total/1000), fps:rounded(1000/avg), frameMeanMs:rounded(avg),
        frameP95Ms:rounded(sorted[Math.ceil(length*.95)-1]), frameMaxMs:rounded(sorted[length-1]),
        framesAbove33ms:values.filter(function(ms){return ms>33.4;}).length,
        calls:timing.calls, triangles:timing.triangles, cpuSubmitMs:rounded(submit),
        geometries:renderer.info.memory.geometries, textures:renderer.info.memory.textures,
        shaderPrograms:renderer.info.programs.length, shadowMap:renderer.shadowMap.enabled,
        startupMs:Object.fromEntries(Object.entries(startupMarks).map(function(entry){return [entry[0],rounded(entry[1])];})),
        sceneFirst1500msPeak:scenePeak?rounded(scenePeak):null,
        assetFirst1500msPeak:assetPeak?rounded(assetPeak):null,
        interactions:Object.fromEntries(Object.entries(interactions).map(function(entry){return [entry[0],entry[1].peak];}))
      };
      if(showGraph.checked) drawGraph(values);
      return report;
    }
    function display(){
      latest=snapshot();
      output.textContent=latest.fps+' FPS · 平均 '+latest.frameMeanMs+' ms · P95 '+latest.frameP95Ms+' ms\n'+
        'Draw calls '+latest.calls+' · 三角面 '+latest.triangles.toLocaleString()+'\n'+
        '像素比 '+rounded(latest.pixelRatio)+' / '+latest.devicePixelRatio+' · '+latest.buffer;
      details.textContent=Object.entries(latest.startupMs).map(function(entry){return entry[0]+' '+entry[1]+' ms';}).join('\n')+
        (latest.sceneFirst1500msPeak===null?'':'\n场景首帧后 1.5 秒最大帧间隔 '+latest.sceneFirst1500msPeak+' ms')+
        (latest.assetFirst1500msPeak===null?'':'\n新版首帧后 1.5 秒最大帧间隔 '+latest.assetFirst1500msPeak+' ms')+
        Object.keys(interactions).map(function(name){return '\n'+name+'后 1 秒最大帧间隔 '+interactions[name].peak+' ms';}).join('');
    }
    copy.onclick=function(){
      if(!latest) return;
      var text=JSON.stringify(latest,null,2);
      function showExport(){
        exportField.hidden=false;
        exportField.value=text;
        exportField.select();
      }
      if(navigator.clipboard) navigator.clipboard.writeText(text).then(function(){copy.textContent='已复制';},showExport);
      else showExport();
    };
    S.perf.beforeFrame=function(){
      if(!open) return 0;
      renderer.info.reset();
      return performance.now();
    };
    S.perf.frame=function(stamp,started){
      if(!open) return;
      submit=performance.now()-started;
      if(previous){
        var ms=stamp-previous;
        if(ms>0){
          if(stamp<firstSceneWindow) scenePeak=Math.max(scenePeak,ms);
          if(stamp<firstAssetWindow) assetPeak=Math.max(assetPeak,ms);
          frames[cursor]=ms;
          cursor=(cursor+1)%maxWindowSize;
          length=Math.min(length+1,maxWindowSize);
          if(currentInteraction && stamp<=currentInteraction.until) {
            currentInteraction.peak=rounded(Math.max(currentInteraction.peak,ms));
          }
        }
      }
      previous=stamp;
      if(length>0 && stamp-lastDraw>=750){
        lastDraw=stamp;
        display();
      }
    };
    S.perf.sceneFrame=function(){firstSceneWindow=performance.now()+1500;};
    S.perf.assetFrame=function(){firstAssetWindow=performance.now()+1500;};
    S.perf.interaction=function(name){
      if(!open) return;
      currentInteraction={peak:0,until:performance.now()+1000};
      interactions[name]=currentInteraction;
    };
    S.perf.reset=function(keepPrevious){
      if(!open) return;
      var latestStamp=previous;
      reset();
      if(keepPrevious) previous=latestStamp;
    };
    S.perf.report=function(){return latest;};
  };
})(window.S);
