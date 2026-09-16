import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, RefreshCw, Bike } from 'lucide-react';

interface MaintenancePageProps {
  message?: string;
  expectedReopening?: string | null;
}

export default function MaintenancePage({
  message = "DaloaDelivery est actuellement en maintenance technique planifiée pour l'amélioration de nos services.",
  expectedReopening,
}: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-grey-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-100 opacity-40 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-100 opacity-40 blur-3xl rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="p-8 sm:p-10 rounded-3xl text-center shadow-strong border border-grey-100 bg-white/95 backdrop-blur-md">
          {/* Logo DaloaDelivery */}
          <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl p-2.5 mx-auto mb-6 flex items-center justify-center">
            <Bike className="w-10 h-10 text-primary" />
          </div>

          {/* Badge Maintenance */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary font-bold text-xs uppercase tracking-wider mb-4">
            <Wrench className="w-3.5 h-3.5 animate-pulse" />
            <span>Maintenance en cours</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-grey-900 mb-3">
            DaloaDelivery revient très vite !
          </h1>

          <p className="text-sm text-grey-600 leading-relaxed mb-6 max-w-md mx-auto">
            {message}
          </p>

          {expectedReopening && (
            <div className="mb-8 p-4 rounded-2xl bg-grey-50 border border-grey-200 inline-flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-grey-500 block uppercase tracking-wider">
                  Réouverture estimée
                </span>
                <span className="text-sm font-bold text-grey-900">
                  {new Date(expectedReopening).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser la page</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
