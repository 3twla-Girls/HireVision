import React, { useState, useEffect } from "react";
import { PhoneCall, Menu, X } from "lucide-react";
import Logo from "../../assets/HireLogo.png";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const [scrolled, setScrolled] = useState(false);

  const navLinks = [
    { name: "Home", sectionId: "section-home" },
    { name: "About", sectionId: "section-about" },
    { name: "For Jobseeker", sectionId: "section-jobseeker" },
    { name: "For Recruiters", sectionId: "section-recruiters" },
  ];

  // Subtle shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight active section on scroll
  useEffect(() => {
    const onScroll = () => {
      for (let i = navLinks.length - 1; i >= 0; i--) {
        const el = document.getElementById(navLinks[i].sectionId);
        if (el && window.scrollY >= el.offsetTop - 100) {
          setActiveLink(navLinks[i].name);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (sectionId, name) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 72; // navbar height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setActiveLink(name);
    setIsOpen(false);
  };

  return (
    <>
      <style>{`
        .nav-link {
          position: relative;
          padding: 6px 2px;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.25s ease;
          background: none;
          border: none;
          outline: none;
          font-family: inherit;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0%;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, #FF6B35, #ff9a6c);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-link:hover {
          color: #FF6B35;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .nav-link.active {
          color: #FF6B35;
        }
        .nav-link.active::after {
          width: 100%;
        }

        /* Mobile link */
        .mobile-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          background: none;
          border: none;
          outline: none;
          width: 100%;
          text-align: left;
          font-family: inherit;
          transition: background 0.2s ease, color 0.2s ease, padding-left 0.2s ease;
        }
        .mobile-link:hover, .mobile-link.active {
          background: #fff5f1;
          color: #FF6B35;
          padding-left: 20px;
        }
        .mobile-link .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FF6B35;
          opacity: 0;
          transition: opacity 0.2s ease;
          flex-shrink: 0;
        }
        .mobile-link:hover .dot, .mobile-link.active .dot {
          opacity: 1;
        }

        /* Mobile drawer slide-in */
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mobile-drawer {
          animation: slideDown 0.22s ease forwards;
        }
      `}</style>

      <nav
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #f1f5f9",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "0 24px",
          boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.07)" : "none",
          transition: "box-shadow 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "68px",
          }}
        >
          {/* Logo */}
          <div
            onClick={() => scrollToSection("section-home", "Home")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <img
              src={Logo}
              alt="HireVision Logo"
              style={{ height: "40px", width: "auto" }}
            />
            <span
              style={{
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#0F2C59",
              }}
            >
              Hire<span style={{ color: "#FF6B35" }}>Vision</span>
            </span>
          </div>

          {/* Desktop links */}
          <ul
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
            className="hidden-mobile"
          >
            {navLinks.map((link) => (
              <li key={link.name}>
                <button
                  className={`nav-link ${activeLink === link.name ? "active" : ""}`}
                  onClick={() => scrollToSection(link.sectionId, link.name)}
                >
                  {link.name}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop actions */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "20px" }}
            className="hidden-mobile"
          >
            <button
              onClick={() => scrollToSection("section-contact", "Contact")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#334155",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.2s ease",
                padding: 0,
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B35")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#334155")}
            >
              <PhoneCall size={15} style={{ color: "#0F2C59" }} />
              Support
            </button>

            <button
              style={{
                border: "1.5px solid rgba(255,107,53,0.35)",
                background: "rgba(255,107,53,0.04)",
                color: "#FF6B35",
                fontWeight: 700,
                fontSize: "14px",
                padding: "9px 22px",
                borderRadius: "100px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FF6B35";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(255,107,53,0.35)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,107,53,0.04)";
                e.currentTarget.style.color = "#FF6B35";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onClick={() => {
                navigate("/register");
              }}
            >
              Sign In
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#0F2C59",
              padding: "4px",
              display: "none",
            }}
            className="show-mobile"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {isOpen && (
          <div
            className="mobile-drawer"
            style={{
              position: "absolute",
              top: "68px",
              left: 0,
              right: 0,
              background: "#ffffff",
              borderBottom: "1px solid #f1f5f9",
              boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
              padding: "12px 20px 24px",
              zIndex: 49,
            }}
          >
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {navLinks.map((link) => (
                <li key={link.name}>
                  <button
                    className={`mobile-link ${activeLink === link.name ? "active" : ""}`}
                    onClick={() => scrollToSection(link.sectionId, link.name)}
                  >
                    <span className="dot" />
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>

            <div
              style={{
                marginTop: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#334155",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <PhoneCall size={15} style={{ color: "#0F2C59" }} />
                Support
              </button>
              <button
                style={{
                  border: "1.5px solid rgba(255,107,53,0.35)",
                  background: "rgba(255,107,53,0.04)",
                  color: "#FF6B35",
                  fontWeight: 700,
                  fontSize: "14px",
                  padding: "9px 24px",
                  borderRadius: "100px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onClick={() => {
                  navigate("/register");
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 1024px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: block !important; }
        }
        @media (min-width: 1025px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
