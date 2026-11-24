// RESP (REdis Serialization Protocol) encode/decode.
// Implement each function below. See server/test/resp.test.js for exact expected output.

export function encodeSimpleString(str) {
  return `+${str}\r\n`;
}

export function encodeError(message) {
  return `-${message}\r\n`;
}

export function encodeInteger(num) {
  return `:${num}\r\n`;
}

// value is a string, or null for a null bulk string ($-1\r\n)
export function encodeBulkString(value) {
  return value === null ? '$-1\r\n' : `$${Buffer.byteLength(value)}\r\n${value}\r\n`;
}

// items is an array of already-encoded RESP strings, or null for a null array (*-1\r\n)
export function encodeArray(items) {
  if (items === null) {
    return '*-1\r\n';
  }
  let result = `*${items.length}\r\n`;
  for (const item of items) {
    result += item;
  }
  return result;
}


// buffer is a Node Buffer that may contain a partial, exactly-one, or multiple commands.
// A client command always arrives as a RESP array of bulk strings, e.g.
//   *2\r\n$3\r\nGET\r\n$3\r\nfoo\r\n
//
// Return:
//   { command: string[], rest: Buffer }  when at least one full command is present
//   null                                  when the buffer holds an incomplete command (need more data)
export function parseCommand(buffer) {
  let offset = 0;

  // reads one line ending in \r\n, starting at `offset`.
  // returns the line's content as a string, and advances `offset` past it.
  // returns null (without moving offset) if \r\n isn't in the buffer yet.
  function readLine() {
    const crlfIndex = buffer.indexOf('\r\n', offset);
    if (crlfIndex === -1) return null;
    const line = buffer.subarray(offset, crlfIndex).toString();
    offset = crlfIndex + 2; // skip past the \r\n itself
    return line;
  }

  // 1. read the array header, e.g. "*2"
  const arrayHeader = readLine();
  if (arrayHeader === null) return null;
  const count = parseInt(arrayHeader.slice(1), 10); // strips the leading '*'

  const commandParts = [];
  for (let i = 0; i < count; i++) {
    // 2. read this element's bulk-string header, e.g. "$3"
    const bulkHeader = readLine();
    if (bulkHeader === null) return null;
    const length = parseInt(bulkHeader.slice(1), 10); // strips the leading '$'

    if (offset + length + 2 > buffer.length) return null;

    const value = buffer.subarray(offset, offset + length).toString();
    commandParts.push(value);

    offset += length + 2;
  }

  return { command: commandParts, rest: buffer.subarray(offset) };
}