import React, { useState, useEffect } from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { getTabBarHidden, subscribeTabBarHidden } from '@/utils/user-store';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const [tabBarHidden, setTabBarHidden] = useState(getTabBarHidden());

  useEffect(() => {
    const unsubscribe = subscribeTabBarHidden((hidden) => {
      setTabBarHidden(hidden);
    });
    return unsubscribe;
  }, []);

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      hidden={tabBarHidden}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('../../assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="properties">
        <NativeTabs.Trigger.Label>Properties</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('../../assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="documents">
        <NativeTabs.Trigger.Label>Documents</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('../../assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('../../assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
