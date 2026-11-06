"use client";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({ fullName: z.string().min(2).max(120), mobile: z.string().min(7).max(20), email: z.string().email().optional().or(z.literal("")), subject: z.string().max(160).optional(), details: z.string().min(10).max(4000) });

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = schema.safeParse(Object.fromEntries(form.entries()));
    if (!parsed.success) { setMessage("Please check the fields and enter valid information."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = await response.json();
      setMessage(response.ok ? "Your message has been received." : (data.error || "The message could not be sent. Please try again later."));
      if (response.ok) formElement.reset();
    } catch { setMessage("Unable to send the message right now."); }
    finally { setBusy(false); }
  }
  return <form className="contact-form" onSubmit={submit}>
    <div className="form-row"><label>Full name<input name="fullName" required maxLength={120} placeholder="Your name" /></label><label>Phone number<input name="mobile" required maxLength={20} placeholder="Your phone number" /></label></div>
    <div className="form-row"><label>Email address<input name="email" type="email" placeholder="name@example.com" /></label><label>Subject<input name="subject" maxLength={160} placeholder="How can we help?" /></label></div>
    <label>Message<textarea name="details" required minLength={10} maxLength={4000} rows={5} placeholder="Write your message" /></label>
    <div className="form-submit"><button className="button button-primary" disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</button>{message && <p role="status">{message}</p>}</div>
  </form>;
}
