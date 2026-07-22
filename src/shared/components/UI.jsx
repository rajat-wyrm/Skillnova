// ══════════════════════════════════════════════
//  SHARED — UI.jsx  (UptoSkills Branded)
// ══════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, X, CheckSquare } from "lucide-react";

// UptoSkills Brand Colors
export const BRAND = {
  orange:    "#ff6d34", // Main Brand Color
  green:     "#00bea3",
  dark:      "#2D3436",
  orangeLight: "#fff3ee",
  greenLight:  "#e6faf8",
};

const MotionDiv = motion.div;

/* ── Avatar ─────────────────────────────────── */
export const Avatar = ({ initials, size = "md" }) => {
  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl",
  };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: "linear-gradient(135deg, #ff6d34, #00bea3)" }}
    >
      {initials}
    </div>
  );
};

/* ── Badge ───────────────────────────────────── */
export const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: { background: "var(--badge-default-bg)", color: "var(--badge-default-fg)", border: "1px solid var(--badge-default-border)" },
    success: { background: "var(--badge-success-bg)", color: "var(--badge-success-fg)", border: "1px solid var(--badge-success-border)" },
    warning: { background: "var(--badge-warning-bg)", color: "var(--badge-warning-fg)", border: "1px solid var(--badge-warning-border)" },
    danger:  { background: "var(--badge-danger-bg)", color: "var(--badge-danger-fg)", border: "1px solid var(--badge-danger-border)" },
    purple:  { background: "var(--badge-purple-bg)", color: "var(--badge-purple-fg)", border: "1px solid var(--badge-purple-border)" },
    gray:    { background: "var(--badge-gray-bg)", color: "var(--badge-gray-fg)", border: "1px solid var(--badge-gray-border)" },
  };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={variants[variant] || variants.default}
    >
      {children}
    </span>
  );
};

/* ── Card ────────────────────────────────────── */
export const Card = ({ children, className = "", hover = false, onClick, delay = 0 }) => (
  <MotionDiv
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    onClick={onClick}
    whileHover={hover ? { y: -5, boxShadow: "0 10px 25px -5px rgba(255,109,52,0.15)" } : {}}
    className={`rounded-2xl ${className} ${hover ? 'cursor-pointer' : ''}`}
    style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      boxShadow: "var(--card-shadow)",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
  >
    {children}
  </MotionDiv>
);

/* ── StatCard (Enhanced) ─────────────────────── */
export const StatCard = ({ title, value, icon: _Icon, trend, color = "#ff6d34", subtitle, delay = 0 }) => (
  <Card hover className="p-6 transition-all duration-300" delay={delay}>
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-black">{value}</p>
          {subtitle && <span className="text-[10px] opacity-40 font-medium">{subtitle}</span>}
        </div>
      </div>
      <div className="p-2.5 rounded-xl transition-all group-hover:scale-110" style={{ color }}>
        <_Icon size={24} />
      </div>
    </div>
    
    {trend && (
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <TrendingUp size={12} style={{ color: "#00bea3" }} />
        <span className="text-[11px] font-bold" style={{ color: "#00bea3" }}>{trend}</span>
        <span className="text-[11px] opacity-40 font-medium ml-auto">Growth</span>
      </div>
    )}
  </Card>
);

/* ── Toggle ──────────────────────────────────── */
export const Toggle = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className="w-11 h-6 rounded-full relative transition-colors duration-200"
    style={{ background: checked ? "#ff6d34" : "var(--border)" }}
  >
    <div
      className="w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-transform duration-200"
      style={{ background: "var(--card)", transform: checked ? "translateX(24px)" : "translateX(4px)" }}
    />
  </button>
);

/* ── SectionHeader ───────────────────────────── */
export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
    <div className="min-w-0">
      <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>{title}</h2>
      {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0 w-full sm:w-auto">{action}</div>}
  </div>
);

/* ── PrimaryButton ───────────────────────────── */
export const PrimaryButton = ({ children, onClick, className = "", icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${className}`}
    style={{ background: "#ff6d34" }}
    onMouseEnter={e => e.currentTarget.style.background = "#e85d25"}
    onMouseLeave={e => e.currentTarget.style.background = "#ff6d34"}
  >
    {Icon && <Icon size={15} />}
    {children}
  </button>
);

/* ── GreenButton ─────────────────────────────── */
export const GreenButton = ({ children, onClick, className = "", icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${className}`}
    style={{ background: "#00bea3" }}
    onMouseEnter={e => e.currentTarget.style.background = "#00a38d"}
    onMouseLeave={e => e.currentTarget.style.background = "#00bea3"}
  >
    {Icon && <Icon size={15} />}
    {children}
  </button>
);

/* ── Input ───────────────────────────────────── */
export const Input = ({ label, icon: Icon, error, ...props }) => (
  <div className="space-y-1.5 font-sans">
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
    <div className="relative group transition-all duration-200">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Icon size={16} />
        </div>
      )}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${
          error ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'
        }`}
      />
    </div>
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

/* ── Modal ────────────────────────────────────── */
export const Modal = ({ isOpen, onClose, title, children, footer }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
        />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">{title}</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
            {footer && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);
