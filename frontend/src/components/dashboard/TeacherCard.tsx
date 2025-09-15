import React from "react";
import type { Teacher } from "../../services/teachers";

export default function TeacherCard({ t }: { t: Teacher }) {
  const fullName = `${t.first_name} ${t.last_name}`;
  const src = t.profile_image ?? placeholder(fullName);

  return (
    <div style={styles.card}>
      <img src={src} alt={fullName} style={styles.avatar} />
      <div style={styles.meta}>
        <div style={styles.name}>{fullName}</div>
        <div style={styles.instrument}>
          {t.instruments?.length ? t.instruments.join(", ") : "No instruments listed"}
        </div>
      </div>
    </div>
  );
}

function placeholder(name: string) {
  const initials = name.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=ddd&color=444&rounded=true&size=256`;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "88px 1fr",
    alignItems: "center",
    gap: 16,
    padding: 18,
    border: "1px solid #eee",
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #f0f0f0",
  },
  meta: { display: "grid", gap: 6, minWidth: 0 },
  name: { fontWeight: 700, fontSize: 18, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  instrument: { color: "#666", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
};
