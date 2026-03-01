import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AuthContext } from '../../stateManagement/AuthContext';
import { COLORS } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function BuyerDashboard() {
    const { logout } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <LinearGradient
                colors={[COLORS.forestDeep, '#1B4332']}
                style={styles.header}
            >
                <SafeAreaView>
                    <View style={styles.navBar}>
                        <View>
                            <Text style={styles.greeting}>Fresh Market</Text>
                            <Text style={styles.subGreeting}>Find the best produce today</Text>
                        </View>
                        <TouchableOpacity style={styles.cartBadge} onPress={logout}>
                            <Text style={styles.icon}>🛒</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Shop by Category</Text>
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.gridCard}>
                        <Text style={styles.cardIcon}>🥬</Text>
                        <Text style={styles.cardTitle}>Vegetables</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.gridCard}>
                        <Text style={styles.cardIcon}>🍎</Text>
                        <Text style={styles.cardTitle}>Fruits</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.gridCard}>
                        <Text style={styles.cardIcon}>🥜</Text>
                        <Text style={styles.cardTitle}>Grains</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.gridCard}>
                        <Text style={styles.cardIcon}>🥛</Text>
                        <Text style={styles.cardTitle}>Dairy</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA'
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15
    },
    greeting: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold'
    },
    subGreeting: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14
    },
    cartBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 12
    },
    icon: {
        fontSize: 18
    },
    content: {
        padding: 20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 15
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    gridCard: {
        backgroundColor: 'white',
        width: (width - 55) / 2,
        padding: 25,
        borderRadius: 20,
        marginBottom: 15,
        alignItems: 'center',
        elevation: 2
    },
    cardIcon: {
        fontSize: 32,
        marginBottom: 10
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333'
    },
});