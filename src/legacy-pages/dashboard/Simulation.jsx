import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function Simulation() {
  const [directRefs, setDirectRefs] = useState([5]);
  const [teamActivity, setTeamActivity] = useState([50]);
  const [months, setMonths] = useState([6]);

  const projectedNetwork = Math.round(directRefs[0] * (teamActivity[0] / 100) * months[0] * 1.5);
  const activityLevel = teamActivity[0] > 70 ? "High" : teamActivity[0] > 40 ? "Moderate" : "Low";
  const projectedLevel =
    projectedNetwork > 100 ? "Executive" :
    projectedNetwork > 50 ? "Director" :
    projectedNetwork > 25 ? "Builder III" :
    projectedNetwork > 10 ? "Builder II" : "Builder I";

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Simulation Engine</h1>
        <p className="text-muted-foreground">Explore potential outcomes based on your activity inputs.</p>
      </motion.div>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex gap-3">
        <AlertTriangle size={20} className="text-amber-400 min-w-[20px] mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">This is a simulation tool. Results are not guaranteed.</strong> Actual outcomes depend on individual effort, market conditions, and many other factors. This tool is for educational and planning purposes only.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 rounded-2xl bg-card border border-border/50 space-y-8"
        >
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Calculator size={18} className="text-primary" />
            Input Parameters
          </h3>

          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Direct Referrals (monthly)</span>
              <span className="text-foreground font-semibold">{directRefs[0]}</span>
            </div>
            <Slider value={directRefs} onValueChange={setDirectRefs} min={1} max={20} step={1} />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Team Activity Rate</span>
              <span className="text-foreground font-semibold">{teamActivity[0]}%</span>
            </div>
            <Slider value={teamActivity} onValueChange={setTeamActivity} min={10} max={100} step={5} />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Time Period (months)</span>
              <span className="text-foreground font-semibold">{months[0]}</span>
            </div>
            <Slider value={months} onValueChange={setMonths} min={1} max={24} step={1} />
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 rounded-2xl bg-card border border-primary/20 space-y-6"
        >
          <h3 className="font-semibold text-foreground">Projected Outcome</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-primary">{projectedNetwork}</p>
              <p className="text-xs text-muted-foreground mt-1">Est. Network Size</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-primary">{projectedLevel}</p>
              <p className="text-xs text-muted-foreground mt-1">Projected Level</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-primary">{activityLevel}</p>
              <p className="text-xs text-muted-foreground mt-1">Activity Classification</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-primary">{months[0]}mo</p>
              <p className="text-xs text-muted-foreground mt-1">Growth Period</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            This simulation assumes consistent activity over the selected time period. Actual results may vary significantly. 
            No financial outcomes should be inferred from this tool.
          </p>
        </motion.div>
      </div>
    </div>
  );
}