import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  Mail,
  FileText,
  Shield,
  Star,
  Share2,
  Info,
  Bell,
  Trash2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import { config } from '@/utils/env';
import { logAnalyticsEvent } from '@/lib/firebase';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const appVersion = Constants.expoConfig?.version || config.appVersion;
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || '1';

  const handleEmailSupport = async () => {
    logAnalyticsEvent('support_email_opened');
    const subject = `Daily Planner Delight Support (v${appVersion})`;
    const url = `mailto:${config.supportEmail}?subject=${encodeURIComponent(subject)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open email app');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email app');
    }
  };

  const handleOpenPrivacyPolicy = () => {
    logAnalyticsEvent('privacy_policy_viewed');
    router.push('/legal?type=privacy');
  };

  const handleOpenTerms = () => {
    logAnalyticsEvent('terms_viewed');
    router.push('/legal?type=terms');
  };

  const handleRateApp = async () => {
    logAnalyticsEvent('rate_app_clicked');
    const appStoreUrl = 'https://apps.apple.com/app/id123456789'; // Replace with actual App Store URL

    try {
      await Linking.openURL(appStoreUrl);
    } catch (error) {
      Alert.alert('Error', 'Could not open App Store');
    }
  };

  const handleShareApp = async () => {
    logAnalyticsEvent('share_app_clicked');
    try {
      await Share.share({
        message: 'Check out Daily Planner Delight - the best way to plan your day!',
        url: 'https://apps.apple.com/app/id123456789', // Replace with actual URL
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your tasks and settings. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            logAnalyticsEvent('data_cleared');
            // TODO: Implement data clearing
            Alert.alert('Success', 'All data has been cleared');
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    label,
    value,
    onPress,
    isDestructive = false,
    showChevron = true,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingItemLeft}>
        <View
          style={[
            styles.settingIcon,
            { backgroundColor: isDestructive ? '#C75B6E20' : '#8B7AC720' },
          ]}
        >
          {icon}
        </View>
        <Text style={[styles.settingLabel, isDestructive && { color: '#C75B6E' }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingItemRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showChevron && onPress && <ChevronRight size={20} color="#666" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.appInfo}>
              <Info size={48} color="#8B7AC7" />
              <Text style={styles.appName}>Daily Planner Delight</Text>
              <Text style={styles.appVersion}>
                Version {appVersion} ({buildNumber})
              </Text>
              <Text style={styles.appEnvironment}>{config.appEnvironment.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            <SettingItem
              icon={<Bell size={20} color="#8B7AC7" />}
              label="Notifications"
              value={notificationsEnabled ? 'Enabled' : 'Disabled'}
              onPress={() => {
                setNotificationsEnabled(!notificationsEnabled);
                logAnalyticsEvent('notifications_toggled', {
                  enabled: !notificationsEnabled,
                });
              }}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <SettingItem
              icon={<Mail size={20} color="#8B7AC7" />}
              label="Contact Support"
              value={config.supportEmail}
              onPress={handleEmailSupport}
            />
            <View style={styles.divider} />
            <SettingItem
              icon={<Star size={20} color="#FFD700" />}
              label="Rate on App Store"
              onPress={handleRateApp}
            />
            <View style={styles.divider} />
            <SettingItem
              icon={<Share2 size={20} color="#8B7AC7" />}
              label="Share App"
              onPress={handleShareApp}
            />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <SettingItem
              icon={<Shield size={20} color="#8B7AC7" />}
              label="Privacy Policy"
              onPress={handleOpenPrivacyPolicy}
            />
            <View style={styles.divider} />
            <SettingItem
              icon={<FileText size={20} color="#8B7AC7" />}
              label="Terms of Service"
              onPress={handleOpenTerms}
            />
          </View>
        </View>

        {/* Developer Info (only in dev mode) */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer</Text>
            <View style={styles.card}>
              <SettingItem
                icon={<Info size={20} color="#666" />}
                label="Environment"
                value={config.appEnvironment}
                showChevron={false}
              />
              <View style={styles.divider} />
              <SettingItem
                icon={<Info size={20} color="#666" />}
                label="Analytics"
                value={config.enableAnalytics ? 'Enabled' : 'Disabled'}
                showChevron={false}
              />
              <View style={styles.divider} />
              <SettingItem
                icon={<Info size={20} color="#666" />}
                label="Crashlytics"
                value={config.enableCrashlytics ? 'Enabled' : 'Disabled'}
                showChevron={false}
              />
            </View>
          </View>
        )}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#C75B6E' }]}>Danger Zone</Text>
          <View style={styles.card}>
            <SettingItem
              icon={<Trash2 size={20} color="#C75B6E" />}
              label="Clear All Data"
              onPress={handleClearData}
              isDestructive
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for productivity</Text>
          <Text style={styles.footerText}>© 2025 Daily Planner Delight</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  appEnvironment: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B7AC7',
    backgroundColor: '#8B7AC720',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 64,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
