// /components/profile/AboutSection.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export interface OperationHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export type UserProfile = {
    id: string;
    fullName: string;
    username: string;
    profilePhotoUrl: string;
    bio?: string;
    city?: string;
    gender?: string;
    date_of_birth?: string;
    business_address?: string;
    phone_number?: string;
    operation_hours?: OperationHours[];
};

// --- THIS IS THE FIX ---
// Updated the interface to accept the new props
interface AboutProps {
    user: UserProfile;
    followerCount: number;
    followingCount: number;
}

export const AboutSection: React.FC<AboutProps> = ({ user, followerCount, followingCount }) => {
    const { colors } = useTheme();
    const formatTime = (time: string | undefined | null) => {
        if (!time || time === 'Closed') return 'Closed';
        const [hours, minutes] = time.split(':');
        if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return 'Closed';
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const InfoRow = ({ iconName, label, value }: { iconName: React.ComponentProps<typeof FontAwesome>['name']; label: string; value?: string | null }) => {
        if (!value) return null;
        return (
            <View style={aboutStyles.infoRow}>
                <FontAwesome name={iconName} size={20} color={colors.text + '99'} style={aboutStyles.infoIcon} />
                <View style={aboutStyles.infoTextContainer}>
                    <Text style={[aboutStyles.infoLabel, { color: colors.text + '99' }]}>{label}</Text>
                    <Text style={[aboutStyles.infoValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
                </View>
            </View>
        );
    };

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={[aboutStyles.sectionHeader, { color: colors.text }]}>{title}</Text>
    );

    return (
        <ScrollView contentContainerStyle={[aboutStyles.container, { backgroundColor: colors.background }]}>
            <View style={[aboutStyles.infoCard, { backgroundColor: colors.card }]}>
                <View style={aboutStyles.statsContainer}>
                    <View style={aboutStyles.statItem}>
                        <Text style={[aboutStyles.statCount, { color: colors.text }]}>{followerCount}</Text>
                        <Text style={[aboutStyles.statLabel, { color: colors.text + '99' }]}>Followers</Text>
                    </View>
                    <View style={aboutStyles.statItem}>
                        <Text style={[aboutStyles.statCount, { color: colors.text }]}>{followingCount}</Text>
                        <Text style={[aboutStyles.statLabel, { color: colors.text + '99' }]}>Following</Text>
                    </View>
                </View>
            </View>
            <View style={[aboutStyles.infoCard, { backgroundColor: colors.card }]}>
                <SectionHeader title="About" />
                <Text style={[aboutStyles.bioText, { color: colors.text }]}>{user.bio || 'This user has not provided a bio yet.'}</Text>
            </View>
            <View style={[aboutStyles.infoCard, { backgroundColor: colors.card }]}>
                <SectionHeader title="Details" />
                <InfoRow iconName="map-marker" label="Location" value={user.city} />
                <InfoRow iconName="birthday-cake" label="Birthday" value={user.date_of_birth} />
                <InfoRow iconName="intersex" label="Gender" value={user.gender} />
            </View>
            <View style={[aboutStyles.infoCard, { backgroundColor: colors.card }]}>
                <SectionHeader title="Business Info" />
                <InfoRow iconName="building-o" label="Business Address" value={user.business_address} />
            </View>
            <View style={[aboutStyles.infoCard, { backgroundColor: colors.card }]}>
                <SectionHeader title="Operation Hours" />
                {user.operation_hours && user.operation_hours.length > 0 ? (
                    user.operation_hours.map((hour, index) => (
                        <View key={index} style={[aboutStyles.hourRow, { borderTopColor: index > 0 ? colors.border : 'transparent' }]}>
                            <Text style={[aboutStyles.hourDay, { color: colors.text }]}>{hour.day}</Text>
                            <View style={aboutStyles.hourStatusContainer}>
                                {hour.closed ? ( <>
                                        <FontAwesome name="times-circle" size={16} color="#FF4136" />
                                        <Text style={[aboutStyles.hourStatusText, { color: "#FF4136" }]}>Closed</Text>
                                    </> ) : ( <>
                                        <FontAwesome name="check-circle" size={16} color="#2ECC40" />
                                        <Text style={[aboutStyles.hourStatusText, { color: "#2ECC40" }]}>{formatTime(hour.open)} - {formatTime(hour.close)}</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={[aboutStyles.noInfoText, { color: colors.text + '80' }]}>No operation hours specified.</Text>
                )}
            </View>
        </ScrollView>
    );
};

const aboutStyles = StyleSheet.create({
    container: { paddingVertical: 16, gap: 16 },
    infoCard: { marginHorizontal: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    bioText: { fontSize: 16, lineHeight: 24, fontStyle: 'italic', opacity: 0.9 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16 },
    infoIcon: { marginRight: 20, marginTop: 2 },
    infoTextContainer: { flex: 1, gap: 4 },
    infoLabel: { fontSize: 14, fontWeight: '500' },
    infoValue: { fontSize: 16, fontWeight: '600' },
    hourRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
    hourDay: { fontSize: 16, fontWeight: '500' },
    hourStatusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    hourStatusText: { fontSize: 15, fontWeight: '600' },
    noInfoText: { fontSize: 16, textAlign: 'center', paddingVertical: 20, fontStyle: 'italic' },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statCount: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 14,
        marginTop: 4,
    },
});