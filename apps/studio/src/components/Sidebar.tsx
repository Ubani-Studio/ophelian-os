'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

// Flat 8-item nav. No groups. Order is: structural unit (Cubes),
// graph (Nexus), daily ritual (Trail), then craft tools, then
// reference + system. Parked surfaces (Operators, Trajectories,
// Threshold, Rights, Ledger, Collaborative, Imprint, Altar) are
// removed from nav until they ship as load-bearing features.
// Altar is absorbed into Trail (per-row tend buttons live there).
const navItems: NavItem[] = [
  { href: '/cubes', label: 'Cubes', icon: 'C' },
  { href: '/nexus', label: 'Nexus', icon: 'N' },
  { href: '/trail', label: 'Trail', icon: 'T' },
  { href: '/', label: 'Characters', icon: 'C' },
  { href: '/places', label: 'Places', icon: 'P' },
  { href: '/arcs', label: 'Trajectories', icon: 'T' },
  { href: '/names', label: 'Names', icon: 'N' },
  { href: '/scenes', label: 'Scenes', icon: 'S' },
  { href: '/genome-legend', label: 'Symbols', icon: '◊' },
  { href: '/settings', label: 'Settings', icon: '◇' },
];

const BRAND = 'Bóveda';
const BRAND_INITIAL = 'B';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);


  const handleBrandClick = () => {
    router.push('/');
  };

  // Sync collapsed state with body class for main content offset
  useEffect(() => {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [collapsed]);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Brand */}
      <div className={styles.brand}>
        <span
          className={styles.brandText}
          onClick={handleBrandClick}
          style={{ cursor: 'pointer' }}
          title="Click to go home"
        >
          {collapsed ? BRAND_INITIAL : BRAND}
        </span>
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Flat navigation */}
      <nav className={styles.nav}>
        <ul className={styles.groupItems}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  {collapsed ? (
                    <span className={styles.navLabel} style={{ textAlign: 'center', width: '100%' }}>
                      {item.label.charAt(0)}
                    </span>
                  ) : (
                    <span className={styles.navLabel}>{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        {!collapsed && (
          <span className={styles.footerText}>Studio</span>
        )}
      </div>
    </aside>
  );
}
