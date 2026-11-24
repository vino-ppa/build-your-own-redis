import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { createServer } from '../src/server.js';
import { Store } from '../src/store.js';
import { encodeArray, encodeBulkString } from '../src/resp.js';

// Encodes a client command the same way a real redis-cli would send it.
function encodeCommand(...parts) {
  return encodeArray(parts.map(encodeBulkString));
}

// Spins up a fresh server on a random free port for the duration of `testFn`.
function withServer(testFn) {
  return async () => {
    const store = new Store();
    const server = createServer(store);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    try {
      await testFn(port);
    } finally {
      server.close();
    }
  };
}

// Writes `data` to the server and collects replies until 50ms pass with no
// new bytes arriving (a simple idle-timeout, good enough for these tests).
function sendAndReceive(port, data) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1', () => socket.write(data));
    let received = '';
    let timer;
    socket.on('data', (chunk) => {
      received += chunk.toString();
      clearTimeout(timer);
      timer = setTimeout(() => {
        socket.destroy();
        resolve(received);
      }, 50);
    });
    socket.on('error', reject);
  });
}

test('PING replies PONG', withServer(async (port) => {
  const reply = await sendAndReceive(port, encodeCommand('PING'));
  assert.equal(reply, '+PONG\r\n');
}));

test('SET then GET round-trips a value', withServer(async (port) => {
  const request = encodeCommand('SET', 'foo', 'bar') + encodeCommand('GET', 'foo');
  const reply = await sendAndReceive(port, request);
  assert.equal(reply, '+OK\r\n$3\r\nbar\r\n');
}));

test('GET on a missing key returns a null bulk string', withServer(async (port) => {
  const reply = await sendAndReceive(port, encodeCommand('GET', 'missing'));
  assert.equal(reply, '$-1\r\n');
}));

test('DEL returns 1 when the key existed, 0 the second time', withServer(async (port) => {
  const request =
    encodeCommand('SET', 'foo', 'bar') +
    encodeCommand('DEL', 'foo') +
    encodeCommand('DEL', 'foo');
  const reply = await sendAndReceive(port, request);
  assert.equal(reply, '+OK\r\n:1\r\n:0\r\n');
}));

test('EXISTS reflects presence', withServer(async (port) => {
  const request =
    encodeCommand('EXISTS', 'foo') +
    encodeCommand('SET', 'foo', 'bar') +
    encodeCommand('EXISTS', 'foo');
  const reply = await sendAndReceive(port, request);
  assert.equal(reply, ':0\r\n+OK\r\n:1\r\n');
}));

test('an unknown command returns an error reply', withServer(async (port) => {
  const reply = await sendAndReceive(port, encodeCommand('FROBNICATE'));
  assert.match(reply, /^-ERR/);
}));

test('commands are case-insensitive', withServer(async (port) => {
  const request = encodeCommand('set', 'foo', 'bar') + encodeCommand('get', 'foo');
  const reply = await sendAndReceive(port, request);
  assert.equal(reply, '+OK\r\n$3\r\nbar\r\n');
}));
