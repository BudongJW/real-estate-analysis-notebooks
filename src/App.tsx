import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'

// Lazy load pages for code-splitting
const Overview = lazy(() => import('./pages/Overview').then(m => ({ default: m.Overview })))
const Trades = lazy(() => import('./pages/Trades').then(m => ({ default: m.Trades })))
const Jeonse = lazy(() => import('./pages/Jeonse').then(m => ({ default: m.Jeonse })))
const Subscriptions = lazy(() => import('./pages/Subscriptions').then(m => ({ default: m.Subscriptions })))
const Calculator = lazy(() => import('./pages/Calculator').then(m => ({ default: m.Calculator })))
const Report = lazy(() => import('./pages/Report').then(m => ({ default: m.Report })))
const CustomReport = lazy(() => import('./pages/CustomReport').then(m => ({ default: m.CustomReport })))
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })))
const Compare = lazy(() => import('./pages/Compare').then(m => ({ default: m.Compare })))
const RoiSimulator = lazy(() => import('./pages/RoiSimulator').then(m => ({ default: m.RoiSimulator })))
const TaxCalculator = lazy(() => import('./pages/TaxCalculator').then(m => ({ default: m.TaxCalculator })))

function Loading() {
  return <div className="flex justify-center py-20 text-gray-400">로딩 중...</div>
}

function App() {
  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/jeonse" element={<Jeonse />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/roi" element={<RoiSimulator />} />
            <Route path="/tax" element={<TaxCalculator />} />
            <Route path="/report" element={<Report />} />
            <Route path="/custom-report" element={<CustomReport />} />
            <Route path="/pricing" element={<Pricing />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  )
}

export default App
