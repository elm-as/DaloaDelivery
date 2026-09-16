import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const AuthStep = ({ formData, updateField, showPassword, setShowPassword }: any) => {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/devenir-livreur` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion Google';
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div
      key="step-auth"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-3xl shadow-strong p-6 border border-grey-100"
    >
      <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-grey-900 mb-2">Créer un compte livreur</h2>
      <p className="text-xs text-grey-500 mb-6">
        Ces identifiants vous permettront d'accéder à votre espace coursier.
      </p>

      {/* Google OAuth Button */}
      <button
        type="button"
        disabled={googleLoading}
        onClick={handleGoogleAuth}
        className="w-full mb-5 flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-grey-200 bg-white text-[#3c4043] font-bold text-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {googleLoading ? (
          <div className="w-5 h-5 border-2 border-grey-300 border-t-grey-600 rounded-full animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        )}
        Continuer avec Google
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-grey-200" />
        <span className="text-xs text-grey-400 font-medium">ou avec votre e-mail</span>
        <div className="flex-1 h-px bg-grey-200" />
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="votre@email.com"
              className="w-full pl-12 pr-4 py-3.5 bg-grey-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-12 py-3.5 bg-grey-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-grey-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Confirmer mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-12 pr-12 py-3.5 bg-grey-50 border-none rounded-2xl focus:ring-2 outline-none font-medium text-sm ${
                formData.confirmPassword && formData.confirmPassword !== formData.password
                  ? 'focus:ring-error ring-1 ring-error'
                  : 'focus:ring-primary'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-grey-500 space-y-1">
        <div>
          Vous avez déjà un compte DaloaMarket ?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Connectez-vous ici
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
