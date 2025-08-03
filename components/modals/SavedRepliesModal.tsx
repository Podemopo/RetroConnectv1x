// sdaw/components/modals/SavedRepliesModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { supabase } from '../../supabase';
import { useAuth } from '../context/AuthContext';

export type SavedReply = {
    id: number;
    user_id: string;
    short_code: string;
    message: string;
    created_at: string;
};

interface SavedRepliesModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectReply: (message: string) => void;
}

const EditForm = ({ onSave, onCancel, isSaving, initialData }: { onSave: (code: string, msg: string) => void, onCancel: () => void, isSaving: boolean, initialData?: SavedReply | null }) => {
    const { colors } = useTheme();
    const [shortCode, setShortCode] = useState(initialData?.short_code || '');
    const [message, setMessage] = useState(initialData?.message || '');

    return (
        <View style={[styles.editForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.editFormTitle, {color: colors.text}]}>{initialData ? 'Edit Reply' : 'Create New Reply'}</Text>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="Shortcut (e.g., 'address')" value={shortCode} onChangeText={setShortCode} placeholderTextColor={colors.text+'80'}/>
            <TextInput style={[styles.input, styles.messageInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="Full message template..." value={message} onChangeText={setMessage} multiline placeholderTextColor={colors.text+'80'}/>
            <View style={styles.formActions}>
                <TouchableOpacity style={[styles.formButton, {backgroundColor: colors.border}]} onPress={onCancel}><Text style={{color: colors.text}}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.formButton, {backgroundColor: colors.primary, flex: 1}]} onPress={() => onSave(shortCode, message)} disabled={isSaving}>
                    {isSaving ? <ActivityIndicator color={colors.card} /> : <Text style={{color: colors.card, fontWeight: 'bold'}}>Save</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export const SavedRepliesModal: React.FC<SavedRepliesModalProps> = ({ visible, onClose, onSelectReply }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [replies, setReplies] = useState<SavedReply[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingReply, setEditingReply] = useState<SavedReply | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchReplies = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('saved_replies')
            .select('*')
            .eq('user_id', user.id)
            .order('short_code', { ascending: true });

        if (error) Alert.alert("Error", "Could not fetch saved replies.");
        else setReplies(data || []);
        setLoading(false);
    };

    useEffect(() => {
        if (visible) {
            fetchReplies();
        }
    }, [visible, user]);

    const handleSave = async (short_code: string, message: string) => {
        if (!user || !short_code.trim() || !message.trim()) {
            Alert.alert("Missing Information", "Please provide a shortcut and a message.");
            return;
        }
        setIsSaving(true);
        const action = editingReply 
            ? supabase.from('saved_replies').update({ short_code: short_code.trim(), message: message.trim() }).eq('id', editingReply.id)
            : supabase.from('saved_replies').insert({ user_id: user.id, short_code: short_code.trim(), message: message.trim() });
        
        const { error } = await action;
        if (error) Alert.alert("Error", "Could not save the reply.");
        
        setIsSaving(false);
        closeForm();
        fetchReplies();
    };
    
    const handleDelete = async (id: number) => {
        Alert.alert(
            "Confirm Deletion", "Are you sure you want to delete this saved reply?",
            [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => {
                const { error } = await supabase.from('saved_replies').delete().eq('id', id);
                if (error) Alert.alert("Error", "Could not delete the reply.");
                else fetchReplies();
            }}]
        );
    };

    const handleSelect = (reply: SavedReply) => {
        onSelectReply(reply.message);
        onClose();
    };

    const openForm = (reply: SavedReply | null = null) => {
        setEditingReply(reply);
        setIsFormVisible(true);
    };

    const closeForm = () => {
        setEditingReply(null);
        setIsFormVisible(false);
    };

    const renderItem = ({ item }: { item: SavedReply }) => (
        <TouchableOpacity style={[styles.replyCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleSelect(item)}>
            <View style={styles.replyContent}>
                <Text style={[styles.shortCode, { color: colors.primary }]}>/{item.short_code}</Text>
                <Text style={[styles.replyMessage, { color: colors.text }]} numberOfLines={2}>{item.message}</Text>
            </View>
            <View style={styles.replyActions}>
                <TouchableOpacity onPress={() => openForm(item)} style={styles.actionButton}><FontAwesome name="pencil" size={20} color={colors.text + '99'} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}><FontAwesome name="trash-o" size={20} color={'#FF4136'} /></TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Replies</Text>
                    <TouchableOpacity onPress={onClose}><FontAwesome name="close" size={24} color={colors.text} /></TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} />
                ) : (
                    <FlatList
                        data={replies}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={<Text style={styles.emptyText}>No saved replies yet. Tap "Create New" to start.</Text>}
                    />
                )}
                
                <View style={[styles.footer, {borderTopColor: colors.border}]}>
                     <TouchableOpacity style={[styles.createNewButton, {backgroundColor: colors.primary}]} onPress={() => openForm(null)}>
                        <FontAwesome name="plus" size={16} color={colors.card} />
                        <Text style={styles.createNewButtonText}>Create New</Text>
                     </TouchableOpacity>
                </View>
            </View>
            
            <Modal visible={isFormVisible} transparent={true} animationType="fade" onRequestClose={closeForm}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                     <View style={styles.formBackdrop}>
                        <EditForm onSave={handleSave} onCancel={closeForm} isSaving={isSaving} initialData={editingReply} />
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </Modal>
    );
};


const styles = StyleSheet.create({
    modalContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
    headerTitle: { fontSize: 20, fontWeight: '600' },
    listContainer: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 100 },
    replyCard: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 10, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    replyContent: { flex: 1, marginRight: 10 },
    shortCode: { fontWeight: 'bold', marginBottom: 6 },
    replyMessage: { lineHeight: 20 },
    replyActions: { flexDirection: 'row' },
    actionButton: { padding: 8 },
    formBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    editForm: { width: '100%', padding: 20, borderRadius: 12, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
    editFormTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    input: { height: 44, borderRadius: 8, borderWidth: 1, paddingHorizontal: 15 },
    messageInput: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
    formActions: { flexDirection: 'row', gap: 10, marginTop: 5 },
    formButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flex: 1 },
    footer: { padding: 15, paddingTop: 10, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white' },
    createNewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, gap: 10 },
    createNewButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 16 }
});