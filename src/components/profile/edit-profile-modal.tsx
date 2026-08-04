import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BackButton } from '../auth/back-button';
import { getUserName, getUserPhone, setUserName } from '@/utils/user-store';
import { useAppSelector } from '@/store/hooks';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditProfileModal({ visible, onClose, onUpdate }: EditProfileModalProps) {
  const profile = useAppSelector((state) => state.auth.profile);

  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [middleName, setMiddleName] = useState(profile?.middleName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const email = profile?.email || 'User Email';
  const phoneNumber = profile?.phoneNumber || getUserPhone() || 'Phone Number';

  React.useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setMiddleName(profile.middleName || '');
      setLastName(profile.lastName || '');
    }
  }, [profile]);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'First Name and Last Name are required.');
      return;
    }
    const middlePart = middleName.trim() ? ` ${middleName.trim()}` : '';
    const newFullName = `${firstName.trim()}${middlePart} ${lastName.trim()}`;
    setUserName(newFullName);
    onUpdate();
    Alert.alert('Success', 'Profile updated successfully.');
    onClose();
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <BackButton onPress={onClose} />
            </View>

            {/* Title & Avatar */}
            <View style={styles.titleRow}>
              <Text style={styles.title}>Edit your profile</Text>
              
              {/* Profile Avatar with Camera Icon Overlay */}
              <View style={styles.avatarContainer}>
                <Image
                  source={require('../../../assets/images/user_avatar.png')}
                  style={styles.avatarImage}
                />
                <TouchableOpacity style={styles.cameraOverlay} activeOpacity={0.8}>
                  <SymbolView
                    name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                    size={12}
                    tintColor="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {/* First Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor="#A0A5B0"
                />
              </View>

              {/* Middle Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Middle Name</Text>
                <TextInput
                  style={styles.input}
                  value={middleName}
                  onChangeText={setMiddleName}
                  placeholder="Enter middle name"
                  placeholderTextColor="#A0A5B0"
                />
              </View>

              {/* Last Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  placeholderTextColor="#A0A5B0"
                />
              </View>

              {/* Email (Read Only with Padlock) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.readOnlyContainer}>
                  <TextInput
                    style={styles.readOnlyInput}
                    value={email}
                    editable={false}
                  />
                  <SymbolView
                    name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    size={16}
                    tintColor="#8A8D93"
                  />
                </View>
              </View>

              {/* Phone Number (Read Only with Padlock) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.readOnlyContainer}>
                  <TextInput
                    style={styles.readOnlyInput}
                    value={phoneNumber}
                    editable={false}
                  />
                  <SymbolView
                    name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    size={16}
                    tintColor="#8A8D93"
                  />
                </View>
              </View>
            </View>

            {/* Save Changes button */}
            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.8}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 12,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  avatarContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: '#EBE6DC',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D87C24',
    borderWidth: 2,
    borderColor: '#FEFAF4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  input: {
    fontFamily: 'Satoshi-Regular',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    color: '#1A1C1E',
    fontSize: 14,
  },
  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#F5F2EC', // Slightly grayed out cream background
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  readOnlyInput: {
    fontFamily: 'Satoshi-Regular',
    flex: 1,
    color: '#8A8D93',
    fontSize: 14,
    height: '100%',
  },
  saveBtn: {
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
    letterSpacing: 0.5,
  },
});
