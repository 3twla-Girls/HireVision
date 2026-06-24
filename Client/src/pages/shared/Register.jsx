import { useState, useRef, useEffect } from "react";
import { assets } from "../../assets/assets";
import { Link, Navigate } from "react-router-dom";
import api from '../../api/axios'
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


/* ─────────────────────────────────────────────
   Only keyframe animations that Tailwind can't
   express natively — injected once, minimal.
───────────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Mulish:wght@300;400;500;600;700&display=swap');
  html,body,#root { height:100%; width:100%; overflow:hidden; font-family:'Mulish',sans-serif; }
  .font-sora { font-family:'Sora',sans-serif; }

  /* Panel slide — needs cubic-bezier Tailwind doesn't ship */
  .panel-slide { transition: transform 0.72s cubic-bezier(0.77,0,0.18,1); will-change: transform; }
  .slide-right  { transform: translateX(100%); }
  .slide-left   { transform: translateX(-100%); }

  /* Animations */
  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cardFloat{ 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(.3deg)} }
  @keyframes blobOne  { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-18px,20px) rotate(180deg)} }
  @keyframes blobTwo  { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(16px,-18px) rotate(-120deg)} }
  @keyframes blobThree{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(-12px,14px)} }
  @keyframes floatUp  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }

  .anim-fade-up    { animation: fadeUp 0.42s ease both; }
  .anim-card-float { animation: cardFloat 5.5s ease-in-out infinite; }
  .anim-blob-1     { animation: blobOne   9s  ease-in-out infinite; }
  .anim-blob-2     { animation: blobTwo   7s  ease-in-out infinite; }
  .anim-blob-3     { animation: blobThree 11s ease-in-out infinite; }
  .anim-float      { animation: floatUp   5s  ease-in-out infinite; }

  /* Conditional field slide (max-height trick) */
  .cond-field { max-height:0; opacity:0; transform:translateY(-6px); overflow:hidden;
    transition: max-height .5s cubic-bezier(.4,0,.2,1), opacity .4s ease, transform .4s ease; }
  .cond-field.open { max-height:300px; opacity:1; transform:translateY(0); }

  /* Focus-within for field icon colour */
  .input-group:focus-within .input-icon { color: #EE6C4D; }
  .input-group:focus-within { border-color:#EE6C4D; }

  /* Scrollbar hide */
  .no-scrollbar::-webkit-scrollbar { display:none; }
  .no-scrollbar { scrollbar-width:none; }

  /* password strength bar */
  .str-bar { transition: width .4s ease, background .4s ease; }
`;

/* ═══════════════════════════════════════
   REUSABLE COMPONENTS
═══════════════════════════════════════ */

/** Single input row with left icon */
const InputField = ({ icon, children, className = "" }) => (
  <div
    className={`input-group flex items-center bg-[#EEF1F5] border border-[#DDE2EA] rounded-xl overflow-hidden transition-colors duration-300 ${className}`}
  >
    <span className="input-icon flex-shrink-0 flex items-center px-3 text-[#b0bac8] transition-colors duration-300">
      {icon}
    </span>
    {children}
  </div>
);

const inputCls =
  "flex-1 py-3 pr-3 bg-transparent outline-none border-none text-sm text-[#1a2332] placeholder:text-[#6B7A8D] font-[Mulish]";

/** Orange CTA button */
const OrangeBtn = ({
  onClick,
  disabled,
  success,
  loading,
  children,
  className = "",
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      "w-full py-3.5 rounded-xl font-sora font-bold text-sm text-white border-none cursor-pointer",
      "flex items-center justify-center gap-2 transition-all duration-300",
      "hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97]",
      "disabled:opacity-80 disabled:cursor-not-allowed disabled:transform-none",
      success
        ? "bg-[#2ecc71] shadow-[0_4px_16px_rgba(46,204,113,.4)]"
        : "bg-[#FF6B35] shadow-[0_4px_18px_rgba(255,107,53,.35)] hover:bg-[#ff8555] hover:shadow-[0_8px_24px_rgba(255,107,53,.42)]",
      className,
    ].join(" ")}
  >
    {loading ? (
      <span className="w-[17px] h-[17px] border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
    ) : (
      children
    )}
  </button>
);

/** Password eye toggle */
const EyeToggle = ({ open, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="px-3 flex items-center text-[#b0bac8] hover:text-[#EE6C4D] transition-colors duration-300 bg-transparent border-none cursor-pointer"
    aria-label={open ? "Hide password" : "Show password"}
  >
    {open ? (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ) : (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )}
  </button>
);

/** Role radio chip */
const RoleChip = ({ value, label, current, onChange }) => {
  const active = current === value;
  return (
    <label
      className={[
        "flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer text-sm font-bold border-2",
        "transition-all duration-300 select-none",
        active
          ? "border-[#FF6B35] bg-[rgba(255,107,53,.08)] text-[#FF6B35]"
          : "border-[#DDE2EA] text-[#6B7A8D] hover:border-[#FF6B35] hover:text-[#FF6B35]",
      ].join(" ")}
    >
      <input
        type="radio"
        name="role"
        value={value}
        checked={active}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        className={[
          "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all duration-300",
          active
            ? "border-[#FF6B35] bg-[#FF6B35] shadow-[0_0_0_3px_rgba(255,107,53,.2)]"
            : "border-[#DDE2EA]",
        ].join(" ")}
      />
      {label}
    </label>
  );
};

/* ─── small SVG icons ─── */
const Icons = {
  User: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Mail: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  ),
  Lock: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Grad: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  Pin: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Cal: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Building: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Globe: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Img: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  Phone: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.89 3.37a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Google: () => (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  ),
  FB: () => (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
};

const SLIDES = [
  {
    t: "Discover opportunities",
    b: "Join HireVision to start your career journey. Connect with top companies or find the right talent for your team.",
  },
  {
    t: "Smart matching powered by AI",
    b: "Our system recommends the best jobs or candidates based on skills, experience, and preferences.",
  },
  {
    t: "Grow your career faster",
    b: "Access top opportunities, apply easily, and track your applications all in one place.",
  },
];

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function HireVision() {
  const [signin, setSignin] = useState(false);
  const [role, setRole] = useState("jobseeker");
  const [showP, setShowP] = useState(false);
  const [showLP, setShowLP] = useState(false);
  const [thumb, setThumb] = useState(null);
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [dot, setDot] = useState(0);
  const [fKey, setFKey] = useState(0);
  const fileRef = useRef();
  const navigate = useNavigate();
  const { login } = useAuth()
  /* inject minimal keyframes once */
  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = KEYFRAMES;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  /* password strength */
  const pwdStr = (() => {
    let n = 0;
    if (pwd.length >= 8) n++;
    if (/[A-Z]/.test(pwd)) n++;
    if (/[0-9]/.test(pwd)) n++;
    if (/[^A-Za-z0-9]/.test(pwd)) n++;
    return {
      w: pwd ? ["25%", "50%", "75%", "100%"][n - 1] || "6%" : "0",
      c: ["#e05252", "#FAB95B", "#5BBFBA", "#2ecc71"][n - 1] || "",
    };
  })();

  const handleFile = (f) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = (e) => setThumb(e.target.result);
    r.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    setLoading(true);

    if (signin) {
      // Sign-in logic
      const emailInput = document.querySelector(".signin-email");
      const passwordInput = document.querySelector(".signin-password");

      const email = emailInput?.value;
      const password = passwordInput?.value;

      if (!email || !password) {
        alert("Please enter both email and password.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.post("/user/login", {
          email,
          password
        });
      
        if (response.data.user) {
      
          // Clear old data
          sessionStorage.removeItem("user");
      
          // Save user + token
          sessionStorage.setItem("user", JSON.stringify(response.data.user));
          sessionStorage.setItem("token", response.data.access_token);
      
          // Update context
          login(response.data);
      
          if (response.data.user.role === "jobseeker") {
            navigate("/");
          } else if (response.data.user.role === "recruiter") {
            navigate("/job-management");
          }
      
        } else {
          alert("Invalid credentials");
        }
      
      } catch (error) {
        console.error("Login error:", error);
        alert("Invalid email or password");
      }finally {
        setLoading(false);
      }
    } else {
      // Registration logic
      const formData = new FormData();

      formData.append(
        "name",
        document.querySelector("input[placeholder='Full Name']").value,
      );
      formData.append(
        "email",
        document.querySelector("input[placeholder='Email']")?.value,
      );
      formData.append("password", pwd);
      formData.append("role", role);

      if (role === "jobseeker") {
        formData.append(
          "education",
          document.querySelector("input[placeholder='Education']")?.value,
        );
        formData.append(
          "location",
          document.querySelector("input[placeholder='Location']")?.value,
        );
        formData.append(
          "job_title",
          document.querySelector("input[placeholder='Job Title']")?.value,
        );
        formData.append(
          "date_of_birth",
          document.querySelector("input[type='date']")?.value,
        );
      } else if (role === "recruiter") {
        formData.append(
          "company_name",
          document.querySelector("input[placeholder='Company Name']")?.value,
        );
        formData.append(
          "company_web_link",
          document.querySelector("input[placeholder='Website URL']")?.value,
        );
        formData.append(
          "job_title",
          document.querySelector("input[placeholder='Job Title']")?.value,
        );
        formData.append(
          "location",
          document.querySelector("input[placeholder='Company Location']")
            ?.value,
        );
      }

      if (fileRef.current?.files[0]) {
        formData.append("image", fileRef.current.files[0]);
      }

      try {
        const response = await api.post(
          "/user/create",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        if (response.data.signal === "USER_CREATED_SUCCESSFULLY") {
          setOk(true);
          setTimeout(() => setOk(false), 1000);
        } else if (response.data.signal === "USER_ALREADY_EXISTS") {
          alert("Error: User already exists. Please try signing in.");
        } else {
          alert("Error: " + response.data.signal);
        }
      } catch (error) {
        console.error("Error creating user:", error);
        alert("An error occurred while creating the account.");
      } finally {
        setLoading(false);
      }
    }
  };

  const go = (toSignin) => {
    if (toSignin === signin) return;
    setSignin(toSignin);
    setOk(false);
    setLoading(false);
    setTimeout(() => setFKey((k) => k + 1), 450);
  };

  /* ── shared classes ── */
  const panelBase =
    "panel-slide absolute top-0 bottom-0 w-full md:w-1/2 overflow-hidden";

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f0f4f7]">
      {/* ════════════════════════════════════
          WHITE PANEL  (form)
          mobile: full width, stacks below dark
          desktop: left half, slides right on signin
      ════════════════════════════════════ */}
      <div
        className={`${panelBase} bg-white flex flex-col px-6 md:px-[4.5vw] z-10 left-0 order-2 md:order-1
          ${signin ? "slide-right" : ""}`}
      >
        {/* ── Logo ── */}
        <div className="flex-shrink-0 flex items-center pt-6 pb-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 no-underline"
            aria-label="HireVision home"
          >
            <img src={assets.logo} alt="" className="h-8 object-contain" />
            <span className="font-sora font-extrabold text-xl tracking-tight">
              <span className="text-[#2e5f82]">Hire</span>
              <span className="text-[#FF6B35]">Vision</span>
            </span>
          </Link>
        </div>

        {/* ── Scrollable form area ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-7">
          {/* ════════ REGISTER FORM ════════ */}
          {!signin && (
            <div className="anim-fade-up w-full" key={`reg-${fKey}`}>
              <h1 className="font-sora font-extrabold text-[clamp(1.7rem,3vw,2.1rem)] text-[#1a2332] leading-tight mb-1.5">
                Create an account
              </h1>
              <p className="text-sm text-[#6B7A8D] mb-5">
                Already have an account?{" "}
                <button
                  onClick={() => go(true)}
                  className="text-[#FF6B35] font-bold bg-transparent border-none cursor-pointer p-0 hover:underline"
                >
                  Sign in ›
                </button>
              </p>

              {/* Photo upload */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload profile photo"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                className="relative flex items-center justify-center gap-3.5 border-2 border-dashed border-[#DDE2EA] rounded-xl bg-[#EEF1F5] p-4 mb-4 cursor-pointer hover:border-[#EE6C4D] transition-colors duration-300"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <div className="w-11 h-11 rounded-full bg-white border border-[#DDE2EA] flex items-center justify-center overflow-hidden flex-shrink-0 text-[#b0bac8]">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icons.Img />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#6B7A8D]">
                    Drag &amp; Drop or
                  </span>
                  <span className="px-5 py-1.5 rounded-lg bg-[#2e5f82] text-white font-sora font-semibold text-xs">
                    Upload Image
                  </span>
                </div>
              </div>

              {/* Core fields */}
              <div className="flex flex-col gap-2.5 mb-3">
                <InputField icon={<Icons.User />}>
                  <input
                    className={inputCls}
                    type="text"
                    placeholder="Full Name"
                    autoComplete="name"
                  />
                </InputField>

                <InputField icon={<Icons.Mail />}>
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                  />
                </InputField>

                <InputField icon={<Icons.Lock />}>
                  <input
                    className={inputCls}
                    type={showP ? "text" : "password"}
                    placeholder="Password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                  />
                  <EyeToggle
                    open={showP}
                    onToggle={() => setShowP((v) => !v)}
                  />
                </InputField>

                {/* Password strength bar */}
                <div className="h-[3px] rounded-full bg-[#DDE2EA] overflow-hidden -mt-1">
                  <div
                    className="str-bar h-full rounded-full"
                    style={{ width: pwdStr.w, background: pwdStr.c }}
                  />
                </div>
              </div>

              {/* Role selector */}
              <fieldset className="border-none p-0 m-0 mb-3">
                <legend className="sr-only">I am a</legend>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-sm font-semibold text-[#6B7A8D] mr-2 whitespace-nowrap"
                    aria-hidden
                  >
                    I am a:
                  </span>
                  <RoleChip
                    value="jobseeker"
                    label="Job Seeker"
                    current={role}
                    onChange={setRole}
                  />
                  <RoleChip
                    value="recruiter"
                    label="Recruiter"
                    current={role}
                    onChange={setRole}
                  />
                </div>
              </fieldset>

              {/* Seeker-only fields */}
              <div
                className={`cond-field flex flex-col gap-2.5${role === "jobseeker" ? " open mb-3" : ""}`}
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <InputField icon={<Icons.Grad />}>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="Education"
                    />
                  </InputField>
                  <InputField icon={<Icons.Pin />}>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="Location"
                    />
                  </InputField>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <InputField icon={<Icons.Cal />}>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="Job Title"
                    />
                  </InputField>
                  <InputField icon={<Icons.Cal />}>
                    <input
                      className={`${inputCls} text-[#6B7A8D]`}
                      type="date"
                    />
                  </InputField>
                </div>
              </div>

              {/* Recruiter-only fields */}
              <div
                className={`cond-field flex flex-col gap-2.5${role === "recruiter" ? " open mb-3" : ""}`}
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <InputField icon={<Icons.Building />}>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="Company Name"
                    />
                  </InputField>
                  <InputField icon={<Icons.Globe />}>
                    <input
                      className={inputCls}
                      type="url"
                      placeholder="Website URL"
                    />
                  </InputField>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <InputField icon={<Icons.Cal />}>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="Job Title"
                    />
                  </InputField>
                  <InputField icon={<Icons.Pin />}>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="Company Location"
                    />
                  </InputField>
                </div>
              </div>

              <OrangeBtn
                onClick={handleSubmit}
                disabled={loading}
                success={ok}
                loading={loading}
              >
                {ok
                  ? "✓ Account Created!"
                  : "Continue your career journey with ease ›"}
              </OrangeBtn>
            </div>
          )}

          {/* ════════ SIGN IN FORM ════════ */}
          {signin && (
            <div
              className="anim-fade-up w-full flex flex-col justify-center"
              style={{ minHeight: "calc(100vh - 120px)" }}
              key={`login-${fKey}`}
            >
              <div className="w-full max-w-md">
                <h1 className="font-sora font-extrabold text-[clamp(1.7rem,3vw,2.1rem)] text-[#1a2332] leading-tight mb-1.5">
                  Welcome back!
                </h1>
                <p className="text-sm text-[#6B7A8D] mb-8">
                  Don't have an account?{" "}
                  <button
                    onClick={() => go(false)}
                    className="text-[#FF6B35] font-bold bg-transparent border-none cursor-pointer p-0 hover:underline"
                  >
                    Sign up ›
                  </button>
                </p>

                <div className="flex flex-col gap-3 mb-2">
                  <InputField icon={<Icons.Mail />}>
                    <input
                      className={`${inputCls} signin-email`}
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                    />
                  </InputField>

                  <InputField icon={<Icons.Lock />}>
                    <input
                      className={`${inputCls} signin-password`}
                      type={showLP ? "text" : "password"}
                      placeholder="Password"
                    />
                    <EyeToggle
                      open={showLP}
                      onToggle={() => setShowLP((v) => !v)}
                    />
                  </InputField>
                </div>

                <div className="text-right mb-7">
                  <a
                    href="#"
                    className="text-sm font-semibold text-[#FF6B35] hover:text-[#1B3C53] transition-colors no-underline"
                  >
                    Forgot password?
                  </a>
                </div>

                <OrangeBtn
                  onClick={handleSubmit}
                  disabled={loading}
                  success={ok}
                  loading={loading}
                >
                  {ok ? "✓ Signed In!" : "Sign In ›"}
                </OrangeBtn>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════
          DARK PANEL  (visual)
          mobile: top of stack (hidden on xs, shown md+)
          desktop: right half, slides left on signin
      ════════════════════════════════════ */}
      <div
        className={`${panelBase} hidden md:flex flex-col left-1/2 order-1 md:order-2
          ${signin ? "slide-left" : ""}`}
        style={{
          background:
            "linear-gradient(160deg,#1e4a6b 0%,#2e6a94 48%,#1a4a64 100%)",
        }}
      >
        {/* Deco blobs */}
        <div className="anim-blob-1 absolute w-[280px] h-[280px] rounded-full pointer-events-none blur-[1px] -top-20 -right-20 bg-[rgba(91,191,186,.1)]" />
        <div className="anim-blob-2 absolute w-[200px] h-[200px] rounded-full pointer-events-none blur-[1px] -bottom-16 -left-16 bg-[rgba(255,107,53,.09)]" />
        <div className="anim-blob-3 absolute w-[130px] h-[130px] rounded-full pointer-events-none blur-[1px] top-[42%] right-[8%] bg-[rgba(255,255,255,.05)]" />

        {/* Support link */}
        <div className="flex-shrink-0 flex justify-end items-center gap-2 px-8 pt-6 pb-0 text-sm font-semibold text-white/70 cursor-pointer hover:text-white transition-colors duration-300 relative z-10">
          <Icons.Phone /> Support
        </div>

        {/* Card + text — same in both modes */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-6 gap-6 relative z-10">
          {/* Promo card */}
          <div className="anim-card-float bg-white rounded-2xl p-7 w-full max-w-[480px] flex gap-4 items-center shadow-[0_20px_60px_rgba(0,0,0,.18)]">
            <div className="flex-1 flex flex-col">
              <h2 className="font-sora font-extrabold text-[#FF6B35] text-base leading-snug mb-2">
                Find your dream job
                <br />
                or the perfect candidate
              </h2>
              <p className="text-xs text-[#6B7A8D] leading-relaxed mb-4">
                Join HireVision to start your career journey. Connect with top
                companies or <strong>find</strong> the right talent for your
                team.
              </p>
              <button
                onClick={() => go(!signin)}
                className="self-start px-7 py-2.5 rounded-full bg-[#FF6B35] hover:bg-[#ff8555] text-white font-sora font-bold text-sm border-none cursor-pointer shadow-[0_4px_16px_rgba(255,107,53,.38)] transition-all duration-300 hover:scale-105"
              >
                {signin ? "Sign Up" : "Sign In"}
              </button>
            </div>
            <div className="flex-shrink-0 w-[44%] flex items-center justify-center">
              <img
                src={assets.interview_rigster_icon}
                alt="Interview illustration"
                className="w-full max-w-[200px] h-auto object-contain"
              />
            </div>
          </div>

          {/* Slide text */}
          <div className="w-full max-w-[480px]">
            <h3 className="font-sora font-extrabold text-white text-xl leading-snug mb-2">
              {SLIDES[dot].t}
            </h3>
            <p className="text-[13px] text-white/60 leading-relaxed">
              {SLIDES[dot].b}
            </p>

            {/* Dot nav */}
            <div className="flex items-center gap-2.5 mt-3">
              <button
                aria-label="Previous slide"
                onClick={() => setDot((d) => (d - 1 + 3) % 3)}
                className="bg-transparent border-none cursor-pointer text-white/40 hover:text-white text-sm transition-colors px-0.5"
              >
                ‹
              </button>

              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setDot(i)}
                  className={[
                    "w-2 h-2 rounded-full border-none cursor-pointer transition-all duration-300",
                    dot === i
                      ? "bg-[#FF6B35] shadow-[0_0_0_3px_rgba(255,107,53,.28)]"
                      : "bg-white/30 hover:bg-white/50",
                  ].join(" ")}
                />
              ))}

              <button
                aria-label="Next slide"
                onClick={() => setDot((d) => (d + 1) % 3)}
                className="bg-transparent border-none cursor-pointer text-white/40 hover:text-white text-sm transition-colors px-0.5"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
