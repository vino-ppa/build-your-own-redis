import { useState, useEffect } from 'react';

const ADMIN_URL = 'http://localhost:6381';

function KeyBrowser() {
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    // TODO 1: fetch(`${ADMIN_URL}/keys`), parse the JSON body, and pass the
    // result to setKeys. fetch returns a Promise — use .then() twice
    // (once for the response -> JSON, once for the JSON -> setKeys), or an
    // async function if you're comfortable with async/await.
    fetch (`${ADMIN_URL}/keys`)
      .then((response) => response.json())
      .then((data) => setKeys(data))
      .catch((error) => console.error('Error fetching keys:', error));
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:6381');

    ws.addEventListener('message', (wsEvent) => {
      const change = JSON.parse(wsEvent.data); // { type: 'set', key, value } or { type: 'del', key }

      // TODO 3: setKeys(prevKeys => ...) — using the UPDATER FUNCTION form,
      // not setKeys(keys.something) — compute and return the new array:
      //   - if change.type === 'set': if an entry with this key already
      //     exists in prevKeys, replace its value; otherwise append a new
      //     { key: change.key, value: change.value } entry.
      //   - if change.type === 'del': return prevKeys with that key filtered out.
      setKeys((prevKeys) => {
        if (change.type === 'set') {
          const existingIndex = prevKeys.findIndex((entry) => entry.key === change.key);
          if (existingIndex !== -1) {
            // Replace the existing entry's value
            const updatedKeys = [...prevKeys];
            updatedKeys[existingIndex] = { key: change.key, value: change.value };
            return updatedKeys;
          } else {
            // Append a new entry
            return [...prevKeys, { key: change.key, value: change.value }];
          }
        } else if (change.type === 'del') {
          // Filter out the entry with the specified key
          return prevKeys.filter((entry) => entry.key !== change.key);
        }
        return prevKeys; // No change for unrecognized types
      });
    });

    return () => ws.close();
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {/* TODO 2: render one <tr> per entry in `keys`, each with a <td> for
            the key and a <td> for the value. Use keys.map(...). Every <tr>
            needs a `key` prop (React's own bookkeeping, unrelated to our
            Redis keys — just use entry.key as its value) so React can track
            which row is which across re-renders. */}
        {keys.map((entry) => (
          <tr key={entry.key}>
            <td>{entry.key}</td>
            <td>{entry.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default KeyBrowser;
