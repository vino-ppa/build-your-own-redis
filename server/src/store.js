// In-memory key-value store with TTL (lazy expiry).
//
// Each entry is { value, expiresAt } where expiresAt is a timestamp (ms since
// epoch) after which the key should be treated as gone, or null for "never expires".
//
// Emits a 'change' event (see set/del) so other code — e.g. the admin/dashboard
// layer — can react to writes without Store needing to know they exist.

import { EventEmitter } from 'node:events';

export class Store extends EventEmitter {
  constructor(now = Date.now) {
    super();
    this.now = now;
    this.data = new Map();
  }

  // ttlMs is optional. If given, the key expires `ttlMs` milliseconds from now.
  // If omitted/null, the key never expires.
  set(key, value, ttlMs = null) {
    // TODO 1: compute expiresAt (this.now() + ttlMs, or null if ttlMs is null)
    //         and store { value, expiresAt } in this.data under `key`.
    if(ttlMs === null) {
      this.data.set(key, { value, expiresAt: null });
    } else {
      const expiresAt = this.now() + ttlMs;
      this.data.set(key, {value, expiresAt});
    }
    // TODO 7: emit a 'change' event: this.emit('change', { type: 'set', key, value })
    this.emit('change', { type: 'set', key, value });
  }

  // Returns the value, or undefined if the key doesn't exist OR has expired.
  // If it has expired, also remove it from this.data (lazy cleanup).
  get(key) {
    // TODO 2: look up the entry. If missing, return undefined.
    //         If present but expired (this.now() >= entry.expiresAt), delete it
    //         from this.data and return undefined.
    //         Otherwise return entry.value.
    const entry = this.data.get(key);
    if(!entry){
      return undefined;
    }
    if(entry.expiresAt !== null && this.now() >= entry.expiresAt){
      this.data.delete(key);
      return undefined;
  }
    return entry.value;
  }

  // Returns true if the key existed (and wasn't expired) before deleting it,
  // false otherwise. Reuse get()'s expiry logic rather than duplicating it.
  del(key) {
    // TODO 3: hint — if get(key) returns undefined, there's nothing to delete.
    //         Otherwise delete it from this.data and return true.
    const entry = this.get(key);
    if(entry === undefined){
      return false;
    }
    this.data.delete(key);
    // TODO 8: emit a 'change' event here too: this.emit('change', { type: 'del', key })
    //         (only reached when something was actually deleted — good, that's correct)
    this.emit('change', { type: 'del', key });
    return true;
  }

  exists(key) {
    // TODO 4: hint — this is one line if you reuse get().
    return this.get(key) !== undefined;
  }

  // Returns every entry currently in the store as an array of
  // [key, value, expiresAt] triples (expiresAt is null for no TTL).
  // Used by persistence.js to write a snapshot to disk.
  dump() {
    // TODO 5: build this from this.data. Buffer/Map methods you'll want:
    //         this.data.entries() gives you [key, { value, expiresAt }] pairs.
    return Array.from(this.data.entries()).map(([key, { value, expiresAt }]) => [key, value, expiresAt]);
  }

  // Replaces the store's contents with `entries` (an array of
  // [key, value, expiresAt] triples, as produced by dump()).
  load(entries) {
    // TODO 6: clear this.data, then repopulate it from `entries`.
    this.data.clear();
    for (const [key, value, expiresAt] of entries) {
      this.data.set(key, { value, expiresAt });
    }
  }

  // Returns an array of all non-expired keys currently in the store.
  keys() {
    // TODO 9: iterate this.data.keys() and keep only the ones that are still
    //         alive — this.exists(key) tells you that, and as a side effect
    //         lazily cleans up any expired ones it encounters.
    const keys = [];
    for (const key of this.data.keys()) {
      if (this.exists(key)) {
        keys.push(key);
      }
    }
    return keys;
  }
}
