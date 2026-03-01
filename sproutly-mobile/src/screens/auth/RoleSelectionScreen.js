import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';

import { AuthContext } from '../../stateManagement/AuthContext'
import { COLORS } from '../../constants/Colors'

const ROLES = [
    {
        id: 'farmer',
        title: 'Farmer',
        icon: '👨‍🌾',
        description: 'Sell your produce and connect with buyers',
        color: '#4CAF50',
    },
    {
        id: 'buyer',
        title: 'Buyer',
        icon: '🛒',
        description: 'Purchase fresh produce directly from farmers',
        color: '#2196F3',
    },
    {
        id: 'service_provider',
        title: 'Service Provider',
        icon: '🔧',
        description: 'Offer agricultural services and expertise',
        color: '#FF9800',
    },
];

export default function RoleSelectionScreen({ route, navigation }) {
    const phoneNumber = route?.params?.phoneNumber || null;
    const [selectedRoles, StSelectedRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    const toggleRole = (roleId) => {
        if (selectedRoles.includes(roleId)) {
            setSelectedRoles(selectedRoles.filter(id => id !== roleId));
        } else {
            setSelectedRoles([...selectedRoles, roleId]);
        }
    };

    const handleRoleSelection = async () => {
        if (selectedRoles === 0) {
            Alert.alert('Select Role', 'Please select your role to continue');
            return;
        }

        setLoading(true);
        try {
            console.log('Saving role:', selectedRoles, 'for user:', user.uid);

            // This is where your Flask API call goes:
            // await axios.post(`${API_URL}/user/roles`, { roles: selectedRoles });

            login("user-auth-token", selectedRoles);
            navigation.replace('Home');
        } catch (error) {
            Alert.alert('Error', 'Failed to save roles. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[COLORS.forestDeep, COLORS.forestMid, COLORS.forestLight]}
            style={styles.container}
        >
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Sproutly Identity</Text>
                    <Text style={styles.subtitle}>You can choose one or more roles</Text>
                </View>

                <View style={styles.rolesContainer}>
                    {ROLES.map((role) => {
                        const isSelected = selectedRoles.includes(role.id);
                        return (
                            <TouchableOpacity
                                key={role.id}
                                style={[
                                    styles.roleCard,
                                    isSelected && { borderColor: role.color, borderWidth: 3 }
                                ]}
                                onPress={() => toggleRole(role.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.roleIcon}>{role.icon}</Text>
                                <View style={styles.textWrapper}>
                                    <Text style={[styles.roleTitle, isSelected && { color: role.color }]}>
                                        {role.title}
                                    </Text>
                                    <Text style={styles.roleDescription}>{role.description}</Text>
                                </View>

                                {isSelected && (
                                    <View style={[styles.checkmark, { backgroundColor: role.color }]}>
                                        <Text style={styles.checkmarkText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity
                    style={[styles.continueButton, (selectedRoles.length === 0 || loading) && styles.disabledButton]}
                    onPress={handleRoleSelection}
                    disabled={selectedRoles.length === 0 || loading}
                >
                    {loading ? <ActivityIndicator color={COLORS.forestDeep} /> : <Text style={styles.buttonText}>Get Started</Text>}
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 35,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    rolesContainer: {
        marginBottom: 20,
    },
    roleCard: {
        backgroundColor: '#F9F9F9',
        borderRadius: 14,
        padding: 18,
        marginBottom: 14,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        position: 'relative',
    },
    roleCardSelected: {
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    roleIcon: {
        fontSize: 42,
        marginBottom: 10,
        textAlign: 'center',
    },
    roleTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
        textAlign: 'center',
    },
    roleDescription: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        lineHeight: 18,
    },
    checkmark: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    continueButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 5,
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
