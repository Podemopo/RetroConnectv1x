// sdaw/components/menus/ItemOptionsMenu.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

export interface MenuOption {
  title: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  onPress: () => void;
  isDestructive?: boolean;
}

interface ItemOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  options: MenuOption[];
  position: { x: number; y: number };
}

export const ItemOptionsMenu: React.FC<ItemOptionsMenuProps> = ({ visible, onClose, options, position }) => {
  const { colors } = useTheme();

  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 100 });
    } else {
      scale.value = withTiming(0.95, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

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
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable onPress={onClose} style={StyleSheet.absoluteFillObject} />
      <Animated.View
        style={[
          styles.menuContainer,
          {
            top: position.y,
            left: position.x,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          animatedStyle,
        ]}
      >
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              index !== options.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
            ]}
            onPress={option.onPress}
          >
            <FontAwesome
              name={option.icon}
              size={16}
              color={option.isDestructive ? '#FF4136' : colors.text}
            />
            <Text style={[styles.optionText, { color: option.isDestructive ? '#FF4136' : colors.text }]}>
              {option.title}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 15,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});