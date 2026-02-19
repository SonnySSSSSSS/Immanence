import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { getLocalDateKey } from '../src/utils/dateUtils.js';

if (!globalThis.localStorage) {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => {
      memory.set(key, String(value));
    },
    removeItem: (key) => {
      memory.delete(key);
    },
    clear: () => {
      memory.clear();
    },
  };
}

if (!globalThis.window) {
  globalThis.window = { localStorage: globalThis.localStorage };
}

const { useApplicationStore, migrateApplicationStateV2 } = await import('../src/state/applicationStore.js');

function resetApplicationStore() {
  useApplicationStore.setState({
    awarenessLogs: [],
    intention: null,
    trackerConfig: { items: [] },
    trackerDaily: { byDate: {} },
  });
  globalThis.localStorage.clear();
}

beforeEach(() => {
  resetApplicationStore();
});

test('migration v1 -> v2 preserves existing fields and seeds tracker defaults', () => {
  const persisted = {
    awarenessLogs: [{ id: '1', category: 'test' }],
    intention: 'stay aware',
  };
  const migrated = migrateApplicationStateV2(persisted);

  assert.equal(Array.isArray(migrated.awarenessLogs), true);
  assert.equal(migrated.awarenessLogs.length, 1);
  assert.equal(migrated.intention, 'stay aware');
  assert.deepEqual(migrated.trackerConfig, { items: [] });
  assert.deepEqual(migrated.trackerDaily, { byDate: {} });
});

test('logTrackerCount defaults to local date key when no dateKey is provided', () => {
  const store = useApplicationStore.getState();
  const item = store.addTrackerItem('Breath Pause');
  const ok = store.logTrackerCount({ itemId: item.id, reactedDelta: 1 });

  assert.equal(ok, true);
  const today = getLocalDateKey(new Date());
  const byDate = useApplicationStore.getState().trackerDaily.byDate;
  assert.equal(byDate[today][item.id].reacted, 1);
  assert.equal(byDate[today][item.id].chose, 0);
});

test('tracker item list enforces max 4 items', () => {
  const store = useApplicationStore.getState();
  assert.ok(store.addTrackerItem('Item 1'));
  assert.ok(store.addTrackerItem('Item 2'));
  assert.ok(store.addTrackerItem('Item 3'));
  assert.ok(store.addTrackerItem('Item 4'));
  const fifth = store.addTrackerItem('Item 5');

  assert.equal(fifth, null);
  assert.equal(useApplicationStore.getState().trackerConfig.items.length, 4);
});

test('tracker item ids remain stable across rename and reorder', () => {
  const store = useApplicationStore.getState();
  const first = store.addTrackerItem('First');
  const second = store.addTrackerItem('Second');
  const third = store.addTrackerItem('Third');
  const originalIds = [first.id, second.id, third.id];

  store.updateTrackerItemLabel(second.id, 'Second Updated');
  store.reorderTrackerItems([third.id, first.id, second.id]);

  const nextItems = useApplicationStore.getState().trackerConfig.items;
  const nextIds = nextItems.map((item) => item.id);
  assert.deepEqual(new Set(nextIds), new Set(originalIds));
  assert.equal(nextItems.find((item) => item.id === second.id)?.label, 'Second Updated');
});

test('logTrackerCount is a no-op for unknown item id', () => {
  const store = useApplicationStore.getState();
  const ok = store.logTrackerCount({ itemId: 'missing-item', reactedDelta: 2, dateKey: '2026-01-01' });

  assert.equal(ok, false);
  assert.deepEqual(useApplicationStore.getState().trackerDaily.byDate, {});
});

test('logTrackerCount clamps counts to zero and removes empty nodes', () => {
  const store = useApplicationStore.getState();
  const item = store.addTrackerItem('Clamp Test');
  const dateKey = '2026-01-11';

  store.logTrackerCount({ itemId: item.id, dateKey, reactedDelta: 2, choseDelta: 1 });
  store.logTrackerCount({ itemId: item.id, dateKey, reactedDelta: -99, choseDelta: -99 });

  const byDate = useApplicationStore.getState().trackerDaily.byDate;
  assert.equal(byDate[dateKey], undefined);
});

test('getTrackerRange returns inclusive span, zero-fill cells, and fixed T_REF intensity', () => {
  const store = useApplicationStore.getState();
  const item = store.addTrackerItem('Range Item');
  const startDateKey = '2026-01-01';
  const endDateKey = '2026-01-03';

  store.logTrackerCount({ itemId: item.id, dateKey: '2026-01-02', reactedDelta: 2, choseDelta: 1 });
  const result = store.getTrackerRange({ startDateKey, endDateKey });

  assert.deepEqual(result.dates, ['2026-01-01', '2026-01-02', '2026-01-03']);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].cells.length, 3);
  assert.equal(result.tRef, 12);
  assert.equal(result.maxTotal, 3);

  const zeroDay = result.rows[0].cells[0];
  assert.equal(zeroDay.total, 0);
  assert.equal(zeroDay.dominance, 0);
  assert.equal(zeroDay.intensity, 0);

  const activeDay = result.rows[0].cells[1];
  assert.equal(activeDay.reacted, 2);
  assert.equal(activeDay.chose, 1);
  assert.equal(activeDay.total, 3);
  assert.equal(activeDay.dominance, 1 / 3);
  const expectedIntensity = Math.log1p(3) / Math.log1p(12);
  assert.equal(Math.abs(activeDay.intensity - expectedIntensity) < 1e-10, true);
});

test('removeTrackerItem hides item config only and preserves historical byDate counts', () => {
  const store = useApplicationStore.getState();
  const item = store.addTrackerItem('History Keep');
  const dateKey = '2026-01-15';

  store.logTrackerCount({ itemId: item.id, dateKey, choseDelta: 3 });
  const removed = store.removeTrackerItem(item.id);

  assert.equal(removed, true);
  assert.equal(useApplicationStore.getState().trackerConfig.items.length, 0);
  assert.equal(useApplicationStore.getState().trackerDaily.byDate[dateKey][item.id].chose, 3);
});
