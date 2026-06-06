/**
 * VICION AI Brain — Internal Operations Intelligence
 * Admin-only. Reads simulated platform data. Updates on simulation tick.
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/lib/SimulationEngine';
import {
  generateExecutiveInsights, generateRisks, generateGrowthOpportunities,
  generateLeaderIntelligence, generateConversionIntelligence, generatePaymentIntelligence,
  generateCRMPriority, generateSupportPriority, generateMarketingRecommendations,
  generateActionQueue
} from '@/lib/aiBrain';
import {
  Brain, ShieldAlert, TrendingUp, Users, BarChart3, CreditCard,
  BookOpen, Headphones, Zap, ListChecks, ChevronRight, Info,
  Lightbulb, AlertTriangle, Activity, ArrowUpRight
} from 'lucide-react';

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const MODULES = [
  { id:'insights',    label:'Executive Insights',       icon:Brain,       color:'#3b82f6', badge: null },
  { id:'actions',     label:'Action Queue',              icon:ListChecks,  color:'#ef4444', badge: 'critical' },
  { id:'risks',       label:'Risk Detection',            icon:ShieldAlert, color:'#ef4444', badge: null },
  { id:'growth',      label:'Growth Opportunities',      icon:TrendingUp,  color:'#10b981', badge: null },
  { id:'leaders',     label:'Leader Intelligence',       icon:Users,       color:'#8b5cf6', badge: null },
  { id:'conversion',  label:'Conversion Intelligence',   icon:BarChart3,   color:'#fb923c', badge: null },
  { id:'payments',    label:'Payment Intelligence',      icon:CreditCard,  color:'#06b6d4', badge: null },
  { id:'crm',         label:'CRM Prioritization',        icon:BookOpen,    color:'#a855f7', badge: null },
  { id:'support',     label:'Support Prioritization',    icon:Headphones,  color:'#f59e0b', badge: null },
  { id:'marketing',   label:'Marketing Recommendations', icon:Zap,         color:'#22d3ee', badge: null },
];

const TYPE_ICON  = { info:Info, warning:AlertTriangle, critical:ShieldAlert, opportunity:Lightbulb };
const TYPE_COLOR = { info:'#3b82f6', warning:'#fb923c', critical:'#ef4444', opportunity:'#10b981' };
const SEV_COLOR  = { critical:'#ef4444', high:'#fb923c', medium:'#f59e0b', low:'#6b7280' };
const SIG_COLOR  = { critical:'#ef4444', suspended:'#ef4444', warning:'#fb923c', declining:'#f59e0b', paused:'#a855f7', pending:'#06b6d4', stable:'#6b7280', high_growth:'#10b981', excellent:'#8b5cf6' };
const SIG_LABEL  = { critical:'Critical', suspended:'Suspended', warning:'Under Review', declining:'Declining', paused:'Paused', pending:'Pending Cert.', stable:'Stable', high_growth:'High Growth', excellent:'Excellent' };

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────

function SevBadge({ sev }) {
  const c = SEV_COLOR[sev] || '#888';
  return <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background:`${c}18`, color:c }}>{sev.toUpperCase()}</span>;
}

function AreaTag({ area }) {
  return <span style={{ color:'rgba(255,255,255,0.35)', fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>{area}</span>;
}

function ActionRow({ children }) {
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <ChevronRight size={10} style={{ color:'rgba(255,255,255,0.3)' }} />
      <span style={{ color:'rgba(255,255,255,0.55)', fontSize:10, lineHeight:1.4 }}>{children}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'0' }} />;
}

// ─── MODULE RENDERERS ────────────────────────────────────────────────────────

function InsightsPanel({ data }) {
  return (
    <div className="divide-y" style={{ borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)', background:'rgba(8,16,36,0.6)', divideColor:'rgba(255,255,255,0.05)' }}>
      {data.map((ins, i) => {
        const Icon = TYPE_ICON[ins.type] || Info;
        const color = TYPE_COLOR[ins.type] || '#3b82f6';
        return (
          <div key={i} className="flex gap-3 p-4" style={{ background: i===0?`${color}07`:'transparent', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background:`${color}15` }}>
              <Icon size={13} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <AreaTag area={ins.area} />
                <span className="px-1.5 py-0.5 rounded text-xs" style={{ background:`${color}15`, color, fontSize:9, fontWeight:700 }}>{ins.type.toUpperCase()}</span>
              </div>
              <p style={{ color:'rgba(255,255,255,0.82)', fontSize:12, margin:0, lineHeight:1.65 }}>{ins.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RisksPanel({ data }) {
  return (
    <div className="space-y-2">
      {data.map((r, i) => {
        const c = SEV_COLOR[r.severity] || '#888';
        return (
          <div key={i} className="p-4 rounded-xl" style={{ background:`${c}07`, border:`1px solid ${c}20` }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:`${c}15` }}>
                <ShieldAlert size={13} style={{ color:c }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <SevBadge sev={r.severity} />
                  <AreaTag area={r.area} />
                  <span style={{ color:'rgba(255,255,255,0.2)', fontSize:9 }}>{r.id}</span>
                </div>
                <p style={{ color:'white', fontWeight:700, fontSize:12, margin:'0 0 4px' }}>{r.title}</p>
                <p style={{ color:'rgba(255,255,255,0.52)', fontSize:11, margin:0, lineHeight:1.6 }}>{r.detail}</p>
                <ActionRow>{r.action}</ActionRow>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GrowthPanel({ data }) {
  return (
    <div className="space-y-2">
      {data.map((o, i) => (
        <div key={i} className="p-4 rounded-xl" style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.15)' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'rgba(16,185,129,0.15)' }}>
              <Lightbulb size={13} style={{ color:'#10b981' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background:'rgba(16,185,129,0.15)', color:'#10b981' }}>{o.confidence}% confidence</span>
                <AreaTag area={o.area} />
                <span style={{ color:'#8b5cf6', fontSize:9, fontWeight:700 }}>{o.module}</span>
                <span style={{ color:'rgba(255,255,255,0.2)', fontSize:9 }}>{o.id}</span>
              </div>
              <p style={{ color:'white', fontWeight:700, fontSize:12, margin:'0 0 4px' }}>{o.title}</p>
              <p style={{ color:'rgba(255,255,255,0.52)', fontSize:11, margin:0, lineHeight:1.6 }}>{o.detail}</p>
              <ActionRow>{o.action}</ActionRow>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadersPanel({ data }) {
  const [sort, setSort] = useState('signal');
  const sorted = useMemo(() => [...data].sort((a,b) => {
    if (sort==='network') return b.network - a.network;
    if (sort==='compliance') return b.compliance - a.compliance;
    if (sort==='violations') return b.violations - a.violations;
    const o = { critical:0,suspended:1,warning:2,declining:3,pending:4,paused:5,stable:6,high_growth:7,excellent:8 };
    return (o[a.signal]??9)-(o[b.signal]??9);
  }), [data, sort]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span style={{ color:'rgba(255,255,255,0.3)', fontSize:10 }}>Sort:</span>
        {[['signal','Risk Signal'],['network','Network Size'],['compliance','Compliance'],['violations','Violations']].map(([k,l])=>(
          <button key={k} onClick={()=>setSort(k)} className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
            style={{ background:sort===k?'rgba(139,92,246,0.2)':'rgba(255,255,255,0.04)', color:sort===k?'#a855f7':'rgba(255,255,255,0.4)', border:`1px solid ${sort===k?'rgba(139,92,246,0.3)':'rgba(255,255,255,0.07)'}` }}>
            {l}
          </button>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)', background:'rgba(8,16,36,0.6)' }}>
        <table className="w-full text-xs">
          <thead style={{ background:'rgba(0,0,0,0.3)' }}>
            <tr>{['Leader','Region','Network','Growth','Compliance','Refs→Conv%','Violations','Signal','Intelligence Note'].map(h=>(
              <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color:'rgba(255,255,255,0.3)', fontSize:9, whiteSpace:'nowrap' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {sorted.map((l,i)=>{
              const sc = SIG_COLOR[l.signal]||'#888';
              return (
                <tr key={i} style={{ borderTop:'1px solid rgba(255,255,255,0.04)', background:['critical','suspended'].includes(l.signal)?'rgba(239,68,68,0.03)':l.signal==='high_growth'?'rgba(16,185,129,0.02)':'transparent' }}>
                  <td className="px-3 py-2.5"><p style={{color:'white',fontWeight:700,margin:0}}>{l.name}</p></td>
                  <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded font-bold" style={{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.6)',fontSize:10}}>{l.country}</span></td>
                  <td className="px-3 py-2.5" style={{color:'#3b82f6',fontWeight:800}}>{l.network}</td>
                  <td className="px-3 py-2.5" style={{color:l.growth?.startsWith('+')?'#10b981':'#ef4444',fontWeight:700}}>{l.growth||'—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1.5 rounded-full" style={{background:'rgba(255,255,255,0.08)'}}>
                        <div className="h-full rounded-full" style={{width:`${l.compliance}%`,background:l.compliance>=80?'#10b981':l.compliance>=65?'#fb923c':'#ef4444'}}/>
                      </div>
                      <span style={{color:'rgba(255,255,255,0.6)',fontWeight:700}}>{l.compliance}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span style={{color:'#8b5cf6',fontWeight:700}}>{l.refTotal}</span>
                    <span style={{color:'rgba(255,255,255,0.3)'}}> → </span>
                    <span style={{color:l.convRate>=70?'#10b981':l.convRate>=50?'#fb923c':'#ef4444',fontWeight:700}}>{l.convRate}%</span>
                  </td>
                  <td className="px-3 py-2.5" style={{color:l.violations>=3?'#ef4444':l.violations>0?'#fb923c':'rgba(255,255,255,0.4)',fontWeight:l.violations>=3?800:400}}>{l.violations}</td>
                  <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded font-bold text-xs" style={{background:`${sc}18`,color:sc}}>{SIG_LABEL[l.signal]||l.signal}</span></td>
                  <td className="px-3 py-2.5" style={{color:'rgba(255,255,255,0.45)',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:10}}>{l.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConversionPanel({ data }) {
  const { convRanked, planRanked, dropOffStages, stallPriority } = data;
  return (
    <div className="space-y-5">
      <div>
        <p style={{color:'rgba(255,255,255,0.2)',fontSize:8,fontWeight:800,letterSpacing:'0.2em',margin:'0 0 10px'}}>INVESTOR CONVERSION RATE BY SOURCE</p>
        <div className="space-y-2">
          {convRanked.map((s,i)=>(
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color:'rgba(255,255,255,0.35)',fontSize:10,fontWeight:800,minWidth:16}}>#{i+1}</span>
              <span style={{color:'white',fontSize:11,fontWeight:600,minWidth:90}}>{s.source}</span>
              <div className="flex-1 h-2 rounded-full" style={{background:'rgba(255,255,255,0.06)'}}>
                <div className="h-full rounded-full transition-all" style={{width:`${s.conversionRate}%`,background:s.conversionRate>=75?'#10b981':s.conversionRate>=55?'#fb923c':'#ef4444'}}/>
              </div>
              <span style={{color:s.conversionRate>=75?'#10b981':s.conversionRate>=55?'#fb923c':'#ef4444',fontWeight:800,fontSize:12,minWidth:36}}>{s.conversionRate}%</span>
              <span style={{color:'rgba(255,255,255,0.3)',fontSize:10,minWidth:80}}>{s.investors}/{s.total} investors</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p style={{color:'rgba(255,255,255,0.2)',fontSize:8,fontWeight:800,letterSpacing:'0.2em',margin:'0 0 10px'}}>PLAN TIER CONVERSION — RANKED BY ACTIVATION RATE</p>
        <div className="rounded-xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.07)',background:'rgba(8,16,36,0.5)'}}>
          {planRanked.map((pl,i)=>(
            <div key={i} className="flex items-center justify-between px-4 py-2.5" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div className="flex items-center gap-2.5">
                <span style={{color:i===0?'#fb923c':'rgba(255,255,255,0.25)',fontWeight:800,fontSize:11}}>#{i+1}</span>
                <p style={{color:'white',fontWeight:600,fontSize:12,margin:0}}>{pl.plan}</p>
                <span style={{color:'rgba(255,255,255,0.3)',fontSize:9}}>{pl.category}</span>
              </div>
              <div className="flex items-center gap-5 text-xs">
                <span style={{color:'#10b981',fontWeight:800}}>{pl.convRate}% active</span>
                <span style={{color:'rgba(255,255,255,0.4)'}}>{pl.active}/{pl.total} participants</span>
                <span style={{color:'#3b82f6',fontWeight:600}}>${(pl.volume/1000).toFixed(0)}K vol.</span>
                <span style={{color:'#8b5cf6'}}>{pl.avgReferrals} avg refs</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p style={{color:'rgba(255,255,255,0.2)',fontSize:8,fontWeight:800,letterSpacing:'0.2em',margin:'0 0 10px'}}>FUNNEL DROP-OFF ANALYSIS</p>
        <div className="space-y-2">
          {dropOffStages.map((d,i)=>(
            <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{background:d.count>3?'rgba(239,68,68,0.05)':'rgba(255,255,255,0.02)',border:`1px solid ${d.count>3?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.05)'}`}}>
              <span style={{color:'rgba(255,255,255,0.65)',fontSize:11,fontWeight:600}}>{d.stage}</span>
              <div className="flex items-center gap-3">
                <span style={{color:d.count>3?'#ef4444':d.count>1?'#fb923c':'#10b981',fontWeight:800,fontSize:13}}>{d.count} stuck</span>
                <span style={{color:'rgba(255,255,255,0.35)',fontSize:10}}>{d.issue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {stallPriority.length > 0 && (
        <div>
          <p style={{color:'rgba(255,255,255,0.2)',fontSize:8,fontWeight:800,letterSpacing:'0.2em',margin:'0 0 10px'}}>HIGH-VALUE STALLED PARTICIPANTS</p>
          <div className="space-y-1.5">
            {stallPriority.map((p,i)=>(
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.15)'}}>
                <div className="flex items-center gap-2.5">
                  <span style={{color:'rgba(255,255,255,0.3)',fontSize:9,fontFamily:'monospace'}}>{p.id}</span>
                  <span style={{color:'white',fontWeight:600,fontSize:11}}>{p.name}</span>
                  <span className="px-1.5 py-0.5 rounded font-bold" style={{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.6)',fontSize:9}}>{p.country}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span style={{color:'#fb923c',fontWeight:700}}>{p.stage}</span>
                  <span style={{color:'#10b981',fontWeight:800}}>${p.amount.toLocaleString()}</span>
                  <span style={{color:p.riskScore>50?'#ef4444':p.riskScore>30?'#fb923c':'rgba(255,255,255,0.35)'}}>Risk {p.riskScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentsPanel({ data }) {
  if (!data.length) return <p style={{color:'rgba(255,255,255,0.3)',fontSize:12}}>No active payment alerts.</p>;
  return (
    <div className="space-y-2">
      {data.map((a,i)=>{
        const c = SEV_COLOR[a.severity]||'#888';
        return (
          <div key={i} className="p-4 rounded-xl" style={{background:`${c}07`,border:`1px solid ${c}20`}}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${c}15`}}>
                <CreditCard size={13} style={{color:c}}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <SevBadge sev={a.severity}/>
                  <span style={{color:'rgba(255,255,255,0.3)',fontSize:10}}>{a.id} · {a.method} · {a.amount}</span>
                  <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold" style={{background:a.riskScore>65?'rgba(239,68,68,0.15)':a.riskScore>40?'rgba(251,146,60,0.15)':'rgba(16,185,129,0.12)',color:a.riskScore>65?'#ef4444':a.riskScore>40?'#fb923c':'#10b981'}}>
                    Risk {a.riskScore}
                  </span>
                </div>
                <p style={{color:'white',fontWeight:700,fontSize:12,margin:'0 0 3px'}}>{a.title}</p>
                <p style={{color:'rgba(255,255,255,0.5)',fontSize:11,margin:'0 0 6px',lineHeight:1.5}}>{a.detail}</p>
                <p style={{color:c,fontSize:10,fontWeight:700,margin:0}}>→ {a.action}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CRMPanel({ data }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.07)',background:'rgba(8,16,36,0.6)'}}>
      <table className="w-full text-xs">
        <thead style={{background:'rgba(0,0,0,0.35)'}}>
          <tr>{['Priority','Participant','Country','Plan / Amount','Reason','Required Action'].map(h=>(
            <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{color:'rgba(255,255,255,0.3)',fontSize:9,whiteSpace:'nowrap'}}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {data.map((item,i)=>{
            const c = SEV_COLOR[item.priority]||'#888';
            return (
              <tr key={i} style={{borderTop:'1px solid rgba(255,255,255,0.04)',background:item.priority==='critical'?'rgba(239,68,68,0.03)':'transparent'}}>
                <td className="px-3 py-2.5"><SevBadge sev={item.priority}/></td>
                <td className="px-3 py-2.5"><p style={{color:'white',fontWeight:700,margin:0,fontSize:11}}>{item.name}</p><p style={{color:'rgba(255,255,255,0.3)',margin:0,fontSize:9}}>{item.id}</p></td>
                <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded font-bold" style={{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)',fontSize:10}}>{item.country}</span></td>
                <td className="px-3 py-2.5"><p style={{color:'#fb923c',fontWeight:700,margin:0,fontSize:11}}>{item.plan}</p><p style={{color:'#10b981',fontWeight:800,margin:0,fontSize:11}}>${item.amount.toLocaleString()}</p></td>
                <td className="px-3 py-2.5" style={{color:'rgba(255,255,255,0.5)',maxWidth:180,fontSize:10,lineHeight:1.4}}>{item.reason}</td>
                <td className="px-3 py-2.5" style={{color:c,fontSize:10,fontWeight:600,maxWidth:160}}>{item.action}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SupportPanel({ data }) {
  return (
    <div className="space-y-2">
      {data.map((item,i)=>{
        const c = SEV_COLOR[item.priority]||'#888';
        const isBreached = item.sla==='BREACHED';
        return (
          <div key={i} className="p-4 rounded-xl" style={{background:`${c}06`,border:`1px solid ${c}18`}}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black" style={{background:`${c}18`,color:c,fontSize:12}}>
                {i+1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <SevBadge sev={item.priority}/>
                  <span style={{color:'rgba(255,255,255,0.3)',fontSize:10}}>{item.id} · {item.type}</span>
                  {isBreached && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{background:'rgba(239,68,68,0.2)',color:'#ef4444'}}>SLA BREACHED</span>}
                  {item.sla==='At Risk' && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{background:'rgba(251,146,60,0.15)',color:'#fb923c'}}>AT RISK</span>}
                </div>
                <p style={{color:'white',fontWeight:700,fontSize:12,margin:'0 0 2px'}}>{item.title}</p>
                <p style={{color:'rgba(255,255,255,0.4)',fontSize:10,margin:'0 0 4px'}}>{item.participant} · {item.country} · {item.age} open · Assigned: {item.assigned}</p>
                <p style={{color:'rgba(255,255,255,0.55)',fontSize:11,margin:'0 0 5px',lineHeight:1.5}}>{item.urgentNote}</p>
                <p style={{color:c,fontSize:10,fontWeight:700,margin:0}}>→ {item.action}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MarketingPanel({ data }) {
  return (
    <div className="space-y-2">
      {data.map((r,i)=>{
        const c = r.priority==='high'?'#ef4444':r.priority==='medium'?'#fb923c':'#6b7280';
        return (
          <div key={i} className="p-4 rounded-xl" style={{background:`${c}07`,border:`1px solid ${c}18`}}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <SevBadge sev={r.priority}/>
              <span style={{color:'rgba(255,255,255,0.35)',fontSize:10}}>{r.id} · {r.channel}</span>
              <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold" style={{background:'rgba(16,185,129,0.12)',color:'#10b981'}}>Impact: {r.impact}</span>
            </div>
            <p style={{color:'white',fontWeight:700,fontSize:12,margin:'0 0 5px'}}>{r.title}</p>
            <p style={{color:'rgba(255,255,255,0.52)',fontSize:11,margin:0,lineHeight:1.6}}>{r.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

function ActionsPanel({ data }) {
  return (
    <div className="space-y-2">
      {data.map((a,i)=>{
        const c = SEV_COLOR[a.priority]||'#888';
        return (
          <div key={a.id} className="flex items-start gap-3 p-4 rounded-xl" style={{background:`${c}07`,border:`1px solid ${c}18`}}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black" style={{background:`${c}18`,color:c,fontSize:15}}>
              {i+1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <SevBadge sev={a.priority}/>
                <span style={{color:'rgba(255,255,255,0.3)',fontSize:10}}>→ {a.module}</span>
                <span style={{color:'rgba(255,255,255,0.25)',fontSize:10}}>Owner: {a.owner}</span>
              </div>
              <p style={{color:'white',fontWeight:700,fontSize:12,margin:'0 0 4px'}}>{a.title}</p>
              <p style={{color:'rgba(255,255,255,0.52)',fontSize:11,margin:0,lineHeight:1.55}}>{a.reason}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AIBrain({ compact = false }) {
  const [activeModule, setActiveModule] = useState('actions');
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString('en-GB'));
  const sim = useSimulation();

  const [data, setData] = useState(() => ({
    insights:   generateExecutiveInsights(),
    risks:      generateRisks(),
    growth:     generateGrowthOpportunities(),
    leaders:    generateLeaderIntelligence(),
    conversion: generateConversionIntelligence(),
    payments:   generatePaymentIntelligence(),
    crm:        generateCRMPriority(),
    support:    generateSupportPriority(),
    marketing:  generateMarketingRecommendations(),
    actions:    generateActionQueue(),
  }));

  useEffect(() => {
    if (sim.tick % 4 === 0 && sim.tick > 0) {
      setData({
        insights:   generateExecutiveInsights(),
        risks:      generateRisks(),
        growth:     generateGrowthOpportunities(),
        leaders:    generateLeaderIntelligence(),
        conversion: generateConversionIntelligence(),
        payments:   generatePaymentIntelligence(),
        crm:        generateCRMPriority(),
        support:    generateSupportPriority(),
        marketing:  generateMarketingRecommendations(),
        actions:    generateActionQueue(),
      });
      setLastRefresh(new Date().toLocaleTimeString('en-GB'));
    }
  }, [sim.tick]);

  const criticalRisks    = data.risks.filter(r=>r.severity==='critical').length;
  const criticalActions  = data.actions.filter(a=>a.priority==='critical').length;
  const criticalPayments = data.payments.filter(p=>p.severity==='critical').length;

  const renderModule = () => {
    switch (activeModule) {
      case 'insights':    return <InsightsPanel data={data.insights} />;
      case 'risks':       return <RisksPanel data={data.risks} />;
      case 'growth':      return <GrowthPanel data={data.growth} />;
      case 'leaders':     return <LeadersPanel data={data.leaders} />;
      case 'conversion':  return <ConversionPanel data={data.conversion} />;
      case 'payments':    return <PaymentsPanel data={data.payments} />;
      case 'crm':         return <CRMPanel data={data.crm} />;
      case 'support':     return <SupportPanel data={data.support} />;
      case 'marketing':   return <MarketingPanel data={data.marketing} />;
      case 'actions':     return <ActionsPanel data={data.actions} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      {!compact && (
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p style={{color:'#3b82f6',fontSize:9,fontWeight:800,letterSpacing:'0.25em',margin:'0 0 6px'}}>INTERNAL OPERATIONS INTELLIGENCE — ADMIN ONLY</p>
            <h2 style={{color:'white',fontSize:22,fontWeight:900,margin:'0 0 3px',letterSpacing:-0.5}}>AI Brain</h2>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:11,margin:0}}>Reads live admin data · Produces ranked decisions · Evolves with platform changes</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {criticalActions > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)'}} onClick={()=>setActiveModule('actions')}>
                <ListChecks size={12} style={{color:'#ef4444'}}/>
                <span style={{color:'#ef4444',fontSize:10,fontWeight:700}}>{criticalActions} critical action{criticalActions>1?'s':''}</span>
              </div>
            )}
            {criticalPayments > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer" style={{background:'rgba(6,182,212,0.08)',border:'1px solid rgba(6,182,212,0.25)'}} onClick={()=>setActiveModule('payments')}>
                <CreditCard size={12} style={{color:'#06b6d4'}}/>
                <span style={{color:'#06b6d4',fontSize:10,fontWeight:700}}>{criticalPayments} payment alert{criticalPayments>1?'s':''}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{background:'rgba(16,185,129,0.07)',border:'1px solid rgba(16,185,129,0.2)'}}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
              <span style={{color:'#10b981',fontSize:10,fontWeight:600}}>LIVE · {lastRefresh}</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label:'Critical Risks', value:criticalRisks, color:'#ef4444', mod:'risks' },
          { label:'Growth Opps', value:data.growth.length, color:'#10b981', mod:'growth' },
          { label:'CRM — Urgent', value:data.crm.filter(c=>['critical','high'].includes(c.priority)).length, color:'#8b5cf6', mod:'crm' },
          { label:'Payment Alerts', value:data.payments.length, color:'#06b6d4', mod:'payments' },
          { label:'Queued Actions', value:data.actions.length, color:'#fb923c', mod:'actions' },
        ].map((s,i)=>(
          <button key={i} onClick={()=>setActiveModule(s.mod)}
            className="p-3 rounded-xl text-center transition-all hover:scale-105"
            style={{background:`${s.color}0a`,border:`1px solid ${activeModule===s.mod?s.color+'50':s.color+'18'}`}}>
            <p style={{color:s.color,fontSize:20,fontWeight:900,margin:'0 0 2px'}}>{s.value}</p>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:9,fontWeight:600,margin:0}}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Module tabs */}
      <div className="flex gap-1 flex-wrap border-b pb-0" style={{borderColor:'rgba(255,255,255,0.06)'}}>
        {MODULES.map(m=>{
          const Icon = m.icon;
          const isActive = activeModule===m.id;
          return (
            <button key={m.id} onClick={()=>setActiveModule(m.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all border-b-2"
              style={{borderColor:isActive?m.color:'transparent',color:isActive?m.color:'rgba(255,255,255,0.38)'}}>
              <Icon size={11}/>
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Module content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeModule}
          initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0}}
          transition={{duration:0.12}}>
          {renderModule()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}