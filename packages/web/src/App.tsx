import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Layout from './components/shared/Layout'

// Existing pages
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

// New pages
import CompetitorProfile from './pages/CompetitorProfile'
import PriceHistory from './pages/PriceHistory'
import CatalogComparison from './pages/CatalogComparison'
import BrandCoverage from './pages/BrandCoverage'
import AlertDetail from './pages/AlertDetail'
import PriceChangeDeepDive from './pages/PriceChangeDeepDive'
import PromoDeepDive from './pages/PromoDeepDive'
import UpcomingBilling from './pages/UpcomingBilling'
import BlockAnalytics from './pages/BlockAnalytics'
import MarketHeatMap from './pages/MarketHeatMap'
import CompetitorRanking from './pages/CompetitorRanking'
import MyBenchmarks from './pages/MyBenchmarks'
import NewRivalAlert from './pages/NewRivalAlert'
import SkuGapAnalysis from './pages/SkuGapAnalysis'
import DealEffectiveness from './pages/DealEffectiveness'
import TeamAnnotations from './pages/TeamAnnotations'
import LocationAccess from './pages/LocationAccess'
import DataTrust from './pages/DataTrust'
import Offboarded from './pages/Offboarded'
import ActionQueue from './pages/ActionQueue'

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
        {/* Public routes */}
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignUp />} />
        <Route path="/offboarded" element={<Offboarded />} />
        <Route path="/setup/org" element={<SignUp />} />
        <Route path="/setup/locations" element={<LocationWizard />} />
        <Route path="/setup/competitors" element={<CompetitorDiscovery />} />

        {/* Protected app routes */}
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

          {/* Onboarding */}
          <Route path="setup/locations" element={<LocationWizard />} />
          <Route path="setup/competitors" element={<CompetitorDiscovery />} />

          {/* Locations */}
          <Route path="locations" element={<LocationManagement />} />
          <Route path="locations/:locationId" element={<LocationDashboard />} />
          <Route path="settings/location-access" element={<LocationAccess />} />

          {/* Price intelligence */}
          <Route path="prices" element={<PriceIntelligence />} />
          <Route path="prices/history" element={<PriceHistory />} />
          <Route path="prices/catalog" element={<CatalogComparison />} />
          <Route path="prices/brands" element={<BrandCoverage />} />
          <Route path="prices/change/:eventId" element={<PriceChangeDeepDive />} />

          {/* Promotions */}
          <Route path="promotions" element={<PromotionsTracker />} />
          <Route path="promotions/:promoId" element={<PromoDeepDive />} />

          {/* Alerts */}
          <Route path="alerts" element={<AlertFeed />} />
          <Route path="alerts/new-rival" element={<NewRivalAlert />} />
          <Route path="alerts/:alertId" element={<AlertDetail />} />

          {/* Competitors */}
          <Route path="competitors/:rivalId" element={<CompetitorProfile />} />

          {/* Blocks */}
          <Route path="blocks" element={<BlockManagement />} />
          <Route path="blocks/confirm" element={<BlockConfirm />} />
          <Route path="blocks/analytics" element={<BlockAnalytics />} />
          <Route path="blocks/:blockId/cancel" element={<CancelBlockWarning />} />
          <Route path="blocks/:blockId/billing" element={<UpcomingBilling />} />

          {/* Market intelligence */}
          <Route path="market/heat-map" element={<MarketHeatMap />} />
          <Route path="market/ranking" element={<CompetitorRanking />} />
          <Route path="market/benchmarks" element={<MyBenchmarks />} />
          <Route path="market/sku-gaps" element={<SkuGapAnalysis />} />
          <Route path="market/deals" element={<DealEffectiveness />} />

          {/* Team */}
          <Route path="team/annotations" element={<TeamAnnotations />} />
          <Route path="actions" element={<ActionQueue />} />

          {/* Billing & settings */}
          <Route path="billing" element={<BillingUsage />} />
          <Route path="billing/upcoming" element={<UpcomingBilling />} />
          <Route path="settings/notifications" element={<NotificationSettings />} />
          <Route path="data-trust" element={<DataTrust />} />
          <Route path="cancel" element={<CancellationFlow />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
