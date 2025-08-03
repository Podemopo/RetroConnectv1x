import { useAuth } from '@/components/context/AuthContext';
import { supabase } from '@/supabase';
import { useCallback, useEffect, useState } from 'react';

export interface CallState {
  id: string;
  callerId: string;
  calleeId: string;
  status: 'dialing' | 'ringing' | 'connected' | 'ended' | 'failed';
  callType: 'audio' | 'video';
  offer?: any;
  answer?: any;
  offerIceCandidates?: any[];
  answerIceCandidates?: any[];
  startedAt?: string;
  endedAt?: string;
  callerName?: string;
  callerAvatar?: string;
}

export const useCallState = () => {
  const { user } = useAuth();
  const [activeCall, setActiveCall] = useState<CallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallState | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  // Subscribe to call status changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('call-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `callee_id=eq.${user.id}`,
        },
        async (payload) => {
          const call = payload.new as any;
          
          if (payload.eventType === 'INSERT' && call.status === 'dialing') {
            // Fetch caller info
            const { data: callerData } = await supabase
              .from('users')
              .select('full_name, avatar_url')
              .eq('id', call.caller_id)
              .single();
            
            setIncomingCall({
              ...call,
              callerName: callerData?.full_name || 'Unknown',
              callerAvatar: callerData?.avatar_url,
            });
          } else if (payload.eventType === 'UPDATE') {
            if (call.status === 'connected') {
              setIncomingCall(null);
              setActiveCall(call);
              setIsCallActive(true);
            } else if (['ended', 'failed', 'declined'].includes(call.status)) {
              setIncomingCall(null);
              setActiveCall(null);
              setIsCallActive(false);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `caller_id=eq.${user.id}`,
        },
        (payload) => {
          const call = payload.new as any;
          
          if (payload.eventType === 'UPDATE') {
            if (call.status === 'connected') {
              setActiveCall(call);
              setIsCallActive(true);
            } else if (['ended', 'failed', 'declined'].includes(call.status)) {
              setActiveCall(null);
              setIsCallActive(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const acceptCall = useCallback(async (callId: string) => {
    await supabase
      .from('calls')
      .update({ 
        status: 'connected', 
        started_at: new Date().toISOString() 
      })
      .eq('id', callId);
  }, []);

  const rejectCall = useCallback(async (callId: string) => {
    await supabase
      .from('calls')
      .update({ 
        status: 'declined', 
        ended_at: new Date().toISOString() 
      })
      .eq('id', callId);
  }, []);

  const endCall = useCallback(async (callId: string) => {
    await supabase
      .from('calls')
      .update({ 
        status: 'ended', 
        ended_at: new Date().toISOString() 
      })
      .eq('id', callId);
  }, []);

  const initiateCall = useCallback(async (calleeId: string, callType: 'audio' | 'video') => {
    const { data, error } = await supabase
      .from('calls')
      .insert({
        caller_id: user?.id,
        callee_id: calleeId,
        call_type: callType,
        status: 'dialing',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }, [user?.id]);

  return {
    activeCall,
    incomingCall,
    isCallActive,
    acceptCall,
    rejectCall,
    endCall,
    initiateCall,
  };
};
