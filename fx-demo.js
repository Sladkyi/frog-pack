/* The laboratory uses the real combat update and renderer, never a mock VFX. */
(() => {
  const ids=Object.keys(PackAttackFx.UNIQUE).filter(id=>TYPES[id]&&!TYPES[id].gear);
  let type='wand',level=4,count=3,speed=1,playing=true,autocast=true,age=0,wait=0,loading=false,version=0,feedback=true;
  const actualUpdate=update;
  const actualUI=updateUI;
  updateUI=()=>{actualUI();$('biome').textContent=TYPES[type].name;};
  const tools=document.createElement('div');tools.className='fx-tools';
  tools.innerHTML=`<label>Уровень <select id="fx-level">${[1,2,3,4].map(n=>`<option ${n===4?'selected':''}>${n}</option>`).join('')}</select></label>
    <label>Цели <select id="fx-targets"><option>1</option><option selected>3</option><option>6</option></select></label>
    <label>Скорость <select id="fx-speed"><option value=".25">¼</option><option value=".5">½</option><option value="1" selected>1</option></select></label>
    <button id="fx-play">Пауза</button><button id="fx-cast">Повторить</button><button id="fx-mobile">Телефон</button>
    <label><input id="fx-feedback" type="checkbox" checked> Отдача и урон</label>
    <label class="fx-timeline">Момент <input id="fx-time" type="range" min="0" max="3" step=".01" value="0"><output id="fx-clock">0.00 с</output></label>
    <p id="fx-note"></p>`;
  $('fx-dock').before(tools);
  const notes={
    wand:'Луч продолжается до верхнего края. Нижняя вспышка остаётся у ног цели.',
    starfall_shard:'Отдельная комета на каждого врага: входит сверху справа, урон при контакте, затем затухает на месте.',
    eclipse_censer:'Чёрная дыра раскрывается на высоте врагов, остаётся в точке заклинания и стягивает группу.',
    thunder_hammer:'Нисходящий разряд соединён с небом. Удар и цепь попадают в свои цели.',
    thunder_halberd:'Используется нарисованный грозовой столп; старый тонкий процедурный разряд снят с основной анимации.',
    glacial_estoc:'Ледяной выпад летит из рук. Отдельный эффект от падающего ледяного скипетра.',
    tempest_tome:'Компактный вихрь вылетает из рук, быстро раскручивается и стягивает врагов. Общий атлас с хаосом.',
    dragon_pike:'Быстрый огненный выпад из рук. Чистый огонь без летящей земли, короткое раскрытие при попадании.',
    clockwork_trap:'Лягушка бросает небольшой капкан дугой. Зубчатое кольцо защёлкивается у ног врага.',
    astral_mirror:'Зеркальный заряд быстро летит из рук и разбивается на звёздные осколки при контакте.',
    moon_glaive:'Быстрый лунный разрез; повторные цели получают короткие вспышки, без повторения всей глефы.',
    chaos_flail:'Короткий разгон, плотный удар хаоса и быстрое затухание. Эффект оставляет врага видимым.',
    blade:'Чистый золотой разрез. Старый лист с серыми квадратами исключён из воспроизведения.',
    bow:'Один лесной снаряд и маленькая вспышка в точке контакта.',
    spear:'Узкий выпад, небольшая контактная вспышка; попадания по нескольким врагам не создают новые копья.',
    bomb:'Взрыв только в точке столкновения; вторичные цели получают урон без копий бомбы.',
    armor:'Пассивное снаряжение.',boots:'Пассивное снаряжение.'
  };
  function pin(){
    state.pendingEnemies=[];state.hp=state.maxHp;state.mana=state.maxMana;
    state.enemies.forEach((e,i)=>Object.assign(e,{x:W*(.53+i*(.39/Math.max(1,count-1))),y:groundY()-H*.01,baseY:groundY()-H*.01,speed:0,attack:999}));
  }
  function setup(){
    state.mode='running';state.phase='combat';state.enemies=[];state.effects=[];state.projectiles=[];state.arcs=[];state.particles=[];state.texts=[];state.corpses=[];
    for(let i=0;i<count;i++)spawnEncounterEnemy({kind:i%2?'slime':'boar'});
    pin();state.enemies.forEach(e=>{e.elite=false;e.boss=false;e.aspect=null;e.barrier=0;e.hp=e.maxHp=1e9;});
    const item=makeItem(type,level);item.x=0;item.y=0;item.temper=null;
    state.items=[item];state.heldId=item.id;state.handFlash=0;state.attackLock=0;state.stopAge=STOP_DURATION;
    state.shake=0;state.flash=0;state.hitstop=0;state.slowmo=0;state.impactCooldown=0;age=0;wait=0;
  }
  function cast(){
    setup();weaponAttack(state.items[0]);
    $('biome').textContent=TYPES[type].name;
    $('fx-note').textContent=notes[type]||(LEGEND_TRAVEL[attackProfile(type)?.effectKind]?.path==='placed'?'Магия формируется на цели; удар закрепляется на месте и затухает.':'Полёт или взмах направлен от героя к выбранной цели.');
    render();
  }
  async function arm(id,l=level,n=count){
    const token=++version;type=id;level=+l;count=+n;loading=true;setup();
    $('fx-level').value=level;$('fx-targets').value=count;
    $('biome').textContent='Загрузка · '+TYPES[type].name;
    $('overlay').classList.add('hidden');$('game-layout').inert=false;
    while(token===version&&!warmGameAssets()){
      if(state.assetError)throw new Error('Не удалось загрузить '+type);
      await new Promise(r=>setTimeout(r,30));
    }
    if(token!==version)return;
    loading=false;cast();renderInventory();updateUI();
    document.querySelectorAll('#fx-dock button').forEach(b=>b.classList.toggle('on',b.dataset.type===type));
  }
  function tick(dt){pin();actualUpdate(dt);age+=dt;if(!feedback){state.shake=0;state.texts=[];state.hitstop=0;}}
  update=dt=>{
    if(loading||!playing)return;
    tick(dt*speed);
    $('fx-time').value=Math.min(3,age);$('fx-clock').textContent=age.toFixed(2)+' с';
    if(autocast&&age>1.3&&!state.effects.length&&!state.projectiles.length){wait+=dt*speed;if(wait>.45)cast();}
  };
  function seek(t){playing=false;$('fx-play').textContent='Играть';cast();for(let a=0;a<t;a+=1/120)tick(Math.min(1/120,t-a));render();$('fx-time').value=t;$('fx-clock').textContent=t.toFixed(2)+' с';}
  ids.forEach(id=>{const b=document.createElement('button');b.textContent=TYPES[id].name;b.dataset.type=id;b.onclick=()=>{autoSound();arm(id)};$('fx-dock').append(b);});
  $('fx-level').onchange=e=>arm(type,+e.target.value);
  $('fx-targets').onchange=e=>arm(type,level,+e.target.value);
  $('fx-speed').onchange=e=>speed=+e.target.value;
  $('fx-feedback').onchange=e=>feedback=e.target.checked;
  $('fx-play').onclick=()=>{playing=!playing;$('fx-play').textContent=playing?'Пауза':'Играть';};
  $('fx-cast').onclick=()=>{autoSound();playing=true;cast();$('fx-play').textContent='Пауза';};
  $('fx-time').oninput=e=>seek(+e.target.value);
  $('fx-mobile').onclick=()=>{document.querySelector('.app').classList.toggle('phone');resize();arm(type);};
  $('pause').onclick=$('fx-play').onclick;
  window.fxLab={ids,arm,seek,cast,stop:()=>{playing=false;autocast=false;},snapshot:()=>({type,level,count,age,W,H,effects:state.effects.map(f=>({kind:f.kind,age:f.age,life:f.life,pose:legendFx[f.kind]?legendPose(f):null})),assets:sceneAssets().map(a=>a.assetName)})};
  const params=new URLSearchParams(location.search);if(ids.includes(params.get('weapon')))type=params.get('weapon');
  arm(type,Math.max(1,Math.min(4,+params.get('level')||4)),3);
})();
