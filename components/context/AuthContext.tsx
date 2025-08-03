// sdaw/components/context/AuthContext.tsx
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useCallStore } from '../../components/context/callStore';
import { supabase } from '../../supabase';

export type UserProfile = {
  id: string;
  updated_at?: string;
  username: string;
  fullName: string;
  profilePhotoUrl: string;
  bio?: string;
  city?: string;
  status: 'verified' | 'full verified' | 'suspend' | 'pending_approval';
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  requireLogin: (action: () => void) => void;
  isLoginPromptVisible: boolean;
  closeLoginPrompt: () => void;
  refetchUserProfile: () => Promise<void>;
  unreadNotificationsCount: number;
  markAllNotificationsAsRead: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoginPromptVisible, setLoginPromptVisible] = useState(false);
  const [postLoginAction, setPostLoginAction] = useState<(() => void) | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const { initCallListener, cleanupCallListener } = useCallStore(state => state.actions);

  const refetchUserProfile = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();

      if (error) {
        console.error("Error refetching user profile:", error.message);
        if (error.code === 'PGRST116') {
            await supabase.auth.signOut();
            Alert.alert("Session Expired", "Your session has ended. Please sign in again.");
        }
      } else {
        setUserProfile(profile as UserProfile);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      if (initialSession?.user) {
        await initCallListener(initialSession.user.id);
        await refetchUserProfile();
      }
      setLoading(false);
    };
    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        if (_event === "SIGNED_IN" && newSession?.user) {
          await initCallListener(newSession.user.id);
          await refetchUserProfile();
          if (postLoginAction) {
            postLoginAction();
            setPostLoginAction(null);
          }
        }
        if (_event === "SIGNED_OUT") {
          await cleanupCallListener();
          setUserProfile(null);
        }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [postLoginAction, refetchUserProfile, initCallListener, cleanupCallListener]);

  // ✅ FIX: Re-initialize listener when app becomes active.
  useEffect(() => {
    if (!session?.user) return;

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        console.log('App is active, re-initializing call listener.');
        initCallListener(session.user.id);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [session, initCallListener]);

  useEffect(() => {
    if (session?.user) {
      const interval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('status')
            .eq('id', session.user.id)
            .single();


          if (error || (data && data.status === 'suspend')) {
            console.log("User account is suspended or inaccessible. Forcing sign-out.");
            await supabase.auth.signOut();
            Alert.alert(
                "Account Suspended",
                "Your account has been suspended. Please contact support for assistance."
            );
          }
        } catch (e) {
            console.error("Error in status check interval:", e);
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [session]);


  useEffect(() => {
    if (!session?.user) {
      setUnreadNotificationsCount(0);
      return;
    }

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('read', false);

      if (!error) {
        setUnreadNotificationsCount(count || 0);
      }
    };

    fetchCount();

    const channel = supabase
      .channel(`unread_notifications_count:${session.user.id}`)
      .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const requireLogin = useCallback((action: () => void) => {
    if (session) {
      action();
    } else {
      setPostLoginAction(() => action);
      setLoginPromptVisible(true);
    }
  }, [session]);

  const closeLoginPrompt = useCallback(() => {
    setLoginPromptVisible(false);
    setPostLoginAction(null);
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!session?.user || unreadNotificationsCount === 0) return;
    setUnreadNotificationsCount(0);
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false);
  }, [session, unreadNotificationsCount]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!session?.user) return;
    setUnreadNotificationsCount(prev => (prev > 0 ? prev - 1 : 0));
    await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
  }, [session]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    userProfile,
    loading,
    requireLogin,
    isLoginPromptVisible,
    closeLoginPrompt,
    refetchUserProfile,
    unreadNotificationsCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
  }), [session, userProfile, loading, requireLogin, isLoginPromptVisible, closeLoginPrompt, refetchUserProfile, unreadNotificationsCount, markAllNotificationsAsRead, markNotificationAsRead]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};