// /components/modals/OperationHoursModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { OperationHours } from '../profile/AboutSection';

interface OperationHoursModalProps {
  visible: boolean;
  onClose: () => void;
  currentHours: OperationHours[];
  onSave: (hours: OperationHours[]) => void;
}

const defaultOperationHours: OperationHours[] = [
  { day: 'Monday', open: '09:00', close: '17:00', closed: false },
  { day: 'Tuesday', open: '09:00', close: '17:00', closed: false },
  { day: 'Wednesday', open: '09:00', close: '17:00', closed: false },
  { day: 'Thursday', open: '09:00', close: '17:00', closed: false },
  { day: 'Friday', open: '09:00', close: '17:00', closed: false },
  { day: 'Saturday', open: '10:00', close: '14:00', closed: false },
  { day: 'Sunday', open: 'Closed', close: 'Closed', closed: true },
];

export const OperationHoursModal: React.FC<OperationHoursModalProps> = ({ visible, onClose, currentHours, onSave }) => {
  const { colors } = useTheme();
  const [tempHours, setTempHours] = useState<OperationHours[]>([]);

  useEffect(() => {
    const validCurrentHours = currentHours ? currentHours.filter(Boolean) : [];
    setTempHours(validCurrentHours.length > 0 ? validCurrentHours : defaultOperationHours);
  }, [currentHours, visible]);

  const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => setTempHours(p => p.map(i => i.day === day ? { ...i, [type]: value } : i));
  const handleClosedToggle = (day: string, closed: boolean) => setTempHours(p => p.map(i => i.day === day ? { ...i, closed, open: closed ? 'Closed' : '09:00', close: closed ? 'Closed' : '17:00' } : i));
  const handleSave = () => { onSave(tempHours); onClose(); };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={onClose} style={styles.headerButton}><FontAwesome name="close" size={24} color={colors.text} /></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Set Operation Hours</Text>
            <View style={styles.headerButton} />
          </View>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            {tempHours.map((item) => (
              <View key={item.day} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.dayHeader}>
                      <Text style={[styles.dayText, { color: colors.text }]}>{item.day}</Text>
                      <TouchableOpacity style={[styles.toggleButton, { backgroundColor: item.closed ? colors.border : colors.primary }]} onPress={() => handleClosedToggle(item.day, !item.closed)} activeOpacity={0.8}>
                          <Text style={[styles.toggleButtonText, { color: item.closed ? colors.text : colors.card }]}>{item.closed ? 'Closed' : 'Open'}</Text>
                      </TouchableOpacity>
                  </View>
                  {!item.closed && (
                      <View style={styles.timeRow}>
                          <FontAwesome name="clock-o" size={20} color={colors.text + '80'} />
                          <TextInput style={[styles.timeInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} value={item.open} onChangeText={value => handleTimeChange(item.day, 'open', value)} keyboardType="numbers-and-punctuation"/>
                          <Text style={[styles.timeSeparator, { color: colors.text+'99' }]}>to</Text>
                          <TextInput style={[styles.timeInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} value={item.close} onChangeText={value => handleTimeChange(item.day, 'close', value)} keyboardType="numbers-and-punctuation"/>
                      </View>
                  )}
              </View>
            ))}
          </ScrollView>
          <View style={[styles.footer, {borderTopColor: colors.border, backgroundColor: colors.card}]}>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}><Text style={[styles.saveButtonText, { color: colors.card }]}>Save Changes</Text></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 50 : 15, paddingBottom: 15, paddingHorizontal: 10, borderBottomWidth: 1, },
    headerButton: { width: 40, alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    scrollViewContent: { paddingVertical: 10, paddingHorizontal: 15, paddingBottom: 30 },
    dayCard: { borderRadius: 12, borderWidth: 1, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    dayText: { fontSize: 17, fontWeight: 'bold' },
    toggleButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    toggleButtonText: { fontSize: 14, fontWeight: '600' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timeInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 15, textAlign: 'center' },
    timeSeparator: { fontSize: 14, fontWeight: '500' },
    footer: { padding: 15, paddingBottom: Platform.OS === 'ios' ? 34 : 15, borderTopWidth: StyleSheet.hairlineWidth },
    saveButton: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    saveButtonText: { fontSize: 17, fontWeight: '600' },
});