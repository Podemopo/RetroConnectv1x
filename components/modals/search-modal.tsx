// tiral and error/components/modals/search-modal.tsx
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';
import { useAuth } from '../context/AuthContext';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

const MAX_RECENT_SEARCHES = 10;
const RECENT_SEARCHES_KEY = 'recent_searches';

export default function SearchModal({ visible, onClose }: SearchModalProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserSearch, setIsUserSearch] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from storage on mount
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const storedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (storedSearches) {
          setRecentSearches(JSON.parse(storedSearches));
        }
      } catch (e) {
        console.error('Failed to load recent searches.', e);
      }
    };
    if (visible) {
        loadRecentSearches();
    }
  }, [visible]);

  // Save recent searches to storage
  const saveRecentSearches = async (searches: string[]) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (e) {
      console.error('Failed to save recent searches.', e);
    }
  };

  const handleSearch = async (query: string) => {
    const term = query.trim();
    if (!term) return;

    // Add to recent searches
    const updatedSearches = [term, ...recentSearches.filter(s => s !== term)].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    setRecentSearches(updatedSearches);
    saveRecentSearches(updatedSearches);

    if (user) {
      await supabase.from('user_searches').insert([{ user_id: user.id, query: term }]);
    }
    
    router.push({ 
        pathname: '/search/[query]', 
        params: { query: term, searchType: isUserSearch ? 'user' : 'item' }
    });

    setSearchQuery(''); // Clear input after search
    onClose(); // Close this modal
  };

  const removeRecentSearch = (term: string) => {
    const updatedSearches = recentSearches.filter(s => s !== term);
    setRecentSearches(updatedSearches);
    saveRecentSearches(updatedSearches);
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    saveRecentSearches([]);
  };

  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => handleSearch(item)}
    >
      <FontAwesome
        name="history"
        size={18}
        color={colors.text + '99'}
        style={styles.recentIcon}
      />
      <Text style={[styles.recentText, { color: colors.text }]}>{item}</Text>
      <TouchableOpacity onPress={() => removeRecentSearch(item)}>
        <FontAwesome name="times" size={18} color={colors.text + '99'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="fade"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.searchBarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FontAwesome
              name="search"
              size={19}
              color={(colors as any).placeholder || '#AAAAAA'}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder={isUserSearch ? "Search for username" : "Search everything"}
              placeholderTextColor={(colors as any).placeholder || '#AAAAAA'}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              autoFocus
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.cancelButton, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Search Type Toggle */}
        <TouchableOpacity
          style={styles.userSearchToggle}
          onPress={() => setIsUserSearch(!isUserSearch)}
        >
          <FontAwesome
            name="user-o"
            size={18}
            color={colors.primary}
            style={styles.userSearchIcon}
          />
          <Text style={[styles.userSearchText, { color: colors.primary }]}>
            {isUserSearch ? 'Switch to searching for items' : 'Search for user instead'}
          </Text>
        </TouchableOpacity>

        {/* Recent Searches List */}
        <View style={styles.recentSearchesContainer}>
            <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, {color: colors.text}]}>Recent</Text>
                {recentSearches.length > 0 && (
                    <TouchableOpacity onPress={clearAllRecentSearches}>
                        <Text style={[styles.clearButton, {color: colors.primary}]}>Clear all</Text>
                    </TouchableOpacity>
                )}
            </View>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearchItem}
            keyExtractor={(item, index) => `${item}-${index}`}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ color: colors.text + '99' }}>No recent searches.</Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    // **FIX:** Removed fixed height and added vertical padding to center the text
    paddingVertical: Platform.OS === 'ios' ? 10 : 5, 
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    // **FIX:** Ensures input doesn't have extra vertical space on Android
    paddingVertical: 0, 
  },
  cancelButton: {
    marginLeft: 15,
    fontSize: 16,
  },
  userSearchToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 10
  },
  userSearchIcon: {
    marginRight: 10,
  },
  userSearchText: {
    fontSize: 15,
    fontWeight: '500',
  },
  recentSearchesContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentIcon: {
    marginRight: 15,
  },
  recentText: {
    flex: 1,
    fontSize: 16,
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
  }
});