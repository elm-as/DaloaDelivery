import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getNetAmount } from '../lib/formatUtils';

interface DriverNotificationsProps {
  isAvailable: boolean;
  driverZone?: string[];
}

export function useDriverCourseNotifications({ isAvailable, driverZone }: DriverNotificationsProps) {
  const realtimeSubscribed = useRef(false);

  const playCourseAlert = useCallback(async (title: string, body: string, url: string = '/dashboard') => {
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

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([500, 200, 500, 200, 500]);
      } catch (e) {
        console.warn('Vibration failed:', e);
      }
    }

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
        } as NotificationOptions & { vibrate?: number[]; renotify?: boolean });
      } catch (e) {
        console.warn('Service Worker notification failed:', e);
      }
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
        table: 'delivery_assignments',
      },
      (payload) => {
        const assignment = payload.new as any;
        if (assignment && assignment.status === 'awaiting_pickup' && !assignment.delivery_person_id) {
          const pickup = assignment.pickup_location || 'Daloa';
          const netFee = getNetAmount(Number(assignment.delivery_price) || 500);
          playCourseAlert(
            '🛵 NOUVELLE COURSE DISPONIBLE !',
            `Retrait à ${pickup} (Gain net : ${netFee} FCFA). Touchez pour accepter.`,
            `/course/${assignment.id}`
          );
        }
      }
    );

    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_assignments',
      },
      (payload) => {
        const assignment = payload.new as any;
        const oldAssignment = payload.old as any;
        if (
          assignment &&
          oldAssignment &&
          oldAssignment.status !== 'awaiting_pickup' &&
          assignment.status === 'awaiting_pickup' &&
          !assignment.delivery_person_id
        ) {
          const pickup = assignment.pickup_location || 'Daloa';
          const netFee = getNetAmount(Number(assignment.delivery_price) || 500);
          playCourseAlert(
            '⚡ COURSE PRÊTE AU RETRAIT !',
            `Le vendeur a confirmé le colis à ${pickup} (Gain net : ${netFee} FCFA).`,
            `/course/${assignment.id}`
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
        const aff = payload.new as any;
        if (aff && aff.status === 'pending') {
          playCourseAlert(
            "🤝 NOUVELLE DEMANDE D'AFFILIATION !",
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
