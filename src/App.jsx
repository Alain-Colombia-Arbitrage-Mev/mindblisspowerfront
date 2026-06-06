import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { NotificationProvider } from '@/lib/NotificationContext';
import NotificationPopup from '@/components/NotificationPopup';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AdminSecurityGate from '@/components/admin/AdminSecurityGate';
import CollaborationNotification from '@/components/admin/CollaborationNotification';
import PublicLayout from './components/PublicLayout';
import AdminAccess from './legacy-pages/AdminAccess';
import LegacyDashboardCleanup from './components/LegacyDashboardCleanup';
import AdminDashboard from './legacy-pages/AdminDashboard';
import AdminLayout from './components/admin/AdminLayout.jsx';
// AdminControlCenter removed — using ControlCenter from pages/admin/ControlCenter
import ExecutiveOverview from './legacy-pages/admin/ExecutiveOverview.jsx';
import CRM from './legacy-pages/admin/CRM';
import Participants from './legacy-pages/admin/Participants';
import Investments from './legacy-pages/admin/Investments';
import Payments from './legacy-pages/admin/Payments';
import Leaders from './legacy-pages/admin/Leaders';
import Roles from './legacy-pages/admin/Roles';
import Support from './legacy-pages/admin/Support';
import Marketing from './legacy-pages/admin/Marketing';
import ControlCenter from './legacy-pages/admin/ControlCenter';
import WarRoomMultiScreen from './legacy-pages/admin/WarRoomMultiScreen';
import GiantScreenMode from './components/admin/GiantScreenMode';
import TabletControlMode from './components/admin/TabletControlMode';
import Audit from './legacy-pages/admin/Audit';
import Analytics from './legacy-pages/admin/Analytics';
import AIBrainPage from './legacy-pages/admin/AIBrain';
import Copilot from './legacy-pages/admin/Copilot';
import CopilotPage from './legacy-pages/admin/Copilot';
import AutoMode from './legacy-pages/admin/AutoMode';
import Settings from './legacy-pages/admin/Settings';
import IPManagement from './legacy-pages/admin/IPManagement';
import DeviceManagement from './legacy-pages/admin/DeviceManagement';
import ForensicAudit from './legacy-pages/admin/ForensicAudit';
import Security from './legacy-pages/admin/Security';
import BatchEnrichmentMonitor from './components/admin/BatchEnrichmentMonitor';
import AdminTools from './legacy-pages/AdminTools';
import AdminAutomation from './legacy-pages/AdminAutomation';
import AdminViral from './legacy-pages/AdminViral';
import AdminSocialControl from './legacy-pages/AdminSocialControl';
import AdminGrowthLab from './legacy-pages/AdminGrowthLab';
import CampaignLab from './legacy-pages/AdminGrowthLab/CampaignLab';
import ExperimentLab from './legacy-pages/AdminGrowthLab/ExperimentLab';
import AudienceLab from './legacy-pages/AdminGrowthLab/AudienceLab';
import CommandCenter from './legacy-pages/AdminGrowthLab/CommandCenter';
import CreativeScoringPage from './legacy-pages/AdminGrowthLab/CreativeScoring';
import FunnelDiagnosticsPage from './legacy-pages/AdminGrowthLab/FunnelDiagnostics';
import HookTestingPage from './legacy-pages/AdminGrowthLab/HookTesting';
import ContentVelocityPage from './legacy-pages/AdminGrowthLab/ContentVelocity';
import CampaignHeatmapPage from './legacy-pages/AdminGrowthLab/CampaignHeatmap';
import ViralMonitorPage from './legacy-pages/AdminGrowthLab/ViralMonitor';
import OperatorConsolePage from './legacy-pages/AdminGrowthLab/OperatorConsole';
import NetworkIntervention from './legacy-pages/admin/NetworkIntervention';
import ContentVariations from '@/components/admin/ContentVariations';
import AutomationEngine from '@/components/admin/AutomationEngine';
import SocialMediaControl from '@/components/admin/SocialMediaControl';
import GrowthAnalytics from '@/components/admin/GrowthAnalytics';
import Home from './legacy-pages/Home';
import CarePlan from './legacy-pages/CarePlan';
import Ecosystem from './legacy-pages/Ecosystem';
import Opportunity from './legacy-pages/Opportunity';
import AboutUs from './legacy-pages/AboutUs';
import Compliance from './legacy-pages/Compliance';
import Access from './legacy-pages/Access';
import Participar from './legacy-pages/Participar';
import Planes from './legacy-pages/Planes';
import SeleccionarNivel from './legacy-pages/SeleccionarNivel';
import AdvancedSimulator from './legacy-pages/AdvancedSimulator';
import Onboarding from './legacy-pages/Onboarding';
import Notificaciones from './legacy-pages/Notificaciones';
import FAQ from './legacy-pages/FAQ';
import OnboardingStart from './legacy-pages/OnboardingStart';
import OnboardingResume from './legacy-pages/OnboardingResume';
import SimuladorPrivado from './legacy-pages/SimuladorPrivado';
import AvisoLegal from './legacy-pages/legal/AvisoLegal';
import TerminosCondiciones from './legacy-pages/legal/TerminosCondiciones';
import Privacidad from './legacy-pages/legal/Privacidad';
import AmlKyc from './legacy-pages/legal/AmlKyc';
import Riesgos from './legacy-pages/legal/Riesgos';
import CodigoConducta from './legacy-pages/legal/CodigoConducta';
import PoliticaDeUso from './legacy-pages/legal/PoliticaDeUso';
import Transparencia from './legacy-pages/Transparencia';
import DataRoom from './legacy-pages/DataRoom';
import LeadQualification from './components/LeadQualification';
import UserLogin from './legacy-pages/UserLogin';
import UserRegister from './legacy-pages/UserRegister';
import UserDashboard from './legacy-pages/UserDashboard';
import UserDashboardNetwork from './legacy-pages/user/UserDashboardNetwork';
import SafePageWrapper from '@/components/SafePageWrapper';
import MemberLayout from './components/member/MemberLayout';
import MemberHome from './legacy-pages/member/MemberHomeElite';
import MemberNetwork from './legacy-pages/member/MemberNetwork';
import MemberTeam from './legacy-pages/member/MemberTeam';
import MemberBonuses from './legacy-pages/member/MemberBonuses';
import MemberBonusesElite from './legacy-pages/member/MemberBonusesElite';
import MemberReferrals from './legacy-pages/member/MemberReferrals';
import MemberWithdrawals from './legacy-pages/member/MemberWithdrawals';
import MemberCommunications from './legacy-pages/member/MemberCommunications';
import MemberRank from './legacy-pages/member/MemberRank';
import MemberProducts from './legacy-pages/member/MemberProducts';
import MemberActivity from './legacy-pages/member/MemberActivity';
import MemberProfile from './legacy-pages/member/MemberProfile';
import MemberSupport from './legacy-pages/member/MemberSupport';
import MemberAI from './legacy-pages/member/MemberAI';
import MemberAuto from './legacy-pages/member/MemberAuto';
import MemberWarRoom from './legacy-pages/member/MemberWarRoom';
import MemberLegalCenter from './legacy-pages/member/MemberLegalCenter';

// PHASE 3, 10: STRICT ADMIN PROTECTION
// Only read admin session keys, never member keys
const AdminProtectedRoute = ({ children }) => {
  const adminAuth = localStorage.getItem('admin_auth') === 'true';
  const adminRole = localStorage.getItem('admin_role');
  
  // PHASE 3: Only admin session matters — NO double checks
  if (!adminAuth || adminRole !== 'admin') {
    return <Navigate to="/admin-access" replace />;
  }
  
  // PHASE 7: If admin is authenticated, allow access
  return children;
};

// MEMBER DASHBOARD GUARD: Enforce authentication
const MemberProtectedRoute = ({ children }) => {
  const userAuth = localStorage.getItem('user_auth') === 'true';
  const userId = localStorage.getItem('user_id');
  
  if (!userAuth || !userId) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // PHASE 9: Admin logout clears ONLY admin keys
  const handleAdminLogout = () => {
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_id');
    localStorage.removeItem('admin_session_id');
    window.location.href = '/admin-access';
  };

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
      <Routes>
        {/* Add your page Route elements here */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/care-plan" element={<CarePlan />} />
          <Route path="/vicion-care-plan" element={<CarePlan />} />
          <Route path="/ecosystem" element={<Ecosystem />} />
          <Route path="/opportunity" element={<Opportunity />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/access" element={<Access />} />
          <Route path="/participar" element={<Participar />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/seleccionar-nivel" element={<SeleccionarNivel />} />
          <Route path="/qualify" element={<LeadQualification />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/advanced-simulator" element={<AdvancedSimulator />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/onboarding/start" element={<OnboardingStart />} />
            <Route path="/onboarding/resume" element={<OnboardingResume />} />
          <Route path="/simulador-privado" element={<SimuladorPrivado />} />
          <Route path="/legal/aviso-legal" element={<AvisoLegal />} />
          <Route path="/legal/terminos-condiciones" element={<TerminosCondiciones />} />
          <Route path="/legal/privacidad" element={<Privacidad />} />
          <Route path="/legal/aml-kyc" element={<AmlKyc />} />
          <Route path="/legal/riesgos" element={<Riesgos />} />
          <Route path="/legal/codigo-conducta" element={<CodigoConducta />} />
          <Route path="/legal/politica-de-uso" element={<PoliticaDeUso />} />
          <Route path="/transparencia" element={<Transparencia />} />
          <Route path="/data-room" element={<DataRoom />} />
        </Route>
        <Route path="/login" element={<UserLogin />} />
        <Route path="/register" element={<UserRegister />} />
        <Route path="/dashboard" element={<LegacyDashboardCleanup />} />
        <Route path="/dashboard/home" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberHome />} />
        </Route>
        <Route path="/dashboard/network" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberNetwork />} />
        </Route>
        <Route path="/dashboard/team" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberTeam />} />
        </Route>
        <Route path="/dashboard/bonificaciones" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberBonusesElite />} />
        </Route>
        <Route path="/dashboard/referrals" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberReferrals />} />
        </Route>
        <Route path="/dashboard/withdrawals" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberWithdrawals />} />
        </Route>
        <Route path="/dashboard/communications" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberCommunications />} />
        </Route>
        <Route path="/dashboard/rank" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberRank />} />
        </Route>
        <Route path="/dashboard/products" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberProducts />} />
        </Route>
        <Route path="/dashboard/activity" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberActivity />} />
        </Route>
        <Route path="/dashboard/profile" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberProfile />} />
        </Route>
        <Route path="/dashboard/support" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberSupport />} />
        </Route>
        <Route path="/dashboard/ai" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberAI />} />
        </Route>
        <Route path="/dashboard/auto" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberAuto />} />
        </Route>
        <Route path="/dashboard/war-room" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberWarRoom />} />
        </Route>
        <Route path="/dashboard/legal" element={<MemberProtectedRoute><MemberLayout /></MemberProtectedRoute>}>
          <Route index element={<MemberLegalCenter />} />
        </Route>
        <Route path="/dashboard/*" element={<MemberProtectedRoute><Navigate to="/dashboard/home" replace /></MemberProtectedRoute>} />
        <Route path="/admin-access" element={<AdminAccess />} />
        <Route path="/admin-dashboard" element={<AdminProtectedRoute><AdminSecurityGate><AdminLayout onLogout={handleAdminLogout} /></AdminSecurityGate></AdminProtectedRoute>}>
          <Route index element={<Navigate to="/admin-dashboard/overview" replace />} />
          <Route path="overview" element={<ExecutiveOverview />} />
          <Route path="crm" element={<CRM />} />
          <Route path="participants" element={<Participants />} />
          <Route path="participants/:id" element={<Participants />} />
          <Route path="investments" element={<Investments />} />
          <Route path="investments/:id" element={<Investments />} />
          <Route path="payments" element={<Payments />} />
          <Route path="payments/:id" element={<Payments />} />
          <Route path="leaders" element={<Leaders />} />
          <Route path="leaders/:id" element={<Leaders />} />
          <Route path="permissions" element={<Roles />} />
          <Route path="roles" element={<Navigate to="/admin-dashboard/permissions" replace />} />
          <Route path="support" element={<Support />} />
          <Route path="support/:caseId" element={<Support />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="marketing/campaigns" element={<CampaignLab />} />
          <Route path="marketing/content" element={<ContentVariations />} />
          <Route path="marketing/experiments" element={<ExperimentLab />} />
          <Route path="marketing/audiences" element={<AudienceLab />} />
          <Route path="marketing/automation" element={<AutomationEngine />} />
          <Route path="marketing/analytics" element={<GrowthAnalytics />} />
          <Route path="marketing/command-center" element={<CommandCenter />} />
          <Route path="control-center" element={<ControlCenter />} />
          <Route path="war-room/multi" element={<WarRoomMultiScreen />} />
          <Route path="war-room" element={<WarRoomMultiScreen />} />
          <Route path="giant-screen" element={<GiantScreenMode />} />
          <Route path="tablet-control" element={<TabletControlMode />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ai-brain" element={<AIBrainPage />} />
          <Route path="copilot" element={<CopilotPage />} />
          <Route path="auto-mode" element={<AutoMode />} />
          <Route path="audit" element={<Audit />} />
          <Route path="settings" element={<Settings />} />
          <Route path="ip-management" element={<IPManagement />} />
          <Route path="device-management" element={<DeviceManagement />} />
          <Route path="forensic-audit" element={<ForensicAudit />} />
          <Route path="security" element={<Security />} />
          <Route path="network-intervention" element={<NetworkIntervention />} />
          <Route path="batch-enrichment" element={<BatchEnrichmentMonitor />} />
          </Route>
        <Route path="/admin-tools" element={<AdminProtectedRoute><AdminSecurityGate><AdminTools /></AdminSecurityGate></AdminProtectedRoute>} />
        <Route path="/admin-automation" element={<AdminProtectedRoute><AdminSecurityGate><AdminAutomation /></AdminSecurityGate></AdminProtectedRoute>} />
        <Route path="/admin-viral" element={<AdminProtectedRoute><AdminSecurityGate><AdminViral /></AdminSecurityGate></AdminProtectedRoute>} />
        <Route path="/admin-social" element={<AdminProtectedRoute><AdminSecurityGate><AdminSocialControl /></AdminSecurityGate></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab" element={<AdminProtectedRoute><AdminSecurityGate><AdminGrowthLab /></AdminSecurityGate></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/campaigns" element={<AdminProtectedRoute><CampaignLab /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/content" element={<AdminProtectedRoute><ContentVariations /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/experiments" element={<AdminProtectedRoute><ExperimentLab /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/audiences" element={<AdminProtectedRoute><AudienceLab /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/automation" element={<AdminProtectedRoute><AutomationEngine /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/social" element={<AdminProtectedRoute><SocialMediaControl /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/analytics" element={<AdminProtectedRoute><GrowthAnalytics /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/control-center" element={<AdminProtectedRoute><ControlCenter /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/command-center" element={<AdminProtectedRoute><CommandCenter /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/creative-scoring" element={<AdminProtectedRoute><CreativeScoringPage /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/funnel-diagnostics" element={<AdminProtectedRoute><FunnelDiagnosticsPage /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/hook-testing" element={<AdminProtectedRoute><HookTestingPage /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/content-velocity" element={<AdminProtectedRoute><ContentVelocityPage /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/campaign-heatmap" element={<AdminProtectedRoute><CampaignHeatmapPage /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/viral-monitor" element={<AdminProtectedRoute><ViralMonitorPage /></AdminProtectedRoute>} />
        <Route path="/admin-growth-lab/operator-console" element={<AdminProtectedRoute><OperatorConsolePage /></AdminProtectedRoute>} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <CollaborationNotification />
    </>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <NotificationProvider>
          <Router>
            <AuthenticatedApp />
            <NotificationPopup />
          </Router>
          <Toaster />
        </NotificationProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App