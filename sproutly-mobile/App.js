import React, { useContext } from 'react';
import { NavigationContainer, createStaticNavigation, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, AuthContext } from './src/stateManagement/AuthContext.js';

import { createDrawerNavigator } from '@react-navigation/drawer';

// Auth Screens
import LandingScreen from './src/screens/auth/LandingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import RoleSelectionScreen from './src/screens/auth/RoleSelectionScreen';

// Splash Screen
import SplashScreen from './src/screens/SplashScreen.js';
//Farmer
import FarmerDashboard from './src/screens/farmer/FarmerDashboard';

//Buyer
import BuyerDashboard from './src/screens/buyer/BuyerDashboard';

//Service Provider
import ServiceProviderDashboard from './src/screens/service-provider/ServiceProviderDashboard';

const Stack = createStackNavigator();

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
                        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
                    </>
                ) : (

                    <>
                        {/*Farmer*/}
                        <Stack.Screen name="FarmerHome" component={FarmerDashboard} />

                        {/*Buyer*/}
                        <Stack.Screen name="BuyerHome" component={BuyerDashboard} />

                        {/*Service Provider*/}
                        <Stack.Screen name="ProviderHome" component={ServiceProviderDashboard} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    );
}