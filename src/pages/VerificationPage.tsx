import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Shield, Upload, Camera, CheckCircle, FileText, X, AlertCircle } from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { runAIDetection } from '../lib/aiDetection';
import type { DeliveryPerson } from '../types/livreur';

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabase();
  const [profile, setProfile] = useState<DeliveryPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<'uploading' | 'ai_checking' | 'saving'>('uploading');

  const [verifyCniFile, setVerifyCniFile] = useState<File | null>(null);
  const [verifySelfieFile, setVerifySelfieFile] = useState<File | null>(null);
  const [verifyPortraitFile, setVerifyPortraitFile] = useState<File | null>(null);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const data = await deliveryPersonService.getDeliveryPersonByUserId(user.id);
      if (data) {
        setProfile(data);
      } else {
        toast.error("Profil livreur introuvable.");
        navigate('/dashboard/profil');
      }
    } catch (err) {
      console.error("Error fetching delivery profile:", err);
      toast.error("Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleVerifyUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user || !verifyCniFile || !verifySelfieFile || !verifyPortraitFile) return;

    setSubmitting(true);
    setSubmissionStep('uploading');
    try {
      const uploadDoc = async (file: File, prefix: string) => {
        const ext = file.name.split('.').pop();
        const name = `${prefix}-${user.id}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('livreur-cni').upload(name, file);
        if (error) throw error;
        return supabase.storage.from('livreur-cni').getPublicUrl(name).data.publicUrl;
      };

      const cniUrl = await uploadDoc(verifyCniFile, 'cni');
      const selfieUrl = await uploadDoc(verifySelfieFile, 'selfie');
      const portraitUrl = await uploadDoc(verifyPortraitFile, 'portrait');

      setSubmissionStep('ai_checking');
      const aiReport = await runAIDetection({
        cni: verifyCniFile,
        selfie: verifySelfieFile,
        portrait: verifyPortraitFile
      });

      setSubmissionStep('saving');
      await deliveryPersonService.updateDeliveryPerson(profile.id, { 
        cni_url: cniUrl,
        selfie_cni_url: selfieUrl,
        portrait_live_url: portraitUrl,
        verification_status: 'pending',
        is_verified: false,
        ai_verification_results: aiReport.ai_verification_results,
        ai_flagged: aiReport.ai_flagged,
      });

      if (aiReport.ai_flagged) {
        toast.success('Documents soumis avec succès (Vérification IA en cours d\'analyse approfondie).');
      } else {
        toast.success('Documents soumis avec succès !');
      }
      await fetchProfile();
    } catch (err) {
      console.error("Upload verification error:", err);
      toast.error("Erreur lors de l'envoi des documents.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) return null;

  const isApproved = profile.verification_status === 'approved';
  const isPending = profile.verification_status === 'pending' || (!isApproved && !!profile.cni_url && profile.verification_status !== 'rejected');
  const isRejected = profile.verification_status === 'rejected';

  return (
    <div className="w-full max-w-xl mx-auto pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight flex items-center gap-1.5">
            <Shield className="w-5 h-5 text-primary" />
            Vérification d'identité
          </h1>
          <p className="text-xs text-gray-400">Statut de certification de votre compte livreur</p>
        </div>
      </div>

      <div className="px-4 pt-6">
        {/* State 1: Approved */}
        {isApproved && (
          <div className="text-center py-10 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Profil Certifié & Vérifié ✓</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Félicitations, votre identité a été validée par nos administrateurs. Votre compte est pleinement actif et vous inspirez confiance aux clients.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-left max-w-md mx-auto">
              <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">Pièces justificatives</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Documents vérifiés et validés</p>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Pending Review */}
        {isPending && (
          <div className="text-center py-10 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <LoadingSpinner size="md" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Documents en cours d'examen</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Vos justificatifs d'identité ont bien été transmis et sont actuellement examinés par nos équipes de modération.
              </p>
            </div>
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 text-left max-w-md mx-auto text-xs text-amber-800 leading-relaxed">
              <span className="font-bold block mb-0.5">Délai de traitement</span>
              La vérification prend généralement moins de 24 heures. Vous recevrez une notification dès que votre dossier aura été traité.
            </div>
          </div>
        )}

        {/* State 3: Rejected / Not Submitted yet */}
        {!isApproved && !isPending && (
          <form onSubmit={handleVerifyUpload} className="space-y-6">
            {isRejected && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-800 leading-relaxed">
                  <p className="font-bold">Documents d'identité refusés</p>
                  {profile.verification_rejection_reason ? (
                    <p className="mt-1 font-semibold">Raison : {profile.verification_rejection_reason}</p>
                  ) : (
                    <p className="mt-1">Vos documents ne permettaient pas de valider votre identité. Veuillez les renvoyer en veillant à la clarté et lisibilité des pièces.</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600 leading-relaxed">
                <p className="font-bold text-gray-800">Pourquoi vérifier mon profil ?</p>
                <p className="mt-0.5">La certification apporte une coche bleue sur votre profil de l'annuaire, augmente votre visibilité et permet de rassurer les clients sur l'authenticité de vos courses.</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Field 1: CNI */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 pl-1">
                  1. Pièce d'identité (CNI, Passeport ou Permis)
                </label>
                <label className={`w-full flex items-center gap-3.5 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                  verifyCniFile 
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100/70'
                }`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    verifyCniFile ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {verifyCniFile ? <CheckCircle className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {verifyCniFile ? verifyCniFile.name : "Importer le recto de votre pièce"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {verifyCniFile ? 'Fichier sélectionné' : 'Format image ou PDF (max 5 Mo)'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setVerifyCniFile(file);
                    }}
                  />
                </label>
              </div>

              {/* Field 2: Selfie */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 pl-1">
                  2. Selfie avec votre pièce d'identité
                </label>
                <label className={`w-full flex items-center gap-3.5 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                  verifySelfieFile 
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100/70'
                }`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    verifySelfieFile ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {verifySelfieFile ? <CheckCircle className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {verifySelfieFile ? verifySelfieFile.name : "Prendre un selfie avec la pièce"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {verifySelfieFile ? 'Fichier sélectionné' : 'Votre visage et les écritures de la pièce doivent être lisibles'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setVerifySelfieFile(file);
                    }}
                  />
                </label>
              </div>

              {/* Field 3: Portrait live */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 pl-1">
                  3. Photo de profil professionnelle (Portrait)
                </label>
                <label className={`w-full flex items-center gap-3.5 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                  verifyPortraitFile 
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100/70'
                }`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    verifyPortraitFile ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {verifyPortraitFile ? <CheckCircle className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {verifyPortraitFile ? verifyPortraitFile.name : "Photo de portrait de face"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {verifyPortraitFile ? 'Fichier sélectionné' : 'Pour la photo affichée aux clients (fond uni conseillé)'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setVerifyPortraitFile(file);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || !verifyCniFile || !verifySelfieFile || !verifyPortraitFile}
                className="w-full py-4 bg-primary hover:bg-primary-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Soumission en cours...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Soumettre pour certification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {submitting && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border border-gray-100 space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
              <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              <Shield className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Certification de sécurité</h3>
              <p className="text-xs text-gray-500 mt-1">Analyse et enregistrement sécurisé en cours...</p>
            </div>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  submissionStep === 'uploading' 
                    ? 'bg-primary text-white animate-pulse' 
                    : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {submissionStep === 'uploading' ? '●' : '✓'}
                </div>
                <span className={`text-xs font-bold ${submissionStep === 'uploading' ? 'text-gray-900' : 'text-gray-400'}`}>
                  Téléchargement des justificatifs...
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  submissionStep === 'ai_checking' 
                    ? 'bg-primary text-white animate-pulse' 
                    : submissionStep === 'uploading' 
                      ? 'bg-gray-100 text-gray-400' 
                      : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {submissionStep === 'ai_checking' ? '●' : submissionStep === 'uploading' ? '2' : '✓'}
                </div>
                <span className={`text-xs font-bold ${submissionStep === 'ai_checking' ? 'text-gray-900' : 'text-gray-400'}`}>
                  Détection IA Anti-Deepfake...
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  submissionStep === 'saving' 
                    ? 'bg-primary text-white animate-pulse' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {submissionStep === 'saving' ? '●' : '3'}
                </div>
                <span className={`text-xs font-bold ${submissionStep === 'saving' ? 'text-gray-900' : 'text-gray-400'}`}>
                  Enregistrement de votre dossier...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;
