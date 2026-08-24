import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share2, PlusSquare, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // 1. Vérifier si l'app est déjà installée en mode Standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // 2. Détecter iOS
    const ua = window.navigator.userAgent;
    const detectedIOS = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(detectedIOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsVisible(false);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.log('[PWA] Prompt error, fallback to guide modal', err);
      }
    }

    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
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
            <div className="bg-gray-900/95 backdrop-blur-xl text-white rounded-2xl p-3.5 shadow-2xl border border-gray-800 flex items-center justify-between gap-3">
              {/* Logo Officiel DaloaDelivery */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700/60 p-1.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="DaloaDelivery Logo"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-sm text-white leading-tight">DaloaDelivery</h4>
                    <span className="bg-[#FF6B00]/20 text-[#FF6B00] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#FF6B00]/30">
                      Livreur
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {isIOS ? 'Ajouter à l\'écran d\'accueil iPhone' : 'Installer l\'application livreur'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleInstall}
                  className="bg-[#FF6B00] hover:bg-[#e05e00] text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-[#FF6B00]/30 whitespace-nowrap"
                >
                  Installer
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL GUIDE LIVREUR AVEC LOGO OFFICIEL */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-gray-900 text-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-gray-800"
            >
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 p-2 shadow-sm flex items-center justify-center">
                  <img src="/logo.png" alt="DaloaDelivery" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Installer DaloaDelivery</h3>
                  <p className="text-xs text-gray-400">Accédez au cockpit livreur en 1 clic</p>
                </div>
              </div>

              <div className="space-y-4 my-6">
                {isIOS ? (
                  <>
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/50">
                      <div className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-gray-300">
                        <p className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
                          Appuyez sur Partager <Share2 className="w-3.5 h-3.5 inline text-[#FF6B00]" />
                        </p>
                        <p>Dans la barre inférieure de Safari, touchez l'icône de partage.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/50">
                      <div className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-gray-300">
                        <p className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
                          Sélectionnez « Sur l'écran d'accueil » <PlusSquare className="w-3.5 h-3.5 inline text-[#FF6B00]" />
                        </p>
                        <p>Faites défiler vers le bas et sélectionnez l'option avec un +.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/50">
                      <div className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-gray-300">
                        <p className="font-semibold text-white mb-0.5">Ouvrez le menu du navigateur</p>
                        <p>Appuyez sur les 3 points verticaux en haut à droite du navigateur.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/50">
                      <div className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-gray-300">
                        <p className="font-semibold text-white mb-0.5">Sélectionnez « Installer l'application »</p>
                        <p>L'icône officielle de l'application sera créée sur votre téléphone.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                className="w-full bg-[#FF6B00] hover:bg-[#e05e00] text-white py-3 rounded-xl font-bold text-sm transition-all"
                onClick={() => {
                  setShowGuideModal(false);
                  handleDismiss();
                }}
              >
                C'est compris
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
