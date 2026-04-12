import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import WorkspacePage from '@/pages/WorkspacePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/project/:projectId" element={<WorkspacePage />} />
      </Routes>
    </BrowserRouter>
  )
}
