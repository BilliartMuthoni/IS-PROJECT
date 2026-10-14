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
import { submitDiagnosis, submitBatch } from '../../api/DiagnosisService';
import { toFriendlyError } from '../../utils/errorMessages';
import ErrorBanner from '../../components/ErrorBanner';
import ScreenHeader from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';

// "mixed" lets the model detect each photo's crop; the farmer can correct it on the results screen.
const CROPS = [
    { id: 'maize', label: 'Maize' },
    { id: 'tomato', label: 'Tomato' },
    { id: 'potato', label: 'Potato' },
    { id: 'mixed', label: 'Not sure / mixed' },
];
const MAX_PHOTOS = 10; // same limit as the backend

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
    const [photos, setPhotos] = useState([]);
    const [symptoms, setSymptoms] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const room = MAX_PHOTOS - photos.length;
    const addPhotos = (assets) => setPhotos((current) => [...current, ...assets].slice(0, MAX_PHOTOS));

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
            // straight into our own preview, which has an explicit remove button.
            mediaTypes: ['images'],
            quality: 0.6,
        });
        if (!result.canceled) addPhotos(result.assets);
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
            // Several leaves at once; quality kept modest so up to 10 photos upload quickly.
            allowsMultipleSelection: true,
            selectionLimit: room,
            quality: 0.6,
        });
        if (!result.canceled) addPhotos(result.assets);
    };

    const choosePhoto = () => {
        Alert.alert('Add photos', `You can add ${room} more.`, [
            { text: 'Take photo', onPress: pickFromCamera },
            { text: 'Choose from gallery', onPress: pickFromGallery },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    // By position: the same gallery photo can be added twice.
    const removePhoto = (index) => setPhotos((current) => current.filter((_, i) => i !== index));

    // One photo of a known crop keeps the original flow (with symptom text); anything else
    // (several photos, or crop not sure) goes through the batch flow.
    const single = photos.length === 1 && crop && crop !== 'mixed';

    const handleSubmit = async () => {
        setError(null);
        setSubmitting(true);
        try {
            if (single) {
                const result = await submitDiagnosis({ token: userToken, crop, imageUri: photos[0].uri, symptoms });
                navigation.navigate('Result', { result, imageUri: photos[0].uri });
            } else {
                const imageUris = photos.map((p) => p.uri);
                const { results } = await submitBatch({
                    token: userToken,
                    crop: crop === 'mixed' ? null : crop,
                    imageUris,
                });
                navigation.navigate('BatchResult', { results, imageUris });
            }
        } catch (e) {
            setError(toFriendlyError(e));
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = crop && photos.length > 0 && !submitting;
    const missing =
        !crop && photos.length === 0
            ? 'Choose a crop and add a photo'
            : !crop
              ? 'Choose a crop, or "Not sure / mixed"'
              : photos.length === 0
                ? 'Add a photo'
                : null;
    const buttonLabel = photos.length > 1 ? `Check ${photos.length} photos` : 'Check this leaf';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar style="dark" />
            <ScreenHeader title="Check a leaf" onBack={() => navigation.goBack()} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
                    {/* Crop */}
                    <View className="mt-2">
                        <Label
                            title="Which crop is it?"
                            hint={
                                crop === 'mixed'
                                    ? "We'll work out each photo's crop. Check it on the results and correct it if it's wrong."
                                    : 'Choosing the crop gives the most reliable result'
                            }
                        />
                        <View className="flex-row flex-wrap">
                            {CROPS.map((item) => {
                                const selected = crop === item.id;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => setCrop(item.id)}
                                        activeOpacity={0.8}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected }}
                                        className="mr-2 mb-2 px-5 py-2.5 rounded-full"
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

                    {/* Photos */}
                    <View className="mt-6">
                        <Label
                            title={photos.length > 1 ? `Photos (${photos.length} of ${MAX_PHOTOS})` : 'Photo of the affected leaf'}
                            hint="One leaf filling the frame, in daylight, against a plain background. You can add up to 10."
                        />
                        {photos.length === 0 ? (
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
                                    Add photos
                                </Text>
                                <Text className="text-sm mt-0.5" style={{ color: COLORS.muted }}>
                                    Take one now or choose several from your gallery
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <View className="flex-row flex-wrap -mx-1">
                                {photos.map((photo, index) => (
                                    <View key={`${index}-${photo.uri}`} className="w-1/3 p-1">
                                        <Image source={{ uri: photo.uri }} className="w-full aspect-square rounded-lg" resizeMode="cover" />
                                        <TouchableOpacity
                                            onPress={() => removePhoto(index)}
                                            accessibilityRole="button"
                                            accessibilityLabel="Remove photo"
                                            hitSlop={8}
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full items-center justify-center"
                                            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                                        >
                                            <Ionicons name="close" size={16} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {room > 0 && (
                                    <View className="w-1/3 p-1">
                                        <TouchableOpacity
                                            onPress={choosePhoto}
                                            accessibilityRole="button"
                                            className="w-full aspect-square rounded-lg items-center justify-center"
                                            style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#B9C4BD' }}
                                        >
                                            <Ionicons name="add" size={28} color={COLORS.brand} />
                                            <Text className="text-sm font-semibold" style={{ color: COLORS.brand }}>
                                                Add
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Symptoms: one photo of a known crop only, where it belongs to a single diagnosis */}
                    {photos.length <= 1 && crop !== 'mixed' && (
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
                    )}

                    <Text className="text-sm mt-6 leading-5" style={{ color: COLORS.muted }}>
                        If we can't be confident about a result, we'll point you to support contacts instead of
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
                        label={buttonLabel}
                        loadingLabel={photos.length > 1 ? 'Sending photos…' : 'Sending photo…'}
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
