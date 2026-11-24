# build-your-own-redis

A Redis clone built from scratch in Node.js (no redis client libraries), with a live React dashboard on top. Part of a [build-your-own-x](https://github.com/codecrafters-io/build-your-own-x) style series of projects.

## Why

Learning the internals of an in-memory data store — wire protocols, TCP stream parsing, TTL/expiry, and persistence — by implementing them rather than importing them.

## Architecture

```
                 TCP (RESP protocol)
  redis-cli  ─────────────────────────▶  RESP server (:6380)
                                              │
                                              ▼
                                        in-memory Store
                                         (TTL + change events)
                                              │
                                              ▼
  React          HTTP  GET /keys       admin server (:6381)
  dashboard  ◀──────────────────────────────┤
  (:5173)        HTTP  POST /command         │
             ────────────────────────────────┤
                 WebSocket (live push)        │
             ◀────────────────────────────────┘
```

The RESP port (6380) is the "real" protocol being cloned — testable directly with `redis-cli`. The admin port (6381) is a separate layer that exists purely to serve the dashboard: a REST endpoint to read/run state, and a WebSocket stream that pushes every store mutation live. The dashboard never touches the RESP port directly (browsers can't open raw TCP sockets).

```
server/
  src/
    resp.js         RESP protocol: parse raw bytes <-> encode replies
    store.js        in-memory key-value store, TTL/expiry, change events
    commands.js     command dispatch table (PING, SET, GET, DEL, EXISTS)
    server.js       TCP server wiring (net.createServer)
    admin.js         HTTP + WebSocket layer for the dashboard
    persistence.js   snapshot save/load
    index.js        entry point
  test/              35+ tests across every module above
web/
  src/
    KeyBrowser.jsx       live table of current keys
    CommandConsole.jsx   run commands, see the raw RESP reply
```

## Supported commands

| Command | Reply |
|---|---|
| `PING` | `+PONG` |
| `SET key value` | `+OK` |
| `GET key` | bulk string, or nil if missing |
| `DEL key` | `1` if it existed, else `0` |
| `EXISTS key` | `1` or `0` |

TTLs are set internally (not yet exposed as a client command — e.g. no `EXPIRE` yet).

## Running locally

```bash
# terminal 1 — backend (auto-restarts on save)
cd server
npm install
npm run dev

# terminal 2 — frontend
cd web
npm install
npm run dev
```

Open http://localhost:5173 for the dashboard, or talk to it directly:

```bash
redis-cli -p 6380 set foo bar
redis-cli -p 6380 get foo
```

## Running with Docker

```bash
docker compose up --build
```

- RESP server: `localhost:6380`
- Admin API/WebSocket: `localhost:6381`
- Dashboard: `localhost:8080`

Data persists across restarts via a named volume (`data`), snapshotted to `dump.json` every 10 seconds and on shutdown.

## Tests

```bash
cd server
npm test
```

## Milestones

- [x] **M1** — RESP protocol: parse incoming buffers into commands, encode replies (simple strings, bulk strings, errors, integers, arrays)
- [x] **M2** — In-memory store: `get/set/del/exists`, lazy TTL expiry
- [x] **M3** — Command dispatch + TCP server wired end to end (testable with real `redis-cli`)
- [x] **M4** — Persistence: snapshot save/load on interval and on shutdown
- [x] **M5** — Admin layer: REST endpoint for keys + WebSocket event stream
- [x] **M6** — React dashboard: command console, live key browser via WebSocket
- [x] **M7** — Polish: architecture write-up, Dockerfiles, docker-compose

## What's next (not built)

- Active (background) expiry, in addition to the current lazy expiry
- More commands (`EXPIRE`, `TTL`, `INCR`, lists/sets)
- Replication or clustering (the natural "part 2" of this kind of project)
