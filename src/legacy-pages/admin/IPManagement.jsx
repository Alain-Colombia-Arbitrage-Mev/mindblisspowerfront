import { useState, useEffect } from 'react';
import { Trash2, Plus, Shield, MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import IPAccessControl from '@/lib/IPAccessControl';

export default function IPManagement() {
  const [trustedIPs, setTrustedIPs] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loginLocations, setLoginLocations] = useState({});
  const [newIP, setNewIP] = useState('');
  const [newIPLabel, setNewIPLabel] = useState('');
  const [activeTab, setActiveTab] = useState('trusted');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTrustedIPs(IPAccessControl.getTrustedIPs());
    setBlockedIPs(IPAccessControl.getBlockedIPs());
    setLoginHistory(IPAccessControl.getLoginHistory(50));
    setLoginLocations(IPAccessControl.getLoginLocations());
  };

  const handleAddTrustedIP = () => {
    if (newIP.trim()) {
      IPAccessControl.addTrustedIP(newIP.trim(), newIPLabel);
      setNewIP('');
      setNewIPLabel('');
      loadData();
    }
  };

  const handleRemoveTrustedIP = (ip) => {
    IPAccessControl.removeTrustedIP(ip);
    loadData();
  };

  const handleBlockIP = (ip) => {
    IPAccessControl.blockIP(ip, 'Admin blocked');
    loadData();
  };

  const handleUnblockIP = (ip) => {
    IPAccessControl.unblockIP(ip);
    loadData();
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabStyle = (isActive) => ({
    padding: '10px 16px',
    fontSize: 12,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.5)',
    borderBottom: isActive ? '2px solid #3b82f6' : 'none',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} style={{ color: '#3b82f6' }} />
          <h1 className="text-white font-montserrat font-black text-2xl">IP Access Control</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Manage trusted and blocked IP addresses for admin access</p>
      </div>

      {/* Login Locations Overview */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(13,31,60,0.35)', border: '1px solid rgba(59,130,246,0.18)' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>LOGIN LOCATIONS</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Object.entries(loginLocations).map(([location, count]) => (
            <div key={location} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>{location}</p>
              <p style={{ color: '#3b82f6', fontSize: 18, fontWeight: 700, margin: '4px 0 0' }}>{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-0 border-b border-white/8 mb-6">
        <button onClick={() => setActiveTab('trusted')} style={tabStyle(activeTab === 'trusted')}>
          ✓ Trusted IPs ({trustedIPs.length})
        </button>
        <button onClick={() => setActiveTab('blocked')} style={tabStyle(activeTab === 'blocked')}>
          ✗ Blocked IPs ({blockedIPs.length})
        </button>
        <button onClick={() => setActiveTab('history')} style={tabStyle(activeTab === 'history')}>
          📋 Login History
        </button>
      </div>

      {/* Trusted IPs Tab */}
      {activeTab === 'trusted' && (
        <div>
          <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(13,31,60,0.35)', border: '1px solid rgba(59,130,246,0.18)' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>ADD TRUSTED IP</p>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="IP Address (e.g., 192.168.1.1)"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                className="px-4 py-2 rounded-lg text-white placeholder-white/25 focus:outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <input
                type="text"
                placeholder="Label (e.g., Office, Home)"
                value={newIPLabel}
                onChange={(e) => setNewIPLabel(e.target.value)}
                className="px-4 py-2 rounded-lg text-white placeholder-white/25 focus:outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <button
                onClick={handleAddTrustedIP}
                disabled={!newIP.trim()}
                className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}
              >
                <Plus size={16} /> Add IP
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {trustedIPs.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: '20px' }}>No trusted IPs yet</p>
            ) : (
              trustedIPs.map((ip, idx) => (
                <div key={idx} className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} style={{ color: '#10b981' }} />
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, margin: 0 }}>{ip}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>Trusted</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTrustedIP(ip)}
                    className="p-2 rounded-lg transition-all hover:bg-white/10"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Blocked IPs Tab */}
      {activeTab === 'blocked' && (
        <div className="space-y-2">
          {blockedIPs.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: '20px' }}>No blocked IPs</p>
          ) : (
            blockedIPs.map((ip, idx) => (
              <div key={idx} className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex items-center gap-3">
                  <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, margin: 0 }}>{ip}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>Blocked</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblockIP(ip)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Login History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loginHistory.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: '20px' }}>No login history</p>
          ) : (
            loginHistory.map((entry, idx) => (
              <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {entry.action === 'login_success' ? (
                      <CheckCircle size={14} style={{ color: '#10b981' }} />
                    ) : entry.action === 'login_failed' ? (
                      <AlertTriangle size={14} style={{ color: '#fb923c' }} />
                    ) : (
                      <Shield size={14} style={{ color: '#3b82f6' }} />
                    )}
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>
                      {entry.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    <Clock size={12} className="inline mr-1" />
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  {entry.email && <p>Email: {entry.email}</p>}
                  <p>IP: {entry.ip}</p>
                  {entry.region && <p>Region: {entry.region}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}