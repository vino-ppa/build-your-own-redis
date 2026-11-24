import './App.css'
import KeyBrowser from './KeyBrowser.jsx'
import CommandConsole from './CommandConsole.jsx'

function App() {
  return (
    <div>
      <h1>build-your-own-redis</h1>
      <CommandConsole />
      <KeyBrowser />
    </div>
  )
}

export default App
