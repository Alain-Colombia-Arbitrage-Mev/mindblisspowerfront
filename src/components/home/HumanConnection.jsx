import { motion } from "framer-motion";

const FAMILY_IMG = "https://media.base44.com/images/public/69db5abb4223262dd0e9e08f/60a43e998_generated_5d09b764.png";
const ENTREPRENEURS_IMG = "https://media.base44.com/images/public/69db5abb4223262dd0e9e08f/c9f4c3555_generated_d344f9d5.png";

export default function HumanConnection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Real people. <span className="text-primary">Real progress.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Across the world, thousands of individuals are building structure, stability, and opportunity through a system designed for participation and growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-2xl overflow-hidden group"
          >
            <img src={FAMILY_IMG} alt="Families building stability" className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">Families & Communities</h3>
              <p className="text-muted-foreground text-sm">Building stability and creating opportunities for future generations.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-2xl overflow-hidden group"
          >
            <img src={ENTREPRENEURS_IMG} alt="Entrepreneurs collaborating" className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">Entrepreneurs & Builders</h3>
              <p className="text-muted-foreground text-sm">Turning ambition into structured, scalable activity.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}