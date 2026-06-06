import { motion } from "framer-motion";
import { TrendingUp, Building2, RotateCcw, Users, KeyRound } from "lucide-react";

const values = [
  { icon: TrendingUp, title: "Growth", desc: "Continuous development through structured participation and scalable models." },
  { icon: Building2, title: "Structure", desc: "Clear frameworks that organize activity into measurable progress." },
  { icon: RotateCcw, title: "Continuity", desc: "Systems designed for long-term sustainability and ongoing participation." },
  { icon: Users, title: "Community", desc: "A global network of individuals supporting and empowering each other." },
  { icon: KeyRound, title: "Access", desc: "Opening doors to opportunities that were previously out of reach." },
];

export default function CoreValues() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Our Foundation</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mt-3 mb-4">
            Core Values
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">The principles that guide everything we build.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-2xl bg-card border border-border/50 text-center hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <v.icon size={26} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}