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
