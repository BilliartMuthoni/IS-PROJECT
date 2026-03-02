// Contains information needed by the whole app eg usertoken
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userRoles, setUserRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial check - Does a token exist on this phone?
    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const roles = await AsyncStorage.getItem('userRoles');

                if (token) setUserToken(token);
                if (roles) setUserRoles(JSON.parse(roles));

            } catch (e) {
                console.error("Failed to load auth data", e);
            }
            setIsLoading(false);
        };

        bootstrapAsync();
    }, []);

    // The Login Action
    const login = async (token, roles = []) => {
        try {
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userRoles', JSON.stringify(roles));

            setUserToken(token);
            setUserRoles(roles);

        } catch (e) {
            console.error("Failed to save auth data", e)
        }
    };

    // The Logout Action
    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['userToken', 'userRoles']);
            setUserToken(null);
            setUserRoles([]);
        } catch (e) {
            console.error("Failed to remove auth data", e);
        }
    };

    return (
        <AuthContext.Provider value={{ login, logout, userToken, userRoles, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};