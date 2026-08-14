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
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-4 sticky top-14 z-30 shadow-2xs">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-gray-900">Boutiques DaloaMarket Affiliées</h1>
            <p className="text-xs text-gray-400 font-medium">Invitations de vendeurs & partenaires exclusifs</p>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 shadow-2xs">
            {activeList.length} Partenaire{activeList.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Invitations en attente */}
        {pendingList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black text-gray-900">
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
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-200/80 shadow-md shadow-amber-500/5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={seller?.shop_name || seller?.full_name || 'Vendeur'}
                          className="w-13 h-13 rounded-2xl object-cover border border-amber-200 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-2xs">
                          {(seller?.shop_name || seller?.full_name || 'V')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-sm sm:text-base text-gray-900 truncate">
                            {seller?.shop_name || seller?.full_name || 'Vendeur Pro'}
                          </h3>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                            ★ PRO
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                          {seller?.phone}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-amber-900 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/60 leading-relaxed font-medium">
                      Ce Vendeur Pro souhaite vous ajouter à sa flotte privée. Vous recevrez ses courses e-commerce et paiements à la livraison en direct.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleRespond(item.id, 'active')}
                        disabled={updatingId === item.id}
                        className="flex-1 h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
                      >
                        {updatingId === item.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Accepter l'affiliation</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleRespond(item.id, 'rejected')}
                        disabled={updatingId === item.id}
                        className="h-10 px-4 rounded-2xl bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <X className="w-4 h-4" />
                        <span>Refuser</span>
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
            <Shield className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-black text-gray-900">
              Mes Boutiques Partenaires ({activeList.length})
            </h2>
          </div>

          {activeList.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm space-y-2">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-gray-900">Aucune boutique affiliée</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Transmettez votre numéro de téléphone aux vendeurs DaloaMarket pour qu'ils vous invitent directement depuis leur profil boutique.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeList.map((item) => {
                const seller = item.seller;
                const avatarUrl = seller?.avatar_url || (seller as any)?.shop_logo_url;
                const phoneClean = (seller?.phone || '').replace(/\D/g, '');
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={seller?.shop_name || seller?.full_name || 'Vendeur'}
                          className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white font-black flex items-center justify-center text-base shrink-0 shadow-2xs">
                          {(seller?.shop_name || seller?.full_name || 'V')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-gray-900 text-sm truncate">
                          {seller?.shop_name || seller?.full_name || 'Boutique Partenaire'}
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">{seller?.phone}</p>
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          ✓ Partenaire affilié
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {seller?.phone && (
                        <>
                          <a
                            href={`tel:${seller.phone}`}
                            className="w-9 h-9 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-blue-600 active:scale-95 transition-all shadow-2xs"
                            title="Appeler"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://wa.me/225${phoneClean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-2xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 active:scale-95 transition-all border border-emerald-200/60 shadow-2xs"
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
