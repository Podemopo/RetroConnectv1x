// /components/modals/FilterModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export type Filters = {
    sortOption: string;
    condition: 'All' | 'New' | 'Used';
    priceRange: { min: string; max: string };
};

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    initialFilters: Filters;
    onApplyFilters: (filters: Filters) => void;
}

export const FilterModal = ({ visible, onClose, initialFilters, onApplyFilters }: FilterModalProps) => {
    const { colors } = useTheme();
    const [sortOption, setSortOption] = useState(initialFilters.sortOption);
    const [condition, setCondition] = useState(initialFilters.condition);
    const [minPrice, setMinPrice] = useState(initialFilters.priceRange.min);
    const [maxPrice, setMaxPrice] = useState(initialFilters.priceRange.max);

    useEffect(() => {
        if(visible) {
            setSortOption(initialFilters.sortOption);
            setCondition(initialFilters.condition);
            setMinPrice(initialFilters.priceRange.min);
            setMaxPrice(initialFilters.priceRange.max);
        }
    }, [visible, initialFilters]);
    
    const handleApply = () => onApplyFilters({ sortOption, condition, priceRange: { min: minPrice, max: maxPrice } });
    const handleReset = () => { setSortOption('Best Match'); setCondition('All'); setMinPrice(''); setMaxPrice(''); };

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <View style={[styles.modalView, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose}><FontAwesome name="close" size={24} color={colors.text} /></TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Filter And Sort</Text>
                    <TouchableOpacity onPress={handleReset}><Text style={{color: colors.primary}}>Reset</Text></TouchableOpacity>
                </View>
                <ScrollView style={styles.filterScrollView}>
                    <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Sort</Text>
                    <View style={styles.filterOptionGroup}>
                        {['Best Match', 'Recent', 'Price - High to Low', 'Price - Low to High'].map(opt => (
                            <TouchableOpacity key={opt} style={[styles.filterChip, {backgroundColor: sortOption === opt ? colors.primary : colors.card, borderColor: sortOption === opt ? colors.primary : colors.border}]} onPress={() => setSortOption(opt)}>
                                <Text style={{color: sortOption === opt ? colors.card : colors.text}}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Item Condition</Text>
                    <View style={styles.filterOptionGroup}>
                        {(['All', 'New', 'Used'] as const).map(opt => (
                            <TouchableOpacity key={opt} style={[styles.filterChip, {backgroundColor: condition === opt ? colors.primary : colors.card, borderColor: condition === opt ? colors.primary : colors.border}]} onPress={() => setCondition(opt)}>
                                <Text style={{color: condition === opt ? colors.card : colors.text}}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Price</Text>
                    <View style={styles.priceInputContainer}>
                        <TextInput value={minPrice} onChangeText={setMinPrice} placeholder='Minimum' keyboardType='numeric' placeholderTextColor={colors.text+'99'} style={[styles.priceInput, {backgroundColor: colors.card, borderColor: colors.border, color: colors.text}]} />
                        <TextInput value={maxPrice} onChangeText={setMaxPrice} placeholder='Maximum' keyboardType='numeric' placeholderTextColor={colors.text+'99'} style={[styles.priceInput, {backgroundColor: colors.card, borderColor: colors.border, color: colors.text}]} />
                    </View>
                </ScrollView>
                <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.primary }]} onPress={handleApply}>
                    <Text style={[styles.applyButtonText, { color: colors.card }]}>Apply Filters</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalView: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    applyButton: { margin: 15, padding: 15, borderRadius: 8, alignItems: 'center' },
    applyButtonText: { fontSize: 16, fontWeight: 'bold' },
    filterScrollView: { padding: 20, flex: 1 },
    filterSectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
    filterOptionGroup: { flexDirection: 'row', flexWrap: 'wrap' },
    filterChip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, marginRight: 10, marginBottom: 10 },
    priceInputContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    priceInput: { flex: 1, height: 50, borderRadius: 8, paddingHorizontal: 15, borderWidth: 1 },
});