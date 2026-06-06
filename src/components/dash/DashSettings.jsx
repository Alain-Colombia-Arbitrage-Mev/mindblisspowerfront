import { useState } from 'react';
import { User, Lock, Bell, Globe, Wallet, Eye, Shield, ChevronRight } from 'lucide-react';

const C = ({ children, style }) => (
  <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 20, ...style }}>
    {children}
  </div>
);
const Label = ({ children }) => (
  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: 14 }}>
    {children}
  </div>
);
const Field = ({ label, value, editable }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'white', fontSize: 12, fontWeight: 500 }}>{value}</span>
      {editable && <button style={{ color: '#3b82f6', fontSize: 11, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '3px 10px', borderRadius: 6, cursor: 'pointer' }}>Edit</button>}
    </div>
  </div>
);
const Toggle = ({ label, sub, on }) => {
  const [active, setActive] = useState(on);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <div style={{ color: 'white', fontSize: 13, marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{sub}</div>}
      </div>
      <div onClick={() => setActive(!active)} style={{ width: 42, height: 24, borderRadius: 12, background: active ? '#3b82f6' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: active ? 21 : 3, transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );
};

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'language', label: 'Language & Region', icon: Globe },
  { id: 'payout', label: 'Payout Settings', icon: Wallet },
  { id: 'visibility', label: 'Visibility', icon: Eye },
];

export default function DashSettings({ user }) {
  const [activeSection, setActiveSection] = useState('profile');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Settings</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Manage your account preferences and security</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
        {/* Section nav */}
        <C style={{ padding: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  background: activeSection === s.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                  border: activeSection === s.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  color: activeSection === s.id ? 'white' : 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                <s.icon size={15} style={{ color: activeSection === s.id ? '#3b82f6' : 'rgba(255,255,255,0.25)' }} />
                {s.label}
              </button>
            ))}
          </div>
        </C>

        {/* Section content */}
        <div>
          {activeSection === 'profile' && (
            <C>
              <Label>Personal Information</Label>
              <Field label="Full Name" value={user?.full_name || 'Member Name'} editable />
              <Field label="Email Address" value={user?.email || 'member@email.com'} editable />
              <Field label="Member ID" value="VP-10234" />
              <Field label="Country" value="Colombia" editable />
              <Field label="Phone" value="+57 *** **** **78" editable />
              <Field label="Join Date" value="January 15, 2025" />
              <Field label="Sponsor" value="VP-00102" />
            </C>
          )}

          {activeSection === 'security' && (
            <C>
              <Label>Security Settings</Label>
              <Field label="Password" value="Last changed 30 days ago" editable />
              <Toggle label="Two-Factor Authentication (2FA)" sub="Adds extra login security" on={true} />
              <Toggle label="Login Notifications" sub="Alert on new device login" on={true} />
              <div style={{ marginTop: 14, padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8 }}>Active Sessions</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Chrome / Colombia — Current</div>
                  <span style={{ color: '#34d399', fontSize: 10, fontWeight: 600 }}>Active</span>
                </div>
              </div>
            </C>
          )}

          {activeSection === 'notifications' && (
            <C>
              <Label>Notification Preferences</Label>
              <Toggle label="Cycle Match Alerts" sub="Notify when a new cycle match is processed" on={true} />
              <Toggle label="New Direct Referral" sub="Alert when someone joins through your link" on={true} />
              <Toggle label="Rank Advancement" sub="Notify on qualification milestone achieved" on={true} />
              <Toggle label="Payout Status Updates" sub="Notify on payout request status changes" on={true} />
              <Toggle label="System Announcements" sub="Platform updates and policy notices" on={false} />
              <Toggle label="Marketing Emails" sub="Platform offers and promotions" on={false} />
            </C>
          )}

          {activeSection === 'language' && (
            <C>
              <Label>Language & Region</Label>
              <Field label="Language" value="English (EN)" editable />
              <Field label="Region" value="Latin America" editable />
              <Field label="Currency Display" value="USD ($)" editable />
              <Field label="Date Format" value="YYYY-MM-DD" editable />
              <Field label="Timezone" value="UTC-5 (Bogotá)" editable />
            </C>
          )}

          {activeSection === 'payout' && (
            <C>
              <Label>Payout Settings</Label>
              <div style={{ padding: '14px 16px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, marginBottom: 14 }}>
                <div style={{ color: '#34d399', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✓ External Method Active</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Linked payout destination verified</div>
              </div>
              <Field label="Payout Destination" value="External Transfer ***4892" editable />
              <Field label="Minimum Payout Threshold" value="$100" />
              <Field label="Auto-Request" value="Disabled" editable />
              <Toggle label="Payout Notifications" sub="Alert on each payout processing update" on={true} />
            </C>
          )}

          {activeSection === 'visibility' && (
            <C>
              <Label>Visibility Permissions</Label>
              <Toggle label="Show My Profile to Upline" sub="Allow sponsor to view basic profile" on={true} />
              <Toggle label="Show Activity Score to Team" sub="Display your participation score in team views" on={false} />
              <Toggle label="Appear in Public Leaderboard" sub="Optional recognition visibility" on={false} />
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(59,130,246,0.05)', borderRadius: 10, color: 'rgba(255,255,255,0.3)', fontSize: 11, lineHeight: 1.5 }}>
                Visibility settings control what information is accessible to other members within the platform structure. Compliance-required data is always accessible to authorized platform administrators.
              </div>
            </C>
          )}
        </div>
      </div>
    </div>
  );
}