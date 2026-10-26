import { ProfileDashboardPage } from "../_components/ExecutiveDashboardPages";
import { betterAuthEnabled } from '@/lib/better-auth-bridge.mjs';

export default function ProfilePage() {
  return <ProfileDashboardPage authMode={betterAuthEnabled() ? 'better-auth' : 'cognito'} />;
}
