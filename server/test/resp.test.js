import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeSimpleString,
  encodeError,
  encodeInteger,
  encodeBulkString,
  encodeArray,
  parseCommand,
} from '../src/resp.js';

test('encodeSimpleString', () => {
  assert.equal(encodeSimpleString('OK'), '+OK\r\n');
});

test('encodeError', () => {
  assert.equal(encodeError('ERR unknown command'), '-ERR unknown command\r\n');
});

test('encodeInteger', () => {
  assert.equal(encodeInteger(1000), ':1000\r\n');
  assert.equal(encodeInteger(0), ':0\r\n');
});

test('encodeBulkString', () => {
  assert.equal(encodeBulkString('foobar'), '$6\r\nfoobar\r\n');
  assert.equal(encodeBulkString(''), '$0\r\n\r\n');
  assert.equal(encodeBulkString(null), '$-1\r\n');
});

test('encodeArray', () => {
  assert.equal(
    encodeArray([encodeBulkString('foo'), encodeBulkString('bar')]),
    '*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n'
  );
  assert.equal(encodeArray([]), '*0\r\n');
  assert.equal(encodeArray(null), '*-1\r\n');
});

test('parseCommand: a single complete command', () => {
  const buf = Buffer.from('*2\r\n$3\r\nGET\r\n$3\r\nfoo\r\n');
  const result = parseCommand(buf);
  assert.deepEqual(result.command, ['GET', 'foo']);
  assert.equal(result.rest.length, 0);
});

test('parseCommand: leaves extra bytes (a second command) in rest', () => {
  const buf = Buffer.from(
    '*1\r\n$4\r\nPING\r\n' + '*2\r\n$3\r\nGET\r\n$3\r\nfoo\r\n'
  );
  const result = parseCommand(buf);
  assert.deepEqual(result.command, ['PING']);
  assert.equal(result.rest.toString(), '*2\r\n$3\r\nGET\r\n$3\r\nfoo\r\n');
});

test('parseCommand: returns null when the buffer is an incomplete command', () => {
  // claims 2 elements but only 1 is present, and that one is cut mid-way
  const buf = Buffer.from('*2\r\n$3\r\nGET\r\n$3\r\nfo');
  assert.equal(parseCommand(buf), null);
});

test('parseCommand: returns null on an empty buffer', () => {
  assert.equal(parseCommand(Buffer.alloc(0)), null);
});
