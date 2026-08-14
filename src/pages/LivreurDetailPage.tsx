import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star, MapPin, Phone, Bike, Car, Truck,
  CheckCircle, MessageSquare, ChevronDown, User, Shield
} from 'lucide-react';
import { AvisLivreur } from '../components/livreur/AvisLivreur';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { reviewService } from '../services/reviewService';
import { useSupabase } from '../hooks/useSupabase';
import type { DeliveryPerson, Review } from '../types/livreur';
import toast from 'react-hot-toast';

import { useSEO } from '../hooks/useSEO';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

const VEHICLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Moto: Bike,
  Vélo: Bike,
  Voiture: Car,
  Triporteur: Truck,
  motorcycle: Bike,
  car: Car,
};

export default function LivreurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const [livreur, setLivreur] = useState<DeliveryPerson | null>(null);

  const title = livreur ? `${livreur.name} — Livreur ${livreur.vehicle_type} à Daloa` : 'Livreur à Daloa';
  const desc = livreur
    ? `${livreur.name} est livreur en ${livreur.vehicle_type} à Daloa. ⭐ Note: ${(livreur.rating || 5).toFixed(1)}/5. ${livreur.description || ''}`
    : 'Trouvez un livreur de confiance à Daloa sur DaloaDelivery.';

  useSEO(title, {
    description: desc,
    keywords: livreur ? `${livreur.name}, livreur ${livreur.vehicle_type} Daloa, coursier Daloa` : 'livreur Daloa, livraison Côte d\'Ivoire',
    ogImage: livreur?.avatar_url || 'https://delivery.daloamarket.com/og-image.png',
    canonical: `https://delivery.daloamarket.com/livreur/${id || ''}`,
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewPage, setReviewPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [livreurData, reviewsData] = await Promise.all([
          deliveryPersonService.getDeliveryPersonById(id),
          reviewService.getReviews(id, 1, 10),
        ]);
        setLivreur(livreurData);
        setReviews(reviewsData.reviews);
        setTotalReviews(reviewsData.total);
      } catch {
        toast.error('Livreur introuvable');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const loadMoreReviews = async () => {
    if (!id) return;
    const nextPage = reviewPage + 1;
    try {
      const data = await reviewService.getReviews(id, nextPage, 10);
      setReviews((prev) => [...prev, ...data.reviews]);
      setReviewPage(nextPage);
    } catch {
      toast.error('Erreur lors du chargement des avis');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) {
      toast.error('Connectez-vous pour laisser un avis');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const review = await reviewService.addReview(
        id,
        user.id,
        user.email?.split('@')[0] || 'Utilisateur',
        rating,
        comment
      );
      setReviews((prev) => [review, ...prev]);
      setTotalReviews((prev) => prev + 1);
      setShowReviewForm(false);
      setComment('');
      setRating(5);
      toast.success('Avis ajouté avec succès !');

      if (livreur) {
        const updated = await deliveryPersonService.getDeliveryPersonById(id);
        setLivreur(updated);
      }
    } catch {
      toast.error('Erreur lors de l\'ajout de l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!livreur) return null;

  const VehicleIcon = VEHICLE_ICONS[livreur.vehicle_type] || Truck;
  const whatsappNumber = livreur.phone.replace(/[^0-9]/g, '');

  return (
    <div className="pb-28 max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-8 lg:items-start space-y-6 lg:space-y-0">
        {/* LEFT COLUMN: Header Card, Avatar, Stats & Quick Actions */}
        <div className="lg:sticky lg:top-20 space-y-4">
          <div
            className={`p-6 rounded-[2rem] relative overflow-hidden transition-all shadow-xl ${
              livreur.is_available
                ? 'bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white shadow-orange-500/20'
                : 'bg-gradient-to-br from-slate-800 to-gray-900 text-white shadow-slate-900/20'
            }`}
          >
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="flex flex-col items-center text-center relative z-10 space-y-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white p-1 ring-4 ring-white/30 shadow-2xl">
                  {livreur.photo_url ? (
                    <img
                      src={getOptimizedImageUrl(livreur.photo_url, 300, 80)}
                      alt={livreur.name}
                      width={96}
                      height={96}
                      loading="eager"
                      className="w-full h-full object-cover rounded-2xl"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (livreur.photo_url && target.src !== livreur.photo_url) {
                          target.src = livreur.photo_url;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 text-white font-black flex items-center justify-center text-2xl rounded-2xl">
                      {livreur.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md ${
                    livreur.is_available ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-gray-400'
                  }`}
                  title={livreur.is_available ? 'Disponible' : 'Hors ligne'}
                >
                  <span className="w-2 h-2 bg-white rounded-full" />
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h2 className="text-xl font-black tracking-tight text-white">{livreur.name}</h2>
                  {livreur.is_verified && (
                    <CheckCircle className="w-5 h-5 text-emerald-300 fill-emerald-500" />
                  )}
                </div>
                <p className="text-xs font-semibold text-white/85 mt-0.5">
                  {livreur.is_available ? '🟢 En ligne et disponible pour course' : '⚪ Actuellement hors ligne'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-white border border-white/20 flex items-center gap-1.5">
                  <VehicleIcon className="w-3.5 h-3.5" />
                  {livreur.vehicle_type}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-3.5 text-center shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-center gap-0.5 text-lg sm:text-xl font-black text-amber-600">
                {(livreur.rating || 5).toFixed(1)} <Star className="w-4 h-4 fill-amber-400 text-amber-400 -mt-0.5" />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Note</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-3.5 text-center shadow-sm border border-gray-100"
            >
              <p className="text-lg sm:text-xl font-black text-blue-600">{livreur.total_reviews || 0}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Avis</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-3.5 text-center shadow-sm border border-gray-100"
            >
              <p className="text-lg sm:text-xl font-black text-orange-600">{livreur.completed_deliveries || 0}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Courses</p>
            </motion.div>
          </div>

          {/* Desktop Direct Contact CTA */}
          <div className="hidden lg:flex flex-col gap-2 pt-2">
            <a
              href={`https://wa.me/225${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>💬 Contacter sur WhatsApp</span>
            </a>
            <a
              href={`tel:${livreur.phone}`}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Appeler {livreur.phone}</span>
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN: Info, Zones, Security & Reviews */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4">
            {livreur.description && (
              <div>
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Présentation</h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                  « {livreur.description} »
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Zones couvertes</h3>
              <div className="flex flex-wrap gap-1.5">
                {livreur.coverage_zones && livreur.coverage_zones.length > 0 ? (
                  livreur.coverage_zones.map((zone) => (
                    <span
                      key={zone}
                      className="bg-orange-50 text-orange-700 border border-orange-200/60 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3 text-orange-500" />
                      {zone}
                    </span>
                  ))
                ) : (
                  <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border border-gray-100">
                    <MapPin className="w-3 h-3 text-gray-400" /> Tout Daloa
                  </span>
                )}
              </div>
            </div>

            {livreur.pricing_description && (
              <div>
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Tarification indicative</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                  {livreur.pricing_description}
                </p>
              </div>
            )}
          </div>

          {/* Security & Verification Card */}
          {livreur.is_verified ? (
            <div className="bg-emerald-50/80 rounded-3xl p-4 sm:p-5 flex items-center gap-3.5 border border-emerald-200/80 shadow-2xs">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-emerald-800 text-sm">Livreur Certifié DaloaDelivery ✓</h4>
                <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                  Pièce d'identité, véhicule et contact vérifiés par notre équipe.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/80 rounded-3xl p-4 sm:p-5 flex items-center gap-3.5 border border-amber-200/80 shadow-2xs">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-amber-800 text-sm">Profil en cours de vérification</h4>
                <p className="text-xs text-amber-700 mt-0.5 font-medium">
                  Les documents de ce livreur sont en cours de contrôle.
                </p>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                <span>Avis clients ({totalReviews})</span>
              </h3>
              {!showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/60 font-black text-xs active:scale-95 transition-all"
                >
                  + Laisser un avis
                </button>
              )}
            </div>

            {showReviewForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleSubmitReview}
                className="bg-gray-50 rounded-2xl border border-gray-200/80 p-4 space-y-3"
              >
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1.5">Votre note globale</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="active:scale-90 transition-transform"
                      >
                        <Star className={`w-7 h-7 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1.5">Votre commentaire</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Ponctualité, politesse, soin du colis..."
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none text-xs sm:text-sm font-medium resize-none"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl text-xs font-black active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {submitting ? 'Envoi...' : 'Publier mon avis'}
                  </button>
                </div>
              </motion.form>
            )}

            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-bold">Aucun avis pour le moment.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Soyez le premier client à partager votre expérience !</p>
                </div>
              ) : (
                <>
                  {reviews.map((review, idx) => (
                    <AvisLivreur key={review.id} review={review} index={idx} />
                  ))}
                  {reviews.length < totalReviews && (
                    <button
                      onClick={loadMoreReviews}
                      className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span>Voir plus d'avis</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Buttons */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-white/90 backdrop-blur-2xl border-t border-gray-100 shadow-2xl z-40 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] flex items-center gap-2.5 max-w-md mx-auto">
        <a
          href={`https://wa.me/225${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>💬 WhatsApp</span>
        </a>
        <a
          href={`tel:${livreur.phone}`}
          className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Phone className="w-4 h-4" />
          <span>Appeler</span>
        </a>
      </div>
    </div>
  );
}
