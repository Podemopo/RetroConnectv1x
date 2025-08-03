// app/webview.tsx

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
// Step 1: Import an icon set from the library
import { Ionicons } from '@expo/vector-icons';

export default function WebViewScreen() {
    const { url } = useLocalSearchParams<{ url: string }>();
    const router = useRouter();

    const renderLoading = () => (
        <ActivityIndicator size="large" style={styles.loadingIndicator} />
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Register',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            {/* Step 2: Replace the Text 'X' with the Icon component */}
                            <Ionicons name="chevron-back" size={28} color="#007AFF" />
                        </TouchableOpacity>
                    ),
                }}
            />

            {url && (
                <WebView
                    source={{ uri: url }}
                    startInLoadingState={true}
                    renderLoading={renderLoading}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
    },
    backButton: {
        marginLeft: 10, // Adjusted padding for the icon
        padding: 5,
    },
});