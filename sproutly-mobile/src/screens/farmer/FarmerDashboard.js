import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

// TODO: all placeholder until the /diagnose endpoint and diagnoses table exist.
const PLACEHOLDER_STATS = {
    total: 7,
    referred: 2,
    recurring: { name: 'Tomato Late Blight', count: 3 },
    byCrop: [
        { crop: 'Tomato', count: 5 },
        { crop: 'Maize', count: 2 },
        { crop: 'Potato', count: 0 },
    ],
};

const PLACEHOLDER_NEXT_ACTION = {
    crop: 'Tomato',
    disease: 'Late Blight',
    task: 'Second fungicide spray',
    due: 'Due today',
    overdue: false,
};

const PLACEHOLDER_RECENT = [
    { id: 1, crop: 'Tomato', result: 'Late Blight', when: '2 days ago', status: 'diagnosed' },
    { id: 2, crop: 'Maize', result: 'With an expert', when: '4 days ago', status: 'referred' },
    { id: 3, crop: 'Tomato', result: 'Healthy', when: '1 week ago', status: 'healthy' },
];

const PLACEHOLDER_PENDING_REFERRALS = 1;

const COLORS = {
    brand: '#1B4332',
    brandLight: '#2D5A43',
    attention: '#B4622A',
    expert: '#3A6EA5',
    healthy: '#2F7D4F',
};

const STATUS_STYLES = {
    diagnosed: { icon: 'alert-circle-outline', color: COLORS.attention, label: 'Treating' },
    referred: { icon: 'account-tie', color: COLORS.expert, label: 'With expert' },
    healthy: { icon: 'leaf', color: COLORS.healthy, label: 'Healthy' },
};

export default function FarmerDashboard({ navigation }) {
    const { logout } = useContext(AuthContext);
    const hasHistory = PLACEHOLDER_RECENT.length > 0;
    const maxCropCount = Math.max(...PLACEHOLDER_STATS.byCrop.map((c) => c.count), 1);

    const handleDiagnose = () => navigation.navigate('Diagnosis');

    const handleTalkToExpert = () => {
        // TODO: replace with the real referral contact flow.
        Alert.alert('Coming soon', 'Contact details for extension officers go here.');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7F4' }}>
            <StatusBar style="dark" />
            <ScrollView contentContainerClassName="pb-10">
                {/* Header */}
                <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
                    <View>
                        <Text className="text-2xl font-bold text-forestDeep">Sproutly</Text>
                        <Text className="text-sm text-gray-500">Your crop health at a glance</Text>
                    </View>
                    <TouchableOpacity
                        onPress={logout}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center"
                    >
                        <Ionicons name="log-out-outline" size={20} color={COLORS.brand} />
                    </TouchableOpacity>
                </View>

                {/* Primary action */}
                <View className="px-5">
                    <TouchableOpacity
                        onPress={handleDiagnose}
                        activeOpacity={0.85}
                        className="bg-forestDeep rounded-2xl p-5 flex-row items-center"
                    >
                        <View className="w-14 h-14 rounded-2xl bg-white/15 items-center justify-center mr-4">
                            <MaterialCommunityIcons name="camera-plus" size={28} color="#FFFFFF" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white text-xl font-bold">Diagnose a crop</Text>
                            <Text className="text-white/70 text-sm mt-0.5">
                                Fill the frame with one affected leaf
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>

                    {!hasHistory && (
                        <Text className="text-xs text-gray-500 mt-2 ml-1">
                            Works with maize, tomato and potato
                        </Text>
                    )}
                </View>

                {/* Next action -- only when a treatment is in progress */}
                {PLACEHOLDER_NEXT_ACTION && (
                    <View className="mx-5 mt-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <View
                            className="px-5 py-4 flex-row items-center"
                            style={{ borderLeftWidth: 3, borderLeftColor: COLORS.attention }}
                        >
                            <View className="flex-1">
                                <Text className="text-xs font-semibold text-gray-500 mb-1">NEXT ACTION</Text>
                                <Text className="text-base font-bold text-gray-800">
                                    {PLACEHOLDER_NEXT_ACTION.task}
                                </Text>
                                <Text className="text-sm text-gray-500 mt-0.5">
                                    {PLACEHOLDER_NEXT_ACTION.crop} · {PLACEHOLDER_NEXT_ACTION.disease}
                                </Text>
                            </View>
                            <View
                                className="px-3 py-1.5 rounded-full"
                                style={{ backgroundColor: `${COLORS.attention}1A` }}
                            >
                                <Text className="text-xs font-bold" style={{ color: COLORS.attention }}>
                                    {PLACEHOLDER_NEXT_ACTION.due}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Pending referral -- only when one is open */}
                {PLACEHOLDER_PENDING_REFERRALS > 0 && (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleTalkToExpert}
                        className="mx-5 mt-3 bg-white rounded-2xl border border-gray-200 px-5 py-4 flex-row items-center"
                        style={{ borderLeftWidth: 3, borderLeftColor: COLORS.expert }}
                    >
                        <MaterialCommunityIcons name="account-tie" size={22} color={COLORS.expert} />
                        <Text className="flex-1 ml-3 text-sm text-gray-700">
                            {PLACEHOLDER_PENDING_REFERRALS} case waiting on an extension officer
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}

                {/* Sample-data notice */}
                <View className="mx-5 mt-6 mb-2 flex-row items-center">
                    <Ionicons name="information-circle-outline" size={14} color="#8A9690" />
                    <Text className="text-xs text-gray-500 ml-1">
                        Example data — real results appear after your first check
                    </Text>
                </View>

                {/* Season summary */}
                <View className="mx-5 bg-white rounded-2xl border border-gray-200 p-5">
                    <Text className="text-base font-bold text-forestDeep mb-4">This season</Text>

                    <View className="flex-row mb-5">
                        <View className="flex-1">
                            <Text className="text-3xl font-bold text-forestDeep">{PLACEHOLDER_STATS.total}</Text>
                            <Text className="text-xs text-gray-500 mt-0.5">Crops checked</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-3xl font-bold" style={{ color: COLORS.expert }}>
                                {PLACEHOLDER_STATS.referred}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-0.5">Sent to an expert</Text>
                        </View>
                    </View>

                    {PLACEHOLDER_STATS.byCrop.map((item) => (
                        <View key={item.crop} className="mb-3">
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-sm text-gray-700">{item.crop}</Text>
                                <Text className="text-sm font-semibold text-forestDeep">{item.count}</Text>
                            </View>
                            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <View
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${(item.count / maxCropCount) * 100}%`,
                                        backgroundColor: COLORS.brandLight,
                                    }}
                                />
                            </View>
                        </View>
                    ))}

                    {PLACEHOLDER_STATS.recurring.count > 2 && (
                        <View className="mt-3 pt-4 border-t border-gray-100 flex-row">
                            <MaterialCommunityIcons name="repeat-variant" size={18} color={COLORS.attention} />
                            <View className="flex-1 ml-2">
                                <Text className="text-sm font-semibold text-gray-800">
                                    {PLACEHOLDER_STATS.recurring.name} keeps returning
                                </Text>
                                <Text className="text-xs text-gray-500 mt-0.5">
                                    {PLACEHOLDER_STATS.recurring.count} times this season — often a sign of drainage,
                                    spacing or infected seed rather than bad luck
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Recent activity */}
                <View className="mx-5 mt-4 bg-white rounded-2xl border border-gray-200 p-5">
                    <Text className="text-base font-bold text-forestDeep mb-3">Recent checks</Text>

                    {PLACEHOLDER_RECENT.map((item, index) => {
                        const style = STATUS_STYLES[item.status];
                        const isLast = index === PLACEHOLDER_RECENT.length - 1;
                        return (
                            <View
                                key={item.id}
                                className={`flex-row items-center py-3 ${isLast ? '' : 'border-b border-gray-100'}`}
                            >
                                <View
                                    className="w-9 h-9 rounded-full items-center justify-center mr-3"
                                    style={{ backgroundColor: `${style.color}1A` }}
                                >
                                    <MaterialCommunityIcons name={style.icon} size={18} color={style.color} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-800">
                                        {item.crop} · {item.result}
                                    </Text>
                                    <Text className="text-xs text-gray-500 mt-0.5">{item.when}</Text>
                                </View>
                                <Text className="text-xs font-medium" style={{ color: style.color }}>
                                    {style.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Secondary action */}
                <TouchableOpacity
                    onPress={handleTalkToExpert}
                    activeOpacity={0.8}
                    className="mx-5 mt-4 bg-white rounded-2xl border border-gray-200 px-5 py-4 flex-row items-center"
                >
                    <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.brand} />
                    <View className="flex-1 ml-3">
                        <Text className="text-sm font-semibold text-gray-800">Talk to an extension officer</Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                            County offices, agrovets and the national hotline
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
