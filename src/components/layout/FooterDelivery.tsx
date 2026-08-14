import { Link } from 'react-router-dom';

export function FooterDelivery() {
  return (
    <footer className="hidden lg:block bg-white border-t border-grey-100 mt-12">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-5 gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary mb-3">
              <img src="/logo.png" alt="DaloaDelivery" className="w-6 h-6 object-contain" />
              <span className="text-lg font-bold">DaloaDelivery</span>
            </div>
            <p className="text-xs text-grey-500 leading-relaxed">
              Service de livraison ultra-rapide à Daloa. Trouvez le livreur idéal pour tous vos colis et courses.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-grey-900 mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm text-grey-600">
              <li><Link to="/" className="hover:text-primary transition-colors">Accueil</Link></li>
              <li><Link to="/annuaire" className="hover:text-primary transition-colors">Annuaire livreurs</Link></li>
              <li><Link to="/devenir-livreur" className="hover:text-primary transition-colors">Devenir livreur</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-grey-900 mb-3">Espace Livreur</h4>
            <ul className="space-y-2 text-sm text-grey-600">
              <li><Link to="/login" className="hover:text-primary transition-colors">Connexion</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Tableau de bord</Link></li>
              <li><Link to="/dashboard/commandes" className="hover:text-primary transition-colors">Mes livraisons</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-grey-900 mb-3">Écosystème Daloa</h4>
            <ul className="space-y-2 text-sm text-grey-600">
              <li><a href="https://daloamarket.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">🛍️ DaloaMarket</a></li>
              <li><a href="https://tuto.daloamarket.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">💡 Centre Tutoriels</a></li>
              <li><a href="https://docs.daloamarket.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">📖 Documentation & API</a></li>
              <li><a href="https://status.daloamarket.ci" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">🟢 Statut Système</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-grey-900 mb-3">Informations légales</h4>
            <ul className="space-y-2 text-sm text-grey-600">
              <li><Link to="/terms" className="hover:text-primary transition-colors">CGU</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Confidentialité</Link></li>
              <li><Link to="/mentions-legales" className="hover:text-primary transition-colors">Mentions légales</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-grey-100 mt-8 pt-6 flex items-center justify-between text-xs text-grey-400">
          <p>© {new Date().getFullYear()} ElmasCore — DaloaDelivery. Tous droits réservés.</p>
          <p>Daloa, Côte d'Ivoire</p>
        </div>
      </div>
    </footer>
  );
}
