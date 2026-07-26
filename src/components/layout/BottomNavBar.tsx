import { Link, useLocation } from 'react-router-dom';
import { Home, Package, User, Search, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSupabase } from '../../hooks/useSupabase';

export function BottomNavBar() {
  const location = useLocation();
  const { user } = useSupabase();
  const pathname = location.pathname;

  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/livraisons');

  // Different nav items depending on context
  const dashboardNav = [
    { label: 'Accueil', path: '/dashboard', icon: Home, exact: true },
    { label: 'Livraisons', path: '/livraisons', icon: Package },
    { label: 'Profil', path: '/dashboard/profil', icon: User },
  ];

  const publicNav = [
    { label: 'Accueil', path: '/', icon: Home, exact: true },
    { label: 'Annuaire', path: '/annuaire', icon: Search },
    { label: 'Livreur', path: user ? '/dashboard' : '/devenir-livreur', icon: Truck },
  ];

  const navItems = isDashboard ? dashboardNav : publicNav;

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.path;
    return pathname.startsWith(item.path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-grey-200/50" />
      <nav className="relative flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
                active ? 'text-primary' : 'text-grey-400'
              }`}
            >
              <div className="relative">
                {active && (
                  <motion.div
                    layoutId="bottom-nav-bg"
                    className="absolute -inset-2 bg-primary-50 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 transition-transform ${active ? 'scale-110' : ''}`} />
              </div>
              <span className={`text-[10px] font-semibold mt-0.5 ${active ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
