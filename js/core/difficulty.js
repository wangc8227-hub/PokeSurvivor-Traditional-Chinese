/* Run difficulty is stored locally and never changes the game account data. */
G.Difficulty = (() => {
  const KEY = 'ps.difficulty';
  const MODES = {
    easy: { spawns: 1, xp: 2 },
    normal: { spawns: 1, xp: 1 },
    hard: { spawns: 3, xp: 1 },
    hell: { spawns: 10, xp: 1 },
    boss: { spawns: 1, xp: 1 },
    shiny: { spawns: 1, xp: 1 }
  };
  let choice = 'normal';
  let active = 'normal';

  try {
    const stored = localStorage.getItem(KEY);
    if (MODES[stored]) choice = stored;
  } catch (_) {}

  function select(mode) {
    if (!MODES[mode]) return choice;
    choice = mode;
    try { localStorage.setItem(KEY, mode); } catch (_) {}
    return choice;
  }

  function beginRun(coop) {
    active = coop ? 'normal' : choice;
  }

  return {
    selected: () => choice,
    select,
    beginRun,
    spawnMultiplier: () => MODES[active].spawns,
    xpMultiplier: () => MODES[active].xp,
    shinyOnly: () => active === 'shiny',
    bossOnly: () => active === 'boss'
  };
})();
