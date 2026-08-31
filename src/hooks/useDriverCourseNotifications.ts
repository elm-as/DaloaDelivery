import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface DriverNotificationsProps {
  isAvailable: boolean;
  driverZone?: string[];
}

export function useDriverCourseNotifications({ isAvailable, driverZone }: DriverNotificationsProps) {
  const realtimeSubscribed = useRef(false);

  // Play synth audio beep and trigger intense vibration pattern
  const playCourseAlert = useCallback(async (title: string, body: string, url: string = '/dashboard') => {
    // 1. Audio Synth Beep (HTML5 AudioContext)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio synth failed:', e);
    }

    // 2. Mobile Device Prolonged Vibration Pattern [500ms vibrer, 200ms pause, 500ms vibrer, 200ms pause, 500ms vibrer]
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([500, 200, 500, 200, 500]);
      } catch (e) {
        console.warn('Vibration failed:', e);
      }
    }

    // 3. System SW PWA Push Notification
    if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
          body,
          icon: '/android-chrome-192x192.png',
          badge: '/favicon-32x32.png',
          vibrate: [500, 200, 500, 200, 500],
          tag: `daloadelivery-course-${Date.now()}`,
          renotify: true,
          data: { url },
        });
      } catch (e) {
        console.warn('Service Worker notification failed:', e);
      }
    }
  }, []);

  // Request notification permission if needed
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Listen to Supabase Realtime for new pending orders / courses when driver is available
  useEffect(() => {
    if (!isAvailable || realtimeSubscribed.current) return;

    realtimeSubscribed.current = true;
    const channelId = `driver_courses_realtime_${Date.now()}`;
    const channel = supabase.channel(channelId);

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        const order = payload.new;
        if (order && (order.status === 'paid' || order.status === 'pending')) {
          const pickup = order.pickup_district || 'Daloa';
          const amount = order.delivery_fee || order.total_amount || 0;

          playCourseAlert(
            '🛵 NOUVELLE COURSE DISPONIBLE !',
            `Nouvelle livraison à ${pickup} (${amount} FCFA). Touchez pour accepter.`,
            '/dashboard'
          );
        }
      }
    );

    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        const order = payload.new;
        const oldOrder = payload.old;

        // If order status changed to paid (waiting for pickup)
        if (order && oldOrder && oldOrder.status !== 'paid' && order.status === 'paid') {
          const pickup = order.pickup_district || 'Daloa';
          playCourseAlert(
            '⚡ ALERTE COURSE EN ATTENTE !',
            `Une commande vient d'être payée à ${pickup}. Course prête à être récupérée !`,
            '/dashboard'
          );
        }
      }
    );

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'seller_delivery_affiliations',
      },
      (payload) => {
        const aff = payload.new;
        if (aff && aff.status === 'pending') {
          playCourseAlert(
            '🤝 NOUVELLE DEMANDE D\'AFFILIATION !',
            'Un vendeur souhaite vous affilier comme livreur dédié. Touchez pour voir la demande.',
            '/affiliations'
          );
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      realtimeSubscribed.current = false;
    };
  }, [isAvailable, driverZone, playCourseAlert]);

  return { playCourseAlert };
}
