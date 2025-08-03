// components/modals/FullScreenImageModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
    type ImageSourcePropType
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the props for the component
interface FullScreenImageModalProps {
  images: ImageSourcePropType[];
  initialIndex?: number;
  isVisible: boolean;
  onClose: () => void;
}

const FullScreenImageModal: React.FC<FullScreenImageModalProps> = ({
  images,
  initialIndex = 0,
  isVisible,
  onClose,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Animation values
  const scaleAnimation = useRef(new Animated.Value(0.95)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;

  // --- ANIMATION LOGIC ---
  // Function to run the open animation
  const runOpenAnimation = () => {
    Animated.parallel([
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Function to run the close animation
  const runCloseAnimation = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(opacityAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  // Effect to handle modal visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentIndex(initialIndex);
      // Scroll to the initial image without animation when modal opens
      // Use setTimeout to ensure the scroll happens after the modal is fully visible
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: screenWidth * initialIndex,
          animated: false,
        });
      }, 0);
      runOpenAnimation();
    }
  }, [isVisible, initialIndex, screenWidth]);
  
  // Custom close handler to trigger animation
  const handleClose = () => {
    runCloseAnimation(() => {
      onClose();
    });
  };

  // --- SCROLL & PAGINATION LOGIC ---
  // Handler for when the user swipes to a new image
  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  // --- RENDER ---
  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={handleClose}
      animationType="none" // We handle animations ourselves
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: opacityAnimation,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* --- HEADER: CLOSE BUTTON & PAGINATION --- */}
        <View style={[styles.header, { top: insets.top + 15 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <FontAwesome name="close" size={24} color="white" />
          </TouchableOpacity>
          {images.length > 1 && (
            <View style={styles.paginationTextContainer}>
              <Text style={styles.paginationText}>
                {currentIndex + 1} / {images.length}
              </Text>
            </View>
          )}
           <View style={styles.headerPlaceholder} />
        </View>

        {/* --- IMAGE SWIPER --- */}
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnimation }] }}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            style={{ width: screenWidth, height: screenHeight }}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {images.map((image, index) => (
              <View key={index} style={{ width: screenWidth, height: screenHeight }}>
                <Image
                  source={image}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  closeButton: {
    // Increased padding for a larger, easier-to-press touch area
    padding: 10,
    // Added a subtle background to make it visually clear it's a button
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22, // Circular shape
  },
  paginationTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerPlaceholder: {
    // This balances the header so the pagination text is truly centered
    width: 44, // Same size as closeButton
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default FullScreenImageModal;
