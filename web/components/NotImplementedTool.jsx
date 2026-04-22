"use client";
import { useState } from "react";

export default function NotImplementedTool({ endpoint, title, description }) {
  const [msg, setMsg] = useState("");
  async function check() {
    setMsg("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/${endpoint}`, { method: 'POST' });
      const j = await res.json();
      setMsg(j?.note || j?.error || 'Not implemented');
    } catch (e) { setMsg(e.message || 'Not implemented'); }
  }
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold mb-2">{title}</h1>
      <p className="text-sm text-zinc-600 mb-6">{description}</p>
      <div className="rounded-lg border p-4 bg-white">
        <p className="text-sm">This feature requires additional system dependencies. Click to read server note.</p>
        <button onClick={check} className="mt-3 rounded-md bg-black px-4 py-2 text-white">Check availability</button>
        {msg && <p className="mt-3 text-sm text-zinc-700">{msg}</p>}
      </div>
    </main>
  );
}
