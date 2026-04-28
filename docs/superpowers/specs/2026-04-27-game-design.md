# Game Design Spec — Echoes of the Void
*Date: 2026-04-27*

---

## Overview

A grimdark high-fantasy idle RPG with roguelike run structure, real-time horde combat, and deep character/gear progression. Inspired by Diablo 3/4, Hades, Vampire Survivors, Melvor Idle, DnD, and Final Fantasy.

**Core Fantasy:** Watch your hero tear through endless hordes of monsters while your build gets more powerful every session — even when you're not playing.

---

## Platform

- **Primary:** Browser (web-first, static site deployment)
- **Future:** Mobile-friendly responsive layout (375px breakpoint)
- **No backend required** for v1 — all state in LocalStorage

---

## Core Game Loop

### Run Loop (one session)
1. Select a class and enter a run with your current persistent gear equipped
2. Combat begins immediately — enemies spawn and swarm your hero in real time
3. Hero auto-attacks; player can pause at any moment to fire active abilities manually
4. Push through 10 waves per zone — waves 1-9 are enemy hordes, wave 10 is a boss
5. Clear the boss → advance to the next zone with harder enemies and better loot
6. Die at any point → run ends, rewards tallied, return to the meta hub
7. Gear found during the run persists to your character permanently

### Meta Loop (persists forever)
- Every run earns **Echoes** based on depth reached and enemies killed
- Spend Echoes at the Vault between runs on permanent upgrades
- Gear accumulates and makes future runs stronger
- Zone clears permanently unlock new starting points for future runs

### Idle Layer
- **Active play:** Combat auto-resolves; player optionally manages abilities manually
- **Offline:** On tab close, offline timer starts; on return, simulate waves cleared based on last-known stats, award gold/mats/XP — capped at 8 hours

---

## Character System

### Classes (3 at launch, more via Vault unlocks)

| Class | Identity | Primary Stat | Playstyle |
|---|---|---|---|
| **Warden** | Tank / Paladin hybrid | Strength | High survivability, shield-based, punishing counterattacks. Free starting class. |
| **Hexblade** | Magic-infused melee | Intellect | Spell-empowered weapon strikes, dark energy, buff/debuff focus. Vault unlock. |
| **Revenant** | Glass cannon / Death Knight | Agility | Grows stronger as HP drops. High risk, extreme reward. Vault unlock. |

### Core Stats
- **Strength** → physical damage, armor
- **Agility** → attack speed, dodge chance, crit chance
- **Intellect** → ability damage, cooldown reduction
- **Vitality** → max HP, HP regen

### Skill System
Each class has 12 skills total:
- 4 active abilities (usable via tactical pause; can be set to auto-fire on cooldown for idle play)
- 4 passive abilities (always-on effects)
- 4 unlockable via Vault (deepen build options over time)

Each run you **equip 4 actives + 4 passives** from your unlocked pool — every run is a build decision.

Skills carry **tags** (Fire, Shadow, Physical, Lightning, Arcane) that interact with gear affixes for build synergies.

---

## Combat System

### The Arena
- Top-down canvas view
- Hero stands in center
- Enemies spawn at edges and walk/charge toward the hero
- Hero auto-attacks nearest enemy continuously
- Damage numbers float up from hits

### Tactical Pause
- Spacebar (desktop) or pause button (mobile) freezes combat
- Player selects and fires active ability
- Time resumes when unpaused
- Idle players: set abilities to auto-fire on cooldown and walk away
- Engaged players: manage manually for better efficiency and timing

### Enemy Types
Each zone introduces new enemy archetypes:
- **Swarmer** — low HP, fast, spawns in large groups
- **Charger** — medium HP, rushes the hero in a straight line
- **Brute** — high HP, slow, hits hard
- **Ranged** — stays at distance, fires projectiles
- **Shielded** — blocks frontal attacks, must be flanked or stunned

### Enemy Affixes (elites, wave 5+)
Elites roll 1-2 affixes: Fast, Armored, Splitting (splits into two on death), Cursed (applies debuff on hit), Warded (damage immunity window).

### Boss Encounters (wave 10)
Handcrafted boss per zone with a visible health bar, unique attack patterns, and a guaranteed loot drop. Bosses are the primary skill-check of each zone.

### Visual Feedback
- Floating damage numbers (white = normal, yellow = crit, red = enemy damage)
- Hit flash on enemy sprites
- Particle burst on death
- Screen shake on boss hits

---

## Zone & Run Structure

### Zones (5 at launch)

| Zone | Name | Enemy Theme |
|---|---|---|
| 1 | Ruined Crypt | Undead, skeletons, crawlers |
| 2 | Blighted Wastes | Demons, plague beasts |
| 3 | Ashen Fortress | Armored soldiers, war constructs |
| 4 | Sunken Cathedral | Corrupted holy, spectral horrors |
| 5 | The Void | Eldritch, reality-breaking enemies |

### Wave Structure Per Zone
- Waves 1-4: Standard enemies, low density
- Waves 5-8: Mixed enemies, elites appear, density increases
- Wave 9: Maximum density, multiple elites
- Wave 10: Boss encounter

### Between-Wave Window
10-second breather after each wave:
- Partial HP regeneration
- Equip or swap gear from your inventory
- Review active cooldowns
- Auto-looted items flash for review (engaged mode)

### Zone Unlocks
After first clearing a zone, spend Echoes to unlock it as a **run starting point** — future runs can skip earlier zones entirely.

---

## Loot & Gear System

### Gear Slots (6)
Weapon, Offhand, Helm, Chest, Ring, Amulet

### Drop Sources
- Common enemies: rare drops
- Elite enemies: frequent drops
- Bosses: guaranteed drop (always Rare+)
- Loot auto-collects after a 2-second delay (Diablo style)

### Rarity Tiers

| Tier | Color | Affixes | Notes |
|---|---|---|---|
| Common | Grey | 1 | Vendor fodder |
| Uncommon | Green | 2 | Usable early |
| Rare | Blue | 3 | Real build pieces |
| Legendary | Gold | 2-3 + 1 unique | Build-defining unique affix |

### Affix Pool
Random rolls from: damage%, crit chance, crit damage, attack speed, HP, HP regen, resistances, on-kill effects, cooldown reduction, ability-specific bonuses. Affixes carry tags matching skill tags (Fire, Shadow, Physical, etc.) for build synergies.

### Legendary Unique Affixes (examples)
- *"Auto-attacks chain to 2 additional enemies"*
- *"On ability use: next auto-attack deals 300% damage"*
- *"Kills below 20% HP explode, dealing 50% of their max HP as area damage"*

### Persistence
**All gear persists between runs.** Gear found drops into your inventory and is yours permanently. Equip between waves or at the meta hub.

### Stash
- 4 storage tabs for hoarded gear
- Stash tab upgrades purchasable with gold
- Accessible from the meta hub between runs

### Inventory
- 20-slot persistent inventory (carries between runs)
- Loot drops auto-collect from the arena floor after a 2-second delay
- **Idle mode:** Auto-equip if item is strictly better than current slot (same slot, higher item power)
- **Engaged mode:** New drops flag for manual review during the between-wave window
- Auto-sell toggle for Common items to prevent inventory overflow
- When full: oldest Common items auto-sell to make room (with notification)

---

## Meta-Progression

### Currency: Echoes
Earned every run based on waves cleared and enemies killed. Awarded even on early death.

### The Vault (Echoes spending)

| Category | Upgrades |
|---|---|
| **Classes** | Unlock Hexblade, Revenant |
| **Skills** | Expand each class's unlocked skill pool |
| **Passive Tree** | Permanent stat nodes (HP, damage, crit, CDR) — PoE lite |
| **Stash** | Additional storage tabs |
| **Zone Start** | Unlock a cleared zone as a run starting point |
| **Automation** | Better offline sim accuracy, auto-sell rules, auto-ability settings |

### Progression Feel
Early runs: scraping through Zone 1 with basic gear, limited skills.
Mid game: decent gear banked, several Vault nodes unlocked, Zone 3 reachable.
Late game: legendary-tuned builds, all skills available, deep Zone 5 pushes.

---

## Offline / Idle System

### While Playing
Combat fully auto-resolves. Abilities fire on cooldown automatically (configurable). Player can pause and manually engage at any time.

### Offline Simulation
On tab close: timestamp saved with current player stats and last zone/wave.
On return: calculate waves the hero would have cleared based on stats vs. zone difficulty.
Award: gold and Echoes proportional to waves cleared.
Cap: 8 hours of offline progress.

### Automation Upgrades (via Vault)
- Improved offline accuracy (better enemy simulation model)
- Auto-sell lunk gear while offline
- Auto-ability priority configuration
- Auto-equip improvements

---

## Tech Architecture

### Stack
- **React + Vite** — component UI, fast dev server
- **Tailwind CSS** — utility styling, dark theme
- **HTML5 Canvas** — combat arena (game loop, entities, rendering, particles)
- **Zustand** — lightweight global state (player, inventory, run, meta)
- **LocalStorage** — persistent save/load

### Folder Structure
```
src/
  combat/        ← canvas engine (game loop, entities, enemy AI, rendering)
  systems/       ← game logic (loot gen, damage calc, wave spawner, offline sim)
  store/         ← Zustand state slices (player, inventory, run, meta)
  components/    ← React UI (HUD, menus, inventory, skill tree, vault)
  data/          ← static data (items, enemies, zones, skills, affixes)
```

### State Slices
- `playerStore` — class, stats, equipped gear, Echoes balance
- `inventoryStore` — stash, run inventory
- `runStore` — current zone, wave, active enemies, pending loot pickups
- `metaStore` — Vault purchases, zone unlocks, automation settings

### Save System
Serialize full game state to LocalStorage on:
- Every zone boss clear
- Every wave clear (lightweight snapshot)
- Tab close / visibility change event

### Deployment
Static site — `vite build` → `/dist` → deploy to Netlify/Vercel/GitHub Pages. No backend for v1.

### Mobile
Canvas scales to viewport. Touch: tap pause button, tap ability slots in HUD. Layout breakpoint at 768px. Combat arena scales down; UI panels stack vertically.

---

## Placeholder Visual Strategy

Build fully functional first, visual last.

**Phase 1 (now):** Colored circles/rectangles for hero and enemies. Tailwind UI for all menus. Functional, playable, testable.

**Phase 2 (after systems are solid):** Replace placeholders with illustrated character art, enemy sprites, zone backgrounds. Use Claude Design for asset generation.

**Visual Direction (when ready):** Stylized, UI-forward. Dark palette, grimdark high fantasy. Bold readable UI. Single icon set (Lucide or Phosphor). No pure black/white backgrounds.

---

## MVP Scope

The following must work before any visual polish:

- [ ] React + Vite + Tailwind project scaffolded
- [ ] Canvas combat arena with hero + enemy entities
- [ ] Game loop (10 ticks/sec), enemy spawning, movement toward hero
- [ ] Auto-attack combat with damage calculation and crits
- [ ] Tactical pause + 1 active ability per class
- [ ] Zone 1 with 10 waves + boss
- [ ] Basic loot drops (Common/Uncommon/Rare) with 3 affixes from pool
- [ ] Gear persistence to LocalStorage
- [ ] Inventory UI (20 slots, equip/unequip)
- [ ] Warden class fully playable
- [ ] Echoes currency earned per run
- [ ] Vault with passive stat nodes
- [ ] Offline simulation (8-hour cap)
- [ ] Basic save/load

Everything else (additional classes, Zones 2-5, Legendary items, stash, automation upgrades) is post-MVP.
