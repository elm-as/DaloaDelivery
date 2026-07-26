import { Link } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus, User } from 'lucide-react';
import { useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useSupabase();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary-600 transition-colors">
            <img src="/logo.png" alt="DaloaDelivery" className="w-7 h-7 object-contain" />
            <span className="text-xl font-bold">DaloaDelivery</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-grey-600 hover:text-primary transition-colors font-medium">
              Accueil
            </Link>
            <Link to="/annuaire" className="text-grey-600 hover:text-primary transition-colors font-medium">
              Annuaire
            </Link>
            <Link to="/devenir-livreur" className="text-grey-600 hover:text-primary transition-colors font-medium">
              Devenir livreur
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-card font-medium hover:bg-primary-600 transition-colors"
              >
                <User className="w-4 h-4" />
                Tableau de bord
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1 px-4 py-2 text-grey-700 hover:text-primary transition-colors font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-card font-medium hover:bg-primary-600 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Inscription
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-grey-700 hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-grey-200">
            <nav className="flex flex-col gap-3">
              <Link to="/" className="text-grey-600 hover:text-primary transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                Accueil
              </Link>
              <Link to="/annuaire" className="text-grey-600 hover:text-primary transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                Annuaire
              </Link>
              <Link to="/devenir-livreur" className="text-grey-600 hover:text-primary transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                Devenir livreur
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-card font-medium hover:bg-primary-600 transition-colors w-fit"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Tableau de bord
                </Link>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-1 px-4 py-2 border border-grey-300 text-grey-700 rounded-card font-medium hover:border-primary hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4" />
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-card font-medium hover:bg-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Inscription
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
