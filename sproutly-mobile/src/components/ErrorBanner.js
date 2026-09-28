import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Inline error display. Stays on screen so the person can read it at their own
 * pace, unlike an alert that has to be dismissed before they can act on it.
 *
 * `error` is the shape returned by toFriendlyError(): { title, message, retryable }
 */
export default function ErrorBanner({ error, onRetry, onDismiss, tone = 'light' }) {
    if (!error) return null;

    const isDark = tone === 'dark';
    const containerClass = isDark
        ? 'bg-white/10 border border-white/20'
        : 'bg-[#FDF0EA] border border-[#F0D3C3]';
    const titleClass = isDark ? 'text-white' : 'text-[#8F4E22]';
    const messageClass = isDark ? 'text-white/80' : 'text-[#8F4E22]';
    const iconColor = isDark ? '#FFFFFF' : '#B4622A';

    return (
        <View className={`rounded-2xl p-4 ${containerClass}`}>
            <View className="flex-row">
                <Ionicons name="alert-circle-outline" size={20} color={iconColor} />
                <View className="flex-1 ml-3">
                    <Text className={`text-sm font-bold ${titleClass}`}>{error.title}</Text>
                    <Text className={`text-sm mt-0.5 leading-5 ${messageClass}`}>{error.message}</Text>

                    {(onRetry && error.retryable) || onDismiss ? (
                        <View className="flex-row mt-3">
                            {onRetry && error.retryable && (
                                <TouchableOpacity onPress={onRetry} className="mr-5">
                                    <Text className={`text-sm font-bold underline ${titleClass}`}>Try again</Text>
                                </TouchableOpacity>
                            )}
                            {onDismiss && (
                                <TouchableOpacity onPress={onDismiss}>
                                    <Text className={`text-sm font-semibold ${messageClass}`}>Dismiss</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
}
