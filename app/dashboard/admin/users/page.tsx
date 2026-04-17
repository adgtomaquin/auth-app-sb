"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { usePagination } from "@/lib/hooks/usePagination";
import { usersApi, ManagedUser, UserStatus, departments } from "@/lib/api";
import { Search, UserPlus, Trash2, Lock, Unlock, Users, Edit2 } from "lucide-react";

type StatusFilter = "all" | UserStatus;

export default function UsersPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers]   = useState<ManagedUser[]>([]);
  const [total, setTotal]   = useState(0);
  const [fetching, setFetching] = useState(false);
  const [apiError, setApiError] = useState<string|null>(null);
  const [search, setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser]     = useState<ManagedUser|null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ManagedUser|null>(null);
  const [form, setForm] = useState({ name:"", email:"", department:"Engineering", roles:["USER"] as ("ADMIN"|"USER")[] });
  const [saved, setSaved] = useState(false);
  const [editError, setEditError] = useState<string|null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !session) router.replace("/login");
    if (!isLoading && session && !session.user.roles.includes("ADMIN")) router.replace("/dashboard/user");
  }, [session, isLoading, router]);

  const load = useCallback(async () => {
    if (!session) return;
    setFetching(true); setApiError(null);
    const r = await usersApi.list(session.access_token, {
      status: statusFilter === "all" ? undefined : statusFilter,
      search: search || undefined,
    });
    setFetching(false);
    if (r.data) { setUsers(r.data.users); setTotal(r.data.total); }
    else setApiError(r.error ?? "Failed to load users");
  }, [session, statusFilter, search]);

  useEffect(() => { if (session) load(); }, [session, statusFilter]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q));
  }, [users, search]);

  const { page, totalPages, pageItems, setPage, prev, next } = usePagination(filtered, 7);

  async function toggleLock(u: ManagedUser) {
    if (!session) return;
    await usersApi.update(session.access_token, u.id, { status: u.status === "locked" ? "active" : "locked" });
    load();
  }
  async function handleDelete() {
    if (!deleteConfirm || !session) return;
    await usersApi.delete(session.access_token, deleteConfirm.id);
    setDeleteConfirm(null); load();
  }
  async function handleInvite() {
    if (!form.name || !form.email || !session) return;
    await usersApi.invite(session.access_token, form);
    setInviteOpen(false); setForm({ name:"", email:"", department:"Engineering", roles:["USER"] }); load();
  }
  async function handleSaveEdit() {
    if (!editUser || !session) return;
    setEditError(null);
    const r = await usersApi.update(session.access_token, editUser.id, {
      name:       editUser.name,
      department: editUser.department,
      status:     editUser.status,
      roles:      editUser.roles,
    });
    if (r.data || r.status === 200) {
      setSaved(true);
      setTimeout(() => { setSaved(false); setEditUser(null); setEditError(null); load(); }, 1000);
    } else {
      setEditError(r.error ?? "Update failed. Check your connection and try again.");
    }
  }

  if (!mounted || isLoading || !session) return null;

const fieldStyle: React.CSSProperties = { padding:"9px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none", width:"100%" };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <NavBar />
      <main style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px 64px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }} className="animate-fade-up stagger-1">
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:400, margin:"0 0 4px", color:"var(--text)" }}>User Management</h1>
            <p style={{ fontSize:13, color:"var(--text-muted)", margin:0 }}>{total} total accounts</p>
          </div>
          <button style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", color:"#0a0a0f", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={() => setInviteOpen(true)}>
            <UserPlus size={14}/> Invite User
          </button>
        </div>

        {apiError && <div style={{ padding:"12px 16px", background:"rgba(224,85,85,0.08)", border:"1px solid rgba(224,85,85,0.2)", borderRadius:8, color:"var(--danger)", fontSize:13, marginBottom:16 }}>{apiError}</div>}

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }} className="animate-fade-up stagger-2">
          <div style={{ position:"relative", flex:1, minWidth:200 }}>
            <Search size={14} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}/>
            <input style={{ width:"100%", padding:"9px 12px 9px 36px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none" }}
              placeholder="Search name, email, department…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {(["all","active","locked","pending","inactive"] as StatusFilter[]).map(s => (
              <button key={s} style={{ padding:"6px 12px", borderRadius:7, border:"1px solid var(--border)", background: statusFilter===s?"var(--surface-2)":"var(--surface)", color:statusFilter===s?"var(--text)":"var(--text-muted)", fontSize:12, cursor:"pointer", fontFamily:"var(--font-body)", borderColor:statusFilter===s?"var(--accent)":"var(--border)" }}
                onClick={() => { setStatusFilter(s); setPage(1); }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }} className="animate-fade-up stagger-3">
          {fetching && <div style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)" }}>Loading…</div>}
          {!fetching && pageItems.length === 0
            ? <EmptyState icon={<Users size={32}/>} title="No users found" description="Try adjusting your search or filter."/>
            : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>{["User","Department","Roles","Status","Logins","Actions"].map(h => <th key={h} style={{ textAlign:"left", padding:"10px 16px", fontSize:11, color:"var(--text-dim)", fontFamily:"var(--font-mono)", letterSpacing:"0.06em", borderBottom:"1px solid var(--border)", background:"var(--surface-2)" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {pageItems.map(u => (
                    <tr key={u.id} style={{ borderBottom:"1px solid var(--border)" }}>
                      <td style={{ padding:"12px 16px", verticalAlign:"middle" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, background:u.roles.includes("ADMIN")?"rgba(123,111,232,0.15)":"rgba(85,184,130,0.15)", color:u.roles.includes("ADMIN")?"#7b6fe8":"#55b882" }}>{u.avatar}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:500 }}>{u.name}</div>
                            <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)", verticalAlign:"middle" }}>{u.department}</td>
                      <td style={{ padding:"12px 16px", verticalAlign:"middle" }}>
                        <div style={{ display:"flex", gap:4 }}>{u.roles.map(r => <Badge key={r} variant={r==="ADMIN"?"admin":"user"}>{r}</Badge>)}</div>
                      </td>
                      <td style={{ padding:"12px 16px", verticalAlign:"middle" }}><Badge variant={u.status as "active"|"inactive"|"locked"|"pending"}>{u.status}</Badge></td>
                      <td style={{ padding:"12px 16px", fontSize:12, fontFamily:"var(--font-mono)", verticalAlign:"middle" }}>{u.loginCount}</td>
                      <td style={{ padding:"12px 16px", verticalAlign:"middle" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <button style={{ width:28, height:28, borderRadius:6, border:"1px solid var(--border)", background:"var(--surface-2)", color:"var(--text-muted)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setEditUser({...u})}><Edit2 size={13}/></button>
                          <button style={{ width:28, height:28, borderRadius:6, border:"1px solid var(--border)", background:"var(--surface-2)", color:"var(--text-muted)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => toggleLock(u)}>
                            {u.status==="locked"?<Unlock size={13} color="var(--success)"/>:<Lock size={13}/>}
                          </button>
                          <button style={{ width:28, height:28, borderRadius:6, border:"1px solid var(--border)", background:"var(--surface-2)", color:"var(--danger)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setDeleteConfirm(u)}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
          {filtered.length > 7 && <div style={{ padding:"0 16px 8px" }}><Pagination page={page} totalPages={totalPages} onPrev={prev} onNext={next} onPage={setPage} total={filtered.length} pageSize={7}/></div>}
        </div>

        <Modal open={inviteOpen} onClose={()=>setInviteOpen(false)} title="Invite New User">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            {[{label:"Full Name",key:"name",ph:"e.g. Jamie Lee"},{label:"Email",key:"email",ph:"jamie@corp.com"}].map(f => (
              <div key={f.key} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>{f.label}</label>
                <input style={{ padding:"9px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none" }} placeholder={f.ph} value={(form as Record<string,unknown>)[f.key] as string} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}/>
              </div>
            ))}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>Department</label>
              <select style={{ padding:"9px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none" }} value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))}>
                {departments.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>Role</label>
              <select style={{ padding:"9px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none" }} value={form.roles[0]} onChange={e=>setForm(p=>({...p,roles:[e.target.value as "ADMIN"|"USER"]}))}>
                <option value="USER">USER</option><option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button style={{ padding:"9px 16px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-muted)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={()=>setInviteOpen(false)}>Cancel</button>
            <button style={{ padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:7, color:"#0a0a0f", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={handleInvite}>Send Invite</button>
          </div>
        </Modal>

        <Modal open={!!editUser} onClose={()=>{ setEditUser(null); setEditError(null); }} title="Edit User">
          {editUser && <>
            {/* Read-only user info header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"var(--surface-2)", borderRadius:8, marginBottom:20 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, background:editUser.roles.includes("ADMIN")?"rgba(123,111,232,0.15)":"rgba(85,184,130,0.15)", color:editUser.roles.includes("ADMIN")?"#7b6fe8":"#55b882", flexShrink:0 }}>{editUser.avatar}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{editUser.email}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>ID: {editUser.id}</div>
              </div>
            </div>

            {/* Editable fields */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
              {/* Full Name */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>Full Name</label>
                <input style={fieldStyle} value={editUser.name} onChange={e=>setEditUser(p=>p?{...p,name:e.target.value}:p)}/>
              </div>

              {/* Department */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>Department</label>
                <select style={fieldStyle} value={editUser.department} onChange={e=>setEditUser(p=>p?{...p,department:e.target.value}:p)}>
                  {departments.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>

              {/* Status */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>Status</label>
                <select style={fieldStyle} value={editUser.status} onChange={e=>setEditUser(p=>p?{...p,status:e.target.value as ManagedUser["status"]}:p)}>
                  {["active","inactive","locked","pending"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Role */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:500, color:"var(--text-muted)" }}>Role</label>
                <select style={fieldStyle} value={editUser.roles.includes("ADMIN")?"ADMIN":"USER"} onChange={e=>setEditUser(p=>p?{...p,roles:e.target.value==="ADMIN"?["ADMIN","USER"]:["USER"]}:p)}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN (includes USER)</option>
                </select>
              </div>
            </div>

            {/* Stats row — read only */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16, padding:"10px 14px", background:"var(--surface-2)", borderRadius:8 }}>
              {[
                { label:"Login count", value:String(editUser.loginCount) },
                { label:"Joined",      value:editUser.joined },
                { label:"Last login",  value:editUser.lastLogin === "—" ? "Never" : editUser.lastLogin?.split("T")[0] ?? "—" },
              ].map(s=>(
                <div key={s.label}>
                  <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"var(--font-mono)", marginBottom:3 }}>{s.label}</div>
                  <div style={{ fontSize:12, color:"var(--text)", fontFamily:"var(--font-mono)" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Error */}
            {editError && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"rgba(224,85,85,0.08)", border:"1px solid rgba(224,85,85,0.25)", borderRadius:7, color:"var(--danger)", fontSize:13, marginBottom:14 }}>
                {editError}
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button style={{ padding:"9px 16px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-muted)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={()=>{ setEditUser(null); setEditError(null); }}>Cancel</button>
              <button style={{ padding:"9px 16px", background:saved?"var(--success)":"var(--accent)", border:"none", borderRadius:7, color:"#0a0a0f", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", transition:"background 0.2s" }} onClick={handleSaveEdit}>{saved?"Saved!":"Save Changes"}</button>
            </div>
          </>}
        </Modal>

        <Modal open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} title="Confirm Delete" width={380}>
          <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 20px" }}>Delete <strong style={{ color:"var(--text)" }}>{deleteConfirm?.name}</strong>? This cannot be undone.</p>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button style={{ padding:"9px 16px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-muted)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={()=>setDeleteConfirm(null)}>Cancel</button>
            <button style={{ padding:"9px 16px", background:"var(--danger)", border:"none", borderRadius:7, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={handleDelete}>Delete User</button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
