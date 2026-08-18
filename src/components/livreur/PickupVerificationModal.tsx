import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Phone } from 'lucide-react';
import { deliveryAssignmentService } from '../../services/deliveryAssignmentService';
import toast from 'react-hot-toast';
import { friendlyError } from '../../lib/messages';

interface PickupVerificationModalProps {
  assignmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sellerPhone?: string | null;
}

export default function PickupVerificationModal({
  assignmentId,
  isOpen,
  onClose,
  onSuccess,
  sellerPhone,
}: PickupVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await deliveryAssignmentService.verifyPickup(assignmentId, otp);
      toast.success('Récupération validée avec succès !');
      onSuccess();
      onClose();
      setOtp('');
    } catch (error: any) {
      toast.error(friendlyError(error, 'Code de retrait incorrect ou expiré'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      handleVerify();
    } else {
      toast.error("L'OTP doit contenir 6 chiffres");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[500] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-grey-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-grey-900">Vérification Pickup</h3>
                <p className="text-sm text-grey-500 font-medium">Confirmez la récupération du colis</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-grey-50 rounded-full flex items-center justify-center text-grey-500 active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* OTP Form */}
            <div className="p-6">
              {sellerPhone && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl mb-5 border border-green-100">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Vendeur à contacter</p>
                    <a href={`tel:${sellerPhone}`} className="text-[15px] font-bold text-green-800 hover:underline">
                      {sellerPhone}
                    </a>
                  </div>
                </div>
              )}
              <form onSubmit={handleOtpSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-grey-900 mb-2">
                    Code OTP du vendeur
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border-2 border-grey-200 rounded-xl text-center text-2xl font-bold tracking-widest focus:border-primary focus:outline-none"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-grey-500 mt-2 text-center">
                    Entrez le code à 6 chiffres fourni par le vendeur
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold active:scale-[0.97] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Shield className="w-5 h-5 mr-2 animate-pulse" />
                      Vérification...
                    </>
                  ) : (
                    'Valider le pickup'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
