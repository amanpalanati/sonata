const API_BASE_URL = ""; // same as in auth.ts, proxy handles /api -> Flask

export type Teacher = {
  id: string;
  first_name: string;
  last_name: string;
  instruments: string[]; // now an array
  profile_image: string | null;
  bio: string | null;
};

export async function fetchTeachers(q?: string): Promise<Teacher[]> {
  const url = q ? `/api/teachers?q=${encodeURIComponent(q)}` : `/api/teachers`;
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Failed to load teachers");
  }
  return res.json();
}
