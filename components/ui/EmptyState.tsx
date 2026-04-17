import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={styles.root}>
      <div style={styles.icon}>{icon}</div>
      <p style={styles.title}>{title}</p>
      <p style={styles.desc}>{description}</p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" },
  icon: { color: "var(--text-dim)", marginBottom: 12 },
  title: { fontSize: 15, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 6px" },
  desc: { fontSize: 13, color: "var(--text-dim)", margin: 0, maxWidth: 280 },
};
