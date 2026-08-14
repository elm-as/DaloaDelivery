import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-grey-900 text-grey-300 mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="DaloaDelivery" className="w-6 h-6 object-contain" />
              <span className="text-xl font-bold text-white">DaloaDelivery</span>
            </div>
            <p className="text-grey-400 text-sm leading-relaxed">
              Trouvez un livreur fiable à Daloa pour tous vos besoins de livraison. Rapide, sécurisé et proche de chez vous.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Liens rapides</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-grey-400 hover:text-primary transition-colors text-sm">Accueil</Link>
              <Link to="/annuaire" className="text-grey-400 hover:text-primary transition-colors text-sm">Annuaire des livreurs</Link>
              <Link to="/devenir-livreur" className="text-grey-400 hover:text-primary transition-colors text-sm">Devenir livreur</Link>
            </nav>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Informations légales</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/terms" className="text-grey-400 hover:text-primary transition-colors text-sm">Conditions d'utilisation</Link>
              <Link to="/privacy" className="text-grey-400 hover:text-primary transition-colors text-sm">Confidentialité</Link>
              <Link to="/mentions-legales" className="text-grey-400 hover:text-primary transition-colors text-sm">Mentions légales</Link>
            </nav>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-grey-400 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                Daloa, Côte d'Ivoire
              </div>
              <div className="flex items-center gap-2 text-grey-400 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                +225 07 88 00 08 31
              </div>
              <div className="flex items-center gap-2 text-grey-400 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                support@daloamarket.com
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-grey-800 mt-8 pt-8 text-center text-grey-500 text-sm">
          &copy; {new Date().getFullYear()} DaloaDelivery (ElmasCore) — Fondé par Elmas. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
