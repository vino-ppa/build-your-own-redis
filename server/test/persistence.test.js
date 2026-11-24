import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../src/store.js';
import { saveSnapshot, loadSnapshot } from '../src/persistence.js';

function tempFilePath() {
  return path.join(os.tmpdir(), `byo-redis-test-${Math.random().toString(36).slice(2)}.json`);
}

test('saveSnapshot then loadSnapshot restores all keys and values', () => {
  const filePath = tempFilePath();
  try {
    const store1 = new Store();
    store1.set('foo', 'bar');
    store1.set('baz', 'qux');
    saveSnapshot(filePath, store1);

    const store2 = new Store();
    loadSnapshot(filePath, store2);
    assert.equal(store2.get('foo'), 'bar');
    assert.equal(store2.get('baz'), 'qux');
  } finally {
    fs.rmSync(filePath, { force: true });
  }
});

test('loadSnapshot does nothing if the file does not exist', () => {
  const store = new Store();
  loadSnapshot(tempFilePath(), store); // a path that was never written to
  assert.equal(store.get('anything'), undefined);
});
