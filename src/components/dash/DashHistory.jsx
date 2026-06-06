import { Clock, Activity, UserPlus, Award, ArrowUp } from 'lucide-react';

const logs = [
  { type: 'activity', icon: Activity, label: 'Daily activity logged', date: '2026-04-12', detail: 'Score +3 pts', color: 'text-vicion-electric' },
  { type: 'referral', icon: UserPlus, label: 'New network member joined', date: '2026-04-10', detail: 'Extended network +1', color: 'text-green-400' },
  { type: 'level', icon: Award, label: 'Level milestone reached', date: '2026-04-07', detail: 'Gold tier confirmed', color: 'text-yellow-400' },
  { type: 'activity', icon: Activity, label: 'Weekly participation completed', date: '2026-04-05', detail: 'Consistency +5%', color: 'text-vicion-electric' },
  { type: 'activity', icon: Activity, label: 'Daily activity logged', date: '2026-04-03', detail: 'Score +3 pts', color: 'text-vicion-electric' },
  { type: 'referral', icon: UserPlus, label: 'Direct referral activated', date: '2026-03-28', detail: 'Ana García — Active', color: 'text-green-400' },
  { type: 'level', icon: ArrowUp, label: 'Progressed from Silver to Gold', date: '2026-03-15', detail: 'Level advancement', color: 'text-yellow-400' },
  { type: 'activity', icon: Activity, label: 'Monthly activity threshold met', date: '2026-03-01', detail: '20+ days active', color: 'text-vicion-electric' },
];

export default function DashHistory() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-montserrat font-black text-white text-2xl mb-1">Activity History</h2>
        <p className="text-white/40 text-sm">Your participation and activity log</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Activity Days', value: '87', sub: 'since joining' },
          { label: 'Events Logged', value: '142', sub: 'across all types' },
          { label: 'Streak', value: '12', sub: 'consecutive days' },
        ].map(s => (
          <div key={s.label} className="dash-card p-5 neon-border">
            <div className="font-montserrat font-black text-3xl text-white mb-1">{s.value}</div>
            <div className="text-vicion-electric text-xs font-medium">{s.label}</div>
            <div className="text-white/30 text-xs mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Log */}
      <div className="dash-card p-6 neon-border">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="text-vicion-electric" size={18} />
          <h3 className="font-montserrat font-bold text-white">Activity Log</h3>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-vicion-electric/40 to-transparent" />

          <div className="flex flex-col gap-1">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 pl-1 py-3 hover:bg-white/3 rounded-xl transition-colors group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-vicion-deep border border-white/10 relative z-10 group-hover:border-vicion-electric/40 transition-colors`}>
                  <log.icon size={14} className={log.color} />
                </div>
                <div className="flex-1 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-white/80 text-sm font-medium">{log.label}</div>
                    <div className={`text-xs ${log.color} opacity-70`}>{log.detail}</div>
                  </div>
                  <div className="text-white/30 text-xs flex-shrink-0">{log.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}