// File: app/call.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RTCIceCandidate, RTCSessionDescription, RTCView } from 'react-native-webrtc';
import { useAuth } from '../components/context/AuthContext';
import { IceConnectionState, useWebRTC } from '../hooks/useWebRTC';
import { supabase } from '../supabase';

const AvatarPlaceholder = ({ name }: { name: string }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <Text style={styles.avatarPlaceholderText}>{initial}</Text>
    </View>
  );
};

const ConnectionIndicator = ({ state }: { state: IceConnectionState }) => {
  let color = '#FFF';
  let text = '';
  let icon: keyof typeof FontAwesome.glyphMap | null = null;
  let showSpinner = false;

  switch (state) {
    case 'checking':
      color = '#F1C40F'; // Yellow
      text = 'Connecting...';
      showSpinner = true;
      break;
    case 'disconnected':
      color = '#E67E22'; // Orange
      text = 'Connection Unstable';
      icon = 'exclamation-triangle';
      break;
    case 'failed':
      color = '#E74C3C'; // Red
      text = 'Connection Failed';
      icon = 'times-circle';
      break;
    case 'connected':
    case 'completed':
      return null;
    default:
      return null;
  }

  return (
    <View style={styles.indicatorContainer}>
      {showSpinner && <ActivityIndicator size="small" color={color} />}
      {icon && <FontAwesome name={icon} size={16} color={color} />}
      <Text style={[styles.indicatorText, { color }]}>{text}</Text>
    </View>
  );
};


export default function CallScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    callId,
    recipientName,
    recipientAvatar,
    offer,
    callType: initialCallType,
    conversationId
  } = useLocalSearchParams<{
    callId: string;
    recipientName: string;
    recipientAvatar: string;
    offer?: string;
    callType: 'video' | 'voice';
    conversationId: string;
  }>();

  const nameParts = recipientName ? recipientName.split(' ') : [];
  let firstNamePart = '';
  let lastNamePart = '';

  if (nameParts.length > 2) {
      lastNamePart = nameParts.slice(-2).join(' ');
      firstNamePart = nameParts.slice(0, -2).join(' ');
  } else if (nameParts.length === 2) {
      lastNamePart = nameParts[1];
      firstNamePart = nameParts[0];
  } else {
      firstNamePart = recipientName;
  }

  const isCaller = !offer;

  const {
    localStream,
    remoteStream,
    iceConnectionState,
    setupStreams,
    createOffer,
    createAnswer,
    cleanup,
    peerConnection,
    toggleAudio,
    toggleVideo,
    upgradeToVideo,
    requestVideoUpgrade,
    setSpeakerphoneOn,
    switchCamera,
  } = useWebRTC(callId, user?.id || null);

  const [callStatus, setCallStatus] = useState(isCaller ? 'Calling...' : 'Connecting...');
  const [isMuted, setIsMuted] = useState(false);
  const [callType, setCallType] = useState<'video' | 'voice'>(initialCallType);
  const [isCameraOff, setIsCameraOff] = useState(initialCallType === 'voice');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callEnded, setCallEnded] = useState(false);
  const [endReason, setEndReason] = useState<'ended' | 'declined' | 'missed' | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  
  const [upgradeInProgress, setUpgradeInProgress] = useState(false);

  const timerRef = useRef<any>(undefined);
  const callEndedRef = useRef(false);

  useEffect(() => {
    const initializeStream = async () => {
      try {
        await setupStreams(isCaller, callType);
      } catch (error: any) {
        setPermissionError(error.message || 'Failed to get media permissions.');
        handleEndCall('ended');
      }
    };
    if (callId) initializeStream();
  }, [callId, setupStreams, isCaller, callType]);

  useEffect(() => {
    if (peerConnection && !permissionError) {
      if (isCaller) {
        createOffer();
      } else if (offer) {
        const parsedOffer = JSON.parse(offer);
        createAnswer(parsedOffer).then(() => {
            setCallStatus('Connected');
        });
      }
    }
  }, [peerConnection, isCaller, createOffer, createAnswer, offer, permissionError]);

  useEffect(() => {
    if (!isCaller) return;
    const timer = setTimeout(() => {
      if (callStatus === 'Calling...') {
        handleEndCall('missed');
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [isCaller, callStatus]);

  useEffect(() => {
    if (callStatus === 'Connected' && !callEnded) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [callStatus, callEnded]);

  useEffect(() => {
    if (!callId || !peerConnection || !user?.id) return;

    const callChannel = supabase
      .channel(`call_${callId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `id=eq.${callId}` },
        async (payload) => {
          const updatedCall = payload.new as any;

          if (['ended', 'declined', 'missed'].includes(updatedCall.status)) {
            handleRemoteEnd(updatedCall.status, updatedCall.ended_at);
            return;
          }

          if (isCaller && updatedCall.answer && !peerConnection.remoteDescription) {
              InCallManager.stopRingback();
              await peerConnection.setRemoteDescription(new RTCSessionDescription(updatedCall.answer));
              setCallStatus('Connected');
          }

          if (updatedCall.upgrade_status === 'requested' && updatedCall.upgrade_requester !== user?.id) {
            setShowUpgradePrompt(true);
          }
          
          if (updatedCall.upgrade_status === 'accepted' && updatedCall.upgrade_requester === user?.id && !upgradeInProgress) {
            setUpgradeInProgress(true);
            await upgradeToVideo();
            setCallType('video');
            setIsCameraOff(false);
          }

          if (updatedCall.upgrade_status === 'declined' && updatedCall.upgrade_requester === user?.id) {
            Alert.alert("Request Declined", `${recipientName} has declined to switch to a video call.`);
          }
        })
      .subscribe();

    const iceChannel = supabase
      .channel(`ice_${callId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ice_candidates', filter: `call_id=eq.${callId}` },
        async (payload) => {
          const newCandidate = payload.new;
          if (newCandidate.sender_id !== user.id && peerConnection?.remoteDescription) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(newCandidate.candidate));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callChannel);
      supabase.removeChannel(iceChannel);
    };
  }, [callId, peerConnection, isCaller, user, upgradeToVideo, recipientName, upgradeInProgress]);

  useEffect(() => {
    if (iceConnectionState === 'failed' && !callEnded) {
      handleEndCall('ended');
    }
  }, [iceConnectionState, callEnded]);


  const handleRemoteEnd = (reason: 'ended' | 'declined' | 'missed', endedAt: string | null) => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    InCallManager.stopRingback();
    setEndTime(endedAt || new Date().toISOString());
    setEndReason(reason);
    setCallStatus('Ended');
    setCallEnded(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    cleanup();
  };

  const handleEndCall = async (reason: 'ended' | 'declined' | 'missed') => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    InCallManager.stopRingback();
    const endedAt = new Date().toISOString();
    setEndTime(endedAt);
    setEndReason(reason);
    setCallStatus('Ended');
    setCallEnded(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    cleanup();
    if (callId) {
      await supabase
        .from('calls')
        .update({ status: reason, ended_at: endedAt })
        .eq('id', callId);
    }
  };

  const exitCallScreen = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleToggleMute = () => {
    toggleAudio();
    setIsMuted(prev => !prev);
  };

  const handleToggleCamera = () => {
    if (callType === 'video') {
      toggleVideo();
      setIsCameraOff(prev => !prev);
    } else {
      requestVideoUpgrade();
      Alert.alert("Request Sent", "A request to switch to a video call has been sent.");
    }
  };

  const handleToggleSpeaker = () => {
    const newSpeakerState = !isSpeakerOn;
    setSpeakerphoneOn(newSpeakerState);
    setIsSpeakerOn(newSpeakerState);
  };

  const handleAcceptUpgrade = async () => {
    if (!callId) return;
    setUpgradeInProgress(true);
    await supabase.from('calls').update({ upgrade_status: 'accepted' }).eq('id', callId);
    await upgradeToVideo();
    setCallType('video');
    setIsCameraOff(false);
    setShowUpgradePrompt(false);
  };

  const handleDeclineUpgrade = async () => {
    if (!callId) return;
    await supabase.from('calls').update({ upgrade_status: 'declined' }).eq('id', callId);
    setShowUpgradePrompt(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const formatEndTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (permissionError) {
    return (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
        <FontAwesome name="exclamation-triangle" size={48} color="#E74C3C" />
        <Text style={styles.errorTitle}>Permission Denied</Text>
        <Text style={styles.errorMessage}>{permissionError}</Text>
        <Text style={styles.errorMessage}>Please enable camera and microphone access in your device settings.</Text>
        <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={() => exitCallScreen()}>
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (callEnded) {
    return (
      <SafeAreaView style={[styles.container, styles.endContainer]}>
        <Text style={styles.endTitle}>
            {endReason === 'declined' ? 'Call Declined' : (endReason === 'missed' ? 'Call Missed' : 'Call Ended')}
        </Text>
        <Text style={styles.endDuration}>Duration: {formatDuration(callDuration)}</Text>
        <Text style={styles.endTime}>Ended at: {endTime ? formatEndTime(endTime) : 'Now'}</Text>
        <TouchableOpacity style={styles.exitButton} onPress={exitCallScreen}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- UI Rendering Logic ---
  return (
    <View style={styles.container}>
      {/* --- Fullscreen Background: Remote video or Avatar --- */}
      {remoteStream && callType === 'video' ? (
        <RTCView streamURL={remoteStream.toURL()} style={styles.backgroundImage} objectFit="cover" />
      ) : (
        recipientAvatar ? (
          <Image source={{ uri: recipientAvatar }} style={styles.backgroundImage} blurRadius={30} />
        ) : (
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#2C3E50' }} />
        )
      )}
      <View style={styles.overlay}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' }}>
          
          {/* --- Main Content: Centered info for voice calls --- */}
          {(callType === 'voice' || !remoteStream) && (
            <View style={styles.mainContent}>
              <View style={styles.avatarContainer}>
                {recipientAvatar ? (
                  <Image source={{ uri: recipientAvatar }} style={styles.avatar} />
                ) : (
                  <AvatarPlaceholder name={recipientName} />
                )}
              </View>
              <View style={styles.recipientNameContainer}>
                <Text style={styles.recipientFirstName} numberOfLines={1}>{firstNamePart}</Text>
                {lastNamePart ? <Text style={styles.recipientLastName} numberOfLines={1}>{lastNamePart}</Text> : null}
              </View>

              {/* ✅ STATUS AND INDICATOR MOVED TO THE MIDDLE */}
              <ConnectionIndicator state={iceConnectionState} />
              <Text style={styles.callStatus}>
                {callStatus === 'Connected' ? formatDuration(callDuration) : callStatus}
              </Text>

            </View>
          )}

          {/* Spacer View: Pushes controls to bottom when mainContent is not visible */}
          {!(callType === 'voice' || !remoteStream) && <View style={{flex: 1}} />}

          {/* --- Picture-in-Picture: Your own camera feed --- */}
          {localStream && callType === 'video' && !isCameraOff && (
            <RTCView 
              streamURL={localStream.toURL()} 
              style={[styles.localVideo, { bottom: insets.bottom + 110 }]} 
              objectFit="cover" 
              mirror={true} 
            />
          )}
          
          {/* --- Modal for Video Upgrade Request --- */}
          <Modal visible={showUpgradePrompt} transparent={true} animationType="slide" onRequestClose={handleDeclineUpgrade}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{recipientName} wants to switch to a video call</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.declineButton]} onPress={handleDeclineUpgrade}>
                    <Text style={styles.buttonText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.acceptButton]} onPress={handleAcceptUpgrade}>
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* --- Floating Control Bar --- */}
          <View style={[styles.controlsBar, { bottom: insets.bottom + 20 }]}>
            {callType === 'video' && (
              <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                <FontAwesome name="refresh" size={24} color="#FFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.controlButton} onPress={handleToggleCamera}>
              <FontAwesome name={"video-camera"} size={24} color={callType === 'voice' ? '#FFF' : (isCameraOff ? "#888" : "#FFF")} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={handleToggleMute}>
              <FontAwesome name={isMuted ? "microphone-slash" : "microphone"} size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={handleToggleSpeaker}>
              <FontAwesome name="volume-up" size={24} color={isSpeakerOn ? "#A9CF38" : "#FFF"} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={() => handleEndCall('ended')}>
              <FontAwesome name="phone" size={24} color="#FFF" style={styles.endCallIcon}/>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C3E50' },
  backgroundImage: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // Make space for controls
    width: '100%',
  },
  recipientNameContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  recipientFirstName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recipientLastName: {
    fontSize: 28,
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: 15,
  },
  indicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  callStatus: {
    fontSize: 18,
    color: '#FFF',
    opacity: 0.8,
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  avatarPlaceholder: {
    backgroundColor: '#4A6572',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFF',
    fontSize: 60,
    fontWeight: 'bold',
  },
  localVideo: {
    position: 'absolute',
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: '#34495E',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  controlsBar: {
    // This view is now positioned relative to the SafeAreaView's bottom
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 35,
    alignSelf: 'center', // Center it horizontally
    maxWidth: 400, // Max width for larger screens
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#E74C3C',
  },
  endCallIcon: {
    transform: [{ rotate: '135deg' }]
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#E74C3C',
  },
  acceptButton: {
    backgroundColor: '#2ECC71',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  endContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
  },
  endTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  endDuration: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 10,
  },
  endTime: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 20,
  },
  exitButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  exitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});