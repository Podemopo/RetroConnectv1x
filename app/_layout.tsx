// File: app/_layout.tsx

import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { Host } from 'react-native-portalize';

import { LoginPrompt } from '../components/auth/LoginPrompt';
import { AuthProvider } from '../components/context/AuthContext';
import { useCallStore } from '../components/context/callStore';
import { IncomingCallModal } from '../components/modals/IncomingCallModal';
import { AppDarkTheme, AppLightTheme } from '../styles/theme';

const appFonts = {
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
};

SplashScreen.preventAutoHideAsync();

const GlobalCallModal = () => {
  const incomingCall = useCallStore((state) => state.incomingCall);
  const { acceptCall, declineCall } = useCallStore((state) => state.actions);

  // The useEffect for managing the ringtone has been removed from here.

  if (!incomingCall) {
    return null;
  }

  return (
    <IncomingCallModal
      visible={true}
      onClose={declineCall} //
      onAccept={acceptCall} //
      onDecline={declineCall} //
      callerName={incomingCall.callerName} //
      callerAvatar={incomingCall.callerAvatar} //
      callType={incomingCall.callType} //
    />
  );
};

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded, error] = useFonts(appFonts);
    const theme = colorScheme === 'dark' ? AppDarkTheme : AppLightTheme;

    useEffect(() => {
        if (error) console.error("Font loading error:", error);
    }, [error]);

    useEffect(() => {
        if (loaded) SplashScreen.hideAsync();
    }, [loaded]);

    if (!loaded) {
        return null;
    }
    
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <ThemeProvider value={theme}>
                    <Host>
                        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                            <Stack.Screen name="sell-form" options={{ presentation: 'modal' }} />
                            <Stack.Screen name="listing/[id]" />
                            <Stack.Screen name="chat/[id]" />
                            <Stack.Screen name="auth/modal" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                            <Stack.Screen name="search/[query]" options={{ presentation: 'modal', animation: 'default' }} />
                            <Stack.Screen name="user/[id]" options={{ presentation: 'modal', animation: 'default' }} />
                            <Stack.Screen name="my-profile" />
                            <Stack.Screen name="call" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
                            <Stack.Screen name="+not-found" />
                        </Stack>
                        <LoginPrompt />
                        <GlobalCallModal />
                    </Host>
                </ThemeProvider>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}