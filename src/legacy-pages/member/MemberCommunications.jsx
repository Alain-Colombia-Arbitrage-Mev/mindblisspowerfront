import { useState, useEffect, useMemo, useCallback } from 'react';
import { Mail, Send, Users, Radio, X, Loader2, CheckCheck, Check, Clock, Filter, Search, Archive, TrendingUp, Zap, Eye } from 'lucide-react';
import platformDataCore from '@/lib/platformDataCore';
import { getAllDescendants } from '@/lib/warRoomDataAdapter';
import { motion } from 'framer-motion';

// Initialize messaging system
if (!platformDataCore.messages) {
  platformDataCore.messages = [];
}
if (!platformDataCore.campaigns) {
  platformDataCore.campaigns = [];
}
if (!platformDataCore.unread_notifications) {
  platformDataCore.unread_notifications = {};
}

const BROADCAST_OPTIONS = [
  { label: 'Por Rango', field: 'rank', values: ['E. Corona', 'Diamante Negro', 'Diamante Azul', 'Diamante', 'Platino', 'Oro', 'Plata', 'Bronce', 'Principiante'] },
  { label: 'Por Estado', field: 'status', values: ['activo', 'inactivo'] },
  { label: 'Por Lado', field: 'binary_side', values: ['left', 'right'], labels: ['Izquierda', 'Derecha'] },
  { label: 'Por Generación', field: 'generation', values: ['1', '2', '3', '4', '5', '6', '7', '8'] },
];

export default function MemberCommunications() {
  const userId = localStorage.getItem('user_id');
  const [activeTab, setActiveTab] = useState('inbox');
  const [teamMembers, setTeamMembers] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState({ field: 'rank', value: 'Platino' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [preloadedRecipient, setPreloadedRecipient] = useState(null);

  // Load team data
  useEffect(() => {
    const descendants = getAllDescendants(userId, platformDataCore.network_nodes, platformDataCore.users);
    setTeamMembers(descendants);
  }, [userId]);

  // Check for preloaded recipient from team module
  useEffect(() => {
    const preloaded = sessionStorage.getItem('preloaded_recipient');
    if (preloaded) {
      setPreloadedRecipient(JSON.parse(preloaded));
      setSelectedRecipients([JSON.parse(preloaded).id]);
      sessionStorage.removeItem('preloaded_recipient');
    }
  }, []);

  // Get messages for current tab with filtering
  const messages = useMemo(() => {
    let result = [];
    
    if (activeTab === 'inbox') {
      result = platformDataCore.messages.filter(m => 
        m.receiver_ids.includes(userId) && m.type !== 'broadcast'
      );
    } else if (activeTab === 'enviados') {
      result = platformDataCore.messages.filter(m => 
        m.sender_id === userId && m.type !== 'broadcast'
      );
    } else {
      result = platformDataCore.campaigns;
    }

    // Apply filters
    if (searchTerm && activeTab !== 'campanas') {
      result = result.filter(m => 
        m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platformDataCore.users.find(u => u.id === m.sender_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeTab === 'campanas' && searchTerm) {
      result = result.filter(c => 
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.target_group.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [activeTab, userId, searchTerm]);

  // Send direct/group message
  const handleSendMessage = async () => {
    if (!selectedRecipients.length || !messageSubject || !messageBody) return;

    setSendingMessage(true);

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender_id: userId,
      receiver_ids: selectedRecipients,
      type: selectedRecipients.length === 1 ? 'direct' : 'group',
      subject: messageSubject,
      body: messageBody,
      created_at: new Date().toISOString(),
      status: 'sent',
      read_by: [],
    };

    platformDataCore.messages.push(newMessage);

    // Mark receivers as having unread messages
    selectedRecipients.forEach(recipientId => {
      if (!platformDataCore.unread_notifications[recipientId]) {
        platformDataCore.unread_notifications[recipientId] = 0;
      }
      platformDataCore.unread_notifications[recipientId]++;
    });

    // Simulate delivery
    setTimeout(() => {
      const idx = platformDataCore.messages.findIndex(m => m.id === newMessage.id);
      if (idx >= 0) {
        platformDataCore.messages[idx].status = 'delivered';
      }
    }, 1000);

    // Simulate read
    setTimeout(() => {
      const idx = platformDataCore.messages.findIndex(m => m.id === newMessage.id);
      if (idx >= 0) {
        platformDataCore.messages[idx].status = 'read';
        platformDataCore.messages[idx].read_by = selectedRecipients;
        selectedRecipients.forEach(recipientId => {
          platformDataCore.unread_notifications[recipientId] = Math.max(0, (platformDataCore.unread_notifications[recipientId] || 1) - 1);
        });
      }
    }, 2500);

    setSendingMessage(false);
    setMessageSubject('');
    setMessageBody('');
    setSelectedRecipients([]);
    setShowMessageModal(false);
  };

  // Send campaign
  const handleSendBroadcast = async () => {
    if (!messageSubject || !messageBody) return;

    setSendingMessage(true);

    const targetField = broadcastTarget.field;
    const targetValue = broadcastTarget.value;

    // Find all members matching criteria
    const broadcastReceivers = teamMembers
      .filter(member => String(member[targetField]) === String(targetValue))
      .map(m => m.id);

    if (broadcastReceivers.length === 0) {
      setSendingMessage(false);
      return;
    }

    const newCampaign = {
      id: `campaign-${Date.now()}`,
      sender_id: userId,
      receiver_ids: broadcastReceivers,
      type: 'broadcast',
      subject: messageSubject,
      body: messageBody,
      target_group: `${targetField === 'binary_side' ? 'Lado' : targetField}: ${targetValue}`,
      created_at: new Date().toISOString(),
      status: 'sent',
      delivery_count: 0,
      read_count: 0,
      delivery_percent: 0,
      read_percent: 0,
    };

    platformDataCore.campaigns.push(newCampaign);

    // Mark receivers as unread
    broadcastReceivers.forEach(recipientId => {
      if (!platformDataCore.unread_notifications[recipientId]) {
        platformDataCore.unread_notifications[recipientId] = 0;
      }
      platformDataCore.unread_notifications[recipientId]++;
    });

    // Simulate delivery
    setTimeout(() => {
      const idx = platformDataCore.campaigns.findIndex(c => c.id === newCampaign.id);
      if (idx >= 0) {
        platformDataCore.campaigns[idx].status = 'delivered';
        platformDataCore.campaigns[idx].delivery_count = Math.floor(broadcastReceivers.length * 0.95);
        platformDataCore.campaigns[idx].delivery_percent = 95;
      }
    }, 1200);

    // Simulate read
    setTimeout(() => {
      const idx = platformDataCore.campaigns.findIndex(c => c.id === newCampaign.id);
      if (idx >= 0) {
        platformDataCore.campaigns[idx].status = 'read';
        platformDataCore.campaigns[idx].read_count = Math.floor(broadcastReceivers.length * 0.68);
        platformDataCore.campaigns[idx].read_percent = 68;
        broadcastReceivers.forEach(recipientId => {
          platformDataCore.unread_notifications[recipientId] = Math.max(0, (platformDataCore.unread_notifications[recipientId] || 1) - 1);
        });
      }
    }, 3000);

    setSendingMessage(false);
    setMessageSubject('');
    setMessageBody('');
    setShowBroadcastModal(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check size={14} style={{ color: '#9ca3af' }} />;
      case 'delivered':
        return <CheckCheck size={14} style={{ color: '#fb923c' }} />;
      case 'read':
        return <CheckCheck size={14} style={{ color: '#3b82f6' }} />;
      default:
        return <Clock size={14} style={{ color: '#9ca3af' }} />;
    }
  };

  const unreadCount = platformDataCore.messages.filter(m => 
    m.receiver_ids.includes(userId) && m.status !== 'read'
  ).length;

  // Open message modal with preselected recipient (from team)
  const openMessageToMember = (member) => {
    setSelectedRecipients([member.id]);
    setShowMessageModal(true);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#060e1c' }}>
      {/* HEADER */}
      <div className="flex-shrink-0 p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(4,10,22,0.95)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>Comunicaciones PRO</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0 0' }}>Sistema de mensajería integrado</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMessageModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <Mail size={14} /> Mensaje
            </button>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <Radio size={14} /> Campaña
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-4">
          {[
            { id: 'inbox', label: `Inbox ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
            { id: 'enviados', label: 'Enviados' },
            { id: 'campanas', label: 'Campañas' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: activeTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH & FILTER */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder={activeTab === 'campanas' ? 'Buscar campaña...' : 'Buscar mensaje...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-white placeholder-white/30"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
          </div>
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)' }}>
            <Mail size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No hay {activeTab === 'campanas' ? 'campañas' : 'mensajes'}</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const sender = platformDataCore.users.find(u => u.id === msg.sender_id);
            const recipientCount = msg.receiver_ids.length;
            const isRead = msg.status === 'read';
            const isCampaign = msg.type === 'broadcast' || msg.type === 'campaign';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedMessage(msg)}
                className="p-4 rounded-lg cursor-pointer transition-all"
                style={{
                  background: selectedMessage?.id === msg.id ? 'rgba(59,130,246,0.2)' : 'rgba(13,31,60,0.4)',
                  border: selectedMessage?.id === msg.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(59,130,246,0.15)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isCampaign && <Radio size={14} style={{ color: '#8b5cf6' }} />}
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>
                        {msg.subject}
                      </p>
                      {!isRead && activeTab === 'inbox' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '2px 0 0 0' }}>
                      {sender?.name} · {new Date(msg.created_at).toLocaleDateString()}
                      {isCampaign && msg.target_group && ` · ${msg.target_group}`}
                      {recipientCount > 1 && !isCampaign && ` · ${recipientCount} destinatarios`}
                    </p>
                    {isCampaign && (
                      <div className="flex gap-4 mt-2 text-xs">
                        <span style={{ color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Send size={11} /> {msg.delivery_count || 0} entregados ({msg.delivery_percent || 0}%)
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={11} /> {msg.read_count || 0} leídos ({msg.read_percent || 0}%)
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ marginLeft: 12 }}>
                    {getStatusIcon(msg.status)}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* MESSAGE DETAIL PANEL */}
      {selectedMessage && (
        <motion.div
          initial={{ y: 400 }}
          animate={{ y: 0 }}
          exit={{ y: 400 }}
          className="absolute bottom-0 left-0 right-0 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(4,10,22,0.95)', maxHeight: '45%' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 style={{ color: 'white', fontWeight: 700, margin: 0 }}>{selectedMessage.subject}</h3>
            <button onClick={() => setSelectedMessage(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          <div className="p-6 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100% - 56px)' }}>
            <div className="grid grid-cols-3 gap-4 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600, margin: 0 }}>DE</p>
                <p style={{ color: 'white', fontSize: 11, fontWeight: 600, margin: '2px 0 0 0' }}>
                  {platformDataCore.users.find(u => u.id === selectedMessage.sender_id)?.name}
                </p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600, margin: 0 }}>FECHA</p>
                <p style={{ color: 'white', fontSize: 11, fontWeight: 600, margin: '2px 0 0 0' }}>
                  {new Date(selectedMessage.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600, margin: 0 }}>ESTADO</p>
                <p style={{ color: selectedMessage.status === 'read' ? '#3b82f6' : '#fb923c', fontSize: 11, fontWeight: 600, margin: '2px 0 0 0' }}>
                  {selectedMessage.status === 'read' ? '✓✓ Leído' : selectedMessage.status === 'delivered' ? '✓✓ Entregado' : '✓ Enviado'}
                </p>
              </div>
            </div>
            <p style={{ color: 'white', fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
              {selectedMessage.body}
            </p>
          </div>
        </motion.div>
      )}

      {/* NEW MESSAGE MODAL */}
      {showMessageModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-slate-900 rounded-lg max-w-2xl w-full p-6 border"
            style={{ borderColor: 'rgba(59,130,246,0.3)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>Nuevo Mensaje</h2>
              <button onClick={() => {
                setShowMessageModal(false);
                setSelectedRecipients([]);
              }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* RECIPIENT SEARCH */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Destinatarios ({selectedRecipients.length})</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {teamMembers.map(member => (
                    <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded transition-all">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecipients([...selectedRecipients, member.id]);
                          } else {
                            setSelectedRecipients(selectedRecipients.filter(id => id !== member.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* SUBJECT */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Asunto</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Asunto del mensaje"
                  className="w-full px-3 py-2 rounded-lg text-white placeholder-white/30 text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              {/* BODY */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Mensaje</label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  rows="6"
                  className="w-full px-3 py-2 rounded-lg text-white placeholder-white/30 text-sm resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setSelectedRecipients([]);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!selectedRecipients.length || !messageSubject || !messageBody || sendingMessage}
                  className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
                  style={{
                    background: (selectedRecipients.length && messageSubject && messageBody) ? 'linear-gradient(135deg, #1d6ef5, #3b82f6)' : 'rgba(59,130,246,0.2)',
                    color: 'white',
                    opacity: (!selectedRecipients.length || !messageSubject || !messageBody || sendingMessage) ? 0.5 : 1,
                  }}
                >
                  {sendingMessage ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Enviar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-slate-900 rounded-lg max-w-2xl w-full p-6 border"
            style={{ borderColor: 'rgba(139,92,246,0.3)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>Campaña de Broadcast</h2>
              <button onClick={() => setShowBroadcastModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* BROADCAST TARGET */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Enviar a</label>
                <div className="grid grid-cols-2 gap-3">
                  {BROADCAST_OPTIONS.map(option => (
                    <div key={option.field}>
                      <select
                        value={broadcastTarget.field === option.field ? broadcastTarget.value : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setBroadcastTarget({ field: option.field, value: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{
                          background: broadcastTarget.field === option.field ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)',
                          color: 'white',
                          border: broadcastTarget.field === option.field ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.12)',
                        }}
                      >
                        <option value="">{option.label}</option>
                        {option.values.map((val, i) => (
                          <option key={val} value={val}>
                            {option.labels ? option.labels[i] : val}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                {broadcastTarget.value && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={12} />
                    {teamMembers.filter(m => String(m[broadcastTarget.field]) === String(broadcastTarget.value)).length} miembros serán alcanzados
                  </p>
                )}
              </div>

              {/* SUBJECT */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Asunto</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Asunto de la campaña"
                  className="w-full px-3 py-2 rounded-lg text-white placeholder-white/30 text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              {/* BODY */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Contenido</label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Contenido de la campaña..."
                  rows="6"
                  className="w-full px-3 py-2 rounded-lg text-white placeholder-white/30 text-sm resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendBroadcast}
                  disabled={!messageSubject || !messageBody || sendingMessage}
                  className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
                  style={{
                    background: (messageSubject && messageBody) ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'rgba(139,92,246,0.2)',
                    color: 'white',
                    opacity: (!messageSubject || !messageBody || sendingMessage) ? 0.5 : 1,
                  }}
                >
                  {sendingMessage ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                  Lanzar Campaña
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
