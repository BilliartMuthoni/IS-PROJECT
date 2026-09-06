import React from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
    return (
        <LinearGradient colors={['#0B1A13', '#1B3D2F', '#2D5A43']} style={{ flex: 1 }}>
            <StatusBar style="light" />
            <View className="flex-1 items-center justify-center px-10">
                <Image
                    source={require('../../assets/images/sproutly-logo.png')}
                    alt="Sproutly Logo"
                    className="w-40 h-40 mb-2"
                    resizeMode="contain"
                />
                <Text className="text-4xl font-black text-white tracking-wide">Sproutly</Text>
                <Text className="text-sm text-white/70 text-center mt-2">
                    Crop disease diagnosis for Kenyan farmers
                </Text>
                <ActivityIndicator color="#FFFFFF" className="mt-10" />
            </View>
        </LinearGradient>
    );
}
