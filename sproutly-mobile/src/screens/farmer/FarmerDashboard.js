import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

// TODO: replace with real data once the /diagnose endpoint and diagnoses table exist.
const PLACEHOLDER_STATS = {
    total: 7,
    referred: 2,
    mostCommon: { name: 'Tomato Late Blight', count: 3 },
    byCrop: [
        { crop: 'Tomato', count: 5 },
        { crop: 'Maize', count: 2 },
        { crop: 'Potato', count: 0 },
    ],
};

const PLACEHOLDER_RECENT = [
    { id: 1, crop: 'Tomato', result: 'Late Blight', when: '2 days ago', status: 'diagnosed' },
    { id: 2, crop: 'Maize', result: 'With an expert', when: '4 days ago', status: 'referred' },
    { id: 3, crop: 'Tomato', result: 'Healthy', when: '1 week ago', status: 'healthy' },
];

const PLACEHOLDER_PENDING_REFERRALS = 1;

const STATUS_STYLES = {
    diagnosed: { icon: 'alert-circle', color: '#B4622A', label: 'Diagnosed' },
    referred: { icon: 'account-tie', color: '#3A6EA5', label: 'With expert' },
    healthy: { icon: 'leaf', color: '#2F7D4F', label: 'Healthy' },
};

export default function FarmerDashboard({ navigation }) {
    const { logout } = useContext(AuthContext);
    const maxCropCount = Math.max(...PLACEHOLDER_STATS.byCrop.map((c) => c.count), 1);

    const handleDiagnose = () => {
        // TODO: navigate to DiagnosisScreen once it's built (next step).
        Alert.alert('Coming next', 'The diagnosis screen is the next thing we build.');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F8F5' }}>
            <StatusBar style="dark" />
            <ScrollView contentContainerClassName="pb-10">
                {/* Header */}
                <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
                    <View>
                        <Text className="text-2xl font-bold text-forestDeep">Sproutly</Text>
                        <Text className="text-sm text-gray-500">Your crop health at a glance</Text>
                    </View>
                    <TouchableOpacity
                        onPress={logout}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center"
                    >
                        <Ionicons name="log-out-outline" size={20} color="#1B4332" />
                    </TouchableOpacity>
                </View>

                {/* Primary action */}
                <View className="px-5 mt-3">
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
                                Take a photo of the affected leaf
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>

                    <Text className="text-xs text-gray-500 mt-2 ml-1">
                        Works with maize, tomato and potato
                    </Text>
                </View>

                {/* Pending referral notice */}
                {PLACEHOLDER_PENDING_REFERRALS > 0 && (
                    <View className="mx-5 mt-4 bg-[#EAF1F8] border border-[#CBDDF0] rounded-xl p-4 flex-row items-center">
                        <MaterialCommunityIcons name="account-tie" size={22} color="#3A6EA5" />
                        <Text className="flex-1 ml-3 text-sm text-[#25446A]">
                            {PLACEHOLDER_PENDING_REFERRALS} case waiting on an extension officer
                        </Text>
                    </View>
                )}

                {/* Sample-data notice */}
                <View className="mx-5 mt-6 mb-2 flex-row items-center">
                    <Ionicons name="information-circle-outline" size={14} color="#8A9690" />
                    <Text className="text-xs text-gray-500 ml-1">
                        Example data — real results appear after your first diagnosis
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
                            <Text className="text-3xl font-bold text-[#3A6EA5]">{PLACEHOLDER_STATS.referred}</Text>
                            <Text className="text-xs text-gray-500 mt-0.5">Sent to an expert</Text>
                        </View>
                    </View>

                    <View className="bg-[#FBF1E9] rounded-xl p-3 mb-5">
                        <Text className="text-xs text-gray-500">Keeps coming back</Text>
                        <Text className="text-sm font-bold text-[#8F4E22] mt-0.5">
                            {PLACEHOLDER_STATS.mostCommon.name} · {PLACEHOLDER_STATS.mostCommon.count} times
                        </Text>
                        <Text className="text-xs text-[#8F4E22]/80 mt-1">
                            Repeat cases often point to drainage, spacing or infected seed
                        </Text>
                    </View>

                    <Text className="text-xs font-semibold text-gray-500 mb-3">BY CROP</Text>
                    {PLACEHOLDER_STATS.byCrop.map((item) => (
                        <View key={item.crop} className="mb-3">
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-sm text-gray-700">{item.crop}</Text>
                                <Text className="text-sm font-semibold text-forestDeep">{item.count}</Text>
                            </View>
                            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-forestLight rounded-full"
                                    style={{ width: `${(item.count / maxCropCount) * 100}%` }}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* Recent activity */}
                <View className="mx-5 mt-5 bg-white rounded-2xl border border-gray-200 p-5">
                    <Text className="text-base font-bold text-forestDeep mb-4">Recent checks</Text>

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
            </ScrollView>
        </SafeAreaView>
    );
}
