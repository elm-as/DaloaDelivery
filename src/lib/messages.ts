/**
 * Messages utilisateur centralisés — 100% Français, clairs et non techniques pour DaloaDelivery.
 * Convertit toute erreur brute (Supabase, réseau, Auth, API) en message compréhensible.
 */

const TECHNICAL_PATTERNS = [
  /^supabase/i,
  /jwt/i,
  /uuid/i,
  /violates.*constraint/i,
  /duplicate key/i,
  /^postgres/i,
  /^pgrst/i,
  /^auth\//i,
  /failed to fetch/i,
  /networkerror/i,
  /econnrefused/i,
  /timeout/i,
  /^http \d/i,
  /json object requested/i,
  /schema cache/i,
  /unexpected token/i,
  /internal server error/i,
];

/** Convertit une erreur (technique, API, Supabase ou réseau) en message français limpide. */
export function friendlyError(err: unknown, fallback = 'Une erreur est survenue. Veuillez réessayer.'): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';

  if (!raw) return fallback;

  // Cas réseau & serveurs
  if (/failed to fetch|networkerror|econnrefused|network request failed/i.test(raw)) {
    return 'Connexion impossible. Vérifiez votre connexion internet et réessayez.';
  }
  if (/timeout|timed out|abort/i.test(raw)) {
    return 'Le serveur met trop de temps à répondre. Réessayez dans un instant.';
  }

  // Cas Authentification Supabase
  if (/invalid login|invalid credentials|invalid_grant|user not found/i.test(raw)) {
    return 'Adresse email ou mot de passe incorrect.';
  }
  if (/email.*not.*confirmed|unconfirmed/i.test(raw)) {
    return 'Veuillez confirmer votre adresse email avant de vous connecter.';
  }
  if (/user already registered|already exists|signup_disabled/i.test(raw)) {
    return 'Un compte existe déjà avec cette adresse email.';
  }
  if (/password.*should|weak password|password too short/i.test(raw)) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (/jwt.*expired|session.*expired|invalid session/i.test(raw)) {
    return 'Votre session a expiré. Veuillez vous reconnecter.';
  }
  if (/not authenticated|unauthorized|user not logged in/i.test(raw)) {
    return 'Vous devez être connecté pour effectuer cette action.';
  }
  if (/permission denied|not authorized|row-level security|forbidden/i.test(raw)) {
    return 'Action non autorisée ou droits insuffisants.';
  }
  if (/too many requests|rate limit/i.test(raw)) {
    return 'Trop de tentatives en peu de temps. Veuillez patienter une minute.';
  }
  if (/pgrst116|no rows|zero rows|row not found/i.test(raw)) {
    return 'L’élément recherché est introuvable.';
  }

  // Si c'est manifestement technique → fallback français
  if (TECHNICAL_PATTERNS.some((p) => p.test(raw))) {
    return fallback;
  }

  // Si le message est déjà en français et lisible, on le conserve
  if (raw.length < 150 && /[a-zàâéèêëîïôûüç]/i.test(raw)) {
    return raw;
  }

  return fallback;
}

/** Messages standards réutilisables pour les livreurs. */
export const MSG = {
  // Auth
  signOutSuccess: 'À bientôt !',
  signOutError: 'Impossible de vous déconnecter pour le moment.',
  loginSuccess: 'Connexion réussie !',
  loginError: 'Connexion impossible. Vérifiez vos identifiants.',
  registerSuccess: 'Inscription enregistrée !',
  registerError: "Échec de l'inscription. Veuillez réessayer.",

  // Livraisons
  deliveryAccepted: 'Course acceptée avec succès !',
  deliveryAcceptError: 'Impossible d’accepter cette course (déjà assignée ou indisponible).',
  pickupConfirmed: 'Colis récupéré avec succès !',
  deliveryCompleted: 'Livraison finalisée avec succès !',
  otpInvalid: 'Le code de validation OTP est incorrect.',
  locationError: 'Impossible d’obtenir votre position GPS. Activez la géolocalisation.',

  // Profil livreur
  profileUpdated: 'Profil mis à jour avec succès.',
  profileUpdateError: 'Impossible de mettre à jour votre profil.',
  photoUploadError: 'Impossible de téléverser la photo (5 Mo max).',
} as const;
