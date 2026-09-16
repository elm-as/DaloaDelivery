import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star, ChevronDown, ShieldCheck, Info } from 'lucide-react';
import { AvisLivreur } from './AvisLivreur';
import { reviewService, type ReviewEligibility } from '../../services/reviewService';
import { useSupabase } from '../../hooks/useSupabase';
import type { Review } from '../../types/livreur';
import toast from 'react-hot-toast';

interface LivreurReviewsSectionProps {
  livreurId: string;
  onReviewAdded?: () => void;
}

export function LivreurReviewsSection({ livreurId, onReviewAdded }: LivreurReviewsSectionProps) {
  const { user } = useSupabase();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Éligibilité vérifiée
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Formulaire d'avis
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReviewsAndEligibility() {
      setLoading(true);
      try {
        const reviewsData = await reviewService.getReviews(livreurId, 1, 10);
        if (!isMounted) return;
        setReviews(reviewsData.reviews);
        setTotalReviews(reviewsData.total);
      } catch {
        if (isMounted) toast.error('Erreur lors du chargement des avis');
      } finally {
        if (isMounted) setLoading(false);
      }

      if (user) {
        setCheckingEligibility(true);
        try {
          const res = await reviewService.canReviewDriver(livreurId, user.id);
          if (isMounted) setEligibility(res);
        } catch {
          if (isMounted) setEligibility({ canReview: false });
        } finally {
          if (isMounted) setCheckingEligibility(false);
        }
      } else {
        if (isMounted) {
          setEligibility({ canReview: false, reason: 'not_authenticated' });
        }
      }
    }

    loadReviewsAndEligibility();

    return () => {
      isMounted = false;
    };
  }, [livreurId, user]);

  const loadMoreReviews = async () => {
    const nextPage = reviewPage + 1;
    try {
      const data = await reviewService.getReviews(livreurId, nextPage, 10);
      setReviews((prev) => [...prev, ...data.reviews]);
      setReviewPage(nextPage);
    } catch {
      toast.error('Erreur lors du chargement des avis');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Connectez-vous pour laisser un avis');
      return;
    }

    setSubmitting(true);
    try {
      const review = await reviewService.addReview(
        livreurId,
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
      setEligibility({ canReview: false, reason: 'already_reviewed' });
      toast.success('Avis vérifié publié avec succès !');

      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'ajout de l'avis");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>Avis clients</span>
            <span className="text-gray-500 font-semibold tabular-nums">({totalReviews})</span>
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700 flex-shrink-0" />
            <span>Évaluations 100 % authentiques et vérifiées</span>
          </p>
        </div>

        {eligibility?.canReview && !showReviewForm && (
          <button
            type="button"
            onClick={() => setShowReviewForm(true)}
            className="text-xs font-black text-primary hover:text-primary-700 bg-primary-50 hover:bg-primary-100/70 px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Laisser un avis vérifié</span>
          </button>
        )}
      </div>

      {/* Trust Notice if user is not eligible to review */}
      {!eligibility?.canReview && !loading && !checkingEligibility && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-slate-700 text-xs">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {eligibility?.reason === 'already_reviewed' ? (
              <p className="font-medium text-slate-800">
                Vous avez déjà évalué ce coursier. Merci pour votre retour !
              </p>
            ) : eligibility?.reason === 'own_profile' ? (
              <p className="font-medium text-slate-800">
                Ceci est votre profil de livreur.
              </p>
            ) : (
              <p className="text-slate-600 leading-relaxed font-normal">
                Afin de garantir l'authenticité des notes, <strong>seuls les clients et commerçants ayant réalisé une commande livrée</strong> par ce coursier sont autorisés à déposer un avis.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmitReview}
          className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-3"
        >
          <div>
            <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
              Note de la prestation
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 active:scale-90 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-gray-700 ml-2 tabular-nums">
                {rating} / 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
              Votre retour d'expérience
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Ponctualité, respect du colis, courtoisie..."
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
              {submitting ? 'Envoi...' : 'Publier mon avis vérifié'}
            </button>
          </div>
        </motion.form>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-gray-200 rounded-2xl">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">
              Aucun avis pour le moment.
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Les avis apparaîtront dès la première livraison terminée et validée.
            </p>
          </div>
        ) : (
          <>
            {reviews.map((review, idx) => (
              <AvisLivreur key={review.id} review={review} index={idx} />
            ))}
            {reviews.length < totalReviews && (
              <button
                type="button"
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
  );
}
