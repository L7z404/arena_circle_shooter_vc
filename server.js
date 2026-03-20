const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));

const W=1200,H=800,SPEED=5,PLAYER_R=18;
const SKINS=['solid','ring','cross','star','skull'];
const WEAPONS={
  pistol:{cd:300,speed:10,dmg:20,spread:0,count:1,size:4,label:'Pistol 🔫'},
  shotgun:{cd:700,speed:8,dmg:12,spread:0.25,count:5,size:3,label:'Shotgun 💥'},
  rifle:{cd:100,speed:14,dmg:10,spread:0.04,count:1,size:3,label:'Rifle 🎯'},
  sniper:{cd:1200,speed:22,dmg:70,spread:0,count:1,size:3,label:'Sniper 🔭'},
  minigun:{cd:60,speed:11,dmg:6,spread:0.12,count:1,size:2,label:'Minigun ⚙'},
  rocket:{cd:1500,speed:5,dmg:50,spread:0,count:1,size:8,label:'Rocket 🚀',explosive:true},
  dual:{cd:200,speed:10,dmg:14,spread:0.08,count:2,size:3,label:'Dual 🔫🔫'},
};
const WEAPON_KEYS=Object.keys(WEAPONS);
const DEFAULT_LOADOUT=['pistol','shotgun','rifle'];
const MAPS={
  arena:{label:'Arena',desc:'Classic arena with cover walls',
    obstacles:[{x:W/2-40,y:H/2-80,w:80,h:160},{x:300,y:150,w:100,h:40},{x:300,y:H-190,w:100,h:40},{x:W-400,y:150,w:100,h:40},{x:W-400,y:H-190,w:100,h:40},{x:W/2-150,y:50,w:40,h:120},{x:W/2+110,y:50,w:40,h:120},{x:W/2-150,y:H-170,w:40,h:120},{x:W/2+110,y:H-170,w:40,h:120}],
    spawns:[{x:200,y:200},{x:W-200,y:200},{x:200,y:H-200},{x:W-200,y:H-200},{x:W/2,y:200},{x:W/2,y:H-200},{x:200,y:H/2},{x:W-200,y:H/2}],color:'#1a1a2e'},
  maze:{label:'Maze',desc:'Tight corridors and dead ends',
    obstacles:[{x:200,y:0,w:30,h:300},{x:200,y:400,w:30,h:400},{x:400,y:100,w:30,h:400},{x:400,y:600,w:30,h:200},{x:600,y:0,w:30,h:250},{x:600,y:350,w:30,h:200},{x:600,y:650,w:30,h:150},{x:800,y:200,w:30,h:400},{x:800,y:700,w:30,h:100},{x:1000,y:0,w:30,h:350},{x:1000,y:450,w:30,h:350},{x:300,y:300,w:100,h:30},{x:500,y:550,w:100,h:30},{x:700,y:150,w:100,h:30},{x:900,y:650,w:100,h:30}],
    spawns:[{x:200,y:200},{x:200,y:H-200},{x:W-200,y:200},{x:W-200,y:H-200},{x:W/2,y:H/2},{x:300,y:H/2},{x:900,y:H/2},{x:W/2,y:200}],color:'#1a2a1a'},
  open:{label:'Wasteland',desc:'Wide open with minimal cover',
    obstacles:[{x:W/2-20,y:H/2-20,w:40,h:40},{x:200,y:200,w:50,h:50},{x:W-250,y:200,w:50,h:50},{x:200,y:H-250,w:50,h:50},{x:W-250,y:H-250,w:50,h:50}],
    spawns:[{x:200,y:200},{x:W-200,y:200},{x:200,y:H-200},{x:W-200,y:H-200},{x:W/2,y:200},{x:W/2,y:H-200},{x:200,y:H/2},{x:W-200,y:H/2}],color:'#2a1a1a'},
  fortress:{label:'Fortress',desc:'Four rooms connected by corridors',
    obstacles:[{x:0,y:H/2-15,w:W/2-100,h:30},{x:W/2+100,y:H/2-15,w:W/2-100,h:30},{x:W/2-15,y:0,w:30,h:H/2-100},{x:W/2-15,y:H/2+100,w:30,h:H/2-100},{x:200,y:200,w:40,h:40},{x:W-240,y:200,w:40,h:40},{x:200,y:H-240,w:40,h:40},{x:W-240,y:H-240,w:40,h:40},{x:W/2-50,y:H/2-50,w:25,h:25},{x:W/2+25,y:H/2+25,w:25,h:25}],
    spawns:[{x:200,y:200},{x:W-200,y:200},{x:200,y:H-200},{x:W-200,y:H-200},{x:W/2,y:H/2},{x:300,y:H/2},{x:W-300,y:H/2},{x:W/2,y:300}],color:'#1a1a28'},
  pillars:{label:'Pillars',desc:'Scattered pillars for quick cover',
    obstacles:(()=>{const o=[];for(let r=0;r<4;r++)for(let c=0;c<6;c++){if((r+c)%2===0)o.push({x:130+c*170,y:120+r*170,w:35,h:35});}return o;})(),
    spawns:[{x:200,y:200},{x:W-200,y:200},{x:200,y:H-200},{x:W-200,y:H-200},{x:W/2,y:200},{x:W/2,y:H-200},{x:200,y:H/2},{x:W-200,y:H/2}],color:'#1e1a2e'}
};
const MAP_KEYS=Object.keys(MAPS);
const POWERUP_TYPES=[
  {type:'ghost',color:'#aaaaff',icon:'👻',duration:4000},{type:'mirror',color:'#ffaaff',icon:'🪞',duration:5000},
  {type:'gravity',color:'#6633cc',icon:'🌀',duration:5000},{type:'freeze',color:'#66ffff',icon:'❄',duration:0},
  {type:'nuke',color:'#ffff00',icon:'☢',duration:0},{type:'teleport',color:'#ff66ff',icon:'✦',duration:0},
  {type:'regen',color:'#00ff66',icon:'💚',duration:8000},{type:'pierce',color:'#ff8800',icon:'🔱',duration:5000},
];
const BOT_NAMES=['Bot Alpha','Bot Bravo','Bot Charlie'];
const BOT_COLORS=['#ff8844','#44ffaa','#ff44ff'];
const BOT_SKINS=['skull','star','cross'];
// === ROOM SYSTEM ===
let rooms={};  // roomId -> room
let lobbyPlayers={}; // socketId -> player profile (name,color,skin,loadout)
let playerRoom={}; // socketId -> roomId
let lobbyVotes={}; // socketId -> mapKey
let roomIdCounter=0;

function rectCircle(rx,ry,rw,rh,cx,cy,cr){const nx=Math.max(rx,Math.min(cx,rx+rw)),ny=Math.max(ry,Math.min(cy,ry+rh));return(nx-cx)**2+(ny-cy)**2<cr**2;}
function clamp(p){p.x=Math.max(PLAYER_R,Math.min(W-PLAYER_R,p.x));p.y=Math.max(PLAYER_R,Math.min(H-PLAYER_R,p.y));}
function pushOut(p,o){const oL=(p.x+PLAYER_R)-o.x,oR=(o.x+o.w)-(p.x-PLAYER_R),oT=(p.y+PLAYER_R)-o.y,oB=(o.y+o.h)-(p.y-PLAYER_R);const m=Math.min(oL,oR,oT,oB);if(m===oL)p.x=o.x-PLAYER_R;else if(m===oR)p.x=o.x+o.w+PLAYER_R;else if(m===oT)p.y=o.y-PLAYER_R;else p.y=o.y+o.h+PLAYER_R;}
function hasEffect(p,t){return p.effects[t]&&Date.now()<p.effects[t];}

function createRoom(mapKey,creatorIds,mode){
  const id='room_'+(roomIdCounter++);
  const map=MAPS[mapKey];
  const room={id,mapKey,mode:mode||'ffa',players:{},scores:{},bullets:[],powerups:[],bots:{},gameOver:false};
  if(mode==='gungame')room.gunProgress={};
  rooms[id]=room;
  let idx=0;
  for(const sid of creatorIds){
    const prof=lobbyPlayers[sid]||{};
    const sp=map.spawns[idx%map.spawns.length];
    const wep=mode==='gungame'?WEAPON_KEYS[0]:(prof.loadout||DEFAULT_LOADOUT)[0];
    room.players[sid]={id:sid,idx,x:sp.x,y:sp.y,angle:0,hp:100,maxHp:100,
      color:prof.color||'#ff4444',name:prof.name||'Player',skin:prof.skin||'solid',
      loadout:prof.loadout||[...DEFAULT_LOADOUT],
      lastShot:0,keys:{},weapon:wep,effects:{},spawnShield:Date.now()+3000};
    room.scores[sid]=0;
    if(mode==='gungame')room.gunProgress[sid]=0;
    playerRoom[sid]=id;
    idx++;
  }
  return room;
}

function addBotToRoom(room,idx){
  const bid='bot_'+room.id+'_'+idx;
  const map=MAPS[room.mapKey];
  const sp=map.spawns[idx%map.spawns.length];
  const loadout=[...WEAPON_KEYS].sort(()=>Math.random()-0.5).slice(0,3);
  const wep=room.mode==='gungame'?WEAPON_KEYS[0]:loadout[0];
  room.players[bid]={id:bid,idx,x:sp.x,y:sp.y,angle:0,hp:100,maxHp:100,
    color:BOT_COLORS[idx%3],name:BOT_NAMES[idx%3],skin:BOT_SKINS[idx%3],
    loadout,lastShot:0,keys:{},weapon:wep,effects:{},isBot:true,
    botDir:Math.random()*Math.PI*2,botDirTimer:0,botStrafe:1,spawnShield:Date.now()+3000};
  room.scores[bid]=0;room.bots[bid]=room.players[bid];
  if(room.mode==='gungame')room.gunProgress[bid]=0;
}

function destroyRoom(roomId){delete rooms[roomId];}

function randomSpawnInMap(mapKey,ex,ey){
  const s=MAPS[mapKey].spawns;let b=s[0],bd=0;
  for(const p of s){const d=(p.x-ex)**2+(p.y-ey)**2;if(d>bd){bd=d;b=p;}}return b;
}

function killPlayerInRoom(room,p,killerId){
  if(killerId)room.scores[killerId]=(room.scores[killerId]||0)+1;
  const deathX=p.x,deathY=p.y,deathColor=p.color;
  const killerP=killerId?room.players[killerId]:null;
  // kill feed
  io.to(room.id).emit('killFeed',{killer:killerP?killerP.name:'???',victim:p.name,weapon:killerP?WEAPONS[killerP.weapon]?.label||'':''});
  p.hp=0;p.dead=true;p.respawnAt=Date.now()+3000;
  p.effects={};
  io.to(room.id).emit('deathFx',{x:deathX,y:deathY,color:deathColor});
  if(!p.isBot)io.to(p.id).emit('death',{respawnIn:3000});
  if(killerId&&!killerId.startsWith('bot_'))io.to(killerId).emit('kill');
  // gun game: advance killer
  if(room.mode==='gungame'&&killerId&&room.gunProgress){
    room.gunProgress[killerId]=(room.gunProgress[killerId]||0)+1;
    const prog=room.gunProgress[killerId];
    if(prog>=WEAPON_KEYS.length){
      io.to(room.id).emit('gameOver',{winner:killerP?killerP.name:'???'});
      room.gameOver=true;
    } else {
      const newWep=WEAPON_KEYS[prog];
      if(killerP){killerP.weapon=newWep;}
    }
  }
}

function spawnPowerupInRoom(room){
  if(room.powerups.length>=3)return;
  const t=POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
  const obs=MAPS[room.mapKey].obstacles;let x,y,v;
  for(let i=0;i<20;i++){x=80+Math.random()*(W-160);y=80+Math.random()*(H-160);v=true;
    for(const o of obs){if(x>o.x-20&&x<o.x+o.w+20&&y>o.y-20&&y<o.y+o.h+20){v=false;break;}}if(v)break;}
  if(v)room.powerups.push({...t,x,y,id:Date.now()+Math.random()});
}

function sendLobby(){
  const inLobby=Object.keys(lobbyPlayers).filter(id=>!playerRoom[id]);
  const tv=inLobby.filter(id=>lobbyVotes[id]).length;
  const ml=MAP_KEYS.map(k=>({key:k,label:MAPS[k].label,desc:MAPS[k].desc,votes:Object.values(lobbyVotes).filter(v=>v===k).length}));
  const plist=inLobby.map(id=>{const p=lobbyPlayers[id];return{name:p.name,color:p.color,skin:p.skin,loadout:p.loadout};});
  for(const id of inLobby){io.to(id).emit('lobby',{maps:ml,players:plist,totalPlayers:inLobby.length,totalVotes:tv});}
}

function checkAllVoted(){
  const inLobby=Object.keys(lobbyPlayers).filter(id=>!playerRoom[id]);
  if(inLobby.length<2)return;
  if(inLobby.every(id=>lobbyVotes[id])){
    const c={};for(const id of inLobby){const v=lobbyVotes[id];if(v)c[v]=(c[v]||0)+1;}
    let best=MAP_KEYS[0],bc=0;for(const k in c){if(c[k]>bc){bc=c[k];best=k;}}
    const room=createRoom(best,inLobby);
    for(const id of inLobby){
      const s=io.sockets.sockets.get(id);if(s)s.join(room.id);
      delete lobbyVotes[id];
    }
    spawnPowerupInRoom(room);
    io.to(room.id).emit('gameStart',{map:best,mapData:{obstacles:MAPS[best].obstacles,color:MAPS[best].color}});
  }
}
// === CONNECTION ===
io.on('connection',socket=>{
  lobbyPlayers[socket.id]={name:'Player',color:'#ff4444',skin:'solid',loadout:[...DEFAULT_LOADOUT]};
  socket.emit('init',{id:socket.id,w:W,h:H,weapons:WEAPONS,weaponKeys:WEAPON_KEYS,skins:SKINS,defaultLoadout:DEFAULT_LOADOUT});
  sendLobby();

  socket.on('customize',d=>{
    const p=lobbyPlayers[socket.id];if(!p)return;
    if(d.name&&typeof d.name==='string')p.name=d.name.slice(0,12);
    if(d.color&&/^#[0-9a-f]{6}$/i.test(d.color))p.color=d.color;
    if(d.skin&&SKINS.includes(d.skin))p.skin=d.skin;
    if(Array.isArray(d.loadout)&&d.loadout.length===3&&d.loadout.every(w=>WEAPONS[w]))p.loadout=[...d.loadout];
    // also update in-room player if in a room
    const rid=playerRoom[socket.id];
    if(rid&&rooms[rid]&&rooms[rid].players[socket.id]){
      const rp=rooms[rid].players[socket.id];
      rp.name=p.name;rp.color=p.color;rp.skin=p.skin;
    }
    if(!playerRoom[socket.id])sendLobby();
  });

  socket.on('vote',mk=>{
    if(!MAPS[mk]||playerRoom[socket.id])return;
    lobbyVotes[socket.id]=mk;sendLobby();checkAllVoted();
  });

  socket.on('startBotGame',(data)=>{
    if(playerRoom[socket.id])return;
    const mk=typeof data==='string'?data:(data?.map||null);
    const mode=(typeof data==='object'&&data?.mode)||'ffa';
    const mapKey=(mk&&MAPS[mk])?mk:MAP_KEYS[Math.floor(Math.random()*MAP_KEYS.length)];
    const room=createRoom(mapKey,[socket.id],mode);
    socket.join(room.id);
    delete lobbyVotes[socket.id];
    const taken=new Set(Object.values(room.players).map(p=>p.idx));
    for(let i=0;i<4;i++){if(!taken.has(i))addBotToRoom(room,i);}
    spawnPowerupInRoom(room);
    socket.emit('gameStart',{map:mapKey,mode,mapData:{obstacles:MAPS[mapKey].obstacles,color:MAPS[mapKey].color}});
    sendLobby();
  });

  socket.on('backToLobby',()=>{
    const rid=playerRoom[socket.id];
    if(!rid)return;
    const room=rooms[rid];
    if(room){
      delete room.players[socket.id];delete room.scores[socket.id];
      socket.leave(rid);
      // if no human players left, destroy room
      const humans=Object.keys(room.players).filter(id=>!id.startsWith('bot_'));
      if(humans.length===0)destroyRoom(rid);
    }
    delete playerRoom[socket.id];
    socket.emit('toLobby');
    sendLobby();
  });

  socket.on('input',d=>{
    const rid=playerRoom[socket.id];if(!rid||!rooms[rid])return;
    const p=rooms[rid].players[socket.id];
    if(p){p.keys=d.keys||{};p.angle=d.angle||0;}
  });

  socket.on('weapon',w=>{
    const rid=playerRoom[socket.id];if(!rid||!rooms[rid])return;
    if(rooms[rid].mode==='gungame')return; // no switching in gun game
    const p=rooms[rid].players[socket.id];
    if(p&&p.loadout.includes(w))p.weapon=w;
  });

  socket.on('shoot',()=>{
    const rid=playerRoom[socket.id];if(!rid||!rooms[rid])return;
    const room=rooms[rid],p=room.players[socket.id];if(!p||p.dead)return;
    if(p.spawnShield&&Date.now()<p.spawnShield)return;
    const now=Date.now(),w=WEAPONS[p.weapon];
    if(now-p.lastShot<w.cd)return;
    p.lastShot=now;
    socket.emit('shot');
    const isPierce=hasEffect(p,'pierce');
    for(let i=0;i<w.count;i++){
      const a=p.angle+(w.count>1?(i-(w.count-1)/2)*w.spread:(Math.random()-0.5)*w.spread);
      room.bullets.push({x:p.x+Math.cos(a)*(PLAYER_R+8),y:p.y+Math.sin(a)*(PLAYER_R+8),
        vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,
        owner:socket.id,color:p.color,dmg:w.dmg,size:w.size,
        fire:false,electric:false,explosive:!!w.explosive,pierce:isPierce});
    }
  });

  socket.on('disconnect',()=>{
    const rid=playerRoom[socket.id];
    if(rid&&rooms[rid]){
      delete rooms[rid].players[socket.id];delete rooms[rid].scores[socket.id];
      const humans=Object.keys(rooms[rid].players).filter(id=>!id.startsWith('bot_'));
      if(humans.length===0)destroyRoom(rid);
    }
    delete playerRoom[socket.id];delete lobbyPlayers[socket.id];delete lobbyVotes[socket.id];
    sendLobby();
  });
});
// === GAME LOOP (per room) ===
function tickBotInRoom(room,bot){
  if(hasEffect(bot,'frozen'))return;
  let target=null,minD=Infinity;
  for(const p of Object.values(room.players)){
    if(p.id===bot.id||p.dead||hasEffect(p,'ghost'))continue;
    const d=(p.x-bot.x)**2+(p.y-bot.y)**2;if(d<minD){minD=d;target=p;}
  }
  const spd=hasEffect(bot,'x2speed')?SPEED*2:SPEED;
  const prevX=bot.x,prevY=bot.y;

  if(target){
    const dx=target.x-bot.x,dy=target.y-bot.y,dist=Math.sqrt(dx*dx+dy*dy);
    bot.angle=Math.atan2(dy,dx);
    if(dist>150){bot.x+=dx/dist*spd*0.8;bot.y+=dy/dist*spd*0.8;}
    else if(dist<80){bot.x-=dx/dist*spd*0.6;bot.y-=dy/dist*spd*0.6;}
    else{
      bot.botDirTimer--;
      if(bot.botDirTimer<=0){bot.botStrafe=Math.random()>0.5?1:-1;bot.botDirTimer=30+Math.random()*60;}
      bot.x+=(-dy/dist)*spd*0.5*(bot.botStrafe||1);
      bot.y+=(dx/dist)*spd*0.5*(bot.botStrafe||1);
    }
    if(dist<400){
      const now=Date.now(),w=WEAPONS[bot.weapon];
      if(now-bot.lastShot>=w.cd&&!(bot.spawnShield&&now<bot.spawnShield)){
        bot.lastShot=now;const isPierce=hasEffect(bot,'pierce');
        for(let i=0;i<w.count;i++){
          const a=bot.angle+(w.count>1?(i-(w.count-1)/2)*w.spread:(Math.random()-0.5)*w.spread);
          room.bullets.push({x:bot.x+Math.cos(a)*(PLAYER_R+8),y:bot.y+Math.sin(a)*(PLAYER_R+8),
            vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,owner:bot.id,color:bot.color,
            dmg:w.dmg,size:w.size,fire:false,electric:false,explosive:!!w.explosive,pierce:isPierce});
        }
      }
    }
    if(Math.random()<0.005)bot.weapon=bot.loadout[Math.floor(Math.random()*bot.loadout.length)];
  }else{
    bot.botDirTimer--;
    if(bot.botDirTimer<=0){bot.botDir=Math.random()*Math.PI*2;bot.botDirTimer=60+Math.random()*120;}
    bot.x+=Math.cos(bot.botDir)*spd*0.5;bot.y+=Math.sin(bot.botDir)*spd*0.5;
    bot.angle=bot.botDir;
  }
  clamp(bot);
  if(!hasEffect(bot,'ghost')){
    const obs=MAPS[room.mapKey].obstacles;
    for(const o of obs){if(rectCircle(o.x,o.y,o.w,o.h,bot.x,bot.y,PLAYER_R)){pushOut(bot,o);}}
  }
  // if bot is near any edge, steer toward center
  const edgeZone=80;
  if(bot.x<edgeZone||bot.x>W-edgeZone||bot.y<edgeZone||bot.y>H-edgeZone){
    const cx=W/2,cy=H/2,dx=cx-bot.x,dy=cy-bot.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d>0){bot.x+=dx/d*spd;bot.y+=dy/d*spd;}
  }
}

function tickRoom(room){
  if(room.gameOver)return;
  const now=Date.now(),obs=MAPS[room.mapKey].obstacles;

  // respawn dead players
  for(const p of Object.values(room.players)){
    if(p.dead&&now>=p.respawnAt){
      p.dead=false;p.hp=100;p.maxHp=100;p.spawnShield=Date.now()+3000;
      const sp=randomSpawnInMap(room.mapKey,p.x,p.y);p.x=sp.x;p.y=sp.y;
      if(p.isBot){p.botDir=Math.random()*Math.PI*2;p.botDirTimer=0;p.botStrafe=1;}
      else io.to(p.id).emit('respawn');
    }
  }

  for(const bot of Object.values(room.bots)){if(!bot.dead)tickBotInRoom(room,bot);}

  for(const p of Object.values(room.players)){
    if(p.dead)continue;
    if(hasEffect(p,'frozen')){clamp(p);continue;}
    if(p.isBot)continue; // bots handled above
    const spd=hasEffect(p,'x2speed')?SPEED*2:SPEED;const k=p.keys;
    if(k.w||k.arrowup)p.y-=spd;if(k.s||k.arrowdown)p.y+=spd;
    if(k.a||k.arrowleft)p.x-=spd;if(k.d||k.arrowright)p.x+=spd;
    clamp(p);
    if(!hasEffect(p,'ghost')){for(const o of obs){if(rectCircle(o.x,o.y,o.w,o.h,p.x,p.y,PLAYER_R))pushOut(p,o);}}
  }

  // powerup pickup
  for(const p of Object.values(room.players)){
    if(p.dead)continue;
    for(let i=room.powerups.length-1;i>=0;i--){
      const pu=room.powerups[i];
      if((p.x-pu.x)**2+(p.y-pu.y)**2<(PLAYER_R+16)**2){
        if(pu.duration>0)p.effects[pu.type]=now+pu.duration;
        else if(pu.type==='freeze'){for(const o of Object.values(room.players)){if(o.id!==p.id)o.effects.frozen=now+2000;}}
        else if(pu.type==='nuke'){for(const o of Object.values(room.players)){if(o.id!==p.id&&!(o.spawnShield&&Date.now()<o.spawnShield)){o.hp-=40;if(o.hp<=0)killPlayerInRoom(room,o,p.id);}}io.to(room.id).emit('explosion',{x:p.x,y:p.y});}
        else if(pu.type==='teleport'){const sp=MAPS[room.mapKey].spawns[Math.floor(Math.random()*MAPS[room.mapKey].spawns.length)];p.x=sp.x;p.y=sp.y;}
        if(!p.isBot)io.to(p.id).emit('pickup',pu.type);
        room.powerups.splice(i,1);
      }
    }
    for(const t in p.effects){if(now>=p.effects[t])delete p.effects[t];}
  }

  // gravity
  for(const p of Object.values(room.players)){
    if(p.dead||!hasEffect(p,'gravity'))continue;
    for(const o of Object.values(room.players)){
      if(o.id===p.id||o.dead||hasEffect(o,'ghost'))continue;
      const dx=p.x-o.x,dy=p.y-o.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<120&&d>5){o.x+=dx/d*1.5;o.y+=dy/d*1.5;}
    }
  }
  // regen
  for(const p of Object.values(room.players)){if(hasEffect(p,'regen')&&p.hp<p.maxHp)p.hp=Math.min(p.maxHp,p.hp+0.15);}

  // bullets
  room.bullets=room.bullets.filter(b=>{
    b.x+=b.vx;b.y+=b.vy;
    if(b.x<0||b.x>W||b.y<0||b.y>H)return false;
    if(!b.pierce){for(const o of obs){if(b.x>o.x&&b.x<o.x+o.w&&b.y>o.y&&b.y<o.y+o.h){if(b.explosive)io.to(room.id).emit('explosion',{x:b.x,y:b.y});return false;}}}
    for(const p of Object.values(room.players)){
      if(p.id===b.owner||p.dead||hasEffect(p,'ghost')||(p.spawnShield&&Date.now()<p.spawnShield))continue;
      if((p.x-b.x)**2+(p.y-b.y)**2<(PLAYER_R+b.size)**2){
        let dmg=b.dmg;if(b.fire)dmg*=1.3;
        if(hasEffect(p,'mirror')){const sh=room.players[b.owner];if(sh){sh.hp-=dmg;if(sh.hp<=0)killPlayerInRoom(room,sh,p.id);else if(!sh.isBot)io.to(sh.id).emit('hit');}return false;}
        if(b.explosive){io.to(room.id).emit('explosion',{x:b.x,y:b.y});for(const op of Object.values(room.players)){if(op.id===b.owner||hasEffect(op,'ghost')||(op.spawnShield&&Date.now()<op.spawnShield))continue;const d=Math.sqrt((op.x-b.x)**2+(op.y-b.y)**2);if(d<80){let sp=dmg*(1-d/80);if(hasEffect(op,'mirror')){const sh=room.players[b.owner];if(sh){sh.hp-=sp;if(sh.hp<=0)killPlayerInRoom(room,sh,op.id);}}else op.hp-=sp;}}}
        else p.hp-=dmg;
        if(p.hp<=0)killPlayerInRoom(room,p,b.owner);else if(!p.isBot)io.to(p.id).emit('hit');
        return false;
      }
    }
    return true;
  });

  for(const p of Object.values(room.players)){if(p.hp<=0&&!p.dead)killPlayerInRoom(room,p,null);}

  // spawn powerups
  if(Math.random()<0.01)spawnPowerupInRoom(room);

  const state={
    players:Object.values(room.players).map(p=>({
      id:p.id,x:p.x,y:p.y,angle:p.angle,hp:p.hp,maxHp:p.maxHp,
      color:p.color,name:p.name,skin:p.skin,dead:!!p.dead,
      score:room.scores[p.id]||0,weapon:p.weapon,loadout:p.loadout,
      lastShot:p.lastShot,
      effects:Object.keys(p.effects).filter(t=>now<p.effects[t]),
      shielded:!!(p.spawnShield&&now<p.spawnShield)
    })),
    bullets:room.bullets.map(b=>({x:b.x,y:b.y,color:b.color,size:b.size})),
    obstacles:obs,
    powerups:room.powerups.map(p=>({x:p.x,y:p.y,type:p.type,color:p.color,icon:p.icon})),
    mapColor:MAPS[room.mapKey].color,
    mode:room.mode,
    gunProgress:room.gunProgress||{}
  };
  io.to(room.id).emit('state',state);
}

setInterval(()=>{for(const room of Object.values(rooms))tickRoom(room);},1000/60);

server.listen(3000,'0.0.0.0',()=>console.log('Arena running on http://0.0.0.0:3000'));
