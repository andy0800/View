import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Wallet,
  User,
  Menu,
  X,
  LogOut,
  Play,
  Globe,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import CreditBar from './CreditBar';
import LanguageSwitcher from './LanguageSwitcher';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';

/* ──────────────────────────── Animation variants ──────────────────────────── */
const sidebarSpring = { type: 'spring', stiffness: 300, damping: 30 };

const navItemVariants = {
  rest: { x: 0, scale: 1 },
  hover: { x: 4, scale: 1.01, transition: { duration: 0.15 } },
  tap: { scale: 0.97 }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const staggerItem = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 }
};

/* ──────────────────────────── Nav Item ──────────────────────────── */
function SidebarNavItem({ to, icon: Icon, label, description, isRTL, onClick }) {
  return (
    <motion.div variants={staggerItem}>
      <NavLink
        to={to}
        end={to === '/viewer'}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200',
            'hover:bg-white/[0.08]',
            isActive
              ? 'bg-gradient-to-r from-blue-600/25 to-blue-400/10 ring-1 ring-blue-400/30 shadow-[0_0_24px_rgba(59,130,246,0.15)]'
              : 'bg-white/[0.03]'
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Active indicator bar */}
            {isActive && (
              <motion.span
                layoutId="nav-indicator"
                className={cn(
                  'absolute top-2 bottom-2 w-1 rounded-full bg-blue-500',
                  isRTL ? 'right-0' : 'left-0'
                )}
                transition={sidebarSpring}
              />
            )}

            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                isActive
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 text-white/80 group-hover:bg-white/15 group-hover:text-white'
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold leading-tight text-white truncate">
                {label}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-white/50 truncate">
                {description}
              </p>
            </div>

            <ChevronRight
              className={cn(
                'h-4 w-4 text-white/20 transition-all duration-200 group-hover:text-white/50',
                isActive && 'text-blue-400',
                isRTL && 'rotate-180'
              )}
            />
          </>
        )}
      </NavLink>
    </motion.div>
  );
}

/* ──────────────────────────── Sidebar Content ──────────────────────────── */
function SidebarContent({ navItems, user, isRTL, t, onLogout, onNavClick }) {
  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        'relative flex h-full w-[280px] flex-col overflow-hidden',
        'bg-gradient-to-b from-[#0c1524] via-[#0f1a2e] to-[#080d18]',
        'text-white font-sans',
        isRTL && 'font-arabic'
      )}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.18),_transparent_60%)]" />

      {/* ── Brand header ── */}
      <div className="relative px-5 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30"
          >
            <Play className="h-5 w-5 text-white" fill="white" />
          </motion.div>
          <div>
            <h2 className="text-[17px] font-bold tracking-tight">{t('viewer.view')}</h2>
            <p className="text-[11px] font-medium text-white/50">{t('viewer.viewerDashboard')}</p>
          </div>
        </div>
      </div>

      {/* ── Earn badge ── */}
      <div className="relative px-5 pb-4">
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3.5 py-2.5 ring-1 ring-amber-400/20"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-300">
            {t('viewer.earnCredits')}
          </span>
        </motion.div>
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* ── Navigation ── */}
      <motion.nav
        className="relative flex-1 space-y-1.5 overflow-y-auto px-3 py-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.to}
            {...item}
            isRTL={isRTL}
            onClick={onNavClick}
          />
        ))}
      </motion.nav>

      <Separator className="bg-white/[0.06]" />

      {/* ── Footer: user + lang + logout ── */}
      <div className="relative px-4 pb-5 pt-4 space-y-4">
        {/* User card */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20">
            {user?.name?.charAt(0)?.toUpperCase() || 'V'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name || t('viewer.viewer')}</p>
            <p className="text-[11px] text-white/40">{t('profile.viewerAccount')}</p>
          </div>
        </div>

        {/* Language switcher */}
        <div className="flex items-center justify-center">
          <LanguageSwitcher variant="button" />
        </div>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5',
            'text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.06] hover:text-white',
            isRTL && 'flex-row-reverse'
          )}
        >
          <LogOut className="h-4 w-4" />
          {t('common.logout')}
        </motion.button>
      </div>
    </div>
  );
}

/* ──────────────────────────── Main Layout ──────────────────────────── */
export default function ViewerLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const navItems = [
    { to: '/viewer', label: t('navigation.home'), description: t('viewer.browseSections'), icon: Home },
    { to: '/credits', label: t('navigation.credits'), description: t('viewer.earnCredits'), icon: Wallet },
    { to: '/profile', label: t('navigation.profile'), description: t('profile.subtitle'), icon: User }
  ];

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={cn('flex min-h-screen bg-transparent', isRTL && 'font-arabic')}>

      {/* ═══════════ Desktop sidebar ═══════════ */}
      <aside
        className={cn(
          'hidden md:fixed md:inset-y-0 md:z-40 md:flex',
          isRTL ? 'right-0' : 'left-0'
        )}
      >
        <SidebarContent
          navItems={navItems}
          user={user}
          isRTL={isRTL}
          t={t}
          onLogout={handleLogout}
          onNavClick={() => {}}
        />
      </aside>

      {/* ═══════════ Mobile overlay + drawer ═══════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              className={cn('fixed inset-y-0 z-50 md:hidden', isRTL ? 'right-0' : 'left-0')}
              initial={{ x: isRTL ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? 300 : -300 }}
              transition={sidebarSpring}
            >
              <SidebarContent
                navItems={navItems}
                user={user}
                isRTL={isRTL}
                t={t}
                onLogout={handleLogout}
                onNavClick={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════ Main column ═══════════ */}
      <div className={cn('flex min-h-screen flex-1 flex-col', isRTL ? 'md:mr-[280px]' : 'md:ml-[280px]')}>

        {/* ── Sticky header bar (hidden) ──
        <motion.header
          className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 px-4 py-3 md:px-6">

            Mobile hamburger
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-slate-700" />
            </motion.button>

            Brand mark (small)
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <Play className="h-3.5 w-3.5" fill="white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{t('viewer.viewerDashboard')}</p>
              </div>
            </div>

            Spacer
            <div className="flex-1" />

            Desktop earn badge
            <div className="hidden lg:flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                <Sparkles className="h-3.5 w-3.5" />
                {t('viewer.earnCredits')}
              </span>
            </div>

            Credit bar
            <CreditBar />

            Language
            <LanguageSwitcher variant="icon" />

            User avatar
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/20 cursor-default"
              title={user?.name || ''}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'V'}
            </motion.div>
          </div>
        </motion.header>
        */}

        {/* ── Mobile hamburger (floating) ── */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className={cn(
            'fixed top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl',
            'bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-lg md:hidden',
            isRTL ? 'right-4' : 'left-4'
          )}
        >
          <Menu className="h-5 w-5 text-white" />
        </motion.button>

        {/* ── Page content ── */}
        <main className="flex-1 px-4 pt-20 pb-5 md:px-6 md:pt-6 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
