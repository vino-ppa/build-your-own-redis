import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/store.js';
import { createAdminServer } from '../src/admin.js';

// Spins up a fresh admin server on a random free port, and hands the test
// both the port and the exact Store instance the server is using.
function withAdminServer(testFn) {
  return async () => {
    const store = new Store();
    const server = createAdminServer(store);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    try {
      await testFn(port, store);
    } finally {
      server.close();
    }
  };
}

test('GET /keys returns every live key and its value', withAdminServer(async (port, store) => {
  store.set('foo', 'bar');
  store.set('baz', 'qux');

  const res = await fetch(`http://127.0.0.1:${port}/keys`);
  const body = await res.json();

  assert.deepEqual(
    body.sort((a, b) => a.key.localeCompare(b.key)),
    [
      { key: 'baz', value: 'qux' },
      { key: 'foo', value: 'bar' },
    ]
  );
}));

test('a WebSocket client receives a change event when a key is set', withAdminServer(async (port, store) => {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

  const received = new Promise((resolve) => {
    ws.addEventListener('message', (event) => resolve(JSON.parse(event.data)));
  });

  store.set('foo', 'bar');

  assert.deepEqual(await received, { type: 'set', key: 'foo', value: 'bar' });
  ws.close();
}));

test('POST /command runs the command against the store and returns the raw RESP reply', withAdminServer(async (port, store) => {
  const res = await fetch(`http://127.0.0.1:${port}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'SET', args: ['foo', 'bar'] }),
  });
  const text = await res.text();
  assert.equal(text, '+OK\r\n');
  assert.equal(store.get('foo'), 'bar');
}));

test('POST /command for GET returns a bulk string reply', withAdminServer(async (port, store) => {
  store.set('foo', 'bar');
  const res = await fetch(`http://127.0.0.1:${port}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'GET', args: ['foo'] }),
  });
  assert.equal(await res.text(), '$3\r\nbar\r\n');
}));

test('a WebSocket client receives a change event when a key is deleted', withAdminServer(async (port, store) => {
  store.set('foo', 'bar');

  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

  const received = new Promise((resolve) => {
    ws.addEventListener('message', (event) => resolve(JSON.parse(event.data)));
  });

  store.del('foo');

  assert.deepEqual(await received, { type: 'del', key: 'foo' });
  ws.close();
}));
