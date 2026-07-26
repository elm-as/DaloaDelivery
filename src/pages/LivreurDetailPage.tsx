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
    ogImage: livreur?.avatar_url || 'https://daloa-delivery.shop/og-image.png',
    canonical: `https://daloa-delivery.shop/livreur/${id || ''}`,
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
    <div className="pb-24">
      {/* Profile Header (Similar to DashboardProfil but with background color indicating availability) */}
      <div className={`px-4 pt-6 pb-16 relative overflow-hidden transition-colors ${livreur.is_available ? 'bg-primary' : 'bg-grey-600'}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white flex items-center justify-center border-2 border-white/30 shadow-lg">
              {livreur.photo_url ? (
                <img src={livreur.photo_url} alt={livreur.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-grey-300" />
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${livreur.is_available ? 'bg-success' : 'bg-grey-400'}`}>
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white truncate">{livreur.name}</h2>
              {livreur.is_verified && <CheckCircle className="w-4 h-4 text-white fill-white/20" />}
            </div>
            <p className="text-white/80 text-sm mt-0.5">{livreur.is_available ? 'En ligne et prêt' : 'Actuellement indisponible'}</p>
            
            <div className="flex items-center gap-1.5 mt-2">
              <div className="bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                <VehicleIcon className="w-3 h-3 text-white" />
                <span className="text-xs font-semibold text-white">{livreur.vehicle_type}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - overlapping the gradient */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-grey-100"
          >
            <div className="flex items-center justify-center gap-1 text-2xl font-black text-warning-600">
              {livreur.rating.toFixed(1)} <Star className="w-4 h-4 fill-warning-600 -mt-1" />
            </div>
            <p className="text-[11px] text-grey-500 font-medium mt-1">Note</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-grey-100"
          >
            <p className="text-2xl font-black text-secondary">{livreur.total_reviews}</p>
            <p className="text-[11px] text-grey-500 font-medium mt-1">Avis</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-grey-100"
          >
            <p className="text-2xl font-black text-success">{livreur.coverage_zones.length}</p>
            <p className="text-[11px] text-grey-500 font-medium mt-1">Zones</p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Info Box */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-grey-100 space-y-4">
          {livreur.description && (
            <div>
              <h3 className="text-sm font-bold text-grey-900 mb-2">À propos</h3>
              <p className="text-sm text-grey-600 leading-relaxed">{livreur.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-grey-900 mb-2">Zones couvertes</h3>
            <div className="flex flex-wrap gap-2">
              {livreur.coverage_zones.map((zone) => (
                <span key={zone} className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {zone}
                </span>
              ))}
            </div>
          </div>

          {livreur.pricing_description && (
            <div>
              <h3 className="text-sm font-bold text-grey-900 mb-2">Tarifs & Informations</h3>
              <p className="text-sm text-grey-600 leading-relaxed">{livreur.pricing_description}</p>
            </div>
          )}
        </div>

        {/* Security Badge */}
        {livreur.is_verified ? (
          <div className="bg-success-50 rounded-2xl p-4 flex items-center gap-4 border border-success-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div>
              <h4 className="font-bold text-success-700 text-sm">Livreur vérifié ✓</h4>
              <p className="text-xs text-success-600 mt-0.5">Identité et documents contrôlés par DaloaDelivery</p>
            </div>
          </div>
        ) : (
          <div className="bg-warning-50 rounded-2xl p-4 flex items-center gap-4 border border-warning-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-warning-500" />
            </div>
            <div>
              <h4 className="font-bold text-warning-700 text-sm">Non vérifié</h4>
              <p className="text-xs text-warning-600 mt-0.5">Ce livreur n'a pas encore été vérifié par DaloaDelivery</p>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-grey-900 text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Avis clients
            </h3>
            {!showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="text-primary font-bold text-sm"
              >
                Laisser un avis
              </button>
            )}
          </div>

          {showReviewForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleSubmitReview}
              className="bg-white rounded-2xl shadow-sm border border-grey-100 p-4 mb-4"
            >
              <div className="mb-4">
                <label className="block text-sm font-bold text-grey-900 mb-2">Votre note</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="active:scale-90 transition-transform"
                    >
                      <Star className={`w-8 h-8 ${star <= rating ? 'fill-warning text-warning' : 'text-grey-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-grey-900 mb-2">Commentaire</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Comment s'est passée la livraison ?"
                  className="w-full px-3 py-3 bg-grey-50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm resize-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 py-3 bg-grey-100 text-grey-700 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-3 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Publier mon avis'}
                </button>
              </div>
            </motion.form>
          )}

          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-grey-100">
                <MessageSquare className="w-8 h-8 text-grey-300 mx-auto mb-2" />
                <p className="text-sm text-grey-500 font-medium">Soyez le premier à donner votre avis !</p>
              </div>
            ) : (
              <>
                {reviews.map((review, idx) => (
                  <AvisLivreur key={review.id} review={review} index={idx} />
                ))}
                {reviews.length < totalReviews && (
                  <button
                    onClick={loadMoreReviews}
                    className="w-full py-3 mt-2 bg-primary-50 text-primary rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    Voir plus d'avis <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-grey-100 z-40 pb-[env(safe-area-inset-bottom,1rem)] flex gap-3">
        <a
          href={`https://wa.me/225${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3.5 bg-[#25D366] text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png" alt="WhatsApp" className="w-6 h-6 brightness-0 invert" />
          WhatsApp
        </a>
        <a
          href={`tel:${livreur.phone}`}
          className="w-14 h-14 bg-primary text-white rounded-2xl shadow-md flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
        >
          <Phone className="w-6 h-6" />
        </a>
      </div>
    </div>
  );
}
