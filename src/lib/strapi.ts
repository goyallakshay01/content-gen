export const NEXT_PUBLIC_STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

export async function strapiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${NEXT_PUBLIC_STRAPI_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Strapi request failed");
  }

  return data;
}