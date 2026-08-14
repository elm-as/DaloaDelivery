import { useState, useEffect } from 'react';
import { Bell, ArrowLeft, X, BellRing, Info, AlertTriangle, CheckCircle, MoreVertical, Shield, FileText } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { deliveryPersonService } from '../../services/deliveryPersonService';
import { deliveryOrderService } from '../../services/deliveryOrderService';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
}

export function AppBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const isHome = location.pathname === '/';
  const canGoBack = !isHome && window.history.length > 1;

  // Load notifications dynamically when modal opens
  useEffect(() => {
    if (!showNotifs) return;
    let mounted = true;

    const loadNotifications = async () => {
      setLoading(true);
      const notifs: AppNotification[] = [];

      try {
        if (!user) {
          notifs.push({
            id: 'annuaire',
            title: 'Besoin d\'un livreur ?',
            message: 'Consultez notre annuaire pour trouver le livreur parfait.',
            type: 'info',
            link: '/annuaire'
          });
          notifs.push({
            id: 'devenir',
            title: 'Envie de devenir livreur ?',
            message: 'Rejoignez-nous et commencez à générer des revenus.',
            type: 'success',
            link: '/devenir-livreur'
          });
        } else {
          // Check Admin
          const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
          if (userData?.role === 'admin' || userData?.role === 'superadmin') {
            const { data: pendingDocs } = await supabase
              .from('delivery_persons')
              .select('id')
              .or('verification_status.eq.pending,and(verification_status.is.null,cni_url.not.is.null)');
            
            if (pendingDocs && pendingDocs.length > 0) {
              notifs.push({
                id: 'admin-docs',
                title: 'Vérifications en attente',
                message: `${pendingDocs.length} document(s) de livreur en attente de validation.`,
                type: 'warning',
                link: '/admin'
              });
            }
          }

          // Check Driver Profile
          try {
            const profile = await deliveryPersonService.getDeliveryPersonByUserId(user.id);
            if (profile) {
              if (profile.verification_status === 'pending' || (!profile.verification_status && profile.cni_url)) {
                notifs.push({
                  id: 'doc-pending',
                  title: 'Document en cours d\'examen',
                  message: 'Votre CNI est en cours de validation par notre équipe.',
                  type: 'info',
                  link: '/dashboard/profil'
                });
              } else if (profile.verification_status === 'rejected') {
                notifs.push({
                  id: 'doc-rejected',
                  title: 'Document refusé',
                  message: profile.verification_rejection_reason 
                    ? `Refusé : ${profile.verification_rejection_reason}`
                    : 'Votre document n\'a pas été validé. Veuillez en soumettre un nouveau.',
                  type: 'error',
                  link: '/dashboard/profil'
                });
              } else if (profile.verification_status === 'approved') {
                notifs.push({
                  id: 'doc-approved',
                  title: 'Profil Vérifié',
                  message: 'Félicitations, vous êtes un livreur vérifié !',
                  type: 'success',
                  link: '/dashboard/profil'
                });
              }

              if (profile.is_available) {
                const pendingOrders = await deliveryOrderService.getPendingRequests();
                if (pendingOrders.length > 0) {
                  notifs.push({
                    id: 'new-orders',
                    title: 'Nouvelles commandes',
                    message: `Il y a ${pendingOrders.length} commande(s) en attente.`,
                    type: 'success',
                    link: '/dashboard'
                  });
                }
              } else {
                notifs.push({
                  id: 'offline',
                  title: 'Vous êtes hors ligne',
                  message: 'Passez en ligne pour recevoir des courses.',
                  type: 'warning',
                  link: '/dashboard'
                });
              }
            }
          } catch {
            // Not a driver
          }
        }

        if (notifs.length === 0) {
          notifs.push({
            id: 'empty',
            title: 'Aucune notification',
            message: 'Vous êtes à jour.',
            type: 'info'
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setNotifications(notifs);
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [showNotifs, user]);

  const getTitle = () => {
    if (location.pathname === '/dashboard') return 'Tableau de bord';
    if (location.pathname === '/dashboard/commandes') return 'Mes commandes';
    if (location.pathname === '/dashboard/profil') return 'Mon profil';
    if (location.pathname === '/annuaire') return 'Annuaire';
    if (location.pathname === '/login') return 'Connexion';
    if (location.pathname === '/register') return 'Inscription';
    if (location.pathname === '/devenir-livreur') return 'Devenir livreur';
    if (location.pathname.startsWith('/livreur/')) return 'Profil livreur';
    if (location.pathname === '/admin') return 'Administration';
    if (location.pathname === '/terms') return 'Conditions d\'utilisation';
    if (location.pathname === '/privacy') return 'Confidentialité';
    if (location.pathname === '/mentions-legales') return 'Mentions légales';
    return '';
  };

  const title = getTitle();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-gray-100/90 shadow-2xs pt-safe">
        <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          {/* Left side */}
          <div className="flex items-center gap-2.5 min-w-0">
            {canGoBack && !isHome ? (
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-700 active:scale-95 transition-all shadow-2xs flex-shrink-0"
                aria-label="Retour"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}
            
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img
                src="/logo.png"
                alt="DaloaDelivery"
                className="h-8 w-8 object-contain shrink-0"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src.indexOf('sans fond') === -1) {
                    target.src = '/DaloaDelivery sans fond.png';
                  }
                }}
              />
              {isHome || !title ? (
                <span className="text-base font-black tracking-tight">
                  <span className="text-blue-600">Daloa</span><span className="text-orange-500">Delivery</span>
                </span>
              ) : (
                <h1 className="text-sm font-black text-gray-900 truncate">{title}</h1>
              )}
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-black text-gray-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Accueil</Link>
            <Link to="/annuaire" className="hover:text-blue-600 transition-colors">Annuaire livreurs</Link>
            <Link to={user ? "/dashboard" : "/devenir-livreur"} className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 hover:bg-blue-100 transition-all">
              {user ? "Cockpit Livreur" : "Devenir Livreur"}
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setShowLegal(true)}
              className="w-9 h-9 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all shadow-2xs flex-shrink-0"
              title="Informations et statut"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowNotifs(true)}
              className="relative w-9 h-9 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all shadow-2xs flex-shrink-0"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Bottom Sheet */}
      <AnimatePresence>
        {showNotifs && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifs(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[101] max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-grey-100">
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold text-grey-900">Notifications</h3>
                </div>
                <button
                  onClick={() => setShowNotifs(false)}
                  className="w-10 h-10 bg-grey-100 rounded-full flex items-center justify-center text-grey-600 active:scale-95 transition-transform"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-8">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        if (notif.link) {
                          navigate(notif.link);
                          setShowNotifs(false);
                        }
                      }}
                      className={`w-full text-left bg-white rounded-2xl p-4 border flex items-start gap-3 transition-colors ${
                        notif.link ? 'active:bg-grey-50' : 'cursor-default'
                      } ${
                        notif.type === 'error' ? 'border-error/20 bg-error/5' :
                        notif.type === 'warning' ? 'border-warning/20 bg-warning/5' :
                        notif.type === 'success' ? 'border-success/20 bg-success/5' :
                        'border-grey-100'
                      }`}
                    >
                      <div className="mt-0.5">
                        {notif.type === 'error' && <AlertTriangle className="w-5 h-5 text-error" />}
                        {notif.type === 'warning' && <AlertTriangle className="w-5 h-5 text-warning" />}
                        {notif.type === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
                        {notif.type === 'info' && <Info className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold mb-1 ${
                          notif.type === 'error' ? 'text-error-600' :
                          notif.type === 'warning' ? 'text-warning-700' :
                          notif.type === 'success' ? 'text-success-700' :
                          'text-grey-900'
                        }`}>
                          {notif.title}
                        </h4>
                        <p className="text-sm text-grey-600 leading-snug">{notif.message}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Legal Bottom Sheet */}
      <AnimatePresence>
        {showLegal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLegal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[101] max-h-[60vh] flex flex-col shadow-2xl"
            >
              <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-grey-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-grey-900">Informations</h3>
                </div>
                <button
                  onClick={() => setShowLegal(false)}
                  className="w-10 h-10 bg-grey-100 rounded-full flex items-center justify-center text-grey-600 active:scale-95 transition-transform"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-8">
                <Link
                  to="/terms"
                  onClick={() => setShowLegal(false)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-grey-50 active:bg-grey-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-grey-900">Conditions d'utilisation</p>
                    <p className="text-xs text-grey-500">CGU régissant l'utilisation de la plateforme</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-grey-400 rotate-180" />
                </Link>

                <Link
                  to="/privacy"
                  onClick={() => setShowLegal(false)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-grey-50 active:bg-grey-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-grey-900">Politique de confidentialité</p>
                    <p className="text-xs text-grey-500">Comment nous protégeons vos données</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-grey-400 rotate-180" />
                </Link>

                <Link
                  to="/mentions-legales"
                  onClick={() => setShowLegal(false)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-grey-50 active:bg-grey-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-grey-900">Mentions légales</p>
                    <p className="text-xs text-grey-500">Éditeur, hébergement, propriété intellectuelle</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-grey-400 rotate-180" />
                </Link>
              </div>

              {/* Branding */}
              <div className="flex-shrink-0 p-4 border-t border-grey-100 text-center">
                <p className="text-xs text-grey-400">DaloaDelivery © {new Date().getFullYear()}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
