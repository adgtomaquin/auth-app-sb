"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";
import { Shield, LogOut, ChevronDown, Bell, Users, FileText, Settings, BookOpen, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { notificationsApi } from "@/lib/api";

export default function NavBar() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session?.access_token) return;
    notificationsApi.list(session.access_token)
      .then(r => { if (r.data) setUnread(r.data.unreadCount); })
      .catch(() => {});
  }, [session?.access_token, pathname]);

  async function handleLogout() {
    if (session) {
      await authApi.logout(session.access_token, session.refresh_token).catch(() => {});
    }
    logout();
    router.push("/login");
  }

  const isAdmin = session?.user.roles.includes("ADMIN");

  const adminLinks = [
    { href: "/dashboard/admin",            icon: <LayoutDashboard size={14}/>, label: "Overview" },
    { href: "/dashboard/admin/users",      icon: <Users size={14}/>,           label: "Users" },
    { href: "/dashboard/admin/audit-logs", icon: <FileText size={14}/>,        label: "Audit Logs" },
    { href: "/dashboard/admin/settings",   icon: <Settings size={14}/>,        label: "Settings" },
    { href: "/api-docs",                   icon: <BookOpen size={14}/>,         label: "API Docs" },
  ];
  const userLinks = [
    { href: "/dashboard/user",                  icon: <LayoutDashboard size={14}/>, label: "Overview" },
    { href: "/dashboard/user/notifications",    icon: <Bell size={14}/>,            label: "Notifications", badge: unread },
    { href: "/dashboard/user/settings",         icon: <Settings size={14}/>,        label: "Settings" },
    { href: "/api-docs",                        icon: <BookOpen size={14}/>,         label: "API Docs" },
  ];
  const links = isAdmin ? adminLinks : userLinks;

  return (
    <nav style={S.nav}>
      <div style={S.inner}>
        <div style={S.left}>
          <div style={S.brand}>
            <div style={S.logoWrap}><Shield size={16} color="var(--accent)" strokeWidth={1.5}/></div>
            <span style={S.brandName}>VAULT</span>
            <div style={{ ...S.roleBadge, ...(isAdmin ? S.adminBadge : S.userBadge) }}>{isAdmin?"ADMIN":"USER"}</div>
          </div>
          <div style={S.navLinks}>
            {links.map(link => {
              const active = pathname === link.href;
              return (
                <button key={link.href} style={{ ...S.navLink, ...(active ? S.navLinkActive : {}) }} onClick={() => router.push(link.href)}>
                  {link.icon}{link.label}
                  {"badge" in link && (link.badge as number) > 0 && <span style={S.notifBadge}>{link.badge as number}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div style={S.right}>
          <div style={S.avatarWrap} onClick={() => setOpen(!open)}>
            <div style={{ ...S.avatar, ...(isAdmin ? S.adminAvatar : S.userAvatar) }}>{session?.user.avatar}</div>
            <div style={S.userInfo}>
              <span style={S.userName}>{session?.user.name}</span>
              <span style={S.userEmail}>{session?.user.email}</span>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: open?"rotate(180deg)":"none", transition:"0.2s" }}/>
          </div>
          {open && (
            <div style={S.dropdown}>
              <div style={S.dropdownHeader}>
                <span style={S.dropdownName}>{session?.user.name}</span>
                <span style={S.dropdownEmail}>{session?.user.email}</span>
                <div style={{ display:"flex", gap:5, marginTop:6 }}>
                  {session?.user.roles.map(r => <span key={r} style={{ ...S.roleTag, ...(r==="ADMIN"?S.adminTag:S.userTag) }}>{r}</span>)}
                </div>
              </div>
              <div style={{ height:1, background:"var(--border)" }}/>
              <button style={S.logoutBtn} onClick={handleLogout}><LogOut size={14}/>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const S: Record<string, React.CSSProperties> = {
  nav:          { position:"sticky", top:0, zIndex:100, background:"rgba(10,10,15,0.9)", backdropFilter:"blur(16px)", borderBottom:"1px solid var(--border)" },
  inner:        { maxWidth:1200, margin:"0 auto", padding:"0 24px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 },
  left:         { display:"flex", alignItems:"center", gap:24, flex:1, minWidth:0 },
  brand:        { display:"flex", alignItems:"center", gap:8, flexShrink:0 },
  logoWrap:     { width:30, height:30, borderRadius:7, background:"var(--accent-glow)", border:"1px solid rgba(200,169,110,0.2)", display:"flex", alignItems:"center", justifyContent:"center" },
  brandName:    { fontFamily:"var(--font-mono)", fontSize:12, letterSpacing:"0.18em", color:"var(--accent)", fontWeight:500 },
  roleBadge:    { padding:"2px 7px", borderRadius:4, fontSize:10, fontFamily:"var(--font-mono)", letterSpacing:"0.07em", fontWeight:500 },
  adminBadge:   { background:"rgba(123,111,232,0.15)", color:"#7b6fe8", border:"1px solid rgba(123,111,232,0.2)" },
  userBadge:    { background:"rgba(85,184,130,0.15)", color:"#55b882", border:"1px solid rgba(85,184,130,0.2)" },
  navLinks:     { display:"flex", alignItems:"center", gap:2, overflow:"auto" },
  navLink:      { display:"flex", alignItems:"center", gap:6, padding:"6px 10px", borderRadius:6, border:"none", background:"none", color:"var(--text-muted)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)", whiteSpace:"nowrap", position:"relative" },
  navLinkActive:{ background:"var(--surface-2)", color:"var(--text)", border:"1px solid var(--border)" },
  notifBadge:   { position:"absolute", top:2, right:2, width:16, height:16, borderRadius:"50%", background:"var(--danger)", color:"#fff", fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 },
  right:        { position:"relative", display:"flex", alignItems:"center", flexShrink:0 },
  avatarWrap:   { display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"5px 8px", borderRadius:8, border:"1px solid transparent" },
  avatar:       { width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 },
  adminAvatar:  { background:"rgba(123,111,232,0.15)", color:"#7b6fe8", border:"1px solid rgba(123,111,232,0.3)" },
  userAvatar:   { background:"rgba(85,184,130,0.15)", color:"#55b882", border:"1px solid rgba(85,184,130,0.3)" },
  userInfo:     { display:"flex", flexDirection:"column" },
  userName:     { fontSize:12, fontWeight:500, color:"var(--text)", lineHeight:1.3 },
  userEmail:    { fontSize:11, color:"var(--text-muted)" },
  dropdown:     { position:"absolute", top:"calc(100% + 8px)", right:0, width:210, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, boxShadow:"0 16px 48px rgba(0,0,0,0.5)", overflow:"hidden", animation:"fadeIn 0.15s ease", zIndex:200 },
  dropdownHeader:{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:3 },
  dropdownName: { fontSize:13, fontWeight:600, color:"var(--text)" },
  dropdownEmail:{ fontSize:11, color:"var(--text-muted)" },
  roleTag:      { padding:"2px 6px", borderRadius:3, fontSize:10, fontFamily:"var(--font-mono)", letterSpacing:"0.06em" },
  adminTag:     { background:"rgba(123,111,232,0.15)", color:"#7b6fe8" },
  userTag:      { background:"rgba(85,184,130,0.15)", color:"#55b882" },
  logoutBtn:    { width:"100%", display:"flex", alignItems:"center", gap:8, padding:"11px 16px", background:"none", border:"none", color:"var(--danger)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)" },
};
