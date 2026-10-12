import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

/** Plain top bar: a back (or close) icon and the screen title, left-aligned. */
export default function ScreenHeader({ title, onBack, icon = 'arrow-back' }) {
    return (
        <View className="flex-row items-center px-3 pt-2 pb-2">
            {onBack && (
                <TouchableOpacity
                    onPress={onBack}
                    hitSlop={12}
                    className="p-2 mr-1"
                    accessibilityRole="button"
                    accessibilityLabel={icon === 'close' ? 'Close' : 'Go back'}
                >
                    <Ionicons name={icon} size={24} color={COLORS.ink} />
                </TouchableOpacity>
            )}
            <Text className="text-lg font-bold" style={{ color: COLORS.ink }}>
                {title}
            </Text>
        </View>
    );
}
