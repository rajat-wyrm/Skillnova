import { motion } from 'framer-motion';

const MotionDiv = motion.div;
const MotionH2 = motion.h2;

const LoaderScreen = ({ label = 'Initialising SkillNova…' }) => (
  <div className="h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
    <div className="flex flex-col items-center gap-6">
      {/* Animated logo/avatar loader container */}
      <div className="relative">
        {/* Pulsing glow background rings */}
        <MotionDiv
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#ff6d34] to-[#00bea3] opacity-35 blur-xl"
        />
        
        {/* Spinning outer circle */}
        <MotionDiv
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full border-4 border-transparent"
          style={{ borderTopColor: '#ff6d34', borderRightColor: '#00bea3' }}
        />

        {/* Scaled startup center logo identifier */}
        <MotionDiv
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.8, 1, 0.8], opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 m-auto w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-md"
          style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}
        >
          S
        </MotionDiv>
      </div>

      <div className="text-center space-y-2">
        <MotionH2 
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-lg font-bold tracking-wider"
          style={{ color: 'var(--text)' }}
        >
          SkillNova
        </MotionH2>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</p>
      </div>
    </div>
  </div>
);

export default LoaderScreen;
