import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Overview } from './pages/Overview'
import { Trades } from './pages/Trades'
import { Jeonse } from './pages/Jeonse'
import { Subscriptions } from './pages/Subscriptions'
import { Calculator } from './pages/Calculator'

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="/jeonse" element={<Jeonse />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/calculator" element={<Calculator />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
