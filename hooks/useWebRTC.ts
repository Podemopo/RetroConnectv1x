// File: hooks/useWebRTC.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import InCallManager from 'react-native-incall-manager';
import {
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import { supabase } from '../supabase';

export type IceConnectionState =
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'disconnected'
  | 'closed';

// ✅ EXPANDED STUN/TURN Server Configuration
const pcConfig = {
  iceServers: [
    // More Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Other public STUN servers
    { urls: 'stun:stun.nextcloud.com:443' },
    { urls: 'stun:stun.twilio.com:3478' },
    // NOTE: The free TURN server below is for testing only.
    // For a production app, you should use a paid, reliable TURN service
    // from providers like Twilio, Metered, or Xirsys.
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
        urls: "turn:global.relay.metered.ca:80",
        username: "10143c3fd62cbd456f644594",
        credential: "k8cDukQCr4wGytyf",
    },
  ],
};


export const useWebRTC = (callId: string | null, userId: string | null) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [iceConnectionState, setIceConnectionState] = useState<IceConnectionState>('new');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      (peerConnectionRef.current as any).oniceconnectionstatechange = null;
      (peerConnectionRef.current as any).ontrack = null;
      (peerConnectionRef.current as any).onicecandidate = null;
      if (peerConnectionRef.current.signalingState !== 'closed') {
        peerConnectionRef.current.close();
      }
      peerConnectionRef.current = null;
    }
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteStream(null);
    remoteStreamRef.current = null;
    setIceConnectionState('closed');
    InCallManager.stop();
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const setupStreams = useCallback(async (isCaller: boolean, callType: 'video' | 'voice') => {
    if (peerConnectionRef.current) {
      return;
    }
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
    setLocalStream(stream);
    localStreamRef.current = stream;
    peerConnectionRef.current = new RTCPeerConnection(pcConfig);

    (peerConnectionRef.current as any).oniceconnectionstatechange = () => {
      if (peerConnectionRef.current) {
        setIceConnectionState(peerConnectionRef.current.iceConnectionState as IceConnectionState);
      }
    };

    stream.getTracks().forEach((track: MediaStreamTrack) => {
      peerConnectionRef.current!.addTrack(track, stream);
    });

    (peerConnectionRef.current as any).ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
            const stream = event.streams[0];
            setRemoteStream(stream);
            remoteStreamRef.current = stream;
        }
    };

    InCallManager.start({
        media: callType === 'voice' ? 'audio' : 'video',
        ringback: isCaller ? '_DEFAULT_' : ''
    });

  }, []);

  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current || !callId || !userId) return;

    (peerConnectionRef.current as any).onicecandidate = async (event: any) => {
      if (event.candidate) {
        await supabase.from('ice_candidates').insert({
            call_id: callId,
            sender_id: userId,
            candidate: event.candidate.toJSON()
        });
      }
    };

    try {
      const offer = await peerConnectionRef.current.createOffer({});
      await peerConnectionRef.current.setLocalDescription(offer);
      await supabase.from('calls').update({ offer }).eq('id', callId);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [callId, userId]);

  const createAnswer = useCallback(async (offer: RTCSessionDescription) => {
    if (!peerConnectionRef.current || !callId || !userId) return;

    (peerConnectionRef.current as any).onicecandidate = async (event: any) => {
      if (event.candidate) {
        await supabase.from('ice_candidates').insert({
            call_id: callId,
            sender_id: userId,
            candidate: event.candidate.toJSON()
        });
      }
    };

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      await supabase.from('calls').update({ answer, status: 'answered', started_at: new Date().toISOString() }).eq('id', callId);
    } catch (error) {
      console.error('Error creating answer:', error);
    }
  }, [callId, userId]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  }, [localStream]);

  const switchCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track._switchCamera();
      });
    }
  }, [localStream]);

  const requestVideoUpgrade = useCallback(async () => {
    if (!callId || !userId) return;
    await supabase
      .from('calls')
      .update({ upgrade_status: 'requested', upgrade_requester: userId })
      .eq('id', callId);
  }, [callId, userId]);

  const upgradeToVideo = useCallback(async () => {
    if (!localStream || !peerConnectionRef.current || !callId) return;

    const videoStream = await mediaDevices.getUserMedia({ video: true, audio: false });
    const videoTrack = videoStream.getVideoTracks()[0];

    localStream.addTrack(videoTrack);
    peerConnectionRef.current.addTrack(videoTrack, localStream);

    setLocalStream(new MediaStream(localStream.getTracks()));

    const offer = await peerConnectionRef.current.createOffer({});
    await peerConnectionRef.current.setLocalDescription(offer);

    await supabase
      .from('calls')
      .update({ offer: offer, call_type: 'video' })
      .eq('id', callId);
  }, [localStream, callId]);

  const setSpeakerphoneOn = useCallback((enabled: boolean) => {
    InCallManager.setForceSpeakerphoneOn(enabled);
  }, []);


  return {
    localStream,
    remoteStream,
    iceConnectionState,
    peerConnection: peerConnectionRef.current,
    setupStreams,
    createOffer,
    createAnswer,
    cleanup,
    toggleAudio,
    toggleVideo,
    upgradeToVideo,
    requestVideoUpgrade,
    setSpeakerphoneOn,
    switchCamera,
  };
};