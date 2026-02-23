import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient.js'
import { AppShell } from './components/layout/AppShell.js'
import { Markets } from './pages/Markets/Markets.js'
import { MarketDetail } from './pages/MarketDetail/MarketDetail.js'
import { Portfolio } from './pages/Portfolio/Portfolio.js'
import { HowItWorks } from './pages/HowItWorks/HowItWorks.js'
import { Admin } from './pages/Admin/Admin.js'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Markets />} />
            <Route path="/market/:id" element={<MarketDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
