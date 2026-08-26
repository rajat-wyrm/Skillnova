import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const MotionDiv = motion.div;
const MotionCircle = motion.circle;
const MotionP = motion.p;

// MD3 Ripple Hook
export const useRipple = () => {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    const cleanup = setTimeout(() => {
      if (ripples.length > 0) {
        setRipples([]);
      }
    }, 1000);
    return () => clearTimeout(cleanup);
  }, [ripples]);

  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);
  };

  return { ripples, addRipple };
};

// Ripple renderer helper
export const Ripples = ({ ripples }) => {
  return ripples.map((r) => (
    <span
      key={r.id}
      className="ripple-effect"
      style={{
        width: r.size,
        height: r.size,
        left: r.x,
        top: r.y,
      }}
    />
  ));
};

// Premium Lottie/SVG Loading animation
export const LottieLoader = () => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <MotionDiv
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: [0.8, 1.1, 0.9, 1], opacity: 1 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
      className="relative w-20 h-20"
    >
      {/* Decorative gradient glowing circles */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff6d34] to-[#00bea3] opacity-30 blur-md" />
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="gradient-loader" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6d34" />
            <stop offset="100%" stopColor="#00bea3" />
          </linearGradient>
        </defs>
        <MotionCircle
          cx="50"
          cy="50"
          r="40"
          stroke="url(#gradient-loader)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: "1, 200", strokeDashoffset: 0 }}
          animate={{
            strokeDasharray: ["10, 200", "120, 200", "120, 200"],
            strokeDashoffset: [0, -40, -250]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>
    </MotionDiv>
    <MotionP
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="text-xs font-semibold tracking-wider text-[var(--muted)] uppercase"
    >
      Optimizing Workspace...
    </MotionP>
  </div>
);

// Page Wrapper Component
const AnimatedPage = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial mount load / skeleton trigger
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <LottieLoader />
        {/* Render a ghost skeleton loading background */}
        <div className="w-full max-w-4xl p-6 mt-6 space-y-4 opacity-15">
          <div className="h-10 bg-slate-300 dark:bg-slate-700 rounded-lg w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-300 dark:bg-slate-700 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-300 dark:bg-slate-700 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-300 dark:bg-slate-700 rounded-2xl animate-pulse" />
          </div>
          <div className="h-64 bg-slate-300 dark:bg-slate-700 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, x: 20, scale: 0.98, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -20, scale: 0.98, filter: "blur(4px)" }}
      transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
      className="w-full h-full"
    >
      {children}
    </MotionDiv>
  );
};

export default AnimatedPage;
