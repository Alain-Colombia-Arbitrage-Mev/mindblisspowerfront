import { motion } from 'framer-motion';

const avatars = [
  { initials: 'CM', color: 'bg-blue-500' },
  { initials: 'LG', color: 'bg-purple-500' },
  { initials: 'AR', color: 'bg-pink-500' },
];

export default function MicroSocialSignal() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        {avatars.map((avatar, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatar.color} -ml-2 first:ml-0 ring-2 ring-white`}
          >
            {avatar.initials}
          </motion.div>
        ))}
      </div>
      <span className="text-xs font-medium text-gray-600">Personas activas ahora mismo</span>
    </div>
  );
}