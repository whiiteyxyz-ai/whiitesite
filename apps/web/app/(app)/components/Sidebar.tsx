"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const tools: NavItem[] = [
  { href: "/imagegen", icon: "🎨", label: "Bild-Studio" },
  { href: "/description", icon: "✍️", label: "Produkt-Beschreibungen" },
  { href: "/whiity", icon: "🤖", label: "Whiity" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">W</div>
        <div className="logo-text">
          <span>WHIITE</span>
        </div>
      </div>

      <div className="section-title">KI-Werkzeuge</div>
      {tools.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item ${pathname === item.href ? "active" : ""}`}
        >
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}

      <div style={{ marginTop: "auto", paddingTop: "20px" }}>
        <div
          style={{
            padding: "18px",
            background: "var(--whiite-light)",
            backdropFilter: "blur(20px)",
            borderRadius: "14px",
            border: "1px solid var(--whiite-border)",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--whiite-gold)",
              fontWeight: 700,
              letterSpacing: "1px",
              marginBottom: "8px",
            }}
          >
            WHIITE LINE
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--whiite-text-soft)",
              lineHeight: 1.6,
            }}
          >
            Premium durch Klarheit. Alle Ergebnisse werden automatisch an die
            Whiite-Brand-Identität angepasst.
          </p>
        </div>
      </div>
    </aside>
  );
}
