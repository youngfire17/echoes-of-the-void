# Phase 2A: Repeatable Upgrades + Gold Economy + Blacksmith Shop
*Date: 2026-04-27*

---

## Overview

Three interconnected systems that deepen the meta-progression loop and give gold a real purpose. Builds on the existing Vault, playerStore, and MetaHub without replacing them.

---

## Section 1: Repeatable Vault Upgrades

### Behavior

Each Vault node can be purchased multiple times. Every purchase applies the same stat bonus again. There is no "purchased" state — only a level.

Buying "+25 Max HP" 5 times grants +125 Max HP total.

### Cost Formula

```
cost = round(baseCost × (1.4 ^ currentLevel))
```

Example for `baseCost: 10`:
- Level 0 → 1: 10 Echoes
- Level 1 → 2: 14 Echoes
- Level 2 → 3: 20 Echoes
- Level 3 → 4: 28 Echoes
- Level 4 → 5: 39 Echoes

Costs escalate fast enough to create meaningful decisions but never lock the player out permanently.

### Dependency Chain

The `requires` field still applies at level 0 only. A node with `requires: 'hp_1'` unlocks once `hp_1` is at level ≥ 1. Further levels of the dependent node have no additional gating.

### Data Changes

**`src/data/metaStore.js` — VAULT_NODES:**
- Rename `cost` → `baseCost` on each node
- Add optional `maxLevel: number | null` (null = infinite)

Current nodes and their `baseCost` values (unchanged from existing `cost`):
```
hp_1: 10, hp_2: 25, dmg_1: 10, dmg_2: 25,
crit_1: 15, cdr_1: 20, regen_1: 15, armor_1: 15
```

**`src/store/metaStore.js`:**
- Replace `purchasedNodeIds: []` with `nodeLevels: {}` (e.g., `{ hp_1: 3, dmg_1: 1 }`)
- Update `purchaseNode(nodeId, currentEchoes, spendEchoesFn)`:
  - Compute `cost = round(baseCost × 1.4^currentLevel)`
  - Check `currentEchoes >= cost` and `requires` met (level ≥ 1)
  - On success: increment `nodeLevels[nodeId]`, call `spendEchoesFn(cost)`
- Update `getVaultBonuses()`:
  - For each node in `nodeLevels`, accumulate `node.value × level`
- Add `getNodeLevel(nodeId)` helper: returns `nodeLevels[nodeId] ?? 0`
- Add `getNodeCost(nodeId)` helper: returns `round(baseCost × 1.4^currentLevel)`

**`src/components/VaultPanel.jsx`:**
- Show current level badge on each node ("Lv.3")
- Show escalating cost to next level
- Remove "✓ Purchased" state — nodes are never fully done
- Locked nodes (requires not met) still show "🔒 Locked"

**`src/systems/SaveManager.js` — `buildSaveState`:**
- Replace `purchasedNodeIds` with `nodeLevels`
- Bump `SAVE_VERSION` to 2 (breaking schema change)

---

## Section 2: Gold as a Persistent Currency

### Behavior

Gold earned during runs persists to the character and accumulates between sessions. It carries over forever (no cap). Gold is spent exclusively at the Blacksmith.

### Data Changes

**`src/store/playerStore.js`:**
- Add `gold: 0` field
- Add `addGold(amount)` action
- Add `spendGold(amount)` action: `Math.max(0, gold - amount)`

**`src/components/GameCanvas.jsx` — `run_complete` and `hero_died` handlers:**
- Read `goldEarned` from `useRunStore.getState()` (already done for echoes)
- Call `usePlayerStore.getState().addGold(goldEarned)` (same pattern as echoes)

**`src/systems/OfflineSimulator.js`:**
- Reinstate gold in return value: `gold: wavesCleared * 12`
- `App.jsx` load effect credits `progress.gold` to `playerStore.addGold`
- Offline toast reinstates gold line: `+{offlineReward.echoes} Echoes · +{offlineReward.gold} Gold`

**`src/systems/SaveManager.js` — `buildSaveState`:**
- Add `gold: playerStore.gold`

**`src/components/CharacterPanel.jsx`:**
- Add gold display below echoes: `💰 {gold} Gold`

---

## Section 3: Blacksmith Shop

### Overview

A new panel in MetaHub with two services: **Shop** (buy items) and **Reroll** (reroll affixes on owned items). Item rarity is permanently locked — no rarity upgrades.

### Shop Tab

- Displays 4 randomly generated items for sale
- Stock generated using existing `generateLoot()` — same rarity distribution as drops
- Stock refreshes automatically after each run completes
- Player can manually refresh stock for 50 Gold (pays to see new items)
- Item rarity prices: Common 30g · Uncommon 80g · Rare 200g · Legendary 600g
- Buying an item sends it directly to the player's inventory (uses existing `inventoryStore.addItem`)
- If inventory is full, purchase is blocked with an error message

### Reroll Tab

- Player selects an item from their inventory (grid of ItemTiles, same as InventoryPanel)
- Shows current affixes of selected item
- Reroll button shows cost and is disabled if player can't afford
- On reroll: all affixes on the item are replaced with new random rolls (same count, same slot, same rarity)
- Uses a new exported helper `rerollItemAffixes(item)` in `LootGenerator.js` — wraps the existing private `rollAffixes()` function and returns the item with fresh affixes
- Rarity reroll costs: Common 20g · Uncommon 50g · Rare 150g · Legendary 500g
- Selected item stays selected after reroll so player can reroll again immediately

### New Store: `src/store/shopStore.js`

```
{
  stock: [],           // array of 4 generated items
  refreshStock(),      // generate 4 new items using generateLoot()
  manualRefresh(spendGoldFn), // costs 50g, calls refreshStock
}
```

`App.jsx` calls `useShopStore.getState().refreshStock()` inside `handleRunEnd` after every run completes. Stock persists in the store until the next refresh. Stock is saved/loaded via SaveManager.

### New Component: `src/components/BlacksmithPanel.jsx`

- Two tabs: **Shop** | **Reroll**
- Shop tab: 4 ItemTile components showing shop stock, each with a gold price and Buy button
- Reroll tab: inventory grid (same as InventoryPanel) + selected item detail + Reroll button
- Shows player's current gold balance in the panel header

### MetaHub Layout Change

`src/components/MetaHub.jsx` — change the grid from `md:grid-cols-3` to `md:grid-cols-4`:
- CharacterPanel
- InventoryPanel
- VaultPanel
- BlacksmithPanel (new, rightmost column)

---

## Save Schema

`SAVE_VERSION` bumps from 1 → 2. The load function in `SaveManager` clears and rejects v1 saves (existing behavior on version mismatch).

New fields in save state:
- `gold: number`
- `nodeLevels: Record<string, number>` (replaces `purchasedNodeIds`)
- `shopStock: Item[]`

---

## MVP Scope (this spec)

- [ ] Repeatable Vault nodes with escalating cost
- [ ] Gold persists to playerStore and commits on run end
- [ ] Offline sim reinstates gold rewards
- [ ] Blacksmith Shop tab (buy items)
- [ ] Blacksmith Reroll tab (reroll affixes)
- [ ] MetaHub updated to show Blacksmith panel
- [ ] SaveManager bumped to v2

**Out of scope for this spec:**
- Leveling / XP (Spec 2)
- Skill tree (Spec 2)
- Additional Blacksmith services (crafting, socketing)
- Gold cap or drain mechanics
