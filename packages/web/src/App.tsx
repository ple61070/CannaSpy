import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Layout from './components/shared/Layout'
import SignUp from './pages/SignUp'
import LocationWizard from './pages/LocationWizard'
import CompetitorDiscovery from './pages/CompetitorDiscovery'
import CommandCenter from './pages/CommandCenter'
import LocationDashboard from './pages/LocationDashboard'
import PriceIntelligence from './pages/PriceIntelligence'
import PromotionsTracker from './pages/PromotionsTracker'
import AlertFeed from './pages/AlertFeed'
import BlockManagement from './pages/BlockManagement'
import BlockConfirm from './pages/BlockConfirm'
import CancelBlockWarning from './pages/CancelBlockWarning'
import BillingUsage from './pages/BillingUsage'
import NotificationSettings from './pages/NotificationSettings'
import LocationManagement from './pages/LocationManagement'
import CancellationFlow from './pages/CancellationFlow'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignUp />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/command-center" replace />} />
          <Route path="command-center" element={<CommandCenter />} />
          <Route path="setup/locations" element={<LocationWizard />} />
          <Route path="setup/competitors" element={<CompetitorDiscovery />} />
          <Route path="locations" element={<LocationManagement />} />
          <Route path="locations/:locationId" element={<LocationDashboard />} />
          <Route path="prices" element={<PriceIntelligence />} />
          <Route path="promotions" element={<PromotionsTracker />} />
          <Route path="alerts" element={<AlertFeed />} />
          <Route path="blocks" element={<BlockManagement />} />
          <Route path="blocks/confirm" element={<BlockConfirm />} />
          <Route path="blocks/:blockId/cancel" element={<CancelBlockWarning />} />
          <Route path="billing" element={<BillingUsage />} />
          <Route path="settings/notifications" element={<NotificationSettings />} />
          <Route path="cancel" element={<CancellationFlow />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
