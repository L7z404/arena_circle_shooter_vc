const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));

const W=1600,H=1000,SPEED=5,PLAYER_R=18;
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
const DRAFT_PERKS=[
  {id:'ricochet',label:'Ricochet',icon:'🔄',desc:'Bullets bounce off walls 3 times'},
  {id:'bigbullets',label:'Big Bullets',icon:'🔴',desc:'Bullets are 2x bigger'},
  {id:'extralife',label:'Extra Life',icon:'💖',desc:'+50 max HP'},
  {id:'explosive',label:'Explosive Rounds',icon:'💣',desc:'All bullets explode on hit'},
  {id:'nocd',label:'No Cooldown',icon:'🚫',desc:'Fire rate doubled'},
  {id:'tesla',label:'Tesla Field',icon:'⚡',desc:'Zap nearby enemies for 3 dmg/tick'},
  {id:'heavyhitter',label:'Heavy Hitter',icon:'🔨',desc:'2x damage but 40% slower bullets'},
  {id:'vampire',label:'Vampire',icon:'🧛',desc:'Heal 20% of damage dealt'},
  {id:'speedster',label:'Speedster',icon:'💨',desc:'Move 40% faster'},
  {id:'tinyterror',label:'Tiny Terror',icon:'🐜',desc:'Smaller hitbox (60% radius)'},
  {id:'shrapnel',label:'Shrapnel',icon:'💥',desc:'+2 extra bullets per shot'},
  {id:'sniperbuff',label:'Longshot',icon:'🎯',desc:'Bullets travel 50% faster'},
  {id:'homing',label:'Homing',icon:'🧲',desc:'Bullets curve toward nearest enemy'},
  {id:'thorns',label:'Thorns',icon:'🌵',desc:'Deal 15 dmg back when hit'},
  {id:'regen2',label:'Regen',icon:'💚',desc:'Regenerate 2 HP/sec'},
  {id:'splitshot',label:'Split Shot',icon:'🔱',desc:'Bullets split into 3 on wall hit'},
  {id:'gravity2',label:'Gravity Well',icon:'🕳',desc:'Pull nearby enemies toward you'},
  {id:'dash',label:'Dash',icon:'🏃',desc:'Move 25% faster + phase through bullets briefly after respawn'},
];
const MAPS={
  arena:{label:'Arena',desc:'Classic arena with cover walls',
    obstacles:[{x:W/2-40,y:H/2-100,w:80,h:200},{x:350,y:180,w:120,h:50},{x:350,y:H-230,w:120,h:50},{x:W-470,y:180,w:120,h:50},{x:W-470,y:H-230,w:120,h:50},{x:W/2-180,y:60,w:40,h:140},{x:W/2+140,y:60,w:40,h:140},{x:W/2-180,y:H-200,w:40,h:140},{x:W/2+140,y:H-200,w:40,h:140}],
    spawns:[{x:200,y:200},{x:W-200,y:200},{x:200,y:H-200},{x:W-200,y:H-200},{x:W/2,y:200},{x:W/2,y:H-200},{x:200,y:H/2},{x:W-200,y:H/2}],color:'#1a1a2e'},
  maze:{label:'Maze',desc:'Tight corridors and dead ends',
    obstacles:[{x:250,y:0,w:30,h:350},{x:250,y:500,w:30,h:500},{x:500,y:100,w:30,h:450},{x:500,y:700,w:30,h:300},{x:750,y:0,w:30,h:300},{x:750,y:400,w:30,h:250},{x:750,y:750,w:30,h:250},{x:1000,y:200,w:30,h:500},{x:1000,y:800,w:30,h:200},{x:1250,y:0,w:30,h:400},{x:1250,y:550,w:30,h:450},{x:375,y:350,w:120,h:30},{x:625,y:650,w:120,h:30},{x:875,y:180,w:120,h:30},{x:1125,y:750,w:120,h:30}],
    spawns:[{x:200,y:200},{x:200,y:H-200},{x:W-200,y:200},{x:W-200,y:H-200},{x:W/2,y:H/2},{x:400,y:H/2},{x:W-400,y:H/2},{x:W/2,y:200}],color:'#1a2a1a'},
  open:{label:'Wasteland',desc:'Wide open with minimal cover',
    obstacles:[{x:W/2-25,y:H/2-25,w:50,h:50},{x:250,y:250,w:60,h:60},{x:W-310,y:250,w:60,h:60},{x:250,y:H-310,w:60,h:60},{x:W-310,y:H-310,w:60,h:60},{x:W/2,y:250,w:40,h:40},{x:W/2,y:H-290,w:40,h:40}],
    spawns:[{x:200,y:200},{x:W-200,y:200},{x:200,y:H-200},{x:W-200,y:H-200},{x:W/2,y:200},{x:W/2,y:H-200},{x:200,y:H/2},{x:W-200,y:H/2}],color:'#2a1a1a'},
  fortress:{label:'Fortress',desc:'Four rooms connected by corridors',
    obstacles:[{x:0,y:H/2-15,w:W/2-120,h:30},{x:W/2+120,y:H/2-15,w:W/2-120,h:30},{x:W/2-15,y:0,w:30,h:H/2-120},{x:W/2-15,y:H/2+120,w:30,h:H/2-120},{x:250,y:250,w:50,h:50},{x:W-300,y:250,w:50,h:50},{x:250,y:H-300,w:50,h:50},{x:W-300,y:H-300,w:50,h:50},{x:W/2-60,y:H/2-60,w:30,h:30},{x:W/2+30,y:H/2+30,w:30,h:30}],
    spawns:[{x:200,y:200},{x:W-200,y:200},{x:200,y:H-200},{x:W-200,y:H-200},{x:W/2,y:H/2},{x:350,y:H/2},{x:W-350,y:H/2},{x:W/2,y:350}],color:'#1a1a28'},
  pillars:{label:'Pillars',desc:'Scattered pillars for quick cover',
    obstacles:(()=>{const o=[];for(let r=0;r<5;r++)for(let c=0;c<7;c++){if((r+c)%2===0)o.push({x:150+c*190,y:120+r*180,w:40,h:40});}return o;})(),
    spawns:[{x:200,y:200},{x:W-200,y:200},{x:200,y:H-200},{x:W-200,y:H-200},{x:W/2,y:200},{x:W/2,y:H-200},{x:200,y:H/2},{x:W-200,y:H/2}],color:'#1e1a2e'},
  crossfire:{label:'Crossfire',desc:'X-shaped walls force close combat',
    obstacles:[{x:200,y:200,w:400,h:30},{x:200,y:200,w:30,h:250},{x:W-600,y:H-230,w:400,h:30},{x:W-230,y:H-450,w:30,h:250},{x:W/2-15,y:H/2-80,w:30,h:160},{x:W/2-80,y:H/2-15,w:160,h:30}],
    spawns:[{x:200,y:H/2},{x:W-200,y:H/2},{x:W/2,y:200},{x:W/2,y:H-200},{x:300,y:300},{x:W-300,y:H-300},{x:300,y:H-300},{x:W-300,y:300}],color:'#2a1a28'},
  ruins:{label:'Ruins',desc:'Crumbling walls and scattered debris',
    obstacles:[{x:300,y:150,w:80,h:80},{x:600,y:300,w:60,h:120},{x:900,y:100,w:100,h:60},{x:1200,y:250,w:70,h:70},{x:200,y:500,w:120,h:40},{x:500,y:600,w:40,h:120},{x:800,y:500,w:80,h:80},{x:1100,y:650,w:60,h:100},{x:400,y:800,w:100,h:50},{x:1000,y:800,w:80,h:60},{x:W/2-40,y:H/2-40,w:80,h:80}],
    spawns:[{x:200,y:200},{x:W-200,y:200},{x:200,y:H-200},{x:W-200,y:H-200},{x:W/2,y:200},{x:W/2,y:H-200},{x:200,y:H/2},{x:W-200,y:H/2}],color:'#2a2218'}
};
const MAP_KEYS=Object.keys(MAPS);
const POWERUP_TYPES=[
  {type:'ghost',color:'#aaaaff',icon:'👻',duration:4000},{type:'mirror',color:'#ffaaff',icon:'🪞',duration:5000},
  {type:'gravity',color:'#6633cc',icon:'🌀',duration:5000},{type:'freeze',color:'#66ffff',icon:'❄',duration:0},
  {type:'nuke',color:'#ffff00',icon:'☢',duration:0},{type:'teleport',color:'#ff66ff',icon:'✦',duration:0},
  {type:'regen',color:'#00ff66',icon:'💚',duration:8000},{type:'pierce',color:'#ff8800',icon:'🔱',duration:5000},
  {type:'ricochet',color:'#ffcc00',icon:'🔄',duration:6000},
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
  if(mode==='draft'){room.round=1;room.maxRounds=20;room.draftPhase=false;room.playerPerks={};room.draftChoices={};room.roundScores={};room.roundTimer=null;}
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
    if(mode==='draft'){room.playerPerks[sid]=[];room.roundScores[sid]=0;}
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
  // draft mode: first kill ends the round
  if(room.mode==='draft'&&killerId&&!room.draftPhase&&!room.gameOver){
    room.roundWinner=killerId;
  }
}

function spawnPowerupInRoom(room){
  if(room.powerups.length>=3)return;
  const t=POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
  const obs=MAPS[room.mapKey].obstacles;let x,y,v;
  for(let i=0;i<20;i++){x=80+Math.random()*(W-160);y=80+Math.random()*(H-160);v=true;
    for(const o of obs){if(x>o.x-20&&x<o.x+o.w+20&&y>o.y-20&&y<o.y+o.h+20){v=false;break;}}if(v)break;}
  if(v)room.powerups.push({...t,x,y,id:Date.now()+Math.random(),spawnedAt:Date.now()});
}

function hasPerk(room,pid,perkId){return room.playerPerks&&room.playerPerks[pid]?room.playerPerks[pid].filter(p=>p===perkId).length:0;}

function startDraftRound(room){
  room.draftPhase=false;room.draftChoices={};room.bullets=[];room.powerups=[];
  // reset hp and respawn all players
  const map=MAPS[room.mapKey];let idx=0;
  for(const p of Object.values(room.players)){
    const sp=map.spawns[idx%map.spawns.length];
    p.x=sp.x;p.y=sp.y;p.hp=100+hasPerk(room,p.id,'extralife')*50;
    p.maxHp=p.hp;p.dead=false;p.effects={};p.spawnShield=Date.now()+3000;
    idx++;
  }
  // track kills this round
  for(const pid of Object.keys(room.players))room.roundScores[pid]=room.scores[pid];
  io.to(room.id).emit('draftRound',{round:room.round,maxRounds:room.maxRounds});
  room.roundWinner=null;
}

function endDraftRound(room){
  if(room.gameOver||room.draftPhase)return;
  if(room.roundTimer){clearTimeout(room.roundTimer);room.roundTimer=null;}
  room.bullets=[];
  const bestPid=room.roundWinner||null;
  room.roundWinner=null;
  if(room.round>=room.maxRounds){
    let winPid=null,winScore=-1;
    for(const pid of Object.keys(room.players)){if((room.scores[pid]||0)>winScore){winScore=room.scores[pid];winPid=pid;}}
    const winner=room.players[winPid];
    room.gameOver=true;
    io.to(room.id).emit('gameOver',{winner:winner?winner.name:'Nobody'});
    return;
  }
  room.draftPhase=true;room.round++;
  const offered=[...DRAFT_PERKS].sort(()=>Math.random()-0.5).slice(0,3);
  room.draftOffered=offered;
  room.draftChoices={};
  if(bestPid)room.draftChoices[bestPid]='_skip_';
  io.to(room.id).emit('draftPick',{offered,roundWinner:bestPid,round:room.round,maxRounds:room.maxRounds,
    perks:room.playerPerks,scores:room.scores});
}

function finishDraft(room){
  if(!room.draftPhase)return;
  // apply choices
  for(const pid of Object.keys(room.players)){
    const choice=room.draftChoices[pid];
    if(choice&&choice!=='_skip_'&&room.playerPerks[pid]){
      room.playerPerks[pid].push(choice);
    }
  }
  startDraftRound(room);
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
    const room=createRoom(best,inLobby,'draft');
    for(const id of inLobby){
      const s=io.sockets.sockets.get(id);if(s)s.join(room.id);
      delete lobbyVotes[id];
    }
    spawnPowerupInRoom(room);
    io.to(room.id).emit('gameStart',{map:best,mode:'draft',mapData:{obstacles:MAPS[best].obstacles,color:MAPS[best].color}});
    startDraftRound(room);
  }
}
// === CONNECTION ===
io.on('connection',socket=>{
  lobbyPlayers[socket.id]={name:'Player',color:'#ff4444',skin:'solid',loadout:[...DEFAULT_LOADOUT]};
  const perkIcons={};for(const p of DRAFT_PERKS)perkIcons[p.id]=p.icon;
  socket.emit('init',{id:socket.id,w:W,h:H,weapons:WEAPONS,weaponKeys:WEAPON_KEYS,skins:SKINS,defaultLoadout:DEFAULT_LOADOUT,perkIcons});
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

  socket.on('draftChoice',(perkId)=>{
    const rid=playerRoom[socket.id];if(!rid||!rooms[rid])return;
    const room=rooms[rid];if(!room.draftPhase)return;
    if(room.draftChoices[socket.id])return; // already picked
    if(room.draftOffered&&room.draftOffered.find(p=>p.id===perkId)){
      room.draftChoices[socket.id]=perkId;
      const p=room.players[socket.id];
      io.to(room.id).emit('draftPicked',{name:p?p.name:'???',perk:perkId});
    }
    // check if all picked
    const allPicked=Object.keys(room.players).every(pid=>room.draftChoices[pid]);
    if(allPicked)finishDraft(room);
  });

  socket.on('shoot',()=>{
    const rid=playerRoom[socket.id];if(!rid||!rooms[rid])return;
    const room=rooms[rid],p=room.players[socket.id];if(!p||p.dead)return;
    if(p.spawnShield&&Date.now()<p.spawnShield)return;
    if(room.draftPhase)return;
    const now=Date.now(),w=WEAPONS[p.weapon];
    let cd=w.cd;const ncd=hasPerk(room,socket.id,'nocd');if(ncd)cd=Math.floor(cd*Math.pow(0.6,ncd));
    if(now-p.lastShot<cd)return;
    p.lastShot=now;
    socket.emit('shot');
    const isPierce=hasEffect(p,'pierce'),isRico=hasEffect(p,'ricochet')||hasPerk(room,socket.id,'ricochet');
    let dmg=w.dmg,spd=w.speed,sz=w.size,cnt=w.count,expl=!!w.explosive;
    const bb=hasPerk(room,socket.id,'bigbullets');if(bb)sz=Math.round(sz*(1+bb*0.8));
    if(hasPerk(room,socket.id,'explosive'))expl=true;
    const hh=hasPerk(room,socket.id,'heavyhitter');if(hh){dmg*=1+hh;spd*=Math.pow(0.7,hh);}
    const sh=hasPerk(room,socket.id,'shrapnel');if(sh)cnt+=sh*2;
    const sb=hasPerk(room,socket.id,'sniperbuff');if(sb)spd*=1+sb*0.4;
    const ricoN=hasPerk(room,socket.id,'ricochet');
    const homN=hasPerk(room,socket.id,'homing');
    const splN=hasPerk(room,socket.id,'splitshot');
    for(let i=0;i<cnt;i++){
      const spread=cnt>1?w.spread||(sh?0.15:0):0;
      const a=p.angle+(cnt>1?(i-(cnt-1)/2)*spread:(Math.random()-0.5)*w.spread);
      room.bullets.push({x:p.x+Math.cos(a)*(PLAYER_R+8),y:p.y+Math.sin(a)*(PLAYER_R+8),
        vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
        owner:socket.id,color:p.color,dmg:dmg,size:sz,
        fire:false,electric:false,explosive:expl,pierce:isPierce,ricochet:isRico,bounces:isRico?(2+ricoN*2):0,
        homing:homN,origSpd:spd,splitN:splN,isSplit:false});
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
        bot.lastShot=now;const isPierce=hasEffect(bot,'pierce'),isRico=hasEffect(bot,'ricochet');
        for(let i=0;i<w.count;i++){
          const a=bot.angle+(w.count>1?(i-(w.count-1)/2)*w.spread:(Math.random()-0.5)*w.spread);
          room.bullets.push({x:bot.x+Math.cos(a)*(PLAYER_R+8),y:bot.y+Math.sin(a)*(PLAYER_R+8),
            vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,owner:bot.id,color:bot.color,
            dmg:w.dmg,size:w.size,fire:false,electric:false,explosive:!!w.explosive,pierce:isPierce,ricochet:isRico,bounces:isRico?3:0});
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

  if(room.draftPhase){
    // still broadcast state so clients render the draft overlay
    const state={
      players:Object.values(room.players).map(p=>({
        id:p.id,x:p.x,y:p.y,angle:p.angle,hp:p.hp,maxHp:p.maxHp,
        color:p.color,name:p.name,skin:p.skin,dead:!!p.dead,
        score:room.scores[p.id]||0,weapon:p.weapon,loadout:p.loadout,
        lastShot:p.lastShot,effects:[],shielded:false
      })),
      bullets:[],obstacles:obs,powerups:[],mapColor:MAPS[room.mapKey].color,
      mode:room.mode,gunProgress:{},draftPhase:true,
      round:room.round||0,maxRounds:room.maxRounds||0,
      playerPerks:room.playerPerks||{}
    };
    io.to(room.id).emit('state',state);
    return;
  }

  // respawn dead players (not in draft mode — dead stay dead until next round)
  if(room.mode!=='draft'){
    for(const p of Object.values(room.players)){
      if(p.dead&&now>=p.respawnAt){
        p.dead=false;p.hp=100+hasPerk(room,p.id,'extralife')*50;p.maxHp=p.hp;
        const dashN=hasPerk(room,p.id,'dash');
        p.spawnShield=Date.now()+3000+(dashN*2000);
        const sp=randomSpawnInMap(room.mapKey,p.x,p.y);p.x=sp.x;p.y=sp.y;
        if(p.isBot){p.botDir=Math.random()*Math.PI*2;p.botDirTimer=0;p.botStrafe=1;}
        else io.to(p.id).emit('respawn');
      }
    }
  }

  for(const bot of Object.values(room.bots)){if(!bot.dead)tickBotInRoom(room,bot);}

  for(const p of Object.values(room.players)){
    if(p.dead)continue;
    if(hasEffect(p,'frozen')){clamp(p);continue;}
    if(p.isBot)continue; // bots handled above
    let spd=hasEffect(p,'x2speed')?SPEED*2:SPEED;
    const sn=hasPerk(room,p.id,'speedster');if(sn)spd*=1+sn*0.35;
    const dn=hasPerk(room,p.id,'dash');if(dn)spd*=1+dn*0.2;
    const k=p.keys;
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
  // regen (pickup + draft perk)
  for(const p of Object.values(room.players)){
    if(p.dead)continue;
    if(hasEffect(p,'regen')&&p.hp<p.maxHp)p.hp=Math.min(p.maxHp,p.hp+0.15);
    const rn=hasPerk(room,p.id,'regen2');if(rn&&p.hp<p.maxHp)p.hp=Math.min(p.maxHp,p.hp+rn*2/60);
  }

  // gravity well (draft perk) — pull enemies
  for(const p of Object.values(room.players)){
    const gn=hasPerk(room,p.id,'gravity2');if(!gn||p.dead)continue;
    const pull=0.3*gn;
    for(const o of Object.values(room.players)){
      if(o.id===p.id||o.dead)continue;
      const dx=p.x-o.x,dy=p.y-o.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<150&&d>5){o.x+=dx/d*pull;o.y+=dy/d*pull;}
    }
  }

  // tesla field (draft perk, stacks)
  for(const p of Object.values(room.players)){
    const tn=hasPerk(room,p.id,'tesla');if(!tn||p.dead)continue;
    const tDmg=3*tn;
    for(const o of Object.values(room.players)){
      if(o.id===p.id||o.dead||(o.spawnShield&&now<o.spawnShield))continue;
      if((p.x-o.x)**2+(p.y-o.y)**2<120*120){
        if(hasEffect(o,'mirror')){p.hp-=tDmg;if(p.hp<=0)killPlayerInRoom(room,p,o.id);}
        else{o.hp-=tDmg;if(o.hp<=0)killPlayerInRoom(room,o,p.id);}
      }
    }
  }

  // bullets
  room.bullets=room.bullets.filter(b=>{
    // homing: curve toward nearest enemy
    if(b.homing){
      let closest=null,cd2=250*250;
      for(const p of Object.values(room.players)){
        if(p.id===b.owner||p.dead)continue;
        const d2=(p.x-b.x)**2+(p.y-b.y)**2;if(d2<cd2){cd2=d2;closest=p;}
      }
      if(closest){
        const dx=closest.x-b.x,dy=closest.y-b.y,d=Math.sqrt(dx*dx+dy*dy);
        const str=0.15*b.homing;
        b.vx+=dx/d*str;b.vy+=dy/d*str;
        const spd=Math.sqrt(b.vx*b.vx+b.vy*b.vy),maxSpd=b.origSpd||10;
        if(spd>maxSpd){b.vx=b.vx/spd*maxSpd;b.vy=b.vy/spd*maxSpd;}
      }
    }
    b.x+=b.vx;b.y+=b.vy;
    // arena edge: bounce or destroy
    if(b.x<0||b.x>W||b.y<0||b.y>H){
      if(b.ricochet&&b.bounces>0){
        if(b.x<0||b.x>W)b.vx*=-1;
        if(b.y<0||b.y>H)b.vy*=-1;
        b.x=Math.max(0,Math.min(W,b.x));b.y=Math.max(0,Math.min(H,b.y));b.bounces--;
      } else return false;
    }
    // obstacle collision: bounce or destroy
    if(!b.pierce){for(const o of obs){if(b.x>o.x&&b.x<o.x+o.w&&b.y>o.y&&b.y<o.y+o.h){
      if(b.ricochet&&b.bounces>0){
        const oL=b.x-o.x,oR=o.x+o.w-b.x,oT=b.y-o.y,oB=o.y+o.h-b.y;
        const m=Math.min(oL,oR,oT,oB);
        if(m===oL||m===oR)b.vx*=-1; else b.vy*=-1;
        b.x+=b.vx*2;b.y+=b.vy*2;b.bounces--;
      } else {
        if(b.explosive)io.to(room.id).emit('explosion',{x:b.x,y:b.y});
        // splitshot: spawn child bullets on wall hit
        if(b.splitN&&!b.isSplit){for(let s=0;s<3;s++){const sa=Math.random()*Math.PI*2;
          room.bullets.push({x:b.x+Math.cos(sa)*5,y:b.y+Math.sin(sa)*5,vx:Math.cos(sa)*8,vy:Math.sin(sa)*8,
            owner:b.owner,color:b.color,dmg:b.dmg*0.5,size:Math.max(2,b.size-1),
            fire:false,electric:false,explosive:false,pierce:false,ricochet:false,bounces:0,homing:b.homing,origSpd:8,isSplit:true,splitN:0});}}
        return false;
      }
    }}}
    for(const p of Object.values(room.players)){
      if(p.id===b.owner||p.dead||hasEffect(p,'ghost')||(p.spawnShield&&Date.now()<p.spawnShield))continue;
      const hr=PLAYER_R*Math.pow(0.7,hasPerk(room,p.id,'tinyterror'));
      if((p.x-b.x)**2+(p.y-b.y)**2<(hr+b.size)**2){
        let dmg=b.dmg;if(b.fire)dmg*=1.3;
        if(hasEffect(p,'mirror')){const sh=room.players[b.owner];if(sh){sh.hp-=dmg;if(sh.hp<=0)killPlayerInRoom(room,sh,p.id);else if(!sh.isBot)io.to(sh.id).emit('hit');}return false;}
        if(b.explosive){io.to(room.id).emit('explosion',{x:b.x,y:b.y});for(const op of Object.values(room.players)){if(op.id===b.owner||hasEffect(op,'ghost')||(op.spawnShield&&Date.now()<op.spawnShield))continue;const d=Math.sqrt((op.x-b.x)**2+(op.y-b.y)**2);if(d<80){let sp=dmg*(1-d/80);if(hasEffect(op,'mirror')){const sh=room.players[b.owner];if(sh){sh.hp-=sp;if(sh.hp<=0)killPlayerInRoom(room,sh,op.id);}}else op.hp-=sp;}}}
        else p.hp-=dmg;
        // vampire heal
        const vn=hasPerk(room,b.owner,'vampire');if(vn){const sh=room.players[b.owner];if(sh&&!sh.dead)sh.hp=Math.min(sh.maxHp,sh.hp+dmg*0.2*vn);}
        // thorns
        const tn2=hasPerk(room,p.id,'thorns');if(tn2){const sh=room.players[b.owner];if(sh&&!sh.dead){sh.hp-=15*tn2;if(sh.hp<=0)killPlayerInRoom(room,sh,p.id);}}
        if(p.hp<=0)killPlayerInRoom(room,p,b.owner);else if(!p.isBot)io.to(p.id).emit('hit');
        return false;
      }
    }
    return true;
  });

  for(const p of Object.values(room.players)){if(p.hp<=0&&!p.dead)killPlayerInRoom(room,p,null);}

  // draft mode: end round when 1 or fewer alive
  if(room.mode==='draft'&&!room.draftPhase&&!room.gameOver&&!room._draftEnding){
    const alive=Object.values(room.players).filter(p=>!p.dead);
    if(alive.length<=1){
      if(alive.length===1)room.roundWinner=alive[0].id;
      room._draftEnding=true;
      setTimeout(()=>{room._draftEnding=false;endDraftRound(room);},800);
    }
  }

  // despawn old powerups
  room.powerups=room.powerups.filter(p=>Date.now()-p.spawnedAt<7000);

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
    gunProgress:room.gunProgress||{},
    draftPhase:!!room.draftPhase,
    round:room.round||0,maxRounds:room.maxRounds||0,
    playerPerks:room.playerPerks||{}
  };
  io.to(room.id).emit('state',state);
}

setInterval(()=>{for(const room of Object.values(rooms))tickRoom(room);},1000/60);

server.listen(3000,'0.0.0.0',()=>console.log('Arena running on http://0.0.0.0:3000'));
