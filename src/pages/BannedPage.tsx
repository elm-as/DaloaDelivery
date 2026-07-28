import { useState, useEffect } from 'react';
import { Ban, Send, ShieldCheck, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function BannedPage() {
  const { user, userProfile } = useSupabase();
  const navigate = useNavigate();

  const [banReason, setBanReason] = useState<string | null>(null);
  const [appealReasonText, setAppealReasonText] = useState('');
  const [appealStatus, setAppealStatus] = useState<string | null>(null);
  const [appealReasonSaved, setAppealReasonSaved] = useState<string | null>(null);

  const [appealInput, setAppealInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);

  // Fetch full details for the logged-in user
  const fetchUserBanDetails = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('banned, ban_reason, ban_appeal_status, ban_appeal_reason')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        if (!data.banned) {
          toast.success('Votre compte a été réactivé !');
          window.location.href = '/';
          return;
        }
        setBanReason(data.ban_reason);
        setAppealStatus(data.ban_appeal_status);
        setAppealReasonSaved(data.ban_appeal_reason);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    document.title = 'Compte suspendu - DaloaDelivery';
    fetchUserBanDetails();
  }, [user?.id]);

  // Redirect automatically if userProfile is not banned
  useEffect(() => {
    if (userProfile && !userProfile.banned) {
      navigate('/', { replace: true });
    }
  }, [userProfile, navigate]);

  // Real-time listener on user row
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`delivery-user-ban-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && payload.new.banned === false) {
            toast.success('Votre compte a été réactivé ! Redirection...');
            window.location.href = '/';
          } else {
            fetchUserBanDetails();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleManualCheck = async () => {
    setCheckingStatus(true);
    await fetchUserBanDetails();
    setCheckingStatus(false);
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealInput.trim()) {
      toast.error('Veuillez expliciter la raison de votre contestation');
      return;
    }

    setSubmitting(true);
    try {
      const { error: rpcError } = await supabase.rpc('submit_ban_appeal', {
        p_reason: appealInput.trim(),
      });

      if (rpcError) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            ban_appeal_reason: appealInput.trim(),
            ban_appeal_status: 'pending',
            ban_appealed_at: new Date().toISOString(),
          } as any)
          .eq('id', user?.id);

        if (updateError) throw updateError;
      }

      toast.success('Votre contestation a été enregistrée');
      setShowAppealForm(false);
      await fetchUserBanDetails();
    } catch (err: any) {
      toast.error(err.message || 'Impossible d\'enregistrer la contestation');
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = appealStatus === 'pending';

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-grey-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-grey-100 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6 text-red-500"
        >
          <Ban size={40} />
        </motion.div>

        <h1 className="text-2xl font-bold text-grey-900 mb-2">
          Compte suspendu
        </h1>
        <p className="text-grey-600 mb-6 leading-relaxed text-sm">
          Votre compte livreur / utilisateur a été suspendu pour non-respect des règles.
        </p>

        {/* Motif du bannissement */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wide mb-1">
            <AlertCircle size={16} />
            Motif de la suspension
          </div>
          <p className="text-sm font-medium text-grey-800">
            {banReason || (userProfile?.ban_reason as string) || 'Non-respect des conditions d\'utilisation.'}
          </p>
        </div>

        {/* Formulaire de contestation */}
        <div className="space-y-4 text-left">
          {isPending ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wide mb-2">
                <Clock size={16} />
                Contestation transmise au support
              </div>
              <p className="text-xs text-grey-600 mb-2">
                Votre demande est actuellement examinée par notre équipe.
              </p>
              <div className="bg-white rounded-xl p-3 text-xs text-grey-800 border border-grey-200">
                <span className="font-semibold">Votre message :</span> "{appealReasonSaved}"
              </div>
            </div>
          ) : (
            <>
              {!showAppealForm ? (
                <button
                  onClick={() => setShowAppealForm(true)}
                  className="w-full py-3.5 px-4 bg-grey-900 hover:bg-black text-white font-medium rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Contester ce bannissement
                </button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleSubmitAppeal}
                  className="bg-grey-50 border border-grey-200 rounded-2xl p-4 space-y-3"
                >
                  <label className="block text-xs font-bold text-grey-700 uppercase tracking-wide">
                    Explication de votre contestation
                  </label>
                  <textarea
                    rows={4}
                    value={appealInput}
                    onChange={(e) => setAppealInput(e.target.value)}
                    placeholder="Saisissez ici les motifs de votre contestation..."
                    className="w-full p-3 rounded-xl bg-white border border-grey-300 text-sm text-grey-900 focus:ring-2 focus:ring-grey-900 outline-none resize-none"
                    required
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAppealForm(false)}
                      className="px-3 py-2 text-xs font-medium text-grey-600 hover:bg-grey-200 rounded-xl"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send size={14} />
                      {submitting ? 'Envoi...' : 'Envoyer la contestation'}
                    </button>
                  </div>
                </motion.form>
              )}
            </>
          )}
        </div>

        {/* Bouton pour réactualiser l'état (PWA fix) */}
        <div className="mt-8 pt-6 border-t border-grey-100 flex flex-col items-center gap-3">
          <button
            onClick={handleManualCheck}
            disabled={checkingStatus}
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary-600 hover:underline disabled:opacity-50"
          >
            <RefreshCw size={14} className={checkingStatus ? 'animate-spin' : ''} />
            {checkingStatus ? 'Vérification...' : 'Vérifier si j\'ai été débanni'}
          </button>
          <p className="text-[xs] text-grey-400">
            Dès que l'administrateur valide votre débannissement, l'application se débloque immédiatement.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
