import { createContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  banned?: boolean | null;
  [key: string]: unknown;
}

export interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

export const SupabaseContext = createContext<SupabaseContextType | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProfile = async (userId: string) => {
      try {
        // Profil complet (colonnes privées comprises) : la vue `users_private`
        // ne rend que la ligne de l'utilisateur connecté.
        const { data: row, error } = await supabase
          .from('users_private')
          .select('*')
          .eq('id', userId)
          .single();
        const data = row as unknown as UserProfile | null;
        if (active && !error && data) {
          // Auto-fill full_name and avatar_url from Google OAuth metadata if missing
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const meta = currentUser?.user_metadata;
          if (meta) {
            const googleName = meta.full_name || meta.name || null;
            const googleAvatar = meta.avatar_url || meta.picture || null;
            const needsName = !data.full_name && googleName;
            const needsAvatar = !data.avatar_url && googleAvatar;
            if (needsName || needsAvatar) {
              const patch: { full_name?: string; avatar_url?: string } = {};
              if (needsName) patch.full_name = googleName;
              if (needsAvatar) patch.avatar_url = googleAvatar;
              try {
                const { error: patchErr } = await supabase
                  .from('users').update(patch).eq('id', userId);
                if (!patchErr) {
                  setUserProfile({ ...data, ...patch });
                  return;
                }
              } catch (err) { console.error('Error auto-filling Google profile:', err); }
            }
          }
          setUserProfile(data);
        } else if (active && (!data || error)) {
          // Auto-create initial profile for Google / OAuth user if not found in public.users
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser && currentUser.id === userId) {
            const meta = currentUser.user_metadata;
            const googleName = (meta?.full_name || meta?.name || null) as string | null;
            const googleAvatar = (meta?.avatar_url || meta?.picture || null) as string | null;
            try {
              const { data: created, error: createErr } = await supabase
                .from('users')
                .upsert({
                  id: userId,
                  // Un compte OAuth a toujours un e-mail ; la colonne est obligatoire.
                  email: currentUser.email ?? '',
                  full_name: googleName,
                  avatar_url: googleAvatar,
                }, { onConflict: 'id' })
                .select('id')
                .maybeSingle();

              if (!createErr && created) {
                const { data: fresh } = await supabase
                  .from('users_private').select('*').eq('id', userId).maybeSingle();
                if (fresh) setUserProfile(fresh as unknown as UserProfile);
              }
            } catch (err) {
              console.error('Error auto-creating user profile in DaloaDelivery:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: SupabaseContextType = {
    user,
    session,
    userProfile,
    loading,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}
