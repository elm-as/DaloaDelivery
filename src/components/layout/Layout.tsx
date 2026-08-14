import { Outlet, useLocation } from 'react-router-dom';
import { AppBar } from './AppBar';
import { BottomNavBar } from './BottomNavBar';
import { InstallPrompt } from '../InstallPrompt';
import { FooterDelivery } from './FooterDelivery';

export function Layout() {
  const location = useLocation();

  // Pages where we hide the bottom nav (auth flows, legal pages, course detail)
  const hideBottomNav =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/devenir-livreur' ||
    location.pathname === '/terms' ||
    location.pathname === '/privacy' ||
    location.pathname === '/mentions-legales' ||
    location.pathname.startsWith('/livreur/') ||
    location.pathname.startsWith('/course/');

  // Pages where we hide the AppBar (like the fullscreen map view)
  const hideAppBar = location.pathname.startsWith('/course/');

  return (
    <div className="flex flex-col min-h-screen bg-grey-50">
      {!hideAppBar && <AppBar />}
      <main className={`flex-1 w-full max-w-6xl mx-auto ${hideBottomNav ? '' : 'pb-20 md:pb-4'}`}>
        <Outlet />
      </main>
      <FooterDelivery />
      {!hideBottomNav && <BottomNavBar />}
      <InstallPrompt />
    </div>
  );
}
