import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../supabase';
import { useTimeAgo } from '../../utils/time-ago'; // Adjust path as needed
import { useAuth } from '../context/AuthContext';

interface IComment {
    id: any;
    post_id: any;
    user: {
        id: any;
        username: string;
        profilePhotoUrl: string | null; // Allow null for profile photo
    };
    comment: string;
    created_at: string;
    likes_count: number;
    is_liked: boolean;
    replies: IComment[];
    parent_comment_id: any;
    user_id: any;
    thread_parent_id?: any; 
}

const Timestamp: React.FC<{ date: string }> = ({ date }) => {
    const timeAgo = useTimeAgo(date);
    return <Text style={styles.timestampText}>{timeAgo}</Text>;
};

// NEW: Placeholder for users without a profile picture
const AvatarPlaceholder: React.FC<{ username: string }> = React.memo(({ username }) => {
    const initial = username ? username.charAt(0).toUpperCase() : '?';
    return (
        <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>{initial}</Text>
        </View>
    );
});


// Child component for rendering each comment
const Comment: React.FC<{
    item: IComment;
    onReply: (item: IComment) => void;
    onLike: (item: IComment) => void;
    postAuthorId: any;
    isReply?: boolean;
}> = React.memo(({ item, onReply, onLike, postAuthorId, isReply = false }) => {
    const { colors } = useTheme();
    const [repliesVisible, setRepliesVisible] = useState(false);

    const commentParts = item.comment.split(' ');
    const firstWord = commentParts[0];
    const restOfComment = commentParts.slice(1).join(' ');
    const isReplyWithMention = item.parent_comment_id && firstWord.startsWith('@');

    return (
        <View style={[styles.commentContainer, isReply && styles.replyContainer]}>
            {/* FIX: Conditionally render Image or Placeholder */}
            {item.user.profilePhotoUrl ? (
                 <Image source={{ uri: item.user.profilePhotoUrl }} style={styles.commentAvatar} />
            ) : (
                <AvatarPlaceholder username={item.user.username} />
            )}
           
            <View style={styles.commentContent}>
                <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                        <Text style={[styles.commentUser, { color: colors.text }]}>{item.user.username}</Text>
                        {item.user_id === postAuthorId && (
                            <Text style={styles.authorBadge}>Author</Text>
                        )}
                        <Timestamp date={item.created_at} />
                    </View>

                    <Text style={[styles.commentText, { color: colors.text }]}>
                        {isReplyWithMention ? (
                            <>
                                <Text style={styles.mentionText}>{firstWord} </Text>
                                <Text>{restOfComment}</Text>
                            </>
                        ) : (
                            item.comment
                        )}
                    </Text>
                    <TouchableOpacity onPress={() => onReply(item)}>
                        <Text style={styles.replyText}>Reply</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.likeButton} onPress={() => onLike(item)}>
                    <FontAwesome
                        name={item.is_liked ? 'heart' : 'heart-o'}
                        size={18}
                        color={item.is_liked ? '#ef4444' : colors.text}
                    />
                    {item.likes_count > 0 && (
                        <Text style={[styles.likesCount, { color: colors.text }]}>
                            {item.likes_count}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {!isReply && item.replies?.length > 0 && (
                 <View style={styles.replyList}>
                    {repliesVisible ? (
                        <FlatList
                            data={item.replies}
                            renderItem={({ item: replyItem }) => (
                                <Comment
                                    item={replyItem}
                                    onReply={onReply}
                                    onLike={onLike}
                                    postAuthorId={postAuthorId}
                                    isReply={true}
                                />
                            )}
                            keyExtractor={(reply) => `reply-${reply.id}`}
                        />
                    ) : (
                        <TouchableOpacity onPress={() => setRepliesVisible(true)}>
                             <Text style={styles.viewRepliesText}>
                                View {item.replies.length} more repl{item.replies.length > 1 ? 'ies' : 'y'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
});


// Main Modal Component
export const CommentsModal: React.FC<{ visible: boolean; onClose: () => void; post: any; }> = ({ visible, onClose, post }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [comments, setComments] = useState<IComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<IComment | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchComments = useCallback(async () => {
        if (!post?.id) return;
        setLoading(true);

        const { data: allComments, error } = await supabase
            .from('fitpicpost_comments')
            .select('*, user:users!inner(id, username, profilePhotoUrl)')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

        if (error) {
            setComments([]);
            setLoading(false);
            return;
        }

        const commentIds = allComments.map((c) => c.id);
        const { data: allLikes } = await supabase
            .from('fitpicpost_comment_likes')
            .select('comment_id, user_id')
            .in('comment_id', commentIds);
        
        const commentsById: { [key: string]: IComment } = {};
        allComments.forEach((comment) => {
            const commentLikes = allLikes?.filter(like => like.comment_id === comment.id) || [];
            commentsById[comment.id] = {
                ...comment,
                replies: [],
                likes_count: commentLikes.length,
                is_liked: commentLikes.some(like => like.user_id === user?.id),
                thread_parent_id: comment.parent_comment_id ? (commentsById[comment.parent_comment_id]?.thread_parent_id || comment.parent_comment_id) : comment.id
            };
        });

        const rootComments: IComment[] = [];
        const repliesMap: { [key: string]: IComment[] } = {};

        allComments.forEach(c => {
            const comment = commentsById[c.id];
            if (!comment.parent_comment_id) {
                rootComments.push(comment);
            } else {
                const threadParentId = comment.thread_parent_id || comment.parent_comment_id;
                if (!repliesMap[threadParentId]) {
                    repliesMap[threadParentId] = [];
                }
                repliesMap[threadParentId].push(comment);
            }
        });

        const finalComments = rootComments.map(rc => ({
            ...rc,
            replies: repliesMap[rc.id]?.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || [],
        }));
        
        setComments(finalComments.reverse());
        setLoading(false);
    }, [post.id, user?.id]);


    useEffect(() => {
        if (visible) {
            fetchComments();
        }
    }, [visible, fetchComments]);

    const handleLikeComment = useCallback((likedComment: IComment) => {
        if (!user) return;

        const updateCommentState = (allComments: IComment[]): IComment[] => {
            return allComments.map(comment => {
                if (comment.id === likedComment.id) {
                    return {
                        ...comment,
                        is_liked: !comment.is_liked,
                        likes_count: comment.is_liked ? comment.likes_count - 1 : comment.likes_count + 1,
                    };
                }
                if (comment.replies?.length > 0) {
                    return { ...comment, replies: updateCommentState(comment.replies) };
                }
                return comment;
            });
        };
        
        setComments(updateCommentState);

        const performLike = async () => {
            if (likedComment.is_liked) {
                await supabase.from('fitpicpost_comment_likes').delete().match({ comment_id: likedComment.id, user_id: user.id });
            } else {
                 await supabase.from('fitpicpost_comment_likes').insert({ comment_id: likedComment.id, user_id: user.id });
            }
        };

        performLike();
    }, [user, setComments]);
    
    const handlePostComment = useCallback(async () => {
        if (!user || !newComment.trim()) return;

        let commentText = newComment.trim();
        if (replyingTo) {
            commentText = `@${replyingTo.user.username} ${commentText}`;
        }
        
        const tempId = `temp-${Date.now()}`;
        const parentIdForDb = replyingTo?.thread_parent_id || replyingTo?.id || null;

        const newCommentObject: IComment = {
            id: tempId,
            comment: commentText,
            created_at: new Date().toISOString(),
            is_liked: false,
            likes_count: 0,
            parent_comment_id: parentIdForDb,
            thread_parent_id: parentIdForDb,
            post_id: post.id,
            user_id: user.id,
            user: {
                id: user.id,
                username: user.user_metadata?.username || 'You',
                // FIX: Use null instead of an empty string
                profilePhotoUrl: user.user_metadata?.profilePhotoUrl || null,
            },
            replies: [],
        };
        
        const addCommentToState = (comments: IComment[], parentId: any | null): IComment[] => {
            if (!parentId) {
                return [newCommentObject, ...comments];
            }
            return comments.map(c => {
                if (c.id === parentId) {
                    return { ...c, replies: [...c.replies, newCommentObject] };
                }
                return c;
            });
        };
        
        setComments(prevComments => addCommentToState(prevComments, parentIdForDb));

        setNewComment('');
        setReplyingTo(null);
        
        const { data, error } = await supabase
            .from('fitpicpost_comments')
            .insert({
                user_id: newCommentObject.user_id,
                post_id: newCommentObject.post_id,
                comment: newCommentObject.comment,
                parent_comment_id: newCommentObject.parent_comment_id,
            })
            .select('*, user:users!inner(id, username, profilePhotoUrl)')
            .single();
            
        if (error) {
            Alert.alert('Error', 'Could not post comment.');
            fetchComments();
        } else if (data) {
            const finalComment = { ...data, replies: [], is_liked: false, likes_count: 0, thread_parent_id: parentIdForDb };
            const replaceTempComment = (comments: IComment[]): IComment[] => {
                return comments.map(c => {
                    if (c.id === parentIdForDb) {
                        return {...c, replies: c.replies.map(r => r.id === tempId ? finalComment : r) };
                    }
                    if (c.id === tempId) return finalComment;
                    return c;
                })
            };
            setComments(replaceTempComment);
        }

    }, [user, newComment, replyingTo, post.id, setComments, fetchComments]);


    const handleSetReplyingTo = useCallback((item: IComment) => {
        setReplyingTo(item);
    }, []);

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
                        <TouchableOpacity onPress={onClose}>
                            <FontAwesome name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3b82f6" />
                    ) : (
                        <FlatList
                            data={comments}
                            renderItem={({ item }) => (
                                <Comment
                                    item={item}
                                    onReply={handleSetReplyingTo}
                                    onLike={handleLikeComment}
                                    postAuthorId={post.user_id}
                                />
                            )}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.commentList}
                            extraData={comments} 
                        />
                    )}
                    <View style={styles.commentInputContainer}>
                        {replyingTo && (
                            <View style={styles.replyingTo}>
                                <Text style={styles.replyingToText}>
                                    Replying to @{replyingTo.user.username}
                                </Text>
                                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                    <FontAwesome name="close" size={16} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.inputWrapper}>
                             <TextInput
                                style={[styles.commentInput, { color: colors.text }]}
                                placeholder="Add a comment..."
                                placeholderTextColor="#6b7280"
                                value={newComment}
                                onChangeText={setNewComment}
                                autoFocus={!!replyingTo}
                            />
                            <TouchableOpacity onPress={handlePostComment}>
                                <FontAwesome name="paper-plane" size={20} color="#3b82f6" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Add styles for the new AvatarPlaceholder
const styles = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { height: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    commentList: { paddingTop: 8, paddingBottom: 150 },
    commentContainer: { paddingVertical: 8 },
    replyContainer: { marginLeft: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#f0f0f0' },
    commentContent: { flexDirection: 'row', alignItems: 'flex-start', marginLeft: 48, marginTop: -36 },
    commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5e7eb' }, // Default bg for image loading
    // Styles for the placeholder
    avatarPlaceholder: {
        backgroundColor: '#d1d5db',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        color: '#4b5563',
        fontWeight: 'bold',
        fontSize: 16,
    },
    commentBody: { flex: 1, marginRight: 16 },
    commentHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    commentUser: { fontWeight: 'bold', fontSize: 14, marginRight: 6 },
    authorBadge: { backgroundColor: '#e0e7ff', color: '#3730a3', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignSelf: 'center', marginRight: 6 },
    timestampText: { fontSize: 12, color: '#6b7280' },
    commentText: { marginTop: 4, fontSize: 14, lineHeight: 20 },
    mentionText: { color: '#3b82f6', fontWeight: '600' },
    replyText: { color: '#6b7280', fontWeight: '500', marginTop: 8, fontSize: 12 },
    likeButton: { alignItems: 'center', paddingHorizontal: 8, },
    likesCount: { fontSize: 12, color: '#6b7280', marginTop: 4 },
    replyList: { marginLeft: 48, marginTop: 8 },
    viewRepliesText: { color: '#007AFF', fontWeight: 'bold', fontSize: 13 },
    commentInputContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 24, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    replyingTo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 8 },
    replyingToText: { fontSize: 13, fontWeight: '500', color: '#4b5563' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
    commentInput: { flex: 1, marginRight: 12, fontSize: 14 },
});
