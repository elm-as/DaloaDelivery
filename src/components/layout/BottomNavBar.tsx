import { Link, useLocation } from 'react-router-dom';
import { Home, Package, User, Search, Bike, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSupabase } from '../../hooks/useSupabase';

export function BottomNavBar() {
  const location = useLocation();
  const { user } = useSupabase();
  const pathname = location.pathname;

  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/livraisons') || pathname.startsWith('/affiliations');

  // Navigation contextuelle : Livreur connecté vs Visiteur
  const dashboardNav = [
    { label: 'Cockpit', path: '/dashboard', icon: Home, exact: true },
    { label: 'Missions', path: '/livraisons', icon: Package },
    { label: 'Affiliations', path: '/affiliations', icon: Store },
    { label: 'Profil', path: '/dashboard/profil', icon: User },
  ];

  const publicNav = [
    { label: 'Accueil', path: '/', icon: Home, exact: true },
    { label: 'Annuaire', path: '/annuaire', icon: Search },
    { label: 'Livreur', path: user ? '/dashboard' : '/devenir-livreur', icon: Bike },
  ];

  const navItems = isDashboard ? dashboardNav : publicNav;

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.path;
    return pathname.startsWith(item.path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphism modern dock */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-2xl border-t border-gray-100/90 shadow-2xl shadow-gray-900/10" />
      <nav className="relative flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)] px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors active:scale-95 ${
                active ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                {active && (
                  <motion.div
                    layoutId="delivery-bottom-nav-bg"
                    className="absolute -inset-2 bg-orange-50 rounded-2xl border border-orange-200/50"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 transition-transform ${active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className={`text-[10px] font-black mt-0.5 relative z-10 ${active ? 'text-orange-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
