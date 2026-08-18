import React from 'react';
import { StyleSheet, View, Text, TextInput, Animated } from 'react-native';

export interface StepResidentProps {
  progressBarWidth: any;
  currentPageNumber: number;
  totalPages: number;
  firstName: string;
  lastName: string;
  residentEmail: string;
  residentPhone: string;
  emailError?: string | null;
  phoneError?: string | null;
  onChangeFirstName: (text: string) => void;
  onChangeLastName: (text: string) => void;
  onChangeEmail: (text: string) => void;
  onBlurEmail: () => void;
  onChangePhone: (text: string) => void;
  onBlurPhone: () => void;
}

export function StepResident({
  progressBarWidth,
  currentPageNumber,
  totalPages,
  firstName,
  lastName,
  residentEmail,
  residentPhone,
  emailError,
  phoneError,
  onChangeFirstName,
  onChangeLastName,
  onChangeEmail,
  onBlurEmail,
  onChangePhone,
  onBlurPhone,
}: StepResidentProps) {
  return (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>
          Page {currentPageNumber} of {totalPages}
        </Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionMainTitle}>Tenant Profile</Text>
        <Text style={styles.sectionSubtitle}>Enter the tenant details to proceed</Text>
      </View>

      {/* First Name & Last Name row */}
      <View style={styles.nameRow}>
        <View style={styles.nameCol}>
          <Text style={styles.fieldLabel}>First name</Text>
          <TextInput
            style={styles.datePickerInputFull}
            placeholder="Enter first name"
            placeholderTextColor="#8A8D93"
            value={firstName}
            onChangeText={onChangeFirstName}
          />
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.fieldLabel}>Last name</Text>
          <TextInput
            style={styles.datePickerInputFull}
            placeholder="Enter last name"
            placeholderTextColor="#8A8D93"
            value={lastName}
            onChangeText={onChangeLastName}
          />
        </View>
      </View>

      {/* Email Address */}
      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Email Address</Text>
        <TextInput
          style={[styles.datePickerInputFull, emailError ? styles.inputErrorBorder : null]}
          placeholder="Enter Email address"
          placeholderTextColor="#8A8D93"
          keyboardType="email-address"
          autoCapitalize="none"
          value={residentEmail}
          onChangeText={onChangeEmail}
          onBlur={onBlurEmail}
        />
        {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
      </View>

      {/* Phone Number with Nigerian Flag Badge */}
      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Phone Number</Text>
        <View style={styles.phoneInputRow}>
          <View style={styles.phoneCountryBox}>
            <View style={styles.flagCircle}>
              <View style={styles.flagGreen} />
              <View style={styles.flagWhite} />
              <View style={styles.flagGreen} />
            </View>
            <Text style={styles.phoneCodeText}>+234</Text>
          </View>
          <TextInput
            style={[styles.phoneInputFlex, phoneError ? styles.inputErrorBorder : null]}
            placeholder="Enter Phone Number"
            placeholderTextColor="#8A8D93"
            keyboardType="phone-pad"
            value={residentPhone}
            onChangeText={onChangePhone}
            onBlur={onBlurPhone}
          />
        </View>
        {phoneError ? <Text style={styles.fieldErrorText}>{phoneError}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#EBE6DC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFA726',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#8A8D93',
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionMainTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameCol: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 8,
  },
  formGroupSpacing: {
    marginBottom: 16,
  },
  datePickerInputFull: {
    height: 48,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  fieldErrorText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phoneCountryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  flagCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  flagGreen: {
    flex: 1,
    backgroundColor: '#008751',
  },
  flagWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  phoneCodeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
  },
  phoneInputFlex: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
  },
});
