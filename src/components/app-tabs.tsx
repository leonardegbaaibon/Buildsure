import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  useColorScheme,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Colors } from '@/constants/theme';
import {
  getTabBarHidden,
  subscribeTabBarHidden,
  getActiveTab,
  setActiveTab,
  subscribeActiveTab,
} from '@/utils/user-store';

import HomeScreen from '@/app/index';
import PropertiesScreen from '@/app/properties';
import DocumentsScreen from '@/app/documents';
import ProfileScreen from '@/app/profile';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const [tabBarHidden, setTabBarHidden] = useState(getTabBarHidden());
  const [activeTab, setActiveTabState] = useState(getActiveTab());

  useEffect(() => {
    const unsubscribeTabBar = subscribeTabBarHidden((hidden) => {
      setTabBarHidden(hidden);
    });
    const unsubscribeActiveTab = subscribeActiveTab((tab) => {
      setActiveTabState(tab);
    });
    return () => {
      unsubscribeTabBar();
      unsubscribeActiveTab();
    };
  }, []);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'properties':
        return <PropertiesScreen />;
      case 'documents':
        return <DocumentsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Screen Content Wrapper */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Floating Bottom Tab Bar */}
      {!tabBarHidden && (
        <View style={styles.tabBarFloatingContainer}>
          <View style={styles.tabBar}>
            {/* Tab 1: Home */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => setActiveTab('home')}
            >
              <SymbolView
                name={{
                  ios: activeTab === 'home' ? 'house.fill' : 'house',
                  android: 'home',
                  web: 'home',
                }}
                size={22}
                tintColor={activeTab === 'home' ? '#D87C24' : '#8A8D93'}
              />
              <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
                Home
              </Text>
            </TouchableOpacity>

            {/* Tab 2: Properties */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => setActiveTab('properties')}
            >
              <SymbolView
                name={{
                  ios: activeTab === 'properties' ? 'building.2.fill' : 'building.2',
                  android: 'domain',
                  web: 'domain',
                }}
                size={22}
                tintColor={activeTab === 'properties' ? '#D87C24' : '#8A8D93'}
              />
              <Text style={[styles.tabLabel, activeTab === 'properties' && styles.tabLabelActive]}>
                Properties
              </Text>
            </TouchableOpacity>

            {/* Tab 3: Documents */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => setActiveTab('documents')}
            >
              <SymbolView
                name={{
                  ios: activeTab === 'documents' ? 'doc.text.fill' : 'doc.text',
                  android: 'description',
                  web: 'description',
                }}
                size={22}
                tintColor={activeTab === 'documents' ? '#D87C24' : '#8A8D93'}
              />
              <Text style={[styles.tabLabel, activeTab === 'documents' && styles.tabLabelActive]}>
                Documents
              </Text>
            </TouchableOpacity>

            {/* Tab 4: Profile */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => setActiveTab('profile')}
            >
              <SymbolView
                name={{
                  ios: activeTab === 'profile' ? 'person.fill' : 'person',
                  android: 'person',
                  web: 'person',
                }}
                size={22}
                tintColor={activeTab === 'profile' ? '#D87C24' : '#8A8D93'}
              />
              <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  screenContainer: {
    flex: 1,
  },
  tabBarFloatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    paddingVertical: 10,
  },
  tabLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#8A8D93',
    marginTop: 5,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontFamily: 'Satoshi-Bold',
    color: '#D87C24',
    fontWeight: '700',
  },
});
