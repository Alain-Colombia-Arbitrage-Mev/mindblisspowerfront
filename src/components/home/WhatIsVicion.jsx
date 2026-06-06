import { motion } from "framer-motion";
import { Globe, Shield, Layers, Users } from "lucide-react";

export default function WhatIsVicion() {
  const features = [
    { icon: Globe, title: "Global Reach", desc: "Operating across 50+ countries with a unified platform." },
    { icon: Layers, title: "Structured Systems", desc: "Clear, organized pathways for participation and growth." },
    { icon: Shield, title: "Trust & Transparency", desc: "Built on compliance, clarity, and ethical operations." },
    { icon: Users, title: "Community Driven", desc: "Success comes from people supporting people." },
  ];

  return (
    <section className="py-24 lg:py-32 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">About the Platform</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mt-3 mb-6">
              More than a platform
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Vicion Power is a global ecosystem that connects people with structured systems, access to opportunities, and a scalable participation model designed for long-term development.
            </p>
            <div className="h-1 w-20 bg-primary rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}