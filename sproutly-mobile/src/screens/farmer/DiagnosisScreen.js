import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const CROPS = [
    { id: 'maize', label: 'Maize', icon: 'corn' },
    { id: 'tomato', label: 'Tomato', icon: 'fruit-cherries' },
    { id: 'potato', label: 'Potato', icon: 'sprout' },
];

const COLORS = {
    brand: '#1B4332',
    brandLight: '#2D5A43',
    attention: '#B4622A',
};

export default function DiagnosisScreen({ navigation }) {
    const [crop, setCrop] = useState(null);
    const [image, setImage] = useState(null);
    const [symptoms, setSymptoms] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const pickFromCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                'Camera access needed',
                'Sproutly needs your camera to photograph the affected leaf. You can enable it in your phone settings.'
            );
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const pickFromGallery = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                'Photo access needed',
                'Sproutly needs access to your photos to use an existing picture. You can enable it in your phone settings.'
            );
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const choosePhoto = () => {
        Alert.alert('Add a photo', 'How would you like to add the leaf photo?', [
            { text: 'Take photo', onPress: pickFromCamera },
            { text: 'Choose from gallery', onPress: pickFromGallery },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleSubmit = async () => {
        if (!crop) {
            Alert.alert('Choose a crop', 'Tell us which crop this is so we can check the right diseases.');
            return;
        }
        if (!image) {
            Alert.alert('Add a photo', 'A photo of the affected leaf is needed to make a diagnosis.');
            return;
        }

        setSubmitting(true);
        try {
            // TODO: send to the /diagnose endpoint once it exists (next step).
            await new Promise((resolve) => setTimeout(resolve, 800));
            Alert.alert(
                'Coming next',
                'The /diagnose endpoint is the next thing we build. Your photo and notes are ready to send.'
            );
        } catch (error) {
            Alert.alert('Could not send', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = crop && image && !submitting;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7F4' }}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView contentContainerClassName="pb-10" keyboardShouldPersistTaps="handled">
                    {/* Header */}
                    <View className="flex-row items-center px-5 pt-4 pb-2">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center mr-3"
                        >
                            <Ionicons name="arrow-back" size={20} color={COLORS.brand} />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-forestDeep">Diagnose a crop</Text>
                    </View>

                    {/* Step 1: crop */}
                    <View className="px-5 mt-4">
                        <Text className="text-sm font-bold text-gray-800 mb-1">1. Which crop is it?</Text>
                        <Text className="text-xs text-gray-500 mb-3">
                            This narrows the search to diseases that affect that crop
                        </Text>
                        <View className="flex-row">
                            {CROPS.map((item, index) => {
                                const selected = crop === item.id;
                                const isLast = index === CROPS.length - 1;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => setCrop(item.id)}
                                        activeOpacity={0.8}
                                        className={`flex-1 ${isLast ? '' : 'mr-2'} rounded-2xl border py-4 items-center ${
                                            selected ? 'bg-forestDeep border-forestDeep' : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <MaterialCommunityIcons
                                            name={item.icon}
                                            size={24}
                                            color={selected ? '#FFFFFF' : COLORS.brandLight}
                                        />
                                        <Text
                                            className={`text-sm font-semibold mt-1.5 ${
                                                selected ? 'text-white' : 'text-gray-700'
                                            }`}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Step 2: photo */}
                    <View className="px-5 mt-6">
                        <Text className="text-sm font-bold text-gray-800 mb-1">2. Photo of the affected leaf</Text>
                        <Text className="text-xs text-gray-500 mb-3">
                            Fill the frame with one leaf, in good light, against a plain background
                        </Text>

                        {image ? (
                            <View className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                                <Image
                                    source={{ uri: image.uri }}
                                    className="w-full h-64"
                                    resizeMode="cover"
                                />
                                <View className="flex-row border-t border-gray-200">
                                    <TouchableOpacity
                                        onPress={choosePhoto}
                                        className="flex-1 py-3 items-center flex-row justify-center"
                                    >
                                        <Ionicons name="camera-outline" size={18} color={COLORS.brand} />
                                        <Text className="text-sm font-semibold text-forestDeep ml-2">Replace</Text>
                                    </TouchableOpacity>
                                    <View className="w-px bg-gray-200" />
                                    <TouchableOpacity
                                        onPress={() => setImage(null)}
                                        className="flex-1 py-3 items-center flex-row justify-center"
                                    >
                                        <Ionicons name="trash-outline" size={18} color={COLORS.attention} />
                                        <Text className="text-sm font-semibold ml-2" style={{ color: COLORS.attention }}>
                                            Remove
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={choosePhoto}
                                activeOpacity={0.8}
                                className="bg-white rounded-2xl border-2 border-dashed border-gray-300 py-12 items-center"
                            >
                                <MaterialCommunityIcons name="camera-plus" size={36} color={COLORS.brandLight} />
                                <Text className="text-sm font-semibold text-forestDeep mt-2">Add a photo</Text>
                                <Text className="text-xs text-gray-500 mt-0.5">Take one now or pick from gallery</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Step 3: symptoms */}
                    <View className="px-5 mt-6">
                        <Text className="text-sm font-bold text-gray-800 mb-1">
                            3. What are you seeing? <Text className="font-normal text-gray-500">(optional)</Text>
                        </Text>
                        <Text className="text-xs text-gray-500 mb-3">
                            Details a photo can't show help when the picture alone is unclear
                        </Text>
                        <TextInput
                            className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 h-28"
                            placeholder="e.g. Yellow spots started on the lower leaves three days ago and are spreading upwards after heavy rain"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                            value={symptoms}
                            onChangeText={setSymptoms}
                        />
                    </View>

                    {/* Submit */}
                    <View className="px-5 mt-6">
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!canSubmit}
                            activeOpacity={0.85}
                            className={`rounded-2xl py-4 items-center ${
                                canSubmit ? 'bg-forestDeep' : 'bg-gray-300'
                            }`}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text className="text-white text-base font-bold">Check this crop</Text>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row mt-3 px-1">
                            <Ionicons name="information-circle-outline" size={14} color="#8A9690" />
                            <Text className="text-xs text-gray-500 ml-1 flex-1">
                                If we can't be confident about the result, we'll send it to an extension officer
                                instead of guessing
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
