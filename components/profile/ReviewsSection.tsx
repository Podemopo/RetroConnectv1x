// sdaw/components/profile/ReviewsSection.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
// --- THIS IS THE FIX: Added TouchableOpacity back to the import list ---
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Review {
  id: number;
  created_at: string;
  rating: number;
  comment: string;
  reviewer: {
    id: string;
    fullName: string;
    profilePhotoUrl: string;
  };
}

interface ReviewsSectionProps {
    reviews: Review[];
    currentUserId?: string;
    onEditReview?: (review: Review) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, currentUserId, onEditReview }) => {
    const { colors } = useTheme();

    const renderStars = (rating: number) => {
      return [...Array(5)].map((_, i) => (
        <FontAwesome key={i} name="star" size={16} color={i < rating ? '#FFD700' : colors.border} style={{ marginRight: 3 }} />
      ));
    };

    const renderReviewItem = ({ item }: { item: Review }) => {
        const isOwnReview = item.reviewer.id === currentUserId;

        return (
            <View style={[styles.reviewCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
                <View style={styles.reviewHeader}>
                    <Image source={{ uri: item.reviewer.profilePhotoUrl }} style={styles.reviewerAvatar} />
                    <View style={styles.reviewerInfo}>
                        <Text style={[styles.reviewerName, { color: colors.text }]}>{item.reviewer.fullName}</Text>
                        <View style={styles.starRatingContainer}>{renderStars(item.rating)}</View>
                    </View>
                    <View style={styles.rightHeader}>
                      <Text style={[styles.reviewTimestamp, { color: colors.text + '99' }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                      {isOwnReview && onEditReview && (
                        <TouchableOpacity onPress={() => onEditReview(item)} style={[styles.editButton, {backgroundColor: colors.primary + '20'}]}>
                           <FontAwesome name="pencil" size={14} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                </View>
                <Text style={[styles.reviewComment, { color: colors.text + 'dd' }]}>{item.comment}</Text>
            </View>
        );
    };

    if (reviews.length === 0) {
      return (
        <View style={styles.noReviewsContainer}>
            <FontAwesome name="comments-o" size={50} color={colors.text + '40'} />
            <Text style={[styles.noInfoText, { color: colors.text + '99' }]}>
                This user has no reviews yet.
            </Text>
        </View>
      );
    }

    return (
        <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        />
    );
};

const styles = StyleSheet.create({
    noReviewsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 250, gap: 20 },
    noInfoText: { fontSize: 16, textAlign: 'center' },
    listContainer: { paddingHorizontal: 16, paddingVertical: 10 },
    reviewCard: {
        borderRadius: 16,
        padding: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
    },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    reviewerAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 15 },
    reviewerInfo: { flex: 1 },
    reviewerName: { fontSize: 17, fontWeight: '700' },
    starRatingContainer: { flexDirection: 'row', marginTop: 5 },
    rightHeader: { alignItems: 'flex-end', gap: 8 },
    reviewTimestamp: { fontSize: 13, opacity: 0.8 },
    editButton: {
        padding: 8,
        borderRadius: 20,
    },
    reviewComment: { fontSize: 16, lineHeight: 24 },
});