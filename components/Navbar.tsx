"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/moderate',  label: 'Moderate',  icon: '🔍' },
  { to: '/queue',     label: 'Review Queue', icon: '👥' },
  { to: '/policies',  label: 'Policies',  icon: '⚙️' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <Link className="navbar-brand" href="/dashboard">
        <span className="logo">🛡️</span>
        <div>
          <div className="brand-title">Content Moderation Pipeline</div>
          <div className="brand-sub">AI-powered · Multi-stage · Explainable</div>
        </div>
      </Link>
      <div className="navbar-nav">
        {links.map((l) => (
          <Link
            key={l.to}
            href={l.to}
            className={`nav-link ${pathname === l.to ? 'active' : ''}`}
          >
            <span className="icon">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
