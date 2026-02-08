import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wallet, User, Menu, LogOut, PlayCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import CreditBar from './CreditBar';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';

export default function ViewerLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const navItems = [
    {
      to: '/viewer',
      label: t('navigation.home'),
      description: t('viewer.browseSections'),
      icon: Home
    },
    {
      to: '/credits',
      label: t('navigation.credits'),
      description: t('viewer.earnCredits'),
      icon: Wallet
    },
    {
      to: '/profile',
      label: t('navigation.profile'),
      description: t('profile.subtitle'),
      icon: User
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const drawerContent = (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative flex h-full w-72 flex-col overflow-hidden bg-slate-950 text-white md:w-80"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(25,118,210,0.35),_transparent_55%)]" />
      <div className="relative flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-200">
          <PlayCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold">{t('viewer.view')}</p>
          <p className="text-sm text-white/70">{t('viewer.viewerDashboard')}</p>
        </div>
      </div>

      <div className="relative px-4">
        <Badge className="bg-amber-400/20 text-amber-200 border-amber-300/40">
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          {t('viewer.earnCredits')}
        </Badge>
      </div>

      <div className="relative mt-5 flex-1 space-y-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all",
                  "bg-white/5 hover:bg-white/10",
                  isActive && "bg-blue-500/20 ring-1 ring-blue-300/40"
                )
              }
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-white/70">{item.description}</p>
              </div>
            </NavLink>
          );
        })}
      </div>

      <div className="relative px-4 pb-6 pt-4">
        <Separator className="mb-4 bg-white/10" />
        <div className="mb-4 flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-blue-600 text-white">
            <AvatarFallback className="bg-blue-600 text-white">
              {user?.name?.charAt(0) || 'V'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{user?.name || t('viewer.viewer')}</p>
            <p className="text-xs text-white/60">{t('profile.viewerAccount')}</p>
          </div>
        </div>
        <div className="mb-4 flex items-center justify-center">
          <LanguageSwitcher variant="button" />
        </div>
        <Button
          variant="outline"
          className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
          onClick={handleLogout}
        >
          <span className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <LogOut className="h-4 w-4" />
            {t('common.logout')}
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-80">
        {drawerContent}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className={cn(
                "fixed inset-y-0 z-50 w-72 md:hidden",
                isRTL ? "right-0" : "left-0"
              )}
              initial={{ x: isRTL ? 320 : -320 }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? 320 : -320 }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
            >
              {drawerContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={cn("flex min-h-screen flex-col", isRTL ? "md:mr-80" : "md:ml-80")}>
        <motion.header
          className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur"
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 md:px-8">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <PlayCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-base font-semibold">{t('viewer.viewerDashboard')}</p>
                <p className="text-xs text-slate-500">{t('viewer.browseSections')}</p>
              </div>
            </div>

            <div className="flex-1" />

            <div className="hidden items-center gap-3 lg:flex">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {t('viewer.earnCredits')}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <CreditBar />
              <LanguageSwitcher variant="icon" />
              <Avatar className="h-9 w-9 bg-blue-600 text-white">
                <AvatarFallback className="bg-blue-600 text-white">
                  {user?.name?.charAt(0) || 'V'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </motion.header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}