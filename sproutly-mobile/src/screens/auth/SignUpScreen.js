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

export default function SignUpScreen({ navigation }) {
    const { login } = useContext(AuthContext); // Using your AuthContext "Brain"
    const [authMethod, setAuthMethod] = useState('phone'); // 'phone' or 'email'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUpSubmit = async () => {
        setLoading(true);
        try {
            if (authMethod === 'phone') {
                if (phoneNumber.length < 9) throw new Error("Please enter a valid Kenyan phone number.");

                // This will later call your Flask/Node API for OTP
                // navigation.navigate('OTP', { phoneNumber, isSignUp: true });
                console.log("Phone Sign Up for:", phoneNumber);
            } else {
                if (!email || !password || !confirmPassword) throw new Error("Please fill in all fields.");
                if (password !== confirmPassword) throw new Error("Passwords do not match.");

                // SIMULATED POSTGRES CALL: Later axios.post(`${API_URL}/auth/signup`, { email, password })
                console.log("Registering with Email:", email);

                // After successful DB entry, we "login" to flip the token switch
                login("mock-postgres-token");
                navigation.navigate('RoleSelection');
            }
        } catch (error) {
            Alert.alert('Sign Up Error', error.message);
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
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join the Sproutly community</Text>

                        {/* Method Selector */}
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

                        {/* Glassy Inputs */}
                        <View style={styles.formContainer}>
                            {authMethod === 'phone' ? (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Phone Number</Text>
                                    <TextInput
                                        style={styles.glassInput}
                                        placeholder="0712 345 678"
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        keyboardType="phone-pad"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                    />
                                </View>
                            ) : (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email Address</Text>
                                        <TextInput
                                            style={styles.glassInput}
                                            placeholder="farmer@sproutly.com"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            autoCapitalize="none"
                                            value={email}
                                            onChangeText={setEmail}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Password</Text>
                                        <TextInput
                                            style={styles.glassInput}
                                            placeholder="••••••••"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            secureTextEntry
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Confirm Password</Text>
                                        <TextInput
                                            style={styles.glassInput}
                                            placeholder="••••••••"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            secureTextEntry
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                        />
                                    </View>
                                </>
                            )}

                            <TouchableOpacity
                                style={[styles.mainButton, loading && { opacity: 0.7 }]}
                                onPress={handleSignUpSubmit}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color={COLORS.forestDeep} /> : <Text style={styles.buttonText}>Sign Up</Text>}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider}>
                            <View style={styles.line} /><Text style={styles.dividerText}>OR</Text><View style={styles.line} />
                        </View>

                        <TouchableOpacity style={styles.googleButton}>
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.footerLink}>Login</Text>
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
        flexGrow: 1, paddingBottom: 40,
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 10,
    },
    backButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 10,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 25,
        justifyContent: 'center',
    },
    methodSelector: {
        flexDirection: 'row',
        marginBottom: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    methodButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        justifyContent: 'center',
    },
    methodButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    methodButtonText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        justifyContent: 'center',
    },
    methodButtonTextActive: {
        color: COLORS.white,
    },
    inputGroup: {
        marginBottom: 15,
        justifyContent: 'center',
    },
    label: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4
    },
    glassInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.white,
    },
    mainButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 16,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 15,
        elevation: 5
    },
    buttonText: {
        color: COLORS.forestDeep,
        fontSize: 18,
        fontWeight: 'bold'
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    dividerText: {
        marginHorizontal: 15,
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14
    },
    googleButton: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center'
    },
    googleButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25
    },
    footerText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14
    },
    footerLink: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline'
    },
});