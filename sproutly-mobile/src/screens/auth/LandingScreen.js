import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/Colors.js';

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
    return (
        <LinearGradient
            colors={[COLORS.forestDeep, COLORS.forestMid, COLORS.forestLight]}
            style={styles.container}
        >
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeAreaView}>
                <View style={styles.content}>
                    {/* Logo/Icon Area */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../../assets/images/sproutly-logo.png')}
                            alt="Sproutly Logo"
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.appTitle}>Sproutly</Text>
                        <Text style={styles.tagline}>Connecting Farmers, Buyers & Service Providers</Text>
                    </View>

                    {/* Feature Cards */}
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureCard}>
                            <Text style={styles.featureIcon}>👨‍🌾</Text>
                            <Text style={styles.featureText}>Farmers</Text>
                        </View>
                        <View style={styles.featureCard}>
                            <Text style={styles.featureIcon}>🛒</Text>
                            <Text style={styles.featureText}>Buyers</Text>
                        </View>
                        <View style={styles.featureCard}>
                            <Text style={styles.featureIcon}>🔧</Text>
                            <Text style={styles.featureText}>Services</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('SignUp')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>Get Started</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>
                                Already have an account? <Text style={styles.LoginText}>Login</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeAreaView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingTop: 30,
        paddingBottom: 50,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 0,
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: -5,
        marginTop: -10,
    },
    appTitle: {
        fontSize: 40,
        fontWeight: '900',
        color: COLORS.white,
        textAlign: 'center',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: COLORS.white,
        textAlign: 'center',
        opacity: 0.85,
        marginTop: 2,
        paddingHorizontal: 20,
    },
    featuresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 30,
    },
    featureCard: {
        alignItems: 'center',
        backgroundColor: COLORS.glass,
        padding: 15,
        borderRadius: 20,
        width: width * 0.26,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    featureIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    featureText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        opacity: 0.9,
    },
    buttonContainer: {
        width: '100%',
    },
    primaryButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    primaryButtonText: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    LoginText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});