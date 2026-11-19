/* One optional order. Reservations belong to the basket until returned or paid. */
(function(S){
  var order=null, screen=null, previousScreen=null, receipt=null, previousReceipt=null, lastItem=null, carriedBag=null;
  var scanner=new THREE.Vector3(), bagging=new THREE.Vector3(), scanAge=0;
  function clearItem(){
    if(lastItem){S.world.remove(lastItem);lastItem=null;}
  }
  var panel,message,next,undo,exit,start;
  var drinkIds=['water','tea','soda','can','coffee','milk','juice'];
  var freshIds=['bento','sandwich','onigiri'];
  function category(item){
    if(drinkIds.includes(item.id)) return 'drink';
    if(freshIds.includes(item.id)) return 'fresh';
  }
  S.canBasket=function(item){
    var kind=category(item);
    return !!(order && order.phase==='choose' && kind && !order.items.some(row=>row.kind===kind));
  };
  S.addBasket=function(ticket,item){
    if(!S.canBasket(item)){S.releaseSlot(ticket);return;}
    order.items.push({ticket:ticket,item:item,kind:category(item)});
    refresh();
  };
  function atRegister(){
    var p=S.camera.position, pay=S.layout.interior.pay;
    return S.isStoreView(S.view) && Math.hypot(p.x-pay[0],p.z-pay[1])<1.25;
  }
  function available(){return S.registerStaffAvailable!==false;}
  function total(){return order.items.reduce((sum,row)=>sum+row.item.price,0);}
  function showScreen(label,amount,paid){
    var old=screen;
    screen=S.makeRegisterDisplay(label,amount,paid);
    S.registerScreen.map=screen;
    if(old) old.dispose();
  }
  function unlock(){
    if(!S.checkoutClaimed) return;
    S.checkoutClaimed=false;
    if(S.registerScreen.map===screen) S.registerScreen.map=previousScreen || S.registerIdle;
    if(screen) screen.dispose();
    screen=null;previousScreen=null;
    S.receipt.visible=false;
    if(receipt){S.receipt.material=previousReceipt;receipt.map.dispose();receipt.dispose();receipt=null;}
    clearItem();
  }
  function finish(){
    if(!order) return;
    S.returnProduct();
    if(order.phase!=='paid' && order.phase!=='carry') order.items.forEach(row=>S.releaseSlot(row.ticket));
    unlock();
    if(carriedBag){S.camera.remove(carriedBag);carriedBag=null;}
    order=null;panel.hidden=true;start.hidden=false;
  }
  function commit(){
    if(!order || !atRegister() || order.items.length!==2) return;
    if(order.phase==='paid'){
      unlock();
      carriedBag=S.people[0].bag.clone();
      carriedBag.visible=true;carriedBag.position.set(.23,-.20,-.62);carriedBag.rotation.set(0,-.25,.06);
      S.camera.add(carriedBag);order.phase='carry';refresh();return;
    }
    if(order.phase==='choose'){
      if(!available()) return;
      S.checkoutClaimed=true;previousScreen=S.registerScreen.map;
      order.phase='scan';order.scanned=0;
    }
    if(order.phase==='scan'){
      var row=order.items[order.scanned++];
      showScreen(row.item.title,row.item.price,false);
      clearItem();scanAge=0;
      lastItem=new THREE.Mesh(row.ticket.mesh.geometry,row.ticket.mesh.material);
      lastItem.position.copy(scanner); S.world.add(lastItem);
      if(S.playSceneSound) S.playSceneSound('scan');
      if(order.scanned===order.items.length) order.phase='pay';
    }else if(order.phase==='pay'){
      order.items.forEach(r=>S.markPurchased(r.ticket,r.kind));
      order.phase='paid'; S.receipt.visible=true;
      previousReceipt=S.receipt.material;
      receipt=previousReceipt.clone();
      receipt.map=S.tex.label('お買上票','¥'+total(),'#f7f0df','#35463e');
      S.receipt.material=receipt;
      showScreen('支払済',total(),true);
    }
    refresh();
  }
  function refresh(){
    if(!order) return;
    var here=atRegister(), count=order.items.length, text, button='';
    if(order.phase==='carry'){text='已取袋 · 沿主通道走出自动门';}
    else if(order.phase==='paid'){text='已付 ¥'+total()+' · 夜宵已装袋';button='取袋离店';}
    else if(order.phase==='pay'){text='已扫两件 · 合计 ¥'+total();button='付款 ¥'+total();}
    else if(order.phase==='scan'){text='已扫 '+order.items[0].item.title;button='扫描第二件';}
    else if(count===2){
      text=here?(available()?'两件已选好 · ¥'+total():'请稍候，店员正在服务'):'已选两件 · 前往入口旁收银台';
      if(here && available()) button='扫描第一件';
    }else if(count===1){text=order.items[0].item.title+' 已入篮 · 再选一'+(order.items[0].kind==='drink'?'份鲜食':'瓶饮料');}
    else text='买份夜宵 · 在鲜食柜选一份食品，再去饮料柜选一瓶饮料';
    if(message.textContent!==text) message.textContent=text;
    next.hidden=!button;
    if(next.textContent!==button) next.textContent=button;
    undo.hidden=!count || order.phase!=='choose';
    exit.hidden=order.phase==='paid';exit.textContent=order.phase==='carry'?'结束':'退出';
  }
  S.installNightShopping=function(){
    scanner.fromArray(S.layout.interior.scanner);bagging.fromArray(S.layout.interior.bagging);
    panel=document.getElementById('errand');message=document.getElementById('errand-message');
    next=document.getElementById('errand-next');undo=document.getElementById('errand-undo');
    exit=document.getElementById('errand-exit');start=document.getElementById('errand-start');
    start.onclick=function(){
      if(order) return;
      if(!S.isStoreView(S.view)) document.querySelector('[data-view="interior"]').click();
      S.returnProduct();
      order={phase:'choose',items:[],scanned:0};
      panel.hidden=false;start.hidden=true;refresh();
    };
    exit.onclick=finish; next.onclick=commit;
    undo.onclick=function(){
      if(order?.phase!=='choose' || !order.items.length) return;
      S.releaseSlot(order.items.pop().ticket);S.returnProduct();refresh();
    };
    S.leaveNightShopping=finish;
    var elapsed=0;
    S.addUpdate(function(t,dt){
      if(!order) return;
      if(lastItem){scanAge+=dt;lastItem.position.lerpVectors(scanner,bagging,S.clamp((scanAge-.28)/.6,0,1));}
      elapsed+=dt; if(elapsed<.15) return; elapsed=0;
      if(!S.isStoreView(S.view) || !S.inShop(S.camera.position)){finish();return;}
      if(S.checkoutClaimed && !atRegister()){
        if(order.phase==='paid'){
      unlock();
      carriedBag=S.people[0].bag.clone();
      carriedBag.visible=true;carriedBag.position.set(.23,-.20,-.62);carriedBag.rotation.set(0,-.25,.06);
      S.camera.add(carriedBag);order.phase='carry';refresh();return;
    }
        unlock();order.phase='choose';order.scanned=0;
      }
      refresh();
    });
  };
})(window.S);
