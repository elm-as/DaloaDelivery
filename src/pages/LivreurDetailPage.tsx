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
    <div className="pb-28 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto lg:px-4 lg:pt-6">
        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
          {/* LEFT COLUMN: Profile Hero & Stats */}
          <div className="space-y-4">
            {/* Header Hero Card */}
            <div className={`px-4 pt-8 pb-12 rounded-b-[36px] lg:rounded-3xl relative overflow-hidden text-white shadow-sm transition-colors ${
              livreur.is_available 
                ? 'bg-gradient-to-br from-primary via-primary-600 to-primary-700' 
                : 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900'
            }`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-xl pointer-events-none" />
              
              <div className="flex flex-col items-center text-center relative z-10">
                {/* Avatar */}
                <div className="relative mb-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 p-1 ring-4 ring-white/30 shadow-xl backdrop-blur-sm">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {livreur.photo_url ? (
                        <img 
                          src={getOptimizedImageUrl(livreur.photo_url, 300, 80)} 
                          alt={livreur.name} 
                          width={96}
                          height={96}
                          loading="eager"
                          {...({ fetchpriority: 'high' } as any)}
                          decoding="async"
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (livreur.photo_url && target.src !== livreur.photo_url) {
                              target.src = livreur.photo_url;
                            }
                          }}
                        />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className={`absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md ${
                    livreur.is_available ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 justify-center">
                  <h1 className="text-xl font-black text-white">{livreur.name}</h1>
                  {livreur.is_verified && (
                    <CheckCircle className="w-5 h-5 text-blue-300 fill-blue-500 text-white flex-shrink-0" />
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-white/90">
                  <span className={`w-2 h-2 rounded-full ${livreur.is_available ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`} />
                  <span>{livreur.is_available ? 'Disponible pour vos courses' : 'Actuellement indisponible'}</span>
                </div>
                
                <div className="flex items-center gap-1.5 mt-3">
                  <div className="bg-black/20 px-3 py-1 rounded-xl flex items-center gap-1.5 backdrop-blur-md">
                    <VehicleIcon className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{livreur.vehicle_type}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Stats Strip */}
            <div className="px-4 -mt-8 relative z-20">
              <div className="grid grid-cols-3 gap-2.5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-center gap-0.5 text-xl font-black text-amber-600">
                    <span>{livreur.rating.toFixed(1)}</span>
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Note</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <p className="text-xl font-black text-indigo-600 leading-tight">{livreur.total_reviews}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Avis</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <p className="text-xl font-black text-primary leading-tight">{livreur.completed_deliveries || 0}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Courses</p>
                </motion.div>
              </div>
            </div>

            {/* Desktop Contact Buttons */}
            <div className="hidden lg:flex flex-col gap-2 px-4 pt-2">
              {whatsappNumber && (
                <a
                  href={`https://wa.me/225${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  Discuter sur WhatsApp
                </a>
              )}
              <a
                href={`tel:${livreur.phone}`}
                className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4" />
                Appeler {livreur.phone}
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: Bio, Zones, Security & Reviews */}
          <div className="px-4 lg:px-0 space-y-4">
            {/* Info Box */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
              {livreur.description && (
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">À propos</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">{livreur.description}</p>
                </div>
              )}

              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">Quartiers couverts à Daloa</h3>
                <div className="flex flex-wrap gap-1.5">
                  {livreur.coverage_zones && livreur.coverage_zones.length > 0 ? (
                    livreur.coverage_zones.map((zone) => (
                      <span key={zone} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border border-primary-100/50">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span>{zone}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 font-medium">Toutes les zones de Daloa</span>
                  )}
                </div>
              </div>

              {livreur.pricing_description && (
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">Tarifs & Informations</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">{livreur.pricing_description}</p>
                </div>
              )}
            </div>

            {/* Security Verification Badge */}
            {livreur.is_verified ? (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-4 flex items-center gap-3.5 border border-emerald-200/60 shadow-sm">
                <div className="w-11 h-11 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-emerald-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-emerald-900 text-xs sm:text-sm">Livreur vérifié ✓</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">Identité et conformité contrôlées par DaloaDelivery</p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-3xl p-4 flex items-center gap-3.5 border border-amber-200/60">
                <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-amber-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-amber-900 text-xs sm:text-sm">Profil standard</h4>
                  <p className="text-[11px] text-amber-700 mt-0.5 font-medium">En attente de certification officielle</p>
                </div>
              </div>
            )}

            {/* Customer Reviews Section */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Avis clients ({totalReviews})</span>
                </h3>
                {!showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="text-xs font-black text-primary hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    + Donner mon avis
                  </button>
                )}
              </div>

              {showReviewForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleSubmitReview}
                  className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-3"
                >
                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">Note globale</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 active:scale-90 transition-transform"
                        >
                          <Star className={`w-7 h-7 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">Votre commentaire</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder="Ponctualité, courtoisie, état du colis..."
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-xs font-medium resize-none"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1 py-2.5 bg-white text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition-all border border-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] py-2.5 bg-primary hover:bg-primary-600 text-white rounded-xl text-xs font-black active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {submitting ? 'Envoi...' : 'Publier mon avis'}
                    </button>
                  </div>
                </motion.form>
              )}

              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-gray-200 rounded-2xl">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">Aucun avis pour le moment. Soyez le premier à noter ce coursier !</p>
                  </div>
                ) : (
                  <>
                    {reviews.map((review, idx) => (
                      <AvisLivreur key={review.id} review={review} index={idx} />
                    ))}
                    {reviews.length < totalReviews && (
                      <button
                        onClick={loadMoreReviews}
                        className="w-full py-2.5 mt-2 bg-gray-100 hover:bg-gray-200/70 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <span>Afficher plus d'avis</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar (Mobile only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center gap-2 shadow-2xl">
        {whatsappNumber && (
          <a
            href={`https://wa.me/225${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
        )}
        <a
          href={`tel:${livreur.phone}`}
          className="flex-1 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Phone className="w-4 h-4 text-emerald-400" />
          <span>Appeler</span>
        </a>
      </div>
    </div>
  );
}
