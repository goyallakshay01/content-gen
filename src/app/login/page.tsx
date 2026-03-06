"use client";

import { redirect } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleAction(formData: FormData) {
    const dataObj = Object.fromEntries(formData.entries());
    const response = await fetch("/api/loginApi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: btoa(JSON.stringify(dataObj)),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Login failed");
      return;
    }
    redirect("/");
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