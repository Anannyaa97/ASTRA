import { Outlet } from 'react-router-dom'
import MissionSidebar from './MissionSidebar'
import SpaceBackdrop from './SpaceBackdrop'

// Shell for every in-app page (everything except the landing page).
export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SpaceBackdrop />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-warn focus:p-2 focus:text-black">
        Skip to content
      </a>
      <MissionSidebar />
      <main id="main" className="min-w-0 flex-1 p-3 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
