# 💀 Arena Circle Shooter

A fast-paced multiplayer top-down circle shooter playable over LAN. Built with Node.js, Socket.IO, and HTML5 Canvas — no external assets, no frameworks, just pure chaos in ~1600 lines of code.

![Node.js](https://img.shields.io/badge/Node.js-20-green) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-blue) ![Docker](https://img.shields.io/badge/Docker-Ready-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🎮 Features

### Game Modes

| Mode | Players | Description |
|------|---------|-------------|
| **Free For All** | 1–4 + Bots | Classic deathmatch. Respawn on death. Highest score wins. |
| **Gun Game** | 1–4 + Bots | Kill to advance through all 7 weapons. First to finish wins. |
| **💀 Chaos Mode** | 1–4 + Bots | 20-round last-man-standing draft mode. Losers pick perks between rounds. Winner gets nothing. Absolute chaos by round 10. |

### Weapons (7)

| Weapon | Style |
|--------|-------|
| 🔫 Pistol | Balanced all-rounder |
| 💥 Shotgun | 5-pellet spread |
| 🎯 Rifle | Fast fire, low damage |
| 🔭 Sniper | High damage, slow fire |
| ⚡ Minigun | Bullet hose |
| 🚀 Rocket | Explosive projectile |
| 🔫🔫 Dual | Double pistols |

Choose any 3 for your loadout. Switch in-game with `1/2/3` or scroll wheel.

### Draft Perks (25) — Chaos Mode

All perks **stack** — pick the same one multiple times for compounding effects.

| Perk | Effect |
|------|--------|
| 🔄 Ricochet | Bullets bounce off walls 3 times |
| 🔴 Big Bullets | Bullets are 2x bigger |
| 💖 Extra Life | +50 max HP |
| 💣 Explosive Rounds | All bullets explode on hit |
| 🚫 No Cooldown | Fire rate doubled |
| ⚡ Tesla Field | Zap nearby enemies for 3 dmg/tick |
| 🔨 Heavy Hitter | 2x damage but 40% slower bullets |
| 🧛 Vampire | Heal 20% of damage dealt |
| 💨 Speedster | Move 40% faster |
| 🐜 Tiny Terror | Smaller hitbox (60% radius) |
| 💥 Shrapnel | +2 extra bullets per shot |
| 🎯 Longshot | Bullets travel 50% faster |
| 🧲 Homing | Bullets curve toward nearest enemy |
| 🌵 Thorns | Deal 15 dmg back when hit |
| 💚 Regen | Regenerate 2 HP/sec |
| 🔱 Split Shot | Bullets split into 3 on wall hit |
| 🕳 Gravity Well | Pull nearby enemies toward you |
| 🏃 Dash | Move 25% faster + longer spawn shield |
| 👥 Clone Shot | Fire a second volley 0.2s after each shot |
| ☠ Poison | Bullets apply 3s poison (5 dmg/sec) |
| 🛡 Armor | +25 max HP and reduce incoming dmg by 15% |
| 🧲 Bullet Magnet | Attract nearby powerups from further away |
| 😡 Rage | +30% damage when below 50% HP |
| 🗼 Turret | Auto-fire a weak bullet at nearest enemy every 0.5s |

### Powerups (9)

Spawn randomly on the map, despawn after 7 seconds.

👻 Ghost · 🪞 Mirror · 🌀 Gravity · ❄ Freeze · ☢ Nuke · ✦ Teleport · 💚 Regen · 🔱 Pierce · 🔄 Ricochet

### Maps (7)

Arena · Maze · Open Field · Fortress · Pillars · Crossfire · Ruins

Each map is 1600×1000 with unique obstacle layouts and color themes. Players vote for maps in the lobby.

### Character Customization

- **16 colors** — curated palette (no black for visibility)
- **5 skins** — Solid, Ring, Cross, Star, Skull
- **7 hats** — Crown, Horns, Halo, Antenna, Top Hat, Bandana, Mohawk
- **4 capes** — Short, Long, Tattered, Flame (with gradient fire effect)
- **Custom name** — up to 12 characters
- All choices persist in localStorage

### Audio

- **Chiptune music** — procedurally generated via Web Audio API oscillators. No audio files.
  - Lobby: Chill C major progression (100 BPM)
  - FFA: Driving G major action (155 BPM)
  - Gun Game: Dark E minor tension (150 BPM)
  - Chaos Mode: Epic A minor with 8-chord progression (168 BPM)
  - Draft Pick: Mysterious D minor atmosphere (90 BPM)
- **Sound effects** — all synthesized: shoot, hit, death, kill, explosion, pickup, UI clicks, perk selection, hover
- **Music toggle** — on/off button in lobby, persists in localStorage

### Bot AI

- 3 bots fill empty slots automatically
- Chase/strafe/wander behavior
- Perk-aware bullets (bots use ricochet, homing, explosive, etc.)
- Auto-pick perks in Chaos Mode draft phase
- Edge bounce and stuck detection with teleport recovery

### Quality of Life

- **🇪🇸/🇺🇸 Language toggle** — full English/Spanish translation (lobby, HUD, overlays, perk names & descriptions)
- **Screen shake** on hits
- **Kill feed** with weapon icons
- **Death particles**
- **Spawn invincibility** — 3s shield, blocks shooting and damage
- **Round-start freeze** — 3s movement lock at the start of each round
- **Random spawn points** — shuffled every round
- **localStorage persistence** — name, color, skin, hat, cape, loadout, language, music preference

---

## 🚀 Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/L7z404/arena_circle_shooter_vc.git
cd arena-circle-shooter
docker build -t arena-game .
docker run -d --name arena-game --network host arena-game
```

Open `http://localhost:3000` in your browser. Share your LAN IP for multiplayer.

### Node.js

```bash
git clone https://github.com/L7z404/arena_circle_shooter_vc.git
cd arena-circle-shooter
npm install
node server.js
```

Open `http://localhost:3000`.

---

## 🎯 How to Play

| Input | Action |
|-------|--------|
| `W A S D` | Move |
| Mouse | Aim |
| Left Click | Shoot |
| `1` `2` `3` | Switch weapon |
| Scroll Wheel | Cycle weapons |

### Chaos Mode Flow

1. All players spawn with invincibility + movement freeze (3s)
2. Last player standing wins the round
3. **Winner skips** perk selection — losers choose from 3 random perks
4. Perks stack — picking the same perk again doubles its effect
5. After 20 rounds, highest score wins

---

## 🏗 Architecture

```
arena-game/
├── server.js          # Game server (734 lines)
│   ├── Game loop (60 tick)
│   ├── 7 weapon definitions
│   ├── 7 map definitions with obstacles
│   ├── 25 draft perks with stacking
│   ├── Bot AI system
│   ├── Room/lobby management
│   └── Socket.IO event handling
├── public/
│   └── index.html     # Single-file client (916 lines)
│       ├── HTML lobby UI
│       ├── CSS styling
│       ├── Canvas renderer
│       ├── Chiptune music engine
│       ├── i18n system (EN/ES)
│       └── Input handling
├── Dockerfile         # node:20-alpine, port 3000
└── package.json       # express + socket.io
```

**Zero external assets.** No images, no audio files, no CSS frameworks. Everything is generated at runtime — graphics via Canvas, music via Web Audio API oscillators.

### Tech Stack

- **Runtime**: Node.js 20
- **Server**: Express + Socket.IO
- **Rendering**: HTML5 Canvas 2D
- **Audio**: Web Audio API (OscillatorNode)
- **Container**: Docker (Alpine)
- **Network**: Socket.IO WebSockets, `--network host` for LAN

---

## 🌐 LAN Multiplayer

The game is designed for LAN play. Run the Docker container with `--network host` and share your machine's local IP:

```bash
# Find your IP
ip addr show | grep "inet " | grep -v 127.0.0.1

# Other players connect to:
# http://YOUR_IP:3000
```

Up to 4 human players. Empty slots are filled with bots.

---

## 📝 License

MIT
