import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Bike,
  Car,
  Truck,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Zap,
  PhoneCall,
  Store,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { deliveryPersonService } from '../services/deliveryPersonService';
import type { DeliveryPerson } from '../types/livreur';
import { LivreurCard } from '../components/livreur/LivreurCard';
import { useSEO } from '../hooks/useSEO';

const CATEGORIES = [
  { id: 'Moto', label: 'Moto', icon: Bike, desc: 'Express & Colis', color: 'from-orange-500 to-amber-500' },
  { id: 'Vélo', label: 'Vélo', icon: Bike, desc: 'Éco & Proximité', color: 'from-emerald-500 to-teal-500' },
  { id: 'Voiture', label: 'Voiture', icon: Car, desc: 'Confort & Pluie', color: 'from-blue-500 to-indigo-500' },
  { id: 'Triporteur', label: 'Triporteur', icon: Truck, desc: 'Gros Volumes', color: 'from-purple-500 to-pink-500' },
];

const POPULAR_DISTRICTS = [
  'Tazibouo',
  'Kennedy',
  'Huberson',
  'Commerce',
  'Lobia',
  'Marais',
  'Soleil',
  'Abattoir',
];

export default function HomePage() {
  const navigate = useNavigate();
  const [topLivreurs, setTopLivreurs] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const deliveryServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Livraison express et coursier de proximité',
    provider: {
      '@type': 'Organization',
      name: 'DaloaDelivery',
      url: 'https://delivery.daloamarket.com',
    },
    areaServed: {
      '@type': 'City',
      name: 'Daloa',
      addressCountry: 'CI',
    },
    description:
      'Trouvez un livreur vérifié à Daloa (moto, vélo, voiture, triporteur) pour vos colis, repas et marchandises.',
  };

  useSEO('Livreurs fiables à Daloa — Service de Livraison Express', {
    description:
      "Trouvez rapidement un livreur disponible à Daloa (Côte d'Ivoire). Coursiers vérifiés par moto, vélo, voiture et triporteur avec suivi en temps réel.",
    keywords:
      'livreur Daloa, livraison moto Daloa, coursier Côte d\'Ivoire, livraison express DaloaDelivery',
    canonical: 'https://delivery.daloamarket.com/',
    jsonLd: deliveryServiceSchema,
  });

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const data = await deliveryPersonService.searchDeliveryPersons({ available_only: true });
        setTopLivreurs(data.slice(0, 6));
      } catch (error) {
        console.error('Erreur chargement livreurs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTop();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/annuaire?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/annuaire');
    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      {/* ── 1. IMMERSIVE HERO SECTION ── */}
      <div className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 text-white px-4 pt-8 pb-20 rounded-b-[2.5rem] shadow-xl shadow-orange-500/20 overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          {/* Live Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-xs font-black text-white shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Service actif • Flotte vérifiée à Daloa 🇨🇮</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Vos livraisons à Daloa <br className="hidden sm:inline" />
            <span className="text-amber-200">en un éclair ⚡</span>
          </h1>

          <p className="text-orange-100 text-xs sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Trouvez un coursier de confiance en direct pour vos colis, courses privées et commandes e-commerce.
          </p>

          {/* Instant Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto pt-2">
            <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-2xl shadow-black/15 border border-white/40">
              <div className="pl-3 pr-2 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par livreur, quartier (ex: Tazibouo)..."
                className="w-full bg-transparent text-gray-900 text-sm font-semibold placeholder:text-gray-400 focus:outline-none py-2"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>Trouver</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-20 space-y-8">
        {/* ── 2. VEHICLE CATEGORIES ── */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-gray-900">Types de Véhicules</h2>
              <p className="text-xs text-gray-400 font-medium">Choisissez le transport adapté à votre colis</p>
            </div>
            <button
              onClick={() => navigate('/annuaire')}
              className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              Tous <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/annuaire?type=${cat.id}`)}
                  className="bg-gray-50/80 hover:bg-white hover:border-orange-200 border border-gray-100 rounded-2xl p-3.5 text-center cursor-pointer transition-all shadow-2xs hover:shadow-md group"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center mx-auto mb-2 shadow-xs group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-black text-gray-900">{cat.label}</h3>
                  <span className="text-[10px] text-gray-400 font-medium">{cat.desc}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── 3. POPULAR DISTRICTS FILTER ── */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-black text-gray-900">Quartiers populaires à Daloa</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {POPULAR_DISTRICTS.map((district) => (
              <button
                key={district}
                onClick={() => navigate(`/annuaire?q=${encodeURIComponent(district)}`)}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-gray-200/80 text-gray-700 hover:text-orange-700 text-xs font-bold active:scale-95 transition-all shadow-2xs"
              >
                {district}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. LIVE AVAILABLE DELIVERERS ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-base font-black text-gray-900">Livreurs en ligne en ce moment</h2>
            </div>
            <button
              onClick={() => navigate('/annuaire')}
              className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
            >
              Voir tout l'annuaire <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-13 h-13 rounded-2xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : topLivreurs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm space-y-2">
              <Clock className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-black text-gray-800">Aucun livreur en ligne pour le moment</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Consultez l'annuaire complet pour contacter directement nos coursiers répertoriés.
              </p>
              <button
                onClick={() => navigate('/annuaire')}
                className="mt-2 px-5 py-2 rounded-xl bg-orange-50 text-orange-600 font-black text-xs border border-orange-200/60"
              >
                Ouvrir l'annuaire
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {topLivreurs.map((livreur, idx) => (
                <LivreurCard key={livreur.id} livreur={livreur} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* ── 5. DUAL BENTO ACTION CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Card 1: Espace Livreur */}
          <div className="bg-gradient-to-br from-slate-900 to-gray-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="space-y-2 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-[11px] font-black border border-white/10">
                <Zap size={12} /> Espace Livreur
              </span>
              <h3 className="text-lg font-black tracking-tight">Vous avez un moyen de transport ?</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Rejoignez la 1ère flotte de Daloa. Recevez des courses privées, affiliez-vous à des boutiques et gardez 100% de vos gains directs.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 relative z-10">
              <button
                onClick={() => navigate('/devenir-livreur')}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all text-center"
              >
                S'inscrire comme Livreur
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-black text-xs rounded-xl border border-white/15 active:scale-95 transition-all"
              >
                Connexion
              </button>
            </div>
          </div>

          {/* Card 2: Commerçants DaloaMarket */}
          <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="space-y-2 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-black border border-white/20">
                <Store size={12} /> Vendeurs DaloaMarket
              </span>
              <h3 className="text-lg font-black tracking-tight">Expédiez les commandes de vos clients</h3>
              <p className="text-xs text-orange-100 leading-relaxed">
                Affiliez vos livreurs favoris depuis votre boutique DaloaMarket pour gérer automatiquement vos livraisons et le Cash on Delivery.
              </p>
            </div>

            <div className="pt-2 relative z-10">
              <a
                href="https://daloamarket.com/mes-livreurs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-white hover:bg-orange-50 text-orange-700 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all text-center block"
              >
                Gérer mes livreurs sur DaloaMarket ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
