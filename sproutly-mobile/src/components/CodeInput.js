import React from 'react';
import { TextInput } from 'react-native';

/**
 * One box for the 6-digit authenticator code, on the dark auth screens.
 * A single input (rather than six) so pasting "123 456" from the authenticator
 * app works; spaces and other characters are dropped as the user types.
 */
export default function CodeInput({ value, onChangeText, onComplete, autoFocus = true }) {
    const handleChange = (text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6);
        onChangeText(digits);
        if (digits.length === 6 && onComplete) onComplete(digits);
    };

    return (
        <TextInput
            value={value}
            onChangeText={handleChange}
            autoFocus={autoFocus}
            keyboardType="number-pad"
            maxLength={7}
            placeholder="000000"
            placeholderTextColor="rgba(255,255,255,0.25)"
            selectionColor="#FFFFFF"
            accessibilityLabel="6-digit code from your authenticator app"
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 text-center text-3xl font-bold text-white"
            style={{ letterSpacing: 12 }}
        />
    );
}
