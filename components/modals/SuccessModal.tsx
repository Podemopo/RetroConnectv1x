// sdaw/components/modals/SuccessModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onAction: () => void;
  title: string;
  message: string;
  actionText: string;
  closeText: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  onAction,
  title,
  message,
  actionText,
  closeText,
}) => {
  const { colors } = useTheme();

  // Animation values
  const scale = useSharedValue(0.9);
  const backdropOpacity = useSharedValue(0);

  // Animation styles
  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Animation and Visibility Logic
  useEffect(() => {
    if (visible) {
      // Animate in
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      // Animate out
      scale.value = withTiming(0.9, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // Android Back Button Handling
  useEffect(() => {
    const backAction = () => {
        if (visible) {
            onClose();
            return true;
        }
        return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
            <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {/* Modal Content */}
        <View style={styles.centerContainer}>
            <Animated.View 
                style={[
                    styles.modalView, 
                    { backgroundColor: colors.card, shadowColor: '#000' },
                    animatedModalStyle
                ]}
            >
              <FontAwesome name="check-circle" size={40} color={'#2ECC40'} style={styles.icon} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.modalMessage, { color: colors.text + '99' }]}>{message}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, { borderColor: colors.border, borderWidth: 1.5 }]}
                  onPress={onClose}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>{closeText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={onAction}
                >
                  <Text style={[styles.buttonText, { color: colors.card, fontWeight: 'bold' }]}>{actionText}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalView: {
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        width: '100%',
        maxWidth: 400,
    },
    icon: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },
    button: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});