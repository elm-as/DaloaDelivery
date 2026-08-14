import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // 1. Vérifier si l'app est déjà installée en mode Standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    const dismissedSession = sessionStorage.getItem('pwa_delivery_prompt_dismissed');
    if (dismissedSession) return;

    // 2. Détecter iOS
    const ua = window.navigator.userAgent;
    const detectedIOS = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(detectedIOS);

    if (detectedIOS) {
      setIsVisible(true);
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setIsVisible(true);
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIosModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsVisible(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_delivery_prompt_dismissed', 'true');
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <>
      <AnimatePresence>
        {!isDismissed && (
          <motion.div
            className="fixed bottom-[80px] md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[60]"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl border border-gray-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white leading-tight">Installer DaloaDelivery</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isIOS ? 'Ajouter à l\'écran d\'accueil iPhone' : 'Accès rapide aux livraisons'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleInstall}
                  className="px-3.5 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-[#FF6B00]/30 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  {isIOS ? 'Comment faire ?' : 'Installer'}
                </button>

                <button
                  onClick={handleDismiss}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL INSTRUCTIONS iOS */}
      <AnimatePresence>
        {showIosModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-gray-900 border border-gray-800 text-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowIosModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center font-bold">
                  📱
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Installer sur iPhone / iPad</h3>
                  <p className="text-xs text-gray-400">Application Livreur DaloaDelivery</p>
                </div>
              </div>

              <div className="space-y-3.5 my-6 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-0.5">Appuyez sur le bouton Partager 📤</p>
                    <p className="text-gray-400">Dans le menu au bas de Safari, touchez l'icône de partage.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-0.5">Sélectionnez « Sur l'écran d'accueil » ➕</p>
                    <p className="text-gray-400">Défilez vers le bas pour trouver l'option avec un +.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-0.5">Appuyez sur « Ajouter » 🚀</p>
                    <p className="text-gray-400">Confirmez en haut à droite pour ajouter l'app Livreur.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowIosModal(false);
                  handleDismiss();
                }}
                className="w-full py-3 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#FF6B00]/30"
              >
                C'est compris !
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
