import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function SplashScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-forestDeep">
            <Text className="text-2xl font-extrabold text-white mb-4">Sproutly</Text>
            <ActivityIndicator color="#FFFFFF" />
        </View>
    );
}
