import React, { useState, useRef, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AuthContext } from '../../stateManagement/AuthContext'
import { COLORS } from '../../constants/Colors'

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

            if (isSignUp) {
                // We log in with a temporary status to allow Role Selection
                login("temp-token-selection");
                navigation.replace('RoleSelection', { phoneNumber });
            } else {
                login("actual-verified-token");
                navigation.replace('Home');
            }
        } catch (error) {
            Alert.alert('Verification Failed', 'Invalid code. Please try again.');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[COLORS.forestDeep, COLORS.forestMid, COLORS.forestLight]}
            style={styles.container}
        >
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContent}>
                    <Text style={styles.title}>🔐 Verification</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to
                    </Text>
                    <Text style={styles.phoneNumberText}>{phoneNumber}</Text>

                    <View style={styles.otpWrapper}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    digit && styles.otpInputFilled,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(index, value)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                                keyboardType="number-pad"
                                maxLength={1}
                                placeholder="0"
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                selectionColor={COLORS.white}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.verifyButton, (loading || otp.join('').length !== 6) && styles.buttonDisabled]}
                        onPress={handleVerifyOTP}
                        disabled={loading || otp.join('').length !== 6}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.forestDeep} />
                        ) : (
                            <Text style={styles.verifyButtonText}>Confirm Code</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                        {!canResend ? (
                            <Text style={styles.resendText}>
                                Resend code in {resendTimer}s
                            </Text>
                        ) : (
                            <TouchableOpacity onPress={() => setResendTimer(60) || setCanResend(false)}>
                                <Text style={styles.resendLink}>Resend OTP</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 10,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        fontSize: 16,
        color: COLORS.white,
        fontWeight: '600',
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    phoneNumberText: {
        fontSize: 18,
        color: COLORS.white,
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
    },
    otpWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 40,
    },
    otpInput: {
        width: 48,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    otpInputFilled: {
        borderColor: COLORS.white,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    verifyButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    verifyButtonText: {
        color: COLORS.forestDeep,
        fontSize: 18,
        fontWeight: 'bold',
    },
    resendContainer: {
        marginTop: 30,
    },
    resendText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
    },
    resendLink: {
        fontSize: 14,
        color: COLORS.white,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});