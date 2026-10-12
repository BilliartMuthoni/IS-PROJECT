import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import { submitDiagnosis } from '../../api/DiagnosisService';
import { toFriendlyError } from '../../utils/errorMessages';
import ErrorBanner from '../../components/ErrorBanner';
import ScreenHeader from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';

const CROPS = [
    { id: 'maize', label: 'Maize' },
    { id: 'tomato', label: 'Tomato' },
    { id: 'potato', label: 'Potato' },
];

function Label({ title, hint, optional }) {
    return (
        <>
            <Text className="text-base font-bold" style={{ color: COLORS.ink }}>
                {title}
                {optional && (
                    <Text className="font-normal" style={{ color: COLORS.faint }}>
                        {' '}
                        (optional)
                    </Text>
                )}
            </Text>
            {hint && (
                <Text className="text-sm mt-0.5 mb-3 leading-5" style={{ color: COLORS.muted }}>
                    {hint}
                </Text>
            )}
        </>
    );
}

export default function DiagnosisScreen({ navigation }) {
    const { userToken } = useContext(AuthContext);
    const [crop, setCrop] = useState(null);
    const [image, setImage] = useState(null);
    const [symptoms, setSymptoms] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

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
            // No allowsEditing: the native crop tool has no clear "done" step,
            // so cropping silently doubles as confirmation. The photo comes
            // straight into our own preview, which has explicit Replace/Remove.
            mediaTypes: ['images'],
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
            // No allowsEditing: the native crop tool has no clear "done" step,
            // so cropping silently doubles as confirmation. The photo comes
            // straight into our own preview, which has explicit Replace/Remove.
            mediaTypes: ['images'],
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
        setError(null);
        setSubmitting(true);
        try {
            const result = await submitDiagnosis({
                token: userToken,
                crop,
                imageUri: image.uri,
                symptoms,
            });
            navigation.navigate('Result', { result, imageUri: image.uri });
        } catch (e) {
            setError(toFriendlyError(e));
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = crop && image && !submitting;
    const missing = !crop && !image ? 'Choose a crop and add a photo' : !crop ? 'Choose a crop' : !image ? 'Add a photo' : null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar style="dark" />
            <ScreenHeader title="Check a leaf" onBack={() => navigation.goBack()} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
                    {/* Crop */}
                    <View className="mt-2">
                        <Label title="Which crop is it?" hint="Only that crop's diseases are considered" />
                        <View className="flex-row">
                            {CROPS.map((item) => {
                                const selected = crop === item.id;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => setCrop(item.id)}
                                        activeOpacity={0.8}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected }}
                                        className="mr-2 px-5 py-2.5 rounded-full"
                                        style={{
                                            backgroundColor: selected ? COLORS.brand : COLORS.surface,
                                            borderWidth: 1,
                                            borderColor: selected ? COLORS.brand : COLORS.divider,
                                        }}
                                    >
                                        <Text
                                            className="text-base font-semibold"
                                            style={{ color: selected ? '#FFFFFF' : COLORS.text }}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Photo */}
                    <View className="mt-8">
                        <Label
                            title="Photo of the affected leaf"
                            hint="One leaf filling the frame, in daylight, against a plain background"
                        />
                        {image ? (
                            <>
                                <Image source={{ uri: image.uri }} className="w-full h-64 rounded-xl" resizeMode="cover" />
                                <View className="flex-row mt-1">
                                    <TouchableOpacity onPress={choosePhoto} className="py-3 pr-6 flex-row items-center">
                                        <Ionicons name="camera-outline" size={18} color={COLORS.brand} />
                                        <Text className="text-base font-semibold ml-2" style={{ color: COLORS.brand }}>
                                            Replace
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setImage(null)} className="py-3 flex-row items-center">
                                        <Ionicons name="trash-outline" size={18} color={COLORS.disease} />
                                        <Text className="text-base font-semibold ml-2" style={{ color: COLORS.disease }}>
                                            Remove
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <TouchableOpacity
                                onPress={choosePhoto}
                                activeOpacity={0.8}
                                accessibilityRole="button"
                                className="rounded-xl py-10 items-center"
                                style={{
                                    backgroundColor: COLORS.surface,
                                    borderWidth: 1.5,
                                    borderStyle: 'dashed',
                                    borderColor: '#B9C4BD',
                                }}
                            >
                                <MaterialCommunityIcons name="camera-plus-outline" size={34} color={COLORS.brand} />
                                <Text className="text-base font-semibold mt-2" style={{ color: COLORS.brand }}>
                                    Add a photo
                                </Text>
                                <Text className="text-sm mt-0.5" style={{ color: COLORS.muted }}>
                                    Take one now or choose from your gallery
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Symptoms */}
                    <View className="mt-8">
                        <Label title="What are you seeing?" optional hint="Details a photo can't show, such as when it started" />
                        <TextInput
                            className="rounded-xl px-4 py-3 text-base h-28"
                            style={{
                                backgroundColor: COLORS.surface,
                                borderWidth: 1,
                                borderColor: COLORS.divider,
                                color: COLORS.text,
                            }}
                            placeholder="e.g. Yellow spots started on the lower leaves three days ago, after heavy rain"
                            placeholderTextColor={COLORS.faint}
                            multiline
                            textAlignVertical="top"
                            value={symptoms}
                            onChangeText={setSymptoms}
                        />
                    </View>

                    <Text className="text-sm mt-6 leading-5" style={{ color: COLORS.muted }}>
                        If we can't be confident about the result, we'll point you to support contacts instead of
                        guessing.
                    </Text>
                </ScrollView>

                {/* Pinned at the bottom so the next step is always in reach */}
                <View
                    className="px-5 pt-3 pb-4"
                    style={{ backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.divider }}
                >
                    {error && (
                        <View className="mb-3">
                            <ErrorBanner error={error} onRetry={handleSubmit} onDismiss={() => setError(null)} />
                        </View>
                    )}
                    <PrimaryButton
                        label="Check this leaf"
                        loadingLabel="Sending photo…"
                        onPress={handleSubmit}
                        disabled={!canSubmit && !submitting}
                        loading={submitting}
                    />
                    {missing && (
                        <Text className="text-sm text-center mt-2" style={{ color: COLORS.muted }}>
                            {missing} to continue
                        </Text>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
