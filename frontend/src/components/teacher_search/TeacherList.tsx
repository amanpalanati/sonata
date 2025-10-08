import React, { useEffect, useState } from "react";
import TeacherCard from "./TeacherCard";
import { fetchTeachers, type Teacher } from "../../services/teachers";

export default function TeacherList() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setTeachers(await fetchTeachers());
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load teachers");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = q
    ? teachers.filter(t =>
        (
          t.first_name + " " + t.last_name + " " +
          (t.instruments ? t.instruments.join(" ") : "")
        ).toLowerCase().includes(q.toLowerCase())
      )
    : teachers;

  return (
    <section style={styles.wrap}>
      <div style={styles.header}>
        <h2 style={styles.h2}>Find your teacher</h2>
        <input
          placeholder="Search name or instrument…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={styles.search}
        />
      </div>

      {loading && <p style={styles.muted}>Loading teachers…</p>}
      {err && <p style={styles.error}>Error: {err}</p>}

      {!loading && !err && (
        <div style={styles.list}>
          {filtered.map(t => <TeacherCard key={t.id} t={t} />)}
          {filtered.length === 0 && <p style={styles.muted}>No matches.</p>}
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { marginTop: 16, maxWidth: 960, marginInline: "auto", padding: "0 16px" },
  header: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  h2: { margin: 0, fontSize: 20 },
  search: {
    flex: 1,
    minWidth: 260,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e6e6e6",
  },
  // vertical list: one card per row
  list: { display: "grid", gridTemplateColumns: "1fr", gap: 16, marginTop: 12 },
  muted: { color: "#888" },
  error: { color: "#b00020" },
};
