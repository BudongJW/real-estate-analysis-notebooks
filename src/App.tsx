import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Overview } from './pages/Overview'
import { Trades } from './pages/Trades'
import { Jeonse } from './pages/Jeonse'
import { Subscriptions } from './pages/Subscriptions'
import { Calculator } from './pages/Calculator'
import { Report } from './pages/Report'
import { Pricing } from './pages/Pricing'
import { CustomReport } from './pages/CustomReport'

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
          <Route path="/report" element={<Report />} />
          <Route path="/custom-report" element={<CustomReport />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
