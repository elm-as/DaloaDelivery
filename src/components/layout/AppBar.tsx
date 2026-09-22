import { useState, useEffect } from 'react';
import { Bell, ArrowLeft, MoreVertical, LogOut, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSupabase } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { deliveryPersonService } from '../../services/deliveryPersonService';
import { deliveryOrderService } from '../../services/deliveryOrderService';
import { NotificationsSheet, type AppNotification } from './NotificationsSheet';
import { LegalSheet } from './LegalSheet';

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
            title: "Besoin d'un livreur ?",
            message: 'Consultez notre annuaire pour trouver le livreur parfait.',
            type: 'info',
            link: '/annuaire',
          });
          notifs.push({
            id: 'devenir',
            title: 'Envie de devenir livreur ?',
            message: 'Rejoignez-nous et commencez à générer des revenus.',
            type: 'success',
            link: '/devenir-livreur',
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
                link: '/admin',
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
                  title: "Document en cours d'examen",
                  message: 'Votre CNI est en cours de validation par notre équipe.',
                  type: 'info',
                  link: '/dashboard/profil',
                });
              } else if (profile.verification_status === 'rejected') {
                notifs.push({
                  id: 'doc-rejected',
                  title: 'Document refusé',
                  message: profile.verification_rejection_reason
                    ? `Refusé : ${profile.verification_rejection_reason}`
                    : "Votre document n'a pas été validé. Veuillez en soumettre un nouveau.",
                  type: 'error',
                  link: '/dashboard/profil',
                });
              } else if (profile.verification_status === 'approved') {
                notifs.push({
                  id: 'doc-approved',
                  title: 'Profil Vérifié',
                  message: 'Félicitations, vous êtes un livreur vérifié !',
                  type: 'success',
                  link: '/dashboard/profil',
                });
              }

              // Vérifier les demandes d'affiliation vendeur en attente
              try {
                const { data: affData } = await supabase
                  .from('seller_delivery_affiliations')
                  .select('id, seller:users!seller_delivery_affiliations_seller_id_fkey(shop_name, full_name)')
                  .eq('delivery_person_id', profile.id)
                  .eq('status', 'pending');

                if (affData && affData.length > 0) {
                  const firstSeller =
                    (affData[0] as any)?.seller?.shop_name ||
                    (affData[0] as any)?.seller?.full_name ||
                    'Un vendeur';
                  notifs.unshift({
                    id: 'pending-affiliations',
                    title: "🤝 Demande d'affiliation reçue !",
                    message:
                      affData.length === 1
                        ? `La boutique ${firstSeller} souhaite vous affilier comme livreur dédié.`
                        : `${affData.length} vendeurs souhaitent vous ajouter comme livreur dédié.`,
                    type: 'warning',
                    link: '/affiliations',
                  });
                }
              } catch (e) {
                console.warn('Error checking pending affiliations:', e);
              }

              if (profile.is_available) {
                const pendingOrders = await deliveryOrderService.getPendingRequests();
                if (pendingOrders.length > 0) {
                  notifs.push({
                    id: 'new-orders',
                    title: 'Nouvelles commandes',
                    message: `Il y a ${pendingOrders.length} commande(s) en attente.`,
                    type: 'success',
                    link: '/dashboard',
                  });
                }
              } else {
                notifs.push({
                  id: 'offline',
                  title: 'Vous êtes hors ligne',
                  message: 'Passez en ligne pour recevoir des courses.',
                  type: 'warning',
                  link: '/dashboard',
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
            type: 'info',
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const getTitle = () => {
    if (location.pathname === '/dashboard') return 'Tableau de bord';
    if (location.pathname === '/dashboard/commandes' || location.pathname === '/livraisons') return 'Mes livraisons';
    if (location.pathname === '/dashboard/profil') return 'Mon profil';
    if (location.pathname === '/annuaire') return 'Annuaire';
    if (location.pathname === '/login') return 'Connexion';
    if (location.pathname === '/register') return 'Inscription';
    if (location.pathname === '/devenir-livreur' || location.pathname === '/inscription') return 'Devenir livreur';
    if (location.pathname.startsWith('/livreur/')) return 'Profil livreur';
    if (location.pathname === '/admin') return 'Administration';
    if (location.pathname === '/terms') return "Conditions d'utilisation";
    if (location.pathname === '/privacy') return 'Confidentialité';
    if (location.pathname === '/mentions-legales') return 'Mentions légales';
    return '';
  };

  const title = getTitle();

  return (
    <>
      <header className="bg-white sticky top-0 z-40 border-b border-grey-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          {/* Left side */}
          <div className="flex items-center gap-3 min-w-0">
            {canGoBack && !isHome ? (
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full bg-grey-50 flex items-center justify-center text-grey-600 active:bg-grey-100 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}

            <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary-600 transition-colors">
              <img src="/logo.png" alt="DaloaDelivery" className="w-6 h-6 object-contain" />
              {isHome || !title ? (
                <span className="text-lg font-bold">DaloaDelivery</span>
              ) : (
                <h1 className="text-[15px] font-bold text-grey-900 truncate">{title}</h1>
              )}
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-grey-700">
            <Link to="/" className="hover:text-primary transition-colors">
              Accueil
            </Link>
            <Link to="/annuaire" className="hover:text-primary transition-colors">
              Annuaire livreurs
            </Link>
            <Link to={user ? '/dashboard' : '/devenir-livreur'} className="hover:text-primary transition-colors">
              Espace Livreur
            </Link>
            {user && (
              <Link
                to="/dashboard/profil"
                className="flex items-center gap-1.5 text-xs text-grey-600 hover:text-primary transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Mon profil</span>
              </Link>
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100 active:scale-95 ml-1"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            )}
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifs(true)}
              className="relative w-9 h-9 rounded-full bg-grey-50 flex items-center justify-center text-grey-600 active:bg-grey-100 transition-colors flex-shrink-0"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-white" />
            </button>
            <button
              onClick={() => setShowLegal(true)}
              className="w-9 h-9 rounded-full bg-grey-50 flex items-center justify-center text-grey-600 active:bg-grey-100 transition-colors flex-shrink-0"
              title="Menu & Informations légales"
              aria-label="Menu et informations"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Bottom Sheet */}
      <NotificationsSheet
        isOpen={showNotifs}
        onClose={() => setShowNotifs(false)}
        notifications={notifications}
        loading={loading}
        onNavigate={(link) => navigate(link)}
      />

      {/* Menu & Legal Bottom Sheet */}
      <LegalSheet
        isOpen={showLegal}
        onClose={() => setShowLegal(false)}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}
