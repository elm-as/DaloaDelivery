import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Check, X, Clock, Shield, Phone, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { driverAffiliationService, type DriverAffiliation } from '../services/driverAffiliationService';

export default function AffiliationsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [affiliations, setAffiliations] = useState<DriverAffiliation[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAffiliations = async () => {
    setLoading(true);
    try {
      const data = await driverAffiliationService.getDriverAffiliations();
      setAffiliations(data);
    } catch (err) {
      console.error('Error fetching driver affiliations:', err);
      toast.error('Erreur de chargement des affiliations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliations();
  }, []);

  const handleRespond = async (affiliationId: string, status: 'active' | 'rejected') => {
    setUpdatingId(affiliationId);
    const res = await driverAffiliationService.respondToAffiliation(affiliationId, status);
    setUpdatingId(null);

    if (res.success) {
      toast.success(res.message);
      fetchAffiliations();
    } else {
      toast.error(res.message || 'Erreur lors de la réponse');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const pendingList = affiliations.filter((a) => a.status === 'pending');
  const activeList = affiliations.filter((a) => a.status === 'active');

  return (
    <div className="min-h-screen bg-grey-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b border-grey-100 px-4 py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-grey-900">Mes Vendeurs Affiliés</h1>
            <p className="text-[11px] text-grey-500">Demandes d'affiliation & vendeurs partenaires</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {activeList.length} Partenaire{activeList.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Invitations en attente */}
        {pendingList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-bold text-grey-900">
                Invitations en attente ({pendingList.length})
              </h2>
            </div>

            <div className="space-y-3">
              {pendingList.map((item) => {
                const seller = item.seller;
                const avatarUrl = seller?.avatar_url || (seller as any)?.shop_logo_url;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={seller?.shop_name || seller?.full_name || 'Vendeur'}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          {(seller?.shop_name || seller?.full_name || 'V')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-grey-900 truncate">
                          {seller?.shop_name || seller?.full_name || 'Vendeur Pro'}
                        </h3>
                        <p className="text-xs text-grey-500">
                          Vendeur Pro • {seller?.phone}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-grey-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 leading-relaxed">
                      Ce Vendeur Pro souhaite vous ajouter à son réseau privé de livreurs affiliés. Vous recevrez ses commandes d'espèces à la livraison (COD) en exclusivité.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleRespond(item.id, 'active')}
                        disabled={updatingId === item.id}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-success text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                      >
                        {updatingId === item.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Accepter
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleRespond(item.id, 'rejected')}
                        disabled={updatingId === item.id}
                        className="py-2.5 px-4 rounded-xl bg-grey-100 text-grey-700 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="w-4 h-4" /> Refuser
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Liste des vendeurs affiliés */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-grey-900">
              Mes Vendeurs partenaires ({activeList.length})
            </h2>
          </div>

          {activeList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-grey-100 shadow-sm">
              <Store className="w-12 h-12 text-grey-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-grey-700">Aucune affiliation active</p>
              <p className="text-xs text-grey-500 mt-1 max-w-xs mx-auto">
                Communiquez votre numéro de téléphone aux Vendeurs Pro pour qu'ils vous ajoutent dans leur liste de livreurs affiliés.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeList.map((item) => {
                const seller = item.seller;
                const avatarUrl = seller?.avatar_url || (seller as any)?.shop_logo_url;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-4 border border-grey-100 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={seller?.shop_name || seller?.full_name || 'Vendeur'}
                          className="w-12 h-12 rounded-xl object-cover border border-grey-200 flex-shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
                          {(seller?.shop_name || seller?.full_name || 'V')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-grey-900 text-sm">
                          {seller?.shop_name || seller?.full_name || 'Vendeur Pro'}
                        </h3>
                        <p className="text-xs text-grey-500 mt-0.5">{seller?.phone}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                          ✓ Partenaire affilié
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {seller?.phone && (
                        <>
                          <a
                            href={`tel:${seller.phone}`}
                            className="w-9 h-9 rounded-xl bg-grey-50 flex items-center justify-center text-primary hover:bg-grey-100 transition-colors"
                            title="Appeler le vendeur"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://wa.me/225${seller.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-success hover:bg-green-100 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
