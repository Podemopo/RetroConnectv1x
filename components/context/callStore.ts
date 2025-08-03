// ../components/context/callStore.ts
import { router } from 'expo-router';
import InCallManager from 'react-native-incall-manager';
import { create } from 'zustand';
import { supabase } from '../../supabase';

interface CallState {
  incomingCall: {
    callId: string;
    callerName: string;
    callerAvatar: string;
    callType: 'video' | 'voice';
    offer: any;
    conversationId?: string;
  } | null;
  actions: {
    initCallListener: (userId: string) => Promise<void>;
    cleanupCallListener: () => Promise<void>;
    acceptCall: () => void;
    declineCall: () => Promise<void>;
  };
}

let callListener: any = null;

export const useCallStore = create<CallState>((set, get) => ({
  incomingCall: null,
  actions: {
    initCallListener: async (userId) => {
      // ✅ FIX: Make the function async and explicitly await the removal of the old channel.
      if (callListener) {
        await supabase.removeChannel(callListener);
        callListener = null;
      }

      console.log(`[callStore] Initializing call listener for user: ${userId}`);
      callListener = supabase
        .channel(`calls_for_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'calls',
            filter: `callee_id=eq.${userId}`,
          },
          async (payload) => {
            const newCall = payload.new as any;
            const currentCall = get().incomingCall;
            const terminalStatuses = ['declined', 'ended', 'missed'];

            if (newCall.status === 'dialing') {
              if (!currentCall || currentCall.callId === newCall.id) {
                const { data: callerData } = await supabase
                  .from('users')
                  .select('fullName, profilePhotoUrl')
                  .eq('id', newCall.caller_id)
                  .single();

                set({
                  incomingCall: {
                    callId: newCall.id,
                    callerName: callerData?.fullName || 'Unknown Caller',
                    callerAvatar: callerData?.profilePhotoUrl || '',
                    callType: newCall.call_type,
                    offer: newCall.offer,
                    conversationId: newCall.conversation_id,
                  },
                });
              }
            }
            
            if (currentCall && newCall.id === currentCall.callId && terminalStatuses.includes(newCall.status)) {
              set({ incomingCall: null });
            }
          }
        );
        
      callListener.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[callStore] Successfully subscribed to calls channel for ${userId}`);
          }
      });
    },

    cleanupCallListener: async () => {
      if (callListener) {
        await supabase.removeChannel(callListener);
        callListener = null;
      }
      set({ incomingCall: null });
    },

    acceptCall: () => {
      const { incomingCall } = get();
      if (!incomingCall || !incomingCall.offer) {
        return;
      }
      
      InCallManager.stopRingtone();
      set({ incomingCall: null });

      router.push({
        pathname: '/call',
        params: {
          callId: incomingCall.callId,
          recipientName: incomingCall.callerName,
          recipientAvatar: incomingCall.callerAvatar,
          offer: JSON.stringify(incomingCall.offer),
          callType: incomingCall.callType,
          conversationId: incomingCall.conversationId,
        },
      });
    },

    declineCall: async () => {
      const { incomingCall } = get();
      if (!incomingCall) return;
      
      InCallManager.stopRingtone();
      const callIdToDecline = incomingCall.callId;
      set({ incomingCall: null });
      
      await supabase
        .from('calls')
        .update({ status: 'declined', ended_at: new Date().toISOString() })
        .eq('id', callIdToDecline);
    },
  },
}));