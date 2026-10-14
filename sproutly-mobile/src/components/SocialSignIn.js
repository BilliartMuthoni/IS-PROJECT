import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { fetchSignInProviders } from '../api/AuthService';
import { signInWith } from '../api/oauth';
import { toFriendlyError } from '../utils/errorMessages';
import ErrorBanner from './ErrorBanner';

const PROVIDERS = {
    github: { label: 'Continue with GitHub', icon: 'logo-github' },
    google: { label: 'Continue with Google', icon: 'logo-google' },
};

/**
 * "or" plus one button per sign-in option the backend has switched on, for the
 * dark login and sign-up screens. Shows nothing if none are available.
 */
export default function SocialSignIn({ navigation }) {
    const { login } = useContext(AuthContext);
    const [providers, setProviders] = useState([]);
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSignInProviders().then((list) => setProviders(list.filter((p) => PROVIDERS[p])));
    }, []);

    const start = async (provider) => {
        setBusy(provider);
        setError(null);
        try {
            const result = await signInWith(provider);
            if (!result) return; // closed or cancelled: nothing to report
            if (result.challenge) {
                // This account has the authenticator switched on, so it still asks for the code.
                navigation.navigate('MfaCode', { mfaToken: result.challenge.mfa_token });
                return;
            }
            const { tokens } = result;
            await login(tokens.access_token, [tokens.role], tokens.refresh_token);
        } catch (e) {
            setError(toFriendlyError(e));
        } finally {
            setBusy(null);
        }
    };

    if (providers.length === 0) return null;

    return (
        <View>
            <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-white/20" />
                <Text className="mx-4 text-white/40 text-sm">or</Text>
                <View className="flex-1 h-px bg-white/20" />
            </View>

            {providers.map((provider) => (
                <TouchableOpacity
                    key={provider}
                    onPress={() => start(provider)}
                    disabled={busy !== null}
                    accessibilityRole="button"
                    className={`border border-white/20 py-4 rounded-2xl items-center flex-row justify-center mb-3 ${busy && busy !== provider ? 'opacity-50' : ''}`}
                >
                    {busy === provider ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name={PROVIDERS[provider].icon} size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text className="text-white text-base font-semibold">{PROVIDERS[provider].label}</Text>
                        </>
                    )}
                </TouchableOpacity>
            ))}

            {error && (
                <View className="mt-1">
                    <ErrorBanner error={error} tone="dark" onDismiss={() => setError(null)} />
                </View>
            )}
        </View>
    );
}
