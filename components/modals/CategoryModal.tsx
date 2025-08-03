// /components/modals/CategoryModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Modal, Platform, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Category {
    name: string;
    items: string[];
}

interface CategoryModalProps {
    visible: boolean;
    onClose: () => void;
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    categories: Category[];
}

const CategoryModal: React.FC<CategoryModalProps> = ({ visible, onClose, selectedCategory, onSelectCategory, categories }) => {
    const { colors } = useTheme();
    const sections = [
        { title: 'All', data: ['All Categories'] },
        ...categories.map(cat => ({ title: cat.name, data: cat.items.length > 0 ? cat.items : [cat.name] }))
    ];

    const handleSelect = (item: string) => {
        const isMainCategory = categories.some(cat => cat.name === item && cat.items.length === 0);
        if (isMainCategory) {
            onSelectCategory(item);
        } else {
            onSelectCategory(item);
        }
    };

    const renderItem = ({ item, section }: { item: string, section: { title: string } }) => {
        const isSelected = selectedCategory === item;
        // This handles main categories that have no sub-items, like "Following"
        if (section.title === item && categories.find(c => c.name === item)?.items.length === 0) {
            return null; // Don't render it as a selectable item, it's already a header
        }
        return (
            <TouchableOpacity
                style={[styles.categoryItem, { borderBottomColor: colors.border }, isSelected && { backgroundColor: colors.primary+'20' }]}
                onPress={() => handleSelect(item)}
            >
                <Text style={[styles.categoryItemText, { color: colors.text }, isSelected && { color: colors.primary, fontWeight: 'bold' }]}>{item}</Text>
                {isSelected && <FontAwesome name="check-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => {
        const isActionableHeader = categories.some(cat => cat.name === title && cat.items.length === 0);
        if (isActionableHeader) {
            return (
                <TouchableOpacity onPress={() => handleSelect(title)}>
                    <Text style={[styles.modalMainCategory, { color: title === 'All' ? colors.text : colors.primary, backgroundColor: colors.background }]}>{title}</Text>
                </TouchableOpacity>
            )
        }
        return <Text style={[styles.modalMainCategory, { color: title === 'All' ? colors.text : colors.primary, backgroundColor: colors.background }]}>{title}</Text>
    };

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <View style={[styles.modalView, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose}><FontAwesome name="close" size={24} color={colors.text} /></TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Categories</Text>
                    <View style={{width: 24}}/>
                </View>
                <SectionList
                    sections={sections}
                    keyExtractor={(item, index) => item + index}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    stickySectionHeadersEnabled={true}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalView: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalMainCategory: { fontSize: 16, fontWeight: 'bold', paddingVertical: 10, paddingHorizontal: 20 },
    categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
    categoryItemText: { fontSize: 16, flex: 1 },
});

export default CategoryModal;