// ══════════════════════════════════════════════
//  SHARED — UI.jsx  (UptoSkills Branded)
// ══════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, X, CheckSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MotionDiv = motion.div;

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
    whileHover={hover ? { y: -4, boxShadow: "0 12px 28px -6px rgba(255,109,52,0.18)" } : {}}
    className={`rounded-2xl ${className} ${hover ? 'cursor-pointer' : ''}`}
    style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      boxShadow: "var(--card-shadow)",
      transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.22s ease",
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
export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', trapFocus);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', trapFocus);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
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
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-label={title}
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
};

/* ── Tooltip ──────────────────────────────────── */
export const Tooltip = ({ children, content, side = 'top' }) => {
  const [show, setShow] = useState(false);
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  if (!content) return children;

  return (
    <span className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}>
      {children}
      {show && (
        <span className={`absolute z-50 px-2.5 py-1.5 text-xs font-medium rounded-lg shadow-lg whitespace-nowrap pointer-events-none ${positions[side]}`}
          style={{ background: '#1f2937', color: '#f9fafb' }}
          role="tooltip">
          {content}
        </span>
      )}
    </span>
  );
};
