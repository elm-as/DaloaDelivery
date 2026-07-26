import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="text-8xl font-bold text-primary mb-4">404</div>
        <h1 className="text-3xl font-bold text-grey-900 mb-3">Page introuvable</h1>
        <p className="text-grey-500 max-w-md mx-auto mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée. Vérifiez l'URL ou retournez à l'accueil.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-card font-medium hover:bg-primary-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            Accueil
          </Link>
          <Link
            to="/annuaire"
            className="flex items-center gap-2 px-6 py-3 border border-grey-300 text-grey-700 rounded-card font-medium hover:border-primary hover:text-primary transition-colors"
          >
            <Search className="w-5 h-5" />
            Annuaire
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
