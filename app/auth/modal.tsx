// app/auth/modal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { supabase } from '../../supabase';

const customThemeColors = {
    primary: '#A9CF38',
    background: '#FFFFFF',
    text: '#000000',
    card: '#FFFFFF',
    border: '#EEEEEE',
    placeholder: '#AAAAAA',
    activeTabBackground: '#A9CF38',
    lightText: '#666666',
};

const getFriendlyErrorMessage = (error: any, context: string): string => {
    console.error(`[Error in ${context}]:`, error);
    if (!error || !error.message) return 'An unexpected error occurred. Please try again.';
    const message = error.message.toLowerCase();
    if (message.includes('network request failed')) return 'Network error. Please check your internet connection and try again.';
    if (message.includes('invalid login credentials')) return 'Incorrect email or password. Please check your credentials and try again.';
    return 'An authentication error occurred. Please try again later.';
};

export default function AuthModal() {
    const { colors: defaultColors } = useTheme();
    const colors = { ...defaultColors, ...customThemeColors };
    
    const { intent } = useLocalSearchParams<{ intent?: string }>();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const formOpacity = useSharedValue(0);
    const formTranslateY = useSharedValue(20);

    const animatedFormStyle = useAnimatedStyle(() => {
        return {
            opacity: formOpacity.value,
            transform: [{ translateY: formTranslateY.value }],
        };
    });

    useEffect(() => {
        formOpacity.value = withTiming(1, { duration: 500 });
        formTranslateY.value = withTiming(0, { duration: 500 });
    }, []);

    useEffect(() => {
        if (intent === 'signup') {
            handleSignUpPress();
        }
    }, [intent]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing Information', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);

        if (error) {
            const friendlyMessage = getFriendlyErrorMessage(error, 'signIn');
            Alert.alert('Authentication Error', friendlyMessage);
        } else {
            if (router.canGoBack()) router.back();
        }
    };

    const handleSignUpPress = () => {
        const registrationUrl = 'https://retroconnect.app/register';
        // --- MODIFIED: Navigate to in-app WebView instead of opening external browser ---
        router.push({
            pathname: '/webview',
            params: { url: registrationUrl }
        });
    };

    const handleContinueAsGuest = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)');
        }
    };


    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}>
                    <Animated.ScrollView
                        style={animatedFormStyle}
                        contentContainerStyle={styles.scrollViewContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}>
                        <View style={styles.brandContainer}>
                            <Image source={require('../../assets/images/adaptive-icon.png')} style={styles.logo} />
                            <Text style={[styles.brandName, { color: colors.text }]}>RetroConnect</Text>
                        </View>
                        <View style={[styles.card, { backgroundColor: colors.card }]}>
                            
                            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
                            
                            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                                <FontAwesome name="envelope" size={18} color={colors.placeholder} style={styles.inputIcon} />
                                <TextInput placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={[styles.input, { color: colors.text }]} placeholderTextColor={colors.placeholder} selectionColor={colors.primary} />
                            </View>

                            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                                <FontAwesome name="lock" size={18} color={colors.placeholder} style={styles.inputIcon} />
                                <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} style={[styles.input, { color: colors.text }]} placeholderTextColor={colors.placeholder} selectionColor={colors.primary} />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                                    <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} size={18} color={colors.placeholder} />
                                </TouchableOpacity>
                            </View>

                            {loading ? (
                                <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
                            ) : (
                                <>
                                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                                        <Text style={[styles.buttonText, { color: colors.text }]}>Login</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Feature coming soon!')} activeOpacity={0.7}>
                                        <Text style={[styles.forgotPasswordText, { color: colors.lightText }]}>Forgot password?</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            
                            <View style={styles.signUpContainer}>
                                <Text style={[styles.signUpText, { color: colors.lightText }]}>Don't have an account? </Text>
                                <TouchableOpacity onPress={handleSignUpPress}>
                                    <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity onPress={handleContinueAsGuest} style={styles.guestButton}>
                                <Text style={[styles.guestButtonText, { color: colors.lightText }]}>Continue as Guest</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.ScrollView>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}


// --- STYLES ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
        width: '100%',
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 20,
        marginBottom: 15,
        resizeMode: 'contain',
    },
    brandName: {
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        padding: 30,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 8,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1.5,
        borderRadius: 8,
        height: 50,
    },
    input: {
        flex: 1,
        height: '100%',
        paddingLeft: 45,
        paddingRight: 45,
        fontSize: 16,
    },
    inputIcon: {
        position: 'absolute',
        left: 15,
    },
    passwordToggle: {
        position: 'absolute',
        right: 15,
        padding: 5,
    },
    button: {
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    forgotPasswordText: {
        fontSize: 14,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
    loadingIndicator: {
        marginVertical: 20,
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    signUpText: {
        fontSize: 14,
    },
    signUpLink: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    guestButton: {
        marginTop: 15,
    },
    guestButtonText: {
        fontSize: 14,
        textAlign: 'center',
        textDecorationLine: 'underline',
    }
});