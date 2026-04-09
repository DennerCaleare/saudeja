import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';

function TabIcon({ name, color, size }: { name: any; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label.toUpperCase()}
    </Text>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  // Em telas largas, a tab bar deve centralizar em 480px como o conteúdo
  const barWidth = isWide ? Math.min(width, 480) : width;
  const barLeft = isWide ? (width - barWidth) / 2 : 0;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            width: barWidth,
            left: barLeft,
            right: undefined, // sobrescreve o right: 0 automático
          },
        ],
        tabBarBackground: () => <View style={styles.tabBarBg} />,
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabPill, focused && styles.tabPillActive]}>
              <TabIcon name={focused ? 'grid' : 'grid-outline'} color={focused ? colors.onPrimaryFixed : colors.onSurfaceVariant} size={22} />
              <TabLabel label="Painel" focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="remedios"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabPill, focused && styles.tabPillActive]}>
              <TabIcon name={focused ? 'medical' : 'medical-outline'} color={focused ? colors.onPrimaryFixed : colors.onSurfaceVariant} size={22} />
              <TabLabel label="Remédios" focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="vacinas"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabPill, focused && styles.tabPillActive]}>
              <TabIcon name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} color={focused ? colors.onPrimaryFixed : colors.onSurfaceVariant} size={22} />
              <TabLabel label="Vacinas" focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="perto"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabPill, focused && styles.tabPillActive]}>
              <TabIcon name={focused ? 'navigate' : 'navigate-outline'} color={focused ? colors.onPrimaryFixed : colors.onSurfaceVariant} size={22} />
              <TabLabel label="Perto" focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="minha-saude"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabPill, focused && styles.tabPillActive]}>
              <TabIcon name={focused ? 'person' : 'person-outline'} color={focused ? colors.onPrimaryFixed : colors.onSurfaceVariant} size={22} />
              <TabLabel label="Perfil" focused={focused} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    height: Platform.OS === 'ios' ? 88 : 72,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#006b3c',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  tabItem: {
    height: 65,
    paddingTop: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    minWidth: 40,
  },
  tabPillActive: {
    backgroundColor: colors.primaryFixed, // verde menta #9df6b9
  },
  tabLabel: {
    display: 'none',
  },
  tabLabelActive: {
    display: 'flex',
    fontSize: 11,
    fontFamily: 'PublicSans-Bold',
    letterSpacing: 1,
    color: colors.onPrimaryFixed,
  },
});
