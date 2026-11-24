import fs from 'node:fs';

// Writes the store's current contents to `filePath` as JSON.
export function saveSnapshot(filePath, store) {
  // TODO 1: fs.writeFileSync(filePath, JSON.stringify(store.dump()))
  fs.writeFileSync(filePath, JSON.stringify(store.dump()));
}

// If `filePath` exists, reads it and loads its contents into `store`.
// Does nothing if the file doesn't exist yet (e.g. first run ever).
export function loadSnapshot(filePath, store) {
  // TODO 2: check fs.existsSync(filePath). If true: read the file
  //         (fs.readFileSync(filePath, 'utf8')), JSON.parse it, and
  //         pass the result to store.load(...).
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    store.load(JSON.parse(data));
  }
}
