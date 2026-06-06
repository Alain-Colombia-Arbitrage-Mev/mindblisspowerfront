import { motion } from "framer-motion";
import { Users, ChevronDown } from "lucide-react";

function TreeNode({ name, level, side, children }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-28 p-3 rounded-xl bg-card border border-border/50 text-center hover:border-primary/40 transition-all">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <Users size={16} className="text-primary" />
        </div>
        <p className="text-xs font-semibold text-foreground truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground">{level}</p>
        {side && <span className="text-[10px] text-primary">{side}</span>}
      </div>
      {children && (
        <>
          <div className="w-px h-6 bg-border/50" />
          <ChevronDown size={12} className="text-primary/40 -mt-1 mb-1" />
          <div className="flex gap-8">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export default function NetworkView() {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Network Structure</h1>
        <p className="text-muted-foreground">Your binary tree network visualization.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Left Branch", value: "0" },
          { label: "Right Branch", value: "0" },
          { label: "Total Network", value: "0" },
          { label: "Active Members", value: "0" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-card border border-border/50 text-center">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tree */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-8 rounded-2xl bg-card border border-border/50 overflow-x-auto"
      >
        <div className="min-w-[400px] flex justify-center">
          <TreeNode name="You" level="Builder I">
            <TreeNode name="Empty" level="Left" side="L">
              <TreeNode name="—" level="L-L" side="L" />
              <TreeNode name="—" level="L-R" side="R" />
            </TreeNode>
            <TreeNode name="Empty" level="Right" side="R">
              <TreeNode name="—" level="R-L" side="L" />
              <TreeNode name="—" level="R-R" side="R" />
            </TreeNode>
          </TreeNode>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-6">
          Your network tree will populate as you build your structure. Invite participants to see them appear here.
        </p>
      </motion.div>
    </div>
  );
}