import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Activity, Users, TrendingUp, Award, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Overview() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const stats = [
    { icon: Activity, label: "Activity Status", value: "Active", color: "text-green-400", bg: "bg-green-400/10" },
    { icon: Award, label: "Current Level", value: "Builder I", color: "text-primary", bg: "bg-primary/10" },
    { icon: Users, label: "Network Size", value: "0", color: "text-blue-400", bg: "bg-blue-400/10" },
    { icon: TrendingUp, label: "Monthly Progress", value: "Starting", color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground">Here's your activity overview.</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={20} className={s.color} />
              </div>
              <ArrowUpRight size={16} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-2xl bg-card border border-border/50"
      >
        <h3 className="font-semibold text-foreground mb-4">Level Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Builder I → Builder II</span>
              <span className="text-primary font-medium">0%</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            Progress is based on your activity level, network development, and participation consistency.
          </p>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { label: "Invite Someone", desc: "Grow your network", path: "/dashboard/referrals" },
          { label: "Run Simulation", desc: "Explore scenarios", path: "/dashboard/simulation" },
          { label: "View Network", desc: "See your structure", path: "/dashboard/network" },
        ].map((a) => (
          <a
            key={a.label}
            href={a.path}
            className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
          >
            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{a.label}</h4>
            <p className="text-sm text-muted-foreground mt-1">{a.desc}</p>
          </a>
        ))}
      </motion.div>
    </div>
  );
}