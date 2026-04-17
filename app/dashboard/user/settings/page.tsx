"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import { preferencesApi, UserPreferences, timezones, languages } from "@/lib/api";
import { User, Bell, Palette, Save, CheckCircle2 } from "lucide-react";

export default function UserSettingsPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs]   = useState<UserPreferences|null>(null);
  const [saved, setSaved]   = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [apiError, setApiError] = useState<string|null>(null);

  useEffect(() => { setMounted(true); if (!isLoading && !session) router.replace("/login"); }, [session, isLoading, router]);

  useEffect(() => {
    if (!session) return;
    preferencesApi.get(session.access_token).then(r => { if (r.data) setPrefs(r.data); });
  }, [session]);

  async function handleSave() {
    if (!session || !prefs) return;
    const { email, department, ...updatable } = prefs;
    const r = await preferencesApi.update(session.access_token, updatable);
    if (r.data) { setPrefs(r.data); setSaved(true); setTimeout(()=>setSaved(false), 2000); }
    else setApiError(r.error ?? "Save failed");
  }

  if (!mounted || isLoading || !session || !prefs) return null;

  const tabs = [
    { id:"profile",        icon:<User size={14}/>,    label:"Profile" },
    { id:"notifications",  icon:<Bell size={14}/>,    label:"Notifications" },
    { id:"appearance",     icon:<Palette size={14}/>, label:"Appearance" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <NavBar/>
      <main style={{ maxWidth:900, margin:"0 auto", padding:"32px 24px 64px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }} className="animate-fade-up stagger-1">
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:400, margin:"0 0 4px", color:"var(--text)" }}>Settings</h1>
            <p style={{ fontSize:13, color:"var(--text-muted)", margin:0 }}>Manage your account preferences</p>
          </div>
          <button style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", border:"none", borderRadius:8, color:"#0a0a0f", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", background:saved?"var(--success)":"var(--accent)", transition:"background 0.3s" }} onClick={handleSave}>
            {saved?<CheckCircle2 size={14}/>:<Save size={14}/>}{saved?"Saved!":"Save Changes"}
          </button>
        </div>
        {apiError && <div style={{ padding:"12px 16px", background:"rgba(224,85,85,0.08)", border:"1px solid rgba(224,85,85,0.2)", borderRadius:8, color:"var(--danger)", fontSize:13, marginBottom:16 }}>{apiError}</div>}
        <div style={{ display:"grid", gridTemplateColumns:"180px 1fr", gap:20, alignItems:"start" }}>
          <nav style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:8, display:"flex", flexDirection:"column", gap:2 }} className="animate-fade-up stagger-2">
            {tabs.map(t => <button key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:7, border:"none", background:activeTab===t.id?"var(--surface-2)":"none", color:activeTab===t.id?"var(--text)":"var(--text-muted)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)", fontWeight:activeTab===t.id?500:400 }} onClick={()=>setActiveTab(t.id)}>{t.icon}{t.label}</button>)}
          </nav>
          <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:24 }} className="animate-fade-up stagger-3">
            {activeTab==="profile" && <>
              <h2 style={{ fontSize:14, fontWeight:600, color:"var(--text)", margin:"0 0 16px", paddingBottom:10, borderBottom:"1px solid var(--border)" }}>Personal Information</h2>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {[{label:"Display Name",key:"displayName",ro:false},{label:"Email",key:"email",ro:true},{label:"Department",key:"department",ro:true}].map(f => (
                  <div key={f.key} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>{f.label}</label>
                    <input style={{ padding:"9px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none", opacity:f.ro?0.5:1, width:"100%" }} value={(prefs as unknown as Record<string,unknown>)[f.key] as string} readOnly={f.ro} onChange={e=>!f.ro&&setPrefs(p=>p?{...p,[f.key]:e.target.value}:p)}/>
                  </div>
                ))}
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>Timezone</label>
                  <select style={{ padding:"9px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none" }} value={prefs.timezone} onChange={e=>setPrefs(p=>p?{...p,timezone:e.target.value}:p)}>
                    {timezones.map(tz=><option key={tz}>{tz}</option>)}
                  </select>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>Language</label>
                  <select style={{ padding:"9px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none" }} value={prefs.language} onChange={e=>setPrefs(p=>p?{...p,language:e.target.value}:p)}>
                    {languages.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>
              </div>
            </>}
            {activeTab==="notifications" && <>
              <h2 style={{ fontSize:14, fontWeight:600, color:"var(--text)", margin:"0 0 8px", paddingBottom:10, borderBottom:"1px solid var(--border)" }}>Email Notifications</h2>
              <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 20px" }}>Choose which events trigger an email alert.</p>
              {[{key:"emailOnNewLogin",label:"New login from a new device",desc:"Get notified when a sign-in occurs from an unrecognized device"},{key:"emailOnPasswordChange",label:"Password change",desc:"Receive a confirmation email whenever your password is updated"},{key:"emailOnTokenExpiry",label:"Session expiry reminder",desc:"Get a heads-up email before your refresh token expires"}].map(item => (
                <div key={item.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--border)", gap:20 }}>
                  <div><div style={{ fontSize:13, fontWeight:500, color:"var(--text)", marginBottom:3 }}>{item.label}</div><div style={{ fontSize:12, color:"var(--text-muted)" }}>{item.desc}</div></div>
                  <button onClick={()=>setPrefs(p=>p?{...p,[item.key]:!(p as unknown as Record<string,unknown>)[item.key]}:p)} style={{ width:44, height:24, borderRadius:12, background:(prefs as unknown as Record<string,unknown>)[item.key]?"var(--success)":"var(--border)", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
                    <span style={{ position:"absolute", width:18, height:18, borderRadius:"50%", background:"#fff", top:3, left:(prefs as unknown as Record<string,unknown>)[item.key]?23:3, transition:"left 0.2s" }}/>
                  </button>
                </div>
              ))}
            </>}
            {activeTab==="appearance" && <>
              <h2 style={{ fontSize:14, fontWeight:600, color:"var(--text)", margin:"0 0 16px", paddingBottom:10, borderBottom:"1px solid var(--border)" }}>Theme</h2>
              <div style={{ display:"flex", gap:12 }}>
                {(["dark","light","system"] as const).map(t => (
                  <button key={t} onClick={()=>setPrefs(p=>p?{...p,theme:t}:p)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:12, borderRadius:10, border:`1px solid ${prefs.theme===t?"var(--accent)":"var(--border)"}`, background:prefs.theme===t?"rgba(200,169,110,0.06)":"var(--surface-2)", cursor:"pointer" }}>
                    <div style={{ width:64, height:40, borderRadius:6, border:"1px solid var(--border)", background:t==="dark"?"#0a0a0f":t==="light"?"#f8fafc":"linear-gradient(135deg,#0a0a0f 50%,#f8fafc 50%)" }}/>
                    <span style={{ fontSize:12, color:prefs.theme===t?"var(--accent)":"var(--text-muted)", textTransform:"capitalize" }}>{t}</span>
                  </button>
                ))}
              </div>
            </>}
          </div>
        </div>
      </main>
    </div>
  );
}
