import { Users, ArrowDown } from 'lucide-react';

const NodeCircle = ({ name, level, active, size = 'md' }) => {
  const sizes = { sm: 'w-14 h-14 text-xs', md: 'w-20 h-20 text-sm', lg: 'w-24 h-24 text-base' };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizes[size]} rounded-full flex flex-col items-center justify-center font-montserrat font-bold border-2 transition-all
        ${active
          ? 'bg-vicion-blue border-vicion-electric text-white shadow-lg shadow-vicion-electric/30'
          : 'bg-white/5 border-white/20 text-white/60'
        }`}
      >
        <span className="text-center leading-tight text-[10px]">{name}</span>
        {level && <span className="text-vicion-electric text-[9px] mt-0.5">{level}</span>}
      </div>
    </div>
  );
};

const Connector = ({ direction = 'down' }) => (
  <div className="flex justify-center">
    <div className="w-px h-8 bg-gradient-to-b from-vicion-electric/50 to-vicion-electric/20" />
  </div>
);

export default function DashNetwork() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-montserrat font-black text-white text-2xl mb-1">Network Structure</h2>
        <p className="text-white/40 text-sm">Your binary network — left and right structure</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Left Branch', value: '12', sub: 'members' },
          { label: 'Right Branch', value: '12', sub: 'members' },
          { label: 'Total Network', value: '24', sub: 'participants' },
          { label: 'Active Nodes', value: '18', sub: '75% activity' },
        ].map(s => (
          <div key={s.label} className="dash-card p-5 neon-border text-center">
            <div className="font-montserrat font-black text-3xl text-white mb-1">{s.value}</div>
            <div className="text-vicion-electric text-xs font-medium">{s.label}</div>
            <div className="text-white/30 text-xs">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Binary Tree Visualization */}
      <div className="dash-card p-8 neon-border overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Root */}
          <div className="flex justify-center mb-2">
            <NodeCircle name="YOU" level="Gold" active size="lg" />
          </div>

          <Connector />

          {/* Level 1 */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="flex flex-col items-end pr-8">
              <NodeCircle name="LEFT" level="Silver" active />
            </div>
            <div className="flex flex-col items-start pl-8">
              <NodeCircle name="RIGHT" level="Bronze" active />
            </div>
          </div>

          {/* Connectors L2 */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="flex justify-center">
              <div className="w-full flex justify-around">
                <div className="flex flex-col items-center"><div className="w-px h-8 bg-vicion-electric/30" /></div>
                <div className="flex flex-col items-center"><div className="w-px h-8 bg-vicion-electric/30" /></div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-full flex justify-around">
                <div className="flex flex-col items-center"><div className="w-px h-8 bg-vicion-electric/30" /></div>
                <div className="flex flex-col items-center"><div className="w-px h-8 bg-vicion-electric/30" /></div>
              </div>
            </div>
          </div>

          {/* Level 2 */}
          <div className="grid grid-cols-4 gap-3 mb-2">
            {[
              { name: 'L-L', active: true },
              { name: 'L-R', active: true },
              { name: 'R-L', active: false },
              { name: 'R-R', active: true },
            ].map(n => (
              <div key={n.name} className="flex justify-center">
                <NodeCircle name={n.name} active={n.active} size="sm" />
              </div>
            ))}
          </div>

          {/* Level 3 placeholder */}
          <div className="grid grid-cols-4 gap-3 mb-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-center gap-4">
                <div className="w-px h-6 bg-vicion-electric/20 self-center" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8 gap-2">
            {[
              { name: 'A1', active: true },
              { name: 'A2', active: false },
              { name: 'B1', active: true },
              { name: 'B2', active: true },
              { name: '+', active: false },
              { name: '+', active: false },
              { name: 'C1', active: true },
              { name: '+', active: false },
            ].map((n, i) => (
              <div key={i} className="flex justify-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border
                  ${n.active ? 'bg-vicion-blue/30 border-vicion-electric/50 text-white' : 'bg-white/5 border-white/10 text-white/30 border-dashed'}`}>
                  {n.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-vicion-blue border-2 border-vicion-electric" />
            <span className="text-white/50 text-xs">Active Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white/5 border border-white/20" />
            <span className="text-white/50 text-xs">Inactive Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-dashed border-white/20" />
            <span className="text-white/50 text-xs">Open Position</span>
          </div>
        </div>
      </div>
    </div>
  );
}