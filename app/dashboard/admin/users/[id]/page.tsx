"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import Badge from "@/components/ui/Badge";
import { usersApi, ManagedUser, departments } from "@/lib/api";
import { ArrowLeft, Save, CheckCircle2, Activity, Clock, User } from "lucide-react";

export default function UserDetailPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [mounted, setMounted] = useState(false);
  const [user, setUser]   = useState<ManagedUser|null>(null);
  const [edited, setEdited] = useState<ManagedUser|null>(null);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState<string|null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !session) router.replace("/login");
    if (!isLoading && session && !session.user.roles.includes("ADMIN")) router.replace("/dashboard/user");
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session || !id) return;
    usersApi.getById(session.access_token, id).then(r => {
      if (r.data) { setUser(r.data); setEdited({...r.data}); }
      else { setApiError(r.error ?? "User not found"); }
    });
  }, [session, id]);

  async function handleSave() {
    if (!edited || !session) return;
    const r = await usersApi.update(session.access_token, edited.id, edited);
    if (r.data) { setUser({...r.data}); setSaved(true); setTimeout(()=>setSaved(false), 2000); }
    else setApiError(r.error ?? "Update failed");
  }

  if (!mounted || isLoading || !session) return null;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <NavBar/>
      <main style={{ maxWidth:1000, margin:"0 auto", padding:"24px 24px 64px" }}>
        <div className="animate-fade-up stagger-1" style={{ marginBottom:20 }}>
          <button style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-muted)", fontSize:12, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={() => router.push("/dashboard/admin/users")}>
            <ArrowLeft size={14}/> Back to Users
          </button>
        </div>

        {apiError && <div style={{ padding:"12px 16px", background:"rgba(224,85,85,0.08)", border:"1px solid rgba(224,85,85,0.2)", borderRadius:8, color:"var(--danger)", fontSize:13, marginBottom:16 }}>{apiError}</div>}
        {!user && !apiError && <div style={{ color:"var(--text-muted)", fontSize:13 }}>Loading…</div>}

        {user && edited && (
          <>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:16 }} className="animate-fade-up stagger-2">
              <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
                <div style={{ width:56, height:56, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, background:user.roles.includes("ADMIN")?"rgba(123,111,232,0.15)":"rgba(85,184,130,0.15)", color:user.roles.includes("ADMIN")?"#7b6fe8":"#55b882" }}>{user.avatar}</div>
                <div>
                  <h1 style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:400, margin:"0 0 4px", color:"var(--text)" }}>{user.name}</h1>
                  <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 8px", fontFamily:"var(--font-mono)" }}>{user.email}</p>
                  <div style={{ display:"flex", gap:6 }}>{user.roles.map(r=><Badge key={r} variant={r==="ADMIN"?"admin":"user"}>{r}</Badge>)}<Badge variant={user.status as "active"|"inactive"|"locked"|"pending"}>{user.status}</Badge></div>
                </div>
              </div>
              <button style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", border:"none", borderRadius:8, color:"#0a0a0f", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", background:saved?"var(--success)":"var(--accent)", transition:"background 0.3s", flexShrink:0 }} onClick={handleSave}>
                {saved?<CheckCircle2 size={14}/>:<Save size={14}/>}{saved?"Saved!":"Save Changes"}
              </button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }} className="animate-fade-up stagger-3">
              {[{icon:<Activity size={16}/>,label:"Total Logins",value:user.loginCount,color:"var(--accent)"},{icon:<Clock size={16}/>,label:"Last Login",value:user.lastLogin==="—"?"Never":new Date(user.lastLogin).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),color:"var(--success)"},{icon:<User size={16}/>,label:"Member Since",value:new Date(user.joined).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),color:"var(--admin)"}].map(s=>(
                <div key={s.label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"16px 18px" }}>
                  <div style={{ color:s.color, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:22, color:"var(--text)", marginBottom:4 }}>{s.value}</div>
                  <div style={{ fontSize:11, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <section style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:20 }} className="animate-fade-up stagger-4">
              <h2 style={{ fontSize:14, fontWeight:600, margin:"0 0 16px" }}>Account Details</h2>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[{label:"Full Name",key:"name",type:"text"},{label:"Department",key:"department",options:departments},{label:"Status",key:"status",options:["active","inactive","locked","pending"]},{label:"Role",key:"_role",options:["USER","ADMIN"]}].map(f => (
                  <div key={f.key} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>{f.label}</label>
                    {f.options
                      ? <select style={{ padding:"9px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none" }}
                          value={f.key==="_role"?(edited.roles.includes("ADMIN")?"ADMIN":"USER"):(edited as unknown as Record<string,unknown>)[f.key] as string}
                          onChange={e => f.key==="_role" ? setEdited(p=>p?{...p,roles:e.target.value==="ADMIN"?["ADMIN","USER"]:["USER"]}:p) : setEdited(p=>p?{...p,[f.key]:e.target.value}:p)}>
                          {f.options.map(o=><option key={o}>{o}</option>)}
                        </select>
                      : <input style={{ padding:"9px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none" }}
                          value={(edited as unknown as Record<string,unknown>)[f.key] as string} onChange={e=>setEdited(p=>p?{...p,[f.key]:e.target.value}:p)}/>
                    }
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
