import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/common/AppLayout'
import LandingPage from './pages/LandingPage'
import MissionHome from './pages/MissionHome'
import Simulator from './pages/Simulator'
import WhatIfLab from './pages/WhatIfLab'
import NASAHub from './pages/NASAHub'
import Academy from './pages/Academy'
import MissionAdvisor from './pages/MissionAdvisor'
import Reports from './pages/Reports'
import Achievements from './pages/Achievements'
import About from './pages/About'
import DataPage from './pages/DataPage'
import GameScreen from './game/GameScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/play" element={<GameScreen />} />
      <Route element={<AppLayout />}>
        <Route path="/home" element={<MissionHome />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/what-if" element={<WhatIfLab />} />
        <Route path="/nasa" element={<NASAHub />} />
        <Route path="/academy" element={<Academy />} />
        <Route path="/advisor" element={<MissionAdvisor />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
