import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Phone, MapPin, FileText, AlertTriangle, User, Bot, ShieldAlert } from 'lucide-react';

const REJECTION_REASONS = [
  'Document illisible',
  'Document incomplet',
  'Document expiré',
  'Faux document suspect',
  'Photo du document floue',
  'Document ne correspond pas au nom inscrit',
  'Type de document non accepté',
];

export const AdminVerificationModals = ({
  activeModal,
  setActiveModal,
  selectedDriver,
  setSelectedDriver,
  rejectionReason,
  setRejectionReason,
  customReason,
  setCustomReason,
  processing,
  handleApprove,
  handleReject,
  getStatusBadge,
  signedUrls = {}
}: any) => {
  return (
    <AnimatePresence>
      {(activeModal === 'review' || activeModal === 'reject') && selectedDriver && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setActiveModal('none'); setSelectedDriver(null); setRejectionReason(''); setCustomReason(''); }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[101] max-h-[90vh] flex flex-col shadow-2xl"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-grey-300 rounded-full" />
            </div>

            {/* ====== REVIEW STEP ====== */}
            {activeModal === 'review' && (
              <>
                <div className="flex-1 overflow-y-auto">
                  {/* Header */}
                  <div className="px-4 pb-4 border-b border-grey-100">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-grey-100 flex items-center justify-center flex-shrink-0">
                        {selectedDriver.photo_url ? (
                          <img
                            src={selectedDriver.photo_url}
                            alt={selectedDriver.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDriver.name)}&background=f3f4f6&color=374151&size=128`;
                            }}
                          />
                        ) : (
                          <User className="w-7 h-7 text-grey-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-grey-900">{selectedDriver.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-grey-500 mt-0.5">
                          <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" /> {selectedDriver.phone}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {selectedDriver.coverage_zones.length} zones</span>
                        </div>
                      </div>
                      {getStatusBadge(selectedDriver)}
                    </div>
                  </div>

                  {/* Document Preview */}
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-grey-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Documents soumis
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(signedUrls.cni || selectedDriver.cni_url) && (
                          <div>
                            <p className="text-xs font-bold text-grey-600 mb-1">1. CNI (Recto)</p>
                            <div className="bg-grey-50 rounded-xl overflow-hidden border border-grey-200 aspect-[4/3]">
                              <img
                                src={(signedUrls.cni || selectedDriver.cni_url).split('#')[0]}
                                alt="CNI"
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open((signedUrls.cni || selectedDriver.cni_url)?.split('#')[0], '_blank')}
                              />
                            </div>
                          </div>
                        )}
                        {(signedUrls.selfie || selectedDriver.selfie_cni_url) && (
                          <div>
                            <p className="text-xs font-bold text-grey-600 mb-1">2. Selfie avec CNI</p>
                            <div className="bg-grey-50 rounded-xl overflow-hidden border border-grey-200 aspect-[3/4]">
                              <img
                                src={(signedUrls.selfie || selectedDriver.selfie_cni_url).split('#')[0]}
                                alt="Selfie CNI"
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open((signedUrls.selfie || selectedDriver.selfie_cni_url)?.split('#')[0], '_blank')}
                              />
                            </div>
                          </div>
                        )}
                        {(signedUrls.portrait || selectedDriver.portrait_live_url) && (
                          <div>
                            <p className="text-xs font-bold text-grey-600 mb-1">3. Portrait Live</p>
                            <div className="bg-grey-50 rounded-xl overflow-hidden border border-grey-200 aspect-square">
                              <img
                                src={(signedUrls.portrait || selectedDriver.portrait_live_url).split('#')[0]}
                                alt="Portrait Live"
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open((signedUrls.portrait || selectedDriver.portrait_live_url)?.split('#')[0], '_blank')}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Detection Report */}
                    {selectedDriver.ai_verification_results && (
                      <div className={`rounded-2xl p-4 border ${
                        selectedDriver.ai_flagged 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-emerald-50/50 border-emerald-200'
                      }`}>
                        <p className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${
                          selectedDriver.ai_flagged ? 'text-red-700' : 'text-emerald-700'
                        }`}>
                          {selectedDriver.ai_flagged 
                            ? <><ShieldAlert className="w-4 h-4" /> ⚠️ Alerte — Contenu IA détecté</>
                            : <><Bot className="w-4 h-4" /> ✅ Analyse IA — RAS</>
                          }
                        </p>
                        <div className="space-y-2">
                          {Object.entries(selectedDriver.ai_verification_results as Record<string, { probability: number; is_ai: boolean; details: string }>).map(([key, result]) => {
                            const label = key === 'cni' ? 'CNI' : key === 'selfie' ? 'Selfie' : 'Portrait';
                            const prob = result.probability;
                            const barColor = prob >= 50 ? 'bg-red-500' : prob >= 20 ? 'bg-amber-400' : 'bg-emerald-500';
                            return (
                              <div key={key} className="bg-white/70 rounded-xl p-3 border border-grey-100">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-grey-800">{label}</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    prob >= 50 ? 'bg-red-100 text-red-700' : prob >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {prob >= 0 ? `${prob}% IA` : 'N/A'}
                                  </span>
                                </div>
                                {prob >= 0 && (
                                  <div className="w-full h-1.5 bg-grey-100 rounded-full overflow-hidden mb-1.5">
                                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.max(prob, 2)}%` }} />
                                  </div>
                                )}
                                <p className="text-[10px] text-grey-500 leading-relaxed">{result.details}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedDriver.verification_status === 'rejected' && selectedDriver.verification_rejection_reason && (
                      <div className="bg-error-50 rounded-2xl p-4 border border-error-100">
                        <p className="text-xs font-bold text-error-700 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Raison du dernier refus
                        </p>
                        <p className="text-sm text-error-600">{selectedDriver.verification_rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions - fixed at bottom */}
                <div className="flex-shrink-0 px-4 pb-6 pt-3 space-y-3 border-t border-grey-100 bg-white" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="w-full py-3.5 bg-success text-white rounded-2xl text-sm font-bold active:scale-[0.97] transition-transform flex items-center justify-center gap-2 shadow-sm shadow-success/20 disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approuver et vérifier le livreur
                  </button>
                  <button
                    onClick={() => { setActiveModal('reject'); setRejectionReason(''); setCustomReason(''); }}
                    disabled={processing}
                    className="w-full py-3.5 bg-error-50 text-error-600 rounded-2xl text-sm font-bold active:scale-[0.97] transition-transform flex items-center justify-center gap-2 border border-error-100 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Refuser le document
                  </button>
                  <button
                    onClick={() => { setActiveModal('none'); setSelectedDriver(null); }}
                    className="w-full py-3 text-grey-500 text-sm font-bold"
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}

            {/* ====== REJECT STEP ====== */}
            {activeModal === 'reject' && (
              <>
                <div className="px-4 pb-2 flex-shrink-0">
                  <h3 className="text-lg font-bold text-grey-900">Raison du refus</h3>
                  <p className="text-sm text-grey-500 mt-0.5">Choisissez ou écrivez la raison du refus pour {selectedDriver.name}</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {REJECTION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => { setRejectionReason(reason); setCustomReason(''); }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                        rejectionReason === reason
                          ? 'bg-error-50 border-error-200 text-error-700'
                          : 'bg-grey-50 border-grey-100 text-grey-700'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                  <button
                    onClick={() => { setRejectionReason('custom'); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                      rejectionReason === 'custom'
                        ? 'bg-error-50 border-error-200 text-error-700'
                        : 'bg-grey-50 border-grey-100 text-grey-700'
                    }`}
                  >
                    Autre raison (personnalisée)
                  </button>
                  {rejectionReason === 'custom' && (
                    <textarea
                      value={customReason}
                      onChange={(e: any) => setCustomReason(e.target.value)}
                      placeholder="Décrivez la raison du refus..."
                      rows={3}
                      className="w-full px-4 py-3 bg-grey-50 border border-grey-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-error-300 resize-none mt-2"
                    />
                  )}
                </div>

                {/* Buttons - fixed at bottom */}
                <div className="flex-shrink-0 px-4 pt-3 space-y-3 border-t border-grey-100 bg-white" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                  <button
                    onClick={handleReject}
                    disabled={processing || !rejectionReason || (rejectionReason === 'custom' && !customReason.trim())}
                    className="w-full py-3.5 bg-error text-white rounded-2xl text-sm font-bold active:scale-[0.97] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Confirmer le refus
                  </button>
                  <button
                    onClick={() => { setActiveModal('review'); setRejectionReason(''); setCustomReason(''); }}
                    className="w-full py-3 text-grey-500 text-sm font-bold"
                  >
                    Retour
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
