import { Capacitor } from '@capacitor/core';

/**
 * Service utilitaire pour les fonctionnalités mobiles natives de DaloaDelivery.
 * Gestion prioritaire du GPS haute précision pour la vérification des livraisons et OTP.
 */

export interface DeliveryPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export class DeliveryMobileService {
  /**
   * Indique si l'application s'exécute sur iOS ou Android en natif.
   */
  public static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Vibration haptique à la réception ou acceptation d'une livraison.
   */
  public static async triggerNewOrderVibration(): Promise<void> {
    if (!this.isNative()) return;
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Ignorer si non disponible
    }
  }

  /**
   * Obtient la position GPS précise du livreur pour le contrôle de distance (≤ 100m).
   */
  public static async getDelivererLocation(): Promise<DeliveryPosition | null> {
    if (this.isNative()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
      } catch (err) {
        console.warn('[DeliveryMobile] Erreur GPS natif livreur:', err);
      }
    }

    // Fallback navigateur web HTML5
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy
        }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
  }

  /**
   * Capture une photo de preuve au ramassage (pickup) ou à la livraison (delivery).
   */
  public static async captureDeliveryProofPhoto(): Promise<string | null> {
    if (this.isNative()) {
      try {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const photo = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
        });
        return photo.base64String ? `data:image/jpeg;base64,${photo.base64String}` : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}
