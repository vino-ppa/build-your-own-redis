import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/store.js';

test('set then get returns the value', () => {
  const store = new Store();
  store.set('foo', 'bar');
  assert.equal(store.get('foo'), 'bar');
});

test('get on a missing key returns undefined', () => {
  const store = new Store();
  assert.equal(store.get('nope'), undefined);
});

test('exists reflects presence', () => {
  const store = new Store();
  assert.equal(store.exists('foo'), false);
  store.set('foo', 'bar');
  assert.equal(store.exists('foo'), true);
});

test('del removes the key and reports whether it existed', () => {
  const store = new Store();
  store.set('foo', 'bar');
  assert.equal(store.del('foo'), true);
  assert.equal(store.get('foo'), undefined);
  assert.equal(store.del('foo'), false);
});

test('a key with no ttl never expires', () => {
  let fakeTime = 0;
  const store = new Store(() => fakeTime);
  store.set('foo', 'bar');
  fakeTime += 1000 * 60 * 60 * 24 * 365; // a year later
  assert.equal(store.get('foo'), 'bar');
});

test('a key with a ttl expires after the ttl elapses', () => {
  let fakeTime = 0;
  const store = new Store(() => fakeTime);
  store.set('foo', 'bar', 1000); // expires in 1000ms

  fakeTime = 999;
  assert.equal(store.get('foo'), 'bar'); // not yet expired

  fakeTime = 1000;
  assert.equal(store.get('foo'), undefined); // expired now
});

test('exists also respects expiry', () => {
  let fakeTime = 0;
  const store = new Store(() => fakeTime);
  store.set('foo', 'bar', 1000);
  fakeTime = 1000;
  assert.equal(store.exists('foo'), false);
});

test('del on an expired key returns false', () => {
  let fakeTime = 0;
  const store = new Store(() => fakeTime);
  store.set('foo', 'bar', 1000);
  fakeTime = 1000;
  assert.equal(store.del('foo'), false);
});

test('dump returns all entries as [key, value, expiresAt] triples', () => {
  const store = new Store(() => 0); // fake clock fixed at 0
  store.set('foo', 'bar');
  store.set('baz', 'qux', 1000); // expiresAt = 0 + 1000 = 1000
  const dumped = store.dump().sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(dumped, [
    ['baz', 'qux', 1000],
    ['foo', 'bar', null],
  ]);
});

test('load repopulates the store from dump output', () => {
  const store1 = new Store();
  store1.set('foo', 'bar');
  store1.set('baz', 'qux');

  const store2 = new Store();
  store2.set('leftover', 'should be gone after load');
  store2.load(store1.dump());

  assert.equal(store2.get('foo'), 'bar');
  assert.equal(store2.get('baz'), 'qux');
  assert.equal(store2.get('leftover'), undefined);
});

test('load restores ttl-based expiry (expiresAt is an absolute timestamp)', () => {
  let fakeTime = 0;
  const store1 = new Store(() => fakeTime);
  store1.set('foo', 'bar', 1000); // expiresAt = 1000

  const store2 = new Store(() => fakeTime); // same fake clock, still at 0
  store2.load(store1.dump());
  assert.equal(store2.get('foo'), 'bar'); // not expired yet

  fakeTime = 1000;
  assert.equal(store2.get('foo'), undefined); // now expired
});

test('set emits a change event', () => {
  const store = new Store();
  const events = [];
  store.on('change', (e) => events.push(e));
  store.set('foo', 'bar');
  assert.deepEqual(events, [{ type: 'set', key: 'foo', value: 'bar' }]);
});

test('del emits a change event only when something was actually deleted', () => {
  const store = new Store();
  const events = [];
  store.on('change', (e) => events.push(e));

  store.del('nope'); // nothing to delete, no event
  assert.deepEqual(events, []);

  store.set('foo', 'bar');
  store.del('foo');
  assert.deepEqual(events, [
    { type: 'set', key: 'foo', value: 'bar' },
    { type: 'del', key: 'foo' },
  ]);
});

test('keys returns only non-expired keys', () => {
  let fakeTime = 0;
  const store = new Store(() => fakeTime);
  store.set('alive', 'a');
  store.set('short-lived', 'b', 1000);
  fakeTime = 1000; // short-lived has now expired

  assert.deepEqual(store.keys().sort(), ['alive']);
});
