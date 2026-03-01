import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';

export default function MarketScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.header}>
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()}>
                        <Ionicons name="menu-outline" size={30} color={COLORS.forestDeep} />
                    </TouchableOpacity>

                    <Text style={styles.title}>Market   </Text>

                    <View style={{ width: 30 }} />
                </View>
            </SafeAreaView>

            <View style={styles.content}>
                <Text>Start building your {navigation.getState().routes[navigation.getState().index].name} content here!</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FBFBFC',
    },
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.forestDeep,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});