// types/calls.ts
import { RTCSessionDescription } from 'react-native-webrtc';

export type CallStatus = 'dialing' | 'answered' | 'declined' | 'missed' | 'ended';
export type CallType = 'video' | 'voice';

export interface Call {
  id: string;
  created_at: string;
  caller_id: string;
  callee_id: string;
  status: CallStatus;
  call_type: CallType;
  offer?: RTCSessionDescription;
  answer?: RTCSessionDescription;
  started_at?: string;
  ended_at?: string;
  conversation_id?: string;
  // This is a client-side property, not from DB
  callerData?: {
    fullName: string;
    profilePhotoUrl: string;
  };
}