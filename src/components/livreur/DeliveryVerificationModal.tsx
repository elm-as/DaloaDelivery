import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Shield, X, Check, Phone } from 'lucide-react';
import { deliveryAssignmentService } from '../../services/deliveryAssignmentService';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { friendlyError } from '../../lib/messages';

interface DeliveryVerificationModalProps {
  assignmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buyerPhone?: string | null;
}

export default function DeliveryVerificationModal({
  assignmentId,
  isOpen,
  onClose,
  onSuccess,
  buyerPhone,
}: DeliveryVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'otp' | 'photo' | 'verifying'>('otp');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadPhotoAndVerify = async () => {
    if (!photoFile) {
      toast.error('Photo requise');
      return;
    }

    setUploading(true);
    setStep('verifying');
    try {
      // Upload vers Supabase Storage
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const filePath = `${assignmentId}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('delivery-photos')
        .upload(filePath, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(filePath);

      const photoUrl = urlData.publicUrl;

      // Obtenir la position GPS réelle du livreur
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Géolocalisation non supportée'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      // Vérification finale avec OTP + photo + GPS
      await deliveryAssignmentService.verifyDelivery(
        assignmentId, otp, photoUrl,
        position.coords.latitude,
        position.coords.longitude
      );

      toast.success('Livraison validée avec succès !');
      onSuccess();
      onClose();
      // Reset
      setOtp('');
      setPhotoFile(null);
      setPhotoPreviewUrl('');
      setStep('otp');
    } catch (error: any) {
      if (error instanceof GeolocationPositionError || error.message?.includes('géolocalisation') || error.message?.includes('Geolocation')) {
        toast.error('Impossible d\'obtenir votre position GPS. Vérifiez vos paramètres de localisation.');
        setStep('photo');
      } else {
        toast.error(friendlyError(error, 'Erreur lors de la validation de livraison'));
        setStep('photo');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      setLoading(true);
      try {
        const assignment = await deliveryAssignmentService.getById(assignmentId);
        await deliveryAssignmentService.verifyDeliveryOtp(assignment.order_id, otp);
        setStep('photo');
      } catch (error: any) {
        toast.error(friendlyError(error, 'Code OTP incorrect ou expiré'));
      } finally {
        setLoading(false);
      }
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
            className="bg-white rounded-3xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-grey-900">Vérification Livraison</h2>
                <p className="text-sm text-grey-500">Confirmez la remise au client</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-grey-100 flex items-center justify-center text-grey-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Steps — 2 étapes */}
            <div className="flex items-center justify-between mb-6">
              <div className={`flex items-center gap-2 ${step === 'otp' || step === 'photo' || step === 'verifying' ? 'text-primary' : 'text-grey-300'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'otp' ? 'bg-primary text-white' : step === 'photo' || step === 'verifying' ? 'bg-primary text-white' : 'bg-grey-200'}`}>
                  {step === 'otp' ? '1' : <Check className="w-3 h-3" />}
                </div>
                <span className="text-xs font-bold">OTP</span>
              </div>
              <div className={`flex-1 h-0.5 mx-2 ${step === 'photo' || step === 'verifying' ? 'bg-primary' : 'bg-grey-200'}`} />
              <div className={`flex items-center gap-2 ${step === 'photo' || step === 'verifying' ? 'text-primary' : 'text-grey-300'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'photo' ? 'bg-primary text-white' : step === 'verifying' ? 'bg-primary text-white' : 'bg-grey-200'}`}>
                  {step === 'photo' ? '2' : step === 'verifying' ? <Check className="w-3 h-3" /> : '2'}
                </div>
                <span className="text-xs font-bold">Photo</span>
              </div>
            </div>

            {/* Step Content */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit}>
                {buyerPhone && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl mb-5 border border-indigo-100">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Client à contacter</p>
                      <a href={`tel:${buyerPhone}`} className="text-[15px] font-bold text-indigo-800 hover:underline">
                        {buyerPhone}
                      </a>
                    </div>
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-grey-900 mb-2">
                    Code OTP du client
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
                    Entrez le code à 6 chiffres fourni par le client
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold active:scale-[0.97] transition-transform disabled:opacity-50"
                >
                  {loading ? 'Vérification...' : 'Continuer'}
                </button>
              </form>
            )}

            {step === 'photo' && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-grey-900 mb-2">
                    Photo de livraison (obligatoire)
                  </label>
                  <div className="border-2 border-dashed border-grey-200 rounded-xl p-6 text-center">
                    {!photoFile ? (
                      <div>
                        <Camera className="w-12 h-12 text-grey-300 mx-auto mb-2" />
                        <p className="text-sm text-grey-500 mb-3">Prendre une photo de la livraison</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoCapture}
                          className="hidden"
                          id="photo-upload-delivery"
                        />
                        <label
                          htmlFor="photo-upload-delivery"
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold cursor-pointer inline-block"
                        >
                          Capturer
                        </label>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-green-50 rounded-lg p-3 mb-3">
                          <Check className="w-6 h-6 text-green-600 mx-auto mb-1" />
                          <p className="text-sm font-bold text-green-700">Photo capturée</p>
                          {photoPreviewUrl && (
                            <img
                              src={photoPreviewUrl}
                              alt="Aperçu photo livraison"
                              className="mt-2 max-h-40 rounded-lg mx-auto"
                            />
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreviewUrl('');
                          }}
                          className="text-sm text-grey-500 underline"
                        >
                          Reprendre
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {photoFile && (
                  <button
                    onClick={uploadPhotoAndVerify}
                    disabled={uploading}
                    className="w-full py-3 bg-success text-white rounded-xl text-sm font-bold active:scale-[0.97] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Envoi de la photo...' : 'Valider la livraison'}
                  </button>
                )}
              </div>
            )}

            {step === 'verifying' && (
              <div className="text-center py-8">
                <Shield className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                <p className="text-lg font-bold text-grey-900 mb-2">Vérification en cours...</p>
                <p className="text-sm text-grey-500">Validation de l'OTP et envoi de la photo</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
