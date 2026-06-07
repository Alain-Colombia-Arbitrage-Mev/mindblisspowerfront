import { Wallet, ExternalLink, Shield, AlertCircle, ArrowRight } from 'lucide-react';

export default function DashWithdrawal() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-montserrat font-black text-white text-2xl mb-1">Withdrawal</h2>
        <p className="text-white/40 text-sm">Access and manage your earned activity-based credits</p>
      </div>

      {/* Important notice */}
      <div className="border border-vicion-electric/40 bg-vicion-blue/10 rounded-xl p-6 mb-6 neon-border">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-vicion-blue/20 flex items-center justify-center flex-shrink-0">
            <Wallet className="text-vicion-electric" size={20} />
          </div>
          <div>
            <h3 className="font-montserrat font-bold text-white text-lg mb-2">External Platform Management</h3>
            <p className="text-white/60 leading-relaxed text-sm">
              Withdrawals and credit management are handled through external platforms authorized by Mindbliss Power. Access is granted based on your activity level and participation status.
            </p>
          </div>
        </div>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available Credits', value: '1,240', sub: 'activity-based credits', highlight: true },
          { label: 'Pending', value: '380', sub: 'under review' },
          { label: 'Total Earned', value: '4,820', sub: 'since joining' },
        ].map(s => (
          <div key={s.label} className={`dash-card p-5 neon-border ${s.highlight ? 'border-vicion-electric/50' : ''}`}>
            <div className={`font-montserrat font-black text-3xl mb-1 ${s.highlight ? 'gradient-text' : 'text-white'}`}>{s.value}</div>
            <div className={`text-xs font-medium ${s.highlight ? 'text-vicion-electric' : 'text-white/40'}`}>{s.label}</div>
            <div className="text-white/30 text-xs mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* External platform access */}
      <div className="dash-card p-6 neon-border mb-4">
        <h3 className="font-montserrat font-bold text-white mb-5 flex items-center gap-2">
          <ExternalLink className="text-vicion-electric" size={18} /> Access External Platforms
        </h3>
        <div className="flex flex-col gap-3">
          {[
            { name: 'Vicion Wallet Portal', desc: 'Primary credit management platform', status: 'Active' },
            { name: 'Partner Exchange Network', desc: 'For credit conversion requests', status: 'Available' },
          ].map(platform => (
            <div key={platform.name} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-vicion-electric/30 transition-colors group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-vicion-blue/20 flex items-center justify-center">
                <ExternalLink className="text-vicion-electric" size={18} />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">{platform.name}</div>
                <div className="text-white/30 text-xs">{platform.desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs font-medium bg-green-400/10 px-2.5 py-1 rounded-full">{platform.status}</span>
                <ArrowRight size={14} className="text-white/20 group-hover:text-vicion-electric transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className="flex items-start gap-3 p-5 rounded-xl bg-white/3 border border-white/10">
        <AlertCircle className="text-white/30 flex-shrink-0" size={18} />
        <p className="text-white/30 text-xs leading-relaxed">
          Credit management and withdrawal processes are subject to platform terms and applicable regulations. Mindbliss Power does not guarantee specific withdrawal amounts. All activity-based credits are earned through participation and are subject to verification. This is not a financial product.
        </p>
      </div>
    </div>
  );
}