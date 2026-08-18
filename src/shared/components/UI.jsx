// ════════════════════════════════════════════════════════════
// SHARED — UI.jsx
// ════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { TrendingUp, X } from "lucide-react";

// ── Brand Colors ──────────────────────────────────────────

export const BRAND = {
  orange: "#ff6d34",
  green: "#00bea3",
  dark: "#2D3436",
  orangeLight: "#fff3ee",
  greenLight: "#e6faf8",
};


// ── Avatar ────────────────────────────────────────────────

export const Avatar = ({ initials, size = "md" }) => {

  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl",
  };

  return (
    <div
      className={`${sizes[size] || sizes.md} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{
        background:
          "linear-gradient(135deg, #ff6d34, #00bea3)",
      }}
    >
      {initials}
    </div>
  );
};


// ── Badge ────────────────────────────────────────────────

export const Badge = ({
  children,
  variant = "default",
}) => {

  const variants = {
    default: {
      background: "var(--badge-default-bg)",
      color: "var(--badge-default-fg)",
      border: "1px solid var(--badge-default-border)",
    },

    success: {
      background: "var(--badge-success-bg)",
      color: "var(--badge-success-fg)",
      border: "1px solid var(--badge-success-border)",
    },

    warning: {
      background: "var(--badge-warning-bg)",
      color: "var(--badge-warning-fg)",
      border: "1px solid var(--badge-warning-border)",
    },

    danger: {
      background: "var(--badge-danger-bg)",
      color: "var(--badge-danger-fg)",
      border: "1px solid var(--badge-danger-border)",
    },

    purple: {
      background: "var(--badge-purple-bg)",
      color: "var(--badge-purple-fg)",
      border: "1px solid var(--badge-purple-border)",
    },

    gray: {
      background: "var(--badge-gray-bg)",
      color: "var(--badge-gray-fg)",
      border: "1px solid var(--badge-gray-border)",
    },
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


// ── Card ─────────────────────────────────────────────────

export const Card = ({
  children,
  className = "",
  hover = false,
  onClick,
}) => (

  <div
    onClick={onClick}
    className={`rounded-2xl ${className} ${
      hover ? "cursor-pointer" : ""
    }`}
    style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      boxShadow: "var(--card-shadow)",
      transition:
        "transform 0.2s ease, box-shadow 0.2s ease",
    }}
  >
    {children}
  </div>

);


// ── StatCard ─────────────────────────────────────────────

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "#ff6d34",
  subtitle,
}) => (

  <Card
    hover
    className="p-6 transition-all duration-300"
  >

    <div className="flex items-center justify-between">

      <div className="space-y-1">

        <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">
          {title}
        </p>

        <div className="flex items-baseline gap-1">

          <p className="text-2xl font-black">
            {value}
          </p>

          {subtitle && (
            <span className="text-[10px] opacity-40 font-medium">
              {subtitle}
            </span>
          )}

        </div>

      </div>


      {Icon && (
        <div
          className="p-2.5 rounded-xl"
          style={{ color }}
        >
          <Icon size={24} />
        </div>
      )}

    </div>


    {trend && (

      <div
        className="flex items-center gap-1.5 mt-3 pt-3 border-t"
        style={{
          borderColor:
            "rgba(255,255,255,0.05)",
        }}
      >

        <TrendingUp
          size={12}
          style={{ color: "#00bea3" }}
        />

        <span
          className="text-[11px] font-bold"
          style={{ color: "#00bea3" }}
        >
          {trend}
        </span>

        <span className="text-[11px] opacity-40 font-medium ml-auto">
          Growth
        </span>

      </div>

    )}

  </Card>

);


// ── Toggle ───────────────────────────────────────────────

export const Toggle = ({
  checked,
  onChange,
}) => (

  <button
    type="button"
    onClick={onChange}
    className="w-11 h-6 rounded-full relative transition-colors duration-200"
    style={{
      background:
        checked ? "#ff6d34" : "var(--border)",
    }}
  >

    <div
      className="w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-transform duration-200"
      style={{
        background: "var(--card)",
        transform: checked
          ? "translateX(24px)"
          : "translateX(4px)",
      }}
    />

  </button>

);


// ── SectionHeader ────────────────────────────────────────

export const SectionHeader = ({
  title,
  subtitle,
  action,
}) => (

  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">

    <div className="min-w-0">

      <h2
        className="text-xl font-bold"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="text-sm mt-0.5"
          style={{ color: "var(--muted)" }}
        >
          {subtitle}
        </p>
      )}

    </div>


    {action && (
      <div className="flex-shrink-0 w-full sm:w-auto">
        {action}
      </div>
    )}

  </div>

);


// ── PrimaryButton ────────────────────────────────────────

export const PrimaryButton = ({
  children,
  onClick,
  className = "",
  icon: Icon,
  type = "button",
  disabled = false,
}) => (

  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${className}`}
    style={{
      background: disabled
        ? "#cbd5e1"
        : "#ff6d34",
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.background =
          "#e85d25";
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.background =
          "#ff6d34";
      }
    }}
  >

    {Icon && <Icon size={15} />}

    {children}

  </button>

);


// ── GreenButton ──────────────────────────────────────────

export const GreenButton = ({
  children,
  onClick,
  className = "",
  icon: Icon,
  type = "button",
  disabled = false,
}) => (

  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${className}`}
    style={{
      background: disabled
        ? "#cbd5e1"
        : "#00bea3",
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.background =
          "#00a38d";
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.background =
          "#00bea3";
      }
    }}
  >

    {Icon && <Icon size={15} />}

    {children}

  </button>

);


// ── Input ────────────────────────────────────────────────

export const Input = ({
  label,
  icon: Icon,
  error,
  ...props
}) => (

  <div className="space-y-1.5 font-sans">

    {label && (
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
    )}


    <div className="relative group transition-all duration-200">

      {Icon && (

        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">

          <Icon size={16} />

        </div>

      )}


      <input
        {...props}
        className={`w-full ${
          Icon ? "pl-10" : "pl-4"
        } pr-4 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${
          error
            ? "border-red-500 bg-red-50"
            : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
        }`}
      />

    </div>


    {error && (
      <p className="text-xs text-red-500 font-medium">
        {error}
      </p>
    )}

  </div>

);


// ── Modal ────────────────────────────────────────────────
// Single clean Modal implementation.
// The previous file contained three overlapping Modal
// implementations.

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {

  const modalRef = useRef(null);


  useEffect(() => {

    if (!isOpen) return;


    const handleEscape = (event) => {

      if (event.key === "Escape") {
        onClose?.();
      }

    };


    const trapFocus = (event) => {

      if (event.key !== "Tab") {
        return;
      }


      const modal =
        modalRef.current;

      if (!modal) {
        return;
      }


      const focusable =
        modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );


      if (!focusable.length) {
        return;
      }


      const first =
        focusable[0];

      const last =
        focusable[focusable.length - 1];


      if (
        event.shiftKey &&
        document.activeElement === first
      ) {

        event.preventDefault();
        last.focus();

      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {

        event.preventDefault();
        first.focus();

      }

    };


    document.addEventListener(
      "keydown",
      handleEscape
    );

    document.addEventListener(
      "keydown",
      trapFocus
    );


    return () => {

      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.removeEventListener(
        "keydown",
        trapFocus
      );

    };

  }, [isOpen, onClose]);


  if (!isOpen) {
    return null;
  }


  return (

    <>

      {/* Backdrop */}

      <div
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
      />


      {/* Modal container */}

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">

        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="skillnova-modal-title"
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
        >

          {/* Header */}

          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">

            <h3
              id="skillnova-modal-title"
              className="font-bold text-lg text-slate-900"
            >
              {title}
            </h3>


            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              type="button"
              aria-label="Close modal"
            >

              <X size={18} />

            </button>

          </div>


          {/* Content */}

          <div className="p-6">
            {children}
          </div>


          {/* Footer */}

          {footer && (

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">

              {footer}

            </div>

          )}

        </div>

      </div>

    </>

  );

};


// ── Tooltip ──────────────────────────────────────────────

export const Tooltip = ({
  children,
  content,
  side = "top",
}) => {

  const [show, setShow] =
    useState(false);


  const positions = {

    top:
      "bottom-full left-1/2 -translate-x-1/2 mb-2",

    bottom:
      "top-full left-1/2 -translate-x-1/2 mt-2",

    left:
      "right-full top-1/2 -translate-y-1/2 mr-2",

    right:
      "left-full top-1/2 -translate-y-1/2 ml-2",

  };


  if (!content) {
    return children;
  }


  return (

    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >

      {children}


      {show && (

        <span
          className={`absolute z-50 px-2.5 py-1.5 text-xs font-medium rounded-lg shadow-lg whitespace-nowrap pointer-events-none ${
            positions[side] || positions.top
          }`}
          style={{
            background: "#1f2937",
            color: "#f9fafb",
          }}
          role="tooltip"
        >
          {content}
        </span>

      )}

    </span>

  );

};