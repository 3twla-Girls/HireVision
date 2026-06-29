import React, { useEffect, useRef, useState } from "react";
import {
  Briefcase,
  Target,
  BarChart2,
  Users,
  Zap,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: <Briefcase className="w-5 h-5" />,
    title: "Post Jobs Instantly",
    desc: "Publish listings in seconds and reach thousands of qualified candidates actively seeking their next role.",
    accent: "#FF5533",
    glow: "rgba(255,85,51,0.25)",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Smart Candidate Matching",
    desc: "Our AI surfaces the most relevant applicants based on skills, experience, and cultural fit no manual filtering.",
    accent: "#7C6FFF",
    glow: "rgba(124,111,255,0.25)",
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    title: "Real-Time Analytics",
    desc: "Track views, applications, and conversion rates for every listing from a single, actionable dashboard.",
    accent: "#00D4A8",
    glow: "rgba(0,212,168,0.25)",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Talent Pool Management",
    desc: "Save, tag, and organize candidate profiles into custom pools so your best prospects are always one click away.",
    accent: "#FF9F1C",
    glow: "rgba(255,159,28,0.25)",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Automated Outreach",
    desc: "Send personalized interview invites and follow-ups automatically keep candidates engaged without extra effort.",
    accent: "#FF5533",
    glow: "rgba(255,85,51,0.25)",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Verified Profiles Only",
    desc: "Every candidate goes through identity and credential verification so you only engage trustworthy applicants.",
    accent: "#00D4A8",
    glow: "rgba(0,212,168,0.25)",
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

function FeatureCard({ feature, index, inView }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0px)" : "translateY(36px)",
        transition: `opacity 0.65s ease ${index * 90}ms, transform 0.65s ease ${index * 90}ms`,
        position: "relative",
        borderRadius: "16px",
        padding: "1.5px",
        background: hovered
          ? `linear-gradient(135deg, ${feature.accent}, transparent 60%)`
          : "linear-gradient(135deg, rgba(0,0,0,0.07), rgba(0,0,0,0.03))",
        boxShadow: hovered ? `0 8px 40px ${feature.glow}` : "0 1px 3px rgba(0,0,0,0.06)",
        cursor: "default",
        transitionProperty: "box-shadow, background",
        transitionDuration: "0.4s",
      }}
    >
      {/* Inner card surface */}
      <div
        style={{
          background: hovered ? "#FFFFFF" : "#FAFAFA",
          borderRadius: "14.5px",
          padding: "28px",
          height: "100%",
          transition: "background 0.4s ease",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: `${feature.accent}18`,
            border: `1px solid ${feature.accent}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: feature.accent,
            marginBottom: "20px",
            transition: "transform 0.3s ease, background 0.3s ease",
            transform: hovered ? "scale(1.08)" : "scale(1)",
          }}
        >
          {feature.icon}
        </div>

        {/* Title */}
        <h3
          style={{
            color: "#111827",
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "-0.01em",
            marginBottom: "10px",
          }}
        >
          {feature.title}
        </h3>

        {/* Desc */}
        <p
          style={{
            color: "#6B7280",
            fontSize: "13.5px",
            lineHeight: "1.7",
          }}
        >
          {feature.desc}
        </p>

        {/* Hover accent line */}
        <div
          style={{
            marginTop: "24px",
            height: "2px",
            borderRadius: "2px",
            background: feature.accent,
            width: hovered ? "40px" : "0px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function Recruiter() {
  const [headerRef, headerInView] = useInView(0.1);
  const [cardsRef, cardsInView] = useInView(0.05);

  return (
    <section
      style={{
        width: "100%",
        background: "#F3F4F6",
        padding: "100px 24px",
        overflowX: "hidden",
        position: "relative",
      }}

      id="section-recruiters"
    >
      {/* Ambient blobs */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,85,51,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "60px",
          left: "-120px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,111,255,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1120px", margin: "0 auto", position: "relative" }}>

        {/* Header — offset two-column layout */}
        <div
          ref={headerRef}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            alignItems: "flex-end",
            marginBottom: "72px",
            opacity: headerInView ? 1 : 0,
            transform: headerInView ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
          className="recruiter-header"
        >
          {/* Left: badge + headline */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,85,51,0.1)",
                border: "1px solid rgba(255,85,51,0.25)",
                color: "#FF5533",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "6px 14px",
                borderRadius: "100px",
                marginBottom: "24px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#FF5533",
                  display: "inline-block",
                  animation: "pulse 2s infinite",
                }}
              />
              For Recruiters
            </div>

            <h2
              style={{
                color: "#111827",
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 900,
                letterSpacing: "-0.035em",
                lineHeight: "1.05",
                margin: 0,
              }}
            >
              Hire smarter
              <br />
              <span style={{ color: "#FF5533" }}>Not harder</span>
            </h2>
          </div>

          {/* Right: description + divider */}
          <div
            style={{
              paddingBottom: "4px",
              borderLeft: "1px solid rgba(0,0,0,0.08)",
              paddingLeft: "40px",
            }}
          >
            <p
              style={{
                color: "#6B7280",
              }}
            >
              Everything you need to find, evaluate, and hire top talent all in one place, built for speed.
            </p>
            <div
              style={{
                display: "flex",
                gap: "32px",
              }}
            >
              {[
                { value: "50k+", label: "Active candidates" },
                { value: "3×", label: "Faster time-to-hire" },
                { value: "98%", label: "Profile accuracy" },
              ].map((s, i) => (
                <div key={i}>
                  <p
                    style={{
                      color: "#FF5533",
                      fontSize: "22px",
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      margin: "0 0 2px 0",
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    style={{
                      color: "#9CA3AF",
                      fontSize: "12px",
                      margin: 0,
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.08) 70%, transparent)",
            marginBottom: "56px",
          }}
        />

        {/* Feature Cards */}
        <div
          ref={cardsRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} inView={cardsInView} />
          ))}
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 700px) {
          .recruiter-header {
            grid-template-columns: 1fr !important;
          }
          .recruiter-header > div:last-child {
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1px solid rgba(255,255,255,0.06);
            padding-top: 32px;
          }
        }
      `}</style>
    </section>
  );
}