import { requireAuth } from "@/src/lib/auth";

export default async function DashboardPage() {
  const token = await requireAuth();

  const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const user = await res.json();

  return (
    <div>
      <h1>Welcome {user.username}</h1>
    </div>
  );
}