import { motion } from "framer-motion";
import { Clock, Activity } from "lucide-react";

export default function HistoryLog() {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Activity History</h1>
        <p className="text-muted-foreground">Your complete participation and activity log.</p>
      </motion.div>

      {/* Empty state */}
      <div className="p-16 rounded-2xl bg-card border border-border/50 text-center">
        <Clock size={48} className="text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No activity recorded yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your participation activity, network changes, and all platform interactions will appear here as a detailed log.
        </p>
      </div>
    </div>
  );
}