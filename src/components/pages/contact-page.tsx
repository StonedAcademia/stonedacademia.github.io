import type { CSSProperties } from "react";
import { ExternalLink, Github, Twitter } from "lucide-react";

import { PretextText } from "@/lib/pretext/pretext-text";

const contacts = [
  {
    href: "https://twitter.com/TheSolomonSwan",
    icon: Twitter,
    label: "twitter",
    value: "@TheSolomonSwan",
  },
  {
    href: "https://github.com/StonedAcademia",
    icon: Github,
    label: "github",
    value: "StonedAcademia",
  },
];

export function ContactPage() {
  return (
    <section className="motion-page">
      <div className="motion-rail motion-block mb-10 space-y-3 border-l border-border pl-4">
        <p className="text-xs uppercase tracking-normal text-muted-foreground">
          contact
        </p>
        <PretextText
          animation="heading"
          as="h1"
          className="text-2xl font-semibold leading-tight"
          text="elsewhere"
        />
      </div>

      <div className="space-y-3">
        {contacts.map((contact, contactIndex) => {
          const Icon = contact.icon;

          return (
            <a
              className="contact-signal motion-rail motion-list-item group flex items-center gap-4 border-l border-border pl-4 text-foreground no-underline"
              href={contact.href}
              key={contact.label}
              rel="noreferrer"
              style={{ "--item-index": contactIndex } as CSSProperties}
              target="_blank"
            >
              <span className="contact-signal-icon grid h-10 w-10 shrink-0 place-items-center border border-border text-primary">
                <Icon className="motion-icon h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs uppercase text-muted-foreground">
                  {contact.label}
                </span>
                <span className="block truncate text-sm text-primary">
                  {contact.value}
                </span>
              </span>
              <ExternalLink className="motion-icon h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
