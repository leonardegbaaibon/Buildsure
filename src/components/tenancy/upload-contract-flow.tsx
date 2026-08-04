import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as DocumentPicker from 'expo-document-picker';
import { BackButton } from '../auth/back-button';

interface UploadContractFlowProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function UploadContractFlow({ visible, onClose, onComplete }: UploadContractFlowProps) {
  const [step, setStep] = useState(1); // 1 = empty, 2 = file picked, 3 = success
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Format size to human readable (KB / MB)
        const sizeInKb = Math.round(selectedAsset.size ? selectedAsset.size / 1024 : 100);
        const formattedSize = sizeInKb > 1024
          ? `${(sizeInKb / 1024).toFixed(1)}MB`
          : `${sizeInKb}KB`;

        setUploadedFile({
          name: selectedAsset.name,
          size: formattedSize,
        });
        setStep(2);
      }
    } catch (err) {
      console.log('Error picking document:', err);
      Alert.alert('Error', 'An error occurred while selecting the file.');
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setStep(1);
  };

  const handleUpload = () => {
    if (step === 2) {
      setStep(3);
    }
  };

  const handleGeneratePaymentReference = () => {
    Alert.alert(
      'Payment Reference Generated',
      'Reference: WH-2024-B1-PAY has been generated. You can now proceed to bank transfer/payment.',
      [
        {
          text: 'OK',
          onPress: () => {
            onClose();
            if (onComplete) onComplete();
          },
        },
      ]
    );
  };

  const handleBackToDashboard = () => {
    onClose();
    if (onComplete) onComplete();
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {step < 3 ? (
          <View style={styles.flowContent}>
            {/* Top Row: Back button */}
            <View style={styles.header}>
              <BackButton onPress={onClose} />
            </View>

            {/* Progress bar */}
            <View style={styles.progressRow}>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarActive} />
              </View>
              <Text style={styles.progressText}>Final Step!</Text>
            </View>

            {/* Headers */}
            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Upload Signed Contract</Text>
              <Text style={styles.subtitle}>
                Property: <Text style={styles.boldSubtitleText}>Apo Wumba Homes</Text> | Unit:{' '}
                <Text style={styles.boldSubtitleText}>B1</Text>
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Dashed file drop area */}
              <TouchableOpacity
                style={styles.dashedBox}
                activeOpacity={0.7}
                onPress={handleFileSelect}
                disabled={step === 2}
              >
                <Image
                  source={require('../../../assets/images/upload_folder_illustration.png')}
                  style={styles.folderImage}
                  resizeMode="contain"
                />
                <Text style={styles.dashedTitle}>Click to browse</Text>
                <Text style={styles.dashedSubtitle}>Support PDF, PNG or JPG (Max. 5MB)</Text>
              </TouchableOpacity>

              {/* Instructions notice box */}
              <View style={styles.infoBox}>
                <SymbolView
                  name={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
                  size={16}
                  tintColor="#D87C24"
                />
                <Text style={styles.infoText}>
                  Please ensure all pages of the contract are clearly visible and the signatures are legible
                  before uploading.
                </Text>
              </View>

              {/* Uploaded File status block (Step 2 only) */}
              {step === 2 && uploadedFile && (
                <View style={styles.uploadedDocumentSection}>
                  <Text style={styles.uploadedSectionHeader}>Uploaded Document</Text>
                  <View style={styles.fileCard}>
                    <View style={styles.fileCardLeft}>
                      <SymbolView
                        name={{ ios: 'doc.text.fill', android: 'picture_as_pdf', web: 'picture_as_pdf' }}
                        size={24}
                        tintColor="#D87C24"
                      />
                      <View style={styles.fileDetails}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {uploadedFile.name}
                        </Text>
                        <Text style={styles.fileSize}>{uploadedFile.size}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                      onPress={handleRemoveFile}
                    >
                      <SymbolView
                        name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
                        size={16}
                        tintColor="#F04438"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bottom action row */}
            <View style={styles.bottomActionsRow}>
              <BackButton onPress={onClose} />
              
              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  step === 1 && styles.uploadBtnDisabled,
                ]}
                activeOpacity={0.8}
                onPress={handleUpload}
                disabled={step === 1}
              >
                <SymbolView
                  name={{ ios: 'arrow.up.doc.fill', android: 'upload', web: 'upload' }}
                  size={16}
                  tintColor={step === 1 ? '#B2C4D2' : '#FFFFFF'}
                />
                <Text style={[styles.uploadBtnText, step === 1 && styles.uploadBtnTextDisabled]}>
                  Upload Contract
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Step 3: Success Screen */
          <View style={styles.successContent}>
            {/* Seal checkmark illustration */}
            <View style={styles.sealWrapper}>
              <View style={styles.sealOuter}>
                <View style={styles.sealInner}>
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={40}
                    tintColor="#FFFFFF"
                    weight="bold"
                  />
                </View>
              </View>
            </View>

            {/* Title & description */}
            <View style={styles.successTitleWrapper}>
              <Text style={styles.successTitle}>Contract Uploaded Successfully!</Text>
              <Text style={styles.successSubtitle}>
                The tenancy process for{' '}
                <Text style={styles.boldSuccessText}>Apo Wumba Homes, Unit B1</Text> is now complete.
                You may proceed to payment!
              </Text>
            </View>

            {/* Property Reference Card */}
            <View style={styles.referenceCard}>
              <View style={styles.referenceHeaderRow}>
                <Text style={styles.referenceLabel}>PROPERTY REFERENCE</Text>
                <Text style={styles.referenceValue}>WH-2024-B1</Text>
              </View>
              
              <View style={styles.successDivider} />

              <View style={styles.paymentInfoRow}>
                <View style={styles.referenceIconContainer}>
                  <SymbolView
                    name={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
                    size={18}
                    tintColor="#D87C24"
                  />
                </View>
                <View style={styles.paymentInfoTextContainer}>
                  <Text style={styles.paymentInfoTitle}>Next Step: Payment</Text>
                  <Text style={styles.paymentInfoDesc}>
                    Please generate your unique reference to proceed with the security deposit and rent payment
                  </Text>
                </View>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.successActionsContainer}>
              <TouchableOpacity
                style={styles.generateBtn}
                activeOpacity={0.8}
                onPress={handleGeneratePaymentReference}
              >
                <Text style={styles.generateBtnText}>Generate Payment Reference ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backDashboardBtn}
                activeOpacity={0.7}
                onPress={handleBackToDashboard}
              >
                <Text style={styles.backDashboardBtnText}>← Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  flowContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    marginTop: 12,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF3E0',
    overflow: 'hidden',
  },
  progressBarActive: {
    width: '85%',
    height: '100%',
    backgroundColor: '#FFA726',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#D87C24',
    fontWeight: '700',
  },
  titleWrapper: {
    gap: 6,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  subtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  boldSubtitleText: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#1A1C1E',
  },
  scrollContent: {
    flexGrow: 1,
  },
  dashedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FFE3C6',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    marginBottom: 20,
  },
  folderImage: {
    width: 110,
    height: 110,
    marginBottom: 16,
  },
  dashedTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 6,
  },
  dashedSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE3C6',
  },
  infoText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    flex: 1,
    lineHeight: 18,
  },
  uploadedDocumentSection: {
    gap: 10,
    marginBottom: 20,
  },
  uploadedSectionHeader: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
  },
  fileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#FFE3C6',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  fileCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  fileDetails: {
    gap: 2,
    flex: 1,
  },
  fileName: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '600',
  },
  fileSize: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FEF3F2',
    borderColor: '#FEE4E2',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  uploadBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFA726',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  uploadBtnDisabled: {
    backgroundColor: '#FFE0B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadBtnText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadBtnTextDisabled: {
    color: '#B2C4D2',
  },

  /* Success Page Styles */
  successContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  sealWrapper: {
    marginBottom: 28,
  },
  sealOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFE0B2',
  },
  sealInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitleWrapper: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  successTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'center',
  },
  successSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  boldSuccessText: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#1A1C1E',
  },
  referenceCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 36,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  referenceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referenceLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#8A8D93',
    fontWeight: '500',
  },
  referenceValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#D87C24',
    fontWeight: '700',
  },
  successDivider: {
    height: 1,
    backgroundColor: '#FFE3C6',
    marginVertical: 14,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  referenceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfoTextContainer: {
    flex: 1,
    gap: 4,
  },
  paymentInfoTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '600',
  },
  paymentInfoDesc: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 18,
  },
  successActionsContainer: {
    width: '100%',
    gap: 16,
  },
  generateBtn: {
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
  generateBtnText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  backDashboardBtn: {
    height: 52,
    borderColor: '#FFA726',
    borderWidth: 1.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backDashboardBtnText: {
    fontFamily: 'Satoshi-Bold',
    color: '#D87C24',
    fontSize: 15,
    fontWeight: '700',
  },
});
