import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuthStep = ({ formData, updateField, showPassword, setShowPassword }: any) => {
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
      <h2 className="text-xl font-bold text-grey-900 mb-6">Créer un compte</h2>
      
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

      <div className="mt-6 text-center text-sm text-grey-500">
        Déjà inscrit ?{' '}
        <Link to="/login" className="text-primary font-bold hover:underline">
          Se connecter
        </Link>
      </div>
    </motion.div>
  );
};
