import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { MissionProvider } from './context/MissionContext.jsx'
import '@fontsource-variable/unbounded'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import './index.css'
import { loadCalm } from './components/dashboard/SettingsCard.jsx'

loadCalm()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MissionProvider>
        <App />
      </MissionProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
