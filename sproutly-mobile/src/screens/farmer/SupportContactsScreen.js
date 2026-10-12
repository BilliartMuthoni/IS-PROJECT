import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS } from '../../constants/theme';

// The county support-contacts directory (maintained by the administrator) is added in a later sprint.
export default function SupportContactsScreen({ navigation }) {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar style="dark" />
            <ScreenHeader title="Support Contacts" onBack={() => navigation.goBack()} />
            <View className="px-5 mt-2">
                <Text className="text-base leading-6" style={{ color: COLORS.muted }}>
                    Contacts for your county will be listed here.
                </Text>
            </View>
        </SafeAreaView>
    );
}
