/* Optional local-only cheat mode. It never changes stored balances. */
G.Cheat = (() => {
  const KEY = 'ps.cheat.infinite';
  const CODE = '神';
  let active = false;

  try { active = localStorage.getItem(KEY) === '1'; } catch (_) {}

  function enabled() { return active; }

  function activate(code) {
    if (code !== CODE) return false;
    active = true;
    try { localStorage.setItem(KEY, '1'); } catch (_) {}
    return true;
  }

  function reset() {
    const wasActive = active;
    active = false;
    try { localStorage.removeItem(KEY); return true; } catch (_) { active = wasActive; return false; }
  }

  return { enabled, activate, reset };
})();
