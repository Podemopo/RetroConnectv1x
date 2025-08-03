// /components/modals/EditFieldModal.tsx
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EditFieldModalProps {
    visible: boolean;
    onClose: () => void;
    label: string;
    initialValue?: string;
    onSave: (newValue: string) => void;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    multiline?: boolean;
    numberOfLines?: number;
    isPicker?: boolean;
    pickerOptions?: { label: string; value: string; }[];
    onPickerSelect?: (value: string) => void;
    formatText?: (text: string) => string;
}

export const EditFieldModal: React.FC<EditFieldModalProps> = ({
    visible, onClose, label, initialValue, onSave, keyboardType = 'default', multiline = false,
    numberOfLines = 1, isPicker = false, pickerOptions = [], onPickerSelect,
    formatText,
}) => {
    const { colors } = useTheme();
    const [inputValue, setInputValue] = useState(initialValue || '');
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setInputValue(initialValue || '');
        if (visible && !isPicker) {
            const timer = setTimeout(() => { inputRef.current?.focus(); }, 100);
            return () => clearTimeout(timer);
        }
    }, [visible, initialValue, isPicker]);

    const handleSave = () => {
        // --- THIS IS THE FIX ---
        // Format the text one last time to ensure it's clean before validation and saving.
        const finalValue = formatText ? formatText(inputValue) : inputValue;

        // Perform validation on the final, cleaned value.
        if (label.toLowerCase() === 'username') {
            const usernameRegex = /^[a-z0-9]+$/;
            if (!usernameRegex.test(finalValue)) {
                Alert.alert(
                    'Invalid Username',
                    'Username must only contain lowercase letters and numbers, with no spaces.'
                );
                return;
            }
        }
        
        // Save the clean, final value.
        onSave(finalValue);
        onClose();
    };
    
    const handlePickerSelect = (value: string) => { if (onPickerSelect) { onPickerSelect(value); } onClose(); };

    const handleChangeText = (text: string) => {
        // Continue to format as the user types for immediate feedback.
        const formattedText = formatText ? formatText(text) : text;
        setInputValue(formattedText);
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <Pressable style={styles.centeredView} onPress={onClose}>
                <View style={[styles.modalView, { backgroundColor: colors.card, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{`Edit ${label}`}</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.text + '99' }]}>{isPicker ? `Choose your ${label.toLowerCase()}.` : `Enter your new ${label.toLowerCase()}.`}</Text>
                    {isPicker ? (
                        <View style={styles.pickerOptionsContainer}>
                            {pickerOptions.map((option) => (
                                <TouchableOpacity key={option.value} style={[styles.pickerOption, { borderColor: colors.border }]} onPress={() => handlePickerSelect(option.value)}>
                                    <Text style={[styles.pickerOptionText, { color: colors.text }]}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <TextInput
                            ref={inputRef}
                            style={[styles.input, { borderColor: isFocused ? colors.primary : colors.border, color: colors.text, backgroundColor: colors.background }, isFocused && styles.inputFocused]}
                            value={inputValue}
                            onChangeText={handleChangeText}
                            placeholder={`Enter ${label}...`}
                            placeholderTextColor={colors.text + '80'}
                            keyboardType={keyboardType}
                            multiline={multiline}
                            numberOfLines={numberOfLines}
                            returnKeyType={multiline ? 'default' : 'done'}
                            onSubmitEditing={multiline ? undefined : handleSave}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            autoCapitalize="none"
                        />
                    )}
                    {!isPicker && (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton, { borderColor: colors.primary, borderWidth: 1 }]} onPress={onClose}><Text style={[styles.buttonText, { color: colors.primary }]}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}><Text style={[styles.buttonText, { color: colors.card }]}>Save</Text></TouchableOpacity>
                        </View>
                    )}
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { margin: 20, borderRadius: 20, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '85%', maxWidth: 400, borderWidth: 1, },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    modalSubtitle: { fontSize: 15, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    input: { width: '100%', height: 50, borderRadius: 10, borderWidth: 1, paddingHorizontal: 15, fontSize: 16, marginBottom: 20, textAlignVertical: 'center' },
    inputFocused: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 5 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10, gap: 10 },
    button: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontSize: 16, fontWeight: '600' },
    cancelButton: {},
    saveButton: {},
    pickerOptionsContainer: { width: '100%', marginBottom: 20 },
    pickerOption: { paddingVertical: 15, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, marginBottom: 10, alignItems: 'center' },
    pickerOptionText: { fontSize: 16 },
});
