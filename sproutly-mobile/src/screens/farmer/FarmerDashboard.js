import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../stateManagement/AuthContext';
import { COLORS } from '../../constants/Colors';


const { width } = Dimensions.get('window');

export default function FarmerDashboard({ navigation }) {
    const { logout } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* HEADER: Location, Notifications & Identity */}
            <LinearGradient
                colors={[COLORS.forestDeep, COLORS.forestMid]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.navBar}>
                        <TouchableOpacity onPress={() => navigation.openDrawer()}>
                            <Ionicons name="menu-outline" size={30} color="white" />
                        </TouchableOpacity>

                        <View style={styles.locationPicker}>
                            <Ionicons name="location" size={16} color="#A7D7C5" />
                            <Text style={styles.locationText}>Limuru, Kiambu</Text>
                            <Ionicons name="chevron-down" size={14} color="#A7D7C5" />
                        </View>

                        <TouchableOpacity style={styles.notificationBtn}>
                            <View style={styles.dot} />
                            <Ionicons name="notifications-outline" size={26} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* THE PULSE: Real-time Earnings & Weather */}
                    <View style={styles.pulseCard}>
                        <View>
                            <Text style={styles.pulseLabel}>Today's Earnings</Text>
                            <Text style={styles.pulseValue}>KSh 4,500</Text>
                        </View>
                        <View style={styles.weatherWidget}>
                            <MaterialCommunityIcons name="weather-partly-cloudy" size={32} color="white" />
                            <Text style={styles.weatherTemp}>24°C</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* DYNAMIC ALERT: The survival feature */}
                <TouchableOpacity style={styles.outbreakCard}>
                    <LinearGradient
                        colors={['#FFF1F2', '#FFE4E6']}
                        style={styles.alertGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="warning" size={24} color="#E11D48" />
                        <View style={styles.alertTextContent}>
                            <Text style={styles.alertTitle}>Outbreak Alert</Text>
                            <Text style={styles.alertDesc}>Maize Lethal Necrosis detected within 10km.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#E11D48" />
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Market Insights</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See Trends</Text>
                    </TouchableOpacity>
                </View>

                {/* Market Scroller */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.marketScroll}>
                    <View style={styles.priceCard}>
                        <Text style={styles.cropName}>Managu</Text>
                        <Text style={styles.cropPrice}>KSh 80/kg</Text>
                        <Text style={[styles.priceTrend, { color: '#059669' }]}>↑ 5%</Text>
                    </View>
                    <View style={styles.priceCard}>
                        <Text style={styles.cropName}>Maize</Text>
                        <Text style={styles.cropPrice}>KSh 4.2k/Bag</Text>
                        <Text style={[styles.priceTrend, { color: '#DC2626' }]}>↓ 2%</Text>
                    </View>
                </ScrollView>

                {/* CLINIC LOG: Keeping it relevant */}
                <Text style={styles.sectionTitle}>Recent Health Scans</Text>
                <View style={styles.scanHistoryCard}>
                    <View style={styles.scanIconBg}>
                        <Ionicons name="leaf" size={24} color={COLORS.forestMid} />
                    </View>
                    <View style={styles.scanDetails}>
                        <Text style={styles.scanResult}>Healthy Cabbage</Text>
                        <Text style={styles.scanDate}>Scanned yesterday • 4:30 PM</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color="#059669" />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FBFBFC',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    locationPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    locationText: {
        color: 'white',
        fontSize: 13,
        marginHorizontal: 6,
        fontWeight: '500',
    },
    notificationBtn: {
        padding: 8,
    },
    dot: {
        position: 'absolute',
        top: 8,
        right: 10,
        width: 8,
        height: 8,
        backgroundColor: '#FB923C',
        borderRadius: 4,
        zIndex: 1,
        borderWidth: 1.5,
        borderColor: COLORS.forestDeep,
    },
    pulseCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 25,
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 20,
        borderRadius: 24,
    },
    pulseLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    pulseValue: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 4,
    },
    weatherWidget: {
        alignItems: 'center',
    },
    weatherTemp: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 2,
    },
    content: {
        padding: 20,
    },
    outbreakCard: {
        marginBottom: 25,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#E11D48',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    alertGradient: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    alertTextContent: {
        flex: 1,
        marginLeft: 12,
    },
    alertTitle: {
        color: '#9F1239',
        fontWeight: 'bold',
        fontSize: 15,
    },
    alertDesc: {
        color: '#BE123C',
        fontSize: 12,
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 15,
    },
    seeAll: {
        color: COLORS.forestMid,
        fontWeight: '600',
        fontSize: 14,
    },
    marketScroll: {
        marginBottom: 25,
    },
    priceCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 20,
        marginRight: 15,
        width: 130,
        elevation: 2,
        shadowOpacity: 0.05,
    },
    cropName: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '600',
    },
    cropPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginVertical: 4,
    },
    priceTrend: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    scanHistoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 20,
        elevation: 2,
    },
    scanIconBg: {
        padding: 10,
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
    },
    scanDetails: {
        flex: 1,
        marginLeft: 15,
    },
    scanResult: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    scanDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
});