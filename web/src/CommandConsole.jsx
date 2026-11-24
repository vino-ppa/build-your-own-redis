import { useState } from 'react';

const ADMIN_URL = 'http://localhost:6381';

function CommandConsole() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]); // array of { command, reply }

  async function runCommand(line) {
    // A real client would respect quoted strings ("multi word value") —
    // we're keeping it simple: just split on whitespace.
    const [command, ...args] = line.trim().split(/\s+/);
    if (!command) return;

    // TODO 1: POST to `${ADMIN_URL}/command` with a JSON body
    // { command, args }, read the response as text (res.text()), and
    // append { command: line, reply } to `history` using setHistory.
    // Careful: setHistory(newArray) REPLACES the array — to add one entry
    // you need something like setHistory([...history, newEntry]).
    try {
      const response = await fetch(`${ADMIN_URL}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, args }),
      });
      const reply = await response.text();
      setHistory([...history, { command: line, reply }]);
    } catch (error) {
      console.error('Error running command:', error);
    }
  }

  function handleSubmit(event) {
    // TODO 2: prevent the form's default full-page-reload behavior
    // (event.preventDefault()), call runCommand(input), then clear the
    // input back to '' with setInput.
    event.preventDefault();
    runCommand(input);
    setInput('');
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="SET foo bar"
        />
        <button type="submit">Run</button>
      </form>
      <pre>
        {history.map((entry, i) => `> ${entry.command}\n${entry.reply}`).join('\n')}
      </pre>
    </div>
  );
}

export default CommandConsole;
