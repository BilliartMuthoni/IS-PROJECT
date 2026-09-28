import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { fetchCurrentUser } from '../../api/AuthService';
import { toFriendlyError } from '../../utils/errorMessages';
import ErrorBanner from '../../components/ErrorBanner';

const COLORS = { brand: '#1B4332', brandLight: '#2D5A43', attention: '#B4622A' };

const ROLE_LABELS = {
    farmer: 'Farmer',
    officer: 'Extension officer',
    admin: 'Administrator',
};

function Row({ icon, label, value }) {
    return (
        <View className="flex-row items-center py-3 border-b border-gray-100">
            <MaterialCommunityIcons name={icon} size={18} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 ml-3 flex-1">{label}</Text>
            <Text className="text-sm font-semibold text-gray-800">{value}</Text>
        </View>
    );
}

export default function ProfileScreen({ navigation }) {
    const { userToken, logout } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchCurrentUser({ token: userToken });
            setProfile(data);
        } catch (e) {
            setError(toFriendlyError(e));
        } finally {
            setLoading(false);
        }
    }, [userToken]);

    useEffect(() => {
        load();
    }, [load]);

    const confirmLogout = () => {
        Alert.alert('Log out?', 'You will need your password and a new code to get back in.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: logout },
        ]);
    };

    const memberSince = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
          })
        : '—';

    const identifier = profile?.user_phone_number || profile?.user_email || '—';
    const initial = (identifier || '?').replace(/^\+?/, '').charAt(0).toUpperCase();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7F4' }}>
            <StatusBar style="dark" />
            <ScrollView contentContainerClassName="pb-10">
                {/* Header */}
                <View className="flex-row items-center px-5 pt-4 pb-2">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center mr-3"
                    >
                        <Ionicons name="arrow-back" size={20} color={COLORS.brand} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-forestDeep">Profile</Text>
                </View>

                {loading ? (
                    <View className="items-center py-16">
                        <ActivityIndicator color={COLORS.brand} />
                    </View>
                ) : error ? (
                    <View className="px-5 mt-4">
                        <ErrorBanner error={error} onRetry={load} />
                    </View>
                ) : (
                    <>
                        {/* Identity */}
                        <View className="items-center mt-4 mb-2">
                            <View className="w-20 h-20 rounded-full bg-forestDeep items-center justify-center">
                                <Text className="text-white text-3xl font-bold">{initial}</Text>
                            </View>
                            <Text className="text-lg font-bold text-gray-800 mt-3">{identifier}</Text>
                            <View className="flex-row items-center mt-1">
                                <Text className="text-sm text-gray-500">
                                    {ROLE_LABELS[profile.role] || profile.role}
                                </Text>
                                {profile.is_verified && (
                                    <>
                                        <Text className="text-gray-300 mx-2">·</Text>
                                        <MaterialCommunityIcons
                                            name="check-decagram"
                                            size={14}
                                            color={COLORS.brandLight}
                                        />
                                        <Text className="text-sm ml-1" style={{ color: COLORS.brandLight }}>
                                            Verified
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Account details */}
                        <View className="mx-5 mt-4 bg-white rounded-2xl border border-gray-200 px-5 py-2">
                            <Row
                                icon="phone-outline"
                                label="Phone"
                                value={profile.user_phone_number || 'Not set'}
                            />
                            <Row
                                icon="email-outline"
                                label="Email"
                                value={profile.user_email || 'Not set'}
                            />
                            <Row icon="calendar-blank-outline" label="Member since" value={memberSince} />
                        </View>

                        {/* What this app covers -- honest scope */}
                        <View className="mx-5 mt-4 bg-white rounded-2xl border border-gray-200 p-5">
                            <Text className="text-sm font-bold text-gray-800 mb-2">What Sproutly can check</Text>
                            <Text className="text-sm text-gray-600 leading-5">
                                Diseases of maize, tomato and potato. Anything else, including pests and soil
                                problems, needs an extension officer.
                            </Text>
                        </View>

                        {/* Danger zone */}
                        <TouchableOpacity
                            onPress={confirmLogout}
                            activeOpacity={0.8}
                            className="mx-5 mt-4 bg-white rounded-2xl border border-gray-200 px-5 py-4 flex-row items-center"
                        >
                            <Ionicons name="log-out-outline" size={20} color={COLORS.attention} />
                            <Text className="text-sm font-semibold ml-3" style={{ color: COLORS.attention }}>
                                Log out
                            </Text>
                        </TouchableOpacity>

                        <Text className="text-center text-xs text-gray-400 mt-6">Sproutly · version 1.0.0</Text>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
