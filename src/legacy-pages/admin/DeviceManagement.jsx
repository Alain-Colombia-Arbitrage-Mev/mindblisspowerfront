import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, CheckCircle, Shield, Smartphone, MonitorX, Clock, AlertCircle } from 'lucide-react';
import DeviceSecurityManager from '@/lib/DeviceSecurityManager';

export default function DeviceManagement() {
  const [devices, setDevices] = useState([]);
  const [newDevices, setNewDevices] = useState([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState([]);
  const [deviceActivity, setDeviceActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('devices');
  const [expandedDevice, setExpandedDevice] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDevices(DeviceSecurityManager.getRegisteredDevices());
    setNewDevices(DeviceSecurityManager.getNewDevices());
    setSuspiciousActivity(DeviceSecurityManager.getSuspiciousActivity());
    setDeviceActivity(DeviceSecurityManager.getDeviceActivity(50));
  };

  const handleConfirmDevice = (deviceId) => {
    DeviceSecurityManager.confirmDevice(deviceId);
    loadData();
  };

  const handleBlockDevice = (deviceId) => {
    DeviceSecurityManager.blockDevice(deviceId, 'Admin blocked');
    loadData();
  };

  const handleRemoveDevice = (deviceId) => {
    DeviceSecurityManager.removeDevice(deviceId);
    loadData();
  };

  const handleResolveSuspicious = (index) => {
    DeviceSecurityManager.resolveSuspiciousActivity(index);
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

  const getDeviceIcon = (type) => {
    if (type === 'Mobile') return '📱';
    if (type === 'Tablet') return '📱';
    return '💻';
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} style={{ color: '#3b82f6' }} />
          <h1 className="text-white font-montserrat font-black text-2xl">Device Management</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Track and control admin devices</p>
      </div>

      {/* Alert for new devices */}
      {newDevices.length > 0 && (
        <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)' }}>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} style={{ color: '#fb923c', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ color: '#fb923c', fontWeight: 700, margin: 0 }}>{newDevices.length} New Device{newDevices.length > 1 ? 's' : ''} Require Confirmation</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>Review and confirm new devices to proceed with admin access</p>
            </div>
          </div>
        </div>
      )}

      {/* Alert for suspicious activity */}
      {suspiciousActivity.length > 0 && (
        <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ color: '#ef4444', fontWeight: 700, margin: 0 }}>{suspiciousActivity.length} Suspicious Activity Alert{suspiciousActivity.length > 1 ? 's' : ''}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>Review activity and take action as needed</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-0 border-b border-white/8 mb-6">
        <button onClick={() => setActiveTab('devices')} style={tabStyle(activeTab === 'devices')}>
          🖥️ Devices ({devices.length})
        </button>
        <button onClick={() => setActiveTab('new')} style={tabStyle(activeTab === 'new')}>
          🆕 New Devices ({newDevices.length})
        </button>
        <button onClick={() => setActiveTab('suspicious')} style={tabStyle(activeTab === 'suspicious')}>
          ⚠️ Suspicious ({suspiciousActivity.length})
        </button>
        <button onClick={() => setActiveTab('activity')} style={tabStyle(activeTab === 'activity')}>
          📋 Activity Log
        </button>
      </div>

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-3">
          {devices.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: '20px' }}>No registered devices</p>
          ) : (
            devices.map((device) => (
              <div key={device.deviceId} className="p-4 rounded-lg" style={{ background: device.status === 'blocked' ? 'rgba(239,68,68,0.08)' : 'rgba(13,31,60,0.35)', border: device.status === 'blocked' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(59,130,246,0.18)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ fontSize: 18 }}>{getDeviceIcon(device.type)}</span>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, margin: 0 }}>{device.label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>
                          {device.type} • {device.browser} • {device.email}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                      <div style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Registered:</span> {formatDate(device.registeredAt)}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Last Access:</span> {formatDate(device.lastAccess)}
                      </div>
                    </div>
                    {device.status === 'blocked' && (
                      <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)' }}>
                        <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, margin: 0 }}>🚫 BLOCKED</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {device.status !== 'blocked' && (
                      <button
                        onClick={() => handleBlockDevice(device.deviceId)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                      >
                        Block
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveDevice(device.deviceId)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
                      style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Devices Tab */}
      {activeTab === 'new' && (
        <div className="space-y-3">
          {newDevices.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: '20px' }}>No new devices awaiting confirmation</p>
          ) : (
            newDevices.map((device) => (
              <div key={device.deviceId} className="p-4 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={18} style={{ color: '#fb923c' }} />
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, margin: 0 }}>
                          New {device.type}: {device.label}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>
                          {device.browser} • {device.email}
                        </p>
                      </div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Detected:</span> {formatDate(device.registeredAt)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleConfirmDevice(device.deviceId)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleRemoveDevice(device.deviceId)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Suspicious Activity Tab */}
      {activeTab === 'suspicious' && (
        <div className="space-y-3">
          {suspiciousActivity.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: '20px' }}>No suspicious activity detected</p>
          ) : (
            suspiciousActivity.map((activity, idx) => (
              <div key={idx} className="p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, margin: 0 }}>
                          {activity.reason.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>
                          {activity.email} • {activity.device?.label}
                        </p>
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '8px 0 0' }}>
                      {activity.details}
                    </p>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 6 }}>
                      <Clock size={10} className="inline mr-1" />
                      {formatDate(activity.flaggedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveSuspicious(idx)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ml-4"
                    style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {deviceActivity.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: '20px' }}>No activity logged</p>
          ) : (
            deviceActivity.map((entry, idx) => (
              <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {entry.action.includes('confirmed') ? (
                      <CheckCircle size={14} style={{ color: '#10b981' }} />
                    ) : entry.action.includes('blocked') ? (
                      <MonitorX size={14} style={{ color: '#ef4444' }} />
                    ) : (
                      <Shield size={14} style={{ color: '#3b82f6' }} />
                    )}
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>
                      {entry.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  <p style={{ margin: 0 }}>Email: {entry.email}</p>
                  {entry.device && <p style={{ margin: 0 }}>Device: {entry.device.label} ({entry.device.type})</p>}
                  {entry.details && <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)' }}>{entry.details}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}