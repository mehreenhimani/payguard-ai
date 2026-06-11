import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ReviewQueue from './pages/ReviewQueue'
import Analytics from './pages/Analytics'

function Placeholder({ title }) {
  return (
    <div className="flex-1 flex items-center justify-center h-screen text-slate-600">
      <div className="text-center">
        <p className="text-2xl font-semibold text-slate-700">{title}</p>
        <p className="text-sm mt-2">Coming soon</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/queue" element={<ReviewQueue />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/audit" element={<Placeholder title="Audit Log" />} />
            <Route path="/rules" element={<Placeholder title="Rule Engine" />} />
            <Route path="/settings" element={<Placeholder title="Settings" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
