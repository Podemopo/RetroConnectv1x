// sdaw/components/modals/ThriftShareModal.tsx
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons'; // Added Ionicons
import { useTheme } from '@react-navigation/native';
import { decode } from 'base64-arraybuffer';
import { ResizeMode, Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    LayoutAnimation,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    ViewToken
} from 'react-native';
// --- MODIFICATION: Added TapGestureHandler and State ---
import { FlatList, GestureHandlerRootView, ScrollView, State, TapGestureHandler, TouchableOpacity } from 'react-native-gesture-handler';
import { Portal } from 'react-native-portalize';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../supabase';
import { useAuth } from '../context/AuthContext';
import { MenuOption } from '../menus/ItemOptionsMenu';
import { CommentsModal } from './CommentsModal';
import { ConfirmationModal } from './ConfirmationModal';
import FullScreenImageModal from './FullScreenImageModal';
import { ThriftShareReport } from './ThriftShareReport';

// --- Interfaces ---
interface User {
    id: string;
    fullName: string;
    profilePhotoUrl: string;
}

interface Listing {
    id: number;
    image_urls: string[];
    user_id: string;
    item_name: string;
}

interface Post {
    id: number;
    user_id: string;
    listing_id: number;
    image_url: string;
    caption: string;
    listing_url: string;
    created_at: string;
    video_url: string | null;
    image_urls: string[] | null;
    users: User;
    likes_count: number;
    comments_count: number;
}
interface ThriftShareModalProps {
    visible: boolean;
    onClose: () => void;
    initialPostId?: number;
    initialOpenCommentsPostId?: number;
}


// --- Helper Components ---
const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m`;
    return `${Math.floor(seconds)}s`;
};

const ExpandableText = ({ text, style }: { text: string; style: any }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const needsTruncation = text.length > 100;
    return (
        <View>
            <Text style={style} numberOfLines={isExpanded ? undefined : 2}>
                {text}
            </Text>
            {needsTruncation && (
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                    <Text style={styles.moreLessText}>
                        {isExpanded ? 'less' : '... more'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const Pagination = ({ data, activeIndex }: { data: any[]; activeIndex: number; }) => {
    const { colors } = useTheme();
    return (
        <View style={styles.paginationContainer}>
            {data.map((_, i) => {
                const isActive = i === activeIndex;
                return (
                    <View
                        key={`pagination-dot-${i}`}
                        style={[
                            styles.paginationDot,
                            {
                                width: isActive ? 12 : 8,
                                height: isActive ? 12 : 8,
                                borderRadius: isActive ? 6 : 4,
                                backgroundColor: isActive ? colors.primary : colors.border,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
};

// --- MODIFICATION: Added isFocused prop to StoryCard ---
const StoryCard = ({ post, onDeletePost, onEditPost, onOpenComments, onCloseModal, onOpenImageViewer, isFocused }: { post: Post, onDeletePost: (postId: number) => void, onEditPost: (post: Post) => void, onOpenComments: (post: Post) => void, onCloseModal: () => void, onOpenImageViewer: (images: string[], index: number) => void, isFocused: boolean }) => {
    const { colors } = useTheme();
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(post.likes_count || 0);
    const comments = post.comments_count || 0;
    const router = useRouter();
    const { user } = useAuth();
    const isOwner = user?.id === post.user_id;
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isReportModalVisible, setReportModalVisible] = useState(false);
    const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

    // --- NEW: State and refs for video control ---
    const videoRef = useRef<Video>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    // --- REMOVED: isFullScreen state is no longer needed, we use the router now ---

    const media: { type: 'video' | 'image'; url: string }[] = [];
    if (post.video_url) {
        media.push({ type: 'video', url: post.video_url });
    }
    if (post.image_url) {
        media.push({ type: 'image', url: post.image_url });
    }
    if (post.image_urls) {
        post.image_urls.forEach(url => {
            if (url && url !== post.image_url) {
                media.push({ type: 'image', url });
            }
        });
    }

    // --- NEW: Effect to auto-pause/play video when focus changes ---
    useEffect(() => {
        if (isFocused && isPlaying) {
             videoRef.current?.playAsync();
        } else {
             videoRef.current?.pauseAsync();
        }
    }, [isFocused]);


    // --- NEW: Handlers for video tap gestures ---
    const handleSingleTap = () => {
        if (videoRef.current) {
            isPlaying ? videoRef.current.pauseAsync() : videoRef.current.playAsync();
        }
    };

    // --- MODIFICATION: Use router to open webview for fullscreen ---
    const handleDoubleTap = (event: { nativeEvent: { state: State } }) => {
        if (event.nativeEvent.state === State.ACTIVE && post.video_url) {
            router.push({
                pathname: '/webview',
                params: { url: post.video_url, title: 'Video Preview' }
            });
        }
    };

    const handleOpenImageViewer = (index: number) => {
        const imagesOnly = media.filter(m => m.type === 'image').map(m => m.url);
        const clickedItem = media[index];

        if (clickedItem.type === 'image' && imagesOnly.length > 0) {
            const imageIndex = imagesOnly.findIndex(url => url === clickedItem.url);
            onOpenImageViewer(imagesOnly, imageIndex >= 0 ? imageIndex : 0);
        }
    };

    const handleDelete = () => {
        setMenuVisible(false);
        setDeleteConfirmVisible(true);
    };

    const handleEdit = () => {
        setMenuVisible(false);
        onEditPost(post);
    };

    const confirmDelete = () => {
        setDeleteConfirmVisible(false);
        onDeletePost(post.id);
    };

    const menuOptions: MenuOption[] = isOwner
        ? [
            { title: 'Edit Post', icon: 'pencil', onPress: handleEdit },
            { title: 'Delete Post', icon: 'trash', onPress: handleDelete, isDestructive: true },
        ]
        : [
            { title: 'Report Post', icon: 'flag', onPress: () => { setMenuVisible(false); setReportModalVisible(true); }, isDestructive: true },
        ];

    const onViewableItemsChanged = ({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
        }
    };

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50
    };


    useEffect(() => {
        const fetchLikeStatus = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('fitpicpost_likes')
                .select('*')
                .eq('post_id', post.id)
                .eq('user_id', user.id);
            if (error) console.error('Error fetching like status:', error);
            else if (data) setLiked(data.length > 0);
        };
        fetchLikeStatus();
    }, [user, post.id]);

    const handleLike = async () => {
        if (!user || isOwner) return;
        if (liked) {
            const { error } = await supabase
                .from('fitpicpost_likes')
                .delete()
                .eq('post_id', post.id)
                .eq('user_id', user.id);
            if (!error) {
                setLiked(false);
                setLikes(likes - 1);
            } else {
                console.error('Error removing like:', error);
                Alert.alert('Error', 'Could not unlike the post.');
            }
        } else {
            const { error } = await supabase
                .from('fitpicpost_likes')
                .insert([{ post_id: post.id, user_id: user.id }]);
            if (!error) {
                setLiked(true);
                setLikes(likes + 1);
            } else {
                console.error('Error adding like:', error);
                Alert.alert('Error', 'Could not like the post.');
            }
        }
    };

    return (
        <>
            <Pressable onPress={() => { if (isMenuVisible) setMenuVisible(false); }}>
                <View style={styles.storyCard}>
                    <FlatList
                        data={media}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => item.url + index}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        renderItem={({ item, index }) => (
                            <View style={{ width: Dimensions.get('window').width - 32, height: '100%' }}>
                                {/* --- MODIFICATION: Added video player with gesture handlers --- */}
                                {item.type === 'video' ? (
                                    <TapGestureHandler onHandlerStateChange={handleDoubleTap} numberOfTaps={2}>
                                        <TapGestureHandler onHandlerStateChange={({ nativeEvent }) => { if (nativeEvent.state === State.ACTIVE) handleSingleTap() }} numberOfTaps={1}>
                                            <View style={styles.cardImage}>
                                                <Video
                                                    ref={videoRef}
                                                    source={{ uri: item.url }}
                                                    style={StyleSheet.absoluteFill}
                                                    resizeMode={ResizeMode.COVER}
                                                    isLooping
                                                    onPlaybackStatusUpdate={(status) => {
                                                        if (status.isLoaded) setIsPlaying(status.isPlaying);
                                                    }}
                                                />
                                                {!isPlaying && (
                                                    <View style={styles.playPauseOverlay}>
                                                        <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
                                                    </View>
                                                )}
                                            </View>
                                        </TapGestureHandler>
                                    </TapGestureHandler>
                                ) : (
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => handleOpenImageViewer(index)}>
                                        <Image
                                            source={{ uri: item.url }}
                                            style={styles.cardImage}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    />
                    {media.length > 1 && <Pagination data={media} activeIndex={activeIndex} />}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
                        style={styles.bottomContainer}
                    >
                        <View style={styles.textContent}>
                            <TouchableOpacity onPress={() => router.push(`/user/${post.user_id}`)}>
                                <View style={styles.userInfo}>
                                    <Image source={{ uri: post.users.profilePhotoUrl }} style={styles.avatar} />
                                    <View>
                                        <Text style={styles.userName}>{post.users.fullName}</Text>
                                        <Text style={styles.timestamp}>{formatRelativeTime(post.created_at)}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                            <View style={styles.captionContainer}>
                                <ExpandableText text={post.caption} style={styles.caption} />
                            </View>
                        </View>
                        <View style={styles.storyCardActions}>
                            {!!post.listing_url && (
                                <TouchableOpacity
                                    style={styles.storyCardActionButton}
                                    onPress={() => {
                                        onCloseModal();
                                        router.push({ pathname: '/listing/[id]', params: { id: post.listing_id } });
                                    }}
                                >
                                    <FontAwesome name="shopping-bag" size={24} color="#fff" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.storyCardActionButton} onPress={handleLike} disabled={isOwner}>
                                <FontAwesome name={liked ? "heart" : "heart-o"} size={24} color={liked ? "#ef4444" : "#fff"} />
                                <Text style={styles.likesCount}>{likes}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.storyCardActionButton} onPress={() => onOpenComments(post)}>
                                <FontAwesome name="comment-o" size={24} color="#fff" />
                                <Text style={styles.likesCount}>{comments > 99 ? '99+' : comments}</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                    <View style={styles.topRightActions}>
                        <TouchableOpacity onPress={() => setMenuVisible(v => !v)} style={styles.menuButton}>
                            <FontAwesome name="ellipsis-v" size={22} color="#fff" />
                        </TouchableOpacity>

                        {isMenuVisible ? (
                            <View style={[styles.customMenuContainer, { backgroundColor: colors.card }]}>
                                {menuOptions.map((option, index) => (
                                    <TouchableOpacity
                                        key={option.title}
                                        style={[
                                            styles.customMenuItem,
                                            index < menuOptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                                        ]}
                                        onPress={option.onPress}
                                    >
                                        <FontAwesome5 name={option.icon} size={16} color={option.isDestructive ? '#FF4136' : colors.text} />
                                        <Text style={[styles.customMenuText, { color: option.isDestructive ? '#FF4136' : colors.text }]}>
                                            {option.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : null}
                    </View>
                </View>
            </Pressable>
            {/* --- REMOVED: Fullscreen Video Modal is now handled by webview --- */}
            <ThriftShareReport
                visible={isReportModalVisible}
                onClose={() => setReportModalVisible(false)}
                listingId={post.listing_id}
                reporterId={user?.id || ''}
            />
            <ConfirmationModal
                visible={isDeleteConfirmVisible}
                onCancel={() => setDeleteConfirmVisible(false)}
                onConfirm={confirmDelete}
                title="Delete Post"
                message="Are you sure you want to permanently delete this post?"
                confirmText="Delete"
                confirmButtonColor="#FF4136"
            />
        </>
    );
};

// ... (The AddPostModal component remains unchanged)
const AddPostModal = ({ visible, onClose, listings, onSave, user, editingPost }: { visible: boolean; onClose: () => void; listings: Listing[]; onSave: (caption: string, listing: Listing, videoUrl: string | null, imageUrls: string[], postId?: number) => Promise<void>; user: any; editingPost: Post | null }) => {
    const [caption, setCaption] = useState('');
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [imageUris, setImageUris] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'myListings' | 'following'>('myListings');
    const [followingListings, setFollowingListings] = useState<Listing[]>([]);

    const isEditMode = !!editingPost;

    useEffect(() => {
        if (visible && isEditMode) {
            setCaption(editingPost.caption);
            const initialListing = listings.find(l => l.id === editingPost.listing_id);
            setSelectedListing(initialListing || null);
            setVideoUri(editingPost.video_url);
            const allImages = [editingPost.image_url, ...(editingPost.image_urls || [])].filter(Boolean) as string[];
            setImageUris(allImages);
        } else if (!isEditMode) {
            setCaption('');
            setSelectedListing(null);
            setVideoUri(null);
            setImageUris([]);
        }
    }, [visible, editingPost, isEditMode, listings]);


    useEffect(() => {
        const fetchFollowingListings = async () => {
            if (activeTab !== 'following' || !user) return;
            const { data: follows, error: followsError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);

            if (followsError || !follows || follows.length === 0) {
                setFollowingListings([]);
                return;
            }
            const followedUserIds = follows.map((f: any) => f.following_id);
            const { data: listingsData, error: listingsError } = await supabase
                .from('listings')
                .select('*')
                .in('user_id', followedUserIds);

            if (listingsError) {
                console.error("Error fetching followed listings:", listingsError);
                setFollowingListings([]);
            } else {
                setFollowingListings(listingsData || []);
            }
        };
        fetchFollowingListings();
    }, [activeTab, user]);

    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need permission to access your media.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            videoMaxDuration: 120,
        });
        if (!result.canceled) {
            setVideoUri(result.assets[0].uri);
        }
    };

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need permission to access your media.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
        });
        if (!result.canceled) {
            const selectedUris = result.assets.map(asset => asset.uri);
            setImageUris(prev => [...prev, ...selectedUris].slice(0, 5));
        }
    };

    const takePicture = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need permission to access your camera.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (!result.canceled) {
            const selectedUris = result.assets.map(asset => asset.uri);
            setImageUris(prev => [...prev, ...selectedUris].slice(0, 5));
        }
    };

    const removeImage = (uri: string) => {
        setImageUris(prev => prev.filter(u => u !== uri));
    };

    const uploadFile = async (uri: string, fileType: 'video' | 'image'): Promise<string> => {
        const fileExt = fileType === 'video' ? 'mp4' : 'jpg';
        const fileName = `${fileType}s/${uuidv4()}.${fileExt}`;
        const contentType = fileType === 'video' ? 'video/mp4' : 'image/jpeg';

        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        const { error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(fileName, decode(base64), { contentType });

        if (uploadError) {
            throw new Error(`${fileType} upload failed: ${uploadError.message}`);
        }

        const { data } = supabase.storage.from('post-media').getPublicUrl(fileName);
        const url = data.publicUrl;
        if (!url) {
            throw new Error(`Failed to get public URL for ${fileType}`);
        }
        return url;
    };

    const uploadMedia = async (): Promise<{ videoUrl: string | null; imageUrls: string[] }> => {
        const uploadedVideoUrl = videoUri && !videoUri.startsWith('http')
            ? await uploadFile(videoUri, 'video')
            : videoUri;

        const finalImageUrls = await Promise.all(
            imageUris.map(uri =>
                uri && !uri.startsWith('http') ? uploadFile(uri, 'image') : Promise.resolve(uri)
            )
        );

        return { videoUrl: uploadedVideoUrl, imageUrls: finalImageUrls.filter((url): url is string => !!url) };
    };

    const handleSave = async () => {
        if (!selectedListing) {
            Alert.alert("Please select a listing to share.");
            return;
        }
        setLoading(true);
        try {
            const { videoUrl, imageUrls } = await uploadMedia();
            await onSave(caption, selectedListing, videoUrl, imageUrls, editingPost?.id);
        } catch (error: any) {
            console.error("Error saving post:", error);
            Alert.alert("Error", error.message || "Could not save post.");
        } finally {
            setLoading(false);
        }
    };
    
    const saveButtonText = isEditMode ? 'Save Changes' : 'Post';

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <GestureHandlerRootView style={{flex: 1}}>
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: '#ffffff' }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: '#e2e8f0' }]}>
                            <Text style={[styles.modalTitle, { color: '#1e293b' }]}>{isEditMode ? 'Edit Your Find' : 'Share Your Find'}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <FontAwesome name="close" size={24} color={'#1e293b'} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <View style={styles.tabs}>
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === 'myListings' && styles.activeTab]}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setActiveTab('myListings');
                                    }}
                                >
                                    <Text style={[styles.tabText, activeTab === 'myListings' && styles.activeTabText]}>Your Listings</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === 'following' && styles.activeTab]}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setActiveTab('following');
                                    }}
                                >
                                    <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>Following</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={activeTab === 'myListings' ? listings : followingListings}
                                horizontal
                                contentContainerStyle={styles.listingContainer}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => setSelectedListing(item)} style={styles.listingItem}>
                                        <Image source={{ uri: item.image_urls[0] }} style={[styles.listingImage, selectedListing?.id === item.id && styles.selectedListing]} />
                                        <Text style={styles.listingName} numberOfLines={1}>{item.item_name}</Text>
                                    </TouchableOpacity>
                                )}
                                keyExtractor={(item) => item.id.toString()}
                            />

                            <TextInput
                                style={[styles.input, styles.captionInput, { borderColor: '#e2e8f0', color: '#1e293b' }]}
                                placeholder="Write a caption..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                onChangeText={setCaption}
                                value={caption}
                            />
                            <View style={styles.mediaUploadContainer}>
                                <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
                                    <FontAwesome name="video-camera" size={24} color="#3b82f6" />
                                    <Text style={styles.uploadText}>Add Video</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
                                    <FontAwesome name="photo" size={24} color="#3b82f6" />
                                    <Text style={styles.uploadText}>Add Photo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.uploadButton} onPress={takePicture}>
                                    <FontAwesome name="camera" size={24} color="#3b82f6" />
                                    <Text style={styles.uploadText}>Take Photo</Text>
                                </TouchableOpacity>
                            </View>
                            {videoUri && (
                                <View style={styles.mediaPreview}>
                                    <Text style={styles.mediaText}>Video ready</Text>
                                    <TouchableOpacity onPress={() => setVideoUri(null)}>
                                        <FontAwesome name="trash" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            <FlatList
                                data={imageUris}
                                horizontal
                                renderItem={({ item }) => (
                                    <View style={styles.mediaPreview}>
                                        <Image source={{ uri: item }} style={styles.thumbnail} />
                                        <TouchableOpacity onPress={() => removeImage(item)} style={styles.removeButton}>
                                            <FontAwesome name="trash" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                keyExtractor={(item) => item}
                            />
                        </ScrollView>
                        <View style={[styles.modalFooter, { borderTopColor: '#e2e8f0' }]}>
                            <TouchableOpacity style={[styles.button, { backgroundColor: '#f1f5f9' }]} onPress={onClose}>
                                <Text style={{ color: '#1e293b' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, { backgroundColor: '#1e293b' }]} onPress={handleSave} disabled={loading}>
                                <Text style={{ color: '#ffffff' }}>{loading ? 'Saving...' : saveButtonText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
};


export const ThriftShareModal: React.FC<ThriftShareModalProps> = ({ visible, onClose, initialPostId, initialOpenCommentsPostId }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [addPostModalVisible, setAddPostModalVisible] = useState(false);
    const { user } = useAuth();
    const [listings, setListings] = useState<Listing[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const [commentingOnPost, setCommentingOnPost] = useState<Post | null>(null);

    const [visiblePostId, setVisiblePostId] = useState<number | null>(null);

    const [isImageViewerVisible, setImageViewerVisible] = useState(false);
    const [imageViewerIndex, setImageViewerIndex] = useState(0);
    const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);

    const translateY = useSharedValue(Dimensions.get('window').height);
    const backdropOpacity = useSharedValue(0);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].isViewable) {
            setVisiblePostId(viewableItems[0].item.id);
        }
    }).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, { damping: 18, stiffness: 150 });
            backdropOpacity.value = withTiming(1, { duration: 300 });
        } else {
            translateY.value = withTiming(Dimensions.get('window').height, { duration: 300 });
            backdropOpacity.value = withTiming(0, { duration: 300 });
        }
    }, [visible]);

    const animatedModalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const fetchPostsAndListings = async () => {
        setLoading(true);
        try {
            const { data: postData, error: postError } = await supabase
                .from('Fitpicpost')
                .select('*, users (fullName, profilePhotoUrl), likes:fitpicpost_likes(count), comments:fitpicpost_comments(count)')
                .order('created_at', { ascending: false });

            if (postError) throw new Error(`Failed to fetch posts: ${postError.message}`);

            if (postData) {
                const validPosts = postData.filter(post => post.users);

                const postsWithUserData = validPosts.map(post => ({
                    ...post,
                    users: Array.isArray(post.users) ? post.users[0] : post.users,
                    likes_count: post.likes[0]?.count || 0,
                    comments_count: post.comments[0]?.count || 0,
                }));
                setPosts(postsWithUserData as Post[]);
            } else {
                setPosts([]);
            }

            if (user) {
                const { data: listingsData, error: listingsError } = await supabase
                    .from('listings')
                    .select('id, image_urls, user_id, item_name')
                    .eq('user_id', user.id)
                    .eq('status', 'active');

                if (listingsError) throw new Error(`Failed to fetch listings: ${listingsError.message}`);
                setListings(listingsData || []);
            }
        } catch (error: any) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', error.message || 'Could not fetch data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchPostsAndListings();
        }
    }, [visible, user]);

    useEffect(() => {
        if (posts.length > 0 && initialPostId) {
            const postIndex = posts.findIndex(p => p.id === initialPostId);
            if (postIndex !== -1) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index: postIndex, animated: false });
                    if (initialOpenCommentsPostId === initialPostId) {
                        setCommentingOnPost(posts[postIndex]);
                    }
                }, 500);
            }
        }
    }, [posts, initialPostId, initialOpenCommentsPostId]);

    const handleSavePost = async (caption: string, selectedListing: Listing, videoUrl: string | null, imageUrls: string[], postId?: number) => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to post.');
            return;
        }
        if (!selectedListing) {
            Alert.alert('Error', 'Selected listing not found.');
            return;
        }

        const postData = {
            user_id: user.id,
            caption: caption,
            image_url: imageUrls[0] || selectedListing.image_urls[0],
            listing_id: selectedListing.id,
            listing_url: `/listing/${selectedListing.id}`,
            video_url: videoUrl,
            image_urls: imageUrls.length > 0 ? imageUrls : null,
        };

        try {
            let error;
            if (postId) {
                const { error: updateError } = await supabase.from('Fitpicpost').update(postData).eq('id', postId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('Fitpicpost').insert([postData]);
                error = insertError;
            }

            if (error) throw new Error(`Failed to save post: ${error.message}`);

            setAddPostModalVisible(false);
            setEditingPost(null);
            await fetchPostsAndListings();
        } catch (error: any) {
            console.error('Error saving post:', error);
            Alert.alert('Error', error.message || 'Could not save post.');
        }
    };

    const handleDeletePost = async (postId: number) => {
        setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
        const { error } = await supabase.from('Fitpicpost').delete().eq('id', postId);
        if (error) {
            Alert.alert("Error", "Could not delete the post. Please try again.");
            fetchPostsAndListings();
        }
    };

    const handleOpenAddModal = (post: Post | null) => {
        setEditingPost(post);
        setAddPostModalVisible(true);
    };

    const handleOpenImageViewer = (images: string[], index: number) => {
        setImageViewerImages(images);
        setImageViewerIndex(index);
        setImageViewerVisible(true);
    };

    if (!visible) {
        return null;
    }

    return (
        <Portal>
            <GestureHandlerRootView style={StyleSheet.absoluteFill}>
                <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, animatedBackdropStyle]} />
                <Animated.View style={[styles.container, animatedModalStyle, { paddingTop: insets.top }]}>
                    <View style={[styles.feedHeader, { backgroundColor: colors.card }]}>
                        <TouchableOpacity style={styles.backButton} onPress={onClose}>
                            <FontAwesome name="arrow-left" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>ThriftShare</Text>
                        <View style={styles.headerPlaceholder} />
                    </View>
                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={posts}
                            renderItem={({ item }) => (
                                <StoryCard
                                    post={item}
                                    isFocused={item.id === visiblePostId}
                                    onDeletePost={handleDeletePost}
                                    onEditPost={handleOpenAddModal}
                                    onOpenComments={setCommentingOnPost}
                                    onCloseModal={onClose}
                                    onOpenImageViewer={handleOpenImageViewer}
                                />
                            )}
                            keyExtractor={(item) => item.id.toString()}
                            // --- FIX: Increased padding and removed pagingEnabled to fix scrolling ---
                            contentContainerStyle={[styles.feedContainer, { paddingBottom: 120 + insets.bottom }]}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={viewabilityConfig}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                    <View style={[styles.footer, { backgroundColor: colors.card, height: 72 + insets.bottom, paddingBottom: insets.bottom }]}>
                        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => handleOpenAddModal(null)}>
                            <FontAwesome name="plus" size={24} color={colors.card} />
                        </TouchableOpacity>
                    </View>
                    <AddPostModal
                        visible={addPostModalVisible}
                        onClose={() => { setAddPostModalVisible(false); setEditingPost(null); }}
                        listings={listings}
                        onSave={handleSavePost}
                        user={user}
                        editingPost={editingPost}
                    />
                    {commentingOnPost && (
                        <CommentsModal
                            visible={!!commentingOnPost}
                            onClose={() => setCommentingOnPost(null)}
                            post={commentingOnPost}
                        />
                    )}

                    <FullScreenImageModal
                        images={imageViewerImages.map(url => ({ uri: url }))}
                        initialIndex={imageViewerIndex}
                        isVisible={isImageViewerVisible}
                        onClose={() => setImageViewerVisible(false)}
                    />

                </Animated.View>
            </GestureHandlerRootView>
        </Portal>
    );
};

const styles = StyleSheet.create({
    playPauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    // --- REMOVED: Styles for old fullscreen modal ---
    backdrop: {
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#f5f7fa',
    },
    feedHeader: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    backButton: {
        padding: 5,
    },
    headerPlaceholder: {
        width: 24,
    },
    feedContainer: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    storyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        overflow: 'hidden',
        aspectRatio: 3 / 4,
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        width: '100%',
    },
    topRightActions: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10,
    },
    menuButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    customMenuContainer: {
        position: 'absolute',
        top: 45,
        right: 0,
        width: 200,
        borderRadius: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    customMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    customMenuText: {
        marginLeft: 15,
        fontSize: 16,
        fontWeight: '500',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000', // Add a background color for videos
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    textContent: {
        flex: 1,
        marginRight: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
        marginRight: 10,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    timestamp: {
        fontSize: 11,
        color: '#e0e0e0',
        fontWeight: '400',
    },
    captionContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 10,
        marginTop: 6,
    },
    caption: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '400',
        lineHeight: 20,
    },
    moreLessText: {
        color: '#60a5fa',
        fontWeight: '600',
        fontSize: 13,
        marginTop: 2,
    },
    storyCardActions: {
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        gap: 12,
    },
    storyCardActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
    },
    likesCount: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    footer: {
        height: 72,
        width: '100%',
        position: 'absolute',
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        width: '92%',
        maxHeight: '85%',
        borderRadius: 28,
        backgroundColor: '#ffffff',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#121212',
    },
    modalBody: {
        padding: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: '#121212',
        backgroundColor: '#f9fafb',
    },
    captionInput: {
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 20,
        paddingTop: 16,
    },
    uploadButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f5ff',
        width: 90,
        height: 90,
        borderRadius: 16,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    uploadText: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
    },
    mediaPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 12,
    },
    mediaText: {
        color: '#1e293b',
        marginRight: 8,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 8,
    },
    removeButton: {
        padding: 4,
    },
    listingContainer: {
        marginBottom: 20,
    },
    listingItem: {
        marginRight: 12,
        alignItems: 'center',
        width: 100,
    },
    listingImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    listingName: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
        textAlign: 'center',
    },
    selectedListing: {
        borderColor: '#3b82f6',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        borderTopWidth: 1,
        gap: 10,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    paginationContainer: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginationDot: {
        marginHorizontal: 3,
    },
    mediaUploadContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        marginBottom: 16,
    },
    tab: {
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#3b82f6',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    activeTabText: {
        color: '#3b82f6',
    },
});
