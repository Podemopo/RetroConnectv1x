import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Review } from '../profile/ReviewsSection';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  isSubmitting: boolean;
  reviewedUserName: string;
  editingReview: Review | null;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ visible, onClose, onSubmit, isSubmitting, reviewedUserName, editingReview }) => {
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (editingReview && visible) {
      setRating(editingReview.rating);
      setComment(editingReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
  }, [editingReview, visible]);


  const handleSubmit = () => {
    onSubmit(rating, comment);
  };

  const Star = ({ index }: { index: number }) => (
    <Pressable onPress={() => setRating(index + 1)}>
      {({ pressed }) => (
        <FontAwesome
          name={rating > index ? 'star' : 'star-o'}
          size={32}
          color={rating > index ? '#FFD700' : colors.text + '80'}
          style={[styles.star, { transform: [{ scale: pressed ? 1.2 : 1.0 }]}]}
        />
      )}
    </Pressable>
  );

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {editingReview ? 'Edit Your Review' : `Review ${reviewedUserName}`}
          </Text>
          <View style={styles.starsContainer}>
            {[...Array(5)].map((_, i) => <Star key={i} index={i} />)}
          </View>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            placeholder="Share your experience..."
            placeholderTextColor={colors.text + '80'}
            multiline
            value={comment}
            onChangeText={setComment}
            editable={!isSubmitting}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.border }]} onPress={onClose} disabled={isSubmitting}>
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: rating > 0 ? colors.primary : colors.border }]}
              onPress={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <Text style={[styles.buttonText, { color: rating > 0 ? colors.card : colors.text+'80' }]}>
                  {editingReview ? 'Save Changes' : 'Submit'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalView: { width: '90%', maxWidth: 400, borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
    star: { marginHorizontal: 5 },
    textInput: { height: 120, borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 16, textAlignVertical: 'top', marginBottom: 25 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontSize: 16, fontWeight: '600' },
});