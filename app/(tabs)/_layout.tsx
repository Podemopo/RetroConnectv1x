// sdaw/app/(tabs)/_layout.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../components/context/AuthContext';

// Helper components (unchanged)
function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  const marginBottom = props.name === 'plus-circle' ? 0 : -3;
  return <FontAwesome size={24} style={{ marginBottom }} {...props} />;
}

const CustomTabBarButton = ({ children, onPress: defaultOnPress, accessibilityState }: any) => {
  const { colors } = useTheme();
  const isSelected = accessibilityState?.selected;
  return (
    <Pressable onPress={defaultOnPress} style={styles.defaultTabButtonPressable}>
      {React.Children.map(children, child => {
        if (typeof child === 'string' || typeof child === 'number') {
          return <Text style={{ color: isSelected ? colors.primary : 'gray', fontSize: 10 }}>{child}</Text>;
        }
        return child;
      })}
    </Pressable>
  );
};

const MAX_IMAGES = 5;

export default function TabLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  // UPDATED: Get unread count from useAuth
  const { requireLogin, unreadNotificationsCount } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [pickingImage, setPickingImage] = useState(false);

  const pickImageForIOS = async () => {
    if (selectedUris.length >= MAX_IMAGES) {
      Alert.alert('Maximum Reached', `You can only select up to ${MAX_IMAGES} images.`);
      return;
    }
    setPickingImage(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll access is needed.');
      setPickingImage(false);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - selectedUris.length,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map(asset => asset.uri);
        setSelectedUris(prevUris => [...prevUris, ...newUris]);
        if (!modalVisible) {
          setModalVisible(true);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open image library.');
    } finally {
      setPickingImage(false);
    }
  };

  const handleSellButtonPress = () => {
    requireLogin(() => {
      if (Platform.OS === 'android') {
        router.push('/sell-form');
      } else {
        setSelectedUris([]);
        pickImageForIOS();
      }
    });
  };

  const handleDone = () => {
    if (selectedUris.length > 0) {
      setModalVisible(false);
      router.push({ pathname: '/sell-form', params: { imageUris: selectedUris } });
    } else {
      Alert.alert("No Images", "Please select at least one image to continue.")
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedUris([]);
  };

  const handleTabPress = (screen: 'me' | 'updates') => {
    requireLogin(() => {
      router.push(`/(tabs)/${screen}`);
    });
  };

  const renderImageListItem = ({ item }: { item: string | 'add_button_placeholder' }) => {
    if (item === 'add_button_placeholder') {
      return (
        <TouchableOpacity
          style={[styles.addPhotoThumbnail, { borderColor: colors.border }]}
          onPress={pickImageForIOS}
          disabled={pickingImage}
        >
          {pickingImage ? <ActivityIndicator color={colors.primary} /> : <FontAwesome name="plus" size={24} color={colors.text + '80'} />}
        </TouchableOpacity>
      );
    }
    return <Image source={{ uri: item }} style={[styles.previewImage, { borderColor: colors.border }]} />;
  };

  const listData = selectedUris.length < MAX_IMAGES
    ? [...selectedUris, 'add_button_placeholder']
    : selectedUris;

  return (
    <>
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#A9CF38',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colors.card,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        }
      }}>
        <Tabs.Screen name="index" options={{ title: 'Explore', tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />, tabBarButton: (props) => <CustomTabBarButton {...props} /> }} />
        <Tabs.Screen name="foryou" options={{ title: 'For You', tabBarIcon: ({ color }) => <TabBarIcon name="heart" color={color} />, tabBarButton: (props) => <CustomTabBarButton {...props} /> }} />
        <Tabs.Screen
          name="sell"
          options={{
            title: 'Sell',
            tabBarIcon: ({ color }) => <TabBarIcon name="plus-square" color={color} />,
            tabBarButton: (props) => (
              <Pressable
                onPress={handleSellButtonPress}
                style={styles.customSellButtonPressable}
                disabled={pickingImage}
              >
                <View style={[styles.sellButtonCircle, { backgroundColor: '#A9CF38' }]}>
                  {pickingImage && Platform.OS === 'ios' ? (
                    <ActivityIndicator size="small" color={colors.card} />
                  ) : (
                    <TabBarIcon name="plus-circle" color={colors.card} />
                  )}
                </View>
                <Text style={[styles.sellButtonLabel, { color: props.accessibilityState?.selected ? '#A9CF38' : 'gray' }]}>Sell</Text>
              </Pressable>
            ),
          }}
          listeners={{ tabPress: (e) => e.preventDefault() }}
        />
        {/* UPDATED: Updates tab with badge */}
        <Tabs.Screen 
            name="updates" 
            options={{ 
                title: 'Updates', 
                tabBarIcon: ({ color }) => (
                    <View>
                        <TabBarIcon name="bell" color={color} />
                        {unreadNotificationsCount > 0 && <View style={styles.badge} />}
                    </View>
                ),
            }} 
            listeners={{ tabPress: (e) => { e.preventDefault(); handleTabPress('updates'); } }} 
        />
        <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} /> }} listeners={{ tabPress: (e) => { e.preventDefault(); handleTabPress('me'); } }} />
      </Tabs>

      {/* Modal for iOS image picker (unchanged) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Photos</Text>
            <Text style={[styles.modalSubtitle, { color: colors.text + '99' }]}>
              You have selected {selectedUris.length} of {MAX_IMAGES} image(s).
            </Text>
            <FlatList
              horizontal
              data={listData}
              keyExtractor={(item) => item}
              renderItem={renderImageListItem}
              contentContainerStyle={styles.previewList}
              showsHorizontalScrollIndicator={false}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleDone}>
                <FontAwesome name="check" size={16} color={colors.card} />
                <Text style={[styles.modalButtonText, { color: colors.card }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={[styles.cancelButtonText, { color: colors.text + '99' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // other styles...
  customSellButtonPressable: { alignItems: 'center', top: -12, flex: 1, justifyContent: 'center' },
  sellButtonCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.27, shadowRadius: 4.65, elevation: 6 },
  sellButtonLabel: { fontSize: 12, marginTop: 5 },
  defaultTabButtonPressable: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', },
  modalContainer: { padding: 20, paddingTop: 30, borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center', },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, },
  modalSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20, },
  previewList: { marginBottom: 20, paddingHorizontal: 10, height: 100, },
  previewImage: { width: 100, height: 100, borderRadius: 10, marginHorizontal: 5, borderWidth: 1, },
  addPhotoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 10, },
  modalButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 8, },
  modalButtonText: { fontSize: 16, fontWeight: 'bold', },
  cancelButton: { marginTop: 15, padding: 10, },
  cancelButtonText: { fontSize: 15, },
  // NEW: Badge style
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#FF4136',
    borderRadius: 6,
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
});