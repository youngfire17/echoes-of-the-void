# Phase 2A: Repeatable Upgrades, Gold Economy & Blacksmith Shop

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Vault upgrades repeatable with escalating cost, give gold a persistent balance and spending purpose, and add a Blacksmith shop for buying and rerolling items.

**Architecture:** Extends existing stores (metaStore, playerStore, inventoryStore) and adds a new shopStore. New BlacksmithPanel component slots into MetaHub. SaveManager bumps to v2 for the schema change. All logic changes are covered by TDD before UI is wired.

**Tech Stack:** React, Zustand, Vitest — same as existing codebase.

---

## File Map

```
src/
  store/
    metaStore.js         MODIFY — nodeLevels replaces purchasedNodeIds; new getNodeLevel/getNodeCost helpers
    playerStore.js       MODIFY — add gold field, addGold, spendGold
    shopStore.js         CREATE — stock[], refreshStock(), manualRefresh()
  systems/
    LootGenerator.js     MODIFY — export rerollItemAffixes(item)
    SaveManager.js       MODIFY — bump to v2, add gold + nodeLevels + shopStock
    OfflineSimulator.js  MODIFY — reinstate gold in return value
  components/
    VaultPanel.jsx       MODIFY — show level badge + escalating cost per node
    CharacterPanel.jsx   MODIFY — add gold display
    BlacksmithPanel.jsx  CREATE — Shop tab (buy items) + Reroll tab (reroll affixes)
    MetaHub.jsx          MODIFY — 4-column grid, add BlacksmithPanel
  App.jsx                MODIFY — credit gold on run end, credit offline gold, refresh shop on run end

tests/
  metaStore.test.js      CREATE — repeatable upgrade logic (6 tests)
  LootGenerator.test.js  MODIFY — add rerollItemAffixes tests (2 new tests)
  SaveManager.test.js    MODIFY — update for v2 schema
```

---

## Task 1: Repeatable Vault Upgrades — metaStore (TDD)

**Files:**
- Modify: `src/store/metaStore.js`
- Create: `tests/metaStore.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/metaStore.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMetaStore, VAULT_NODES } from '../src/store/metaStore'

beforeEach(() => {
  useMetaStore.setState({ nodeLevels: {} })
})

describe('getNodeLevel', () => {
  it('returns 0 for a node that has never been purchased', () => {
    expect(useMetaStore.getState().getNodeLevel('hp_1')).toBe(0)
  })

  it('returns the current level after purchases', () => {
    useMetaStore.setState({ nodeLevels: { hp_1: 3 } })
    expect(useMetaStore.getState().getNodeLevel('hp_1')).toBe(3)
  })
})

describe('getNodeCost', () => {
  it('returns baseCost at level 0', () => {
    const node = VAULT_NODES.find(n => n.id === 'hp_1')
    expect(useMetaStore.getState().getNodeCost('hp_1')).toBe(node.baseCost)
  })

  it('escalates cost with level using 1.4 multiplier', () => {
    useMetaStore.setState({ nodeLevels: { hp_1: 2 } })
    const node = VAULT_NODES.find(n => n.id === 'hp_1')
    const expected = Math.round(node.baseCost * Math.pow(1.4, 2))
    expect(useMetaStore.getState().getNodeCost('hp_1')).toBe(expected)
  })
})

describe('purchaseNode', () => {
  it('increments nodeLevels and calls spendEchoesFn on success', () => {
    const spendFn = vi.fn()
    useMetaStore.getState().purchaseNode('hp_1', 100, spendFn)
    expect(useMetaStore.getState().getNodeLevel('hp_1')).toBe(1)
    expect(spendFn).toHaveBeenCalledOnce()
  })

  it('does not purchase when echoes are insufficient', () => {
    const spendFn = vi.fn()
    useMetaStore.getState().purchaseNode('hp_1', 0, spendFn)
    expect(useMetaStore.getState().getNodeLevel('hp_1')).toBe(0)
    expect(spendFn).not.toHaveBeenCalled()
  })

  it('respects requires: node cannot be purchased before prerequisite is level 1', () => {
    const spendFn = vi.fn()
    useMetaStore.getState().purchaseNode('hp_2', 1000, spendFn)
    expect(useMetaStore.getState().getNodeLevel('hp_2')).toBe(0)
  })
})

describe('getVaultBonuses', () => {
  it('multiplies node value by its level', () => {
    useMetaStore.setState({ nodeLevels: { hp_1: 4 } })
    const node = VAULT_NODES.find(n => n.id === 'hp_1')
    const bonuses = useMetaStore.getState().getVaultBonuses()
    expect(bonuses[node.stat]).toBe(node.value * 4)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/metaStore.test.js
```

Expected: FAIL — module not found or wrong behavior on old code.

- [ ] **Step 3: Update `src/store/metaStore.js`**

Replace the entire file with:

```js
// src/store/metaStore.js
import { create } from 'zustand'

export const VAULT_NODES = [
  { id: 'hp_1',    label: '+25 Max HP',       baseCost: 10,  stat: 'maxHp',               value: 25 },
  { id: 'hp_2',    label: '+50 Max HP',        baseCost: 25,  stat: 'maxHp',               value: 50,  requires: 'hp_1' },
  { id: 'dmg_1',   label: '+5 Flat Damage',    baseCost: 10,  stat: 'damageFlat',          value: 5 },
  { id: 'dmg_2',   label: '+10 Flat Damage',   baseCost: 25,  stat: 'damageFlat',          value: 10,  requires: 'dmg_1' },
  { id: 'crit_1',  label: '+3% Crit Chance',   baseCost: 15,  stat: 'critChanceFlat',      value: 3 },
  { id: 'cdr_1',   label: '-8% Cooldowns',     baseCost: 20,  stat: 'cooldownReductionPct', value: 8 },
  { id: 'regen_1', label: '+2 HP Regen/sec',   baseCost: 15,  stat: 'hpRegenFlat',         value: 2 },
  { id: 'armor_1', label: '+10 Armor',         baseCost: 15,  stat: 'armorFlat',           value: 10 },
]

export const useMetaStore = create((set, get) => ({
  nodeLevels: {},
  unlockedZones: [1],
  automationSettings: {
    autoEquip: true,
    autoSell: false,
    autoAbilities: false,
  },
  lastOfflineTimestamp: null,

  getNodeLevel(nodeId) {
    return get().nodeLevels[nodeId] ?? 0
  },

  getNodeCost(nodeId) {
    const node = VAULT_NODES.find(n => n.id === nodeId)
    if (!node) return Infinity
    const level = get().nodeLevels[nodeId] ?? 0
    return Math.round(node.baseCost * Math.pow(1.4, level))
  },

  purchaseNode(nodeId, currentEchoes, spendEchoesFn) {
    const node = VAULT_NODES.find(n => n.id === nodeId)
    if (!node) return false
    if (node.requires && (get().nodeLevels[node.requires] ?? 0) < 1) return false
    const cost = get().getNodeCost(nodeId)
    if (currentEchoes < cost) return false
    spendEchoesFn(cost)
    set(state => ({
      nodeLevels: { ...state.nodeLevels, [nodeId]: (state.nodeLevels[nodeId] ?? 0) + 1 }
    }))
    return true
  },

  getVaultBonuses() {
    const { nodeLevels } = get()
    const bonuses = {}
    for (const [nodeId, level] of Object.entries(nodeLevels)) {
      const node = VAULT_NODES.find(n => n.id === nodeId)
      if (node && level > 0) {
        bonuses[node.stat] = (bonuses[node.stat] || 0) + node.value * level
      }
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

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/metaStore.test.js
```

Expected: 8 tests PASS.

- [ ] **Step 5: Run full suite to confirm no regressions**

```bash
npx vitest run
```

Expected: All existing tests still pass (27 total + 8 new = 35).

- [ ] **Step 6: Commit**

```bash
git add src/store/metaStore.js tests/metaStore.test.js
git commit -m "feat: repeatable Vault upgrades with escalating cost (TDD)"
```

---

## Task 2: Add Gold to playerStore

**Files:**
- Modify: `src/store/playerStore.js`

- [ ] **Step 1: Add gold field and actions to `src/store/playerStore.js`**

In the `create((set, get) => ({` block, add these three lines after the `spendEchoes` action:

```js
  gold: 0,

  addGold(amount) {
    set(state => ({ gold: state.gold + Math.max(0, amount) }))
  },

  spendGold(amount) {
    set(state => ({ gold: Math.max(0, state.gold - amount) }))
  },
```

- [ ] **Step 2: Run full suite to confirm no regressions**

```bash
npx vitest run
```

Expected: All 35 tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/store/playerStore.js
git commit -m "feat: add persistent gold currency to playerStore"
```

---

## Task 3: Export rerollItemAffixes from LootGenerator (TDD)

**Files:**
- Modify: `src/systems/LootGenerator.js`
- Modify: `tests/LootGenerator.test.js`

- [ ] **Step 1: Add failing tests to `tests/LootGenerator.test.js`**

Append to the end of the existing file:

```js
import { rerollItemAffixes } from '../src/systems/LootGenerator'

describe('rerollItemAffixes', () => {
  it('preserves slot, rarity, base, id and zone from the original item', () => {
    const original = generateLoot(1, 'normal', 'rare')
    const rerolled = rerollItemAffixes(original)
    expect(rerolled.id).toBe(original.id)
    expect(rerolled.slot).toBe(original.slot)
    expect(rerolled.rarity).toBe(original.rarity)
    expect(rerolled.zone).toBe(original.zone)
  })

  it('produces the same number of affixes as the original', () => {
    const original = generateLoot(1, 'normal', 'rare')
    const rerolled = rerollItemAffixes(original)
    expect(rerolled.affixes.length).toBe(original.affixes.length)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/LootGenerator.test.js
```

Expected: FAIL — `rerollItemAffixes` is not exported.

- [ ] **Step 3: Add `rerollItemAffixes` to `src/systems/LootGenerator.js`**

Append to the end of the file:

```js
export function rerollItemAffixes(item) {
  const affixCount = RARITY_AFFIX_COUNT[item.rarity]
  const affixes = rollAffixes(item.slot, item.rarity, affixCount)
  return { ...item, affixes }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/LootGenerator.test.js
```

Expected: 9 tests PASS (7 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/systems/LootGenerator.js tests/LootGenerator.test.js
git commit -m "feat: export rerollItemAffixes from LootGenerator (TDD)"
```

---

## Task 4: Create shopStore

**Files:**
- Create: `src/store/shopStore.js`

- [ ] **Step 1: Create `src/store/shopStore.js`**

```js
// src/store/shopStore.js
import { create } from 'zustand'
import { generateLoot } from '../systems/LootGenerator'

function generateShopStock() {
  return [
    generateLoot(1, 'normal'),
    generateLoot(1, 'normal'),
    generateLoot(1, 'normal'),
    generateLoot(1, 'elite'),
  ]
}

export const MANUAL_REFRESH_COST = 50

export const useShopStore = create((set) => ({
  stock: [],

  refreshStock() {
    set({ stock: generateShopStock() })
  },

  manualRefresh(spendGoldFn) {
    spendGoldFn(MANUAL_REFRESH_COST)
    set({ stock: generateShopStock() })
  },

  removeFromStock(itemId) {
    set(state => ({ stock: state.stock.filter(i => i.id !== itemId) }))
  },
}))
```

- [ ] **Step 2: Run full suite to confirm no regressions**

```bash
npx vitest run
```

Expected: All 37 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/store/shopStore.js
git commit -m "feat: shopStore with stock generation and refresh"
```

---

## Task 5: Update SaveManager to v2

**Files:**
- Modify: `src/systems/SaveManager.js`
- Modify: `tests/SaveManager.test.js`

- [ ] **Step 1: Update `src/systems/SaveManager.js`**

Change `SAVE_VERSION` from `1` to `2`:

```js
export const SAVE_VERSION = 2
```

Update `buildSaveState` to include the new fields (add after `automationSettings`):

```js
export function buildSaveState(playerStore, inventoryStore, metaStore, shopStore) {
  return {
    version: SAVE_VERSION,
    classId: playerStore.classId,
    echoes: playerStore.echoes,
    gold: playerStore.gold,
    equippedGear: playerStore.equippedGear,
    activeSkillIds: playerStore.activeSkillIds,
    passiveSkillIds: playerStore.passiveSkillIds,
    inventory: inventoryStore.items,
    stash: inventoryStore.stash,
    nodeLevels: metaStore.nodeLevels,
    unlockedZones: metaStore.unlockedZones,
    automationSettings: metaStore.automationSettings,
    shopStock: shopStore?.stock ?? [],
    lastOfflineTimestamp: Date.now(),
  }
}
```

- [ ] **Step 2: Update `tests/SaveManager.test.js`**

The first test saves a state object that must include `version: SAVE_VERSION`. Update the import and the test state:

```js
import { save, load, clearSave, SAVE_VERSION } from '../src/systems/SaveManager'
```

Update the round-trip test state to include all new required fields:

```js
it('saved state can be loaded back as equal object', () => {
  const state = { version: SAVE_VERSION, echoes: 42, gold: 100, nodeLevels: { hp_1: 2 }, items: [] }
  save(state)
  const loaded = load()
  expect(loaded).toEqual(state)
})
```

- [ ] **Step 3: Run tests to confirm they pass**

```bash
npx vitest run tests/SaveManager.test.js
```

Expected: 3 tests PASS.

- [ ] **Step 4: Run full suite**

```bash
npx vitest run
```

Expected: All 37 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/systems/SaveManager.js tests/SaveManager.test.js
git commit -m "feat: SaveManager v2 — gold, nodeLevels, shopStock in save state"
```

---

## Task 6: Wire Gold + Shop Refresh into App.jsx and OfflineSimulator

**Files:**
- Modify: `src/systems/OfflineSimulator.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Reinstate gold in `src/systems/OfflineSimulator.js`**

The return value already has `gold: wavesCleared * 12`. Confirm it's there. If missing, change:

```js
return { wavesCleared, gold: 0, echoes }
```

to:

```js
return { wavesCleared, gold: wavesCleared * 12, echoes }
```

- [ ] **Step 2: Update the offline progress test to expect gold**

In `tests/OfflineSimulator.test.js`, find the "gold and echoes scale with waves" test and verify it checks `result.gold > 0` (it should already, since the test was written expecting gold):

```js
it('gold and echoes scale with waves cleared', () => {
  const oneHourMs = 60 * 60 * 1000
  const result = calculateOfflineProgress(strongStats, 1, 1, oneHourMs)
  if (result.wavesCleared > 0) {
    expect(result.gold).toBeGreaterThan(0)
    expect(result.echoes).toBeGreaterThan(0)
  }
})
```

Run: `npx vitest run tests/OfflineSimulator.test.js` — Expected: 4 tests PASS.

- [ ] **Step 3: Update `src/App.jsx` — import shopStore**

Add to the imports at the top:

```js
import { useShopStore } from './store/shopStore'
```

- [ ] **Step 4: Update `src/App.jsx` — credit gold on run end**

Find `handleRunEnd`. After `playerStore.addEchoes(result.echoesEarned)` (which is already called inside GameCanvas's engine handler via `usePlayerStore.getState().addEchoes`), add gold credit. The `result` object passed to `handleRunEnd` already contains `goldEarned`. 

Find `handleRunEnd` in App.jsx and update it:

```js
const handleRunEnd = (result) => {
  usePlayerStore.getState().addGold(result.goldEarned || 0)
  useShopStore.getState().refreshStock()
  setRunResult(result)
  setView('runend')
  const state = buildSaveState(
    usePlayerStore.getState(),
    useInventoryStore.getState(),
    useMetaStore.getState(),
    useShopStore.getState()
  )
  save(state)
}
```

- [ ] **Step 5: Update `src/App.jsx` — credit offline gold and reinstate gold toast line**

In the load `useEffect`, find the offline progress block and add gold crediting:

```js
if (progress.wavesCleared > 0) {
  usePlayerStore.getState().addEchoes(progress.echoes)
  usePlayerStore.getState().addGold(progress.gold)
  setOfflineReward(progress)
}
```

Reinstate the gold line in the offline toast (find the toast JSX):

```jsx
<div className="text-yellow-300">
  +{offlineReward.echoes} Echoes · +{offlineReward.gold} Gold
</div>
```

- [ ] **Step 6: Update `src/App.jsx` — restore gold and nodeLevels on load**

In the load `useEffect`, add restore logic for the new fields. Find the restore block and add:

```js
// After echoes restore:
if (typeof saved.gold === 'number') usePlayerStore.setState({ gold: saved.gold })

// After purchasedNodeIds restore (replace entire old block):
if (saved.nodeLevels) {
  useMetaStore.setState({ nodeLevels: saved.nodeLevels })
}

// After inventory restore:
if (saved.shopStock && saved.shopStock.length > 0) {
  useShopStore.setState({ stock: saved.shopStock })
}
```

Remove the old `purchasedNodeIds` restore block. Find and delete this entire block:

```js
if (saved.purchasedNodeIds) {
  saved.purchasedNodeIds.forEach(nodeId => {
    useMetaStore.setState(state => ({
      purchasedNodeIds: state.purchasedNodeIds.includes(nodeId)
        ? state.purchasedNodeIds
        : [...state.purchasedNodeIds, nodeId]
    }))
  })
}
```

Replace it with nothing — `nodeLevels` restore above handles this now.

- [ ] **Step 7: Update all `buildSaveState` calls in App.jsx to pass shopStore**

There are 3 places in App.jsx that call `buildSaveState`. Update all 3 to add `useShopStore.getState()` as the 4th argument:

```js
buildSaveState(
  usePlayerStore.getState(),
  useInventoryStore.getState(),
  useMetaStore.getState(),
  useShopStore.getState()
)
```

(The autosave interval, the visibilitychange handler, and handleRunEnd all call this.)

- [ ] **Step 8: Run full suite**

```bash
npx vitest run
```

Expected: All 37 tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/systems/OfflineSimulator.js src/App.jsx
git commit -m "feat: wire gold + shop refresh into run end and offline simulation"
```

---

## Task 7: Update VaultPanel UI

**Files:**
- Modify: `src/components/VaultPanel.jsx`

- [ ] **Step 1: Replace `src/components/VaultPanel.jsx` with:**

```jsx
// src/components/VaultPanel.jsx
import { useMetaStore, VAULT_NODES } from '../store/metaStore'
import { usePlayerStore } from '../store/playerStore'

export function VaultPanel() {
  const { nodeLevels, purchaseNode, getNodeLevel, getNodeCost } = useMetaStore()
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
          const level = getNodeLevel(node.id)
          const cost = getNodeCost(node.id)
          const requiresMet = !node.requires || getNodeLevel(node.requires) >= 1
          const canAfford = echoes >= cost
          const isLocked = !requiresMet

          return (
            <button
              key={node.id}
              onClick={() => !isLocked && canAfford && handlePurchase(node.id)}
              disabled={isLocked || !canAfford}
              className={`p-3 rounded border text-left text-sm transition-colors relative
                ${isLocked
                  ? 'border-gray-700 bg-void-900 opacity-40 cursor-not-allowed'
                  : canAfford
                    ? 'border-gray-500 bg-void-800 hover:border-echo-400 cursor-pointer'
                    : 'border-gray-700 bg-void-900 opacity-50 cursor-not-allowed'
                }`}
            >
              {level > 0 && (
                <span className="absolute top-1 right-1 text-xs text-gold-400 font-bold">Lv.{level}</span>
              )}
              <div className="font-semibold pr-6">{node.label}</div>
              <div className="text-xs mt-1 text-gray-400">
                {isLocked ? '🔒 Locked' : `⚡ ${cost} Echoes`}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run full suite**

```bash
npx vitest run
```

Expected: All 37 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/VaultPanel.jsx
git commit -m "feat: VaultPanel shows level badge and escalating costs"
```

---

## Task 8: Add Gold to CharacterPanel

**Files:**
- Modify: `src/components/CharacterPanel.jsx`

- [ ] **Step 1: Update `src/components/CharacterPanel.jsx`**

Find the destructure line at the top of the component:

```js
const { classId, getStats, echoes } = usePlayerStore()
```

Change to:

```js
const { classId, getStats, echoes, gold } = usePlayerStore()
```

Find the echoes display line:

```jsx
<div className="text-yellow-400 text-sm font-semibold">⚡ {echoes} Echoes</div>
```

Replace with:

```jsx
<div className="flex gap-3 text-sm font-semibold">
  <span className="text-yellow-400">⚡ {echoes} Echoes</span>
  <span className="text-yellow-200">💰 {gold}g</span>
</div>
```

- [ ] **Step 2: Run full suite**

```bash
npx vitest run
```

Expected: All 37 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/CharacterPanel.jsx
git commit -m "feat: show gold balance in CharacterPanel"
```

---

## Task 9: Create BlacksmithPanel

**Files:**
- Create: `src/components/BlacksmithPanel.jsx`

- [ ] **Step 1: Create `src/components/BlacksmithPanel.jsx`**

```jsx
// src/components/BlacksmithPanel.jsx
import { useState } from 'react'
import { useShopStore, MANUAL_REFRESH_COST } from '../store/shopStore'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { rerollItemAffixes } from '../systems/LootGenerator'

const BUY_PRICES = { common: 30, uncommon: 80, rare: 200, legendary: 600 }
const REROLL_PRICES = { common: 20, uncommon: 50, rare: 150, legendary: 500 }

const RARITY_COLORS = {
  common:    'border-gray-500 text-gray-400',
  uncommon:  'border-green-600 text-green-400',
  rare:      'border-blue-500 text-blue-300',
  legendary: 'border-yellow-500 text-yellow-300',
}

function ShopTab() {
  const { stock, manualRefresh, removeFromStock } = useShopStore()
  const { gold, spendGold } = usePlayerStore()
  const { items, addItem } = useInventoryStore()

  const handleBuy = (item) => {
    const price = BUY_PRICES[item.rarity]
    if (gold < price || items.length >= 20) return
    spendGold(price)
    addItem(item)
    removeFromStock(item.id)
  }

  const handleManualRefresh = () => {
    if (gold < MANUAL_REFRESH_COST) return
    manualRefresh(usePlayerStore.getState().spendGold)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Refreshes after each run</span>
        <button
          onClick={handleManualRefresh}
          disabled={gold < MANUAL_REFRESH_COST}
          className="text-xs px-2 py-1 border border-gray-600 rounded hover:border-gold-400 disabled:opacity-40"
        >
          🔄 {MANUAL_REFRESH_COST}g
        </button>
      </div>

      {stock.length === 0 ? (
        <div className="text-center text-gray-600 text-sm py-6">
          Complete a run to stock the shop
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {stock.map(item => {
            const price = BUY_PRICES[item.rarity]
            const canAfford = gold >= price
            const inventoryFull = items.length >= 20
            const color = RARITY_COLORS[item.rarity]
            const tooltip = [item.name, ...item.affixes.map(a => a.label.replace('{v}', a.value))].join('\n')
            return (
              <div key={item.id} className={`border-2 rounded p-2 ${color} bg-void-800`} title={tooltip}>
                <div className="text-xs font-bold truncate">{item.name}</div>
                <div className="text-xs text-gray-500 mb-2 capitalize">{item.slot}</div>
                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford || inventoryFull}
                  className="w-full text-xs py-1 bg-void-700 border border-gray-600 rounded hover:border-gold-400 disabled:opacity-40"
                >
                  {inventoryFull ? 'Inv. Full' : `💰 ${price}g`}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RerollTab() {
  const [selectedId, setSelectedId] = useState(null)
  const { gold, spendGold } = usePlayerStore()
  const { items } = useInventoryStore()

  const selected = items.find(i => i.id === selectedId)
  const price = selected ? REROLL_PRICES[selected.rarity] : 0
  const canAfford = gold >= price

  const handleReroll = () => {
    if (!selected || !canAfford) return
    spendGold(price)
    const rerolled = rerollItemAffixes(selected)
    useInventoryStore.getState().removeItem(selected.id)
    useInventoryStore.getState().addItem(rerolled)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Select an item to reroll its affixes</p>

      {items.length === 0 ? (
        <div className="text-center text-gray-600 text-sm py-4">No items in inventory</div>
      ) : (
        <div className="grid grid-cols-5 gap-1 max-h-28 overflow-y-auto">
          {items.map(item => {
            const color = RARITY_COLORS[item.rarity]
            const isSelected = selectedId === item.id
            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                title={item.name}
                className={`h-12 w-12 border-2 rounded cursor-pointer flex flex-col items-center justify-center text-xs ${color}
                  ${isSelected ? 'bg-void-700 ring-2 ring-gold-400' : 'bg-void-800 hover:bg-void-700'}`}
              >
                <span>{item.slot.slice(0, 3)}</span>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="bg-void-800 rounded p-3 space-y-1">
          <div className={`text-sm font-bold ${RARITY_COLORS[selected.rarity].split(' ')[1]}`}>
            {selected.name}
          </div>
          {selected.affixes.map((a, i) => (
            <div key={i} className="text-xs text-gray-400">
              {a.label.replace('{v}', a.value)}
            </div>
          ))}
          <button
            onClick={handleReroll}
            disabled={!canAfford}
            className="w-full mt-2 py-2 text-sm bg-ember-500 hover:bg-ember-400 disabled:opacity-40 rounded font-bold text-white transition-colors"
          >
            Reroll — {price}g
          </button>
        </div>
      )}
    </div>
  )
}

export function BlacksmithPanel() {
  const [tab, setTab] = useState('shop')
  const { gold } = usePlayerStore()

  return (
    <div className="bg-void-900 border border-gray-700 rounded p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-gold-400 font-bold text-sm uppercase tracking-wide">⚒️ Blacksmith</h3>
        <span className="text-yellow-200 text-sm font-bold">💰 {gold}g</span>
      </div>

      <div className="flex gap-1">
        {[['shop', 'Shop'], ['reroll', 'Reroll']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-1 text-xs rounded border capitalize transition-colors
              ${tab === key
                ? 'border-gold-400 text-gold-300 bg-void-800'
                : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'shop' ? <ShopTab /> : <RerollTab />}
    </div>
  )
}
```

- [ ] **Step 2: Run full suite**

```bash
npx vitest run
```

Expected: All 37 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/BlacksmithPanel.jsx
git commit -m "feat: BlacksmithPanel with Shop and Reroll tabs"
```

---

## Task 10: Update MetaHub to 4-Column Layout

**Files:**
- Modify: `src/components/MetaHub.jsx`

- [ ] **Step 1: Update `src/components/MetaHub.jsx`**

Add the BlacksmithPanel import at the top:

```js
import { BlacksmithPanel } from './BlacksmithPanel'
```

Find the 3-column grid:

```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <CharacterPanel />
  <InventoryPanel />
  <VaultPanel />
</div>
```

Replace with:

```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <CharacterPanel />
  <InventoryPanel />
  <VaultPanel />
  <BlacksmithPanel />
</div>
```

- [ ] **Step 2: Run full suite**

```bash
npx vitest run
```

Expected: All 37 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/MetaHub.jsx
git commit -m "feat: add BlacksmithPanel to MetaHub 4-column layout"
```

---

## Task 11: Integration Verification

**Files:** None — verification only.

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: 37 tests PASS across 6 test files.

- [ ] **Step 2: Build for production**

```bash
npm run build
```

Expected: Build completes without errors.

- [ ] **Step 3: Start dev server and verify manually**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:

1. MetaHub shows 4 panels: Character (with gold), Inventory, Vault, Blacksmith
2. Vault nodes show "Lv.0" implicitly (no badge at level 0), escalating cost shown
3. Purchase a Vault node — "Lv.1" badge appears, cost increases
4. Purchase the same node again — "Lv.2" badge appears
5. CharacterPanel shows `💰 0g` gold balance
6. Start and complete a run (die quickly)
7. After run ends and you return to hub, gold balance > 0 in CharacterPanel
8. Blacksmith → Shop tab shows 4 items for sale with gold prices
9. If you have enough gold, buy an item — it appears in inventory, disappears from shop
10. Blacksmith → Reroll tab — select an item, click Reroll — affixes change
11. Refresh the page — echoes, gold, vault levels, and shop stock all restore correctly

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Phase 2A complete — repeatable upgrades, gold economy, blacksmith shop"
```
