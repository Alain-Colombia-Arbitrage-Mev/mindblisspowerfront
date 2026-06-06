import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function ConversionButton({ floating = false }) {
  if (floating) {
    // Mobile floating button
    return (
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <style>{`
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(29, 110, 245, 0.4), 0 0 0 rgba(29, 110, 245, 0);
            }
            50% {
              box-shadow: 0 0 30px rgba(29, 110, 245, 0.6), 0 0 10px rgba(29, 110, 245, 0.4);
            }
          }
          .pulse-button {
            animation: pulse-glow 6s ease-in-out infinite;
          }
        `}</style>
        <Link
          to="/participar"
          className="pulse-button inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-6 py-4 rounded-full shadow-lg transition-all duration-200 w-14 h-14">
          <ArrowRight size={20} />
        </Link>
      </div>
    );
  }

  // Desktop navbar button
  return (
    <style>{`
      @keyframes pulse-glow {
        0%, 100% {
          box-shadow: 0 0 20px rgba(29, 110, 245, 0.4), 0 0 0 rgba(29, 110, 245, 0);
        }
        50% {
          box-shadow: 0 0 30px rgba(29, 110, 245, 0.6), 0 0 10px rgba(29, 110, 245, 0.4);
        }
      }
      .pulse-button {
        animation: pulse-glow 6s ease-in-out infinite;
      }
    `}</style>
  );
}