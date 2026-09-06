import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as AuthService from '../../api/AuthService';

export default function LoginScreen({ navigation }) {
    const [authMethod, setAuthMethod] = useState('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoginSubmit = async () => {
        setLoading(true);
        try {
            if (!password) throw new Error("Please enter your password.");

            if (authMethod === 'phone') {
                if (phoneNumber.length < 9) throw new Error("Please enter a valid phone number.");
                await AuthService.login({ phoneNumber, password });
                navigation.navigate('OTP', { phoneNumber, isSignUp: false });
            } else {
                if (!email) throw new Error("Please enter your email.");
                await AuthService.login({ email, password });
                navigation.navigate('OTP', { email, isSignUp: false });
            }
        } catch (error) {
            Alert.alert('Login Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0B1A13', '#1B3D2F', '#2D5A43']} style={{ flex: 1 }}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerClassName="flex-grow">
                    <View className="pt-12 px-5">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2.5 self-start flex-row items-center">
                            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                            <Text className="text-white text-base font-semibold ml-1">Back</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 px-8 pt-5">
                        <Text className="text-3xl font-bold text-white mb-1 text-center">Welcome Back</Text>
                        <Text className="text-base text-white/70 mb-8 text-center">
                            Log in to manage your farm with Sproutly
                        </Text>

                        {/* Dark Method Selector */}
                        <View className="flex-row mb-8 bg-black/20 rounded-xl p-1">
                            <TouchableOpacity
                                className={`flex-1 py-3 items-center justify-center rounded-lg ${authMethod === 'phone' ? 'bg-white/15' : ''}`}
                                onPress={() => setAuthMethod('phone')}
                            >
                                <Text className={`text-base font-semibold ${authMethod === 'phone' ? 'text-white' : 'text-white/60'}`}>
                                    Phone
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 py-3 items-center justify-center rounded-lg ${authMethod === 'email' ? 'bg-white/15' : ''}`}
                                onPress={() => setAuthMethod('email')}
                            >
                                <Text className={`text-base font-semibold ${authMethod === 'email' ? 'text-white' : 'text-white/60'}`}>
                                    Email
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Inputs using Glassmorphism */}
                        <View className="mb-5">
                            <Text className="text-sm font-semibold text-white mb-2">
                                {authMethod === 'phone' ? 'Phone Number' : 'Email Address'}
                            </Text>
                            <TextInput
                                className="bg-black/20 border border-glassBorder rounded-xl px-4 py-4 text-base text-white"
                                placeholder={authMethod === 'phone' ? 'e.g. 0712345678' : 'your@email.com'}
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                keyboardType={authMethod === 'phone' ? 'phone-pad' : 'email-address'}
                                autoCapitalize="none"
                                value={authMethod === 'phone' ? phoneNumber : email}
                                onChangeText={authMethod === 'phone' ? setPhoneNumber : setEmail}
                            />
                        </View>

                        <View className="mb-5">
                            <Text className="text-sm font-semibold text-white mb-2">Password</Text>
                            <TextInput
                                className="bg-black/20 border border-glassBorder rounded-xl px-4 py-4 text-base text-white"
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            className={`bg-white py-[18px] rounded-xl items-center mt-2.5 shadow-lg ${loading ? 'opacity-70' : ''}`}
                            onPress={handleLoginSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#1B4332" />
                            ) : (
                                <Text className="text-primary text-lg font-bold">Send OTP</Text>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row items-center my-6 justify-center">
                            <View className="flex-1 h-px bg-glassBorder" />
                            <Text className="mx-4 text-white/40 text-sm">OR</Text>
                            <View className="flex-1 h-px bg-glassBorder" />
                        </View>

                        <TouchableOpacity className="border border-glassBorder py-4 rounded-xl items-center flex-row justify-center">
                            <Ionicons name="logo-google" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text className="text-white text-base font-semibold">Continue with Google</Text>
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-8 pb-5">
                            <Text className="text-sm text-white/70">Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                <Text className="text-sm text-white font-bold underline">Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
