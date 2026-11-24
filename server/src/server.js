import net from 'node:net';
import { parseCommand } from './resp.js';
import { dispatch } from './commands.js';

export function createServer(store) {
  return net.createServer((socket) => {
    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      // TODO: loop for as long as `parseCommand(buffer)` returns a result
      // (not null):
      //   - result.command is [commandName, ...args]
      //   - call dispatch(commandName, args, store) to get the reply string
      //   - socket.write(reply)
      //   - set `buffer = result.rest` and try parseCommand again
      // Stop (just let the function return) once parseCommand returns null.
      let result;
      while ((result = parseCommand(buffer)) !== null) {
        const { command, rest } = result;
        const [commandName, ...args] = command;
        const reply = dispatch(commandName, args, store);
        socket.write(reply);
        buffer = rest;
      }
    });
  });
}
