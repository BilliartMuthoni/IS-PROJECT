import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import * as AuthService from '../../api/AuthService';
import { toFriendlyError } from '../../utils/errorMessages';
import ErrorBanner from '../../components/ErrorBanner';
import CodeInput from '../../components/CodeInput';

// Second step of login: the password was right, now the code from the authenticator app.
export default function MfaCodeScreen({ route, navigation }) {
    const { mfaToken } = route.params;
    const { login } = useContext(AuthContext);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const submit = async (value = code) => {
        if (value.length !== 6 || loading) return;
        setLoading(true);
        setError(null);
        try {
            const data = await AuthService.verifyMfa({ mfaToken, code: value });
            // RootNavigator switches to the farmer screens once the token is stored.
            await login(data.access_token, [data.role], data.refresh_token);
        } catch (e) {
            setError(toFriendlyError(e));
            setCode('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0B1A13', '#1B3D2F', '#2D5A43']} style={{ flex: 1 }}>
            <StatusBar style="light" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="pt-12 px-5">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2.5 self-start flex-row items-center">
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                        <Text className="text-white text-base font-semibold ml-1">Back</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-1 px-8 pt-10 items-center">
                    <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" style={{ marginBottom: 10 }} />
                    <Text className="text-2xl font-bold text-white mb-2.5 text-center">Enter your code</Text>
                    <Text className="text-base text-white/70 text-center mb-8 leading-6">
                        Open Google Authenticator or Microsoft Authenticator and type the 6-digit code shown under
                        Sproutly.
                    </Text>

                    <CodeInput value={code} onChangeText={setCode} onComplete={submit} />

                    {error && (
                        <View className="w-full mt-4">
                            <ErrorBanner error={error} tone="dark" onDismiss={() => setError(null)} />
                        </View>
                    )}

                    <TouchableOpacity
                        className={`bg-white py-[18px] rounded-2xl items-center w-full mt-6 shadow-lg ${loading || code.length !== 6 ? 'opacity-50' : ''}`}
                        onPress={() => submit()}
                        disabled={loading || code.length !== 6}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0B1A13" />
                        ) : (
                            <Text className="text-forestDeep text-lg font-bold">Log in</Text>
                        )}
                    </TouchableOpacity>

                    <Text className="text-sm text-white/50 text-center mt-8 leading-5">
                        The code changes every 30 seconds. If it is about to change, wait for the next one.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
