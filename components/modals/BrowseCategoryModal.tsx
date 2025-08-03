// sdaw/components/modals/BrowseCategoryModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Dimensions, LayoutAnimation, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { categoriesListData } from '../../constants/categories';

interface BrowseCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: string) => void;
}

const { height, width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

const categoryIconMapping: { [key: string]: React.ComponentProps<typeof FontAwesome>['name'] } = {
    'Electronics': 'tv',
    'Fashion': 'female',
    'Health & Beauty': 'medkit',
    'Home & Living': 'bed',
    'Home Appliances': 'plug',
    'Groceries & Pets': 'shopping-basket',
    'Toys, Kids & Babies': 'child',
    'Sports & Outdoors': 'futbol-o',
    'Motors': 'car',
    'Hobbies & Stationery': 'book',
    'Digital Goods & Vouchers': 'ticket',
    'Services': 'wrench',
};

const CategorySection = ({ category, onSelectCategory }: { category: { name: string, items: string[] }, onSelectCategory: (cat: string) => void }) => {
    const { colors } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpansion = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const iconName = categoryIconMapping[category.name] || 'tag';

    return (
        <View>
            <TouchableOpacity
                style={[styles.mainCategoryRow, { borderBottomColor: colors.border }]}
                onPress={() => onSelectCategory(category.name)} // --- FIX: Main category is now clickable ---
            >
                <View style={styles.categoryLeft}>
                    <FontAwesome name={iconName} size={20} color={colors.text} style={styles.icon}/>
                    <Text style={[styles.mainCategoryText, { color: colors.text }]}>
                        {category.name}
                    </Text>
                </View>
                {/* --- FIX: Arrow is now a separate button to expand/collapse --- */}
                <TouchableOpacity onPress={toggleExpansion} style={{padding: 5}}>
                    <FontAwesome name={isExpanded ? "chevron-down" : "chevron-right"} size={16} color={colors.text + '80'} />
                </TouchableOpacity>
            </TouchableOpacity>

            {isExpanded && category.items.map((item) => (
                <TouchableOpacity
                    key={item}
                    style={[styles.subCategoryRow, { borderBottomColor: colors.border }]}
                    onPress={() => onSelectCategory(item)}
                >
                    <Text style={[styles.subCategoryText, { color: colors.text + 'dd' }]}>
                        {item}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};


export const BrowseCategoryModal: React.FC<BrowseCategoryModalProps> = ({
  visible,
  onClose,
  onSelectCategory,
}) => {
  const { colors } = useTheme();
  const translateX = useSharedValue(-DRAWER_WIDTH);

  useEffect(() => {
    translateX.value = withTiming(visible ? 0 : -DRAWER_WIDTH);
  }, [visible, translateX]);

  const handleCategoryPress = (category: string) => {
    onSelectCategory(category);
    onClose();
  };

  const animatedDrawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const panGesture = Gesture.Pan()
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
        if (event.translationX < 0) {
            translateX.value = event.translationX;
        }
    })
    .onEnd(() => {
        if (translateX.value < -DRAWER_WIDTH / 3) {
            translateX.value = withTiming(-DRAWER_WIDTH, {}, () => {
                onClose();
            });
        } else {
            translateX.value = withTiming(0);
        }
    });

  return (
    <Modal
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
        animationType="fade"
    >
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
            <GestureDetector gesture={panGesture}>
                <Animated.View
                style={[
                    styles.drawerContainer,
                    { backgroundColor: colors.card, borderRightColor: colors.border },
                    animatedDrawerStyle,
                ]}
                onStartShouldSetResponder={() => true}
                >
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.title, { color: colors.text }]}>
                    Browse by Categories
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <FontAwesome name="close" size={22} color={colors.text + '99'} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 50 }}
                >
                    <TouchableOpacity
                    style={[styles.mainCategoryRow, { borderBottomColor: colors.border }]}
                    onPress={() => handleCategoryPress('Following')}
                    >
                        <View style={styles.categoryLeft}>
                            <FontAwesome name="heart-o" size={20} color={colors.primary} style={styles.icon}/>
                            <Text style={[styles.mainCategoryText, { color: colors.primary }]}>
                                Following
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {categoriesListData.map((category) => (
                        <CategorySection
                            key={category.name}
                            category={category}
                            onSelectCategory={handleCategoryPress}
                        />
                    ))}
                </ScrollView>
                </Animated.View>
          </GestureDetector>
        </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
      padding: 5,
  },
  mainCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 25,
    marginRight: 15,
  },
  mainCategoryText: {
    fontSize: 17,
    fontWeight: '500',
  },
  subCategoryRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingLeft: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  subCategoryText: {
    fontSize: 16,
  },
});
