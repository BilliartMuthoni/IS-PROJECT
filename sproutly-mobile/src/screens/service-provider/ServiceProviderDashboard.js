import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../stateManagement/AuthContext';
import { COLORS } from '../../constants/Colors';

export default function ServiceProviderDashboard() {
    const { logout } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#2D6A4F', '#081C15']}
                style={styles.header}
            >
                <SafeAreaView>
                    <View style={styles.navBar}>
                        <View>
                            <Text style={styles.title}>Service Hub</Text>
                            <Text style={styles.status}>Status: Online 🟢</Text>
                        </View>
                        <TouchableOpacity style={styles.btn} onPress={logout}>
                            <Text>👋</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.requestCard}>
                    <Text style={styles.reqTitle}>Pending Requests</Text>
                    <Text style={styles.reqCount}>4 New</Text>
                </View>

                <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.btnText}>View Work Schedule</Text>
                </TouchableOpacity>
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
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10
    },
    title: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold'
    },
    status: {
        color: '#95D5B2',
        fontSize: 12,
        fontWeight: 'bold'
    },
    btn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 10
    },
    content: {
        padding: 20
    },
    requestCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        borderLeftWidth: 5,
        borderLeftColor: '#40916C',
        elevation: 3
    },
    reqTitle: {
        fontSize: 14,
        color: '#666'
    },
    reqCount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1B4332'
    },
    actionBtn: {
        backgroundColor: '#2D6A4F',
        marginTop: 20,
        padding: 18,
        borderRadius: 15,
        alignItems: 'center'
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold'
    },
});