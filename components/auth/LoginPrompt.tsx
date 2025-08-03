import { useRouter } from 'expo-router';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginPromptModal } from '../modals/LoginPromptModal';

export function LoginPrompt() {
    const { isLoginPromptVisible, closeLoginPrompt } = useAuth();
    const router = useRouter();

    const handleSignIn = () => {
        closeLoginPrompt();
        router.push('/auth/modal'); // This remains the same
    };

    const handleSignUp = () => {
        closeLoginPrompt();
        // Navigate to your new WebView screen with the registration URL
        router.push({
            pathname: '/webview',
            params: { url: 'https://retroconnect.app/register' }
        });
    };

    return (
        <LoginPromptModal
            visible={isLoginPromptVisible}
            onClose={closeLoginPrompt}
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
        />
    );
}