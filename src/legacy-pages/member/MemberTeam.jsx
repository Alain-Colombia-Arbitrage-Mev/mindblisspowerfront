import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Mail, CheckSquare, Star, Network, History, X, Send, Loader2, Flag, ArrowUpDown, AlertCircle, TrendingUp, Users, Eye } from 'lucide-react';
import platformDataCore from '@/lib/platformDataCore';
import BinaryNetworkSummaryEngine from '@/lib/BinaryNetworkSummaryEngine';
import { motion } from 'framer-motion';
import EnhancedTeamRow from '@/components/premium/EnhancedTeamRow';

// Enrich user data with missing fields
function enrichUserData(user) {
  return {
    ...user,
    email: user.email || `${user.name.toLowerCase().replace(/\s+/g, '.')}@vicion.com`,
    phone: user.phone || `+${['57', '52', '34', '55'][Math.floor(Math.random() * 4)]} ${Math.floor(Math.random() * 900000000 + 100000000)}`,
    country: user.country || ['Colombia', 'México', 'España'][Math.floor(Math.random() * 3)],
    status: user.status || (Math.random() > 0.2 ? 'activo' : 'inactivo'),
    last_activity: user.last_activity || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    binary_side: user.binary_side || (Math.random() > 0.5 ? 'left' : 'right'),
    generation: user.generation || Math.floor(Math.random() * 8) + 1,
    plan: user.plan || ['Básico', 'Profesional', 'Premium'][Math.floor(Math.random() * 3)],
  };
}

export default function MemberTeam() {
  const userId = localStorage.getItem('user_id');
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [enrichedMembers, setEnrichedMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, investment, generation
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [filters, setFilters] = useState({
    rank: null,
    status: null,
    binary_side: null,
    generation: null,
    plan: null,
  });
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const [sentMessages, setSentMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [tags, setTags] = useState({}); // { memberId: ['priority', 'follow', 'inactive'] }
  const [activeTab, setActiveTab] = useState('all'); // all, topPerformers, weakMembers

  // Load team data - SINGLE SOURCE OF TRUTH
  useEffect(() => {
    const engine = new BinaryNetworkSummaryEngine(platformDataCore);
    const summary = engine.getMemberNetworkSummary(userId);
    
    const descendants = platformDataCore.getDescendantsForLeader(userId);
    const enrichedDescendants = descendants
      .map(d => {
        const user = platformDataCore.getUserById(d.user_id);
        const memberships = platformDataCore.getMembershipsForUser(d.user_id);
        return enrichUserData({
          ...user,
          investment: memberships.reduce((sum, m) => sum + (m.amount || 0), 0),
          id: d.user_id,
          binary_side: d.binary_side,
        });
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    
    setTeamMembers(descendants);
    setEnrichedMembers(enrichedDescendants);
  }, [userId]);

  // Filter, search, and sort logic
  const processedMembers = useMemo(() => {
    let result = enrichedMembers.filter(member => {
      const matchesSearch = !searchTerm || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone && member.phone.includes(searchTerm));
      
      const matchesRank = !filters.rank || member.rank === filters.rank;
      const matchesStatus = !filters.status || member.status === filters.status;
      const matchesSide = !filters.binary_side || member.binary_side === filters.binary_side;
      const matchesGeneration = !filters.generation || member.generation === parseInt(filters.generation);
      const matchesPlan = !filters.plan || member.plan === filters.plan;
      
      return matchesSearch && matchesRank && matchesStatus && matchesSide && matchesGeneration && matchesPlan;
    });

    // Tab filtering
    if (activeTab === 'topPerformers') {
      result = result.sort((a, b) => (b.investment || 0) - (a.investment || 0)).slice(0, 10);
    } else if (activeTab === 'weakMembers') {
      result = result.filter(m => m.status === 'inactivo' || !m.last_activity);
    }

    // Sorting
    result = result.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'investment') {
        aVal = a.investment || 0;
        bVal = b.investment || 0;
      } else if (sortBy === 'generation') {
        aVal = a.generation || 999;
        bVal = b.generation || 999;
      } else {
        aVal = a.name;
        bVal = b.name;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [enrichedMembers, searchTerm, filters, activeTab, sortBy, sortOrder]);

  // Tag management
  const toggleTag = useCallback((memberId, tag) => {
    setTags(prev => {
      const memberTags = prev[memberId] || [];
      const newTags = memberTags.includes(tag) 
        ? memberTags.filter(t => t !== tag)
        : [...memberTags, tag];
      return { ...prev, [memberId]: newTags };
    });
  }, []);

  // Action handlers
  const handleSendMessage = async (memberIdToMessage) => {
    setSendingMessage(true);
    await new Promise(r => setTimeout(r, 800));
    setSentMessages([...sentMessages, { memberId: memberIdToMessage, content: messageContent, timestamp: new Date() }]);
    setMessageContent('');
    setSendingMessage(false);
  };

  const handleBulkMessage = async () => {
    if (!messageContent || selectedMembers.length === 0) return;
    setSendingMessage(true);
    await new Promise(r => setTimeout(r, 800));
    selectedMembers.forEach(memberId => {
      setSentMessages(prev => [...prev, { memberId, content: messageContent, timestamp: new Date() }]);
    });
    setMessageContent('');
    setSelectedMembers([]);
    setShowMessagePanel(false);
    setSendingMessage(false);
  };

  const statusColor = (status) => status === 'activo' ? 'var(--vp-accent)' : 'var(--vp-subtle)';
  const sideColor = (side) => side === 'left' ? 'var(--vp-accent)' : 'var(--vp-amber)';

  // Get tag color
  const getTagColor = (tag) => {
    if (tag === 'priority') return { bg: 'var(--vp-amber-muted)', text: 'var(--vp-amber)', border: 'var(--vp-amber-border)' };
    if (tag === 'follow') return { bg: 'var(--vp-accent-muted)', text: 'var(--vp-accent)', border: 'var(--vp-accent-border)' };
    if (tag === 'inactive') return { bg: 'var(--vp-danger-muted)', text: 'var(--vp-danger)', border: 'var(--vp-danger-border)' };
    return { bg: 'var(--vp-surface-raised)', text: 'var(--vp-muted)', border: 'var(--vp-border)' };
  };

  if (enrichedMembers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <Network size={48} style={{ color: 'var(--vp-subtle)', margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--vp-text)', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>Aún no tienes red activa</h3>
          <p style={{ color: 'var(--vp-muted)', fontSize: 13 }}>Invita a tus primeros miembros para activar tu equipo.</p>
        </div>
      </div>
    );
  }

  // Activity detection
  const isRecentlyActive = (lastActivity) => {
    if (!lastActivity) return false;
    const days = (new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24);
    return days < 7;
  };

  return (
    <div className="h-full flex overflow-hidden" style={{ background: 'var(--vp-bg)' }}>
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-shell)' }}>
          {/* Title row */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p style={{ color: 'var(--vp-accent)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px 0' }}>
                Operaciones · Equipo Pro
              </p>
              <h1 style={{ color: 'var(--vp-text)', fontSize: 24, fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Mi Equipo</h1>
              <p style={{ color: 'var(--vp-muted)', fontSize: 11, margin: 0 }}>
                {processedMembers.length} de {enrichedMembers.length} miembros · Red binaria activa
              </p>
            </div>
            <button
              onClick={() => setShowMessagePanel(true)}
              disabled={selectedMembers.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: selectedMembers.length > 0 ? 'pointer' : 'not-allowed',
                background: selectedMembers.length > 0 ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)',
                color: selectedMembers.length > 0 ? 'var(--vp-accent)' : 'var(--vp-subtle)',
                border: `1px solid ${selectedMembers.length > 0 ? 'var(--vp-accent-border)' : 'var(--vp-border)'}`,
                transition: 'all 150ms ease',
              }}
            >
              <Mail size={12} /> Comunicar {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
            </button>
          </div>

          {/* TABS — premium restrained */}
          <div style={{ display: 'flex', gap: 4, padding: '3px', background: 'var(--vp-surface-raised)', borderRadius: 10, marginBottom: 14, border: '1px solid var(--vp-border)', width: 'fit-content' }}>
            {[
              { id: 'all', label: 'Todos', icon: Users },
              { id: 'topPerformers', label: 'Top 10', icon: TrendingUp },
              { id: 'weakMembers', label: 'Sin Actividad', icon: AlertCircle },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 14px', borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  background: activeTab === tab.id ? 'var(--vp-accent-muted)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--vp-accent)' : 'var(--vp-muted)',
                  border: activeTab === tab.id ? '1px solid var(--vp-accent-border)' : '1px solid transparent',
                  transition: 'all 150ms ease',
                }}
              >
                <tab.icon size={10} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* SEARCH anchor */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--vp-subtle)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 9, paddingBottom: 9,
                borderRadius: 10, fontSize: 11, color: 'var(--vp-text)', background: 'var(--vp-surface)',
                border: '1px solid var(--vp-border)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* FILTERS + SORT — unified row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { key: 'status', label: 'Estado', options: ['activo', 'inactivo'] },
              { key: 'binary_side', label: 'Lado', options: ['left', 'right'], labels: ['Izq', 'Der'] },
              { key: 'generation', label: 'Gen', options: ['1','2','3','4','5','6','7','8'] },
              { key: 'plan', label: 'Plan', options: ['Básico','Profesional','Premium'] },
            ].map(fg => (
              <select
                key={fg.key}
                value={filters[fg.key] || ''}
                onChange={(e) => setFilters({ ...filters, [fg.key]: e.target.value || null })}
                style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: 'var(--vp-surface)', color: filters[fg.key] ? 'var(--vp-accent)' : 'var(--vp-muted)', border: `1px solid ${filters[fg.key] ? 'var(--vp-accent-border)' : 'var(--vp-border)'}`, cursor: 'pointer' }}
              >
                <option value="">{fg.label}</option>
                {fg.options.map((opt, i) => <option key={opt} value={opt}>{fg.labels ? fg.labels[i] : opt}</option>)}
              </select>
            ))}
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: 'var(--vp-surface)', color: 'var(--vp-muted)', border: '1px solid var(--vp-border)', cursor: 'pointer' }}>
                <option value="name">Nombre</option>
                <option value="investment">Inversión</option>
                <option value="generation">Generación</option>
              </select>
              <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', color: 'var(--vp-muted)', cursor: 'pointer' }}>
                <ArrowUpDown size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* TEAM LIST - ENHANCED */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {processedMembers.length > 0 ? (
            processedMembers.map((member) => (
              <div key={member.id}>
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMembers([...selectedMembers, member.id]);
                    } else {
                      setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                    }
                  }}
                  style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                  id={`member-${member.id}`}
                />
                <label htmlFor={`member-${member.id}`} style={{ display: 'block', cursor: 'pointer' }}>
                  <EnhancedTeamRow
                    member={member}
                    isSelected={selectedMembers.includes(member.id)}
                    onMessage={(m) => {
                      sessionStorage.setItem('preloaded_recipient', JSON.stringify(m));
                      navigate('/dashboard/communications');
                    }}
                    onContact={(m) => alert(`Llamar a ${m.name}: ${m.phone}`)}
                    onView={(m) => setSelectedMember(m)}
                  />
                </label>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--vp-muted)', textAlign: 'center', paddingTop: 32 }}>
              Sin resultados
            </p>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - MEMBER PROFILE */}
      {selectedMember && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          className="w-96 border-l flex flex-col overflow-hidden"
          style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-shell)' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--vp-border)' }}>
            <div>
              <h3 style={{ color: 'var(--vp-text)', fontWeight: 700, margin: 0, fontSize: 13 }}>Miembro</h3>
              <p style={{ color: 'var(--vp-muted)', fontSize: 9, margin: '2px 0 0 0' }}>Gen {selectedMember.generation} · {selectedMember.binary_side === 'left' ? '← Izq' : '→ Der'}</p>
            </div>
            <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', color: 'var(--vp-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* PROFILE */}
            <div>
              <h4 style={{ color: 'var(--vp-text)', fontSize: 16, fontWeight: 900, margin: '0 0 8px 0' }}>
                {selectedMember.name}
              </h4>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <span style={{ background: 'var(--vp-accent-muted)', color: 'var(--vp-accent)', padding: '3px 10px', borderRadius: 7, fontSize: 9, fontWeight: 700, border: '1px solid var(--vp-accent-border)' }}>
                  {selectedMember.rank || 'Miembro'}
                </span>
                <span style={{ background: selectedMember.status === 'activo' ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)', color: statusColor(selectedMember.status), padding: '3px 10px', borderRadius: 7, fontSize: 9, fontWeight: 700, border: `1px solid ${selectedMember.status === 'activo' ? 'var(--vp-accent-border)' : 'var(--vp-border)'}` }}>
                  {selectedMember.status === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {[
                { label: 'País', value: selectedMember.country },
                { label: 'Email', value: selectedMember.email },
                { label: 'Teléfono', value: selectedMember.phone },
                { label: 'Plan', value: selectedMember.plan },
              ].map((item, i) => (
                <div key={i} className="pb-3" style={{ borderBottom: '1px solid var(--vp-border)' }}>
                  <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 600, margin: 0 }}>
                    {item.label}
                  </p>
                  <p style={{ color: 'var(--vp-text)', fontSize: 11, fontWeight: 600, margin: '2px 0 0 0' }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* FINANCIAL */}
            <div>
              <p style={{ color: 'var(--vp-subtle)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
                FINANCIERO
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Inversión', value: `$${(selectedMember.investment || 0).toLocaleString()}`, color: 'var(--vp-accent)' },
                  { label: 'Plan Actual', value: selectedMember.plan, color: 'var(--vp-text-soft)' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
                    <span style={{ color: 'var(--vp-muted)', fontSize: 10 }}>{stat.label}</span>
                    <span style={{ color: stat.color, fontSize: 11, fontWeight: 700 }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NETWORK */}
            <div>
              <p style={{ color: 'var(--vp-subtle)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
                RED
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Generación', value: selectedMember.generation, color: 'var(--vp-amber)' },
                  { label: 'Lado', value: selectedMember.binary_side === 'left' ? 'Izquierda' : 'Derecha', color: sideColor(selectedMember.binary_side) },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
                    <span style={{ color: 'var(--vp-muted)', fontSize: 10 }}>{stat.label}</span>
                    <span style={{ color: stat.color, fontSize: 11, fontWeight: 700 }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTIVIDAD */}
            <div>
              <p style={{ color: 'var(--vp-subtle)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
                ACTIVIDAD
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
                  <span style={{ color: 'var(--vp-muted)', fontSize: 10 }}>Último acceso</span>
                  <span style={{ color: 'var(--vp-text-soft)', fontSize: 10, fontWeight: 600 }}>
                    {new Date(selectedMember.last_activity).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* TAGS */}
            <div>
              <p style={{ color: 'var(--vp-subtle)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
                ETIQUETAS
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['priority', 'follow', 'inactive'].map(tag => {
                  const colors = getTagColor(tag);
                  const isActive = tags[selectedMember.id]?.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(selectedMember.id, tag)}
                      style={{
                        background: isActive ? colors.bg : 'var(--vp-surface-raised)',
                        color: isActive ? colors.text : 'var(--vp-muted)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 9,
                        fontWeight: 600,
                        border: `1px solid ${isActive ? colors.border : 'var(--vp-border)'}`,
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                      }}
                    >
                      {tag === 'priority' ? 'Prioridad' : tag === 'follow' ? 'Seguimiento' : 'Inactivo'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--vp-border)' }}>
            <button
              onClick={() => {
                // Store selected member in session and redirect to communications
                sessionStorage.setItem('preloaded_recipient', JSON.stringify(selectedMember));
                navigate('/dashboard/communications');
              }}
              className="w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
              style={{ background: 'var(--vp-accent-muted)', color: 'var(--vp-accent)', border: '1px solid var(--vp-accent-border)' }}
            >
              <Mail size={12} /> Enviar Mensaje
            </button>
            <button
              onClick={() => navigate('/dashboard/network')}
              className="w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
              style={{ background: 'var(--vp-amber-muted)', color: 'var(--vp-amber)', border: '1px solid var(--vp-amber-border)' }}
            >
              <Network size={12} /> Ver Su Red
            </button>
            <button
              onClick={() => alert(`Historial de ${selectedMember.name}`)}
              className="w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
              style={{ background: 'var(--vp-surface-raised)', color: 'var(--vp-text-soft)', border: '1px solid var(--vp-border)' }}
            >
              <History size={12} /> Historial
            </button>
          </div>
        </motion.div>
      )}

      {/* MESSAGE PANEL */}
      {showMessagePanel && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          className="w-80 border-l flex flex-col overflow-hidden"
          style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-shell)' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--vp-border)' }}>
            <h3 style={{ color: 'var(--vp-text)', fontWeight: 700, margin: 0 }}>Comunicación Masiva</h3>
            <button onClick={() => setShowMessagePanel(false)} style={{ background: 'none', border: 'none', color: 'var(--vp-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <p style={{ color: 'var(--vp-muted)', fontSize: 12, fontWeight: 600, margin: '0 0 8px 0' }}>
                Destinatarios seleccionados: {selectedMembers.length}
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {selectedMembers.map(memberId => {
                  const member = enrichedMembers.find(m => m.id === memberId);
                  return member ? (
                    <p key={memberId} style={{ color: 'var(--vp-text-soft)', fontSize: 11 }}>• {member.name}</p>
                  ) : null;
                })}
              </div>
            </div>

            <div>
              <p style={{ color: 'var(--vp-muted)', fontSize: 12, fontWeight: 600, margin: '0 0 8px 0' }}>Mensaje</p>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="w-full p-3 rounded-lg text-sm resize-none"
                rows="6"
                style={{ background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', color: 'var(--vp-text)' }}
              />
            </div>
          </div>

          <div className="p-4 border-t" style={{ borderColor: 'var(--vp-border)' }}>
            <button
              onClick={handleBulkMessage}
              disabled={!messageContent || selectedMembers.length === 0 || sendingMessage}
              className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: (messageContent && selectedMembers.length > 0) ? 'var(--vp-accent)' : 'var(--vp-accent-muted)',
                color: (messageContent && selectedMembers.length > 0) ? '#06110f' : 'var(--vp-accent)',
                border: '1px solid var(--vp-accent-border)',
                opacity: (!messageContent || selectedMembers.length === 0 || sendingMessage) ? 0.5 : 1,
              }}
            >
              {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar a {selectedMembers.length} miembro{selectedMembers.length !== 1 ? 's' : ''}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
