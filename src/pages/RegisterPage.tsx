import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('Vous devez accepter les conditions générales d\'utilisation');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Inscription réussie !');
      navigate('/dashboard');
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('already registered')) {
        message = "Un compte avec cet e-mail existe déjà sur DaloaMarket/DaloaDelivery. Veuillez utiliser la page de connexion pour vous connecter.";
      }
      setError(message);
      toast.error('Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* App-like Header Background */}
      <div className="bg-primary px-4 pt-12 pb-24 rounded-b-[40px] shadow-sm relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg -rotate-3">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenue !</h1>
          <p className="text-primary-100 text-sm">Créez votre compte DaloaDelivery</p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-10 relative z-20 pb-10">
        <div className="bg-white rounded-3xl shadow-strong p-6 border border-grey-100">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-error-50 rounded-2xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-600 font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-grey-900 mb-2 pl-1">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-grey-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-colors font-medium text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-grey-900 mb-2 pl-1">
                Mot de passe <span className="font-normal text-grey-400">(6+ caractères)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-grey-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-colors font-medium text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-grey-400 active:scale-95"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-bold text-grey-900 mb-2 pl-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-12 pr-12 py-3.5 bg-grey-50 border-none rounded-2xl focus:ring-2 outline-none transition-colors font-medium text-sm ${
                    confirmPassword && confirmPassword !== password
                      ? 'focus:ring-error ring-1 ring-error'
                      : 'focus:ring-primary'
                  }`}
                />
              </div>
            </div>

            <label className="flex items-start gap-3 bg-primary-50/50 p-4 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-primary rounded-md focus:ring-primary accent-primary cursor-pointer"
              />
              <span className="text-xs font-medium text-grey-700 leading-relaxed">
                J'accepte les{' '}
                <Link to="/terms" target="_blank" className="text-primary font-bold underline" onClick={(e) => e.stopPropagation()}>
                  Conditions Générales d'Utilisation
                </Link>
                {' '}et j'ai pris connaissance de la{' '}
                <Link to="/privacy" target="_blank" className="text-primary font-bold underline" onClick={(e) => e.stopPropagation()}>
                  Politique de Confidentialité
                </Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-medium text-grey-500">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
