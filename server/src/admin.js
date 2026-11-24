import http from 'node:http';
import { WebSocketServer } from 'ws';
import { dispatch } from './commands.js';

// A separate HTTP + WebSocket server (NOT the RESP port) purely for the
// dashboard: GET /keys to fetch current state, and a WebSocket connection
// that gets pushed every `change` event the store emits, as JSON.
export function createAdminServer(store) {
  const httpServer = http.createServer((req, res) => {
    // Allow the dashboard (a different origin — localhost:5173 in dev) to
    // read responses from this server. Fine for a local learning project;
    // a real deployment would restrict this to a known origin instead of '*'.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Browsers send a preflight OPTIONS request before a POST with a JSON
    // body, to check the server allows it. We just have to answer it.
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // POST /command — body: { "command": "SET", "args": ["foo", "bar"] }
    // Runs it through the exact same dispatch() used by the real RESP
    // server, and responds with the raw RESP-encoded reply (e.g. "+OK\r\n").
    if (req.method === 'POST' && req.url === '/command') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        // TODO 3: JSON.parse(body) to get { command, args }, call
        // dispatch(command, args, store), and send the result back:
        //
        // res.writeHead(200, { 'Content-Type': 'text/plain' });
        // res.end(reply);
        const {command, args} = JSON.parse(body);
        const reply = dispatch(command, args, store);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(reply);
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/keys') {
      // TODO 1: respond with a JSON array of { key, value } for every live
      // key in the store. store.keys() gives you the live keys; store.get(key)
      // gives you each one's value.
      //
      // res.writeHead(200, { 'Content-Type': 'application/json' });
      // res.end(JSON.stringify(result));
      const keys = store.keys();
      const result = keys.map((key) => ({ key, value: store.get(key) }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));  
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  const wss = new WebSocketServer({ server: httpServer });

  store.on('change', (event) => {
    // TODO 2: broadcast `event` as a JSON string to every currently connected
    // WebSocket client. `wss.clients` is a Set of connected sockets; each one
    // has a `.send(string)` method.
    const message = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  });

  return httpServer;
}
