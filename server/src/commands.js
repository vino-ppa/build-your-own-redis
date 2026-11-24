import { encodeSimpleString, encodeError, encodeInteger, encodeBulkString } from './resp.js';

// Each handler takes (args, store) and returns an already-RESP-encoded reply
// string. `args` is everything after the command name, e.g. for "SET foo bar"
// the command name is "SET" and args is ["foo", "bar"].
export const commands = {
  PING(args, store) {
    // TODO: reply with a simple string "PONG"
    return encodeSimpleString('PONG');
  },

  SET(args, store) {
    // TODO: args = [key, value]. Store it, reply with simple string "OK".
    const [key, value] = args;
    store.set(key, value);
    return encodeSimpleString('OK');
  },

  GET(args, store) {
    // TODO: args = [key]. store.get(key) returns undefined if missing —
    //       encodeBulkString wants `null` for that case, not `undefined`.
    const [key] = args;
    const value = store.get(key);
    return encodeBulkString(value === undefined ? null : value);
  },

  DEL(args, store) {
    // TODO: args = [key]. Integer reply: 1 if store.del(key) was true, else 0.
    const [key] = args;
    return encodeInteger(store.del(key) ? 1 : 0);
  },

  EXISTS(args, store) {
    // TODO: args = [key]. Integer reply: 1 if store.exists(key), else 0.
    const [key] = args;
    return encodeInteger(store.exists(key) ? 1 : 0);
  },
};

// Looks up and runs the handler for `commandName` (case-insensitive — clients
// may send "get", "Get", "GET", etc). Returns an encoded error reply if the
// command isn't recognized.
export function dispatch(commandName, args, store) {
  // TODO: look up commands[commandName.toUpperCase()]. If it doesn't exist,
  //       return encodeError(`ERR unknown command '${commandName}'`).
  //       Otherwise call it with (args, store) and return its result.
  const command = commands[commandName.toUpperCase()];
  if (!command) {
    return encodeError(`ERR unknown command '${commandName}'`);
  }
  return command(args, store);
}
