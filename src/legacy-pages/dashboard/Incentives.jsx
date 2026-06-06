import { motion } from "framer-motion";
import { Award, TrendingUp, Users, Zap } from "lucide-react";

const tiers = [
  { level: "Builder I", req: "Entry level", benefits: "Base participation access", color: "border-slate-500" },
  { level: "Builder II", req: "10 active participants", benefits: "Enhanced structure benefits", color: "border-blue-500" },
  { level: "Builder III", req: "25 active participants", benefits: "Leadership recognition + expanded access", color: "border-purple-500" },
  { level: "Director", req: "50 active participants", benefits: "Full ecosystem access + mentorship role", color: "border-amber-500" },
  { level: "Executive", req: "100+ active participants", benefits: "Top-tier recognition + global leadership", color: "border-primary" },
];

export default function Incentives() {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Activity-Based Incentives</h1>
        <p className="text-muted-foreground">Structured incentive tiers based on your participation and network development.</p>
      </motion.div>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Important:</strong> All incentives are based on active participation. Results vary depending on individual involvement and consistency. This is not a guarantee of income.
        </p>
      </div>

      {/* Tiers */}
      <div className="space-y-4">
        {tiers.map((t, i) => (
          <motion.div
            key={t.level}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-2xl bg-card border-l-4 ${t.color} border border-border/50`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{t.level}</h3>
                <p className="text-sm text-muted-foreground mt-1">Requirement: {t.req}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm text-primary font-medium">{t.benefits}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Zap, label: "Participation Score", value: "—" },
          { icon: Users, label: "Network Activity", value: "—" },
          { icon: TrendingUp, label: "Growth Rate", value: "—" },
        ].map((m) => (
          <div key={m.label} className="p-5 rounded-2xl bg-card border border-border/50 text-center">
            <m.icon size={20} className="text-primary mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}