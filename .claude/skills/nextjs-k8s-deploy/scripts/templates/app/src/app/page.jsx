"use client";
import { useState, useRef, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════════
// SHARED DATA & UTILS
// ══════════════════════════════════════════════════════════════════════════════
const AGENTS = {
  "Triage Agent":      { color:"#94A3B8", bg:"rgba(148,163,184,0.12)", border:"rgba(148,163,184,0.2)" },
  "Concepts Agent":    { color:"#60A5FA", bg:"rgba(96,165,250,0.12)",  border:"rgba(96,165,250,0.25)" },
  "Debug Agent":       { color:"#FB7185", bg:"rgba(251,113,133,0.12)", border:"rgba(251,113,133,0.25)" },
  "Exercise Agent":    { color:"#34D399", bg:"rgba(52,211,153,0.12)",  border:"rgba(52,211,153,0.25)" },
  "Code Review Agent": { color:"#C084FC", bg:"rgba(192,132,252,0.12)", border:"rgba(192,132,252,0.25)" },
  "Progress Agent":    { color:"#FBBF24", bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.25)" },
};
const INIT_MSGS = [
  { id:1, role:"ai",   agent:"Triage Agent",  text:"Hi Maya! 👋 I'm your AI tutor. What would you like to work on today?" },
  { id:2, role:"user",                         text:"How do for loops work in Python?" },
  { id:3, role:"ai",   agent:"Concepts Agent", text:"A `for` loop iterates over any sequence.\n\nBasic syntax:\n```python\nfor item in collection:\n    print(item)\n```\nWith range:\n```python\nfor i in range(5):\n    print(i)  # 0,1,2,3,4\n```\nWant a practice exercise?" },
  { id:4, role:"user",                         text:"Yes please!" },
  { id:5, role:"ai",   agent:"Exercise Agent", text:"Write a `for` loop through `[3, 7, 2, 9, 1]` and print only numbers **greater than 4**.\n\nExpected:\n```\n7\n9\n```\nTry it in the Code tab!" },
];
const TOPICS = [
  { name:"Variables",      pct:92, level:"Mastered" },
  { name:"Data Types",     pct:85, level:"Proficient" },
  { name:"Loops",          pct:68, level:"Learning" },
  { name:"Lists",          pct:45, level:"Learning" },
  { name:"Functions",      pct:30, level:"Beginner" },
  { name:"OOP",            pct:0,  level:"Beginner" },
  { name:"Error Handling", pct:0,  level:"Beginner" },
  { name:"Libraries",      pct:0,  level:"Beginner" },
];
const LEVEL = {
  Mastered:   { color:"#60A5FA", bg:"rgba(96,165,250,0.12)",  border:"rgba(96,165,250,0.25)",  bar:"#3B82F6", label:"✓ Mastered" },
  Proficient: { color:"#34D399", bg:"rgba(52,211,153,0.12)",  border:"rgba(52,211,153,0.25)",  bar:"#10B981", label:"Proficient" },
  Learning:   { color:"#FBBF24", bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.25)",  bar:"#F59E0B", label:"Learning" },
  Beginner:   { color:"#FB7185", bg:"rgba(251,113,133,0.12)", border:"rgba(251,113,133,0.25)", bar:"#F43F5E", label:"Beginner" },
};
const STARTER = `# Write your Python code here\nprint("Hello, LearnFlow!")\n\n# Exercise: print numbers > 4\nnumbers = [3, 7, 2, 9, 1]\nfor n in numbers:\n    if n > 4:\n        print(n)\n`;
const ALERTS = [
  { id:1, name:"James Park",    initials:"JP", color:"#3B82F6", topic:"List Comprehensions", attempts:3, time:"12 min ago" },
  { id:2, name:"Sofia Alvarez", initials:"SA", color:"#8B5CF6", topic:"Recursion",            attempts:5, time:"24 min ago" },
  { id:3, name:"Alex Kim",      initials:"AK", color:"#F59E0B", topic:"File I/O",             attempts:2, time:"41 min ago" },
];
const STUDENTS = [
  { id:1, name:"Maya Chen",    initials:"MC", color:"#3B82F6", module:"Data Structures", mastery:64, status:"On Track",   active:true  },
  { id:2, name:"James Park",   initials:"JP", color:"#6366F1", module:"Control Flow",    mastery:31, status:"Struggling", active:true  },
  { id:3, name:"Sofia Alvarez",initials:"SA", color:"#8B5CF6", module:"Functions",       mastery:48, status:"Needs Help", active:false },
  { id:4, name:"Alex Kim",     initials:"AK", color:"#F59E0B", module:"Files",           mastery:39, status:"Struggling", active:true  },
  { id:5, name:"Priya Singh",  initials:"PS", color:"#10B981", module:"OOP",             mastery:82, status:"On Track",   active:true  },
  { id:6, name:"Luca Romano",  initials:"LR", color:"#F43F5E", module:"Libraries",       mastery:91, status:"On Track",   active:false },
  { id:7, name:"Aisha Diallo", initials:"AD", color:"#60A5FA", module:"Error Handling",  mastery:73, status:"On Track",   active:true  },
  { id:8, name:"Tom Walker",   initials:"TW", color:"#34D399", module:"Basics",          mastery:55, status:"Needs Help", active:true  },
];
const STATUS_STYLE = {
  "On Track":   { color:"#34D399", bg:"rgba(52,211,153,0.1)",  border:"rgba(52,211,153,0.2)"  },
  "Needs Help": { color:"#FBBF24", bg:"rgba(251,191,36,0.1)",  border:"rgba(251,191,36,0.2)"  },
  "Struggling": { color:"#FB7185", bg:"rgba(251,113,133,0.1)", border:"rgba(251,113,133,0.2)" },
};
const GENERATED_EX = {
  title:"List Comprehension Challenge", difficulty:"Intermediate",
  starter:`# Rewrite using list comprehensions\nnumbers = [1, 2, 3, 4, 5]\nsquares = []   # → list comprehension\nevens   = []   # → list comprehension\nprint(squares) # [1, 4, 9, 16, 25]\nprint(evens)   # [2, 4]`,
  expected:"[1, 4, 9, 16, 25]\n[2, 4]",
};

function hl(line) {
  let h = line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  h = h.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, m=>`<span style="color:#98C379">${m}</span>`);
  h = h.replace(/\b(for|in|if|else|elif|while|def|class|return|import|from|print|True|False|None|and|or|not|pass|break|continue)\b/g, m=>`<span style="color:#C678DD">${m}</span>`);
  h = h.replace(/\b(\d+)\b/g, m=>`<span style="color:#D19A66">${m}</span>`);
  h = h.replace(/(#.*)$/, m=>`<span style="color:#5C6370;font-style:italic">${m}</span>`);
  return h;
}
function Avatar({ initials, color, size=30 }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", background:`${color}22`, border:`1.5px solid ${color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.36, fontWeight:700, color, flexShrink:0 }}>{initials}</div>;
}
function Toast({ message, type="error", onClose }) {
  const colors = { error:{ bg:"rgba(244,63,94,0.12)", border:"rgba(244,63,94,0.25)", text:"#FB7185" }, success:{ bg:"rgba(16,185,129,0.12)", border:"rgba(16,185,129,0.25)", text:"#34D399" }, info:{ bg:"rgba(59,130,246,0.12)", border:"rgba(59,130,246,0.25)", text:"#60A5FA" } };
  const c=colors[type]||colors.error;
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[onClose]);
  return <div style={{position:"fixed",top:14,right:14,zIndex:9999,padding:"10px 16px",borderRadius:10,background:c.bg,border:`1px solid ${c.border}`,color:c.text,fontSize:13,fontWeight:500,maxWidth:340,animation:"fadein 0.2s ease",boxShadow:"0 8px 24px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",gap:8}}>
    <span style={{flex:1}}>{message}</span>
    <button onClick={onClose} style={{background:"transparent",border:"none",color:c.text,cursor:"pointer",fontSize:14,padding:0}}>×</button>
  </div>;
}
function LoadingSpinner({size=24,color="#3B82F6"}) {
  return <div style={{width:size,height:size,border:`2.5px solid ${color}30`,borderTopColor:color,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>;
}
function useLocalStorage(key,initial) {
  const [val,setVal]=useState(()=>{if(typeof window==="undefined")return initial;try{const s=localStorage.getItem(key);return s!==null?JSON.parse(s):initial;}catch{return initial;}});
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(val));}catch{}},[key,val]);
  return [val,setVal];
}
function Badge({ label, style:s }) {
  return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, color:s.color, background:s.bg, border:`1px solid ${s.border}` }}>{label}</span>;
}
function Ring({ pct, size=110, stroke=8 }) {
  const r=(size-stroke)/2, c=2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#rg)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(pct/100)*c} ${c}`}/>
      <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B82F6"/><stop offset="100%" stopColor="#818CF8"/></linearGradient></defs>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ══════════════════════════════════════════════════════════════════════════════
const floatingSymbols = [
  { char:"def",     style:{ top:"12%", left:"4%",   fontSize:"1.1rem", transform:"rotate(-15deg)" } },
  { char:"[]",      style:{ top:"25%", left:"8%",   fontSize:"1.4rem", transform:"rotate(10deg)"  } },
  { char:"λ",       style:{ top:"60%", left:"3%",   fontSize:"2rem",   transform:"rotate(-5deg)"  } },
  { char:"for i in",style:{ top:"75%", left:"6%",   fontSize:"0.9rem", transform:"rotate(8deg)"   } },
  { char:"{}",      style:{ top:"40%", left:"2%",   fontSize:"1.6rem", transform:"rotate(-20deg)" } },
  { char:"import",  style:{ top:"88%", left:"5%",   fontSize:"1rem",   transform:"rotate(12deg)"  } },
  { char:"print()", style:{ top:"8%",  right:"5%",  fontSize:"1rem",   transform:"rotate(10deg)"  } },
  { char:"class",   style:{ top:"22%", right:"3%",  fontSize:"1.1rem", transform:"rotate(-8deg)"  } },
  { char:"→",       style:{ top:"45%", right:"4%",  fontSize:"1.8rem", transform:"rotate(5deg)"   } },
  { char:"True",    style:{ top:"65%", right:"6%",  fontSize:"1rem",   transform:"rotate(-12deg)" } },
  { char:"//",      style:{ top:"80%", right:"4%",  fontSize:"1.4rem", transform:"rotate(15deg)"  } },
  { char:"≡",       style:{ top:"90%", right:"8%",  fontSize:"1.6rem", transform:"rotate(-6deg)"  } },
];
const FEATURES = [
  { accent:"#3B82F6", accentBg:"rgba(59,130,246,0.12)",  label:"AI Tutoring Agents",    desc:"6 specialized agents that adapt to your level — from concept explainers to live debuggers.", icon:"🤖" },
  { accent:"#8B5CF6", accentBg:"rgba(139,92,246,0.12)",  label:"Live Code Editor",       desc:"Write, run, and debug Python directly in your browser with syntax highlighting and instant output.", icon:"💻" },
  { accent:"#10B981", accentBg:"rgba(16,185,129,0.12)",  label:"Smart Progress Tracking",desc:"Mastery scores across 8 Python modules with visual progress rings and level badges.", icon:"📊" },
  { accent:"#F59E0B", accentBg:"rgba(245,158,11,0.12)",  label:"Struggle Detection",     desc:"Teachers get real-time alerts the moment a student is stuck — before they give up.", icon:"🔔" },
];
const MODULES = [
  { n:"01", label:"Basics",          sub:"Variables & I/O"        },
  { n:"02", label:"Control Flow",    sub:"Loops & Conditions"      },
  { n:"03", label:"Data Structures", sub:"Lists, Dicts, Sets"      },
  { n:"04", label:"Functions",       sub:"Scope & Return"          },
  { n:"05", label:"OOP",             sub:"Classes & Inheritance"   },
  { n:"06", label:"Files",           sub:"CSV & JSON"              },
  { n:"07", label:"Error Handling",  sub:"Try/Except"              },
  { n:"08", label:"Libraries",       sub:"pip & APIs"              },
];

function LandingPage({ onNavigate }) {
  const [hovered, setHovered] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", minHeight:"100vh", background:"#0F172A", color:"#E2E8F0", overflowX:"hidden", position:"relative" }}>

      {/* Ambient blobs */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
        <div style={{ position:"absolute", width:700, height:700, top:"-20%", left:"30%", borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 70%)", filter:"blur(40px)" }}/>
        <div style={{ position:"absolute", width:500, height:500, top:"50%", right:"-10%", borderRadius:"50%", background:"radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)", filter:"blur(40px)" }}/>
        <div style={{ position:"absolute", width:400, height:400, bottom:"10%", left:"5%", borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)", filter:"blur(40px)" }}/>
        <div style={{ position:"absolute", inset:0, opacity:0.04, backgroundImage:"linear-gradient(rgba(148,163,184,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.4) 1px,transparent 1px)", backgroundSize:"48px 48px" }}/>
      </div>

      {/* Floating code symbols — hidden on mobile */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
        {floatingSymbols.map((s,i)=>(
          <span key={i} style={{ position:"absolute", fontFamily:"monospace", color:"rgba(96,165,250,0.08)", userSelect:"none", fontSize:"1rem", ...s.style }}>
            {s.char}
          </span>
        ))}
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position:"relative", zIndex:20, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:58, background:"rgba(15,23,42,0.8)", borderBottom:"1px solid rgba(148,163,184,0.08)", backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#3B82F6,#6366F1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{width:14,height:14}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span style={{ fontSize:15, fontWeight:700, color:"white", letterSpacing:"-0.01em" }}>LearnFlow</span>
        </div>

        {/* desktop nav */}
        <div style={{ display:"flex", alignItems:"center", gap:24, fontSize:13, color:"#94A3B8" }} className="lf-hide-mobile">
          {["Features","Curriculum","For Teachers","Pricing"].map(item=>(
            <a key={item} href="#" style={{ color:"#94A3B8", textDecoration:"none", transition:"color 0.15s" }}
              onMouseEnter={e=>e.target.style.color="#E2E8F0"} onMouseLeave={e=>e.target.style.color="#94A3B8"}>{item}</a>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={()=>onNavigate("login")} style={{ fontSize:13, fontWeight:500, padding:"7px 14px", borderRadius:8, background:"rgba(59,130,246,0.12)", border:"1px solid rgba(59,130,246,0.25)", color:"#93C5FD", cursor:"pointer", transition:"all 0.15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(59,130,246,0.22)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="rgba(59,130,246,0.12)"; }}>
            Sign In
          </button>
          {/* mobile hamburger */}
          <button onClick={()=>setMobileMenu(v=>!v)} className="lf-show-mobile" style={{ background:"rgba(30,41,59,0.7)", border:"1px solid rgba(148,163,184,0.1)", borderRadius:7, padding:"6px 7px", color:"#94A3B8", cursor:"pointer", display:"none", alignItems:"center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
          </button>
        </div>
      </nav>

      {/* mobile menu */}
      {mobileMenu && (
        <div style={{ position:"relative", zIndex:20, background:"rgba(15,23,42,0.99)", borderBottom:"1px solid rgba(148,163,184,0.08)", padding:"10px 16px 14px" }}>
          {["Features","Curriculum","For Teachers","Pricing"].map(item=>(
            <div key={item} style={{ padding:"10px 4px", fontSize:14, color:"#94A3B8", borderBottom:"1px solid rgba(148,163,184,0.05)" }}>{item}</div>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"80px 20px 64px" }}>
        {/* eyebrow */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:11, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:28, padding:"6px 16px", borderRadius:99, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)", color:"#93C5FD" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#60A5FA", display:"inline-block", animation:"pulse2 2s ease-in-out infinite" }}/>
          AI-Powered Python Education
        </div>

        {/* headline */}
        <h1 style={{ fontSize:"clamp(2.4rem,7vw,4.5rem)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.05, marginBottom:20, color:"white" }}>
          Master Python<br/>
          <span style={{ background:"linear-gradient(90deg,#3B82F6 0%,#818CF8 50%,#A78BFA 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            with AI
          </span>
        </h1>

        <p style={{ fontSize:"clamp(0.95rem,2.5vw,1.15rem)", color:"#94A3B8", maxWidth:520, marginBottom:44, lineHeight:1.7 }}>
          Six specialized AI tutors. A live code editor. Real-time progress tracking.
          Everything you need to go from zero to proficient.
        </p>

        {/* CTA cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, width:"100%", maxWidth:460 }} className="lf-cta-row">
          {/* Student */}
          <button
            onClick={()=>onNavigate("login")}
            style={{ flex:1, padding:"18px 22px", borderRadius:14, border:"none", textAlign:"left", cursor:"pointer", transition:"all 0.25s",
              background: hovered==="student" ? "linear-gradient(135deg,#2563EB,#3B82F6)" : "linear-gradient(135deg,#1D4ED8,#2563EB)",
              boxShadow: hovered==="student" ? "0 20px 40px -12px rgba(59,130,246,0.5),0 0 0 1px rgba(59,130,246,0.4)" : "0 8px 24px -8px rgba(59,130,246,0.3),0 0 0 1px rgba(59,130,246,0.2)",
              transform: hovered==="student" ? "translateY(-2px)" : "translateY(0)",
            }}
            onMouseEnter={()=>setHovered("student")} onMouseLeave={()=>setHovered(null)}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(191,219,254,0.7)" }}>Student</span>
              <svg viewBox="0 0 20 20" fill="currentColor" style={{width:14,height:14,color:"rgba(191,219,254,0.6)",transform:hovered==="student"?"translateX(3px)":"none",transition:"transform 0.2s"}}><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd"/></svg>
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:"white", marginBottom:3 }}>I'm a Student</div>
            <div style={{ fontSize:12, color:"rgba(219,234,254,0.65)" }}>Start learning with your AI tutor</div>
          </button>

          {/* Teacher */}
          <button
            onClick={()=>onNavigate("login")}
            style={{ flex:1, padding:"18px 22px", borderRadius:14, border:"none", textAlign:"left", cursor:"pointer", transition:"all 0.25s",
              background: hovered==="teacher" ? "linear-gradient(135deg,#059669,#10B981)" : "linear-gradient(135deg,#047857,#059669)",
              boxShadow: hovered==="teacher" ? "0 20px 40px -12px rgba(16,185,129,0.5),0 0 0 1px rgba(16,185,129,0.4)" : "0 8px 24px -8px rgba(16,185,129,0.3),0 0 0 1px rgba(16,185,129,0.2)",
              transform: hovered==="teacher" ? "translateY(-2px)" : "translateY(0)",
            }}
            onMouseEnter={()=>setHovered("teacher")} onMouseLeave={()=>setHovered(null)}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(167,243,208,0.7)" }}>Teacher</span>
              <svg viewBox="0 0 20 20" fill="currentColor" style={{width:14,height:14,color:"rgba(167,243,208,0.6)",transform:hovered==="teacher"?"translateX(3px)":"none",transition:"transform 0.2s"}}><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd"/></svg>
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:"white", marginBottom:3 }}>I'm a Teacher</div>
            <div style={{ fontSize:12, color:"rgba(167,243,208,0.65)" }}>Monitor your class in real-time</div>
          </button>
        </div>

        <p style={{ marginTop:20, fontSize:11, color:"#334155", letterSpacing:"0.04em" }}>
          Trusted by 2,400+ students across 18 universities
        </p>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position:"relative", zIndex:10, padding:"0 20px 72px", maxWidth:1080, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#475569", marginBottom:10 }}>Platform</p>
          <h2 style={{ fontSize:"clamp(1.6rem,4vw,2.4rem)", fontWeight:800, color:"white", letterSpacing:"-0.02em" }}>Everything you need to learn Python</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
          {FEATURES.map((f,i)=>(
            <div key={i} style={{ background:"rgba(15,23,42,0.6)", border:`1px solid ${f.accent}25`, borderRadius:14, padding:"22px 20px", backdropFilter:"blur(12px)", transition:"all 0.2s", cursor:"default" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.borderColor=`${f.accent}45`; e.currentTarget.style.boxShadow=`0 12px 32px -8px rgba(0,0,0,0.4)`; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor=`${f.accent}25`; e.currentTarget.style.boxShadow="none"; }}
            >
              <div style={{ width:40, height:40, borderRadius:10, background:f.accentBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:14 }}>{f.icon}</div>
              <h3 style={{ fontSize:13, fontWeight:600, color:"#E2E8F0", marginBottom:7 }}>{f.label}</h3>
              <p style={{ fontSize:12, color:"#64748B", lineHeight:1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CURRICULUM ── */}
      <section style={{ position:"relative", zIndex:10, padding:"0 20px 72px", maxWidth:860, margin:"0 auto" }}>
        <div style={{ background:"rgba(15,23,42,0.7)", border:"1px solid rgba(148,163,184,0.08)", borderRadius:20, padding:"28px 24px", backdropFilter:"blur(16px)" }}>
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:24 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#475569", marginBottom:6 }}>Curriculum</p>
              <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.6rem)", fontWeight:700, color:"white", letterSpacing:"-0.01em" }}>8 Modules. One clear path.</h2>
            </div>
            <span style={{ fontSize:11, fontWeight:600, padding:"5px 12px", borderRadius:99, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)", color:"#93C5FD" }}>Structured progression</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:8 }}>
            {MODULES.map(m=>(
              <div key={m.n} style={{ background:"rgba(30,41,59,0.8)", border:"1px solid rgba(148,163,184,0.06)", borderRadius:10, padding:"11px 13px", transition:"border-color 0.18s", cursor:"default" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(59,130,246,0.2)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(148,163,184,0.06)"}
              >
                <span style={{ fontSize:10, fontFamily:"monospace", color:"rgba(59,130,246,0.5)", display:"block", marginBottom:3 }}>{m.n}</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#E2E8F0", display:"block", lineHeight:1.3 }}>{m.label}</span>
                <span style={{ fontSize:11, color:"#475569" }}>{m.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position:"relative", zIndex:10, textAlign:"center", padding:"24px 20px 32px", borderTop:"1px solid rgba(148,163,184,0.07)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginBottom:6 }}>
          <div style={{ width:20, height:20, borderRadius:5, background:"linear-gradient(135deg,#3B82F6,#6366F1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{width:11,height:11}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span style={{ fontSize:13, fontWeight:600, color:"#CBD5E1" }}>LearnFlow</span>
        </div>
        <p style={{ fontSize:11, color:"#334155" }}>Powered by LearnFlow AI &nbsp;•&nbsp; Built with Claude Code &amp; Goose</p>
      </footer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin, onDemoLogin, onBack }) {
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [name, setName]       = useState("");
  const [regRole, setRegRole] = useState("student");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(null);
  const [err, setErr]         = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const demoLogin = (role) => {
    setLoading(role); setErr("");
    setTimeout(() => { setLoading(null); onDemoLogin(role); }, 600);
  };
  const submit = async () => {
    if (isRegister && !name.trim()) { setErr("Please enter your name."); return; }
    if (!email.trim() || !pw.trim()) { setErr("Please enter your email and password."); return; }
    if (isRegister && pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setLoading("auth"); setErr("");
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const body = isRegister ? { name, email, password: pw, role: regRole } : { email, password: pw };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Something went wrong"); setLoading(null); return; }
      setLoading(null);
      onLogin(data.user, data.token);
    } catch { setErr("Network error. Please try again."); setLoading(null); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0F172A", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", width:"60vw", height:"60vw", maxWidth:500, top:"-15%", left:"25%", borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)", filter:"blur(40px)" }}/>
        <div style={{ position:"absolute", width:"40vw", height:"40vw", maxWidth:400, bottom:"5%", right:"5%", borderRadius:"50%", background:"radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)", filter:"blur(40px)" }}/>
        <div style={{ position:"absolute", inset:0, opacity:0.04, backgroundImage:"linear-gradient(rgba(148,163,184,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.5) 1px,transparent 1px)", backgroundSize:"48px 48px" }}/>
      </div>

      {/* back to landing */}
      <button onClick={onBack} style={{ position:"absolute", top:16, left:16, display:"flex", alignItems:"center", gap:6, background:"rgba(30,41,59,0.7)", border:"1px solid rgba(148,163,184,0.1)", borderRadius:8, padding:"7px 12px", color:"#94A3B8", cursor:"pointer", fontSize:12, fontWeight:500, zIndex:10 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
        Back
      </button>

      <div style={{ width:"100%", maxWidth:380, position:"relative", zIndex:1, animation:"fadein 0.3s ease" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28 }}>
          <div style={{ width:44, height:44, borderRadius:13, background:"linear-gradient(135deg,#3B82F6,#6366F1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10, boxShadow:"0 8px 24px rgba(59,130,246,0.3)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{width:20,height:20}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span style={{ fontSize:20, fontWeight:800, color:"#F1F5F9", letterSpacing:"-0.02em" }}>LearnFlow</span>
          <span style={{ fontSize:12, color:"#475569", marginTop:3 }}>AI-Powered Python Education</span>
        </div>

        <div style={{ background:"rgba(30,41,59,0.65)", border:"1px solid rgba(148,163,184,0.1)", borderRadius:18, padding:"24px 22px", backdropFilter:"blur(16px)", boxShadow:"0 24px 48px rgba(0,0,0,0.4)" }}>
          <h1 style={{ fontSize:17, fontWeight:700, color:"#F1F5F9", marginBottom:3, textAlign:"center" }}>{isRegister ? "Create Account" : "Welcome back"}</h1>
          <p style={{ fontSize:12, color:"#64748B", textAlign:"center", marginBottom:22 }}>{isRegister ? "Join LearnFlow today" : "Sign in to continue learning"}</p>

          {err && <div style={{ background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.2)", borderRadius:9, padding:"9px 13px", fontSize:12, color:"#FB7185", marginBottom:14, textAlign:"center" }}>{err}</div>}

          {isRegister && (
            <>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:"0.08em", textTransform:"uppercase", display:"block", marginBottom:5 }}>Full Name</label>
                <div style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(15,23,42,0.6)", border:"1px solid rgba(148,163,184,0.1)", borderRadius:10, padding:"10px 12px" }}
                  onFocusCapture={e=>e.currentTarget.style.borderColor="rgba(59,130,246,0.4)"}
                  onBlurCapture={e=>e.currentTarget.style.borderColor="rgba(148,163,184,0.1)"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" style={{width:15,height:15,flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                  <input value={name} onChange={e=>setName(e.target.value)} type="text" placeholder="Your full name" style={{ flex:1, background:"transparent", border:"none", color:"#E2E8F0", fontSize:13, fontFamily:"inherit", minWidth:0 }}/>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:"0.08em", textTransform:"uppercase", display:"block", marginBottom:5 }}>I am a</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <button onClick={()=>setRegRole("student")} style={{ padding:"8px", borderRadius:8, border:`1px solid ${regRole==="student"?"rgba(59,130,246,0.5)":"rgba(148,163,184,0.1)"}`, background:regRole==="student"?"rgba(59,130,246,0.15)":"rgba(15,23,42,0.6)", color:regRole==="student"?"#60A5FA":"#64748B", fontSize:12, fontWeight:600, cursor:"pointer" }}>Student</button>
                  <button onClick={()=>setRegRole("teacher")} style={{ padding:"8px", borderRadius:8, border:`1px solid ${regRole==="teacher"?"rgba(16,185,129,0.5)":"rgba(148,163,184,0.1)"}`, background:regRole==="teacher"?"rgba(16,185,129,0.15)":"rgba(15,23,42,0.6)", color:regRole==="teacher"?"#34D399":"#64748B", fontSize:12, fontWeight:600, cursor:"pointer" }}>Teacher</button>
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:"0.08em", textTransform:"uppercase", display:"block", marginBottom:5 }}>Email</label>
            <div style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(15,23,42,0.6)", border:"1px solid rgba(148,163,184,0.1)", borderRadius:10, padding:"10px 12px" }}
              onFocusCapture={e=>e.currentTarget.style.borderColor="rgba(59,130,246,0.4)"}
              onBlurCapture={e=>e.currentTarget.style.borderColor="rgba(148,163,184,0.1)"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" style={{width:15,height:15,flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@university.edu" style={{ flex:1, background:"transparent", border:"none", color:"#E2E8F0", fontSize:13, fontFamily:"inherit", minWidth:0 }}/>
            </div>
          </div>

          <div style={{ marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <label style={{ fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:"0.08em", textTransform:"uppercase" }}>Password</label>
              <button style={{ fontSize:11, color:"#3B82F6", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Forgot?</button>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(15,23,42,0.6)", border:"1px solid rgba(148,163,184,0.1)", borderRadius:10, padding:"10px 12px" }}
              onFocusCapture={e=>e.currentTarget.style.borderColor="rgba(59,130,246,0.4)"}
              onBlurCapture={e=>e.currentTarget.style.borderColor="rgba(148,163,184,0.1)"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" style={{width:15,height:15,flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
              <input value={pw} onChange={e=>setPw(e.target.value)} type={showPw?"text":"password"} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()} style={{ flex:1, background:"transparent", border:"none", color:"#E2E8F0", fontSize:13, fontFamily:"inherit", minWidth:0 }}/>
              <button onClick={()=>setShowPw(v=>!v)} style={{ background:"none", border:"none", cursor:"pointer", color:"#475569", display:"flex", padding:2, flexShrink:0 }}>
                {showPw
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:15,height:15}}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:15,height:15}}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                }
              </button>
            </div>
          </div>

          <button onClick={submit} disabled={!!loading} style={{ width:"100%", padding:"11px", borderRadius:10, border:"none", background:loading?"rgba(59,130,246,0.25)":"linear-gradient(135deg,#2563EB,#3B82F6)", color:"white", fontSize:14, fontWeight:600, cursor:loading?"default":"pointer", boxShadow:loading?"none":"0 4px 16px rgba(59,130,246,0.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10 }}>
            {loading==="auth" ? <><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.35)",borderTopColor:"white",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>{isRegister?"Creating account...":"Signing in..."}</> : isRegister?"Create Account":"Sign In"}
          </button>

          <button onClick={()=>{setIsRegister(v=>!v);setErr("");}} style={{ width:"100%", background:"none", border:"none", color:"#3B82F6", fontSize:12, cursor:"pointer", padding:"6px", fontFamily:"inherit", marginBottom:14 }}>
            {isRegister ? "Already have an account? Sign in" : "Don't have an account? Register"}
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <div style={{ flex:1, height:1, background:"rgba(148,163,184,0.08)" }}/>
            <span style={{ fontSize:11, color:"#334155", whiteSpace:"nowrap" }}>or try demo</span>
            <div style={{ flex:1, height:1, background:"rgba(148,163,184,0.08)" }}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <button onClick={()=>demoLogin("student")} disabled={!!loading}
              style={{ padding:"10px 6px", borderRadius:10, border:"1px solid rgba(59,130,246,0.25)", background:"rgba(59,130,246,0.1)", color:"#60A5FA", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(59,130,246,0.18)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(59,130,246,0.1)"}
            >
              {loading==="student"?<span style={{width:12,height:12,border:"2px solid #60A5FA",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>:"🎓"} Student Demo
            </button>
            <button onClick={()=>demoLogin("teacher")} disabled={!!loading}
              style={{ padding:"10px 6px", borderRadius:10, border:"1px solid rgba(16,185,129,0.25)", background:"rgba(16,185,129,0.1)", color:"#34D399", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(16,185,129,0.18)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(16,185,129,0.1)"}
            >
              {loading==="teacher"?<span style={{width:12,height:12,border:"2px solid #34D399",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>:"👨‍🏫"} Teacher Demo
            </button>
          </div>
        </div>
        <p style={{ textAlign:"center", fontSize:11, color:"#2D3748", marginTop:18 }}>Powered by LearnFlow AI · Built with Claude Code &amp; Goose</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { id:"dashboard", label:"Dashboard", emoji:"⊞" },
  { id:"progress",  label:"Progress",  emoji:"📈" },
  { id:"settings",  label:"Settings",  emoji:"⚙️" },
];
function Sidebar({ expanded, setExpanded, activePage, setActivePage, role, onLogout, isMobile, onClose }) {
  const accent = role==="teacher"?"#10B981":"#3B82F6";
  const grad   = role==="teacher"?"linear-gradient(135deg,#10B981,#059669)":"linear-gradient(135deg,#3B82F6,#6366F1)";
  return (
    <>
      {isMobile && expanded && <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:25, backdropFilter:"blur(2px)" }}/>}
      <div style={{ position:isMobile?"fixed":"relative", top:0, left:isMobile?(expanded?0:-240):"auto", height:isMobile?"100vh":"100%", width:isMobile?220:(expanded?210:56), background:"rgba(13,20,36,0.99)", borderRight:"1px solid rgba(148,163,184,0.08)", display:"flex", flexDirection:"column", transition:isMobile?"left 0.25s cubic-bezier(.4,0,.2,1)":"width 0.25s cubic-bezier(.4,0,.2,1)", overflow:"hidden", flexShrink:0, zIndex:30 }}>
        <div style={{ height:50, display:"flex", alignItems:"center", padding:"0 13px", borderBottom:"1px solid rgba(148,163,184,0.07)", gap:8, flexShrink:0 }}>
          <div style={{ width:26, height:26, borderRadius:7, background:grad, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{width:12,height:12}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          {(expanded||isMobile) && <span style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", whiteSpace:"nowrap" }}>LearnFlow</span>}
        </div>
        {(expanded||isMobile) && (
          <div style={{ margin:"10px 8px 4px", padding:"9px 11px", background:"rgba(30,41,59,0.5)", border:"1px solid rgba(148,163,184,0.07)", borderRadius:10, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"white", flexShrink:0 }}>{role==="teacher"?"R":"M"}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#E2E8F0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{role==="teacher"?"Mr. Rodriguez":"Maya Chen"}</div>
              <div style={{ fontSize:10, color:accent, fontWeight:500, textTransform:"capitalize" }}>{role}</div>
            </div>
          </div>
        )}
        <nav style={{ flex:1, padding:"8px", display:"flex", flexDirection:"column", gap:2 }}>
          {NAV_ITEMS.map(n=>{
            const active=activePage===n.id;
            return <button key={n.id} onClick={()=>{ setActivePage(n.id); if(isMobile) onClose(); }} style={{ display:"flex", alignItems:"center", gap:9, padding:(expanded||isMobile)?"8px 11px":"8px", justifyContent:(expanded||isMobile)?"flex-start":"center", borderRadius:8, border:"none", cursor:"pointer", background:active?`${accent}15`:"transparent", color:active?accent:"#64748B", fontWeight:active?600:400, fontSize:13, transition:"all 0.15s", width:"100%", position:"relative" }}
              onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background="rgba(148,163,184,0.06)"; e.currentTarget.style.color="#94A3B8"; }}}
              onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748B"; }}}>
              {active && <span style={{ position:"absolute", left:0, top:"18%", bottom:"18%", width:3, borderRadius:"0 3px 3px 0", background:accent }}/>}
              <span style={{ fontSize:14, flexShrink:0 }}>{n.emoji}</span>
              {(expanded||isMobile) && <span style={{ whiteSpace:"nowrap" }}>{n.label}</span>}
            </button>;
          })}
        </nav>
        <div style={{ padding:"8px", borderTop:"1px solid rgba(148,163,184,0.07)", display:"flex", flexDirection:"column", gap:3 }}>
          <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:9, padding:(expanded||isMobile)?"8px 11px":"8px", justifyContent:(expanded||isMobile)?"flex-start":"center", borderRadius:8, border:"none", cursor:"pointer", background:"transparent", color:"#64748B", fontSize:13, width:"100%", transition:"all 0.15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(244,63,94,0.08)"; e.currentTarget.style.color="#FB7185"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748B"; }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:15,height:15,flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
            {(expanded||isMobile) && <span style={{whiteSpace:"nowrap"}}>Log Out</span>}
          </button>
          {!isMobile && (
            <button onClick={()=>setExpanded(v=>!v)} style={{ display:"flex", alignItems:"center", gap:9, padding:expanded?"8px 11px":"8px", justifyContent:expanded?"flex-start":"center", borderRadius:8, border:"none", cursor:"pointer", background:"rgba(148,163,184,0.04)", color:"#475569", fontSize:12, width:"100%", transition:"all 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="rgba(148,163,184,0.1)"; e.currentTarget.style.color="#94A3B8"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="rgba(148,163,184,0.04)"; e.currentTarget.style.color="#475569"; }}>
              <span style={{ display:"flex", transform:expanded?"rotate(180deg)":"none", transition:"transform 0.25s", flexShrink:0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
              </span>
              {expanded && <span style={{whiteSpace:"nowrap"}}>Collapse</span>}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function StudentDashboard({ user }) {
  const isDemo = !user || user.id === 0;
  const token = typeof window !== "undefined" ? localStorage.getItem("lf_token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const [tab, setTab]           = useLocalStorage("lf_student_tab","chat");
  const [msgs, setMsgs]         = useState(isDemo ? INIT_MSGS : []);
  const [input, setInput]       = useState("");
  const [typing, setTyping]     = useState(false);
  const [runState, setRunState] = useState("ready");
  const [output, setOutput]     = useState("");
  const [code, setCode]         = useLocalStorage("lf_code",STARTER);
  const [topics, setTopics]     = useState(isDemo ? TOPICS : []);
  const [execStats, setExecStats] = useState({ total: 0, successes: 0, streak: 0, active_days: 0 });
  const [dataLoading, setDataLoading] = useState(!isDemo);
  const [toast, setToast] = useState(null);
  const chatEnd = useRef(null);
  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[msgs,typing]);

  // Load real data on mount
  useEffect(()=>{
    if(isDemo) return;
    let loaded=0;
    const done=()=>{loaded++;if(loaded>=3)setDataLoading(false);};
    // Load progress
    fetch("/api/progress",{headers:authHeaders}).then(r=>{if(!r.ok)throw new Error("Failed to load progress");return r.json();}).then(d=>{if(d)setTopics(d.topics);}).catch(e=>{setToast({message:e.message||"Failed to load progress",type:"error"});}).finally(done);
    // Load execution stats
    fetch("/api/submissions",{headers:authHeaders}).then(r=>{if(!r.ok)throw new Error("Failed to load stats");return r.json();}).then(d=>{if(d&&d.stats)setExecStats(d.stats);}).catch(()=>{}).finally(done);
    // Load chat history
    fetch("/api/chat/history",{headers:authHeaders}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(d=>{
      if(d && d.messages && d.messages.length>0) setMsgs(d.messages.map(m=>({id:m.id,role:m.role==="user"?"user":"ai",agent:m.agent||"Concepts Agent",text:m.text})));
      else setMsgs([{id:1,role:"ai",agent:"Triage Agent",text:`Hi ${user?.name?.split(" ")[0]||"there"}! I'm your AI tutor. What would you like to learn today?`}]);
    }).catch(()=>{setMsgs([{id:1,role:"ai",agent:"Triage Agent",text:`Hi ${user?.name?.split(" ")[0]||"there"}! I'm your AI tutor. What would you like to learn today?`}]);}).finally(done);
    // Periodic struggle check (stuck time + low quiz detection) every 60s
    const struggleCheck = setInterval(()=>{
      fetch("/api/progress/check-struggle",{headers:authHeaders}).catch(()=>{});
    }, 60000);
    return ()=>clearInterval(struggleCheck);
  },[]);

  const send = () => {
    const t=input.trim(); if(!t) return;
    setMsgs(p=>[...p,{id:Date.now(),role:"user",text:t}]);
    setInput(""); setTyping(true);
    // Save user message to DB
    if(!isDemo) fetch("/api/chat/history",{method:"POST",headers:{"Content-Type":"application/json",...authHeaders},body:JSON.stringify({role:"user",text:t})}).catch(()=>{});
    // Call AI chat API
    fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json",...authHeaders},body:JSON.stringify({message:t,user_id:user?.id||"anonymous"})})
      .then(r=>r.json())
      .then(data=>{
        setTyping(false);
        const aiText = data.message || data.error || "I'm here to help! Try asking about Python concepts.";
        const aiAgent = data.agent || "Concepts Agent";
        setMsgs(p=>[...p,{id:Date.now()+1,role:"ai",agent:aiAgent,text:aiText}]);
        // Save AI response to DB + refresh progress (mastery may have changed)
        if(!isDemo) {
          fetch("/api/chat/history",{method:"POST",headers:{"Content-Type":"application/json",...authHeaders},body:JSON.stringify({role:"ai",text:aiText,agent:aiAgent})}).catch(()=>{});
          fetch("/api/progress",{headers:authHeaders}).then(r=>r.ok?r.json():null).then(d=>{if(d)setTopics(d.topics);}).catch(()=>{});
        }
      })
      .catch(()=>{
        setTyping(false);
        setMsgs(p=>[...p,{id:Date.now()+1,role:"ai",agent:"Triage Agent",text:"Sorry, I couldn't reach the AI tutor right now. Please try again!"}]);
        setToast({message:"Chat request failed. Check your connection.",type:"error"});
      });
  };
  const [assignments,setAssignments]=useState([]);
  const [quizzes,setQuizzes]=useState([]);
  const [activeQuiz,setActiveQuiz]=useState(null);
  const [quizAnswers,setQuizAnswers]=useState([]);
  const [quizResult,setQuizResult]=useState(null);
  const [submittingQuiz,setSubmittingQuiz]=useState(false);
  const [activeExercise,setActiveExercise]=useState(null);
  const [exCode,setExCode]=useState("");
  const [exSubmitting,setExSubmitting]=useState(false);
  const [exResult,setExResult]=useState(null);
  const [genQuizTopic,setGenQuizTopic]=useState("");
  const [genQuizLoading,setGenQuizLoading]=useState(false);

  // Load assignments + quizzes
  useEffect(()=>{
    if(isDemo) return;
    fetch("/api/teacher/assign",{headers:authHeaders}).then(r=>r.ok?r.json():null).then(d=>{if(d&&d.exercises)setAssignments(d.exercises);}).catch(()=>{});
    fetch("/api/quizzes",{headers:authHeaders}).then(r=>r.ok?r.json():null).then(d=>{if(d&&d.quizzes)setQuizzes(d.quizzes);}).catch(()=>{});
  },[]);

  const submitQuiz=async()=>{
    if(!activeQuiz||submittingQuiz)return;
    setSubmittingQuiz(true);
    try {
      const res=await fetch("/api/quizzes/submit",{method:"POST",headers:{"Content-Type":"application/json",...authHeaders},body:JSON.stringify({quiz_id:activeQuiz.quiz_id,answers:quizAnswers})});
      if(!res.ok)throw new Error("Failed to submit quiz");
      const data=await res.json();
      setQuizResult(data);
      setToast({message:data.passed?`Quiz passed! ${data.percentage}%`:`Quiz completed: ${data.percentage}%`,type:data.passed?"success":"info"});
      fetch("/api/progress",{headers:authHeaders}).then(r=>r.ok?r.json():null).then(d=>{if(d)setTopics(d.topics);}).catch(()=>{});
    } catch(e){setToast({message:e.message||"Quiz submission failed",type:"error"});}
    setSubmittingQuiz(false);
  };

  const submitExercise=async()=>{
    if(!activeExercise||exSubmitting)return;
    setExSubmitting(true);
    try {
      const res=await fetch("/api/exercises/submit",{method:"POST",headers:{"Content-Type":"application/json",...authHeaders},body:JSON.stringify({exercise_id:activeExercise.id,code:exCode})});
      if(!res.ok)throw new Error("Failed to submit exercise");
      const data=await res.json();
      setExResult(data);
      setToast({message:data.passed?`Exercise passed! Grade: ${data.grade}/100`:`Graded: ${data.grade}/100 — Keep trying!`,type:data.passed?"success":"info"});
      fetch("/api/teacher/assign",{headers:authHeaders}).then(r=>r.ok?r.json():null).then(d=>{if(d&&d.exercises)setAssignments(d.exercises);}).catch(()=>{});
      fetch("/api/progress",{headers:authHeaders}).then(r=>r.ok?r.json():null).then(d=>{if(d)setTopics(d.topics);}).catch(()=>{});
    } catch(e){setToast({message:e.message||"Exercise submission failed",type:"error"});}
    setExSubmitting(false);
  };

  const generateQuiz=async()=>{
    if(!genQuizTopic||genQuizLoading)return;
    setGenQuizLoading(true);
    try {
      const res=await fetch("/api/quizzes/generate",{method:"POST",headers:{"Content-Type":"application/json",...authHeaders},body:JSON.stringify({topic:genQuizTopic,difficulty:"beginner",num_questions:5})});
      if(!res.ok)throw new Error("Failed to generate quiz");
      const data=await res.json();
      if(data.quiz_id&&data.questions){
        setActiveQuiz(data);
        setQuizAnswers(new Array(data.questions.length).fill(-1));
        setQuizResult(null);
        setTab("exercises");
        setToast({message:"Quiz ready! Answer all questions to submit.",type:"success"});
      }
      fetch("/api/quizzes",{headers:authHeaders}).then(r=>r.ok?r.json():null).then(d=>{if(d&&d.quizzes)setQuizzes(d.quizzes);}).catch(()=>{});
    } catch(e){setToast({message:e.message||"Quiz generation failed",type:"error"});}
    setGenQuizLoading(false);
  };

  const TABS=[{id:"chat",label:"AI Chat",icon:"💬"},{id:"code",label:"Code",icon:"💻"},{id:"exercises",label:"Exercises",icon:"📝"},{id:"progress",label:"Progress",icon:"📊"}];
  const renderMsg=(msg)=>{
    const isUser=msg.role==="user";
    const ag=msg.agent?AGENTS[msg.agent]:null;
    const body=msg.text.split(/(```[\s\S]*?```)/g).map((p,i)=>{
      if(p.startsWith("```")){const code=p.replace(/^```\w*\n?/,"").replace(/```$/,"");return <pre key={i} style={{marginTop:7,padding:"9px 12px",borderRadius:8,fontSize:12,fontFamily:"monospace",background:"rgba(0,0,0,0.45)",color:"#98C379",border:"1px solid rgba(255,255,255,0.06)",overflowX:"auto",lineHeight:1.6}}>{code}</pre>;}
      return <span key={i} style={{whiteSpace:"pre-wrap"}}>{p.replace(/\*\*(.*?)\*\*/g,(_,m)=>m)}</span>;
    });
    if(isUser) return <div key={msg.id} style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><div style={{maxWidth:"75%",padding:"9px 13px",borderRadius:"18px 18px 4px 18px",fontSize:14,lineHeight:1.6,background:"linear-gradient(135deg,#1D4ED8,#3B82F6)",color:"#EFF6FF"}}>{body}</div></div>;
    return <div key={msg.id} style={{display:"flex",gap:9,marginBottom:14,alignItems:"flex-start"}}>
      <div style={{width:30,height:30,borderRadius:9,flexShrink:0,background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🤖</div>
      <div style={{flex:1,minWidth:0}}>
        {ag&&<span style={{display:"inline-flex",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99,marginBottom:5,color:ag.color,background:ag.bg,border:`1px solid ${ag.border}`}}>{msg.agent}</span>}
        <div style={{padding:"9px 13px",borderRadius:"4px 18px 18px 18px",fontSize:14,lineHeight:1.6,background:"rgba(30,41,59,0.9)",color:"#CBD5E1",border:"1px solid rgba(148,163,184,0.07)"}}>{body}</div>
      </div>
    </div>;
  };
  const avgMastery = topics.length ? Math.round(topics.reduce((a,t)=>a+t.pct,0)/topics.length) : 0;

  if(dataLoading) return <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}><LoadingSpinner size={32}/><span style={{fontSize:13,color:"#64748B"}}>Loading your dashboard...</span></div>;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
      <div style={{display:"flex",alignItems:"center",background:"rgba(15,23,42,0.7)",borderBottom:"1px solid rgba(148,163,184,0.07)",flexShrink:0,padding:"0 4px",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        {TABS.map(t=>{const active=tab===t.id;return <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px",height:42,border:"none",borderBottom:active?"2px solid #3B82F6":"2px solid transparent",cursor:"pointer",fontSize:13,fontWeight:active?600:400,color:active?"#93C5FD":"#64748B",background:"transparent",transition:"all 0.15s",whiteSpace:"nowrap",flexShrink:0}}><span>{t.icon}</span>{t.label}</button>;})}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"0 12px",flexShrink:0}}>
          <div style={{width:48,height:3,borderRadius:99,background:"rgba(148,163,184,0.1)",overflow:"hidden"}}><div style={{height:"100%",width:`${avgMastery}%`,borderRadius:99,background:"linear-gradient(90deg,#3B82F6,#818CF8)"}}/></div>
          <span style={{fontSize:11,fontWeight:700,color:"#60A5FA"}}>{avgMastery}%</span>
        </div>
      </div>
      {tab==="chat"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",padding:"18px 0"}}>
            <div style={{maxWidth:620,margin:"0 auto",padding:"0 14px"}}>
              {msgs.map(renderMsg)}
              {typing&&<div style={{display:"flex",gap:9,marginBottom:12}}><div style={{width:30,height:30,borderRadius:9,background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>🤖</div><div style={{display:"flex",alignItems:"center",gap:5,padding:"11px 14px",borderRadius:"4px 18px 18px 18px",background:"rgba(30,41,59,0.9)",border:"1px solid rgba(148,163,184,0.07)"}}>{[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:"#475569",display:"block",animation:`tdot 1.3s ease-in-out ${i*0.18}s infinite`}}/>)}</div></div>}
              <div ref={chatEnd}/>
            </div>
          </div>
          <div style={{flexShrink:0,borderTop:"1px solid rgba(148,163,184,0.07)",background:"rgba(15,23,42,0.85)",padding:"12px 14px"}}>
            <div style={{maxWidth:620,margin:"0 auto",display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{flex:1,background:"rgba(30,41,59,0.9)",border:"1px solid rgba(148,163,184,0.1)",borderRadius:12,padding:"9px 12px"}}>
                <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Ask anything about Python…" rows={1} style={{width:"100%",resize:"none",fontSize:14,background:"transparent",border:"none",color:"#E2E8F0",lineHeight:1.55,maxHeight:80,fontFamily:"inherit"}}/>
              </div>
              <button onClick={send} style={{width:38,height:38,borderRadius:10,flexShrink:0,background:input.trim()?"linear-gradient(135deg,#2563EB,#3B82F6)":"rgba(30,41,59,0.8)",border:input.trim()?"none":"1px solid rgba(148,163,184,0.1)",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",color:input.trim()?"white":"#334155",transition:"all 0.18s"}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{width:14,height:14}}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {tab==="code"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",background:"rgba(15,23,42,0.9)",borderBottom:"1px solid rgba(148,163,184,0.07)",flexShrink:0,paddingLeft:6}}>
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",background:"#181E2D",borderRight:"1px solid rgba(148,163,184,0.07)",borderBottom:"2px solid #3B82F6",fontSize:12,fontWeight:500,color:"#CBD5E1"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" style={{width:11,height:11}}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>main.py
            </div>
          </div>
          <div style={{flex:1,display:"flex",overflow:"hidden",background:"#181E2D"}}>
            <div style={{width:36,flexShrink:0,paddingTop:10,textAlign:"right",userSelect:"none",fontFamily:"monospace"}}>
              {code.split("\n").map((_,i)=><div key={i} style={{lineHeight:"22px",paddingRight:12,fontSize:12,color:"#3E4451"}}>{i+1}</div>)}
            </div>
            <textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} style={{flex:1,background:"transparent",border:"none",color:"#ABB2BF",fontFamily:"'Fira Code',monospace",fontSize:12,lineHeight:"22px",padding:"10px 12px 10px 0",resize:"none",outline:"none",tabSize:4,whiteSpace:"pre",overflowX:"auto"}} onKeyDown={e=>{if(e.key==="Tab"){e.preventDefault();const s=e.target.selectionStart;const end=e.target.selectionEnd;setCode(code.substring(0,s)+"    "+code.substring(end));setTimeout(()=>{e.target.selectionStart=e.target.selectionEnd=s+4;},0);}}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 13px",borderTop:"1px solid rgba(148,163,184,0.07)",background:"rgba(15,23,42,0.7)",flexShrink:0}}>
            <button onClick={()=>{setRunState("running");setOutput("");fetch("/api/execute",{method:"POST",headers:{"Content-Type":"application/json",...authHeaders},body:JSON.stringify({code})}).then(r=>{if(!r.ok)throw new Error("Execution service unavailable");return r.json();}).then(d=>{setRunState("done");setOutput(d.output||d.error||"(no output)");if(!isDemo)fetch("/api/submissions",{headers:authHeaders}).then(r=>r.ok?r.json():null).then(s=>{if(s&&s.stats)setExecStats(s.stats);}).catch(()=>{});if(!isDemo)fetch("/api/progress",{headers:authHeaders}).then(r=>r.ok?r.json():null).then(s=>{if(s)setTopics(s.topics);}).catch(()=>{});}).catch(e=>{setRunState("done");setOutput("Error: "+(e.message||"could not execute code"));setToast({message:"Code execution failed: "+(e.message||"unknown error"),type:"error"});});}} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:8,border:"none",background:runState==="running"?"rgba(16,185,129,0.12)":"linear-gradient(135deg,#059669,#10B981)",color:runState==="running"?"#34D399":"white",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.18s"}}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{width:11,height:11}}><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd"/></svg>
              {runState==="running"?"Running…":"▶ Run"}
            </button>
            <button onClick={()=>{setOutput("");setRunState("ready");}} style={{padding:"7px 11px",borderRadius:8,background:"rgba(30,41,59,0.8)",border:"1px solid rgba(148,163,184,0.1)",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>Clear</button>
            <span style={{marginLeft:"auto",fontSize:11,color:runState==="ready"?"#334155":runState==="running"?"#F59E0B":"#34D399"}}>{runState==="ready"?"● Ready":runState==="running"?"● Running...":"● Done"}</span>
          </div>
          <div style={{height:120,background:"#0D1117",borderTop:"1px solid rgba(148,163,184,0.07)",flexShrink:0,padding:"10px 13px",overflowY:"auto"}}>
            {!output&&runState==="ready"&&<span style={{fontFamily:"monospace",fontSize:12,color:"#3E4451"}}>$ _</span>}
            {runState==="running"&&<span style={{fontFamily:"monospace",fontSize:12,color:"#F59E0B"}}>Running…</span>}
            {output&&<pre style={{fontFamily:"monospace",fontSize:13,lineHeight:1.7,color:"#E2E8F0",whiteSpace:"pre-wrap"}}><span style={{color:"#475569"}}>{"$ python main.py\n"}</span>{output}{"\n"}{output.startsWith("Error")||output.includes("Traceback")?<span style={{color:"#FB7185"}}>✗ Error</span>:<span style={{color:"#34D399"}}>✓ Success</span>}</pre>}
          </div>
        </div>
      )}
      {tab==="exercises"&&(
        <div style={{flex:1,overflowY:"auto",padding:"18px 14px"}}>
          <div style={{maxWidth:680,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>

            {/* Active Quiz */}
            {activeQuiz&&!quizResult&&(
              <div style={{background:"rgba(30,41,59,0.4)",border:"1px solid rgba(139,92,246,0.15)",borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"13px 15px",borderBottom:"1px solid rgba(148,163,184,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:14,fontWeight:700,color:"#F1F5F9"}}>{activeQuiz.title}</span>
                  <button onClick={()=>{setActiveQuiz(null);setQuizAnswers([]);}} style={{fontSize:11,color:"#64748B",background:"transparent",border:"none",cursor:"pointer"}}>Close</button>
                </div>
                <div style={{padding:"15px"}}>
                  {activeQuiz.questions.map((q,qi)=>(
                    <div key={qi} style={{marginBottom:18}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#E2E8F0",marginBottom:8}}>{qi+1}. {q.question}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {q.options.map((opt,oi)=>(
                          <button key={oi} onClick={()=>{const a=[...quizAnswers];a[qi]=oi;setQuizAnswers(a);}} style={{textAlign:"left",padding:"9px 12px",borderRadius:8,border:quizAnswers[qi]===oi?"2px solid #8B5CF6":"1px solid rgba(148,163,184,0.1)",background:quizAnswers[qi]===oi?"rgba(139,92,246,0.1)":"rgba(15,23,42,0.4)",color:quizAnswers[qi]===oi?"#C4B5FD":"#94A3B8",fontSize:13,cursor:"pointer",transition:"all 0.15s"}}>
                            <span style={{fontWeight:700,marginRight:8}}>{String.fromCharCode(65+oi)}.</span>{opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={submitQuiz} disabled={submittingQuiz||quizAnswers.includes(-1)} style={{width:"100%",padding:"11px",borderRadius:9,border:"none",background:quizAnswers.includes(-1)?"rgba(148,163,184,0.1)":"linear-gradient(135deg,#7C3AED,#8B5CF6)",color:quizAnswers.includes(-1)?"#475569":"white",fontSize:14,fontWeight:600,cursor:quizAnswers.includes(-1)?"default":"pointer"}}>
                    {submittingQuiz?"Grading...":"Submit Quiz"}
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Result */}
            {quizResult&&(
              <div style={{background:"rgba(30,41,59,0.4)",border:`1px solid ${quizResult.passed?"rgba(16,185,129,0.2)":"rgba(244,63,94,0.2)"}`,borderRadius:14,padding:"20px",textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:8}}>{quizResult.passed?"🎉":"💪"}</div>
                <div style={{fontSize:20,fontWeight:800,color:quizResult.passed?"#34D399":"#FB7185"}}>{quizResult.percentage}%</div>
                <div style={{fontSize:13,color:"#94A3B8",marginBottom:12}}>{quizResult.score}/{quizResult.total} correct — {quizResult.passed?"Passed!":"Keep practicing!"}</div>
                {quizResult.results&&<div style={{textAlign:"left",marginTop:12}}>
                  {quizResult.results.map((r,i)=>(
                    <div key={i} style={{padding:"8px 12px",marginBottom:4,borderRadius:8,background:r.is_correct?"rgba(16,185,129,0.08)":"rgba(244,63,94,0.08)",border:`1px solid ${r.is_correct?"rgba(16,185,129,0.15)":"rgba(244,63,94,0.15)"}`}}>
                      <div style={{fontSize:12,fontWeight:600,color:r.is_correct?"#34D399":"#FB7185"}}>Q{i+1}: {r.is_correct?"Correct":"Incorrect"}</div>
                      <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{r.explanation}</div>
                    </div>
                  ))}
                </div>}
                <button onClick={()=>{setQuizResult(null);setActiveQuiz(null);setQuizAnswers([]);}} style={{marginTop:14,padding:"9px 20px",borderRadius:8,border:"none",background:"rgba(30,41,59,0.8)",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>Done</button>
              </div>
            )}

            {/* Active Exercise */}
            {activeExercise&&(
              <div style={{background:"rgba(30,41,59,0.4)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"13px 15px",borderBottom:"1px solid rgba(148,163,184,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div><div style={{fontSize:14,fontWeight:700,color:"#F1F5F9"}}>{activeExercise.title}</div><div style={{fontSize:11,color:"#64748B"}}>{activeExercise.topic} — {activeExercise.difficulty}</div></div>
                  <button onClick={()=>{setActiveExercise(null);setExCode("");setExResult(null);}} style={{fontSize:11,color:"#64748B",background:"transparent",border:"none",cursor:"pointer"}}>Close</button>
                </div>
                {activeExercise.description&&<div style={{padding:"10px 15px",fontSize:12,color:"#94A3B8",borderBottom:"1px solid rgba(148,163,184,0.04)"}}>{activeExercise.description}</div>}
                <div style={{background:"#181E2D",position:"relative"}}>
                  <textarea value={exCode} onChange={e=>setExCode(e.target.value)} spellCheck={false} style={{width:"100%",minHeight:160,background:"transparent",border:"none",color:"#ABB2BF",fontFamily:"'Fira Code',monospace",fontSize:12,lineHeight:"22px",padding:"12px 14px",resize:"vertical",outline:"none",tabSize:4}} onKeyDown={e=>{if(e.key==="Tab"){e.preventDefault();const s=e.target.selectionStart;const end=e.target.selectionEnd;setExCode(exCode.substring(0,s)+"    "+exCode.substring(end));setTimeout(()=>{e.target.selectionStart=e.target.selectionEnd=s+4;},0);}}} placeholder="Write your solution here..."/>
                </div>
                <div style={{padding:"12px 15px",borderTop:"1px solid rgba(148,163,184,0.06)",display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={submitExercise} disabled={exSubmitting||!exCode.trim()} style={{padding:"8px 16px",borderRadius:8,border:"none",background:exCode.trim()?"linear-gradient(135deg,#059669,#10B981)":"rgba(148,163,184,0.1)",color:exCode.trim()?"white":"#475569",fontSize:13,fontWeight:600,cursor:exCode.trim()?"pointer":"default"}}>{exSubmitting?"Grading...":"Submit & Grade"}</button>
                  {activeExercise.expected_output&&<span style={{fontSize:11,color:"#475569"}}>Expected: {activeExercise.expected_output.slice(0,60)}</span>}
                </div>
                {exResult&&(
                  <div style={{padding:"12px 15px",borderTop:"1px solid rgba(148,163,184,0.06)",background:exResult.passed?"rgba(16,185,129,0.05)":"rgba(244,63,94,0.05)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:18}}>{exResult.passed?"✅":"❌"}</span>
                      <span style={{fontSize:16,fontWeight:700,color:exResult.passed?"#34D399":"#FB7185"}}>Grade: {exResult.grade}/100</span>
                    </div>
                    <div style={{fontSize:12,color:"#94A3B8",whiteSpace:"pre-wrap"}}>{exResult.feedback}</div>
                    {exResult.output&&<pre style={{marginTop:6,padding:"8px 10px",borderRadius:6,background:"rgba(0,0,0,0.3)",fontSize:11,color:"#E2E8F0",fontFamily:"monospace"}}>{exResult.output.slice(0,500)}</pre>}
                  </div>
                )}
              </div>
            )}

            {/* Generate Quiz */}
            {!activeQuiz&&!quizResult&&(
              <div style={{background:"rgba(30,41,59,0.4)",border:"1px solid rgba(148,163,184,0.07)",borderRadius:14,padding:"15px"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#F1F5F9",marginBottom:8}}>Take a Quiz</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <select value={genQuizTopic} onChange={e=>setGenQuizTopic(e.target.value)} style={{flex:1,minWidth:140,padding:"9px 12px",background:"rgba(15,23,42,0.6)",border:"1px solid rgba(148,163,184,0.1)",borderRadius:9,color:"#E2E8F0",fontSize:13,fontFamily:"inherit"}}>
                    <option value="">Select topic…</option>
                    {topics.map(t=><option key={t.name} value={t.name}>{t.name} ({t.pct}%)</option>)}
                  </select>
                  <button onClick={generateQuiz} disabled={!genQuizTopic||genQuizLoading} style={{padding:"9px 16px",borderRadius:9,border:"none",background:genQuizTopic?"linear-gradient(135deg,#7C3AED,#8B5CF6)":"rgba(148,163,184,0.1)",color:genQuizTopic?"white":"#475569",fontSize:13,fontWeight:600,cursor:genQuizTopic?"pointer":"default"}}>
                    {genQuizLoading?"Generating...":"Generate Quiz"}
                  </button>
                </div>
                {quizzes.length>0&&<div style={{marginTop:12}}>
                  <div style={{fontSize:11,color:"#475569",marginBottom:6}}>Previous Quizzes:</div>
                  {quizzes.slice(0,5).map(q=>(
                    <div key={q.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(148,163,184,0.06)",marginBottom:4}}>
                      <div><span style={{fontSize:12,fontWeight:500,color:"#E2E8F0"}}>{q.title}</span><span style={{fontSize:10,color:"#475569",marginLeft:8}}>{q.attempts} attempt{q.attempts!==1?"s":""}</span></div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {q.best_score!==null&&<span style={{fontSize:11,fontWeight:700,color:q.best_score>=70?"#34D399":"#FB7185"}}>{q.best_score}%</span>}
                        <button onClick={async()=>{try{const r=await fetch(`/api/quizzes/load?id=${q.id}`,{headers:authHeaders});const d=await r.json();if(d.questions){setActiveQuiz(d);setQuizAnswers(new Array(d.questions.length).fill(-1));setQuizResult(null);}}catch{}}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(139,92,246,0.2)",background:"rgba(139,92,246,0.08)",color:"#C4B5FD",fontSize:10,fontWeight:600,cursor:"pointer"}}>{q.attempts>0?"Retake":"Start"}</button>
                      </div>
                    </div>
                  ))}
                </div>}
              </div>
            )}

            {/* Assigned Exercises */}
            {!activeExercise&&(
              <div style={{background:"rgba(30,41,59,0.4)",border:"1px solid rgba(148,163,184,0.07)",borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"13px 15px",borderBottom:"1px solid rgba(148,163,184,0.06)",display:"flex",alignItems:"center",gap:9}}>
                  <span style={{fontSize:13,fontWeight:600,color:"#F1F5F9"}}>Assigned Exercises</span>
                  <span style={{fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99,background:"rgba(59,130,246,0.15)",color:"#60A5FA",border:"1px solid rgba(59,130,246,0.25)"}}>{assignments.length}</span>
                </div>
                {assignments.length===0?<div style={{padding:"20px",textAlign:"center",fontSize:13,color:"#475569"}}>No exercises assigned yet. Your teacher can assign exercises to you.</div>
                :assignments.map(ex=>{
                  const done=ex.status==="completed";
                  return(
                    <div key={ex.id} style={{padding:"12px 15px",borderBottom:"1px solid rgba(148,163,184,0.04)",display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:28,height:28,borderRadius:8,background:done?"rgba(16,185,129,0.12)":"rgba(59,130,246,0.12)",border:`1px solid ${done?"rgba(16,185,129,0.25)":"rgba(59,130,246,0.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{done?"✓":"📝"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,color:"#E2E8F0"}}>{ex.title}</div>
                        <div style={{fontSize:10,color:"#475569"}}>{ex.topic} — {ex.difficulty}{ex.grade!=null?` — Grade: ${ex.grade}/100`:""}</div>
                      </div>
                      {done?<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"rgba(16,185,129,0.1)",color:"#34D399",border:"1px solid rgba(16,185,129,0.2)"}}>Done</span>
                      :<button onClick={()=>{setActiveExercise(ex);setExCode(ex.starter_code||"# Write your solution here\n");setExResult(null);}} style={{padding:"6px 12px",borderRadius:7,border:"1px solid rgba(59,130,246,0.25)",background:"rgba(59,130,246,0.1)",color:"#60A5FA",fontSize:11,fontWeight:600,cursor:"pointer"}}>Start</button>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {tab==="progress"&&(
        <div style={{flex:1,overflowY:"auto",padding:"20px 14px"}}>
          <div style={{maxWidth:680,margin:"0 auto"}}>
            <div style={{background:"rgba(30,41,59,0.4)",border:"1px solid rgba(148,163,184,0.07)",borderRadius:16,padding:"20px",marginBottom:14,display:"flex",flexWrap:"wrap",gap:18,alignItems:"center"}}>
              <div style={{position:"relative",width:96,height:96,flexShrink:0}}>
                <Ring pct={topics.length?Math.round(topics.reduce((a,t)=>a+t.pct,0)/topics.length):0} size={96} stroke={7}/>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>{topics.length?Math.round(topics.reduce((a,t)=>a+t.pct,0)/topics.length):0}%</span>
                  <span style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.08em"}}>Mastery</span>
                </div>
              </div>
              <div style={{flex:1,minWidth:160}}>
                <div style={{fontSize:15,fontWeight:700,color:"#F1F5F9",marginBottom:2}}>{user?.name||"Student"}</div>
                <div style={{fontSize:12,color:"#64748B",marginBottom:12}}>{topics.filter(t=>t.pct>0).length} of {topics.length} topics started</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {[{e:"🔥",v:execStats.streak+"d",l:"Streak"},{e:"📝",v:String(execStats.total),l:"Code Runs"},{e:"✅",v:execStats.total?Math.round(execStats.successes/execStats.total*100)+"%":"0%",l:"Success Rate"}].map(s=>(
                    <div key={s.l} style={{background:"rgba(15,23,42,0.6)",border:"1px solid rgba(148,163,184,0.07)",borderRadius:9,padding:"7px 10px",textAlign:"center"}}>
                      <div style={{fontSize:14}}>{s.e}</div>
                      <div style={{fontSize:14,fontWeight:700,color:"#E2E8F0"}}>{s.v}</div>
                      <div style={{fontSize:9,color:"#475569",textTransform:"uppercase"}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:9}}>
              {topics.map(t=>{const ls=LEVEL[t.level]||LEVEL.Beginner;return(
                <div key={t.name} style={{background:"rgba(30,41,59,0.4)",border:"1px solid rgba(148,163,184,0.07)",borderRadius:11,padding:"12px 13px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#E2E8F0"}}>{t.name}</span>
                    <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:99,color:ls.color,background:ls.bg,border:`1px solid ${ls.border}`}}>{ls.label}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{flex:1,height:3,borderRadius:99,background:"rgba(148,163,184,0.08)",overflow:"hidden"}}><div style={{height:"100%",width:`${t.pct}%`,borderRadius:99,background:ls.bar}}/></div>
                    <span style={{fontSize:12,fontWeight:700,color:ls.color,width:30,textAlign:"right"}}>{t.pct}%</span>
                  </div>
                </div>
              );})}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TEACHER DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function TeacherDashboard({ user }) {
  const isDemo = !user || user.id === 0;
  const token = typeof window !== "undefined" ? localStorage.getItem("lf_token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};
  const [search,setSearch]=useState("");
  const [prompt,setPrompt]=useState("");
  const [generating,setGenerating]=useState(false);
  const [generatedEx,setGeneratedEx]=useState(null);
  const [students,setStudents]=useState(isDemo?STUDENTS:[]);
  const [alerts,setAlerts]=useState(isDemo?ALERTS:[]);
  const [assignModal,setAssignModal]=useState(null);
  const [assignStudent,setAssignStudent]=useState("");
  const [assigning,setAssigning]=useState(false);
  const [lastRefresh,setLastRefresh]=useState(Date.now());
  const [teacherLoading,setTeacherLoading]=useState(!isDemo);
  const [toast,setToast]=useState(null);
  const [quizTopic,setQuizTopic]=useState("");
  const [quizDiff,setQuizDiff]=useState("beginner");
  const [genQuiz,setGenQuiz]=useState(false);
  const [genQuizResult,setGenQuizResult]=useState(null);

  const ALERT_TYPE_LABELS = {
    repeated_error: { label: "Repeated Errors", color: "#F43F5E", bg: "rgba(244,63,94,0.1)" },
    frustrated_message: { label: "Frustrated", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    low_quiz_score: { label: "Low Quiz", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
    stuck_time: { label: "Stuck 10min+", color: "#FB923C", bg: "rgba(251,146,60,0.1)" },
  };

  const fetchData = (showLoading=false) => {
    if(isDemo) return;
    const p1=fetch("/api/teacher/students",{headers:authHeaders}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(d=>{if(d&&d.students)setStudents(d.students);}).catch(()=>{});
    const p2=fetch("/api/teacher/alerts",{headers:authHeaders}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(d=>{if(d&&d.alerts)setAlerts(d.alerts);}).catch(()=>{});
    if(showLoading) Promise.all([p1,p2]).finally(()=>setTeacherLoading(false));
  };

  useEffect(()=>{
    fetchData(true);
    if(isDemo) return;
    const interval = setInterval(()=>{fetchData();setLastRefresh(Date.now());}, 10000);
    return ()=>clearInterval(interval);
  },[]);

  const resolveAlert = async (alertId) => {
    if(isDemo){setAlerts(p=>p.filter(a=>a.id!==alertId));return;}
    try {
      const res=await fetch("/api/teacher/alerts/resolve",{method:"POST",headers:authHeaders,body:JSON.stringify({alert_id:alertId})});
      if(!res.ok)throw new Error("Failed to resolve alert");
      setAlerts(p=>p.filter(a=>a.id!==alertId));
      setToast({message:"Alert resolved",type:"success"});
    } catch(e) {setToast({message:e.message||"Failed to resolve",type:"error"});}
  };

  const generateExercise = async () => {
    if(!prompt.trim()||generating)return;
    setGenerating(true);
    if(isDemo){setTimeout(()=>{setGenerating(false);setGeneratedEx(GENERATED_EX);},1500);return;}
    try {
      const res = await fetch("/api/teacher/exercises/generate",{method:"POST",headers:authHeaders,body:JSON.stringify({prompt:prompt.trim(),difficulty:"intermediate",topic:prompt.trim().split(" ")[0]})});
      const data = await res.json();
      if(data.title){setGeneratedEx(data);}else{setGeneratedEx(GENERATED_EX);}
    } catch {setGeneratedEx(GENERATED_EX);}
    setGenerating(false);
  };

  const assignExercise = async () => {
    if(!assignStudent||!assignModal||assigning)return;
    setAssigning(true);
    try {
      const res=await fetch("/api/teacher/assign",{method:"POST",headers:authHeaders,body:JSON.stringify({
        student_id:Number(assignStudent),
        title:assignModal.title,
        description:assignModal.description||"",
        starter_code:assignModal.starter_code||assignModal.starter||"",
        difficulty:assignModal.difficulty||"beginner",
        topic:assignModal.topic||"General",
      })});
      if(!res.ok)throw new Error("Failed to assign exercise");
      setAssignModal(null);setAssignStudent("");
      setToast({message:"Exercise assigned successfully!",type:"success"});
    } catch(e) {setToast({message:e.message||"Assignment failed",type:"error"});}
    setAssigning(false);
  };

  const visible=alerts;
  const filtered=students.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.module.toLowerCase().includes(search.toLowerCase()));

  if(teacherLoading) return <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}><LoadingSpinner size={32} color="#10B981"/><span style={{fontSize:13,color:"#64748B"}}>Loading class data...</span></div>;

  return(
    <div style={{flex:1,overflowY:"auto",padding:"18px 14px"}}>
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
      {assignModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setAssignModal(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#1E293B",border:"1px solid rgba(148,163,184,0.15)",borderRadius:16,padding:24,maxWidth:420,width:"100%"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#F1F5F9",marginBottom:4}}>Assign Exercise</div>
          <div style={{fontSize:12,color:"#94A3B8",marginBottom:16}}>{assignModal.title}</div>
          <div style={{fontSize:12,color:"#94A3B8",marginBottom:6}}>Select Student:</div>
          <select value={assignStudent} onChange={e=>setAssignStudent(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"rgba(15,23,42,0.6)",border:"1px solid rgba(148,163,184,0.15)",borderRadius:9,color:"#E2E8F0",fontSize:13,marginBottom:16,fontFamily:"inherit"}}>
            <option value="">Choose a student…</option>
            {students.map(s=><option key={s.id} value={s.id}>{s.name} — {s.module} ({s.mastery}%)</option>)}
          </select>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>setAssignModal(null)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid rgba(148,163,184,0.15)",background:"transparent",color:"#94A3B8",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={assignExercise} disabled={!assignStudent||assigning} style={{padding:"8px 16px",borderRadius:8,border:"none",background:assignStudent?"linear-gradient(135deg,#8B5CF6,#6366F1)":"rgba(148,163,184,0.1)",color:assignStudent?"white":"#475569",fontSize:12,fontWeight:600,cursor:assignStudent?"pointer":"default"}}>{assigning?"Assigning…":"Assign"}</button>
          </div>
        </div>
      </div>}
      <div style={{maxWidth:940,margin:"0 auto",display:"flex",flexDirection:"column",gap:18}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
          {[{label:"Total Students",value:String(students.length||0),accent:"#3B82F6",e:"👥"},{label:"Avg Mastery",value:students.length?Math.round(students.reduce((a,s)=>a+s.mastery,0)/students.length)+"%":"0%",accent:"#10B981",e:"📊"},{label:"Active Now",value:String(students.filter(s=>s.active).length),accent:"#10B981",e:"⚡",pulse:true},{label:"Struggling",value:String(students.filter(s=>s.status==="Struggling").length+visible.length),accent:"#F43F5E",e:"⚠️"}].map(c=>(
            <div key={c.label} style={{background:"rgba(30,41,59,0.5)",border:`1px solid ${c.accent}20`,borderRadius:13,padding:"15px 14px",display:"flex",flexDirection:"column",gap:7}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:17}}>{c.e}</span>{c.pulse&&<span style={{width:7,height:7,borderRadius:"50%",background:"#10B981",animation:"pulse2 2s ease-in-out infinite",display:"inline-block"}}/>}</div>
              <div style={{fontSize:22,fontWeight:800,color:"#F1F5F9",letterSpacing:"-0.02em",lineHeight:1}}>{c.value}</div>
              <div style={{fontSize:11,color:"#64748B"}}>{c.label}</div>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(30,41,59,0.4)",border:"1px solid rgba(148,163,184,0.07)",borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:9,padding:"13px 15px",borderBottom:"1px solid rgba(148,163,184,0.06)"}}>
            <span style={{fontSize:15}}>⚠️</span><span style={{fontSize:13,fontWeight:600,color:"#F1F5F9"}}>Struggle Alerts</span>
            <span style={{fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99,background:"rgba(244,63,94,0.15)",color:"#FB7185",border:"1px solid rgba(244,63,94,0.25)"}}>{visible.length}</span>
            {!isDemo&&<span style={{fontSize:10,color:"#475569",marginLeft:"auto"}}>Auto-refresh 10s</span>}
          </div>
          {visible.length===0?<div style={{padding:"24px",textAlign:"center"}}><div style={{fontSize:22,marginBottom:5}}>🎉</div><div style={{fontSize:13,color:"#64748B"}}>No struggling students right now!</div></div>
          :visible.map((a,i)=>{
            const atype = ALERT_TYPE_LABELS[a.alert_type] || ALERT_TYPE_LABELS.repeated_error;
            return(
            <div key={a.id} style={{borderBottom:i<visible.length-1?"1px solid rgba(148,163,184,0.05)":"none",borderLeft:`3px solid ${atype.color}`,padding:"13px 15px",display:"flex",flexDirection:"column",gap:9}}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <Avatar initials={a.initials} color={a.color} size={32}/>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#E2E8F0"}}>{a.name}</div><div style={{fontSize:11,color:"#64748B"}}>{a.time}</div></div>
                <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:atype.bg,color:atype.color,border:`1px solid ${atype.color}30`}}>{atype.label}</span>
                <button onClick={()=>resolveAlert(a.id)} title="Resolve" style={{padding:"4px 7px",borderRadius:6,border:"1px solid rgba(148,163,184,0.1)",background:"transparent",color:"#475569",fontSize:11,cursor:"pointer",flexShrink:0}}>✓</button>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"#94A3B8"}}>Stuck on</span>
                <span style={{fontSize:12,fontWeight:600,color:"#E2E8F0"}}>{a.topic}</span>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(244,63,94,0.1)",color:"#FB7185",border:"1px solid rgba(244,63,94,0.2)",marginLeft:"auto"}}>{a.attempts} attempts</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                <button style={{padding:"7px 4px",borderRadius:7,border:"1px solid #3B82F630",background:"#3B82F612",color:"#3B82F6",fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"center"}}>View Code</button>
                <button onClick={()=>resolveAlert(a.id)} style={{padding:"7px 4px",borderRadius:7,border:"1px solid #10B98130",background:"#10B98112",color:"#10B981",fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"center"}}>Resolve</button>
                <button onClick={()=>setAssignModal({title:`Help: ${a.topic}`,description:`Practice exercise for ${a.topic} — assigned because you need extra practice.`,starter_code:`# Practice: ${a.topic}\n# Write your solution here\n`,difficulty:"beginner",topic:a.topic})} style={{padding:"7px 4px",borderRadius:7,border:"1px solid #8B5CF630",background:"#8B5CF612",color:"#8B5CF6",fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"center"}}>Assign</button>
              </div>
            </div>
          );})}
        </div>
        <div style={{background:"rgba(30,41,59,0.4)",border:"1px solid rgba(148,163,184,0.07)",borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 15px",borderBottom:"1px solid rgba(148,163,184,0.06)",flexWrap:"wrap",gap:8}}>
            <span style={{fontSize:13,fontWeight:600,color:"#F1F5F9"}}>Class Progress</span>
            <div style={{display:"flex",alignItems:"center",gap:7,background:"rgba(15,23,42,0.6)",border:"1px solid rgba(148,163,184,0.1)",borderRadius:8,padding:"6px 10px"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" style={{width:13,height:13}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{background:"transparent",border:"none",color:"#E2E8F0",fontSize:13,width:90,fontFamily:"inherit"}}/>
            </div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:"1px solid rgba(148,163,184,0.06)"}}>
                {["Student","Mastery","Status"].map(h=><th key={h} style={{padding:"9px 15px",textAlign:"left",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#475569"}}>{h}</th>)}
              </tr></thead>
              <tbody>{filtered.map((s,i)=>(
                <tr key={s.id} style={{borderBottom:i<filtered.length-1?"1px solid rgba(148,163,184,0.04)":"none"}}>
                  <td style={{padding:"10px 15px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><Avatar initials={s.initials} color={s.color} size={26}/><div><div style={{fontSize:13,fontWeight:500,color:"#E2E8F0"}}>{s.name}</div><div style={{fontSize:10,color:"#475569"}}>{s.module}</div></div></div></td>
                  <td style={{padding:"10px 15px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:64,height:3,borderRadius:99,background:"rgba(148,163,184,0.08)",overflow:"hidden"}}><div style={{height:"100%",width:`${s.mastery}%`,borderRadius:99,background:s.mastery>=71?"#10B981":s.mastery>=41?"#F59E0B":"#F43F5E"}}/></div><span style={{fontSize:12,fontWeight:600,color:s.mastery>=71?"#34D399":s.mastery>=41?"#FBBF24":"#FB7185"}}>{s.mastery}%</span></div></td>
                  <td style={{padding:"10px 15px"}}><Badge label={s.status} style={STATUS_STYLE[s.status]}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={{background:"rgba(30,41,59,0.4)",border:"1px solid rgba(148,163,184,0.07)",borderRadius:14,overflow:"hidden",marginBottom:4}}>
          <div style={{padding:"13px 15px",borderBottom:"1px solid rgba(148,163,184,0.06)"}}><div style={{fontSize:13,fontWeight:600,color:"#F1F5F9"}}>✦ Generate Exercises with AI</div><div style={{fontSize:11,color:"#475569",marginTop:1}}>Describe what you need — AI generates it, then assign to students</div></div>
          <div style={{padding:"15px"}}>
            <div style={{display:"flex",gap:8,marginBottom:generatedEx?14:0,flexWrap:"wrap"}}>
              <input value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generateExercise()} placeholder="e.g. list comprehensions for beginners…" style={{flex:1,minWidth:140,background:"rgba(15,23,42,0.6)",border:"1px solid rgba(148,163,184,0.1)",borderRadius:9,padding:"9px 12px",color:"#E2E8F0",fontSize:13,fontFamily:"inherit"}}/>
              <button onClick={generateExercise} style={{padding:"9px 16px",borderRadius:9,border:"none",background:generating?"rgba(16,185,129,0.15)":"linear-gradient(135deg,#059669,#10B981)",color:generating?"#34D399":"white",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
                {generating?<><span style={{width:12,height:12,border:"2px solid #34D399",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Generating…</>:"✦ Generate"}
              </button>
            </div>
            {generatedEx&&<div style={{background:"rgba(15,23,42,0.6)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:11,overflow:"hidden",animation:"fadein 0.25s ease"}}>
              <div style={{padding:"11px 14px",borderBottom:"1px solid rgba(148,163,184,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:7}}>
                <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{generatedEx.title}</div>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"rgba(251,191,36,0.12)",color:"#FBBF24",border:"1px solid rgba(251,191,36,0.25)"}}>⚡ {generatedEx.difficulty}</span>
              </div>
              {generatedEx.description&&<div style={{padding:"10px 14px",fontSize:12,color:"#94A3B8",borderBottom:"1px solid rgba(148,163,184,0.04)"}}>{generatedEx.description}</div>}
              <div style={{background:"#0D1117",padding:"10px 0",fontFamily:"monospace",overflowX:"auto"}}>
                {(generatedEx.starter_code||generatedEx.starter||"").split("\n").map((line,i)=><div key={i} style={{display:"flex",lineHeight:"20px"}}><span style={{userSelect:"none",width:34,textAlign:"right",paddingRight:10,fontSize:11,color:"#3E4451",flexShrink:0}}>{i+1}</span><span style={{fontSize:11,color:"#ABB2BF"}} dangerouslySetInnerHTML={{__html:hl(line)||"&nbsp;"}}/></div>)}
              </div>
              <div style={{padding:"11px 14px",borderTop:"1px solid rgba(148,163,184,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:9}}>
                <pre style={{fontFamily:"monospace",fontSize:12,color:"#34D399",lineHeight:1.6,margin:0}}>{generatedEx.expected_output||generatedEx.expected||""}</pre>
                <button onClick={()=>setAssignModal(generatedEx)} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#2563EB,#3B82F6)",color:"white",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>Assign to Student →</button>
              </div>
            </div>}
          </div>
        </div>
        <div style={{background:"rgba(30,41,59,0.4)",border:"1px solid rgba(148,163,184,0.07)",borderRadius:14,overflow:"hidden",marginBottom:4}}>
          <div style={{padding:"13px 15px",borderBottom:"1px solid rgba(148,163,184,0.06)"}}><div style={{fontSize:13,fontWeight:600,color:"#F1F5F9"}}>✦ Generate Quiz for Students</div><div style={{fontSize:11,color:"#475569",marginTop:1}}>AI-generated MCQ quizzes — auto-graded when students complete them</div></div>
          <div style={{padding:"15px"}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:genQuizResult?12:0}}>
              <select value={quizTopic} onChange={e=>setQuizTopic(e.target.value)} style={{flex:1,minWidth:120,padding:"9px 12px",background:"rgba(15,23,42,0.6)",border:"1px solid rgba(148,163,184,0.1)",borderRadius:9,color:"#E2E8F0",fontSize:13,fontFamily:"inherit"}}>
                <option value="">Topic…</option>
                {["Variables","Data Types","Loops","Lists","Functions","OOP","Error Handling","Libraries"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <select value={quizDiff} onChange={e=>setQuizDiff(e.target.value)} style={{padding:"9px 12px",background:"rgba(15,23,42,0.6)",border:"1px solid rgba(148,163,184,0.1)",borderRadius:9,color:"#E2E8F0",fontSize:13,fontFamily:"inherit"}}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button onClick={async()=>{if(!quizTopic||genQuiz)return;setGenQuiz(true);try{const r=await fetch("/api/quizzes/generate",{method:"POST",headers:authHeaders,body:JSON.stringify({topic:quizTopic,difficulty:quizDiff,num_questions:5})});const d=await r.json();if(d.quiz_id)setGenQuizResult(d);}catch{}setGenQuiz(false);}} style={{padding:"9px 16px",borderRadius:9,border:"none",background:quizTopic&&!genQuiz?"linear-gradient(135deg,#7C3AED,#8B5CF6)":"rgba(148,163,184,0.1)",color:quizTopic&&!genQuiz?"white":"#475569",fontSize:13,fontWeight:600,cursor:quizTopic?"pointer":"default",display:"flex",alignItems:"center",gap:7}}>
                {genQuiz?<><span style={{width:12,height:12,border:"2px solid #C4B5FD",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Creating…</>:"✦ Generate Quiz"}
              </button>
            </div>
            {genQuizResult&&<div style={{background:"rgba(15,23,42,0.6)",border:"1px solid rgba(139,92,246,0.15)",borderRadius:11,padding:"12px 14px"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:4}}>{genQuizResult.title}</div>
              <div style={{fontSize:12,color:"#94A3B8",marginBottom:8}}>{genQuizResult.questions?.length||0} questions — Students can access it from their Exercises tab</div>
              <div style={{fontSize:11,color:"#34D399"}}>Quiz created and available for all students!</div>
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP SHELL
// ══════════════════════════════════════════════════════════════════════════════
function AppShell({ role, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activePage, setActivePage]         = useState("dashboard");
  const [isMobile, setIsMobile]             = useState(typeof window!=="undefined"?window.innerWidth<768:false);
  const accent = role==="teacher"?"#10B981":"#3B82F6";
  const grad   = role==="teacher"?"linear-gradient(135deg,#10B981,#059669)":"linear-gradient(135deg,#3B82F6,#6366F1)";

  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",h);
    return ()=>window.removeEventListener("resize",h);
  },[]);

  return (
    <div style={{display:"flex",height:"100vh",background:"#0F172A",overflow:"hidden"}}>
      {!isMobile&&<Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} activePage={activePage} setActivePage={setActivePage} role={role} onLogout={onLogout} isMobile={false} onClose={()=>{}}/>}
      {isMobile&&<Sidebar expanded={sidebarOpen} setExpanded={setSidebarOpen} activePage={activePage} setActivePage={setActivePage} role={role} onLogout={onLogout} isMobile={true} onClose={()=>setSidebarOpen(false)}/>}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <div style={{height:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",background:"rgba(15,23,42,0.97)",borderBottom:"1px solid rgba(148,163,184,0.08)",flexShrink:0,gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            {isMobile&&<button onClick={()=>setSidebarOpen(v=>!v)} style={{background:"rgba(30,41,59,0.7)",border:"1px solid rgba(148,163,184,0.1)",borderRadius:7,padding:"5px 7px",color:"#94A3B8",cursor:"pointer",display:"flex",alignItems:"center",flexShrink:0}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
            </button>}
            <span style={{fontSize:13,fontWeight:500,color:"#94A3B8",textTransform:"capitalize"}}>{activePage}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"3px 8px 3px 3px",background:"rgba(30,41,59,0.7)",border:"1px solid rgba(148,163,184,0.08)",borderRadius:99}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white"}}>{user?.name?user.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():role==="teacher"?"R":"M"}</div>
              <span style={{fontSize:12,fontWeight:500,color:"#CBD5E1",maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name||"User"}</span>
            </div>
            <button onClick={onLogout} style={{background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.15)",borderRadius:8,padding:"6px 10px",color:"#FB7185",cursor:"pointer",fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:5}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:13,height:13}}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
              <span style={{display:isMobile?"none":"inline"}}>Sign Out</span>
            </button>
          </div>
        </div>
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {activePage==="dashboard"&&role==="student"&&<StudentDashboard user={user}/>}
          {activePage==="dashboard"&&role==="teacher"&&<TeacherDashboard user={user}/>}
          {activePage!=="dashboard"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,color:"#334155"}}>
              <div style={{fontSize:32}}>{activePage==="progress"?"📈":"⚙️"}</div>
              <div style={{fontSize:15,fontWeight:600,color:"#64748B",textTransform:"capitalize"}}>{activePage}</div>
              <div style={{fontSize:12,color:"#334155"}}>Connect your {activePage} component here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — Landing → Login → App
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | login | app
  const [role, setRole]     = useState(null);
  const [user, setUser]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("lf_token") : null;
    if (token) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          setUser(data.user);
          setRole(data.user.role);
          setScreen("app");
        })
        .catch(() => {
          localStorage.removeItem("lf_token");
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem("lf_token", token);
    setUser(userData);
    setRole(userData.role);
    setScreen("app");
  };

  const handleDemoLogin = (demoRole) => {
    setUser({ id: 0, name: demoRole === "teacher" ? "Dr. Rodriguez" : "Maya Chen", email: "demo@learnflow.ai", role: demoRole });
    setRole(demoRole);
    setScreen("app");
  };

  const handleLogout = () => {
    localStorage.removeItem("lf_token");
    setUser(null);
    setRole(null);
    setScreen("landing");
  };

  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh", background:"#0F172A", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, border:"3px solid rgba(59,130,246,0.2)", borderTopColor:"#3B82F6", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
          <span style={{ color:"#64748B", fontSize:13 }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { background:#0F172A; font-family:'Inter',system-ui,sans-serif; height:100%; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(148,163,184,0.15); border-radius:99px; }
        input:focus, button:focus, textarea:focus { outline:none; }
        a { text-decoration:none; }
        @keyframes fadein  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse2  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes tdot    { 0%,60%,100%{transform:translateY(0);opacity:.35} 30%{transform:translateY(-5px);opacity:1} }

        /* Responsive helpers */
        .lf-hide-mobile { display:flex; }
        .lf-show-mobile { display:none; }
        .lf-cta-row     { flex-direction:row; }

        @media (max-width:640px) {
          .lf-hide-mobile { display:none !important; }
          .lf-show-mobile { display:flex !important; }
          .lf-cta-row     { flex-direction:column !important; }
        }

        /* Mobile responsive tweaks for app shell */
        @media (max-width:768px) {
          textarea { font-size:16px !important; } /* prevent iOS zoom */
        }
      `}</style>

      {screen==="landing" && (
        <LandingPage onNavigate={(dest)=>setScreen(dest)}/>
      )}
      {screen==="login" && (
        <LoginPage
          onLogin={handleLogin}
          onDemoLogin={handleDemoLogin}
          onBack={()=>setScreen("landing")}
        />
      )}
      {screen==="app" && role && (
        <AppShell
          role={role}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
