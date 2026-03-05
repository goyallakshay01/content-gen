"use client";

import { useState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleAction(formData: FormData) {
    const res = await loginAction(formData);

    if (res?.error) {
      setError(res.error);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form action={handleAction} className="space-y-4 w-80">
        <h1 className="text-2xl font-bold">Login</h1>

        <input name="identifier" placeholder="Email" className="border p-2 w-full" />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="border p-2 w-full"
        />

        <button className="bg-black text-white p-2 w-full">Login</button>

        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}