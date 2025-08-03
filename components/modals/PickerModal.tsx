// sdaw/components/modals/PickerModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- NEW: A flexible type for picker options ---
export interface PickerOption {
  label: string;
  value: string;
}

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: PickerOption[];
  onSelect: (value: string) => void;
  selectedValue?: string;
}

export const PickerModal: React.FC<PickerModalProps> = ({
  visible,
  onClose,
  title,
  options,
  onSelect,
  selectedValue,
}) => {
  const { colors } = useTheme();

  const handleSelectOption = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          {options.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectOption(option.value)}>
                <Text style={[styles.optionText, { color: isSelected ? colors.primary : colors.text }, isSelected && styles.selectedOptionText]}>
                  {option.label}
                </Text>
                {isSelected && <FontAwesome name="check-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelButtonText, { color: colors.text + '99' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 25,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 17,
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});
