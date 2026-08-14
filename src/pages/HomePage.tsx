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
      {/* ── 1. IMMERSIVE HERO SECTION (Bleu - Blanc - Orange) ── */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 text-white px-4 pt-8 pb-18 rounded-b-[2.5rem] shadow-xl shadow-blue-900/15 overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-3.5">
          {/* Live Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black text-white shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Service actif • Flotte vérifiée à Daloa 🇨🇮</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Vos livraisons à Daloa <br className="hidden sm:inline" />
            <span className="text-orange-400">en un clin d'œil ⚡</span>
          </h1>

          <p className="text-blue-100 text-xs sm:text-sm max-w-lg mx-auto font-medium leading-relaxed">
            Trouvez un coursier de confiance en direct pour vos colis, courses privées et livraisons e-commerce.
          </p>

          {/* Instant Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto pt-2">
            <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-2xl shadow-black/20 border border-white/40">
              <div className="pl-3 pr-2 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un livreur, quartier (Tazibouo, Kennedy...)"
                className="w-full bg-transparent text-gray-900 text-xs sm:text-sm font-semibold placeholder:text-gray-400 focus:outline-none py-1.5"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1 shrink-0"
              >
                <span>Trouver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-20 space-y-6">
        {/* ── 2. VEHICLE CATEGORIES (Clean & Compact) ── */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-black text-gray-900">Types de Véhicules</h2>
            </div>
            <button
              onClick={() => navigate('/annuaire')}
              className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              Tous <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/annuaire?type=${cat.id}`)}
                  className="bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 border border-gray-100 rounded-2xl p-3 text-center cursor-pointer transition-all shadow-2xs group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center mx-auto mb-1.5 shadow-xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-black text-gray-900">{cat.label}</h3>
                  <span className="text-[10px] text-gray-400 font-medium">{cat.desc}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── 3. POPULAR DISTRICTS FILTER ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <h2 className="text-xs font-black text-gray-700 uppercase tracking-wider">Quartiers populaires à Daloa</h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {POPULAR_DISTRICTS.map((district) => (
              <button
                key={district}
                onClick={() => navigate(`/annuaire?q=${encodeURIComponent(district)}`)}
                className="px-3 py-1 rounded-xl bg-white hover:bg-blue-50 border border-gray-200/80 hover:border-blue-200 text-gray-700 hover:text-blue-700 text-xs font-bold active:scale-95 transition-all shadow-2xs"
              >
                {district}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. LIVE AVAILABLE DELIVERERS (Compact List) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-sm font-black text-gray-900">Livreurs disponibles en ce moment</h2>
            </div>
            <button
              onClick={() => navigate('/annuaire')}
              className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              Voir l'annuaire ({topLivreurs.length}) <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs animate-pulse flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : topLivreurs.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm space-y-2">
              <Clock className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-black text-gray-800">Aucun livreur en ligne pour le moment</p>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                Consultez l'annuaire complet pour contacter directement nos coursiers répertoriés.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {topLivreurs.map((livreur, idx) => (
                <LivreurCard key={livreur.id} livreur={livreur} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* ── 5. SIMPLIFIED ACTION BANNERS (Compact & Sleek) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Banner 1: Espace Livreur */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-gray-900 truncate">Vous êtes livreur ?</h3>
                <p className="text-[11px] text-gray-500 truncate font-medium">Rejoignez la flotte & gardez 100% de vos gains</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => navigate('/devenir-livreur')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-2xs active:scale-95 transition-all"
              >
                S'inscrire
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl active:scale-95 transition-all"
              >
                Connexion
              </button>
            </div>
          </div>

          {/* Banner 2: Commerçants DaloaMarket */}
          <div className="bg-white rounded-2xl p-4 border border-orange-200/70 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-gray-900 truncate">Vendeurs DaloaMarket</h3>
                <p className="text-[11px] text-gray-500 truncate font-medium">Expédiez & gérez vos livraisons facilement</p>
              </div>
            </div>
            <a
              href="https://daloamarket.com/mes-livreurs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-2xs active:scale-95 transition-all shrink-0"
            >
              Affilier ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
