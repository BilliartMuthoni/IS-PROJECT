import React, { useState, useRef, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

export default function OTPScreen({ route, navigation }) {
    const { phoneNumber, isSignUp } = route.params;
    const { login } = useContext(AuthContext);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleOtpChange = (index, value) => {
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6);
            const newOtp = [...otp];
            for (let i = 0; i < pastedCode.length && (index + i) < 6; i++) {
                newOtp[index + i] = pastedCode[i];
            }
            setOtp(newOtp);
            const nextIndex = Math.min(index + pastedCode.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (index, key) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        try {
            // Logic for PostgreSQL backend verification would go here
            // const response = await axios.post(`${API_URL}/verify-otp`, { phoneNumber, otpString });

            console.log("Verifying OTP:", otpString);

            login("actual-verified-token");
            navigation.replace('FarmerHome');
        } catch (error) {
            Alert.alert('Verification Failed', 'Invalid code. Please try again.');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
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
                <View className="pt-12 px-5">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-2.5 self-start flex-row items-center"
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                        <Text className="text-white text-base font-semibold ml-1">Back</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-1 px-8 pt-10 items-center">
                    <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" style={{ marginBottom: 10 }} />
                    <Text className="text-2xl font-bold text-white mb-2.5 text-center">Verification</Text>
                    <Text className="text-base text-white/70 text-center">Enter the 6-digit code sent to</Text>
                    <Text className="text-lg font-bold text-white mb-10 text-center">{phoneNumber}</Text>

                    <View className="flex-row justify-between w-full mb-10">
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                className={`w-12 h-[60px] rounded-xl text-center text-2xl font-bold text-white border ${digit ? 'bg-white/20 border-white' : 'bg-white/10 border-white/20'}`}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(index, value)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                                keyboardType="number-pad"
                                maxLength={1}
                                placeholder="0"
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                selectionColor="#FFFFFF"
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        className={`bg-white py-[18px] rounded-2xl items-center w-full mt-2.5 shadow-lg ${(loading || otp.join('').length !== 6) ? 'opacity-50' : ''}`}
                        onPress={handleVerifyOTP}
                        disabled={loading || otp.join('').length !== 6}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0B1A13" />
                        ) : (
                            <Text className="text-forestDeep text-lg font-bold">Confirm Code</Text>
                        )}
                    </TouchableOpacity>

                    <View className="mt-8">
                        {!canResend ? (
                            <Text className="text-sm text-white/50">Resend code in {resendTimer}s</Text>
                        ) : (
                            <TouchableOpacity onPress={() => { setResendTimer(60); setCanResend(false); }}>
                                <Text className="text-sm text-white font-bold underline">Resend OTP</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
