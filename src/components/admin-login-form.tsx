"use client";
import { useState } from "react";

export function AdminLoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) setError(result.error || "Sign in failed.");
      else window.location.href = "/admin";
    } catch { setError("Unable to sign in. Check the server configuration."); }
    finally { setBusy(false); }
  }
  return <form className="login-form" onSubmit={submit}>
    <label>Email address<input type="email" name="email" required autoComplete="username" /></label>
    <label>Password<input type="password" name="password" required autoComplete="current-password" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
  </form>;
}
