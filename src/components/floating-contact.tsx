"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MessageCircle,
  MessageSquare,
  Phone,
  X,
} from "lucide-react";

const phone = process.env.NEXT_PUBLIC_STORE_PHONE || "01844-572826";
const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || "";
const messengerUrl =
  process.env.NEXT_PUBLIC_MESSENGER_URL || "https://m.me/101985647846888";

export function FloatingContact() {
  const [open, setOpen] = useState(false);

  const actions = [
    {
      label: "Call",
      href: phone ? `tel:${phone}` : "/site/contact-us",
      icon: Phone,
      external: false,
    },
    {
      label: "Messenger",
      href: messengerUrl || "/site/contact-us",
      icon: MessageSquare,
      external: Boolean(messengerUrl),
    },
    {
      label: "WhatsApp",
      href: whatsappUrl || "/site/contact-us",
      icon: MessageCircle,
      external: Boolean(whatsappUrl),
    },
  ];

  return (
    <div className="floating-contact">
      {open && (
        <div className="floating-contact-actions">
          {actions.map(({ label, href, icon: Icon, external }) => (
            <Link
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              onClick={() => setOpen(false)}
            >
              <span>{label}</span>
              <Icon size={18} />
            </Link>
          ))}
        </div>
      )}

      <button
        type="button"
        className="floating-contact-trigger"
        aria-label={open ? "Close contact options" : "Open contact options"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
