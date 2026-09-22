import { supabase } from './supabase';

/**
 * Enregistrement du jeton push d'un livreur depuis le tableau de bord web.
 *
 * Le service worker (`public/service-worker.js`) sait déjà afficher une
 * notification `push` ; il manquait l'abonnement : aucun livreur web n'avait de
 * ligne dans `push_subscriptions`, donc rien ne pouvait lui être envoyé quand
 * l'onglet était fermé. Les alertes existantes (`useDriverCourseNotifications`)
 * ne fonctionnent que tant que la page est ouverte.
 *
 * La clé VAPID publique doit être celle du serveur d'envoi (Railway), sinon les
 * abonnements produits ici sont inutilisables.
 */
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BCU8msD00uw2OYTKGZ_U-d-2cp2SPo7iQzkapnEP9hVsKzPf_eAZduYOqmmzGz58b0k-zT-Z3ogsymll11ZfRx4';

const PUSH_API_URL = import.meta.env.VITE_PAYMENT_API_URL || 'https://api.daloamarket.com';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Abonne le navigateur et enregistre le jeton en base via le serveur Railway
 * (qui écrit avec la clé service_role, donc sans buter sur les RLS).
 *
 * Retourne `true` si un jeton actif existe en base à la sortie.
 */
export async function registerDeliveryWebPush(userId: string): Promise<boolean> {
  if (!userId || !isPushSupported()) return false;

  try {
    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn('[Push Livreur] Permission refusée, aucun jeton créé.');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    // Un abonnement signé avec une ancienne clé VAPID est rejeté à l'envoi :
    // on le remplace plutôt que de stocker un jeton mort.
    if (subscription) {
      const currentKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const rawKey = subscription.options?.applicationServerKey;
      const subKey = rawKey ? new Uint8Array(rawKey) : null;
      const matches =
        subKey !== null &&
        subKey.length === currentKey.length &&
        subKey.every((v, i) => v === currentKey[i]);

      if (!matches) {
        await subscription.unsubscribe().catch(() => undefined);
        subscription = null;
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    const keys_p256dh = json.keys?.p256dh || '';
    const keys_auth = json.keys?.auth || '';
    if (!keys_p256dh || !keys_auth) return false;

    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      console.warn('[Push Livreur] Session absente, enregistrement reporté.');
      return false;
    }

    const response = await fetch(`${PUSH_API_URL}/push/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys_p256dh,
        keys_auth,
        user_agent: navigator.userAgent,
        // Sans ce champ, le serveur retombe sur 'market' et le livreur est
        // rangé avec les acheteurs : les envois ciblés `delivery` le rateraient.
        app_type: 'delivery',
      }),
    });

    const result = await response.json().catch(() => ({ success: false }));
    if (!response.ok || !result.success) {
      console.error('[Push Livreur] Enregistrement refusé par le serveur:', result.message || response.status);
      return false;
    }

    console.log('[Push Livreur] Jeton enregistré pour', userId);
    return true;
  } catch (err) {
    console.error('[Push Livreur] Échec de l’abonnement:', err);
    return false;
  }
}
