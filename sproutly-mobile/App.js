import 'react-native-gesture-handler';
import './global.css';
import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext, AuthProvider } from './src/context/AuthContext';

// Auth Screens
import LandingScreen from './src/screens/auth/LandingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import OTPScreen from './src/screens/auth/OTPScreen';

// Splash Screen
import SplashScreen from './src/screens/SplashScreen.js';

const Stack = createStackNavigator();

// TODO: replace with the real FarmerDashboard once it's rebuilt
function FarmerHomePlaceholder() {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <Text className="text-lg font-bold text-forestDeep">Farmer Home (placeholder)</Text>
        </View>
    );
}

const RootNavigator = () => {
    const { userToken, isLoading } = useContext(AuthContext);

    // While checking for a token in storage, show nothing (or a Splash Screen)
    if (isLoading) return <SplashScreen />;

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken == null ? (
                    <>
                        {/*Authentication*/}
                        <Stack.Screen name="Landing" component={LandingScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                        <Stack.Screen name="OTP" component={OTPScreen} />
                    </>
                ) : (
                    <>
                        {/*Farmer*/}
                        <Stack.Screen name="FarmerHome" component={FarmerHomePlaceholder} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <RootNavigator />
            </AuthProvider>
        </GestureHandlerRootView>
    );
}