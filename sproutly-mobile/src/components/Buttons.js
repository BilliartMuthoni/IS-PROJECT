import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

/** One filled button per screen: the main next step. */
export function PrimaryButton({ label, onPress, color = COLORS.brand, icon, disabled, loading, loadingLabel }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            className="rounded-xl py-4 items-center flex-row justify-center"
            style={{ backgroundColor: disabled ? '#C9D1CC' : color }}
        >
            {loading ? (
                <View className="flex-row items-center">
                    <ActivityIndicator color="#FFFFFF" />
                    <Text className="text-white text-base font-bold ml-3">{loadingLabel || label}</Text>
                </View>
            ) : (
                <>
                    {icon && <Ionicons name={icon} size={18} color="#FFFFFF" style={{ marginRight: 8 }} />}
                    <Text className="text-white text-base font-bold">{label}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

/** Outlined button for a real alternative to the main step. */
export function SecondaryButton({ label, onPress, color = COLORS.brand }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            className="rounded-xl py-4 items-center mt-3"
            style={{ borderWidth: 1.5, borderColor: color }}
        >
            <Text className="text-base font-semibold" style={{ color }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

/** Text-only action for the least important choice, e.g. "Back to home". */
export function TextButton({ label, onPress, color = COLORS.muted }) {
    return (
        <TouchableOpacity onPress={onPress} hitSlop={8} accessibilityRole="button" className="py-4 items-center">
            <Text className="text-base font-semibold" style={{ color }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}
