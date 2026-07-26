import { useEffect } from 'react';
import { Ban } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BannedPage() {
  useEffect(() => {
    document.title = 'Compte suspendu - DaloaDelivery';
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-grey-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center bg-white p-8 rounded-3xl shadow-sm border border-grey-100"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6"
        >
          <Ban size={40} className="text-red-500" />
        </motion.div>
        <h1 className="text-2xl font-bold text-grey-900 mb-3">
          Compte suspendu
        </h1>
        <p className="text-grey-600 mb-2 leading-relaxed text-sm">
          Votre compte a été suspendu pour non-respect des conditions d'utilisation.
        </p>
        <p className="text-grey-500 text-xs">
          Veuillez contacter le support de DaloaMarket/DaloaDelivery si vous pensez qu'il s'agit d'une erreur.
        </p>
      </motion.div>
    </div>
  );
}
