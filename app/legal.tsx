import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { logAnalyticsEvent } from '@/lib/firebase';

// Legal content is generated dynamically below
// In a production app, you might want to fetch this from a server
// or use a markdown parser library like react-native-markdown-display

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const type = (params.type as string) || 'privacy';

  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [type]);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would:
      // 1. Fetch from a server: fetch(`https://yoursite.com/${type}.md`)
      // 2. Or use a markdown parser to render the imported content
      // For now, we'll show a placeholder that tells users to view on web

      logAnalyticsEvent(`${type}_policy_viewed`);

      // Simulated delay
      setTimeout(() => {
        setContent(getPlaceholderContent(type));
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load legal content:', error);
      setContent('Failed to load content. Please try again.');
      setIsLoading(false);
    }
  };

  const getPlaceholderContent = (docType: string) => {
    const title = docType === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
    const url =
      docType === 'privacy'
        ? 'https://dailyplannerdelight.app/privacy'
        : 'https://dailyplannerdelight.app/terms';

    return `
${title}

Thank you for using Daily Planner Delight!

Our full ${title.toLowerCase()} is available on our website for easy reading:

${url}

Key Points:

${docType === 'privacy' ? getPrivacyKeyPoints() : getTermsKeyPoints()}

For the complete document with all details, please visit our website.

Last Updated: January 2025

Contact Us:
If you have any questions about our ${title.toLowerCase()}, please email us at:
support@dailyplannerdelight.app
    `.trim();
  };

  const getPrivacyKeyPoints = () => `
• We collect minimal data needed to provide our service
• Your task data is stored securely in Firebase
• We use Firebase Analytics for app improvement
• We never sell your personal data to third parties
• You can delete your account and data at any time
• We comply with GDPR and CCPA regulations
• Third-party services: Firebase (Google), RevenueCat, Apple
  `;

  const getTermsKeyPoints = () => `
• Daily Planner Delight is provided "as is"
• Free tier: 3 tasks per day
• Premium subscriptions: Monthly ($4.99), Yearly ($39.99), Lifetime ($99.99)
• Subscriptions auto-renew unless canceled
• You retain all rights to your data
• We may modify the service with notice
• You must be 13+ years old to use the app
  `;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
        </Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B7AC7" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <View style={styles.documentContainer}>
            <Text style={styles.documentText}>{content}</Text>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
  },
  documentContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  documentText: {
    fontSize: 15,
    color: '#CCC',
    lineHeight: 24,
    fontFamily: 'System',
  },
});
