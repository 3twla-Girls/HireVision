import React, { useEffect, useRef, useState } from "react";
import { Mail, ArrowUpRight, Copy, Check } from "lucide-react";

function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

const EMAIL = "hirevision.recruitment@gmail.com";

// ── Floating email button (fixed on page) ──────────────────────────────────
export default function FloatingEmailButton() {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "10px",
      }}
    >
      {/* Expanded email chip */}
      {expanded && (
        <div
          style={{
            background: "#1B3C53",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            animation: "popIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: 600 }}>
            {EMAIL}
          </span>
          <button
            onClick={handleCopy}
            title="Copy email"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              padding: "5px 8px",
              cursor: "pointer",
              color: copied ? "#4ade80" : "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: 600,
              transition: "all 0.2s ease",
              fontFamily: "inherit",
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <a
            href={`mailto:${EMAIL}`}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              padding: "5px 10px",
              cursor: "pointer",
              color: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            Open <ArrowUpRight size={12} />
          </a>
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setExpanded(!expanded)}
        title="Contact us by email"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: expanded
            ? "#163144"
            : "linear-gradient(135deg, #1B3C53 0%, #245270 100%)",
          border: "1.5px solid rgba(255,255,255,0.15)",
          boxShadow: "0 6px 24px rgba(27,60,83,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#ffffff",
          transition: "all 0.25s ease",
          transform: expanded ? "rotate(45deg)" : "rotate(0deg)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = expanded ? "rotate(45deg) scale(1.08)" : "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 10px 32px rgba(27,60,83,0.65)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = expanded ? "rotate(45deg)" : "rotate(0deg)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(27,60,83,0.5)";
        }}
      >
        <Mail size={22} />
      </button>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}

