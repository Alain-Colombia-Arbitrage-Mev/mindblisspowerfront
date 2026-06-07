import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Eye, Target, Users, Globe, ArrowRight } from "lucide-react";

const OFFICE_IMG = "https://media.base44.com/images/public/69db5abb4223262dd0e9e08f/17dbf3fc2_generated_264a4420.png";

const leaders = [
  { name: "Executive Board", role: "Strategic Leadership", desc: "Experienced professionals with backgrounds in global business, technology, and community development." },
  { name: "Operations Team", role: "Platform Management", desc: "Dedicated specialists ensuring smooth operations across all markets and sectors." },
  { name: "Compliance Division", role: "Regulatory Oversight", desc: "Legal and compliance experts maintaining the highest standards of ethical operation." },
];

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src={OFFICE_IMG} alt="Corporate office" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Who We Are</span>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-foreground mt-3 mb-6">
              About <span className="text-primary">Mindbliss Power</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A global platform built on the belief that everyone deserves access to structured opportunity and community-driven growth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-2xl bg-card border border-border/50"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Eye size={28} className="text-primary" />
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                To become the world's most trusted platform for structured participation, connecting millions of people 
                with real opportunities and lasting community impact.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="p-10 rounded-2xl bg-card border border-border/50"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Target size={28} className="text-primary" />
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                To provide individuals worldwide with the tools, structure, and community they need to build something meaningful — 
                regardless of their starting point or background.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">Leadership</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Guided by experienced professionals committed to ethical growth and global impact.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaders.map((l, i) => (
              <motion.div
                key={l.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-8 rounded-2xl bg-card border border-border/50 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Users size={28} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{l.name}</h3>
                <p className="text-primary text-sm font-medium mb-3">{l.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{l.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Presence */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Globe size={32} className="text-primary" />
            </div>
            <h2 className="font-display text-4xl font-bold text-foreground mb-6">Global Presence</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Mindbliss Power operates across Latin America, the United States, and Europe — with a growing footprint in emerging markets. 
              Our platform is designed to be accessible, scalable, and impactful regardless of geography.
            </p>
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              {[
                { n: "50+", l: "Countries" },
                { n: "3", l: "Continents" },
                { n: "100K+", l: "Participants" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl font-bold text-primary">{s.n}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary/20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold text-foreground mb-6">Join Our Story</h2>
          <p className="text-muted-foreground mb-8">Be part of something bigger. Start building with Mindbliss Power today.</p>
          <Link
            to="/opportunity"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all glow-blue"
          >
            Explore Opportunity <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </>
  );
}