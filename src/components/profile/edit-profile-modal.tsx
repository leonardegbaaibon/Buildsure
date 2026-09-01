import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import { BackButton } from '../auth/back-button';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';
import { getUserPhone, setUserName } from '@/utils/user-store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUserProfile, updateProfileAvatar, fetchUserProfile } from '@/store/slices/auth-slice';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function EditProfileModal({ visible, onClose, onUpdate }: EditProfileModalProps) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.auth.profile);
  const isUpdatingProfile = useAppSelector((state) => state.auth.isUpdatingProfile);

  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [middleName, setMiddleName] = useState(profile?.middleName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || getUserPhone() || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const email = profile?.email || 'User Email';

  React.useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setMiddleName(profile.middleName || '');
      setLastName(profile.lastName || '');
      setPhoneNumber(profile.phoneNumber || getUserPhone() || '');
    }
  }, [profile]);

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        CustomAlert.alert('Permission Required', 'Please allow access to your photos to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploadingPhoto(true);
        try {
          await dispatch(
            updateProfileAvatar({
              uri: asset.uri,
              name: asset.fileName || 'profile_picture.jpg',
              type: asset.mimeType || 'image/jpeg',
            })
          ).unwrap();
          dispatch(fetchUserProfile());
          CustomAlert.alert('Success', 'Profile picture updated successfully.');
        } catch (err: any) {
          CustomAlert.alert('Upload Failed', err?.message || 'Could not update profile picture.');
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    } catch (err: any) {
      console.warn('Error picking image:', err);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      CustomAlert.alert('Validation Error', 'First Name and Last Name are required.');
      return;
    }

    try {
      await dispatch(
        updateUserProfile({
          firstName: firstName.trim(),
          middleName: middleName.trim() ? middleName.trim() : null,
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
        })
      ).unwrap();

      const middlePart = middleName.trim() ? ` ${middleName.trim()}` : '';
      const newFullName = `${firstName.trim()}${middlePart} ${lastName.trim()}`;
      setUserName(newFullName);

      if (onUpdate) onUpdate();
      CustomAlert.alert('Success', 'Profile updated successfully.');
      onClose();
    } catch (err: any) {
      CustomAlert.alert('Update Failed', err?.message || 'Could not update profile. Please try again.');
    }
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <AppScreen edges={['top', 'bottom', 'left', 'right']}>
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
              <TouchableOpacity
                style={styles.avatarContainer}
                activeOpacity={0.8}
                onPress={handlePickAvatar}
                disabled={isUploadingPhoto}
              >
                {profile?.profilePicture && profile.profilePicture.startsWith('http') ? (
                  <Image
                    source={{ uri: profile.profilePicture }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require('../../../assets/images/user_avatar.png')}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.cameraOverlay}>
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <SymbolView
                      name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                      size={14}
                      tintColor="#FFFFFF"
                    />
                  )}
                </View>
              </TouchableOpacity>
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
                  placeholder="Enter middle name (optional)"
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

              {/* Email (Read only with Lock icon) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.readOnlyContainer}>
                  <TextInput
                    style={styles.readOnlyInput}
                    value={email}
                    editable={false}
                    placeholderTextColor="#A0A5B0"
                  />
                  <SymbolView
                    name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    size={16}
                    tintColor="#8A8D93"
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number (+234...)"
                  placeholderTextColor="#A0A5B0"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Save Changes button */}
            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </AppScreen>
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
    backgroundColor: '#F5F2EC',
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
