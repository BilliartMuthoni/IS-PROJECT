import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
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
import { AuthContext } from '../../stateManagement/AuthContext'
import { COLORS } from '../../constants/Colors'

export default function LoginScreen({ navigation }) {
    const { login } = useContext(AuthContext); // Our new "Brain"
    const [authMethod, setAuthMethod] = useState('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Simplified: Handles the transition to Postgres/Backend later
    const handleLoginSubmit = async () => {
        setLoading(true);
        try {
            if (authMethod === 'phone') {
                // Validation for Kenya phone numbers
                if (phoneNumber.length < 9) throw new Error("Please enter a valid phone number.");

                // This is where we'd call your Flask API. For now, we navigate to OTP
                navigation.navigate('OTP', { phoneNumber, isSignUp: false });
            } else {
                if (!email || !password) throw new Error("Please fill in all fields.");

                // SIMULATED LOGIN: Later replaced with axios.post('/api/login')
                console.log("Logging in with Email:", email);
                login("mock-jwt-token"); // Flips the switch in App.js
            }
        } catch (error) {
            Alert.alert('Login Error', error.message);
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
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Log in to manage your farm with Sproutly</Text>

                        {/* Dark Method Selector */}
                        <View style={styles.methodSelector}>
                            <TouchableOpacity
                                style={[styles.methodButton, authMethod === 'phone' && styles.methodButtonActive]}
                                onPress={() => setAuthMethod('phone')}
                            >
                                <Text style={[styles.methodButtonText, authMethod === 'phone' && styles.methodButtonTextActive]}>Phone</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.methodButton, authMethod === 'email' && styles.methodButtonActive]}
                                onPress={() => setAuthMethod('email')}
                            >
                                <Text style={[styles.methodButtonText, authMethod === 'email' && styles.methodButtonTextActive]}>Email</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Inputs using Glassmorphism */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{authMethod === 'phone' ? 'Phone Number' : 'Email Address'}</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder={authMethod === 'phone' ? 'e.g. 0712345678' : 'your@email.com'}
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                keyboardType={authMethod === 'phone' ? 'phone-pad' : 'email-address'}
                                autoCapitalize="none"
                                value={authMethod === 'phone' ? phoneNumber : email}
                                onChangeText={authMethod === 'phone' ? setPhoneNumber : setEmail}
                            />
                        </View>

                        {authMethod === 'email' && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.button, loading && { opacity: 0.7 }]}
                            onPress={handleLoginSubmit}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.buttonText}>{authMethod === 'phone' ? 'Send OTP' : 'Login'}</Text>}
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity style={styles.googleButton}>
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                <Text style={styles.footerLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20
    },
    backButton: {
        padding: 10,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600'
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 5,
        textAlign: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 30,
        textAlign: 'center',
        justifyContent: 'center',
    },
    methodSelector: {
        flexDirection: 'row',
        marginBottom: 30,
        backgroundColor: COLORS.glass,
        borderRadius: 12,
        padding: 4,
        justifyContent: 'center',
    },
    methodButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        justifyContent: 'center',
    },
    methodButtonActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
    methodButtonText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        justifyContent: 'center',
    },
    methodButtonTextActive: { color: COLORS.white },
    inputContainer: {
        marginBottom: 20,
        justifyContent: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.white,
        marginBottom: 8,
        justifyContent: 'center',
    },
    textInput: {
        backgroundColor: COLORS.glass,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 15,
        fontSize: 16,
        color: COLORS.white,
    },
    button: {
        backgroundColor: COLORS.white,
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        elevation: 5,
    },
    buttonText: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: 'bold',
        justifyContent: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25,
        justifyContent: 'center',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.glassBorder,
        justifyContent: 'center',
    },
    dividerText: {
        marginHorizontal: 15,
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        justifyContent: 'center',
    },
    googleButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    googleButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
        paddingBottom: 20,
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
    },
    footerLink: {
        fontSize: 14,
        color: COLORS.white,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        justifyContent: 'center',
    },
});