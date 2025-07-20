/**
 * Header Component
 *
 * Lightning Talk Circle navigation header with responsive design
 */

import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import styles from './Header.module.css';
import { Button } from '../Button';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Site title/logo
   */
  title?: string;

  /**
   * Navigation items
   */
  navItems?: Array<{
    label: string;
    href: string;
    active?: boolean;
    external?: boolean;
  }>;

  /**
   * Whether to show login button
   */
  showLogin?: boolean;

  /**
   * Whether to show user menu (when logged in)
   */
  user?: {
    name: string;
    avatar?: string;
  };

  /**
   * Whether to show mobile menu toggle
   */
  showMobileMenu?: boolean;

  /**
   * Header variant
   */
  variant?: 'default' | 'transparent' | 'compact';

  /**
   * Whether header is sticky
   */
  sticky?: boolean;

  /**
   * Custom CSS class
   */
  className?: string;

  /**
   * Callback when login is clicked
   */
  onLogin?: () => void;

  /**
   * Callback when logout is clicked
   */
  onLogout?: () => void;

  /**
   * Callback when user menu is clicked
   */
  onUserMenu?: () => void;

  /**
   * Callback when mobile menu is toggled
   */
  onMobileMenuToggle?: (open: boolean) => void;
}

const Header = forwardRef<HTMLElement, HeaderProps>(
  (
    {
      title = 'Lightning Talk Circle',
      navItems = [],
      showLogin = true,
      user,
      showMobileMenu = true,
      variant = 'default',
      sticky = false,
      className,
      onLogin,
      onLogout,
      onUserMenu,
      onMobileMenuToggle,
      ...props
    },
    ref
  ) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleMobileMenuToggle = () => {
      const newState = !mobileMenuOpen;
      setMobileMenuOpen(newState);
      if (onMobileMenuToggle) {
        onMobileMenuToggle(newState);
      }
    };

    const handleLogin = () => {
      if (onLogin) {
        onLogin();
      }
    };

    const handleLogout = () => {
      if (onLogout) {
        onLogout();
      }
    };

    const handleUserMenu = () => {
      if (onUserMenu) {
        onUserMenu();
      }
    };

    return (
      <header
        ref={ref}
        className={clsx(
          styles.header,
          styles[`header--${variant}`],
          sticky && styles['header--sticky'],
          mobileMenuOpen && styles['header--mobile-open'],
          className
        )}
        {...props}
      >
        <div className={styles.container}>
          {/* Logo/Title */}
          <div className={styles.brand}>
            <a href="/" className={styles.brandLink}>
              <span className={styles.logo}>⚡</span>
              <span className={styles.title}>{title}</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Main navigation">
            <ul className={styles.navList}>
              {navItems.map((item, index) => (
                <li key={index} className={styles.navItem}>
                  <a
                    href={item.href}
                    className={clsx(styles.navLink, item.active && styles['navLink--active'])}
                    {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Actions */}
          <div className={styles.actions}>
            {user ? (
              <div className={styles.userMenu}>
                <button
                  className={styles.userButton}
                  onClick={handleUserMenu}
                  aria-label="User menu"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={styles.userName}>{user.name}</span>
                </button>
                <div className={styles.userDropdown}>
                  <button className={styles.dropdownItem} onClick={handleLogout}>
                    ログアウト
                  </button>
                </div>
              </div>
            ) : (
              showLogin && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLogin}
                  {...(styles.loginButton && { className: styles.loginButton })}
                >
                  ログイン
                </Button>
              )
            )}

            {/* Mobile Menu Button */}
            {showMobileMenu && (
              <button
                className={styles.mobileMenuButton}
                onClick={handleMobileMenuToggle}
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className={styles.hamburger}>
                  <span className={styles.hamburgerLine} />
                  <span className={styles.hamburgerLine} />
                  <span className={styles.hamburgerLine} />
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <nav
            className={clsx(styles.mobileNav, mobileMenuOpen && styles['mobileNav--open'])}
            aria-label="Mobile navigation"
          >
            <ul className={styles.mobileNavList}>
              {navItems.map((item, index) => (
                <li key={index} className={styles.mobileNavItem}>
                  <a
                    href={item.href}
                    className={clsx(
                      styles.mobileNavLink,
                      item.active && styles['mobileNavLink--active']
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                    {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
                  >
                    {item.label}
                  </a>
                </li>
              ))}

              {/* Mobile User Actions */}
              {user ? (
                <li className={styles.mobileNavItem}>
                  <button className={styles.mobileNavLink} onClick={handleLogout}>
                    ログアウト
                  </button>
                </li>
              ) : (
                showLogin && (
                  <li className={styles.mobileNavItem}>
                    <Button variant="primary" size="sm" onClick={handleLogin} fullWidth>
                      ログイン
                    </Button>
                  </li>
                )
              )}
            </ul>
          </nav>
        )}
      </header>
    );
  }
);

Header.displayName = 'Header';

export { Header };
