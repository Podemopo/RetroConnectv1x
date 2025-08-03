import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// The URL for your registration page
const REGISTER_URL = 'https://retroconnect.app/register';

/**
 * This screen component renders the registration page within a WebView.
 */
export default function RegisterScreen() {
    // Renders a loading indicator while the WebView is loading the page.
    const renderLoading = () => (
        <ActivityIndicator
            color="#999999"
            size="large"
            style={styles.loading}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Sets the title of the screen in the header */}
            <Stack.Screen options={{ title: 'Create Account' }} />

            <WebView
                source={{ uri: REGISTER_URL }}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={renderLoading}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // Set a background color
    },
    webview: {
        flex: 1,
    },
    loading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
