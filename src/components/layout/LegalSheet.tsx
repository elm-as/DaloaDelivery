import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, FileText, Info, ArrowLeft, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

interface LegalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
}

export function LegalSheet({ isOpen, onClose, user, onLogout }: LegalSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[101] max-h-[75vh] flex flex-col shadow-2xl"
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-grey-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-grey-900">Menu & Informations</h3>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-grey-100 rounded-full flex items-center justify-center text-grey-600 active:scale-95 transition-transform"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-8">
              <Link
                to="/terms"
                onClick={onClose}
                className="flex items-center gap-4 p-4 rounded-2xl bg-grey-50 active:bg-grey-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-grey-900">Conditions d'utilisation</p>
                  <p className="text-xs text-grey-500">CGU régissant l'utilisation de la plateforme</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-grey-400 rotate-180" />
              </Link>

              <Link
                to="/privacy"
                onClick={onClose}
                className="flex items-center gap-4 p-4 rounded-2xl bg-grey-50 active:bg-grey-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-grey-900">Politique de confidentialité</p>
                  <p className="text-xs text-grey-500">Comment nous protégeons vos données</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-grey-400 rotate-180" />
              </Link>

              <Link
                to="/mentions-legales"
                onClick={onClose}
                className="flex items-center gap-4 p-4 rounded-2xl bg-grey-50 active:bg-grey-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-grey-900">Mentions légales</p>
                  <p className="text-xs text-grey-500">Éditeur, hébergement, propriété intellectuelle</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-grey-400 rotate-180" />
              </Link>

              {user && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 hover:bg-red-100/80 active:bg-red-100 transition-colors text-left border border-red-100 shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-red-600">Se déconnecter</p>
                      <p className="text-xs text-red-500/80">Fermer la session sur cet appareil</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Branding */}
            <div className="flex-shrink-0 p-4 border-t border-grey-100 text-center">
              <p className="text-xs text-grey-400">DaloaDelivery © {new Date().getFullYear()}</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
