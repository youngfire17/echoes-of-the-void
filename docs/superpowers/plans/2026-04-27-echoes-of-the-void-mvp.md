# Echoes of the Void — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully playable browser idle/roguelike RPG MVP with real-time horde combat, persistent gear, one class (Warden), one zone (10 waves + boss), loot drops, and meta-progression (Echoes + Vault).

**Architecture:** React + Vite handles UI (menus, inventory, HUD); an HTML5 Canvas element runs the real-time combat arena with a fixed-timestep game loop; Zustand manages all game state; LocalStorage persists gear, echoes, and settings between sessions.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Zustand 4, Vitest, @testing-library/react, jsdom

---

## File Map

```
src/
  combat/
    GameLoop.js           — fixed-timestep RAF loop (logic at 10 ticks/sec, render at 60fps)
    CombatEngine.js       — orchestrates all combat: ticks enemies, hero attacks, ability cooldowns
    EnemyAI.js            — enemy movement toward hero, attack timing per enemy
    DamageCalculator.js   — pure function: calculateDamage(attackerStats, defenderStats) → {damage, isCrit}
    WaveSpawner.js        — pure function: getWaveConfig(zone, wave) → enemy spawn list
    ArenaRenderer.js      — canvas draw calls: hero, enemies, HP bars, floating numbers, particles

  systems/
    LootGenerator.js      — pure functions: generateLoot(zone, enemyType) → item
    OfflineSimulator.js   — pure function: calculateOfflineProgress(stats, zone, wave, elapsedMs) → rewards
    SaveManager.js        — save(state), load() → state | null, clearSave()

  store/
    playerStore.js        — class, base stats, equipped gear, Echoes balance, actions: equipItem, spendEchoes
    inventoryStore.js     — persistent 20-slot inventory + 4-tab stash, actions: addItem, removeItem, sellItem
    runStore.js           — active run state (zone, wave, phase, enemies, currentHp), actions: startRun, endRun
    metaStore.js          — vault purchases, zone unlocks, automation settings, offline timestamp

  data/
    classes.js            — Warden class definition (stats, skill IDs)
    skills.js             — 8 Warden skills (4 active, 4 passive) with effect descriptors
    enemies.js            — 5 Zone 1 enemy types + Lich Lord boss
    zones.js              — Zone 1 definition: 10 wave configs
    affixes.js            — ~14 affix definitions with value ranges and allowed slots
    items.js              — base item templates per slot

  components/
    GameCanvas.jsx        — React canvas wrapper, mounts CombatEngine + GameLoop on enter
    HUD.jsx               — in-combat overlay: HP bar, wave counter, 4 ability buttons, pause button
    AbilityBar.jsx        — 4 ability slots with cooldown fill animation
    InventoryPanel.jsx    — 6 gear slots + 20-slot inventory grid, equip/sell on click
    CharacterPanel.jsx    — class name, level, derived stats display
    VaultPanel.jsx        — passive stat node tree, Echoes balance, purchase on click
    RunEndScreen.jsx      — death/victory overlay, Echoes earned, Return to Hub button
    MetaHub.jsx           — between-runs screen: character, inventory, vault, start run button

  utils.js                — generateId(), distance(a, b), clamp(val, min, max)
  App.jsx                 — top-level view switcher: 'hub' | 'combat'
  main.jsx                — Vite entry
  index.css               — Tailwind directives

tests/
  DamageCalculator.test.js
  LootGenerator.test.js
  WaveSpawner.test.js
  OfflineSimulator.test.js
  SaveManager.test.js
```

---

## Task 1: Project Scaffold & Tooling

**Files:**
- Create: `package.json` (via vite scaffold)
- Create: `vite.config.js`
- Create: `vitest.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/index.css`
- Create: `src/main.jsx`
- Create: `src/App.jsx`

- [ ] **Step 1: Initialize Vite + React project**

```bash
cd "C:\Desktop\CLAUDE Projects\Game_1"
npm create vite@latest . -- --template react
```

When prompted "Current directory is not empty. Remove existing files and continue?" — choose **Yes**.

Expected output: `Done. Now run: npm install`

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install zustand
npm install -D tailwindcss@3 postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom @vitest/ui
```

- [ ] **Step 3: Initialize Tailwind**

```bash
npx tailwindcss init -p
```

- [ ] **Step 4: Configure tailwind.config.js**

Replace the generated file with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#0a0a0f',
          900: '#0f0f1a',
          800: '#1a1a2e',
          700: '#252540',
        },
        ember: {
          500: '#c0392b',
          400: '#e74c3c',
          300: '#ff6b6b',
        },
        gold: {
          500: '#d4af37',
          400: '#f0c040',
          300: '#ffd700',
        },
        echo: {
          500: '#6c3483',
          400: '#8e44ad',
          300: '#a569bd',
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Set up index.css**

Replace `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  background-color: #0a0a0f;
  color: #e2e8f0;
  font-family: 'Georgia', serif;
  margin: 0;
}

canvas {
  display: block;
}
```

- [ ] **Step 6: Configure Vitest**

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
  },
})
```

- [ ] **Step 7: Create test setup file**

```bash
mkdir tests
```

Create `tests/setup.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Replace App.jsx with placeholder**

```jsx
export default function App() {
  return (
    <div className="min-h-screen bg-void-950 flex items-center justify-center">
      <h1 className="text-gold-400 text-4xl font-bold">Echoes of the Void</h1>
    </div>
  )
}
```

- [ ] **Step 9: Create folder structure**

```bash
mkdir -p src/combat src/systems src/store src/data src/components
```

- [ ] **Step 10: Initialize git and commit**

```bash
git init
echo "node_modules/" > .gitignore
echo "dist/" >> .gitignore
echo ".env" >> .gitignore
git add -A
git commit -m "feat: scaffold React + Vite + Tailwind + Vitest project"
```

- [ ] **Step 11: Verify dev server starts**

```bash
npm run dev
```

Expected: Server running at `http://localhost:5173`. Open URL and confirm the "Echoes of the Void" title renders on a dark background.

---

## Task 2: Static Data Layer

**Files:**
- Create: `src/utils.js`
- Create: `src/data/classes.js`
- Create: `src/data/skills.js`
- Create: `src/data/enemies.js`
- Create: `src/data/zones.js`
- Create: `src/data/affixes.js`
- Create: `src/data/items.js`

- [ ] **Step 1: Create utils.js**

```js
// src/utils.js
let _idCounter = 0

export function generateId() {
  return `item_${Date.now()}_${_idCounter++}`
}

export function distance(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
```

- [ ] **Step 2: Create classes.js**

```js
// src/data/classes.js
export const CLASSES = {
  warden: {
    id: 'warden',
    name: 'Warden',
    description: 'Heavily armored guardian. High survivability, punishing counterattacks.',
    primaryStat: 'strength',
    color: '#4a90d9',
    baseStats: {
      maxHp: 150,
      strength: 18,
      agility: 8,
      intellect: 5,
      vitality: 14,
      attackSpeed: 1.2,
      attackRange: 65,
      damageFlat: 8,
      critChance: 0.05,
      critDamage: 0.5,
      armor: 15,
    },
    activeSkillIds: ['shield_slam', 'holy_light', 'consecration', 'divine_barrier'],
    passiveSkillIds: ['iron_will', 'blessed_armor', 'battle_hardened', 'retribution'],
  },
}
```

- [ ] **Step 3: Create skills.js**

```js
// src/data/skills.js
export const SKILLS = {
  // Active skills
  shield_slam: {
    id: 'shield_slam',
    name: 'Shield Slam',
    type: 'active',
    cooldown: 8,
    description: 'Deal 150% weapon damage to nearest enemy.',
    tags: ['physical'],
    effect: { type: 'damage_nearest', multiplier: 1.5 },
    icon: '🛡️',
  },
  holy_light: {
    id: 'holy_light',
    name: 'Holy Light',
    type: 'active',
    cooldown: 15,
    description: 'Restore 25% of maximum HP.',
    tags: ['holy'],
    effect: { type: 'heal_self', hpPercent: 0.25 },
    icon: '✨',
  },
  consecration: {
    id: 'consecration',
    name: 'Consecration',
    type: 'active',
    cooldown: 12,
    description: 'Deal 80% weapon damage to all enemies within 100px.',
    tags: ['holy', 'aoe'],
    effect: { type: 'damage_aoe', radius: 100, multiplier: 0.8 },
    icon: '🔆',
  },
  divine_barrier: {
    id: 'divine_barrier',
    name: 'Divine Barrier',
    type: 'active',
    cooldown: 20,
    description: 'Absorb up to 50% of your max HP in damage for 5 seconds.',
    tags: ['holy', 'shield'],
    effect: { type: 'shield', hpPercent: 0.5, duration: 5 },
    icon: '🔰',
  },
  // Passive skills
  iron_will: {
    id: 'iron_will',
    name: 'Iron Will',
    type: 'passive',
    description: '+20% maximum HP.',
    tags: ['physical'],
    effect: { type: 'stat_bonus', stat: 'maxHp', percent: 0.2 },
  },
  blessed_armor: {
    id: 'blessed_armor',
    name: 'Blessed Armor',
    type: 'passive',
    description: '+12% damage reduction.',
    tags: ['holy'],
    effect: { type: 'stat_bonus', stat: 'damageReduction', flat: 0.12 },
  },
  battle_hardened: {
    id: 'battle_hardened',
    name: 'Battle Hardened',
    type: 'passive',
    description: '+6% critical hit chance.',
    tags: ['physical'],
    effect: { type: 'stat_bonus', stat: 'critChance', flat: 0.06 },
  },
  retribution: {
    id: 'retribution',
    name: 'Retribution',
    type: 'passive',
    description: 'When hit, 20% chance to deal 50% of attacker\'s damage back.',
    tags: ['physical'],
    effect: { type: 'on_hit_retaliate', chance: 0.2, multiplier: 0.5 },
  },
}
```

- [ ] **Step 4: Create enemies.js**

```js
// src/data/enemies.js
export const ENEMIES = {
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    zone: 1,
    archetype: 'swarmer',
    color: '#c8c8c8',
    radius: 10,
    baseStats: { maxHp: 22, damage: 4, speed: 48, attackRange: 22, attackSpeed: 1.0, armor: 0 },
    xpReward: 4,
    goldReward: { min: 1, max: 3 },
    lootChance: 0.07,
    echoesReward: 1,
  },
  zombie: {
    id: 'zombie',
    name: 'Zombie',
    zone: 1,
    archetype: 'brute',
    color: '#6aaa6a',
    radius: 14,
    baseStats: { maxHp: 60, damage: 10, speed: 28, attackRange: 28, attackSpeed: 0.6, armor: 5 },
    xpReward: 8,
    goldReward: { min: 2, max: 5 },
    lootChance: 0.12,
    echoesReward: 2,
  },
  ghoul: {
    id: 'ghoul',
    name: 'Ghoul',
    zone: 1,
    archetype: 'charger',
    color: '#9b59b6',
    radius: 11,
    baseStats: { maxHp: 35, damage: 7, speed: 80, attackRange: 20, attackSpeed: 1.2, armor: 2 },
    xpReward: 6,
    goldReward: { min: 1, max: 4 },
    lootChance: 0.09,
    echoesReward: 1,
  },
  bone_archer: {
    id: 'bone_archer',
    name: 'Bone Archer',
    zone: 1,
    archetype: 'ranged',
    color: '#e8d5a3',
    radius: 10,
    baseStats: { maxHp: 28, damage: 6, speed: 30, attackRange: 200, attackSpeed: 0.8, armor: 0 },
    xpReward: 7,
    goldReward: { min: 2, max: 4 },
    lootChance: 0.1,
    echoesReward: 2,
  },
  skeleton_knight: {
    id: 'skeleton_knight',
    name: 'Skeleton Knight',
    zone: 1,
    archetype: 'elite',
    color: '#f39c12',
    radius: 16,
    baseStats: { maxHp: 120, damage: 14, speed: 40, attackRange: 28, attackSpeed: 0.9, armor: 12 },
    xpReward: 25,
    goldReward: { min: 8, max: 15 },
    lootChance: 0.6,
    echoesReward: 6,
  },
  lich_lord: {
    id: 'lich_lord',
    name: 'The Lich Lord',
    zone: 1,
    archetype: 'boss',
    color: '#8e44ad',
    radius: 24,
    baseStats: { maxHp: 500, damage: 18, speed: 20, attackRange: 35, attackSpeed: 0.7, armor: 20 },
    xpReward: 100,
    goldReward: { min: 40, max: 80 },
    lootChance: 1.0,
    echoesReward: 25,
  },
}
```

- [ ] **Step 5: Create zones.js**

Each wave entry: `{ enemies: [{id, count}], hasElite: bool, isBoss: bool }`

```js
// src/data/zones.js
export const ZONES = {
  1: {
    id: 1,
    name: 'Ruined Crypt',
    description: 'Ancient bones stir beneath crumbling stone.',
    backgroundColor: '#0d0d1a',
    waves: [
      { enemies: [{ id: 'skeleton', count: 5 }], hasElite: false, isBoss: false },
      { enemies: [{ id: 'skeleton', count: 6 }, { id: 'zombie', count: 1 }], hasElite: false, isBoss: false },
      { enemies: [{ id: 'skeleton', count: 6 }, { id: 'ghoul', count: 2 }], hasElite: false, isBoss: false },
      { enemies: [{ id: 'skeleton', count: 4 }, { id: 'zombie', count: 2 }, { id: 'bone_archer', count: 2 }], hasElite: false, isBoss: false },
      { enemies: [{ id: 'skeleton', count: 8 }, { id: 'ghoul', count: 3 }], hasElite: true, eliteId: 'skeleton_knight', isBoss: false },
      { enemies: [{ id: 'zombie', count: 3 }, { id: 'bone_archer', count: 3 }, { id: 'ghoul', count: 2 }], hasElite: true, eliteId: 'skeleton_knight', isBoss: false },
      { enemies: [{ id: 'skeleton', count: 10 }, { id: 'zombie', count: 2 }], hasElite: true, eliteId: 'skeleton_knight', isBoss: false },
      { enemies: [{ id: 'ghoul', count: 5 }, { id: 'bone_archer', count: 4 }, { id: 'zombie', count: 2 }], hasElite: true, eliteId: 'skeleton_knight', isBoss: false },
      { enemies: [{ id: 'skeleton', count: 12 }, { id: 'ghoul', count: 4 }, { id: 'bone_archer', count: 3 }], hasElite: true, eliteId: 'skeleton_knight', isBoss: false },
      { enemies: [{ id: 'lich_lord', count: 1 }], hasElite: false, isBoss: true },
    ],
  },
}
```

- [ ] **Step 6: Create affixes.js**

```js
// src/data/affixes.js
// valueRange: [min, max] — rolled as integer
export const AFFIXES = [
  { id: 'flat_damage',     tag: 'physical', stat: 'damageFlat',       label: '+{v} Physical Damage',       valueRange: [3, 10],   slots: ['weapon', 'ring', 'amulet'],       minRarity: 0 },
  { id: 'attack_speed',    tag: 'physical', stat: 'attackSpeedPct',   label: '+{v}% Attack Speed',          valueRange: [4, 12],   slots: ['weapon', 'ring'],                 minRarity: 0 },
  { id: 'crit_chance',     tag: 'physical', stat: 'critChanceFlat',   label: '+{v}% Crit Chance',           valueRange: [2, 6],    slots: ['helm', 'ring', 'amulet'],         minRarity: 1 },
  { id: 'crit_damage',     tag: 'physical', stat: 'critDamagePct',    label: '+{v}% Crit Damage',           valueRange: [10, 25],  slots: ['ring', 'amulet'],                 minRarity: 1 },
  { id: 'flat_hp',         tag: 'physical', stat: 'maxHpFlat',        label: '+{v} Maximum HP',             valueRange: [10, 35],  slots: ['helm', 'chest', 'ring'],          minRarity: 0 },
  { id: 'hp_regen',        tag: 'physical', stat: 'hpRegenFlat',      label: '+{v} HP Regen/sec',           valueRange: [1, 5],    slots: ['chest', 'ring', 'amulet'],        minRarity: 0 },
  { id: 'armor',           tag: 'physical', stat: 'armorFlat',        label: '+{v} Armor',                  valueRange: [5, 18],   slots: ['helm', 'chest', 'offhand'],       minRarity: 0 },
  { id: 'damage_reduction',tag: 'physical', stat: 'damageReductionPct',label: '+{v}% Damage Reduction',    valueRange: [2, 7],    slots: ['chest'],                          minRarity: 1 },
  { id: 'on_kill_heal',    tag: 'physical', stat: null,               label: 'Kill: Restore {v} HP',        valueRange: [2, 8],    slots: ['weapon', 'ring'],                 minRarity: 1, effectType: 'on_kill_heal' },
  { id: 'cooldown_reduction',tag:'arcane',  stat: 'cooldownReductionPct',label: '-{v}% Cooldowns',          valueRange: [5, 15],   slots: ['helm', 'ring', 'amulet'],         minRarity: 1 },
  { id: 'ability_damage',  tag: 'arcane',   stat: 'abilityDamagePct', label: '+{v}% Ability Damage',        valueRange: [8, 20],   slots: ['weapon', 'ring', 'amulet'],       minRarity: 1 },
  { id: 'strength_bonus',  tag: 'physical', stat: 'strengthFlat',     label: '+{v} Strength',               valueRange: [2, 6],    slots: ['helm', 'chest', 'amulet'],        minRarity: 0 },
  { id: 'vitality_bonus',  tag: 'physical', stat: 'vitalityFlat',     label: '+{v} Vitality',               valueRange: [2, 6],    slots: ['helm', 'chest', 'ring'],          minRarity: 0 },
  { id: 'thorns',          tag: 'physical', stat: null,               label: 'Return {v} damage when hit',  valueRange: [3, 10],   slots: ['chest', 'offhand'],               minRarity: 2, effectType: 'thorns' },
]

export const RARITY_AFFIX_COUNT = {
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 3,
}

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary']
```

- [ ] **Step 7: Create items.js**

```js
// src/data/items.js
export const BASE_ITEMS = {
  weapon:  { id: 'weapon',  name: 'Weapon',     slot: 'weapon',  baseDamage: 5, baseArmor: 0 },
  offhand: { id: 'offhand', name: 'Offhand',    slot: 'offhand', baseDamage: 0, baseArmor: 6 },
  helm:    { id: 'helm',    name: 'Helm',       slot: 'helm',    baseDamage: 0, baseArmor: 4 },
  chest:   { id: 'chest',   name: 'Chest',      slot: 'chest',   baseDamage: 0, baseArmor: 9 },
  ring:    { id: 'ring',    name: 'Ring',       slot: 'ring',    baseDamage: 0, baseArmor: 0 },
  amulet:  { id: 'amulet',  name: 'Amulet',     slot: 'amulet',  baseDamage: 0, baseArmor: 0 },
}

export const SLOTS = Object.keys(BASE_ITEMS)
```

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat: add static data layer (classes, skills, enemies, zones, affixes, items)"
```

---

## Task 3: Zustand Stores

**Files:**
- Create: `src/store/playerStore.js`
- Create: `src/store/inventoryStore.js`
- Create: `src/store/runStore.js`
- Create: `src/store/metaStore.js`

- [ ] **Step 1: Create playerStore.js**

```js
// src/store/playerStore.js
import { create } from 'zustand'
import { CLASSES } from '../data/classes'
import { SKILLS } from '../data/skills'
import { useMetaStore } from './metaStore'

const DEFAULT_CLASS = 'warden'

function buildDerivedStats(baseStats, equippedGear, passiveSkills, vaultBonuses = {}) {
  const stats = { ...baseStats }

  // Apply gear affixes
  for (const item of Object.values(equippedGear)) {
    if (!item) continue
    stats.damageFlat = (stats.damageFlat || 0) + (item.base?.baseDamage || 0)
    stats.armor = (stats.armor || 0) + (item.base?.baseArmor || 0)
    for (const affix of item.affixes || []) {
      if (affix.stat) {
        stats[affix.stat] = (stats[affix.stat] || 0) + affix.value
      }
    }
  }

  // Apply passive skills
  for (const skillId of passiveSkills) {
    const skill = SKILLS[skillId]
    if (!skill) continue
    if (skill.effect.type === 'on_hit_retaliate') {
      stats.retribution = { chance: skill.effect.chance, multiplier: skill.effect.multiplier }
      continue
    }
    if (skill.effect.type !== 'stat_bonus') continue
    const { stat, percent, flat } = skill.effect
    if (percent) stats[stat] = (stats[stat] || 0) * (1 + percent)
    if (flat) stats[stat] = (stats[stat] || 0) + flat
  }

  // Apply vault bonuses
  for (const [stat, value] of Object.entries(vaultBonuses)) {
    stats[stat] = (stats[stat] || 0) + value
  }

  // Apply percent modifiers to final values
  if (stats.attackSpeedPct) stats.attackSpeed *= (1 + stats.attackSpeedPct / 100)
  if (stats.maxHpFlat) stats.maxHp += stats.maxHpFlat
  if (stats.armorFlat) stats.armor += stats.armorFlat
  if (stats.strengthFlat) stats.strength += stats.strengthFlat
  if (stats.vitalityFlat) stats.vitality += stats.vitalityFlat
  if (stats.critChanceFlat) stats.critChance += stats.critChanceFlat / 100
  if (stats.critDamagePct) stats.critDamage += stats.critDamagePct / 100
  if (stats.cooldownReductionPct) stats.cooldownReduction = (stats.cooldownReductionPct || 0) / 100

  return stats
}

export const usePlayerStore = create((set, get) => ({
  classId: DEFAULT_CLASS,
  echoes: 0,
  equippedGear: { weapon: null, offhand: null, helm: null, chest: null, ring: null, amulet: null },
  activeSkillIds: [...CLASSES[DEFAULT_CLASS].activeSkillIds],
  passiveSkillIds: [...CLASSES[DEFAULT_CLASS].passiveSkillIds],

  getStats() {
    const { classId, equippedGear, passiveSkillIds } = get()
    const base = CLASSES[classId].baseStats
    const vaultBonuses = useMetaStore.getState().getVaultBonuses()
    return buildDerivedStats(base, equippedGear, passiveSkillIds, vaultBonuses)
  },

  equipItem(item) {
    set(state => ({
      equippedGear: { ...state.equippedGear, [item.slot]: item }
    }))
  },

  unequipItem(slot) {
    set(state => ({
      equippedGear: { ...state.equippedGear, [slot]: null }
    }))
  },

  addEchoes(amount) {
    set(state => ({ echoes: state.echoes + amount }))
  },

  spendEchoes(amount) {
    set(state => ({ echoes: Math.max(0, state.echoes - amount) }))
  },
}))
```

- [ ] **Step 2: Create inventoryStore.js**

```js
// src/store/inventoryStore.js
import { create } from 'zustand'

const MAX_INVENTORY_SLOTS = 20

export const useInventoryStore = create((set, get) => ({
  items: [],     // persistent inventory, max 20
  stash: [[], [], [], []],  // 4 stash tabs

  addItem(item) {
    set(state => {
      if (state.items.length >= MAX_INVENTORY_SLOTS) {
        // Auto-sell oldest common to make room
        const oldestCommonIdx = state.items.findIndex(i => i.rarity === 'common')
        if (oldestCommonIdx !== -1) {
          const remaining = [...state.items]
          remaining.splice(oldestCommonIdx, 1)
          return { items: [...remaining, item] }
        }
        return state // inventory full, no commons to sell
      }
      return { items: [...state.items, item] }
    })
  },

  removeItem(itemId) {
    set(state => ({ items: state.items.filter(i => i.id !== itemId) }))
  },

  sellItem(itemId) {
    // Gold handled separately via runStore; just remove from inventory
    set(state => ({ items: state.items.filter(i => i.id !== itemId) }))
  },

  moveToStash(itemId, tabIndex) {
    const { items, stash } = get()
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const newStash = stash.map((tab, i) => i === tabIndex ? [...tab, item] : tab)
    set({ items: items.filter(i => i.id !== itemId), stash: newStash })
  },

  moveFromStash(itemId, tabIndex) {
    const { items, stash } = get()
    if (items.length >= MAX_INVENTORY_SLOTS) return
    const tab = stash[tabIndex]
    const item = tab.find(i => i.id === itemId)
    if (!item) return
    const newStash = stash.map((t, i) => i === tabIndex ? t.filter(it => it.id !== itemId) : t)
    set({ items: [...items, item], stash: newStash })
  },
}))
```

- [ ] **Step 3: Create runStore.js**

```js
// src/store/runStore.js
import { create } from 'zustand'

export const useRunStore = create((set, get) => ({
  isActive: false,
  zone: 1,
  wave: 1,
  phase: 'idle',         // 'idle' | 'wave' | 'between' | 'boss' | 'ended'
  currentHp: 0,
  enemies: [],           // live enemy objects (managed by CombatEngine, mirrored here for HUD)
  pendingLoot: [],       // items waiting to be collected
  echoesEarned: 0,
  goldEarned: 0,
  isPaused: false,
  betweenWaveTimer: 10,

  startRun(maxHp) {
    set({
      isActive: true,
      zone: 1,
      wave: 1,
      phase: 'wave',
      currentHp: maxHp,
      enemies: [],
      pendingLoot: [],
      echoesEarned: 0,
      goldEarned: 0,
      isPaused: false,
    })
  },

  endRun() {
    set({ isActive: false, phase: 'ended' })
  },

  setPhase(phase) {
    set({ phase })
  },

  setCurrentHp(hp) {
    set({ currentHp: Math.max(0, hp) })
  },

  addPendingLoot(item) {
    set(state => ({ pendingLoot: [...state.pendingLoot, item] }))
  },

  clearPendingLoot() {
    set({ pendingLoot: [] })
  },

  advanceWave() {
    set(state => ({ wave: state.wave + 1, phase: 'wave' }))
  },

  addEchoes(amount) {
    set(state => ({ echoesEarned: state.echoesEarned + amount }))
  },

  addGold(amount) {
    set(state => ({ goldEarned: state.goldEarned + amount }))
  },

  togglePause() {
    set(state => ({ isPaused: !state.isPaused }))
  },
}))
```

- [ ] **Step 4: Create metaStore.js**

```js
// src/store/metaStore.js
import { create } from 'zustand'

// Vault passive node definitions
export const VAULT_NODES = [
  { id: 'hp_1',      label: '+25 Max HP',          cost: 10,  stat: 'maxHp',           value: 25 },
  { id: 'hp_2',      label: '+50 Max HP',           cost: 25,  stat: 'maxHp',           value: 50,  requires: 'hp_1' },
  { id: 'dmg_1',     label: '+5 Flat Damage',       cost: 10,  stat: 'damageFlat',      value: 5 },
  { id: 'dmg_2',     label: '+10 Flat Damage',      cost: 25,  stat: 'damageFlat',      value: 10,  requires: 'dmg_1' },
  { id: 'crit_1',    label: '+3% Crit Chance',      cost: 15,  stat: 'critChanceFlat',  value: 0.03 },
  { id: 'cdr_1',     label: '-8% Cooldowns',        cost: 20,  stat: 'cooldownReductionPct', value: 8 },
  { id: 'regen_1',   label: '+2 HP Regen/sec',      cost: 15,  stat: 'hpRegenFlat',     value: 2 },
  { id: 'armor_1',   label: '+10 Armor',            cost: 15,  stat: 'armorFlat',       value: 10 },
]

export const useMetaStore = create((set, get) => ({
  purchasedNodeIds: [],
  unlockedZones: [1],
  automationSettings: {
    autoEquip: true,
    autoSell: true,
    autoAbilities: false,
  },
  lastOfflineTimestamp: null,

  purchaseNode(nodeId, currentEchoes, spendEchoesFn) {
    const node = VAULT_NODES.find(n => n.id === nodeId)
    if (!node || get().purchasedNodeIds.includes(nodeId)) return false
    if (node.requires && !get().purchasedNodeIds.includes(node.requires)) return false
    if (currentEchoes < node.cost) return false
    spendEchoesFn(node.cost)
    set(state => ({ purchasedNodeIds: [...state.purchasedNodeIds, nodeId] }))
    return true
  },

  getVaultBonuses() {
    const { purchasedNodeIds } = get()
    const bonuses = {}
    for (const nodeId of purchasedNodeIds) {
      const node = VAULT_NODES.find(n => n.id === nodeId)
      if (node) bonuses[node.stat] = (bonuses[node.stat] || 0) + node.value
    }
    return bonuses
  },

  unlockZone(zoneId) {
    set(state => ({
      unlockedZones: state.unlockedZones.includes(zoneId)
        ? state.unlockedZones
        : [...state.unlockedZones, zoneId]
    }))
  },

  setAutomation(key, value) {
    set(state => ({
      automationSettings: { ...state.automationSettings, [key]: value }
    }))
  },

  setOfflineTimestamp(ts) {
    set({ lastOfflineTimestamp: ts })
  },
}))
```

- [ ] **Step 5: Commit**

```bash
git add src/store/
git commit -m "feat: add Zustand stores (player, inventory, run, meta)"
```

---

## Task 4: DamageCalculator (TDD)

**Files:**
- Create: `src/combat/DamageCalculator.js`
- Create: `tests/DamageCalculator.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/DamageCalculator.test.js
import { describe, it, expect, vi } from 'vitest'
import { calculateDamage } from '../src/combat/DamageCalculator'

const baseAttacker = {
  damageFlat: 10,
  strength: 20,
  critChance: 0,
  critDamage: 0.5,
  abilityDamagePct: 0,
}
const baseDefender = { armor: 0 }

describe('calculateDamage', () => {
  it('returns damage > 0 for basic attacker vs zero-armor defender', () => {
    const result = calculateDamage(baseAttacker, baseDefender)
    expect(result.damage).toBeGreaterThan(0)
  })

  it('applies crit multiplier when forced crit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // 0 < any critChance → always crit
    const attacker = { ...baseAttacker, critChance: 1 }
    const normal = calculateDamage({ ...baseAttacker, critChance: 0 }, baseDefender)
    const crit = calculateDamage(attacker, baseDefender)
    expect(crit.damage).toBeGreaterThan(normal.damage)
    expect(crit.isCrit).toBe(true)
    vi.restoreAllMocks()
  })

  it('armor reduces damage', () => {
    const armoredDefender = { armor: 50 }
    const result = calculateDamage(baseAttacker, armoredDefender)
    const unarmored = calculateDamage(baseAttacker, baseDefender)
    expect(result.damage).toBeLessThan(unarmored.damage)
  })

  it('damage is never less than 1', () => {
    const weakAttacker = { damageFlat: 1, strength: 1, critChance: 0, critDamage: 0.5, abilityDamagePct: 0 }
    const heavyArmor = { armor: 9999 }
    const result = calculateDamage(weakAttacker, heavyArmor)
    expect(result.damage).toBeGreaterThanOrEqual(1)
  })

  it('returns integer damage', () => {
    const result = calculateDamage(baseAttacker, baseDefender)
    expect(Number.isInteger(result.damage)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/DamageCalculator.test.js
```

Expected: FAIL — `Cannot find module '../src/combat/DamageCalculator'`

- [ ] **Step 3: Implement DamageCalculator.js**

```js
// src/combat/DamageCalculator.js
export function calculateDamage(attackerStats, defenderStats, isAbility = false) {
  const base = (attackerStats.damageFlat || 0) + (attackerStats.strength || 0) * 0.1
  const abilityBonus = isAbility ? (1 + (attackerStats.abilityDamagePct || 0) / 100) : 1
  const isCrit = Math.random() < (attackerStats.critChance || 0)
  const critMult = isCrit ? (1 + (attackerStats.critDamage || 0.5)) : 1
  const raw = base * abilityBonus * critMult
  const armor = defenderStats.armor || 0
  const reduction = armor / (armor + 100)
  const final = raw * (1 - reduction)
  return { damage: Math.max(1, Math.round(final)), isCrit }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/DamageCalculator.test.js
```

Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/combat/DamageCalculator.js tests/DamageCalculator.test.js
git commit -m "feat: DamageCalculator with TDD (5 passing tests)"
```

---

## Task 5: LootGenerator (TDD)

**Files:**
- Create: `src/systems/LootGenerator.js`
- Create: `tests/LootGenerator.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/LootGenerator.test.js
import { describe, it, expect } from 'vitest'
import { generateLoot, rollRarity } from '../src/systems/LootGenerator'
import { RARITY_AFFIX_COUNT } from '../src/data/affixes'
import { SLOTS } from '../src/data/items'

describe('rollRarity', () => {
  it('boss always returns at least uncommon', () => {
    for (let i = 0; i < 100; i++) {
      const r = rollRarity('boss')
      expect(['uncommon', 'rare', 'legendary']).toContain(r)
    }
  })

  it('returns a valid rarity string', () => {
    const valid = ['common', 'uncommon', 'rare', 'legendary']
    expect(valid).toContain(rollRarity('normal'))
  })
})

describe('generateLoot', () => {
  it('returns item with correct affix count for common rarity', () => {
    const item = generateLoot(1, 'normal', 'common')
    expect(item.affixes.length).toBe(RARITY_AFFIX_COUNT.common)
  })

  it('returns item with correct affix count for rare rarity', () => {
    const item = generateLoot(1, 'normal', 'rare')
    expect(item.affixes.length).toBe(RARITY_AFFIX_COUNT.rare)
  })

  it('item slot is a valid slot', () => {
    const item = generateLoot(1, 'normal')
    expect(SLOTS).toContain(item.slot)
  })

  it('all affixes have values within their defined range', () => {
    for (let i = 0; i < 20; i++) {
      const item = generateLoot(1, 'normal', 'rare')
      for (const affix of item.affixes) {
        expect(affix.value).toBeGreaterThanOrEqual(affix.valueRange[0])
        expect(affix.value).toBeLessThanOrEqual(affix.valueRange[1])
      }
    }
  })

  it('item has required fields', () => {
    const item = generateLoot(1, 'normal')
    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('slot')
    expect(item).toHaveProperty('rarity')
    expect(item).toHaveProperty('affixes')
    expect(item).toHaveProperty('base')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/LootGenerator.test.js
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement LootGenerator.js**

```js
// src/systems/LootGenerator.js
import { AFFIXES, RARITY_AFFIX_COUNT } from '../data/affixes'
import { BASE_ITEMS, SLOTS } from '../data/items'
import { generateId, randomBetween } from '../utils'

export function rollRarity(enemyArchetype, forcedRarity = null) {
  if (forcedRarity) return forcedRarity
  const roll = Math.random()
  if (enemyArchetype === 'boss') {
    if (roll < 0.05) return 'legendary'
    if (roll < 0.35) return 'rare'
    return 'uncommon'
  }
  if (enemyArchetype === 'elite') {
    if (roll < 0.02) return 'legendary'
    if (roll < 0.18) return 'rare'
    if (roll < 0.55) return 'uncommon'
    return 'common'
  }
  if (roll < 0.005) return 'legendary'
  if (roll < 0.05) return 'rare'
  if (roll < 0.22) return 'uncommon'
  return 'common'
}

function rollAffixes(slot, rarity, count) {
  const rarityIndex = ['common', 'uncommon', 'rare', 'legendary'].indexOf(rarity)
  const eligible = AFFIXES.filter(a =>
    a.slots.includes(slot) && a.minRarity <= rarityIndex
  )
  const selected = []
  const pool = [...eligible]
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    const affix = pool.splice(idx, 1)[0]
    const value = randomBetween(affix.valueRange[0], affix.valueRange[1])
    selected.push({ ...affix, value })
  }
  return selected
}

export function generateLoot(zone, enemyArchetype, forcedRarity = null) {
  const rarity = rollRarity(enemyArchetype, forcedRarity)
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)]
  const base = BASE_ITEMS[slot]
  const affixCount = RARITY_AFFIX_COUNT[rarity]
  const affixes = rollAffixes(slot, rarity, affixCount)
  return {
    id: generateId(),
    slot,
    rarity,
    base,
    affixes,
    zone,
    name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${base.name}`,
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/LootGenerator.test.js
```

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/LootGenerator.js tests/LootGenerator.test.js
git commit -m "feat: LootGenerator with TDD (7 passing tests)"
```

---

## Task 6: WaveSpawner (TDD)

**Files:**
- Create: `src/combat/WaveSpawner.js`
- Create: `tests/WaveSpawner.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/WaveSpawner.test.js
import { describe, it, expect } from 'vitest'
import { getWaveConfig } from '../src/combat/WaveSpawner'
import { ZONES } from '../src/data/zones'

describe('getWaveConfig', () => {
  it('wave 10 of zone 1 is a boss wave', () => {
    const config = getWaveConfig(1, 10)
    expect(config.isBoss).toBe(true)
  })

  it('wave 1 of zone 1 is not a boss wave', () => {
    const config = getWaveConfig(1, 1)
    expect(config.isBoss).toBe(false)
  })

  it('wave 5+ of zone 1 can have an elite', () => {
    const config = getWaveConfig(1, 5)
    expect(config.hasElite).toBe(true)
  })

  it('returns enemy list with at least one entry', () => {
    const config = getWaveConfig(1, 3)
    expect(config.enemies.length).toBeGreaterThan(0)
  })

  it('all enemy IDs in wave config are defined in ENEMIES data', () => {
    const { ENEMIES } = require('../src/data/enemies')
    for (let wave = 1; wave <= 10; wave++) {
      const config = getWaveConfig(1, wave)
      for (const entry of config.enemies) {
        expect(ENEMIES).toHaveProperty(entry.id)
      }
    }
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/WaveSpawner.test.js
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement WaveSpawner.js**

```js
// src/combat/WaveSpawner.js
import { ZONES } from '../data/zones'
import { ENEMIES } from '../data/enemies'

export function getWaveConfig(zoneId, waveNumber) {
  const zone = ZONES[zoneId]
  if (!zone) throw new Error(`Zone ${zoneId} not found`)
  const waveIndex = waveNumber - 1
  const waveDef = zone.waves[waveIndex]
  if (!waveDef) throw new Error(`Wave ${waveNumber} not found in zone ${zoneId}`)
  return waveDef
}

export function buildSpawnQueue(zoneId, waveNumber) {
  const config = getWaveConfig(zoneId, waveNumber)
  const queue = []

  for (const entry of config.enemies) {
    const enemyDef = ENEMIES[entry.id]
    for (let i = 0; i < entry.count; i++) {
      queue.push({
        ...enemyDef,
        instanceId: `${entry.id}_w${waveNumber}_${i}`,
        currentHp: enemyDef.baseStats.maxHp,
        stats: { ...enemyDef.baseStats },
        attackTimer: 0,
        spawnDelay: i * 0.4, // stagger spawns 400ms apart
      })
    }
  }

  if (config.hasElite && config.eliteId) {
    const eliteDef = ENEMIES[config.eliteId]
    queue.push({
      ...eliteDef,
      instanceId: `${config.eliteId}_w${waveNumber}_elite`,
      currentHp: eliteDef.baseStats.maxHp,
      stats: { ...eliteDef.baseStats },
      attackTimer: 0,
      spawnDelay: queue.length * 0.4 + 1.0,
      isElite: true,
    })
  }

  return queue
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/WaveSpawner.test.js
```

Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/combat/WaveSpawner.js tests/WaveSpawner.test.js
git commit -m "feat: WaveSpawner with TDD (5 passing tests)"
```

---

## Task 7: GameLoop

**Files:**
- Create: `src/combat/GameLoop.js`

- [ ] **Step 1: Implement GameLoop.js**

```js
// src/combat/GameLoop.js
const TICK_INTERVAL_MS = 100 // 10 logic ticks per second

export class GameLoop {
  constructor(onLogicTick, onRender) {
    this.onLogicTick = onLogicTick
    this.onRender = onRender
    this.running = false
    this.rafId = null
    this.lastTimestamp = 0
    this.tickAccumulator = 0
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastTimestamp = performance.now()
    this.rafId = requestAnimationFrame(this._loop.bind(this))
  }

  stop() {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  _loop(timestamp) {
    if (!this.running) return

    const delta = Math.min(timestamp - this.lastTimestamp, 200) // cap at 200ms to prevent spiral
    this.lastTimestamp = timestamp
    this.tickAccumulator += delta

    while (this.tickAccumulator >= TICK_INTERVAL_MS) {
      this.onLogicTick(TICK_INTERVAL_MS / 1000) // dt in seconds (always 0.1)
      this.tickAccumulator -= TICK_INTERVAL_MS
    }

    this.onRender()
    this.rafId = requestAnimationFrame(this._loop.bind(this))
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/combat/GameLoop.js
git commit -m "feat: fixed-timestep GameLoop with RAF rendering"
```

---

## Task 8: ArenaRenderer

**Files:**
- Create: `src/combat/ArenaRenderer.js`

The renderer draws from a snapshot object passed in each frame. It does not read stores directly — it only draws what it's given.

- [ ] **Step 1: Implement ArenaRenderer.js**

```js
// src/combat/ArenaRenderer.js
const HERO_RADIUS = 18
const ARENA_W = 800
const ARENA_H = 500

export class ArenaRenderer {
  constructor(ctx) {
    this.ctx = ctx
    this.floatingNumbers = [] // { x, y, value, isCrit, age, maxAge }
  }

  addFloatingNumber(x, y, value, isCrit) {
    this.floatingNumbers.push({ x, y, value, isCrit, age: 0, maxAge: 1.2 })
  }

  render(snapshot) {
    const { ctx } = this
    const { enemies, heroX, heroY, heroHpPct, isPaused, shield } = snapshot

    // Background
    ctx.fillStyle = '#0d0d1a'
    ctx.fillRect(0, 0, ARENA_W, ARENA_H)

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let x = 0; x < ARENA_W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ARENA_H); ctx.stroke()
    }
    for (let y = 0; y < ARENA_H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ARENA_W, y); ctx.stroke()
    }

    // Enemies
    for (const enemy of enemies) {
      this._drawEnemy(ctx, enemy)
    }

    // Hero
    this._drawHero(ctx, heroX, heroY, heroHpPct, shield)

    // Floating numbers (advance age each frame at ~60fps → 0.016 per frame)
    this.floatingNumbers = this.floatingNumbers.filter(n => n.age < n.maxAge)
    for (const n of this.floatingNumbers) {
      n.age += 0.016
      n.y -= 0.5
      const alpha = 1 - (n.age / n.maxAge)
      ctx.globalAlpha = alpha
      ctx.font = n.isCrit ? 'bold 18px Georgia' : '14px Georgia'
      ctx.fillStyle = n.isCrit ? '#ffd700' : '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText(Math.round(n.value), n.x, n.y)
    }
    ctx.globalAlpha = 1

    // Pause overlay
    if (isPaused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, ARENA_W, ARENA_H)
      ctx.fillStyle = '#f0c040'
      ctx.font = 'bold 32px Georgia'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSED', ARENA_W / 2, ARENA_H / 2)
    }
  }

  _drawHero(ctx, x, y, hpPct, shieldActive) {
    // Shield aura
    if (shieldActive) {
      ctx.beginPath()
      ctx.arc(x, y, HERO_RADIUS + 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(100,180,255,0.6)'
      ctx.lineWidth = 3
      ctx.stroke()
    }
    // Hero circle
    ctx.beginPath()
    ctx.arc(x, y, HERO_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#4a90d9'
    ctx.fill()
    ctx.strokeStyle = '#82c4ff'
    ctx.lineWidth = 2
    ctx.stroke()
    // HP arc
    if (hpPct < 1) {
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + Math.PI * 2 * hpPct
      ctx.beginPath()
      ctx.arc(x, y, HERO_RADIUS + 5, startAngle, endAngle)
      ctx.strokeStyle = hpPct > 0.4 ? '#2ecc71' : '#e74c3c'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }

  _drawEnemy(ctx, enemy) {
    const { x, y, radius, color, currentHp, stats, isElite, isBoss } = enemy
    const hpPct = currentHp / stats.maxHp

    // Glow for elite/boss
    if (isElite || isBoss) {
      ctx.beginPath()
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2)
      ctx.fillStyle = isBoss ? 'rgba(142,68,173,0.3)' : 'rgba(243,156,18,0.3)'
      ctx.fill()
    }

    // Enemy body
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    // HP bar above enemy
    const barW = radius * 2.5
    const barH = 4
    const barX = x - barW / 2
    const barY = y - radius - 10
    ctx.fillStyle = '#333'
    ctx.fillRect(barX, barY, barW, barH)
    ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c'
    ctx.fillRect(barX, barY, barW * hpPct, barH)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/combat/ArenaRenderer.js
git commit -m "feat: ArenaRenderer for canvas drawing (hero, enemies, floating numbers)"
```

---

## Task 9: CombatEngine & EnemyAI

**Files:**
- Create: `src/combat/EnemyAI.js`
- Create: `src/combat/CombatEngine.js`

- [ ] **Step 1: Implement EnemyAI.js**

```js
// src/combat/EnemyAI.js
import { distance } from '../utils'

export function moveEnemyTowardHero(enemy, heroX, heroY, dt) {
  const dx = heroX - enemy.x
  const dy = heroY - enemy.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist <= enemy.stats.attackRange) return // already in range, don't move
  const speed = enemy.stats.speed * dt
  enemy.x += (dx / dist) * speed
  enemy.y += (dy / dist) * speed
}

export function tickEnemyAttack(enemy, heroX, heroY, dt, onHit) {
  const dist = distance({ x: enemy.x, y: enemy.y }, { x: heroX, y: heroY })
  if (dist > enemy.stats.attackRange) return

  enemy.attackTimer = (enemy.attackTimer || 0) + dt
  const interval = 1 / enemy.stats.attackSpeed
  if (enemy.attackTimer >= interval) {
    enemy.attackTimer -= interval
    onHit(enemy.stats.damage)
  }
}
```

- [ ] **Step 2: Implement CombatEngine.js**

```js
// src/combat/CombatEngine.js
import { calculateDamage } from './DamageCalculator'
import { moveEnemyTowardHero, tickEnemyAttack } from './EnemyAI'
import { buildSpawnQueue } from './WaveSpawner'
import { generateLoot } from '../systems/LootGenerator'
import { distance } from '../utils'
import { ENEMIES } from '../data/enemies'

const ARENA_W = 800
const ARENA_H = 500
const HERO_X = ARENA_W / 2
const HERO_Y = ARENA_H / 2

export class CombatEngine {
  constructor() {
    this.reset()
  }

  reset() {
    this.enemies = []
    this.spawnQueue = []
    this.spawnTimer = 0
    this.heroHp = 0
    this.heroMaxHp = 0
    this.heroStats = {}
    this.heroAttackTimer = 0
    this.wave = 1
    this.zone = 1
    this.phase = 'idle'
    this.betweenWaveTimer = 0
    this.shield = null        // { remaining: hp }
    this.skillCooldowns = {}  // skillId → seconds remaining
    this.pendingLoot = []
    this.lootTimers = []      // { item, timer }
    this.callbacks = {}
  }

  on(event, fn) {
    this.callbacks[event] = fn
  }

  _emit(event, data) {
    if (this.callbacks[event]) this.callbacks[event](data)
  }

  startRun(heroStats, zone = 1) {
    this.reset()
    this.heroStats = { ...heroStats }
    this.heroHp = heroStats.maxHp
    this.heroMaxHp = heroStats.maxHp
    this.zone = zone
    this.wave = 1
    this.phase = 'wave'
    this._loadWave()
  }

  _loadWave() {
    this.spawnQueue = buildSpawnQueue(this.zone, this.wave)
    this.spawnTimer = 0
    this.enemies = []
    this.phase = 'wave'
  }

  tick(dt) {
    if (this.phase === 'idle' || this.phase === 'ended') return
    if (this.phase === 'between') {
      this.betweenWaveTimer -= dt
      if (this.betweenWaveTimer <= 0) {
        this.wave++
        if (this.wave > 10) {
          this.phase = 'ended'
          this._emit('run_complete', {})
          return
        }
        this._loadWave()
      }
      return
    }

    // Tick skill cooldowns
    for (const skillId of Object.keys(this.skillCooldowns)) {
      this.skillCooldowns[skillId] = Math.max(0, this.skillCooldowns[skillId] - dt)
    }

    // Tick shield duration
    if (this.shield) {
      this.shield.duration -= dt
      if (this.shield.duration <= 0) this.shield = null
    }

    // Spawn queued enemies
    this.spawnTimer += dt
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnDelay <= this.spawnTimer) {
      const enemy = this.spawnQueue.shift()
      enemy.x = this._randomEdgeX()
      enemy.y = this._randomEdgeY()
      this.enemies.push(enemy)
    }

    // Loot pickup timers
    this.lootTimers = this.lootTimers.filter(lt => {
      lt.timer -= dt
      if (lt.timer <= 0) {
        this.pendingLoot.push(lt.item)
        this._emit('loot_drop', lt.item)
        return false
      }
      return true
    })

    // Enemy movement and attacks
    for (const enemy of this.enemies) {
      moveEnemyTowardHero(enemy, HERO_X, HERO_Y, dt)
      tickEnemyAttack(enemy, HERO_X, HERO_Y, dt, (dmg) => {
        this._heroTakeHit(dmg, enemy)
      })
    }

    // Hero auto-attack
    this.heroAttackTimer += dt
    const attackInterval = 1 / (this.heroStats.attackSpeed || 1)
    if (this.heroAttackTimer >= attackInterval) {
      this.heroAttackTimer -= attackInterval
      this._heroAutoAttack()
    }

    // HP regen
    const regen = this.heroStats.hpRegenFlat || 0
    if (regen > 0) {
      this.heroHp = Math.min(this.heroMaxHp, this.heroHp + regen * dt)
    }

    // Wave cleared?
    if (this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.phase = 'between'
      this.betweenWaveTimer = 10
      this._emit('wave_cleared', { wave: this.wave, zone: this.zone })
    }
  }

  fireSkill(skillId, skillDef) {
    if ((this.skillCooldowns[skillId] || 0) > 0) return
    const cdr = this.heroStats.cooldownReduction || 0
    this.skillCooldowns[skillId] = skillDef.cooldown * (1 - cdr)

    const effect = skillDef.effect
    const renderer = this.callbacks['renderer']

    if (effect.type === 'damage_nearest') {
      const target = this._findNearestEnemy()
      if (!target) return
      const { damage, isCrit } = calculateDamage(this.heroStats, target.stats, true)
      const finalDmg = Math.round(damage * effect.multiplier)
      target.currentHp -= finalDmg
      this._emit('floating_number', { x: target.x, y: target.y, value: finalDmg, isCrit })
      if (target.currentHp <= 0) this._killEnemy(target)
    }

    if (effect.type === 'heal_self') {
      const heal = Math.round(this.heroMaxHp * effect.hpPercent)
      this.heroHp = Math.min(this.heroMaxHp, this.heroHp + heal)
      this._emit('floating_number', { x: HERO_X, y: HERO_Y - 30, value: heal, isCrit: false })
    }

    if (effect.type === 'damage_aoe') {
      for (const enemy of [...this.enemies]) {
        const dist = distance({ x: HERO_X, y: HERO_Y }, { x: enemy.x, y: enemy.y })
        if (dist <= effect.radius) {
          const { damage, isCrit } = calculateDamage(this.heroStats, enemy.stats, true)
          const finalDmg = Math.round(damage * effect.multiplier)
          enemy.currentHp -= finalDmg
          this._emit('floating_number', { x: enemy.x, y: enemy.y, value: finalDmg, isCrit })
          if (enemy.currentHp <= 0) this._killEnemy(enemy)
        }
      }
    }

    if (effect.type === 'shield') {
      const shieldHp = Math.round(this.heroMaxHp * effect.hpPercent)
      this.shield = { remaining: shieldHp, duration: effect.duration }
    }
  }

  _heroAutoAttack() {
    const target = this._findNearestEnemy()
    if (!target) return
    const dist = distance({ x: HERO_X, y: HERO_Y }, { x: target.x, y: target.y })
    if (dist > (this.heroStats.attackRange || 65)) return

    const { damage, isCrit } = calculateDamage(this.heroStats, target.stats)
    target.currentHp -= damage
    this._emit('floating_number', { x: target.x, y: target.y, value: damage, isCrit })
    if (target.currentHp <= 0) this._killEnemy(target)
  }

  _heroTakeHit(rawDmg, enemy) {
    let dmg = rawDmg
    const reduction = this.heroStats.damageReduction || 0
    dmg = Math.max(1, Math.round(dmg * (1 - reduction)))

    if (this.shield && this.shield.remaining > 0) {
      const absorbed = Math.min(this.shield.remaining, dmg)
      this.shield.remaining -= absorbed
      dmg -= absorbed
      if (this.shield.remaining <= 0) this.shield = null
    }

    this.heroHp -= dmg
    this._emit('hero_damaged', { damage: dmg })

    // Retribution passive check
    const retrib = this.heroStats.retribution
    if (retrib && Math.random() < retrib.chance) {
      const reflected = Math.round(rawDmg * retrib.multiplier)
      enemy.currentHp -= reflected
      this._emit('floating_number', { x: enemy.x, y: enemy.y, value: reflected, isCrit: false })
      if (enemy.currentHp <= 0) this._killEnemy(enemy)
    }

    if (this.heroHp <= 0) {
      this.heroHp = 0
      this.phase = 'ended'
      this._emit('hero_died', {})
    }
  }

  _killEnemy(enemy) {
    this.enemies = this.enemies.filter(e => e.instanceId !== enemy.instanceId)
    this._emit('enemy_killed', { enemy })

    // Loot roll
    if (Math.random() < enemy.lootChance) {
      const item = generateLoot(this.zone, enemy.archetype)
      this.lootTimers.push({ item, timer: 2.0 }) // collect after 2s
    }
  }

  _findNearestEnemy() {
    if (this.enemies.length === 0) return null
    let nearest = null
    let minDist = Infinity
    for (const e of this.enemies) {
      const d = distance({ x: HERO_X, y: HERO_Y }, { x: e.x, y: e.y })
      if (d < minDist) { minDist = d; nearest = e }
    }
    return nearest
  }

  _randomEdgeX() {
    const edge = Math.floor(Math.random() * 4)
    if (edge === 0) return Math.random() * ARENA_W
    if (edge === 1) return Math.random() * ARENA_W
    if (edge === 2) return 0
    return ARENA_W
  }

  _randomEdgeY() {
    const edge = Math.floor(Math.random() * 4)
    if (edge === 0) return 0
    if (edge === 1) return ARENA_H
    if (edge === 2) return Math.random() * ARENA_H
    return Math.random() * ARENA_H
  }

  getSnapshot() {
    return {
      enemies: this.enemies,
      heroX: HERO_X,
      heroY: HERO_Y,
      heroHpPct: this.heroHp / this.heroMaxHp,
      heroHp: this.heroHp,
      heroMaxHp: this.heroMaxHp,
      isPaused: false, // pause is handled outside engine
      shield: this.shield,
      phase: this.phase,
      wave: this.wave,
      zone: this.zone,
      skillCooldowns: { ...this.skillCooldowns },
      betweenWaveTimer: this.betweenWaveTimer,
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/combat/EnemyAI.js src/combat/CombatEngine.js
git commit -m "feat: CombatEngine and EnemyAI (auto-attack, horde movement, wave management)"
```

---

## Task 10: GameCanvas + HUD Components

**Files:**
- Create: `src/components/GameCanvas.jsx`
- Create: `src/components/HUD.jsx`
- Create: `src/components/AbilityBar.jsx`

- [ ] **Step 1: Implement AbilityBar.jsx**

```jsx
// src/components/AbilityBar.jsx
import { SKILLS } from '../data/skills'

export function AbilityBar({ activeSkillIds, cooldowns, onFire, autoAbilities }) {
  return (
    <div className="flex gap-2 justify-center">
      {activeSkillIds.map(skillId => {
        const skill = SKILLS[skillId]
        const remaining = cooldowns[skillId] || 0
        const pct = remaining > 0 ? remaining / skill.cooldown : 0
        return (
          <button
            key={skillId}
            onClick={() => onFire(skillId)}
            disabled={remaining > 0}
            className="relative w-14 h-14 rounded border border-gray-600 bg-void-800 hover:border-gold-400 disabled:opacity-50 flex flex-col items-center justify-center text-lg"
            title={`${skill.name}: ${skill.description}`}
          >
            <span>{skill.icon}</span>
            <span className="text-xs text-gray-400">{skill.name.split(' ')[0]}</span>
            {pct > 0 && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b"
                style={{ width: `${(1 - pct) * 100}%` }}
              />
            )}
            {remaining > 0 && (
              <span className="absolute top-0 right-1 text-xs text-yellow-300">
                {remaining.toFixed(1)}s
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Implement HUD.jsx**

```jsx
// src/components/HUD.jsx
import { AbilityBar } from './AbilityBar'

export function HUD({ snapshot, activeSkillIds, onFire, onPause, isPaused, echoesEarned, goldEarned }) {
  const { heroHp, heroMaxHp, wave, zone, phase, skillCooldowns, betweenWaveTimer } = snapshot
  const hpPct = heroHp / heroMaxHp
  const hpColor = hpPct > 0.5 ? 'bg-green-500' : hpPct > 0.25 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex flex-col gap-2 p-3 bg-void-900 border-t border-gray-700">
      {/* Top row: HP bar + wave info + pause */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>HP</span>
            <span>{Math.ceil(heroHp)} / {heroMaxHp}</span>
          </div>
          <div className="h-4 bg-gray-800 rounded overflow-hidden">
            <div
              className={`h-full ${hpColor} transition-all duration-100`}
              style={{ width: `${hpPct * 100}%` }}
            />
          </div>
        </div>
        <div className="text-center min-w-[100px]">
          <div className="text-gold-400 font-bold">Zone {zone}</div>
          <div className="text-sm text-gray-400">
            {phase === 'between'
              ? `Wave ${wave} clear! (${Math.ceil(betweenWaveTimer)}s)`
              : `Wave ${wave}/10`}
          </div>
        </div>
        <button
          onClick={onPause}
          className="px-4 py-2 bg-void-800 border border-gray-600 rounded hover:border-gold-400 text-sm"
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      {/* Ability bar */}
      <AbilityBar
        activeSkillIds={activeSkillIds}
        cooldowns={skillCooldowns}
        onFire={onFire}
        autoAbilities={false}
      />

      {/* Run stats */}
      <div className="flex gap-4 text-xs text-gray-500 justify-center">
        <span>⚡ {echoesEarned} Echoes</span>
        <span>💰 {goldEarned} Gold</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement GameCanvas.jsx**

```jsx
// src/components/GameCanvas.jsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { GameLoop } from '../combat/GameLoop'
import { CombatEngine } from '../combat/CombatEngine'
import { ArenaRenderer } from '../combat/ArenaRenderer'
import { HUD } from './HUD'
import { usePlayerStore } from '../store/playerStore'
import { useRunStore } from '../store/runStore'
import { useInventoryStore } from '../store/inventoryStore'
import { SKILLS } from '../data/skills'

const ARENA_W = 800
const ARENA_H = 500

export function GameCanvas({ onRunEnd }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const rendererRef = useRef(null)
  const loopRef = useRef(null)
  const [snapshot, setSnapshot] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)

  const playerStore = usePlayerStore()
  const runStore = useRunStore()
  const inventoryStore = useInventoryStore()

  const activeSkillIds = playerStore.activeSkillIds

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const engine = new CombatEngine()
    const renderer = new ArenaRenderer(ctx)

    engineRef.current = engine
    rendererRef.current = renderer

    const heroStats = playerStore.getStats()
    engine.startRun(heroStats, 1)
    runStore.startRun(heroStats.maxHp)

    // Wire engine events
    engine.on('hero_died', () => {
      const { echoesEarned, goldEarned } = runStore
      runStore.endRun()
      playerStore.addEchoes(echoesEarned)
      onRunEnd({ reason: 'death', echoesEarned, goldEarned, wave: engine.wave })
    })

    engine.on('wave_cleared', ({ wave, zone }) => {
      runStore.setPhase('between')
    })

    engine.on('loot_drop', (item) => {
      runStore.addPendingLoot(item)
      if (useMetaStore.getState().automationSettings.autoEquip) {
        const equipped = playerStore.equippedGear[item.slot]
        if (!equipped) {
          playerStore.equipItem(item)
          return
        }
      }
      inventoryStore.addItem(item)
    })

    engine.on('enemy_killed', ({ enemy }) => {
      runStore.addEchoes(enemy.echoesReward)
      runStore.addGold(Math.round(Math.random() * (enemy.goldReward.max - enemy.goldReward.min) + enemy.goldReward.min))
    })

    engine.on('floating_number', ({ x, y, value, isCrit }) => {
      renderer.addFloatingNumber(x, y, value, isCrit)
    })

    const loop = new GameLoop(
      (dt) => {
        if (!isPausedRef.current) engine.tick(dt)
        setSnapshot({ ...engine.getSnapshot() })
      },
      () => {
        const snap = engine.getSnapshot()
        renderer.render({ ...snap, isPaused: isPausedRef.current })
      }
    )

    loopRef.current = loop
    loop.start()

    return () => loop.stop()
  }, [])

  const handlePause = useCallback(() => {
    const next = !isPausedRef.current
    isPausedRef.current = next
    setIsPaused(next)
  }, [])

  const handleFireSkill = useCallback((skillId) => {
    const engine = engineRef.current
    if (!engine) return
    engine.fireSkill(skillId, SKILLS[skillId])
  }, [])

  // Spacebar to pause
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space') { e.preventDefault(); handlePause() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handlePause])

  const snap = snapshot || { heroHp: 0, heroMaxHp: 1, wave: 1, zone: 1, phase: 'wave', skillCooldowns: {}, betweenWaveTimer: 10 }
  const runSnap = useRunStore()

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={ARENA_W}
        height={ARENA_H}
        className="rounded-t border border-gray-700"
      />
      <div className="w-full max-w-[800px]">
        <HUD
          snapshot={snap}
          activeSkillIds={activeSkillIds}
          onFire={handleFireSkill}
          onPause={handlePause}
          isPaused={isPaused}
          echoesEarned={runSnap.echoesEarned}
          goldEarned={runSnap.goldEarned}
        />
      </div>
    </div>
  )
}
```

Add the missing import to GameCanvas.jsx — add this import at the top:

```js
import { useMetaStore } from '../store/metaStore'
```

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: GameCanvas, HUD, and AbilityBar components"
```

---

## Task 11: InventoryPanel Component

**Files:**
- Create: `src/components/InventoryPanel.jsx`
- Create: `src/components/CharacterPanel.jsx`

- [ ] **Step 1: Implement InventoryPanel.jsx**

```jsx
// src/components/InventoryPanel.jsx
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { SLOTS } from '../data/items'

const RARITY_COLORS = {
  common: 'border-gray-500 text-gray-400',
  uncommon: 'border-green-600 text-green-400',
  rare: 'border-blue-500 text-blue-300',
  legendary: 'border-yellow-500 text-yellow-300',
}

function ItemTile({ item, onEquip, onSell }) {
  if (!item) return <div className="h-14 w-14 border border-gray-700 rounded bg-void-900 opacity-30" />
  const color = RARITY_COLORS[item.rarity] || RARITY_COLORS.common
  return (
    <div
      className={`h-14 w-14 border-2 rounded bg-void-800 flex flex-col items-center justify-center cursor-pointer hover:bg-void-700 ${color}`}
      title={`${item.name}\n${item.affixes.map(a => a.label.replace('{v}', a.value)).join('\n')}`}
      onClick={() => onEquip && onEquip(item)}
    >
      <span className="text-xs text-center leading-tight px-1 truncate w-full text-center">
        {item.base?.name}
      </span>
      <span className="text-xs opacity-60">{item.slot.slice(0, 3)}</span>
    </div>
  )
}

export function InventoryPanel() {
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const { equippedGear, equipItem, unequipItem } = playerStore
  const { items, sellItem } = inventoryStore

  const handleEquip = (item) => {
    const currentlyEquipped = equippedGear[item.slot]
    if (currentlyEquipped) inventoryStore.addItem(currentlyEquipped)
    equipItem(item)
    inventoryStore.removeItem(item.id)
  }

  const handleUnequip = (slot) => {
    const item = equippedGear[slot]
    if (!item) return
    inventoryStore.addItem(item)
    unequipItem(slot)
  }

  const emptySlots = Array(Math.max(0, 20 - items.length)).fill(null)

  return (
    <div className="bg-void-900 border border-gray-700 rounded p-4 space-y-4">
      <h3 className="text-gold-400 font-bold text-sm uppercase tracking-wide">Equipment</h3>

      {/* Gear slots */}
      <div className="grid grid-cols-3 gap-2">
        {SLOTS.map(slot => (
          <div key={slot} className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 capitalize">{slot}</span>
            <div onClick={() => handleUnequip(slot)}>
              <ItemTile item={equippedGear[slot]} />
            </div>
          </div>
        ))}
      </div>

      <hr className="border-gray-700" />
      <h3 className="text-gold-400 font-bold text-sm uppercase tracking-wide">
        Inventory ({items.length}/20)
      </h3>

      {/* Inventory grid */}
      <div className="grid grid-cols-5 gap-1">
        {items.map(item => (
          <ItemTile key={item.id} item={item} onEquip={handleEquip} />
        ))}
        {emptySlots.map((_, i) => (
          <ItemTile key={`empty_${i}`} item={null} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement CharacterPanel.jsx**

```jsx
// src/components/CharacterPanel.jsx
import { usePlayerStore } from '../store/playerStore'
import { CLASSES } from '../data/classes'

export function CharacterPanel() {
  const { classId, getStats, echoes } = usePlayerStore()
  const classData = CLASSES[classId]
  const stats = getStats()

  const statRows = [
    ['Max HP', stats.maxHp?.toFixed(0)],
    ['Damage', stats.damageFlat?.toFixed(0)],
    ['Attack Speed', stats.attackSpeed?.toFixed(2)],
    ['Crit Chance', `${((stats.critChance || 0) * 100).toFixed(1)}%`],
    ['Crit Damage', `${((stats.critDamage || 0.5) * 100).toFixed(0)}%`],
    ['Armor', stats.armor?.toFixed(0)],
    ['HP Regen/s', (stats.hpRegenFlat || 0).toFixed(1)],
  ]

  return (
    <div className="bg-void-900 border border-gray-700 rounded p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-800 border-2 border-blue-400 flex items-center justify-center text-xl">
          ⚔️
        </div>
        <div>
          <div className="font-bold text-gold-300">{classData.name}</div>
          <div className="text-xs text-gray-400">{classData.description}</div>
        </div>
      </div>
      <div className="text-yellow-400 text-sm">⚡ {echoes} Echoes</div>
      <hr className="border-gray-700" />
      <div className="space-y-1">
        {statRows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-400">{label}</span>
            <span className="text-gray-200">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/InventoryPanel.jsx src/components/CharacterPanel.jsx
git commit -m "feat: InventoryPanel and CharacterPanel components"
```

---

## Task 12: RunEndScreen & Echoes

**Files:**
- Create: `src/components/RunEndScreen.jsx`

- [ ] **Step 1: Implement RunEndScreen.jsx**

```jsx
// src/components/RunEndScreen.jsx
export function RunEndScreen({ result, onReturn }) {
  const { reason, echoesEarned, goldEarned, wave } = result
  const isVictory = reason === 'victory'

  return (
    <div className="min-h-screen bg-void-950 flex items-center justify-center">
      <div className="bg-void-900 border border-gray-700 rounded-lg p-8 max-w-md w-full text-center space-y-6">
        <div className={`text-4xl font-bold ${isVictory ? 'text-gold-300' : 'text-red-400'}`}>
          {isVictory ? '⚔️ Zone Cleared!' : '💀 You Fell'}
        </div>

        <div className="text-gray-400 text-sm">
          Reached Wave {wave}
        </div>

        <div className="bg-void-800 rounded p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Echoes Earned</span>
            <span className="text-yellow-300 font-bold">+{echoesEarned}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gold Earned</span>
            <span className="text-yellow-200 font-bold">+{goldEarned}</span>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {isVictory
            ? 'Your gear has been kept. Return to push deeper.'
            : 'Your gear has been kept. Spend your Echoes and try again.'}
        </div>

        <button
          onClick={onReturn}
          className="w-full py-3 bg-echo-500 hover:bg-echo-400 text-white font-bold rounded transition-colors"
        >
          Return to Hub
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RunEndScreen.jsx
git commit -m "feat: RunEndScreen with echoes earned display"
```

---

## Task 13: VaultPanel (Meta-Progression)

**Files:**
- Create: `src/components/VaultPanel.jsx`

- [ ] **Step 1: Implement VaultPanel.jsx**

```jsx
// src/components/VaultPanel.jsx
import { useMetaStore, VAULT_NODES } from '../store/metaStore'
import { usePlayerStore } from '../store/playerStore'

export function VaultPanel() {
  const { purchasedNodeIds, purchaseNode } = useMetaStore()
  const { echoes, spendEchoes } = usePlayerStore()

  const handlePurchase = (nodeId) => {
    purchaseNode(nodeId, echoes, spendEchoes)
  }

  return (
    <div className="bg-void-900 border border-gray-700 rounded p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-gold-400 font-bold text-sm uppercase tracking-wide">The Vault</h3>
        <span className="text-yellow-300 text-sm font-bold">⚡ {echoes} Echoes</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {VAULT_NODES.map(node => {
          const purchased = purchasedNodeIds.includes(node.id)
          const requiresMet = !node.requires || purchasedNodeIds.includes(node.requires)
          const canAfford = echoes >= node.cost
          const available = requiresMet && !purchased

          return (
            <button
              key={node.id}
              onClick={() => available && canAfford && handlePurchase(node.id)}
              disabled={purchased || !requiresMet || !canAfford}
              className={`p-3 rounded border text-left text-sm transition-colors
                ${purchased
                  ? 'border-gold-500 bg-gold-500 bg-opacity-10 text-gold-300'
                  : available && canAfford
                    ? 'border-gray-500 bg-void-800 hover:border-echo-400 cursor-pointer'
                    : 'border-gray-700 bg-void-900 opacity-40 cursor-not-allowed'
                }`}
            >
              <div className="font-semibold">{node.label}</div>
              <div className="text-xs mt-1">
                {purchased
                  ? '✓ Purchased'
                  : !requiresMet
                    ? '🔒 Locked'
                    : `⚡ ${node.cost} Echoes`}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VaultPanel.jsx
git commit -m "feat: VaultPanel with passive stat node purchases"
```

---

## Task 14: OfflineSimulator (TDD)

**Files:**
- Create: `src/systems/OfflineSimulator.js`
- Create: `tests/OfflineSimulator.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/OfflineSimulator.test.js
import { describe, it, expect } from 'vitest'
import { calculateOfflineProgress } from '../src/systems/OfflineSimulator'

const strongStats = { maxHp: 200, damageFlat: 30, attackSpeed: 1.5, critChance: 0.1, armor: 20 }
const weakStats = { maxHp: 50, damageFlat: 5, attackSpeed: 0.8, critChance: 0, armor: 0 }

describe('calculateOfflineProgress', () => {
  it('returns zero progress for zero elapsed time', () => {
    const result = calculateOfflineProgress(strongStats, 1, 1, 0)
    expect(result.wavesCleared).toBe(0)
    expect(result.gold).toBe(0)
    expect(result.echoes).toBe(0)
  })

  it('caps progress at 8 hours', () => {
    const tenHoursMs = 10 * 60 * 60 * 1000
    const eightHoursMs = 8 * 60 * 60 * 1000
    const tenH = calculateOfflineProgress(strongStats, 1, 1, tenHoursMs)
    const eightH = calculateOfflineProgress(strongStats, 1, 1, eightHoursMs)
    expect(tenH.wavesCleared).toBe(eightH.wavesCleared)
  })

  it('stronger stats produce more waves cleared in same time', () => {
    const oneHourMs = 60 * 60 * 1000
    const strongResult = calculateOfflineProgress(strongStats, 1, 1, oneHourMs)
    const weakResult = calculateOfflineProgress(weakStats, 1, 1, oneHourMs)
    expect(strongResult.wavesCleared).toBeGreaterThan(weakResult.wavesCleared)
  })

  it('gold and echoes scale with waves cleared', () => {
    const oneHourMs = 60 * 60 * 1000
    const result = calculateOfflineProgress(strongStats, 1, 1, oneHourMs)
    if (result.wavesCleared > 0) {
      expect(result.gold).toBeGreaterThan(0)
      expect(result.echoes).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/OfflineSimulator.test.js
```

- [ ] **Step 3: Implement OfflineSimulator.js**

```js
// src/systems/OfflineSimulator.js
const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000 // 8 hours
const SECONDS_PER_WAVE = 90 // approx seconds to clear one wave at base power

export function calculateOfflineProgress(heroStats, zone, startWave, elapsedMs) {
  if (elapsedMs <= 0) return { wavesCleared: 0, gold: 0, echoes: 0 }

  const cappedMs = Math.min(elapsedMs, MAX_OFFLINE_MS)
  const elapsedSeconds = cappedMs / 1000

  // Power score: rough DPS estimate vs zone enemies
  const dps = (heroStats.damageFlat || 5) * (heroStats.attackSpeed || 1) * (1 + (heroStats.critChance || 0) * 0.5)
  const survivalFactor = Math.min(1, (heroStats.maxHp || 100) / 80) * (1 + (heroStats.armor || 0) / 100)
  const powerScore = dps * survivalFactor

  // Zone 1 base DPS requirement to survive ≈ 15 DPS
  const zoneDifficulty = zone * 15
  const efficiency = Math.min(1, powerScore / zoneDifficulty)

  const effectiveSecondsPerWave = SECONDS_PER_WAVE / Math.max(0.1, efficiency)
  const wavesCleared = Math.floor(elapsedSeconds / effectiveSecondsPerWave)

  const gold = wavesCleared * 12 + Math.floor(Math.random() * wavesCleared * 8)
  const echoes = wavesCleared * 3

  return { wavesCleared, gold, echoes }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/OfflineSimulator.test.js
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/OfflineSimulator.js tests/OfflineSimulator.test.js
git commit -m "feat: OfflineSimulator with TDD (4 passing tests)"
```

---

## Task 15: SaveManager (TDD)

**Files:**
- Create: `src/systems/SaveManager.js`
- Create: `tests/SaveManager.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/SaveManager.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { save, load, clearSave } from '../src/systems/SaveManager'

// Mock localStorage for tests
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('SaveManager', () => {
  beforeEach(() => localStorage.clear())

  it('saved state can be loaded back as equal object', () => {
    const state = { echoes: 42, items: [{ id: 'item_1', slot: 'weapon' }] }
    save(state)
    const loaded = load()
    expect(loaded).toEqual(state)
  })

  it('load returns null when no save exists', () => {
    expect(load()).toBeNull()
  })

  it('clearSave causes subsequent load to return null', () => {
    save({ echoes: 10 })
    clearSave()
    expect(load()).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/SaveManager.test.js
```

- [ ] **Step 3: Implement SaveManager.js**

```js
// src/systems/SaveManager.js
const SAVE_KEY = 'echoes_of_the_void_save'

export function save(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Save failed:', e)
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.error('Load failed, clearing corrupted save:', e)
    clearSave()
    return null
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY)
}

export function buildSaveState(playerStore, inventoryStore, metaStore) {
  return {
    classId: playerStore.classId,
    echoes: playerStore.echoes,
    equippedGear: playerStore.equippedGear,
    activeSkillIds: playerStore.activeSkillIds,
    passiveSkillIds: playerStore.passiveSkillIds,
    inventory: inventoryStore.items,
    stash: inventoryStore.stash,
    purchasedNodeIds: metaStore.purchasedNodeIds,
    unlockedZones: metaStore.unlockedZones,
    automationSettings: metaStore.automationSettings,
    lastOfflineTimestamp: Date.now(),
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/SaveManager.test.js
```

Expected: 3 tests PASS

- [ ] **Step 5: Run all tests to confirm nothing is broken**

```bash
npx vitest run
```

Expected: All 24 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/systems/SaveManager.js tests/SaveManager.test.js
git commit -m "feat: SaveManager with TDD (3 passing tests, 24 total passing)"
```

---

## Task 16: MetaHub & App Routing

**Files:**
- Create: `src/components/MetaHub.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Implement MetaHub.jsx**

```jsx
// src/components/MetaHub.jsx
import { CharacterPanel } from './CharacterPanel'
import { InventoryPanel } from './InventoryPanel'
import { VaultPanel } from './VaultPanel'

export function MetaHub({ onStartRun }) {
  return (
    <div className="min-h-screen bg-void-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold text-gold-300 tracking-wider">Echoes of the Void</h1>
          <p className="text-gray-500 text-sm">Grimdark Idle RPG</p>
        </div>

        {/* Start Run button */}
        <div className="flex justify-center">
          <button
            onClick={() => onStartRun(1)}
            className="px-12 py-4 bg-ember-500 hover:bg-ember-400 text-white text-lg font-bold rounded-lg border border-ember-400 transition-colors shadow-lg"
          >
            ⚔️ Enter the Crypt
          </button>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CharacterPanel />
          <InventoryPanel />
          <VaultPanel />
        </div>

        <p className="text-center text-gray-600 text-xs">
          Spacebar to pause combat · Click abilities to cast · Gear persists between runs
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update App.jsx with routing and offline check**

```jsx
// src/App.jsx
import { useState, useEffect } from 'react'
import { MetaHub } from './components/MetaHub'
import { GameCanvas } from './components/GameCanvas'
import { RunEndScreen } from './components/RunEndScreen'
import { usePlayerStore } from './store/playerStore'
import { useInventoryStore } from './store/inventoryStore'
import { useMetaStore } from './store/metaStore'
import { load, save, buildSaveState } from './systems/SaveManager'
import { calculateOfflineProgress } from './systems/OfflineSimulator'

export default function App() {
  const [view, setView] = useState('hub')   // 'hub' | 'combat' | 'runend'
  const [runResult, setRunResult] = useState(null)
  const [offlineReward, setOfflineReward] = useState(null)

  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const metaStore = useMetaStore()

  // Load save on mount + calculate offline progress
  useEffect(() => {
    const saved = load()
    if (!saved) return

    // Restore stores from save
    if (saved.echoes) playerStore.addEchoes(saved.echoes - playerStore.echoes)
    if (saved.equippedGear) Object.entries(saved.equippedGear).forEach(([slot, item]) => {
      if (item) playerStore.equipItem(item)
    })
    if (saved.inventory) saved.inventory.forEach(item => inventoryStore.addItem(item))
    if (saved.purchasedNodeIds) saved.purchasedNodeIds.forEach(id => {
      metaStore.purchasedNodeIds.includes(id) || metaStore.purchasedNodeIds.push(id)
    })

    // Offline progress
    if (saved.lastOfflineTimestamp) {
      const elapsed = Date.now() - saved.lastOfflineTimestamp
      if (elapsed > 60 * 1000) { // only if offline > 1 minute
        const stats = playerStore.getStats()
        const progress = calculateOfflineProgress(stats, 1, 1, elapsed)
        if (progress.wavesCleared > 0) {
          playerStore.addEchoes(progress.echoes)
          setOfflineReward(progress)
        }
      }
    }
  }, [])

  // Autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const state = buildSaveState(playerStore, inventoryStore, metaStore)
      save(state)
    }, 30000)
    return () => clearInterval(interval)
  }, [playerStore, inventoryStore, metaStore])

  // Save on tab close
  useEffect(() => {
    const handler = () => {
      const state = buildSaveState(playerStore, inventoryStore, metaStore)
      save(state)
    }
    window.addEventListener('visibilitychange', handler)
    return () => window.removeEventListener('visibilitychange', handler)
  }, [playerStore, inventoryStore, metaStore])

  const handleStartRun = () => {
    setView('combat')
  }

  const handleRunEnd = (result) => {
    playerStore.addEchoes(result.echoesEarned)
    setRunResult(result)
    setView('runend')
    // Save immediately on run end
    const state = buildSaveState(playerStore, inventoryStore, metaStore)
    save(state)
  }

  const handleReturnToHub = () => {
    setRunResult(null)
    setView('hub')
  }

  return (
    <>
      {/* Offline reward toast */}
      {offlineReward && (
        <div className="fixed top-4 right-4 z-50 bg-void-800 border border-echo-400 rounded p-4 text-sm shadow-xl">
          <div className="font-bold text-echo-300 mb-1">Welcome back!</div>
          <div className="text-gray-300">
            Cleared {offlineReward.wavesCleared} waves while away
          </div>
          <div className="text-yellow-300">+{offlineReward.echoes} Echoes · +{offlineReward.gold} Gold</div>
          <button
            onClick={() => setOfflineReward(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {view === 'hub' && <MetaHub onStartRun={handleStartRun} />}
      {view === 'combat' && <GameCanvas onRunEnd={handleRunEnd} />}
      {view === 'runend' && runResult && (
        <RunEndScreen result={runResult} onReturn={handleReturnToHub} />
      )}
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MetaHub.jsx src/App.jsx
git commit -m "feat: MetaHub, App routing, offline reward toast, autosave"
```

---

## Task 17: Integration Wiring & Smoke Test

**Files:**
- Modify: `src/App.jsx` (minor fixes if needed)
- Modify: `src/combat/CombatEngine.js` (if any wiring issues found)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Smoke test the full run flow**

Open `http://localhost:5173` and verify:

1. MetaHub renders with character panel, inventory panel, vault panel
2. Clicking "Enter the Crypt" launches combat
3. Canvas renders with hero circle in center
4. Enemies spawn at edges and move toward hero
5. Damage numbers appear when enemies are hit
6. HP bar decreases when hero takes damage
7. Wave counter increments after wave is cleared
8. Spacebar pauses combat (shows PAUSED overlay)
9. Ability buttons appear — clicking Shield Slam fires if not on cooldown
10. On hero death: RunEndScreen appears with echoes earned
11. "Return to Hub" button returns to MetaHub
12. Echoes balance updates on MetaHub after a run

- [ ] **Step 3: Smoke test the Vault**

1. Earn Echoes from a run (die quickly in combat)
2. Return to hub — Vault panel shows updated Echoes
3. Purchase "+25 Max HP" node — button shows "✓ Purchased"
4. Start a new run — verify hero max HP is increased by 25

- [ ] **Step 4: Smoke test offline simulation**

1. Start a run, let it go a few waves, die
2. Open DevTools → Application → LocalStorage — verify save exists
3. Manually edit `lastOfflineTimestamp` to be 2 hours ago
4. Refresh page — offline reward toast should appear

- [ ] **Step 5: Fix any issues found during smoke testing**

Common issues to watch for:
- `Cannot read properties of undefined` in `getStats()` — check that `equippedGear` is initialized for all slots
- Canvas not rendering — check that `useEffect` cleanup stops the loop
- Echoes not updating after run — check `handleRunEnd` calls `playerStore.addEchoes`
- Floating numbers not showing — check `engine.on('floating_number', ...)` is registered before `loop.start()`

- [ ] **Step 6: Run all tests one final time**

```bash
npx vitest run
```

Expected: All 24 tests PASS

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: MVP complete — Echoes of the Void fully playable end-to-end"
```

---

## Post-MVP Checklist (not in this plan)

These are explicitly out of scope for this plan. Build them after MVP is stable:

- [ ] Hexblade and Revenant classes
- [ ] Zones 2-5 (Blighted Wastes → The Void)
- [ ] Legendary items with unique affixes
- [ ] Stash UI tabs
- [ ] Elite enemy affixes (Fast, Armored, Splitting, Cursed)
- [ ] Boss unique attack patterns (Lich Lord death ray)
- [ ] Auto-abilities toggle in HUD
- [ ] Mobile layout at 375px
- [ ] Visual art pass (replace placeholder circles with sprites)
- [ ] Sound effects
