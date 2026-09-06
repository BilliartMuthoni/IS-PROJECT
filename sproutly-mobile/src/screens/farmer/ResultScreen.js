import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const COLORS = {
    brand: '#1B4332',
    brandLight: '#2D5A43',
    attention: '#B4622A',
    expert: '#3A6EA5',
};

const CROP_LABELS = { maize: 'Maize', tomato: 'Tomato', potato: 'Potato' };

function Section({ title, icon, items, color }) {
    if (!items?.length) return null;
    return (
        <View className="bg-white rounded-2xl border border-gray-200 p-5 mt-4">
            <View className="flex-row items-center mb-3">
                <MaterialCommunityIcons name={icon} size={18} color={color} />
                <Text className="text-sm font-bold text-gray-800 ml-2">{title}</Text>
            </View>
            {items.map((step, index) => (
                <View key={index} className="flex-row mb-2">
                    <Text className="text-sm text-gray-400 mr-2">{index + 1}.</Text>
                    <Text className="text-sm text-gray-700 flex-1 leading-5">{step}</Text>
                </View>
            ))}
        </View>
    );
}

export default function ResultScreen({ route, navigation }) {
    const { result, imageUri } = route.params;
    const isReferred = result.is_referred;
    const cropLabel = CROP_LABELS[result.crop] || result.crop;

    const handleContactExpert = () => {
        // TODO: replace with the real referral contact flow.
        Alert.alert('Coming soon', 'Contact details for extension officers go here.');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7F4' }}>
            <StatusBar style="dark" />
            <ScrollView contentContainerClassName="pb-10">
                {/* Header */}
                <View className="flex-row items-center px-5 pt-4 pb-2">
                    <TouchableOpacity
                        onPress={() => navigation.popToTop()}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center mr-3"
                    >
                        <Ionicons name="close" size={20} color={COLORS.brand} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-forestDeep">Result</Text>
                </View>

                {/* The photo that was checked */}
                {imageUri && (
                    <View className="mx-5 mt-2 rounded-2xl overflow-hidden border border-gray-200">
                        <Image source={{ uri: imageUri }} className="w-full h-44" resizeMode="cover" />
                    </View>
                )}

                {isReferred ? (
                    <>
                        {/* Referral outcome */}
                        <View
                            className="mx-5 mt-4 bg-white rounded-2xl border border-gray-200 p-5"
                            style={{ borderLeftWidth: 3, borderLeftColor: COLORS.expert }}
                        >
                            <View className="flex-row items-center mb-3">
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                    style={{ backgroundColor: `${COLORS.expert}1A` }}
                                >
                                    <MaterialCommunityIcons name="account-tie" size={20} color={COLORS.expert} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-gray-800">
                                        Sent to an extension officer
                                    </Text>
                                    <Text className="text-xs text-gray-500 mt-0.5">{cropLabel}</Text>
                                </View>
                            </View>
                            <Text className="text-sm text-gray-700 leading-5">{result.referral_message}</Text>
                        </View>

                        <View className="mx-5 mt-4 bg-white rounded-2xl border border-gray-200 p-5">
                            <Text className="text-sm font-bold text-gray-800 mb-2">While you wait</Text>
                            <Text className="text-sm text-gray-600 leading-5">
                                Avoid spraying anything until you have an answer. Treating the wrong problem costs
                                money and can make the crop worse.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleContactExpert}
                            activeOpacity={0.85}
                            className="mx-5 mt-4 rounded-2xl py-4 items-center flex-row justify-center"
                            style={{ backgroundColor: COLORS.expert }}
                        >
                            <MaterialCommunityIcons name="phone-outline" size={18} color="#FFFFFF" />
                            <Text className="text-white text-base font-bold ml-2">Contact an officer now</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* Confident diagnosis */}
                        <View
                            className="mx-5 mt-4 bg-white rounded-2xl border border-gray-200 p-5"
                            style={{ borderLeftWidth: 3, borderLeftColor: COLORS.attention }}
                        >
                            <Text className="text-xs font-semibold text-gray-500 mb-1">
                                {cropLabel.toUpperCase()}
                            </Text>
                            <Text className="text-xl font-bold text-gray-800">{result.predicted_disease}</Text>
                            {result.guidance?.summary && (
                                <Text className="text-sm text-gray-600 mt-2 leading-5">
                                    {result.guidance.summary}
                                </Text>
                            )}
                        </View>

                        <View className="mx-5">
                            <Section
                                title="What to do now"
                                icon="spray-bottle"
                                items={result.guidance?.treatment}
                                color={COLORS.attention}
                            />
                            <Section
                                title="Stopping it coming back"
                                icon="shield-check-outline"
                                items={result.guidance?.prevention}
                                color={COLORS.brandLight}
                            />
                        </View>

                        <View className="mx-5 mt-4 flex-row px-1">
                            <Ionicons name="information-circle-outline" size={14} color="#8A9690" />
                            <Text className="text-xs text-gray-500 ml-1 flex-1 leading-4">
                                Not matching what you see? Contact an extension officer rather than treating the
                                wrong problem.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleContactExpert}
                            activeOpacity={0.85}
                            className="mx-5 mt-3 bg-white rounded-2xl border border-gray-200 py-4 items-center flex-row justify-center"
                        >
                            <MaterialCommunityIcons name="phone-outline" size={18} color={COLORS.brand} />
                            <Text className="text-forestDeep text-sm font-semibold ml-2">
                                Talk to an extension officer
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                <TouchableOpacity
                    onPress={() => navigation.popToTop()}
                    activeOpacity={0.85}
                    className="mx-5 mt-3 py-4 items-center"
                >
                    <Text className="text-sm font-semibold text-gray-500">Back to home</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
