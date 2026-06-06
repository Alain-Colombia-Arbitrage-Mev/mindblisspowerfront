import { motion } from "framer-motion";
import { Clock, BarChart3, Globe, Heart } from "lucide-react";

const reasons = [
  { icon: Clock, title: "Flexibility", desc: "Participate on your own schedule, from anywhere in the world." },
  { icon: BarChart3, title: "Structured Growth", desc: "A clear path with measurable milestones and organized activity." },
  { icon: Globe, title: "Global Reach", desc: "Connect with a worldwide community and access international opportunities." },
  { icon: Heart, title: "Community-Driven", desc: "Success is shared. Growth happens when people support each other." },
];

export default function WhyPeopleJoin() {
  return (
    <section className="py-24 lg:py-32 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Social Proof</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mt-3">
            Why people <span className="text-primary">join</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-5 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 min-w-[3rem] rounded-xl bg-primary/10 flex items-center justify-center">
                <r.icon size={22} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}