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

export default function SignUpScreen({ navigation }) {
    const [authMethod, setAuthMethod] = useState('phone'); // 'phone' or 'email'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUpSubmit = async () => {
        setLoading(true);
        try {
            if (!password || !confirmPassword) throw new Error("Please fill in all fields.");
            if (password.length < 8) throw new Error("Password must be at least 8 characters.");
            if (password !== confirmPassword) throw new Error("Passwords do not match.");

            if (authMethod === 'phone') {
                if (phoneNumber.length < 9) throw new Error("Please enter a valid Kenyan phone number.");
                await AuthService.register({ phoneNumber, password });
                navigation.navigate('OTP', { phoneNumber, isSignUp: true });
            } else {
                if (!email) throw new Error("Please enter your email.");
                await AuthService.register({ email, password });
                navigation.navigate('OTP', { email, isSignUp: true });
            }
        } catch (error) {
            Alert.alert('Sign Up Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0B1A13', '#1B3D2F', '#2D5A43']} className="flex-1">
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerClassName="flex-grow pb-10" keyboardShouldPersistTaps="handled">
                    <View className="pt-12 px-5">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="p-2.5 self-start flex-row items-center"
                        >
                            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                            <Text className="text-white text-base font-semibold ml-1">Back</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 px-8 pt-2.5">
                        <Text className="text-3xl font-bold text-white text-center">Create Account</Text>
                        <Text className="text-base text-white/70 text-center mb-6">Join the Sproutly community</Text>

                        {/* Method Selector */}
                        <View className="flex-row mb-6 bg-white/10 rounded-2xl p-1 border border-white/10">
                            <TouchableOpacity
                                className={`flex-1 py-3 items-center justify-center rounded-xl ${authMethod === 'phone' ? 'bg-white/20' : ''}`}
                                onPress={() => setAuthMethod('phone')}
                            >
                                <Text className={`text-base font-semibold ${authMethod === 'phone' ? 'text-white' : 'text-white/60'}`}>
                                    Phone
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 py-3 items-center justify-center rounded-xl ${authMethod === 'email' ? 'bg-white/20' : ''}`}
                                onPress={() => setAuthMethod('email')}
                            >
                                <Text className={`text-base font-semibold ${authMethod === 'email' ? 'text-white' : 'text-white/60'}`}>
                                    Email
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Glassy Inputs */}
                        <View>
                            {authMethod === 'phone' ? (
                                <View className="mb-4">
                                    <Text className="text-white text-sm font-semibold mb-2 ml-1">Phone Number</Text>
                                    <TextInput
                                        className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-base text-white"
                                        placeholder="0712 345 678"
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        keyboardType="phone-pad"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                    />
                                </View>
                            ) : (
                                <View className="mb-4">
                                    <Text className="text-white text-sm font-semibold mb-2 ml-1">Email Address</Text>
                                    <TextInput
                                        className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-base text-white"
                                        placeholder="farmer@sproutly.com"
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                </View>
                            )}

                            <View className="mb-4">
                                <Text className="text-white text-sm font-semibold mb-2 ml-1">Password</Text>
                                <TextInput
                                    className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-base text-white"
                                    placeholder="At least 8 characters"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>
                            <View className="mb-4">
                                <Text className="text-white text-sm font-semibold mb-2 ml-1">Confirm Password</Text>
                                <TextInput
                                    className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-base text-white"
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>

                            <TouchableOpacity
                                className={`bg-white py-4 rounded-2xl items-center mt-4 shadow-lg ${loading ? 'opacity-70' : ''}`}
                                onPress={handleSignUpSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#1B4332" />
                                ) : (
                                    <Text className="text-primary text-lg font-bold">Sign Up</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center my-5">
                            <View className="flex-1 h-px bg-white/20" />
                            <Text className="mx-4 text-white/40 text-sm">OR</Text>
                            <View className="flex-1 h-px bg-white/20" />
                        </View>

                        <TouchableOpacity className="border border-white/20 py-[15px] rounded-2xl items-center flex-row justify-center">
                            <Ionicons name="logo-google" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text className="text-white text-base font-semibold">Continue with Google</Text>
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-6">
                            <Text className="text-white/70 text-sm">Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text className="text-white text-sm font-bold underline">Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
