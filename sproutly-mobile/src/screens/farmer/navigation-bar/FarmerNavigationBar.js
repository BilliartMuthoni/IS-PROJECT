import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; 
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

// Bottom Navigation
import FarmerDashboard from '../screens/farmer/FarmerDashboard';
import MarketScreen from '../MarketScreen';
import ServiceProviderScreen from '../ServiceProviderScreen';
import DiseaseDetectionScreen from '../DiseaseDetectionScreen';
import ProfileScreen from '../screens/farmer/ProfileScreen';

//Sidebar Navigation
import IncomeTracker from '../IncomeTracker';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Bottom Tabs
function BottomTabs(){
    return(
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#2D6A4F',
                tabBarInactiveTintColor: '#9CA3AF',
            }}
        >
            <Tab.Screen
                name="Home"
                component={FarmerDashboard}
                options={{
                    tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="Soko"
                component={MarketScreen}
                options={{
                    tabBarIcon: ({ color }) => <Ionicons name="cart-outline" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="DiseaseDetection"
                component={DiseaseDetectionScreen}
                options={{
                    tabBarIcon: ({ color }) => <Ionicons name="scan" size={30} color="white" />,
                    tabBarButton: (props) => <CustomTabBarButton {...props} />
                }}
            />
            <Tab.Screen
                name="Service Provider"
                component={ServiceProviderScreen}
                options={{
                    tabBarIcon: ({ color }) => <Ionicons name="construct-outline" size={24} color="color" />,
                    
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
                }}
            />
        </Tab.Navigator>
    )
}

// Drawer Navigator
export default function FarmerNavigator() {
    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: false,
                drawerStyle: styles.drawerStyle,
                drawerActiveTintColor: '#2D6A4F',
            }}
        >
            <Drawer.Screen
                name="MainApp"
                component={BottomTabs}
                options={{
                    drawerLabel: 'Home Dashboard',
                    drawerIcon: ({ color }) => <Ionicons name="apps-outline" size={22} color={color} />
                }}
            />

            <Drawer.Screen
                name="ScanHistory"
                component={DiseaseDetectionScreen}
                options={{
                    drawerLabel: 'Scan History',
                    drawerIcon: ({ color }) => <Ionicons name="time-outline" size={22} color={color} />
                }}
            />

            <Drawer.Screen
                name="Finance"
                component={ProfileScreen} // Temporary placeholder
                options={{
                    drawerLabel: 'Expense Tracker',
                    drawerIcon: ({ color }) => <Ionicons name="wallet-outline" size={22} color={color} />
                }}
            />
        </Drawer.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        height: 70,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        paddingBottom: 0,
        borderTopWidth: 0,
    },
    heroButtonContainer: {
        top: -30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroButton: {
        width: 60,
        height: 60,
        borderRadius: 35,
        backgroundColor: '#2D6A4F',
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    drawerStyle: {
        backgroundColor: '#ffffff',
        width: 260,
    },
    drawerHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f4f4f4',
        marginBottom: 10,
    },
    drawerBrand: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D6A4F',
    }
});




const CustomTabBarButton = ({ children, onPress }) => (
    <TouchableOpacity 
        style={styles.heroButtonContainer}
        onPress={onPress}
        activeOpacity={0.8}
    >    
        <View style={styles.heroButton}>
            {children}
        </View>
    </TouchableOpacity>
);

function CustomDrawerContent(props) {
    const { logout } = useContext(AuthContext);
    return (
        <DrawerContentScrollView {...props}>
            <View style={styles.drawerHeader}>
                <Text style={styles.drawerBrand}>Shamba Smart</Text>
            </View>
            <DrawerItemList {...props} />
            <DrawerItem
                label="Logout"
                onPress={() => logout()}
                icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color="#DC2626" />}
                labelStyle={{ color: '#DC2626' }}
            />
        </DrawerContentScrollView>
    );
}
