import React, { useCallback, useContext, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { fetchHistory } from '../../api/DiagnosisService';
import { toFriendlyError } from '../../utils/errorMessages';
import ErrorBanner from '../../components/ErrorBanner';
import { COLORS, CROP_LABELS } from '../../constants/theme';

const MAX_SHOWN = 20;

// The API sends UTC times without a zone marker; read them as UTC, not phone time.
function parseUtc(value) {
    return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

function timeAgo(value) {
    const minutes = Math.round((Date.now() - parseUtc(value).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return parseUtc(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function outcome(item) {
    if (item.is_referred) return { text: 'Referred to support', color: COLORS.referral };
    if (item.predicted_disease?.startsWith('Healthy')) return { text: 'Healthy', color: COLORS.healthy };
    // "Tomato Late Blight" -> "Late Blight": the crop is already shown above it.
    const disease = (item.predicted_disease || '').replace(/^(Maize|Tomato|Potato)\s+/, '');
    return { text: disease, color: COLORS.disease };
}

export default function FarmerDashboard({ navigation }) {
    const { userToken } = useContext(AuthContext);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            setHistory(await fetchHistory({ token: userToken }));
        } catch (e) {
            setError(toFriendlyError(e));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userToken]);

    // Reload whenever the home screen comes back into view, e.g. after a new check.
    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const refresh = () => {
        setRefreshing(true);
        load();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar style="dark" />
            <ScrollView
                contentContainerClassName="px-5 pb-10"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between pt-4">
                    <Text className="text-2xl font-bold" style={{ color: COLORS.brand }}>
                        Sproutly
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile')}
                        hitSlop={12}
                        accessibilityRole="button"
                        accessibilityLabel="Profile"
                    >
                        <Ionicons name="person-circle-outline" size={32} color={COLORS.brand} />
                    </TouchableOpacity>
                </View>
                <Text className="text-base mt-1" style={{ color: COLORS.muted }}>
                    What is affecting your crop today?
                </Text>

                {/* The one main action */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('Diagnosis')}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    className="mt-6 rounded-2xl px-5 py-6 flex-row items-center"
                    style={{ backgroundColor: COLORS.brand }}
                >
                    <MaterialCommunityIcons name="camera-outline" size={30} color="#FFFFFF" />
                    <View className="flex-1 ml-4">
                        <Text className="text-white text-xl font-bold">Check a leaf</Text>
                        <Text className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            Maize, tomato or potato
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>

                {/* Real history from the backend */}
                <Text className="text-lg font-bold mt-10 mb-1" style={{ color: COLORS.ink }}>
                    Your checks
                </Text>

                {loading ? (
                    <View className="py-10 items-center">
                        <ActivityIndicator color={COLORS.brand} />
                    </View>
                ) : error ? (
                    <View className="mt-3">
                        <ErrorBanner error={error} onRetry={load} />
                    </View>
                ) : history.length === 0 ? (
                    <Text className="text-base py-6 leading-6" style={{ color: COLORS.muted }}>
                        No checks yet. Your results will appear here.
                    </Text>
                ) : (
                    history.slice(0, MAX_SHOWN).map((item, index) => {
                        const result = outcome(item);
                        return (
                            <View
                                key={item.diagnosis_id}
                                className="flex-row items-center py-4"
                                style={{ borderTopWidth: index ? 1 : 0, borderTopColor: COLORS.divider }}
                            >
                                <View className="w-2.5 h-2.5 rounded-full mr-4" style={{ backgroundColor: result.color }} />
                                <View className="flex-1">
                                    <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>
                                        {CROP_LABELS[item.crop] || item.crop}
                                    </Text>
                                    <Text className="text-sm mt-0.5" style={{ color: result.color }}>
                                        {result.text}
                                    </Text>
                                </View>
                                <Text className="text-xs" style={{ color: COLORS.faint }}>
                                    {timeAgo(item.created_at)}
                                </Text>
                            </View>
                        );
                    })
                )}

                {/* Secondary action */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('SupportContacts')}
                    accessibilityRole="button"
                    className="flex-row items-center py-4 mt-8"
                    style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.divider }}
                >
                    <Ionicons name="call-outline" size={20} color={COLORS.brand} />
                    <Text className="flex-1 ml-3 text-base font-semibold" style={{ color: COLORS.ink }}>
                        Support contacts
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.faint} />
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
