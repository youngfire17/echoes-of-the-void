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
