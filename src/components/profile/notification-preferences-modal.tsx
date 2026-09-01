import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BackButton } from '../auth/back-button';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  updateNotificationPreferences,
  updateEmailNotifications,
} from '@/store/slices/auth-slice';

interface NotificationPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationPreferencesModal({
  visible,
  onClose,
}: NotificationPreferencesModalProps) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.auth.profile);

  const [emailEnabled, setEmailEnabled] = useState(profile?.emailNotificationsEnabled ?? true);
  const [loginAlertsEmail, setLoginAlertsEmail] = useState(
    profile?.notificationPreferences?.loginAlertsEmail ?? true
  );
  const [propertyAlertsEmail, setPropertyAlertsEmail] = useState(
    profile?.notificationPreferences?.propertyAlertsEmail ?? true
  );
  const [propertyAlertsPush, setPropertyAlertsPush] = useState(
    profile?.notificationPreferences?.propertyAlertsPush ?? true
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEmailEnabled(profile.emailNotificationsEnabled ?? true);
      setLoginAlertsEmail(profile.notificationPreferences?.loginAlertsEmail ?? true);
      setPropertyAlertsEmail(profile.notificationPreferences?.propertyAlertsEmail ?? true);
      setPropertyAlertsPush(profile.notificationPreferences?.propertyAlertsPush ?? true);
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        dispatch(updateEmailNotifications(emailEnabled)).unwrap(),
        dispatch(
          updateNotificationPreferences({
            loginAlertsEmail,
            propertyAlertsEmail,
            propertyAlertsPush,
          })
        ).unwrap(),
      ]);
      CustomAlert.alert('Success', 'Notification preferences saved successfully.');
      onClose();
    } catch (err: any) {
      CustomAlert.alert('Error', err?.message || 'Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <AppScreen edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={onClose} />
          </View>

          {/* Title */}
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>Notification Preferences</Text>
            <Text style={styles.subtitle}>
              Customize how and when you receive important updates regarding your portfolio.
            </Text>
          </View>

          {/* Group 1: General Email Notifications */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.textCol}>
                <Text style={styles.rowTitle}>Email Notifications</Text>
                <Text style={styles.rowDesc}>Receive summary and report digests via email.</Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: '#D0D5DD', true: '#FFA726' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Group 2: Alert Categories */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.textCol}>
                <Text style={styles.rowTitle}>Login Email Alerts</Text>
                <Text style={styles.rowDesc}>Get alerted on account logins and security events.</Text>
              </View>
              <Switch
                value={loginAlertsEmail}
                onValueChange={setLoginAlertsEmail}
                trackColor={{ false: '#D0D5DD', true: '#FFA726' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.textCol}>
                <Text style={styles.rowTitle}>Property Email Alerts</Text>
                <Text style={styles.rowDesc}>Receive email notifications about tenant activities and payments.</Text>
              </View>
              <Switch
                value={propertyAlertsEmail}
                onValueChange={setPropertyAlertsEmail}
                trackColor={{ false: '#D0D5DD', true: '#FFA726' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.textCol}>
                <Text style={styles.rowTitle}>Property Push Notifications</Text>
                <Text style={styles.rowDesc}>Instant push notifications on your mobile device.</Text>
              </View>
              <Switch
                value={propertyAlertsPush}
                onValueChange={setPropertyAlertsPush}
                trackColor={{ false: '#D0D5DD', true: '#FFA726' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Preferences</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </AppScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 12,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleWrapper: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  textCol: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 2,
  },
  rowDesc: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EDE6',
    marginVertical: 14,
  },
  saveBtn: {
    marginTop: 16,
    height: 52,
    backgroundColor: '#FFA726',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
