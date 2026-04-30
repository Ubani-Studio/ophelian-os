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

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Create',
    items: [
      { href: '/operators', label: 'Operators', icon: 'O' },
      { href: '/names', label: 'Names', icon: 'N' },
      { href: '/imprint', label: 'Imprint', icon: 'I' },
    ],
  },
  {
    title: 'World',
    items: [
      { href: '/universes', label: 'Universes', icon: 'U' },
      { href: '/scenes', label: 'Scenes', icon: 'S' },
      { href: '/globes', label: 'Regions', icon: 'R' },
    ],
  },
  {
    title: 'Story',
    items: [
      { href: '/nexus', label: 'Nexus', icon: 'N' },
      { href: '/story-templates', label: 'Trajectories', icon: 'T' },
      { href: '/genome-legend', label: 'Symbols', icon: '◊' },
    ],
  },
  {
    title: 'Business',
    items: [
      { href: '/marketplace', label: 'Threshold', icon: 'T' },
      { href: '/rights', label: 'Rights', icon: 'R' },
      { href: '/ledger', label: 'Ledger', icon: 'L' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: '◇' },
    ],
  },
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

      {/* Navigation Groups */}
      <nav className={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.title} className={styles.group}>
            {!collapsed && (
              <span className={styles.groupTitle}>{group.title}</span>
            )}
            <ul className={styles.groupItems}>
              {group.items.map((item) => {
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
          </div>
        ))}
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
