import { useState, useEffect, useRef, useCallback } from "react";

// ── MOCK DATA ──────────────────────────────────────────────────────────────
const BRANCHES = [
  { id:1, name:"GCB Bank — Accra Central",     type:"Bank",             distance:"0.4 km", counters:4, open:3, serving:87,  queue:14, avgWait:5,  lat:5.551, lng:-0.201, transactions:["Withdrawal","Deposit","Loan Inquiry","Account Opening"] },
  { id:2, name:"Korle-Bu OPD",                  type:"Hospital",         distance:"1.2 km", counters:5, open:4, serving:43,  queue:22, avgWait:8,  lat:5.532, lng:-0.228, transactions:["OPD Visit","Lab Test","Pharmacy","Specialist Consult"] },
  { id:3, name:"MTN Service Centre — Accra",    type:"Network Provider", distance:"1.8 km", counters:3, open:2, serving:19,  queue:9,  avgWait:6,  lat:5.560, lng:-0.195, transactions:["SIM Replacement","MoMo Issue","Data Plan","Device Support"] },
  { id:4, name:"DVLA — Headquarters",           type:"DVLA",             distance:"2.1 km", counters:3, open:2, serving:61,  queue:17, avgWait:10, lat:5.574, lng:-0.172, transactions:["Licence Renewal","Roadworthy","Registration","Learner's Permit"] },
  { id:5, name:"Ecobank — Ring Road",            type:"Bank",             distance:"2.6 km", counters:3, open:3, serving:104, queue:7,  avgWait:5,  lat:5.563, lng:-0.186, transactions:["Withdrawal","Deposit","Forex","Account Opening"] },
  { id:6, name:"Vodafone — Osu Branch",          type:"Network Provider", distance:"3.0 km", counters:2, open:2, serving:31,  queue:5,  avgWait:7,  lat:5.555, lng:-0.177, transactions:["SIM Issues","Fibre Setup","Billing","Broadband Support"] },
  { id:7, name:"Passport Office — Airport",      type:"Government",       distance:"3.4 km", counters:4, open:3, serving:28,  queue:19, avgWait:12, lat:5.605, lng:-0.166, transactions:["New Application","Renewal","Emergency Passport","Collection"] },
  { id:8, name:"NHIS — Accra District Office",  type:"Government",       distance:"3.9 km", counters:2, open:2, serving:72,  queue:11, avgWait:7,  lat:5.549, lng:-0.208, transactions:["New Registration","Renewal","Claims Query","Card Replacement"] },
];

const TYPE_COLORS = {
  "Bank":             { bg:"#FFF7ED", accent:"#EA580C", dark:"#431407" },
  "Hospital":         { bg:"#F0FDF4", accent:"#16A34A", dark:"#14532D" },
  "Network Provider": { bg:"#FFF1F2", accent:"#E11D48", dark:"#4C0519" },
  "DVLA":             { bg:"#EFF6FF", accent:"#2563EB", dark:"#1E3A8A" },
  "Government":       { bg:"#FAF5FF", accent:"#7C3AED", dark:"#2E1065" },
};

const TYPE_ICONS = { "Bank":"🏦", "Hospital":"🏥", "Network Provider":"📱", "DVLA":"🚗", "Government":"🏛️" };

function waitColor(mins) {
  if (mins <= 10) return "#16A34A";
  if (mins <= 25) return "#CA8A04";
  return "#DC2626";
}

function waitLabel(mins) {
  if (mins <= 10) return "Short Wait";
  if (mins <= 25) return "Moderate Wait";
  return "Long Wait";
}

function predictWait(queue, avgWait, counters) {
  return Math.ceil((queue * avgWait) / Math.max(counters, 1));
}

// ── THEME ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F8FAFC", surface: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", muted: "#64748B", accent: "#0E8A5C",
  nav: "#FFFFFF", card: "#FFFFFF", input: "#F1F5F9",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
  shadowLg: "0 10px 40px rgba(0,0,0,0.10)",
};
const DARK = {
  bg: "#0A0F1E", surface: "#111827", border: "#1E293B",
  text: "#F1F5F9", muted: "#94A3B8", accent: "#10B981",
  nav: "#060C18", card: "#1E293B", input: "#0F172A",
  shadow: "0 1px 3px rgba(0,0,0,0.4)", shadowLg: "0 10px 40px rgba(0,0,0,0.5)",
};

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState("landing");
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState(BRANCHES);
  const [myTicket, setMyTicket] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedTx, setSelectedTx] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [signupForm, setSignupForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [signinForm, setSigninForm] = useState({ email:"", password:"" });
  const [formError, setFormError] = useState("");
  const [lang, setLang] = useState("EN");
  const [staffBranch] = useState(BRANCHES[0]);
  const [callLog, setCallLog] = useState([]);
  const intervalRef = useRef(null);

  // Branch modal state
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const emptyForm = { name:"", type:"Bank", distance:"0.0 km", counters:2, open:2, avgWait:5, serving:1, queue:0 };
  const [branchForm, setBranchForm] = useState(emptyForm);

  // Staff modal state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const emptyStaffForm = { name:"", email:"", branch:"", counter:"1" };
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [staffList, setStaffList] = useState([
    { name:"Ama Asante",   email:"ama@gcbbank.com",      branch:"GCB Bank — Accra Central",   counter:"Counter 2", status:"active"   },
    { name:"Yaw Darko",    email:"yaw@dvla.gov.gh",      branch:"DVLA — Headquarters",         counter:"Counter 1", status:"active"   },
    { name:"Efua Mensah",  email:"efua@nhis.gov.gh",     branch:"NHIS — Accra District Office",counter:"Counter 3", status:"inactive" },
  ]);

  const T = dark ? DARK : LIGHT;

  // simulate queue movement
  useEffect(() => {
    if (!role) return;
    intervalRef.current = setInterval(() => {
      setBranches(prev => prev.map(b => {
        if (b.queue === 0) return b;
        const advance = Math.random() > 0.5;
        if (!advance) return b;
        const newServing = b.serving + 1;
        const newQueue = Math.max(0, b.queue - 1);
        if (myTicket && myTicket.branchId === b.id) {
          const newAhead = Math.max(0, myTicket.ahead - 1);
          setMyTicket(t => t ? { ...t, ahead: newAhead, wait: predictWait(newAhead, b.avgWait, b.open) } : t);
          if (newAhead === 2) pushNotif("⚡ Almost your turn — 2 people ahead!", "warn");
          if (newAhead === 0) pushNotif("🔔 Your turn! Please approach the counter.", "success");
        }
        return { ...b, serving: newServing, queue: newQueue };
      }));
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [role, myTicket]);

  function pushNotif(msg, type = "info") {
    setNotifs(p => [{ id: Date.now(), msg, type, time: new Date().toLocaleTimeString() }, ...p].slice(0, 10));
  }

  function doSignup(e) {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.password) { setFormError("All fields are required."); return; }
    if (signupForm.password !== signupForm.confirm) { setFormError("Passwords do not match."); return; }
    if (signupForm.password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
    setUser({ name: signupForm.name, email: signupForm.email, role: "customer" });
    setRole("customer"); setPage("dashboard"); setFormError("");
    pushNotif("Welcome to QueueIQ! Your account has been created.", "success");
  }

  function doSignin(e) {
    e.preventDefault();
    if (!signinForm.email || !signinForm.password) { setFormError("Please fill in all fields."); return; }

    const DEMO_ACCOUNTS = {
      "staff@queueiq.com": { name: "Ama Asante",  role: "staff" },
      "staff@test.com":    { name: "Ama Asante",  role: "staff" },
      "admin@queueiq.com": { name: "Kwame Mensah", role: "admin" },
      "admin@test.com":    { name: "Kwame Mensah", role: "admin" },
    };

    const emailKey = signinForm.email.trim().toLowerCase();
    const match = DEMO_ACCOUNTS[emailKey];

    let detectedRole = "customer";
    let detectedName = "Kofi Boateng";

    if (match) {
      detectedRole = match.role;
      detectedName = match.name;
    } else if (emailKey.includes("staff")) {
      detectedRole = "staff";
      detectedName = "Ama Asante";
    } else if (emailKey.includes("admin")) {
      detectedRole = "admin";
      detectedName = "Kwame Mensah";
    }

    setUser({ name: detectedName, email: signinForm.email, role: detectedRole });
    setRole(detectedRole);
    setFormError("");

    if (detectedRole === "staff") {
      setPage("staff-dashboard");
      pushNotif("Welcome back, " + detectedName + "! Staff dashboard loaded.", "success");
    } else if (detectedRole === "admin") {
      setPage("admin-overview");
      pushNotif("Welcome back, " + detectedName + "! Admin panel loaded.", "success");
    } else {
      setPage("dashboard");
      pushNotif("Welcome back! Signed in as Customer.", "success");
    }
  }

  function doGoogleAuth() {
    setUser({ name: "Abena Owusu", email: "abena@gmail.com", role: "customer" });
    setRole("customer"); setPage("dashboard");
    pushNotif("Signed in with Google successfully.", "success");
  }

  function joinQueue(branch, tx) {
    const ahead = branch.queue;
    const wait = predictWait(ahead, branch.avgWait, branch.open);
    const num = branch.serving + branch.queue + 1;
    setMyTicket({ branchId: branch.id, branchName: branch.name, label: `Q${num}`, ahead, wait, tx, type: branch.type });
    setBranches(p => p.map(b => b.id === branch.id ? { ...b, queue: b.queue + 1 } : b));
    pushNotif(`Joined queue at ${branch.name}. Your ticket: Q${num}`, "success");
    setPage("ticket");
  }

  function leaveQueue() {
    if (!myTicket) return;
    setBranches(p => p.map(b => b.id === myTicket.branchId ? { ...b, queue: Math.max(0, b.queue - 1) } : b));
    setMyTicket(null); setPage("dashboard");
  }

  function callNext() {
    setBranches(p => p.map(b => b.id === staffBranch.id ? { ...b, serving: b.serving + 1, queue: Math.max(0, b.queue - 1) } : b));
    const num = staffBranch.serving + 1;
    setCallLog(l => [`Q${num} called at ${new Date().toLocaleTimeString()}`, ...l].slice(0, 15));
  }

  const filtered = filter === "All" ? branches : branches.filter(b => b.type === filter);
  const types = ["All", "Bank", "Hospital", "Network Provider", "DVLA", "Government"];

  // ── STYLES ──────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Outfit',sans-serif;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
    @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(14,138,92,.3)}50%{box-shadow:0 0 0 8px rgba(14,138,92,0)}}
    .fadeUp{animation:fadeUp .4s ease both}
    .pulse{animation:pulse 2s infinite}
    .glow{animation:glow 2s ease-in-out infinite}
    .slide{animation:slideIn .3s ease both}
    input,button,select{font-family:'Outfit',sans-serif;}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
    .hover-scale{transition:transform .2s,box-shadow .2s;}
    .hover-scale:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.15);}
    .branch-card:hover{border-color:#0E8A5C!important;}
    .nav-btn:hover{opacity:.8;}
    .tab:hover{opacity:.7;}
  `;

  const nav = (
    <div style={{ background: T.nav, borderBottom: `1px solid ${T.border}`, padding: "0 1.5rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: T.shadow }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setPage(role === "staff" ? "staff-dashboard" : role === "admin" ? "admin-overview" : "dashboard")}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#0E8A5C,#0057FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎯</div>
        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: T.text }}>QueueIQ</span>
        {role && <span style={{ fontSize: "0.7rem", background: T.input, color: T.muted, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{role.toUpperCase()}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {role === "customer" && myTicket && (
          <button onClick={() => setPage("ticket")} style={{ background: "#0E8A5C22", border: "1px solid #0E8A5C55", color: "#0E8A5C", borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
            🎟 {myTicket.label}
          </button>
        )}
        {role && notifs.length > 0 && (
          <button onClick={() => setPage("notifications")} style={{ background: "#F59E0B22", border: "1px solid #F59E0B55", color: "#F59E0B", borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
            🔔 {notifs.length}
          </button>
        )}
        {role && (
          <button onClick={() => setPage("profile")} style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem", cursor: "pointer" }}>
            👤 {user?.name?.split(" ")[0]}
          </button>
        )}
        <button onClick={() => setDark(d => !d)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {dark ? "☀️" : "🌙"}
        </button>
        {role && (
          <button onClick={() => { setRole(null); setUser(null); setMyTicket(null); setPage("landing"); }} style={{ background: T.input, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem", cursor: "pointer" }}>
            Sign Out
          </button>
        )}
      </div>
    </div>
  );

  const wrap = (content, maxW = 860) => (
    <div style={{ background: T.bg, minHeight: "calc(100vh - 60px)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: maxW, margin: "0 auto" }} className="fadeUp">{content}</div>
    </div>
  );

  const card = (children, style = {}) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "1.5rem", boxShadow: T.shadow, ...style }}>{children}</div>
  );

  const btn = (label, onClick, opts = {}) => (
    <button onClick={onClick} type={opts.type || "button"} style={{
      background: opts.outline ? "transparent" : opts.danger ? "#DC262622" : opts.secondary ? T.input : "linear-gradient(135deg,#0E8A5C,#059669)",
      color: opts.outline ? T.accent : opts.danger ? "#DC2626" : opts.secondary ? T.text : "#fff",
      border: opts.outline ? `1.5px solid ${T.accent}` : opts.danger ? "1.5px solid #DC2626" : "none",
      borderRadius: 10, padding: opts.small ? "6px 14px" : "11px 22px",
      fontWeight: 700, fontSize: opts.small ? "0.8rem" : "0.95rem",
      cursor: "pointer", width: opts.full ? "100%" : "auto",
      transition: "all .2s", ...opts.style
    }}>{label}</button>
  );

  const input = (placeholder, value, onChange, type = "text") => (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ width: "100%", background: T.input, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", color: T.text, fontSize: "0.95rem", outline: "none", marginBottom: 12 }} />
  );

  // ── PAGES ────────────────────────────────────────────────────────────────

  // LANDING
  if (page === "landing") return (
    <div style={{ background: dark ? "#0A0F1E" : "#F8FAFC", minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      {nav}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "4rem 1.5rem 2rem", textAlign: "center" }} className="fadeUp">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: dark ? "#0E8A5C22" : "#ECFDF5", border: "1px solid #0E8A5C44", borderRadius: 20, padding: "6px 16px", marginBottom: "1.5rem" }}>
          <span className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#0E8A5C", display: "inline-block" }} />
          <span style={{ fontSize: "0.8rem", color: "#0E8A5C", fontWeight: 600 }}>Live across Ghana — 3,000+ branches</span>
        </div>
        <h1 style={{ fontSize: "clamp(2.2rem,6vw,3.8rem)", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", lineHeight: 1.1, marginBottom: "1rem" }}>
          Skip the Queue.<br /><span style={{ color: "#0E8A5C" }}>Join from Anywhere.</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: dark ? "#94A3B8" : "#64748B", maxWidth: 520, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
          Find the nearest bank, hospital, DVLA, network provider and more. Join their queue remotely. Know exactly how long you will wait.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
          {btn("Create Account →", () => setPage("signup"), { style: { fontSize: "1rem", padding: "13px 28px" } })}
          {btn("Sign In", () => setPage("signin"), { outline: true, style: { fontSize: "1rem", padding: "13px 28px" } })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, textAlign: "left" }}>
          {[["📍","Find Nearest Branch","GPS locates the closest branch of any institution automatically"],
            ["⏱️","Accurate Wait Time","Predicted from real transaction-type data — not a flat guess"],
            ["🔔","Live Updates","Your position updates in real time. No refreshing needed"],
            ["🌙","Dark & Light Mode","Your preferred theme, saved to your account"]
          ].map(([icon,title,desc]) => (
            <div key={title} style={{ background: dark?"#111827":"#FFFFFF", border:`1px solid ${dark?"#1E293B":"#E2E8F0"}`, borderRadius:14, padding:"1.2rem" }}>
              <div style={{fontSize:"1.6rem",marginBottom:8}}>{icon}</div>
              <div style={{fontWeight:700,color:dark?"#F1F5F9":"#0F172A",marginBottom:4,fontSize:"0.95rem"}}>{title}</div>
              <div style={{fontSize:"0.82rem",color:dark?"#94A3B8":"#64748B",lineHeight:1.5}}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "2rem", background: dark?"#111827":"#F1F5F9", border:`1px solid ${dark?"#1E293B":"#E2E8F0"}`, borderRadius:14, padding:"1.2rem", maxWidth:480, margin:"2rem auto 0" }}>
          <p style={{ fontWeight:700, color:dark?"#F1F5F9":"#0F172A", marginBottom:"0.8rem", fontSize:"0.85rem", textAlign:"center" }}>🧪 Demo — Enter as any role instantly</p>
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            {[
              { label:"👤 Customer", key:"customer", color:"#0E8A5C", name:"Kofi Boateng" },
              { label:"🧑‍💼 Staff",    key:"staff",    color:"#3B82F6", name:"Ama Asante" },
              { label:"⚙️ Admin",    key:"admin",    color:"#7C3AED", name:"Kwame Mensah" },
            ].map(({ label, key, color, name }) => (
              <button key={key} onClick={() => {
                const roles = { customer:"customer", staff:"staff", admin:"admin" };
                const names = { customer:"Kofi Boateng", staff:"Ama Asante", admin:"Kwame Mensah" };
                const emails = { customer:"kofi@gmail.com", staff:"staff@test.com", admin:"admin@test.com" };
                const r = roles[key];
                const u = { name: names[key], email: emails[key], role: r };
                setUser(u); setRole(r);
                if (r === "staff") setPage("staff-dashboard");
                else if (r === "admin") setPage("admin-overview");
                else setPage("dashboard");
                pushNotif("Welcome, " + names[key] + "!", "success");
              }} style={{ background:color+"22", border:`1.5px solid ${color}55`, color, borderRadius:10, padding:"10px 22px", fontWeight:700, fontSize:"0.85rem", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                {label}
              </button>
            ))}
          </div>
          <p style={{ color:dark?"#475569":"#94A3B8", fontSize:"0.73rem", marginTop:10, textAlign:"center" }}>
            One click — no email or password needed for the demo
          </p>
        </div>
      </div>
    </div>
  );

  // SIGN UP
  if (page === "signup") return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      {nav}
      {wrap(
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          {card(<>
            <h2 style={{ fontWeight: 800, fontSize: "1.6rem", color: T.text, marginBottom: 4 }}>Create Account</h2>
            <p style={{ color: T.muted, fontSize: "0.9rem", marginBottom: "1.5rem" }}>Join QueueIQ — it's free</p>
            <button onClick={doGoogleAuth} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: T.input, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "11px", cursor: "pointer", fontWeight: 600, color: T.text, fontSize: "0.95rem", marginBottom: 16 }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ color: T.muted, fontSize: "0.82rem" }}>or</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
            <form onSubmit={doSignup}>
              {input("Full Name", signupForm.name, e => setSignupForm(f=>({...f,name:e.target.value})))}
              {input("Email Address", signupForm.email, e => setSignupForm(f=>({...f,email:e.target.value})), "email")}
              {input("Password (min. 8 characters)", signupForm.password, e => setSignupForm(f=>({...f,password:e.target.value})), "password")}
              {input("Confirm Password", signupForm.confirm, e => setSignupForm(f=>({...f,confirm:e.target.value})), "password")}
              {formError && <p style={{ color: "#DC2626", fontSize: "0.85rem", marginBottom: 12 }}>⚠ {formError}</p>}
              {btn("Create My Account", null, { full: true, style: { marginBottom: 14 }, type: "submit" })}
            </form>
            <p style={{ textAlign: "center", color: T.muted, fontSize: "0.85rem" }}>
              Already have an account? <span onClick={() => { setFormError(""); setPage("signin"); }} style={{ color: T.accent, cursor: "pointer", fontWeight: 600 }}>Sign In</span>
            </p>
          </>)}
        </div>
      )}
    </div>
  );

  // SIGN IN
  // direct login helper — called by button onClick, no form needed
  function loginAs(roleKey) {
    const accounts = {
      customer: { name: "Kofi Boateng",  email: "kofi@gmail.com",   role: "customer" },
      staff:    { name: "Ama Asante",    email: "staff@test.com",   role: "staff"    },
      admin:    { name: "Kwame Mensah",  email: "admin@test.com",   role: "admin"    },
    };
    const acc = accounts[roleKey];
    setUser(acc);
    setRole(acc.role);
    setFormError("");
    if (acc.role === "staff")  { setPage("staff-dashboard"); }
    else if (acc.role === "admin") { setPage("admin-overview"); }
    else                           { setPage("dashboard"); }
    pushNotif("Welcome back, " + acc.name + "!", "success");
  }

  if (page === "signin") return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      {nav}
      {wrap(
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          {card(<>
            <h2 style={{ fontWeight: 800, fontSize: "1.6rem", color: T.text, marginBottom: 4 }}>Welcome Back</h2>
            <p style={{ color: T.muted, fontSize: "0.9rem", marginBottom: "1.5rem" }}>Sign in to your account</p>

            {/* Google button */}
            <button onClick={doGoogleAuth} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: T.input, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "11px", cursor: "pointer", fontWeight: 600, color: T.text, fontSize: "0.95rem", marginBottom: 16 }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ color: T.muted, fontSize: "0.82rem" }}>or sign in with email</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            {/* Email + password fields — controlled */}
            <input placeholder="Email Address" type="email" value={signinForm.email}
              onChange={e => setSigninForm(f => ({ ...f, email: e.target.value }))}
              style={{ width:"100%", background:T.input, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"11px 14px", color:T.text, fontSize:"0.95rem", outline:"none", marginBottom:12, fontFamily:"'Outfit',sans-serif" }} />
            <input placeholder="Password" type="password" value={signinForm.password}
              onChange={e => setSigninForm(f => ({ ...f, password: e.target.value }))}
              style={{ width:"100%", background:T.input, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"11px 14px", color:T.text, fontSize:"0.95rem", outline:"none", marginBottom:12, fontFamily:"'Outfit',sans-serif" }} />

            {formError && <p style={{ color:"#DC2626", fontSize:"0.85rem", marginBottom:12 }}>⚠ {formError}</p>}

            <div style={{ textAlign:"right", marginBottom:16 }}>
              <span onClick={() => setPage("forgot")} style={{ color:T.accent, fontSize:"0.85rem", cursor:"pointer", fontWeight:600 }}>Forgot Password?</span>
            </div>

            {/* Sign In button — pure onClick, no form */}
            <button onClick={() => {
              if (!signinForm.email || !signinForm.password) { setFormError("Please fill in all fields."); return; }
              const e = signinForm.email.trim().toLowerCase();
              if (e === "staff@test.com" || e.startsWith("staff")) { loginAs("staff"); }
              else if (e === "admin@test.com" || e.startsWith("admin")) { loginAs("admin"); }
              else { loginAs("customer"); }
            }} style={{ width:"100%", background:"linear-gradient(135deg,#0E8A5C,#059669)", color:"#fff", border:"none", borderRadius:10, padding:"12px", fontWeight:700, fontSize:"0.95rem", cursor:"pointer", marginBottom:14, fontFamily:"'Outfit',sans-serif" }}>
              Sign In
            </button>

            {/* Demo quick login */}
            <div style={{ background:T.input, borderRadius:10, padding:"12px", marginBottom:14 }}>
              <p style={{ fontSize:"0.78rem", color:T.muted, fontWeight:600, marginBottom:8, textAlign:"center" }}>🧪 DEMO — Click to sign in instantly</p>
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { label:"👤 Customer", key:"customer", color:"#0E8A5C" },
                  { label:"🧑‍💼 Staff",    key:"staff",    color:"#3B82F6" },
                  { label:"⚙️ Admin",    key:"admin",    color:"#7C3AED" },
                ].map(({ label, key, color }) => (
                  <button key={key} onClick={() => loginAs(key)} style={{ flex:1, background:color+"22", border:`1.5px solid ${color}55`, color, borderRadius:8, padding:"8px 4px", fontWeight:700, fontSize:"0.78rem", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ textAlign:"center", color:T.muted, fontSize:"0.85rem" }}>
              No account? <span onClick={() => { setFormError(""); setPage("signup"); }} style={{ color:T.accent, cursor:"pointer", fontWeight:600 }}>Create Account</span>
            </p>
          </>)}
        </div>
      )}
    </div>
  );

  // FORGOT PASSWORD
  if (page === "forgot") return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      {nav}
      {wrap(
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          {card(<>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>🔑</div>
            <h2 style={{ fontWeight: 800, fontSize: "1.5rem", color: T.text, marginBottom: 4 }}>Reset Password</h2>
            <p style={{ color: T.muted, fontSize: "0.9rem", marginBottom: "1.5rem" }}>Enter your email and we'll send you a reset link.</p>
            {input("Your registered email", "", () => {},"email")}
            {btn("Send Reset Link", () => { pushNotif("Password reset link sent to your email.", "success"); setPage("signin"); }, { full: true, style: { marginBottom: 14 } })}
            <p style={{ textAlign: "center", color: T.muted, fontSize: "0.85rem" }}>
              <span onClick={() => setPage("signin")} style={{ color: T.accent, cursor: "pointer", fontWeight: 600 }}>← Back to Sign In</span>
            </p>
          </>)}
        </div>
      )}
    </div>
  );

  // CUSTOMER DASHBOARD
  if (page === "dashboard") return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      {nav}
      {wrap(<>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.5rem", color: T.text }}>Good morning, {user?.name?.split(" ")[0]} 👋</h2>
          <p style={{ color: T.muted, marginTop: 4 }}>Your location: Accra, Ghana · {branches.length} branches found nearby</p>
        </div>

        {/* Map placeholder */}
        <div style={{ background: dark?"#1E293B":"#E8F5E9", borderRadius: 16, height: 180, marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "radial-gradient(circle, #0E8A5C 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          {branches.map((b, i) => {
            const x = 12 + (i % 4) * 24;
            const y = 20 + Math.floor(i / 4) * 45;
            const w = predictWait(b.queue, b.avgWait, b.open);
            return (
              <div key={b.id} onClick={() => { setSelectedBranch(b); setPage("branch"); }} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, cursor: "pointer" }} title={b.name}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: waitColor(w), border: "2px solid white", boxShadow: "0 2px 6px rgba(0,0,0,.3)" }} />
              </div>
            );
          })}
          <div style={{ background: "rgba(255,255,255,.9)", borderRadius: 10, padding: "8px 16px", backdropFilter: "blur(8px)" }}>
            <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.9rem" }}>📍 Accra, Ghana — GPS Active</span>
          </div>
          <div style={{ position: "absolute", bottom: 10, right: 12, display: "flex", gap: 8 }}>
            {[["🟢","< 10 min"],["🟡","10–25 min"],["🔴","> 25 min"]].map(([dot,label]) => (
              <div key={label} style={{ background: "rgba(255,255,255,.85)", borderRadius: 6, padding: "3px 8px", fontSize: "0.7rem", fontWeight: 600, color: "#0F172A" }}>{dot} {label}</div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: "1.2rem", paddingBottom: 4 }}>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} className="tab" style={{ background: filter === t ? T.accent : T.input, color: filter === t ? "#fff" : T.muted, border: "none", borderRadius: 20, padding: "6px 14px", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s" }}>
              {t === "All" ? "All" : TYPE_ICONS[t] + " " + t}
            </button>
          ))}
        </div>

        {/* Branch cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(b => {
            const w = predictWait(b.queue, b.avgWait, b.open);
            const tc = TYPE_COLORS[b.type] || TYPE_COLORS["Government"];
            return (
              <div key={b.id} className="branch-card hover-scale" onClick={() => { setSelectedBranch(b); setSelectedTx(""); setPage("branch"); }}
                style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "1.1rem 1.3rem", cursor: "pointer", transition: "border-color .2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: "1.2rem" }}>{TYPE_ICONS[b.type]}</span>
                      <span style={{ fontWeight: 700, color: T.text, fontSize: "0.95rem" }}>{b.name}</span>
                      <span style={{ background: dark ? tc.dark + "44" : tc.bg, color: tc.accent, borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 700 }}>{b.type}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ color: T.muted, fontSize: "0.82rem" }}>📍 {b.distance}</span>
                      <span style={{ color: T.muted, fontSize: "0.82rem" }}>👥 {b.queue} waiting</span>
                      <span style={{ color: T.muted, fontSize: "0.82rem" }}>🖥 {b.open}/{b.counters} counters open</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.5rem", fontWeight: 700, color: waitColor(w) }}>{w} min</div>
                    <div style={{ fontSize: "0.72rem", color: waitColor(w), fontWeight: 600 }}>{waitLabel(w)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: T.input, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(b.queue / 25 * 100, 100)}%`, background: waitColor(w), borderRadius: 2, transition: "width 1s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </>)}
    </div>
  );

  // BRANCH DETAIL
  if (page === "branch" && selectedBranch) {
    const b = branches.find(x => x.id === selectedBranch.id) || selectedBranch;
    const w = selectedTx ? predictWait(b.queue, b.avgWait, b.open) : predictWait(b.queue, b.avgWait, b.open);
    return (
      <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
        <style>{css}</style>
        {nav}
        {wrap(<>
          <button onClick={() => setPage("dashboard")} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", marginBottom: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>← Back to Map</button>
          {card(<>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
              <span style={{ fontSize: "2rem" }}>{TYPE_ICONS[b.type]}</span>
              <div>
                <h2 style={{ fontWeight: 800, color: T.text, fontSize: "1.2rem" }}>{b.name}</h2>
                <p style={{ color: T.muted, fontSize: "0.85rem" }}>📍 {b.distance} away · {b.open} of {b.counters} counters open</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
              {[["Now Serving", `Q${b.serving}`, "📣"],["In Queue", b.queue, "👥"],["Est. Wait", `${w} min`, "⏱️"]].map(([l,v,i]) => (
                <div key={l} style={{ background: T.input, borderRadius: 12, padding: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{i}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: "1.2rem", color: T.text }}>{v}</div>
                  <div style={{ fontSize: "0.72rem", color: T.muted, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: "0.95rem" }}>Select what you came to do</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.5rem" }}>
              {b.transactions.map(tx => (
                <button key={tx} onClick={() => setSelectedTx(tx)} style={{ background: selectedTx === tx ? T.accent : T.input, color: selectedTx === tx ? "#fff" : T.text, border: `1.5px solid ${selectedTx === tx ? T.accent : T.border}`, borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all .2s" }}>{tx}</button>
              ))}
            </div>

            {selectedTx && (
              <div style={{ background: dark ? "#0E8A5C22" : "#ECFDF5", border: "1px solid #0E8A5C44", borderRadius: 12, padding: "1rem", marginBottom: "1.2rem" }}>
                <p style={{ color: "#0E8A5C", fontWeight: 600, fontSize: "0.9rem" }}>Predicted wait for {selectedTx}: <strong>{w} minutes</strong></p>
                <p style={{ color: T.muted, fontSize: "0.8rem", marginTop: 4 }}>Based on 30-day historical average for this transaction at this branch</p>
              </div>
            )}

            {myTicket?.branchId === b.id ? (
              <div style={{ background: dark?"#F59E0B22":"#FEF3C7", border:"1px solid #F59E0B", borderRadius:12, padding:"1rem", textAlign:"center" }}>
                <p style={{ fontWeight:700, color:"#B45309" }}>You already have ticket <strong>{myTicket.label}</strong> at this branch</p>
                {btn("View My Ticket", () => setPage("ticket"), { outline: true, style:{marginTop:10} })}
              </div>
            ) : (
              btn(selectedTx ? `Join Queue — ${selectedTx}` : "Select a service above to join", () => { if(selectedTx) joinQueue(b, selectedTx); }, { full: true, style: { opacity: selectedTx ? 1 : 0.5 } })
            )}
          </>)}
        </>)}
      </div>
    );
  }

  // MY TICKET
  if (page === "ticket") return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      {nav}
      {wrap(
        myTicket ? (
          <div style={{ maxWidth: 460, margin: "0 auto" }}>
            {card(<>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <p style={{ color: T.muted, fontSize: "0.85rem", marginBottom: 6 }}>YOUR TICKET</p>
                <div className="glow" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "4.5rem", fontWeight: 700, color: T.accent, lineHeight: 1 }}>{myTicket.label}</div>
                <p style={{ color: T.muted, marginTop: 8, fontSize: "0.9rem" }}>{myTicket.branchName}</p>
                <p style={{ color: T.muted, fontSize: "0.82rem" }}>Service: <strong style={{color:T.text}}>{myTicket.tx}</strong></p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
                {[["People Ahead", myTicket.ahead],["Est. Wait", `${myTicket.wait} min`],["Your Turn", myTicket.ahead === 0 ? "NOW!" : `~${myTicket.wait}m`]].map(([l,v]) => (
                  <div key={l} style={{ background: T.input, borderRadius: 12, padding: "0.9rem", textAlign: "center" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: "1.3rem", color: myTicket.ahead === 0 ? "#0E8A5C" : T.text }}>{v}</div>
                    <div style={{ fontSize: "0.7rem", color: T.muted, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>

              {myTicket.ahead === 0 && (
                <div style={{ background:"#0E8A5C22", border:"1px solid #0E8A5C", borderRadius:12, padding:"1rem", textAlign:"center", marginBottom:"1rem" }}>
                  <p style={{fontWeight:700,color:"#0E8A5C",fontSize:"1rem"}}>🎉 It's your turn! Please approach the counter.</p>
                </div>
              )}
              {myTicket.ahead > 0 && myTicket.ahead <= 2 && (
                <div style={{ background:"#F59E0B22", border:"1px solid #F59E0B", borderRadius:12, padding:"1rem", textAlign:"center", marginBottom:"1rem" }}>
                  <p style={{fontWeight:700,color:"#B45309"}}>⚡ Almost your turn — get ready!</p>
                </div>
              )}

              <div style={{ background:T.input, borderRadius:12, padding:"1rem", marginBottom:"1.2rem" }}>
                <p style={{fontSize:"0.8rem",color:T.muted,marginBottom:4,fontWeight:600}}>PREDICTION BREAKDOWN</p>
                <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.82rem",color:T.text}}>
                  ({myTicket.ahead} people × avg service time) ÷ open counters = <span style={{color:T.accent}}>{myTicket.wait} min</span>
                </p>
              </div>

              <div style={{display:"flex",gap:10}}>
                {btn("← Back to Map", () => setPage("dashboard"), { secondary: true, style:{flex:1} })}
                {btn("Leave Queue", leaveQueue, { danger: true, style:{flex:1} })}
              </div>
            </>)}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{fontSize:"3rem",marginBottom:12}}>🎟</div>
            <p style={{color:T.muted,marginBottom:16}}>You haven't joined a queue yet.</p>
            {btn("Find a Branch", () => setPage("dashboard"))}
          </div>
        )
      )}
    </div>
  );

  // NOTIFICATIONS
  if (page === "notifications") return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      {nav}
      {wrap(<>
        <h2 style={{ fontWeight: 800, color: T.text, marginBottom: "1.2rem" }}>🔔 Notifications</h2>
        {notifs.length === 0 ? (
          <div style={{textAlign:"center",padding:"3rem",color:T.muted}}>
            <div style={{fontSize:"3rem",marginBottom:12}}>🔕</div>
            <p>No notifications yet. Join a queue to receive live alerts.</p>
          </div>
        ) : notifs.map(n => (
          <div key={n.id} className="slide" style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${n.type==="success"?"#0E8A5C":n.type==="warn"?"#F59E0B":"#3B82F6"}`, borderRadius:12, padding:"1rem 1.2rem", marginBottom:10 }}>
            <p style={{fontWeight:600,color:T.text}}>{n.msg}</p>
            <p style={{color:T.muted,fontSize:"0.75rem",marginTop:4,fontFamily:"'JetBrains Mono',monospace"}}>{n.time}</p>
          </div>
        ))}
      </>)}
    </div>
  );

  // PROFILE
  if (page === "profile") return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      {nav}
      {wrap(
        <div style={{maxWidth:480,margin:"0 auto"}}>
          {card(<>
            <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#0E8A5C,#0057FF)",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem"}}>
                {user?.name?.charAt(0)}
              </div>
              <h2 style={{fontWeight:800,color:T.text,fontSize:"1.3rem"}}>{user?.name}</h2>
              <p style={{color:T.muted,fontSize:"0.85rem"}}>{user?.email}</p>
              <span style={{background:T.input,color:T.muted,borderRadius:20,padding:"3px 12px",fontSize:"0.78rem",fontWeight:600}}>{user?.role?.toUpperCase()}</span>
            </div>

            <h3 style={{fontWeight:700,color:T.text,marginBottom:12,fontSize:"0.95rem"}}>Preferences</h3>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.input,borderRadius:12,padding:"12px 16px",marginBottom:10}}>
              <span style={{fontWeight:600,color:T.text}}>Dark Mode</span>
              <div onClick={() => setDark(d=>!d)} style={{width:48,height:26,borderRadius:13,background:dark?"#0E8A5C":"#CBD5E1",cursor:"pointer",position:"relative",transition:"background .2s"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:dark?24:2,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.input,borderRadius:12,padding:"12px 16px",marginBottom:10}}>
              <span style={{fontWeight:600,color:T.text}}>Language</span>
              <div style={{display:"flex",gap:6}}>
                {["EN","TW","GA"].map(l=>(
                  <button key={l} onClick={()=>setLang(l)} style={{background:lang===l?T.accent:"transparent",color:lang===l?"#fff":T.muted,border:`1px solid ${lang===l?T.accent:T.border}`,borderRadius:6,padding:"3px 10px",fontSize:"0.8rem",fontWeight:700,cursor:"pointer"}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{marginTop:"1.5rem"}}>
              {btn("Sign Out", () => { setRole(null);setUser(null);setMyTicket(null);setPage("landing"); }, { full:true, danger:true })}
            </div>
          </>)}
        </div>
      )}
    </div>
  );

  // STAFF DASHBOARD
  if (page === "staff-dashboard") {
    const sb = branches[0];
    // Staff member's assigned counter — comes from their account (set by Admin)
    const assignedCounter = "Counter 2";
    const assignedCounterNum = 2;

    return (
      <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
        <style>{css}</style>
        {nav}
        {wrap(<>

          {/* Staff identity card */}
          <div style={{ background: dark?"#1E293B":"#F0FDF4", border:"1px solid #0E8A5C44", borderRadius:14, padding:"1rem 1.4rem", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:"linear-gradient(135deg,#0E8A5C,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", flexShrink:0 }}>👤</div>
            <div>
              <p style={{ fontWeight:800, color:T.text, fontSize:"1rem" }}>{user?.name}</p>
              <p style={{ color:T.muted, fontSize:"0.82rem", marginTop:2 }}>
                📍 {sb.name} &nbsp;·&nbsp; 🖥 Assigned to <strong style={{color:"#0E8A5C"}}>{assignedCounter}</strong>
              </p>
            </div>
          </div>

          {/* Queue stats */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:"1.5rem"}}>
            {[
              ["Now Serving", `Q${sb.serving}`,    "📣", "#0E8A5C"],
              ["In Queue",     sb.queue,            "👥", "#F59E0B"],
              ["Your Counter", assignedCounter,     "🖥", "#3B82F6"],
            ].map(([l,v,ic,c]) => (
              <div key={l} style={{background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"1.2rem", textAlign:"center"}}>
                <div style={{fontSize:"1.4rem"}}>{ic}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:"1.5rem", color:c, marginTop:4}}>{v}</div>
                <div style={{fontSize:"0.75rem", color:T.muted, marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>

          {/* MY COUNTER STATUS — assigned counter only */}
          {card(<>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
              <div>
                <h3 style={{fontWeight:800, color:T.text, fontSize:"1rem"}}>🖥 My Counter Status</h3>
                <p style={{color:T.muted, fontSize:"0.8rem", marginTop:2}}>You are assigned to <strong style={{color:"#0E8A5C"}}>{assignedCounter}</strong> at this branch</p>
              </div>
            </div>

            <div style={{background:T.input, borderRadius:12, padding:"1rem 1.2rem"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12}}>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <div style={{width:10, height:10, borderRadius:"50%", background:"#0E8A5C"}} className="pulse" />
                  <span style={{fontWeight:700, color:T.text, fontSize:"0.95rem"}}>{assignedCounter}</span>
                  <span style={{color:T.muted, fontSize:"0.8rem"}}>— your assigned counter</span>
                </div>
                <div style={{display:"flex", gap:8}}>
                  {[
                    {label:"Open",   color:"#0E8A5C", bg:"#0E8A5C22", border:"#0E8A5C"},
                    {label:"Break",  color:"#B45309",  bg:"#F59E0B22", border:"#F59E0B"},
                    {label:"Closed", color:"#DC2626",  bg:"#DC262622", border:"#DC2626"},
                  ].map(({label, color, bg, border}) => (
                    <button key={label} onClick={() => {
                      pushNotif(`${assignedCounter} status changed to ${label}.`, label==="Open"?"success":label==="Break"?"warn":"info");
                    }} style={{
                      background: label==="Open" ? bg : "transparent",
                      color, border:`1.5px solid ${border}`,
                      borderRadius:8, padding:"6px 14px",
                      fontWeight:700, fontSize:"0.82rem", cursor:"pointer",
                      fontFamily:"'Outfit',sans-serif",
                      opacity: label==="Open" ? 1 : 0.6,
                      transition:"all .2s"
                    }}>{label}</button>
                  ))}
                </div>
              </div>
              <p style={{color:T.muted, fontSize:"0.75rem", marginTop:10}}>
                💡 Set your counter to <strong>Break</strong> when stepping away, and <strong>Closed</strong> at end of shift. The system recalculates all customer wait times instantly when you change this.
              </p>
            </div>

            <div style={{background: dark?"#DC262622":"#FEF2F2", border:"1px solid #DC262633", borderRadius:10, padding:"10px 14px", marginTop:12}}>
              <p style={{fontSize:"0.8rem", color:"#DC2626", fontWeight:600}}>
                🔒 You can only control your own counter. Other counters at this branch are managed by their assigned staff members.
              </p>
            </div>
          </>, {marginBottom:"1.2rem"})}

          {/* Call Next */}
          <button onClick={callNext} style={{width:"100%", background:"linear-gradient(135deg,#0E8A5C,#059669)", color:"#fff", border:"none", borderRadius:14, padding:"1.1rem", fontWeight:800, fontSize:"1.2rem", cursor:"pointer", boxShadow:"0 4px 20px #0E8A5C44", marginBottom:"1.5rem", fontFamily:"'Outfit',sans-serif"}}>
            📣 Call Next — Q{sb.serving + 1}
          </button>

          {/* Activity log */}
          {card(<>
            <h3 style={{fontWeight:700, color:T.text, marginBottom:"0.8rem"}}>📋 My Activity Log — {assignedCounter}</h3>
            {callLog.length === 0
              ? <p style={{color:T.muted, fontSize:"0.85rem"}}>No activity yet. Click Call Next to begin serving customers.</p>
              : callLog.map((l,i) => (
                <div key={i} style={{padding:"8px 0", borderBottom:`1px solid ${T.border}`, fontSize:"0.85rem", color:T.text, fontFamily:"'JetBrains Mono',monospace"}}>{l}</div>
              ))
            }
          </>)}

        </>)}
      </div>
    );
  }

  // ADMIN OVERVIEW
  if (page === "admin-overview") return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      {nav}
      {wrap(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem",flexWrap:"wrap",gap:10}}>
          <div>
            <h2 style={{fontWeight:800,color:T.text,fontSize:"1.5rem"}}>Admin Overview</h2>
            <p style={{color:T.muted,fontSize:"0.9rem"}}>System-wide queue status — all branches</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            {[["📈 Analytics","admin-analytics"],["👥 Users","admin-users"],["🗺 Branches","admin-branches"]].map(([l,p])=>(
              <button key={p} onClick={()=>setPage(p)} style={{background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"6px 14px",fontSize:"0.82rem",fontWeight:600,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:"1.5rem"}}>
          {[
            ["Total Branches","3,000+","📍","#3B82F6"],
            ["Total Waiting",branches.reduce((a,b)=>a+b.queue,0),"👥","#F59E0B"],
            ["Active Counters",branches.reduce((a,b)=>a+b.open,0),"🖥","#0E8A5C"],
            ["Avg System Wait",Math.round(branches.reduce((a,b)=>a+predictWait(b.queue,b.avgWait,b.open),0)/branches.length)+" min","⏱️","#7C3AED"],
          ].map(([l,v,i,c])=>(
            <div key={l} style={{background:T.card,border:`1px solid ${T.border}`,borderLeft:`3px solid ${c}`,borderRadius:14,padding:"1.2rem"}}>
              <div style={{fontSize:"1.4rem"}}>{i}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:"1.8rem",color:c,marginTop:4}}>{v}</div>
              <div style={{fontSize:"0.78rem",color:T.muted,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {branches.map(b=>{
            const w=predictWait(b.queue,b.avgWait,b.open);
            const load=Math.min(b.queue/25,1);
            return (
              <div key={b.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"1rem 1.2rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <div>
                    <span style={{fontWeight:700,color:T.text}}>{TYPE_ICONS[b.type]} {b.name}</span>
                    <p style={{color:T.muted,fontSize:"0.8rem",marginTop:2}}>Serving Q{b.serving} · {b.open}/{b.counters} counters · {b.queue} waiting</p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontWeight:700,color:waitColor(w),fontSize:"0.85rem"}}>{waitLabel(w)}</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",color:waitColor(w),fontWeight:700}}>{w}m</span>
                  </div>
                </div>
                <div style={{marginTop:10,height:4,borderRadius:2,background:T.input,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${load*100}%`,background:waitColor(w),borderRadius:2,transition:"width 1s"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </>)}
    </div>
  );

  // ADMIN ANALYTICS
  if (page === "admin-analytics") return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      {nav}
      {wrap(<>
        <button onClick={()=>setPage("admin-overview")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",marginBottom:"1rem",fontSize:"0.9rem",fontWeight:600}}>← Back to Overview</button>
        <h2 style={{fontWeight:800,color:T.text,marginBottom:"0.4rem"}}>📈 Peak Hour Heatmap</h2>
        <p style={{color:T.muted,fontSize:"0.9rem",marginBottom:"1.5rem"}}>Busiest hours across all branches — last 30 days</p>
        {card(<>
          <div style={{display:"grid",gridTemplateColumns:"auto repeat(8,1fr)",gap:3,fontSize:"0.7rem"}}>
            <div/>
            {["6am","8am","10am","12pm","2pm","4pm","6pm","8pm"].map(h=>(
              <div key={h} style={{textAlign:"center",color:T.muted,fontWeight:600,paddingBottom:6}}>{h}</div>
            ))}
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,di)=>(
              <>
                <div key={day} style={{color:T.muted,fontWeight:600,display:"flex",alignItems:"center",paddingRight:8}}>{day}</div>
                {[0.1,0.4,0.9,0.7,0.5,0.3,0.6,0.2].map((v,hi)=>{
                  const intensity = v * (di===0&&hi===2?1.2:di===4&&hi===3?1.1:1);
                  const clamped = Math.min(intensity,1);
                  const r = Math.round(220*clamped);
                  const g = Math.round(38 + (163-38)*(1-clamped));
                  return <div key={hi} style={{height:36,borderRadius:4,background:`rgba(${r},${g},50,${0.15+clamped*0.85})`,cursor:"pointer",transition:"transform .15s"}} title={`${day} ${["6am","8am","10am","12pm","2pm","4pm","6pm","8pm"][hi]}: ${Math.round(clamped*100)}% load`}/>;
                })}
              </>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:16,justifyContent:"flex-end"}}>
            <span style={{color:T.muted,fontSize:"0.75rem"}}>Quiet</span>
            {[0.1,0.3,0.5,0.7,0.9].map(v=>(
              <div key={v} style={{width:20,height:14,borderRadius:3,background:`rgba(${Math.round(220*v)},${Math.round(163-125*v)},50,${0.2+v*0.8})`}}/>
            ))}
            <span style={{color:T.muted,fontSize:"0.75rem"}}>Peak</span>
          </div>
        </>)}
      </>)}
    </div>
  );

  // ADMIN USERS
  if (page === "admin-users") {
    const fStyle = { width:"100%", background:T.input, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"10px 13px", color:T.text, fontSize:"0.9rem", outline:"none", marginBottom:10, fontFamily:"'Outfit',sans-serif" };

    const createStaff = () => {
      if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.branch) return;
      const newStaff = {
        name: staffForm.name,
        email: staffForm.email,
        branch: staffForm.branch,
        counter: `Counter ${staffForm.counter}`,
        status: "active",
      };
      setStaffList(p => [...p, newStaff]);
      pushNotif(`Staff account created for ${staffForm.name}. Welcome email sent to ${staffForm.email}.`, "success");
      setStaffForm(emptyStaffForm);
      setShowStaffModal(false);
    };

    return (
      <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"'Outfit',sans-serif" }}>
        <style>{css}</style>
        {nav}

        {/* CREATE STAFF MODAL */}
        {showStaffModal && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"1rem" }}>
            <div style={{ background:T.card, borderRadius:20, padding:"2rem", width:"100%", maxWidth:480, boxShadow:T.shadowLg, maxHeight:"90vh", overflowY:"auto" }} className="fadeUp">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
                <h3 style={{ fontWeight:800, color:T.text, fontSize:"1.2rem" }}>➕ Create Staff Account</h3>
                <button onClick={() => { setShowStaffModal(false); setStaffForm(emptyStaffForm); }}
                  style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:"1.1rem", color:T.muted }}>✕</button>
              </div>

              {/* Security notice */}
              <div style={{ background: dark?"#3B82F622":"#EFF6FF", border:"1px solid #3B82F655", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
                <p style={{ fontSize:"0.8rem", color:"#3B82F6", fontWeight:600 }}>🔒 Security: Staff accounts are created by Admin only.</p>
                <p style={{ fontSize:"0.78rem", color:T.muted, marginTop:3 }}>A temporary password will be auto-generated and emailed to the staff member's work address. They must change it on first login.</p>
              </div>

              <label style={{ fontSize:"0.78rem", fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>Full Name *</label>
              <input value={staffForm.name} onChange={e => setStaffForm(f=>({...f,name:e.target.value}))}
                placeholder="e.g. Kofi Boateng" style={fStyle} />

              <label style={{ fontSize:"0.78rem", fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>Official Work Email *</label>
              <input type="email" value={staffForm.email} onChange={e => setStaffForm(f=>({...f,email:e.target.value}))}
                placeholder="e.g. kofi@gcbbank.com" style={fStyle} />

              <label style={{ fontSize:"0.78rem", fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>Assign to Branch *</label>
              <select value={staffForm.branch} onChange={e => setStaffForm(f=>({...f,branch:e.target.value}))} style={fStyle}>
                <option value="">— Select a branch —</option>
                {branches.map(b => <option key={b.id} value={b.name}>{TYPE_ICONS[b.type]} {b.name}</option>)}
              </select>

              <label style={{ fontSize:"0.78rem", fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>Assign to Counter *</label>
              <select value={staffForm.counter} onChange={e => setStaffForm(f=>({...f,counter:e.target.value}))} style={fStyle}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>Counter {n}</option>)}
              </select>

              <div style={{ background:T.input, borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
                <p style={{ fontSize:"0.78rem", color:T.muted }}>
                  📧 After clicking Create Account, a welcome email will be sent to <strong style={{color:T.text}}>{staffForm.email || "the work email above"}</strong> with a temporary password. The staff member signs in and is forced to change it immediately.
                </p>
              </div>

              {(!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.branch) && (
                <p style={{ color:"#DC2626", fontSize:"0.8rem", marginBottom:10 }}>⚠ Name, work email, and branch are required.</p>
              )}

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => { setShowStaffModal(false); setStaffForm(emptyStaffForm); }}
                  style={{ flex:1, background:T.input, border:`1px solid ${T.border}`, color:T.text, borderRadius:10, padding:"11px", fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  Cancel
                </button>
                <button onClick={createStaff}
                  style={{ flex:2, background:"linear-gradient(135deg,#3B82F6,#2563EB)", color:"#fff", border:"none", borderRadius:10, padding:"11px", fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:(staffForm.name&&staffForm.email&&staffForm.branch)?1:0.5 }}>
                  Create Account & Send Email
                </button>
              </div>
            </div>
          </div>
        )}

        {wrap(<>
          <button onClick={() => setPage("admin-overview")} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", marginBottom:"1rem", fontSize:"0.9rem", fontWeight:600 }}>
            ← Back to Overview
          </button>

          {/* ONE ADMIN NOTICE */}
          <div style={{ background: dark?"#7C3AED22":"#FAF5FF", border:"1px solid #7C3AED44", borderRadius:12, padding:"1rem 1.2rem", marginBottom:"1.5rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#7C3AED,#5B21B6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", flexShrink:0 }}>⚙️</div>
              <div>
                <p style={{ fontWeight:700, color:"#7C3AED", fontSize:"0.92rem" }}>Admin Account — Kwame Mensah (admin@test.com)</p>
                <p style={{ color:T.muted, fontSize:"0.8rem", marginTop:2 }}>There is exactly one Admin account in this system. It was created during setup and cannot be duplicated or deleted from within the app.</p>
              </div>
            </div>
          </div>

          {/* STAFF SECTION */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap", gap:10 }}>
            <div>
              <h2 style={{ fontWeight:800, color:T.text }}>🧑‍💼 Staff Accounts</h2>
              <p style={{ color:T.muted, fontSize:"0.82rem", marginTop:2 }}>Created by Admin only — staff never sign themselves up</p>
            </div>
            <button onClick={() => setShowStaffModal(true)}
              style={{ background:"linear-gradient(135deg,#3B82F6,#2563EB)", color:"#fff", border:"none", borderRadius:10, padding:"10px 18px", fontWeight:700, fontSize:"0.85rem", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
              + Create Staff Account
            </button>
          </div>

          {staffList.map((s, i) => (
            <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${s.status==="active"?"#3B82F6":"#94A3B8"}`, borderRadius:12, padding:"1rem 1.2rem", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontWeight:700, color:T.text }}>{s.name}</span>
                    <span style={{ background:s.status==="active"?"#3B82F622":"#94A3B822", color:s.status==="active"?"#3B82F6":"#94A3B8", borderRadius:6, padding:"2px 8px", fontSize:"0.72rem", fontWeight:700 }}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color:T.muted, fontSize:"0.82rem" }}>📧 {s.email}</p>
                  <p style={{ color:T.muted, fontSize:"0.82rem" }}>📍 {s.branch} · {s.counter}</p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => {
                    setStaffList(p => p.map((st,idx) => idx===i ? {...st, status: st.status==="active"?"inactive":"active"} : st));
                    pushNotif(`${s.name}'s account has been ${s.status==="active"?"deactivated":"reactivated"}.`, s.status==="active"?"warn":"success");
                  }} style={{ background: s.status==="active"?"#DC262622":"#0E8A5C22", border:`1px solid ${s.status==="active"?"#DC262655":"#0E8A5C55"}`, color: s.status==="active"?"#DC2626":"#0E8A5C", borderRadius:8, padding:"6px 14px", fontWeight:700, fontSize:"0.78rem", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    {s.status==="active" ? "🚫 Deactivate" : "✅ Reactivate"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* CUSTOMERS SECTION */}
          <div style={{ marginTop:"2rem", marginBottom:"1rem" }}>
            <h2 style={{ fontWeight:800, color:T.text }}>👤 Customer Accounts</h2>
            <p style={{ color:T.muted, fontSize:"0.82rem", marginTop:2 }}>Unlimited — customers sign themselves up freely</p>
          </div>

          {[
            { name:"Kofi Boateng",  email:"kofi@gmail.com",   joined:"Jan 2025", tickets:4  },
            { name:"Abena Owusu",   email:"abena@gmail.com",  joined:"Feb 2025", tickets:7  },
            { name:"Yaw Darko",     email:"yaw@gmail.com",    joined:"Mar 2025", tickets:2  },
            { name:"Akosua Frimpong",email:"akosua@yahoo.com",joined:"Mar 2025", tickets:1  },
          ].map((u, i) => (
            <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid #0E8A5C`, borderRadius:12, padding:"1rem 1.2rem", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
              <div>
                <p style={{ fontWeight:700, color:T.text }}>{u.name}</p>
                <p style={{ color:T.muted, fontSize:"0.82rem" }}>📧 {u.email} · Joined {u.joined} · {u.tickets} queue{u.tickets!==1?"s":""} used</p>
              </div>
              <span style={{ background:"#0E8A5C22", color:"#0E8A5C", borderRadius:6, padding:"3px 10px", fontSize:"0.75rem", fontWeight:700 }}>CUSTOMER</span>
            </div>
          ))}
        </>)}
      </div>
    );
  }

  // ADMIN BRANCHES
  if (page === "admin-branches") {
    const txOptions = {
      "Bank":             ["Withdrawal","Deposit","Loan Inquiry","Account Opening","Forex","Card Services"],
      "Hospital":         ["OPD Visit","Lab Test","Pharmacy","Specialist Consult","X-Ray","Admission"],
      "Network Provider": ["SIM Replacement","MoMo Issue","Data Plan","Device Support","Billing","Corporate"],
      "DVLA":             ["Licence Renewal","Roadworthy","Registration","Learner's Permit"],
      "Government":       ["New Application","Renewal","Document Collection","Inquiry","Registration"],
    };

    const fieldStyle = { width:"100%", background:T.input, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"10px 13px", color:T.text, fontSize:"0.9rem", outline:"none", marginBottom:10, fontFamily:"'Outfit',sans-serif" };

    const saveBranch = () => {
      if (!branchForm.name.trim()) return;
      if (editingBranch !== null) {
        setBranches(prev => prev.map((b, i) => i === editingBranch ? {
          ...b,
          name: branchForm.name,
          type: branchForm.type,
          counters: Number(branchForm.counters),
          open: Number(branchForm.open),
          avgWait: Number(branchForm.avgWait),
          transactions: txOptions[branchForm.type] || [],
        } : b));
        pushNotif("Branch updated successfully.", "success");
      } else {
        const newBranch = {
          id: Date.now(),
          name: branchForm.name,
          type: branchForm.type,
          distance: branchForm.distance,
          counters: Number(branchForm.counters),
          open: Number(branchForm.open),
          serving: 1,
          queue: 0,
          avgWait: Number(branchForm.avgWait),
          lat: 5.55 + Math.random() * 0.05,
          lng: -0.20 + Math.random() * 0.05,
          transactions: txOptions[branchForm.type] || [],
        };
        setBranches(prev => [...prev, newBranch]);
        pushNotif(`Branch "${branchForm.name}" added successfully.`, "success");
      }
      setShowBranchModal(false);
      setEditingBranch(null);
      setBranchForm(emptyForm);
    };

    return (
      <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
        <style>{css}</style>
        {nav}

        {/* ── ADD / EDIT MODAL ── */}
        {showBranchModal && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"1rem" }}>
            <div style={{ background:T.card, borderRadius:20, padding:"2rem", width:"100%", maxWidth:480, boxShadow:T.shadowLg, maxHeight:"90vh", overflowY:"auto" }} className="fadeUp">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
                <h3 style={{ fontWeight:800, color:T.text, fontSize:"1.2rem" }}>
                  {editingBranch !== null ? "✏️ Edit Branch" : "➕ Add New Branch"}
                </h3>
                <button onClick={() => { setShowBranchModal(false); setEditingBranch(null); setBranchForm(emptyForm); }}
                  style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:"1.1rem", color:T.muted }}>✕</button>
              </div>

              <label style={{ fontSize:"0.8rem", fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>Branch Name *</label>
              <input value={branchForm.name} onChange={e => setBranchForm(f=>({...f, name:e.target.value}))}
                placeholder="e.g. GCB Bank — Kumasi Central" style={fieldStyle} />

              <label style={{ fontSize:"0.8rem", fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>Institution Type *</label>
              <select value={branchForm.type} onChange={e => setBranchForm(f=>({...f, type:e.target.value}))} style={fieldStyle}>
                {["Bank","Hospital","Network Provider","DVLA","Government"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <label style={{ fontSize:"0.8rem", fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>Distance from City Centre</label>
              <input value={branchForm.distance} onChange={e => setBranchForm(f=>({...f, distance:e.target.value}))}
                placeholder="e.g. 2.5 km" style={fieldStyle} />

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={{ fontSize:"0.8rem", fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>Total Counters</label>
                  <input type="number" min={1} max={20} value={branchForm.counters} onChange={e => setBranchForm(f=>({...f, counters:e.target.value}))} style={fieldStyle} />
                </div>
                <div>
                  <label style={{ fontSize:"0.8rem", fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>Counters Open Now</label>
                  <input type="number" min={0} max={branchForm.counters} value={branchForm.open} onChange={e => setBranchForm(f=>({...f, open:e.target.value}))} style={fieldStyle} />
                </div>
              </div>

              <label style={{ fontSize:"0.8rem", fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>Avg Service Time (minutes)</label>
              <input type="number" min={1} max={60} value={branchForm.avgWait} onChange={e => setBranchForm(f=>({...f, avgWait:e.target.value}))}
                placeholder="e.g. 5" style={fieldStyle} />

              <div style={{ background:T.input, borderRadius:10, padding:"10px 13px", marginBottom:16 }}>
                <p style={{ fontSize:"0.8rem", color:T.muted, marginBottom:4, fontWeight:600 }}>Transaction types assigned automatically based on institution type:</p>
                <p style={{ fontSize:"0.82rem", color:T.text }}>{(txOptions[branchForm.type]||[]).join(", ")}</p>
              </div>

              {!branchForm.name.trim() && (
                <p style={{ color:"#DC2626", fontSize:"0.82rem", marginBottom:10 }}>⚠ Branch name is required.</p>
              )}

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => { setShowBranchModal(false); setEditingBranch(null); setBranchForm(emptyForm); }}
                  style={{ flex:1, background:T.input, border:`1px solid ${T.border}`, color:T.text, borderRadius:10, padding:"11px", fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  Cancel
                </button>
                <button onClick={saveBranch}
                  style={{ flex:2, background:"linear-gradient(135deg,#0E8A5C,#059669)", color:"#fff", border:"none", borderRadius:10, padding:"11px", fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity: branchForm.name.trim() ? 1 : 0.5 }}>
                  {editingBranch !== null ? "Save Changes" : "Add Branch"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE CONTENT ── */}
        {wrap(<>
          <button onClick={() => setPage("admin-overview")} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", marginBottom:"1rem", fontSize:"0.9rem", fontWeight:600 }}>
            ← Back to Overview
          </button>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem", flexWrap:"wrap", gap:10 }}>
            <div>
              <h2 style={{ fontWeight:800, color:T.text }}>🗺 Branch Management</h2>
              <p style={{ color:T.muted, fontSize:"0.85rem", marginTop:2 }}>{branches.length} branches in the system</p>
            </div>
            <button onClick={() => { setBranchForm(emptyForm); setEditingBranch(null); setShowBranchModal(true); }}
              style={{ background:"linear-gradient(135deg,#0E8A5C,#059669)", color:"#fff", border:"none", borderRadius:10, padding:"10px 20px", fontWeight:700, fontSize:"0.88rem", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
              + Add Branch
            </button>
          </div>

          {branches.map((b, i) => (
            <div key={b.id || i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"1rem 1.2rem", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, color:T.text }}>{TYPE_ICONS[b.type]} {b.name}</span>
                    <span style={{ background: b.is_active === false ? "#DC262622" : "#0E8A5C22", color: b.is_active === false ? "#DC2626" : "#0E8A5C", borderRadius:6, padding:"2px 8px", fontSize:"0.72rem", fontWeight:700 }}>
                      {b.is_active === false ? "INACTIVE" : "ACTIVE"}
                    </span>
                  </div>
                  <p style={{ color:T.muted, fontSize:"0.82rem", marginTop:3 }}>
                    {b.type} · {b.counters} counters · Avg {b.avgWait} min/customer · {b.distance}
                  </p>
                  <p style={{ color:T.muted, fontSize:"0.78rem", marginTop:2 }}>
                    Services: {b.transactions.slice(0,3).join(", ")}{b.transactions.length > 3 ? ` +${b.transactions.length - 3} more` : ""}
                  </p>
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <button onClick={() => {
                    setBranchForm({ name:b.name, type:b.type, distance:b.distance, counters:b.counters, open:b.open, avgWait:b.avgWait, serving:b.serving, queue:b.queue });
                    setEditingBranch(i);
                    setShowBranchModal(true);
                  }} style={{ background:T.input, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"6px 14px", fontWeight:700, fontSize:"0.8rem", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => {
                    setBranches(prev => prev.map((br, idx) => idx === i ? { ...br, is_active: br.is_active === false ? true : false } : br));
                    pushNotif(`${b.name} has been ${b.is_active === false ? "reactivated" : "deactivated"}.`, b.is_active === false ? "success" : "warn");
                  }} style={{ background: b.is_active === false ? "#0E8A5C22" : "#DC262622", border:`1px solid ${b.is_active === false ? "#0E8A5C55" : "#DC262655"}`, color: b.is_active === false ? "#0E8A5C" : "#DC2626", borderRadius:8, padding:"6px 14px", fontWeight:700, fontSize:"0.8rem", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    {b.is_active === false ? "✅ Reactivate" : "🚫 Deactivate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>)}
      </div>
    );
  }

  // RATING MODAL (shown post-service)
  if (showRating) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,fontFamily:"'Outfit',sans-serif"}}>
      <div style={{background:T.card,borderRadius:20,padding:"2rem",maxWidth:380,width:"90%",textAlign:"center"}}>
        <div style={{fontSize:"2.5rem",marginBottom:12}}>⭐</div>
        <h3 style={{fontWeight:800,color:T.text,marginBottom:8}}>How was your service?</h3>
        <p style={{color:T.muted,fontSize:"0.9rem",marginBottom:"1.5rem"}}>Rate your experience at {myTicket?.branchName}</p>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:"1.5rem",fontSize:"2rem"}}>
          {[1,2,3,4,5].map(s=>(
            <span key={s} onClick={()=>setRating(s)} style={{cursor:"pointer",opacity:s<=rating?1:0.3,transition:"opacity .2s"}}>{s<=rating?"⭐":"☆"}</span>
          ))}
        </div>
        {btn("Submit Rating", ()=>{setShowRating(false);pushNotif("Thank you for your feedback! ⭐".repeat(rating),  "success");}, {full:true})}
      </div>
    </div>
  );

  return null;
}
