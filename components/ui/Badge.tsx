import React from "react";

type Variant = "admin" | "user" | "active" | "inactive" | "locked" | "pending" | "info" | "warning" | "danger" | "success" | "neutral";

const variantStyles: Record<Variant, React.CSSProperties> = {
  admin:    { background: "rgba(123,111,232,0.15)", color: "#7b6fe8", border: "1px solid rgba(123,111,232,0.25)" },
  user:     { background: "rgba(85,184,130,0.15)",  color: "#55b882", border: "1px solid rgba(85,184,130,0.25)" },
  active:   { background: "rgba(85,184,130,0.12)",  color: "#55b882", border: "1px solid rgba(85,184,130,0.2)" },
  inactive: { background: "rgba(74,74,112,0.2)",    color: "#7070a0", border: "1px solid rgba(74,74,112,0.2)" },
  locked:   { background: "rgba(224,85,85,0.12)",   color: "#e05555", border: "1px solid rgba(224,85,85,0.2)" },
  pending:  { background: "rgba(224,160,85,0.12)",  color: "#e0a055", border: "1px solid rgba(224,160,85,0.2)" },
  info:     { background: "rgba(37,99,235,0.12)",   color: "#60a5fa", border: "1px solid rgba(37,99,235,0.2)" },
  warning:  { background: "rgba(224,160,85,0.12)",  color: "#e0a055", border: "1px solid rgba(224,160,85,0.2)" },
  danger:   { background: "rgba(224,85,85,0.12)",   color: "#e05555", border: "1px solid rgba(224,85,85,0.2)" },
  success:  { background: "rgba(85,184,130,0.12)",  color: "#55b882", border: "1px solid rgba(85,184,130,0.2)" },
  neutral:  { background: "rgba(42,42,58,0.6)",     color: "#7070a0", border: "1px solid #2a2a3a" },
};

interface BadgeProps {
  variant: Variant;
  children: React.ReactNode;
  size?: "sm" | "md";
}

export default function Badge({ variant, children, size = "sm" }: BadgeProps) {
  return (
    <span style={{
      ...variantStyles[variant],
      padding: size === "sm" ? "2px 8px" : "4px 10px",
      borderRadius: 4,
      fontSize: size === "sm" ? 10 : 12,
      fontFamily: "var(--font-mono)",
      letterSpacing: "0.06em",
      fontWeight: 500,
      display: "inline-block",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}
