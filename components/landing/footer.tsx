import Link from "next/link";
import Image from "next/image";
import { Globe } from "lucide-react";
import type { ReactNode } from "react";

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-violet-500/50 hover:text-white [&>svg]:h-4 [&>svg]:w-4"
    >
      {children}
    </a>
  );
}

type FooterColumn = {
  title: string;
  id?: string;
  links: [string, string][];
};

const columns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      ["Creator Discovery", "#how-it-works"],
      ["Advanced Filters", "#product"],
      ["Match Models", "#product"],
      ["Reporting", "#product"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Us", "#"],
      ["Careers", "#"],
      ["Press", "#"],
      ["Contact", "#cta"],
    ],
  },
  {
    title: "Resources",
    id: "resources",
    links: [
      ["Help Center", "#"],
      ["Guides", "#"],
      ["API Docs", "#"],
      ["Status", "#"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy Policy", "#"],
      ["Terms of Service", "#"],
      ["Security", "#"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-4 border-t border-slate-800/80 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-md">
                <Image src="/assets/logo.jpg" alt="Wecollab Logo" fill className="object-cover" />
              </div>
              <span className="text-lg font-bold text-white">Wecollab</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              The creator marketing platform for teams who care about fit, verification, and speed.
            </p>
            <div className="flex gap-3">
              <SocialLink href="#" label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </SocialLink>
              <SocialLink href="#" label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </SocialLink>
              <SocialLink href="#" label="YouTube">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
                </svg>
              </SocialLink>
              <SocialLink href="#" label="X">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 4l16 16M20 4L4 20" strokeLinecap="round" />
                </svg>
              </SocialLink>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} id={col.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{col.title}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-slate-400 transition hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-slate-800 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© 2024 Wecollab. All rights reserved.</p>
          <label className="inline-flex items-center gap-2 text-slate-400">
            <Globe className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="sr-only">Language</span>
            <select
              className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 outline-none"
              defaultValue="en"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </label>
        </div>
      </div>
    </footer>
  );
}
