import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Phone, MessageSquare, Shield } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import ProBadge from '../components/ui/ProBadge';
import { LivreurHeaderCard } from '../components/livreur/LivreurHeaderCard';
import { LivreurReviewsSection } from '../components/livreur/LivreurReviewsSection';
import { deliveryPersonService } from '../services/deliveryPersonService';
import type { DeliveryPerson } from '../types/livreur';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';
import { RevealablePhone } from '../components/livreur/RevealablePhone';

export default function LivreurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [livreur, setLivreur] = useState<DeliveryPerson | null>(null);
  const [loading, setLoading] = useState(true);

  const title = livreur ? `${livreur.name} — Livreur ${livreur.vehicle_type} à Daloa` : 'Livreur à Daloa';
  const desc = livreur
    ? `${livreur.name} est livreur en ${livreur.vehicle_type} à Daloa. ${
        livreur.total_reviews > 0 ? `Note: ${livreur.rating.toFixed(1)}/5 (${livreur.total_reviews} avis).` : 'Nouveau coursier disponible.'
      } ${livreur.description || ''}`
    : 'Trouvez un livreur de confiance à Daloa sur DaloaDelivery.';

  useSEO(title, {
    description: desc,
    keywords: livreur
      ? `${livreur.name}, livreur ${livreur.vehicle_type} Daloa, coursier Daloa`
      : 'livreur Daloa, livraison Côte d\'Ivoire',
    ogImage: livreur?.photo_url || 'https://delivery.daloamarket.com/og-image.png',
    canonical: `https://delivery.daloamarket.com/livreur/${id || ''}`,
  });

  const fetchLivreur = async () => {
    if (!id) return;
    try {
      const livreurData = await deliveryPersonService.getDeliveryPersonById(id);
      setLivreur(livreurData);
    } catch {
      toast.error('Livreur introuvable');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivreur();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!livreur) return null;

  const whatsappNumber = livreur.phone ? livreur.phone.replace(/[^0-9]/g, '') : '';

  return (
    <div className="pb-28 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto lg:px-4 lg:pt-6">
        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
          {/* Left: Hero & Stats */}
          <LivreurHeaderCard livreur={livreur} />

          {/* Right: Bio, Zones, Certification & Verified Reviews */}
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
                      <span
                        key={zone}
                        className="bg-primary-50 text-primary-700 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border border-primary-100/50"
                      >
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
              <div className="bg-gradient-to-br from-secondary-50 to-white rounded-3xl p-4 flex items-center gap-3.5 border border-secondary-200/60 shadow-sm">
                <div className="w-11 h-11 bg-secondary-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-secondary-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-secondary-800 text-xs sm:text-sm">Livreur certifié</h4>
                    <ProBadge size="xs" />
                  </div>
                  <p className="text-[11px] text-secondary-700 mt-0.5 font-medium">
                    Identité et conformité contrôlées par DaloaDelivery
                  </p>
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

            {/* Customer Reviews Section with Strict Order Verification */}
            <LivreurReviewsSection livreurId={livreur.id} onReviewAdded={fetchLivreur} />
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar (Mobile only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center gap-2 shadow-2xl">
        <div className="flex-1">
          <RevealablePhone phone={livreur.phone} />
        </div>
      </div>
    </div>
  );
}
