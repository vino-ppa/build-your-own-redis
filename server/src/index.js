import { createServer } from './server.js';
import { createAdminServer } from './admin.js';
import { Store } from './store.js';
import { saveSnapshot, loadSnapshot } from './persistence.js';

const PORT = process.env.PORT || 6380;
const ADMIN_PORT = process.env.ADMIN_PORT || 6381;
const SNAPSHOT_PATH = process.env.SNAPSHOT_PATH || './dump.json';
const SNAPSHOT_INTERVAL_MS = 10_000;

const store = new Store();
loadSnapshot(SNAPSHOT_PATH, store);

const server = createServer(store);
server.listen(PORT, () => {
  console.log(`RESP server listening on port ${PORT}`);
});

const adminServer = createAdminServer(store);
adminServer.listen(ADMIN_PORT, () => {
  console.log(`admin server listening on port ${ADMIN_PORT}`);
});

const snapshotTimer = setInterval(() => saveSnapshot(SNAPSHOT_PATH, store), SNAPSHOT_INTERVAL_MS);

function shutdown() {
  clearInterval(snapshotTimer);
  saveSnapshot(SNAPSHOT_PATH, store);
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
