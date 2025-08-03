// sdaw/app/(tabs)/updates.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../components/context/AuthContext';
import { OrdersModal } from '../../components/modals/OrdersModal';
import { supabase } from '../../supabase';

// --- TYPE DEFINITIONS ---
type NotificationType = 'like' | 'comment' | 'offer' | 'system' | 'new_order' | 'order_update' | 'follow' | 'trade_update';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  actor: {
    fullName: string;
    profilePhotoUrl: string;
  } | null;
  metadata: {
    itemImage?: string;
  } | null;
}

interface NotificationSection {
  title: string;
  data: Notification[];
}

// --- ICON MAPPING ---
const iconMapping: { [key in NotificationType]: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string } } = {
  like: { name: 'heart', color: '#FF4136' },
  comment: { name: 'comment', color: '#0074D9' },
  offer: { name: 'tag', color: '#2ECC40' },
  system: { name: 'bell', color: '#FF851B' },
  new_order: { name: 'shopping-cart', color: '#2ECC40' },
  order_update: { name: 'truck', color: '#3498db' },
  follow: { name: 'user-plus', color: '#9b59b6' },
  trade_update: { name: 'exchange', color: '#FF851B' },
};

// --- MAIN COMPONENT ---
export default function UpdatesScreen() {
  const { colors } = useTheme();
  const { user, markAllNotificationsAsRead, markNotificationAsRead } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const groupNotifications = (data: Notification[]): NotificationSection[] => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayNotifs: Notification[] = [];
    const yesterdayNotifs: Notification[] = [];
    const earlierNotifs: Notification[] = [];

    data.forEach(notif => {
      const notifDate = new Date(notif.created_at);
      if (notifDate.toDateString() === today.toDateString()) {
        todayNotifs.push(notif);
      } else if (notifDate.toDateString() === yesterday.toDateString()) {
        yesterdayNotifs.push(notif);
      } else {
        earlierNotifs.push(notif);
      }
    });

    const sections: NotificationSection[] = [];
    if (todayNotifs.length > 0) sections.push({ title: 'Today', data: todayNotifs });
    if (yesterdayNotifs.length > 0) sections.push({ title: 'Yesterday', data: yesterdayNotifs });
    if (earlierNotifs.length > 0) sections.push({ title: 'Earlier', data: earlierNotifs });

    return sections;
  };


  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:actor_id (fullName, profilePhotoUrl)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data as any[] || []);
    }
    setLoading(false);
  }, [user]);

  const handleMarkAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await markAllNotificationsAsRead();
  }, [markAllNotificationsAsRead]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );
  
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`},
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
           if (payload.eventType === 'INSERT') {
             setNotifications(prev => [payload.new as Notification, ...prev]);
           } else if (payload.eventType === 'UPDATE') {
             setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
           } else if (payload.eventType === 'DELETE') {
             setNotifications(prev => prev.filter(n => n.id !== (payload.old as { id: string }).id));
           }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleNotificationPress = async (item: Notification) => {
    if (selectionMode) {
        handleSelectNotification(item.id);
        return;
    }
    
    if (!item.read) {
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
        await markNotificationAsRead(item.id);
    }

    if (item.type === 'offer' || item.type === 'trade_update') {
      router.push({
        pathname: '/(tabs)/me',
        params: { openTrades: 'true' },
      });
    } else if (item.type === 'new_order' || item.type === 'order_update') {
      router.push({
        pathname: '/(tabs)/me',
        params: { openOrders: 'true' },
      });
    } else if (item.type === 'like' || item.type === 'comment') {
      const postId = item.link?.split('/').pop();
      if (postId) {
        router.push({
          pathname: '/(tabs)/me',
          params: { postId: postId, openComments: item.type === 'comment' ? 'true' : 'false' },
        });
      }
    } else if (item.link) {
      router.push(item.link as any);
    }
  };

  const toggleSelectionMode = () => {
      if (selectionMode) {
          setSelectedIds(new Set());
      }
      setSelectionMode(!selectionMode);
  };

  const handleSelectNotification = (id: string) => {
      const newSelectedIds = new Set(selectedIds);
      if (newSelectedIds.has(id)) {
          newSelectedIds.delete(id);
      } else {
          newSelectedIds.add(id);
      }
      setSelectedIds(newSelectedIds);
  };
  
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      "Delete Notifications",
      `Are you sure you want to delete ${selectedIds.size} notification(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const idsToDelete = Array.from(selectedIds);
            setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
            const { error } = await supabase.from('notifications').delete().in('id', idsToDelete);
            if (error) {
              Alert.alert("Error", "Could not delete notifications. Please try again.");
              fetchNotifications();
            }
            toggleSelectionMode();
          },
        },
      ]
    );
  };
  
  const handleSelectAll = () => {
      if (selectedIds.size === notifications.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(notifications.map(n => n.id)));
      }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconInfo = iconMapping[item.type] || iconMapping.system;
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[
            styles.notificationCard, 
            { 
                backgroundColor: isSelected ? colors.primary + '20' : colors.card, 
                borderColor: isSelected ? colors.primary : colors.border,
            }
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={toggleSelectionMode}
      >
        {!item.read && !selectionMode && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        {selectionMode && (
            <FontAwesome 
                name={isSelected ? 'check-square-o' : 'square-o'} 
                size={24} 
                color={colors.primary} 
                style={{marginRight: 15}}
            />
        )}
        <View style={[styles.iconContainer, { backgroundColor: `${iconInfo.color}20` }]}>
          <FontAwesome name={iconInfo.name} size={20} color={iconInfo.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.messageText, { color: colors.text, fontWeight: item.read ? 'normal' : 'bold' }]} numberOfLines={2}>{item.message}</Text>
          <Text style={[styles.timestampText, { color: `${colors.text}99` }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
        {item.metadata?.itemImage && (
          <Image source={{ uri: item.metadata.itemImage }} style={styles.itemImage} />
        )}
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
          {!selectionMode ? (
              <>
                  <TouchableOpacity style={styles.headerButton} onPress={handleMarkAllAsRead}>
                      <FontAwesome name="envelope-open-o" size={22} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Updates</Text>
                  <TouchableOpacity style={styles.headerButton} onPress={toggleSelectionMode}>
                      <Text style={[styles.headerButtonText, { color: colors.primary }]}>Select</Text>
                  </TouchableOpacity>
              </>
          ) : (
              <>
                  <TouchableOpacity style={styles.headerButton} onPress={toggleSelectionMode}>
                      <Text style={[styles.headerButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSelectAll}>
                      <Text style={[styles.headerTitle, { color: colors.text, fontSize: 16 }]}>
                          {selectedIds.size === notifications.length ? 'Deselect All' : 'Select All'}
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerButton} onPress={handleDeleteSelected}>
                      <Text style={[styles.headerButtonText, { color: '#FF4136' }]}>Delete</Text>
                  </TouchableOpacity>
              </>
          )}
      </View>

      <SectionList
        sections={groupNotifications(notifications)}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionHeader, { color: colors.text }]}>{title}</Text>
        )}
        contentContainerStyle={styles.listContentContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="bell-slash-o" size={60} color={`${colors.text}40`} />
            <Text style={[styles.emptyText, { color: `${colors.text}99` }]}>No new notifications</Text>
          </View>
        }
        extraData={selectedIds} 
      />
      <OrdersModal 
        visible={ordersModalVisible} 
        onClose={() => setOrdersModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
  },
  headerButton: {
      padding: 5,
      minWidth: 50, // Give buttons some space
      alignItems: 'center' // Center content (icon or text)
  },
  headerButtonText: {
      fontSize: 16,
      fontWeight: '500',
  },
  listContentContainer: { paddingVertical: 10, paddingBottom: 100 },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 15, paddingVertical: 10, marginTop: 10 },
  notificationCard: { flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 15, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { 
    flex: 1, 
    justifyContent: 'center',
  },
  messageText: { 
    fontSize: 15, 
    lineHeight: 22,
  },
  timestampText: { 
    fontSize: 13, 
    marginTop: 4,
  },
  itemImage: { width: 50, height: 50, borderRadius: 8, marginLeft: 10, borderWidth: 1, borderColor: '#eee' },
  separator: { height: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16 },
  unreadDot: {
      position: 'absolute',
      top: 15,
      left: 5,
      width: 8,
      height: 8,
      borderRadius: 4,
  }
});