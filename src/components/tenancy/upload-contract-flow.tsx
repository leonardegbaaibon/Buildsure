import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  uploadSignedContract,
  fetchTenancyBreakdown,
  createTenancyPayment,
  simulateTenancyPayment,
  fetchTenancyById,
  TenancyBreakdown,
} from '@/store/slices/tenancy-slice';
import { BackButton } from '../auth/back-button';
import { DocumentPreviewCard } from '../documents/document-preview-card';
import { downloadDocumentAsPdf } from '@/utils/pdf-download-service';

interface UploadContractFlowProps {
  visible: boolean;
  tenancyId?: string;
  propertyTitle?: string;
  unitName?: string;
  onClose: () => void;
  onComplete?: () => void;
}

export default function UploadContractFlow({
  visible,
  tenancyId,
  propertyTitle,
  unitName,
  onClose,
  onComplete,
}: UploadContractFlowProps) {
  const dispatch = useAppDispatch();
  const reduxProperties = useAppSelector((state) => state.properties.properties);
  const currentTenancy = useAppSelector((state) => state.tenancy.currentTenancy);

  const fallbackPropertyTitle =
    propertyTitle && propertyTitle !== 'Apo Wumba Homes'
      ? propertyTitle
      : (currentTenancy as any)?.propertyName ||
        (currentTenancy as any)?.propertyTitle ||
        (currentTenancy as any)?.property?.propertyName ||
        (currentTenancy as any)?.property?.title ||
        (currentTenancy as any)?.property?.name ||
        (reduxProperties.length > 0 ? (reduxProperties[0] as any).propertyName || (reduxProperties[0] as any).title : 'Property');

  const fallbackUnitName =
    unitName && unitName !== 'Unit B1' && unitName !== 'Unit A'
      ? unitName
      : (currentTenancy as any)?.unitIdentifier ||
        (currentTenancy as any)?.unit?.unitIdentifier ||
        (currentTenancy as any)?.unit?.name ||
        ((reduxProperties.length > 0 && (reduxProperties[0] as any).units?.length > 0)
          ? (reduxProperties[0] as any).units[0].unitIdentifier || 'Unit 1'
          : 'Unit 1');

  // Step 1: Upload Signed Contract (Empty or File Picked)
  // Step 2: Contract Uploaded Successfully!
  // Step 3: Generate Payment Invoice (Direction selection: wallet vs direct_bank)
  // Step 4: Invoice Preview
  // Step 5: Payment Reference Generated (Save PDF / Share with Tenant)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size: string;
    type?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<TenancyBreakdown | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'wallet' | 'direct_bank'>('wallet');
  const [paymentData, setPaymentData] = useState<{
    reference: string;
    authorizationUrl: string;
    amount: number;
    direction: string;
  } | null>(null);

  const [dynamicPropertyTitle, setDynamicPropertyTitle] = useState(fallbackPropertyTitle);
  const [dynamicUnitName, setDynamicUnitName] = useState(fallbackUnitName);
  const [dynamicTenantName, setDynamicTenantName] = useState('Tenant');

  // Fetch live tenancy data if tenancyId is provided
  React.useEffect(() => {
    if (visible) {
      if (tenancyId && tenancyId !== 'tenancy_demo_id') {
        dispatch(fetchTenancyById(tenancyId))
          .unwrap()
          .then((data: any) => {
            if (data) {
              const propTitle =
                data.propertyName ||
                data.propertyTitle ||
                data.property?.propertyName ||
                data.property?.title ||
                data.property?.name ||
                fallbackPropertyTitle;
              const rawUnit =
                data.unitIdentifier ||
                data.unitName ||
                data.unit?.unitIdentifier ||
                data.unit?.name ||
                fallbackUnitName;
              const unit = rawUnit.startsWith('Unit ') ? rawUnit : `Unit ${rawUnit}`;
              const tenant =
                data.tenantFirstName
                  ? `${data.tenantFirstName} ${data.tenantLastName || ''}`.trim()
                  : data.tenant?.name || data.tenantName || 'Tenant';

              setDynamicPropertyTitle(propTitle);
              setDynamicUnitName(unit);
              setDynamicTenantName(tenant);
            }
          })
          .catch(() => {
            dispatch(fetchTenancyBreakdown(tenancyId))
              .unwrap()
              .then((bd: any) => {
                if (bd) {
                  if (bd.propertyName) setDynamicPropertyTitle(bd.propertyName);
                  if (bd.unitIdentifier) {
                    const u = bd.unitIdentifier.startsWith('Unit ') ? bd.unitIdentifier : `Unit ${bd.unitIdentifier}`;
                    setDynamicUnitName(u);
                  }
                }
              })
              .catch(() => {});
          });
      } else {
        setDynamicPropertyTitle(fallbackPropertyTitle);
        setDynamicUnitName(fallbackUnitName.startsWith('Unit ') ? fallbackUnitName : `Unit ${fallbackUnitName}`);
      }
    }
  }, [visible, tenancyId, fallbackPropertyTitle, fallbackUnitName, dispatch]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let safeUri = asset.uri;
        try {
          if (asset.uri && FileSystemLegacy.cacheDirectory) {
            const cleanName = `${Date.now()}_${(asset.name || 'signed_contract.pdf').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const destUri = `${FileSystemLegacy.cacheDirectory}${cleanName}`;
            await FileSystemLegacy.copyAsync({ from: asset.uri, to: destUri });
            safeUri = destUri;
          }
        } catch (copyErr) {
          console.warn('[Safe contract copy error]', copyErr);
          safeUri = asset.uri;
        }

        const sizeInKb = Math.round(asset.size ? asset.size / 1024 : 100);
        const formattedSize =
          sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)}MB` : `${sizeInKb}KB`;

        setSelectedFile({
          uri: safeUri,
          name: asset.name,
          size: formattedSize,
          type: asset.mimeType || 'application/pdf',
        });
      }
    } catch (err) {
      console.log('Error selecting document:', err);
      CustomAlert.alert('Error', 'An error occurred while selecting the file.');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        CustomAlert.alert('Permission Required', 'Please allow access to your photo library to select contract images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `Signed_Contract_${Date.now()}.jpg`;
        let safeUri = asset.uri;
        try {
          if (asset.uri && FileSystemLegacy.cacheDirectory) {
            const cleanName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const destUri = `${FileSystemLegacy.cacheDirectory}${cleanName}`;
            await FileSystemLegacy.copyAsync({ from: asset.uri, to: destUri });
            safeUri = destUri;
          }
        } catch (copyErr) {
          console.warn('[Safe contract image copy error]', copyErr);
          safeUri = asset.uri;
        }

        const sizeInKb = Math.round(asset.fileSize ? asset.fileSize / 1024 : 180);
        const formattedSize =
          sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)}MB` : `${sizeInKb}KB`;

        setSelectedFile({
          uri: safeUri,
          name: fileName,
          size: formattedSize,
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (err) {
      console.log('Error selecting image:', err);
    }
  };

  const handleFileSelect = () => {
    CustomAlert.alert('Upload Signed Contract', 'Select document source:', [
      { text: 'Choose from Files (PDF)', onPress: pickDocument },
      { text: 'Choose from Photos (Image)', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  // Step 1 -> Step 2: Upload signed contract
  const handleUploadContract = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      if (tenancyId && tenancyId !== 'tenancy_demo_id') {
        await dispatch(
          uploadSignedContract({
            tenancyId,
            file: {
              uri: selectedFile.uri,
              name: selectedFile.name,
              type: selectedFile.type || 'application/pdf',
            },
          })
        ).unwrap();
      }
      setIsLoading(false);
      setCurrentStep(2);
    } catch (err: any) {
      setIsLoading(false);
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.message ||
            'Failed to upload signed contract. Please check your connection and try again.';
      CustomAlert.alert('Upload Failed', errMsg);
    }
  };

  // Step 2 -> Step 3: Fetch Breakdown (Invoice) & Show Direction Chooser
  const handleProceedToPaymentInvoice = async () => {
    setIsLoading(true);
    try {
      if (tenancyId && tenancyId !== 'tenancy_demo_id') {
        const res = await dispatch(fetchTenancyBreakdown(tenancyId)).unwrap();
        setBreakdown(res);
      }
      setIsLoading(false);
      setCurrentStep(3);
    } catch (err: any) {
      setIsLoading(false);
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.message ||
            'Failed to retrieve invoice breakdown. Please check your connection and try again.';
      CustomAlert.alert('Breakdown Error', errMsg);
    }
  };

  // Step 3 -> Step 4: Show Invoice Preview (Pure calculation from breakdown)
  const handleProceedToInvoicePreview = async () => {
    setIsLoading(true);
    try {
      let activeBreakdown = breakdown;
      if (!activeBreakdown && tenancyId && tenancyId !== 'tenancy_demo_id') {
        activeBreakdown = await dispatch(fetchTenancyBreakdown(tenancyId)).unwrap();
        setBreakdown(activeBreakdown);
      }

      const totalPayable = Number(
        activeBreakdown?.breakdown?.totalPayable ||
        activeBreakdown?.amountDue ||
        activeBreakdown?.totalAmount ||
        1412000
      );

      setPaymentData({
        reference: `BS-${(tenancyId || 'INV').slice(0, 8).toUpperCase()}`,
        authorizationUrl: 'https://checkout.paystack.com',
        amount: totalPayable,
        direction: selectedDirection,
      });

      setIsLoading(false);
      setCurrentStep(4);
    } catch (err: any) {
      setIsLoading(false);
      setCurrentStep(4);
    }
  };

  // Step 4 -> Step 5: Settle / Simulate Payment and Show Success / Reference
  const handleFinishPreview = async () => {
    setIsLoading(true);
    try {
      if (tenancyId && tenancyId !== 'tenancy_demo_id') {
        const res = await dispatch(
          simulateTenancyPayment({
            tenancyId,
            direction: selectedDirection,
          })
        ).unwrap();

        if (res?.reference || res?.data?.reference) {
          setPaymentData((prev) => ({
            ...prev!,
            reference: res?.reference || res?.data?.reference,
          }));
        }
      }
      setIsLoading(false);
      setCurrentStep(5);
    } catch (err: any) {
      setIsLoading(false);
      // Even if simulate payment responds with existing status, proceed to reference screen
      setCurrentStep(5);
    }
  };

  // Step 5 Actions: Download PDF & Share
  const handleSavePdfCopy = async () => {
    const lineItems = breakdown?.breakdown?.lineItems || [
      { name: 'Rent', amount: Number(breakdown?.breakdown?.rent || breakdown?.rentAmount || 1200000) },
      { name: 'Caution fee', amount: Number(breakdown?.breakdown?.customFeesTotal || 200000) },
      { name: 'BuildSure admin fee (1% of rent)', amount: Number(breakdown?.breakdown?.adminFee || breakdown?.adminFee || 12000) },
    ];
    const totalAmount = paymentData?.amount || 1412000;

    await downloadDocumentAsPdf({
      filename: `Tenancy_Invoice_${paymentData?.reference || 'BS-8892-TX'}.pdf`,
      propertyTitle: dynamicPropertyTitle,
      unitName: dynamicUnitName,
      tenantName: dynamicTenantName,
      rentAmount: totalAmount,
      durationYears: 1,
      contractText: `
BUILDSURE TENANCY INVOICE & BREAKDOWN
Reference: ${paymentData?.reference || 'BS-8892-TX'}
Property: ${dynamicPropertyTitle} (${dynamicUnitName})
Tenant: ${dynamicTenantName}
Payer: ${breakdown?.payer === 'tenant' ? 'Tenant' : 'Landlord'}
Settlement Destination: ${selectedDirection === 'wallet' ? 'BuildSure Wallet' : 'Direct Bank Account'}

------------------------------------------------
ITEMIZED CHARGES:
${lineItems.map((i) => `• ${i.name}: NGN ${Number(i.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`).join('\n')}
------------------------------------------------
TOTAL DUE: NGN ${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
(Includes Admin Fee: NGN ${Number(breakdown?.breakdown?.adminFee || breakdown?.adminFee || 12000).toLocaleString('en-US', { minimumFractionDigits: 2 })})
      `,
    });
  };

  const handleShareWithTenant = async () => {
    try {
      const message = `Hello ${dynamicTenantName}! Here is your Tenancy Payment Invoice for ${dynamicPropertyTitle} (${dynamicUnitName}).
Reference ID: ${paymentData?.reference || 'BS-8892-TX'}
Total Payable: NGN ${(paymentData?.amount || 1412000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
Settlement Destination: ${selectedDirection === 'wallet' ? 'BuildSure Wallet' : 'Direct Bank Account'}`;

      await Share.share({
        message,
        title: 'Tenancy Payment Invoice',
      });
    } catch (error: any) {
      console.log('Share error:', error.message);
    }
  };

  const handleBackToDashboard = () => {
    onClose();
    if (onComplete) onComplete();
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} presentationStyle="fullScreen">
      <AppScreen edges={['top', 'bottom', 'left', 'right']}>
        {/* ========================================================================= */}
        {/* STEP 1: Upload Signed Contract (Empty / File Picked)                      */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <View style={styles.flowContent}>
            <View style={styles.header}>
              <BackButton onPress={onClose} />
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarActive, { width: '100%' }]} />
              </View>
              <Text style={styles.progressText}>Final Step!</Text>
            </View>

            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Upload Signed Contract</Text>
              <Text style={styles.subtitle}>
                Property: <Text style={styles.boldSubtitleText}>{dynamicPropertyTitle}</Text> | Unit:{' '}
                <Text style={styles.boldSubtitleText}>{dynamicUnitName}</Text>
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.dashedBox}
                activeOpacity={0.7}
                onPress={handleFileSelect}
                disabled={!!selectedFile}
              >
                <Image
                  source={require('../../../assets/images/upload_folder_illustration.png')}
                  style={styles.folderImage}
                  resizeMode="contain"
                />
                <Text style={styles.dashedTitle}>Click to browse</Text>
                <Text style={styles.dashedSubtitle}>Support PDF, PNG or JPG (Max. 5MB)</Text>
              </TouchableOpacity>

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

              {selectedFile && (
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
                          {selectedFile.name}
                        </Text>
                        <Text style={styles.fileSize}>{selectedFile.size}</Text>
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

            <View style={styles.bottomActionsRow}>
              <BackButton onPress={onClose} />

              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  !selectedFile && styles.uploadBtnDisabled,
                ]}
                activeOpacity={0.8}
                onPress={handleUploadContract}
                disabled={!selectedFile || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <SymbolView
                      name={{ ios: 'arrow.up.doc.fill', android: 'upload', web: 'upload' }}
                      size={16}
                      tintColor={!selectedFile ? '#B2C4D2' : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        styles.uploadBtnText,
                        !selectedFile && styles.uploadBtnTextDisabled,
                      ]}
                    >
                      Upload Contract
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Contract Uploaded Successfully! (Screenshot 1)                    */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <View style={styles.successContent}>
            {/* Scalloped Stamp Badge */}
            <View style={styles.sealWrapper}>
              <View style={styles.burstDot1} />
              <View style={styles.burstDot2} />
              <View style={styles.burstDot3} />
              <View style={styles.burstDot4} />
              <View style={styles.sealScallop}>
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={36}
                  tintColor="#FFFFFF"
                  weight="bold"
                />
              </View>
            </View>

            {/* Title & Description */}
            <View style={styles.successTitleWrapper}>
              <Text style={styles.successTitle}>Contract Uploaded Successfully!</Text>
              <Text style={styles.successSubtitle}>
                The tenancy process for{' '}
                <Text style={styles.boldSuccessText}>
                  {dynamicPropertyTitle}, {dynamicUnitName}
                </Text>{' '}
                is now complete. You may proceed to payment!
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
                    name={{ ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' }}
                    size={20}
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

            {/* Action Buttons */}
            <View style={styles.successActionsContainer}>
              <TouchableOpacity
                style={styles.generateBtn}
                activeOpacity={0.8}
                onPress={handleProceedToPaymentInvoice}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.generateBtnText}>Generate Payment Reference →</Text>
                )}
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

        {/* ========================================================================= */}
        {/* STEP 3: Generate Payment Invoice / Direction (Screenshot 2)               */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <View style={styles.flowContent}>
            <View style={styles.centeredHeaderRow}>
              <BackButton onPress={() => setCurrentStep(2)} />
              <Text style={styles.centeredHeaderTitle}>Complete Tenancy</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Generate Payment Invoice</Text>
              <Text style={styles.subtitle}>Where should your rent payments be directed to?</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Option 1: BuildSure Wallet */}
              <TouchableOpacity
                style={[
                  styles.directionCard,
                  selectedDirection === 'wallet' && styles.directionCardActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedDirection('wallet')}
              >
                <View style={styles.directionIconBox}>
                  <SymbolView
                    name={{ ios: 'wallet.pass.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' }}
                    size={22}
                    tintColor="#D87C24"
                  />
                </View>
                <View style={styles.directionTextCol}>
                  <Text style={styles.directionTitle}>BuildSure Wallet</Text>
                  <Text style={styles.directionDesc}>
                    Instant availability, ideal for managing property expenses and taxes.
                  </Text>
                </View>
                <View style={styles.radioBox}>
                  <SymbolView
                    name={{
                      ios: selectedDirection === 'wallet' ? 'checkmark.circle.fill' : 'circle',
                      android: selectedDirection === 'wallet' ? 'check_circle' : 'radio_button_unchecked',
                      web: selectedDirection === 'wallet' ? 'check_circle' : 'radio_button_unchecked',
                    }}
                    size={20}
                    tintColor={selectedDirection === 'wallet' ? '#D87C24' : '#D0D3D9'}
                  />
                </View>
              </TouchableOpacity>

              {/* Option 2: Direct Bank Account */}
              <TouchableOpacity
                style={[
                  styles.directionCard,
                  selectedDirection === 'direct_bank' && styles.directionCardActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedDirection('direct_bank')}
              >
                <View style={styles.directionIconBox}>
                  <SymbolView
                    name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }}
                    size={22}
                    tintColor="#D87C24"
                  />
                </View>
                <View style={styles.directionTextCol}>
                  <Text style={styles.directionTitle}>Direct Bank Account</Text>
                  <Text style={styles.directionDesc}>
                    Instant settlement. Payouts sent to your linked IBAN ending in ••••9888.
                  </Text>
                </View>
                <View style={styles.radioBox}>
                  <SymbolView
                    name={{
                      ios: selectedDirection === 'direct_bank' ? 'checkmark.circle.fill' : 'circle',
                      android: selectedDirection === 'direct_bank' ? 'check_circle' : 'radio_button_unchecked',
                      web: selectedDirection === 'direct_bank' ? 'check_circle' : 'radio_button_unchecked',
                    }}
                    size={20}
                    tintColor={selectedDirection === 'direct_bank' ? '#D87C24' : '#D0D3D9'}
                  />
                </View>
              </TouchableOpacity>

              {/* Policy Note Banner */}
              <View style={styles.infoBannerBox}>
                <SymbolView
                  name={{ ios: 'info.circle', android: 'info', web: 'info' }}
                  size={16}
                  tintColor="#8A8D93"
                />
                <Text style={styles.infoBannerText}>
                  A 1% administrative fee applies to every new tenancy created and any existing tenancy that is under{' '}
                  <Text style={styles.infoBannerBold}>1 month.</Text>
                </Text>
              </View>
            </ScrollView>

            <View style={styles.bottomSingleButtonContainer}>
              <TouchableOpacity
                style={styles.fullOrangeBtn}
                activeOpacity={0.8}
                onPress={handleProceedToInvoicePreview}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.fullOrangeBtnText}>Proceed</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: Invoice Preview (Breakdown Line Items)                            */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <View style={styles.flowContent}>
            <View style={styles.centeredHeaderRow}>
              <BackButton onPress={() => setCurrentStep(3)} />
              <Text style={styles.centeredHeaderTitle}>Complete Tenancy</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Invoice Preview</Text>
              <Text style={styles.subtitle}>Review the generated invoice before dispatch.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Document Container */}
              <View style={styles.invoicePreviewCardWrapper}>
                {(() => {
                  const lineItems = breakdown?.breakdown?.lineItems || [
                    { name: 'Rent', amount: Number(breakdown?.breakdown?.rent || breakdown?.rentAmount || 1200000) },
                    { name: 'Caution fee', amount: Number(breakdown?.breakdown?.customFeesTotal || 200000) },
                    { name: 'BuildSure admin fee (1% of rent)', amount: Number(breakdown?.breakdown?.adminFee || breakdown?.adminFee || 12000) },
                  ];
                  const totalDue = Number(
                    breakdown?.breakdown?.totalPayable ||
                    breakdown?.amountDue ||
                    paymentData?.amount ||
                    1412000
                  );
                  const payerText = breakdown?.payer === 'tenant' ? 'Tenant' : 'Landlord';
                  const adminFeeAmount = Number(breakdown?.breakdown?.adminFee || breakdown?.adminFee || 12000);

                  const invoiceBody = `
BUILDSURE INVOICE
Reference: ${paymentData?.reference || 'BS-8892-TX'}

Property: ${dynamicPropertyTitle} (${dynamicUnitName})
Tenant: ${dynamicTenantName}
Payer: ${payerText}
Settlement: ${selectedDirection === 'wallet' ? 'BuildSure Wallet' : 'Direct Bank Account'}

------------------------------------------------
ITEMIZED CHARGES:
${lineItems.map((item: any) => `• ${item.name}: NGN ${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`).join('\n')}
------------------------------------------------
TOTAL DUE: NGN ${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
(BuildSure Admin Fee: NGN ${adminFeeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  `.trim();

                  return (
                    <DocumentPreviewCard
                      filename={`Invoice_${dynamicPropertyTitle.replace(/\s+/g, '_')}.pdf`}
                      propertyTitle={dynamicPropertyTitle}
                      unitName={dynamicUnitName}
                      tenantName={dynamicTenantName}
                      rentAmount={totalDue}
                      durationYears={1}
                      contractText={invoiceBody}
                      onClose={() => setCurrentStep(3)}
                    />
                  );
                })()}
              </View>
            </ScrollView>

            <View style={styles.invoiceBottomActionRow}>
              <TouchableOpacity
                style={styles.squareDownloadBtn}
                activeOpacity={0.7}
                onPress={handleSavePdfCopy}
              >
                <SymbolView
                  name={{ ios: 'arrow.down.to.line', android: 'download', web: 'download' }}
                  size={20}
                  tintColor="#1A1C1E"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.finishBtn}
                activeOpacity={0.8}
                onPress={handleFinishPreview}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.finishBtnText}>Finish!</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: Payment Reference Generated (Screenshot 4)                        */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <View style={styles.successContent}>
            {/* Scalloped Stamp Badge */}
            <View style={styles.sealWrapper}>
              <View style={styles.burstDot1} />
              <View style={styles.burstDot2} />
              <View style={styles.burstDot3} />
              <View style={styles.burstDot4} />
              <View style={styles.sealScallop}>
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={36}
                  tintColor="#FFFFFF"
                  weight="bold"
                />
              </View>
            </View>

            {/* Title & Description */}
            <View style={styles.successTitleWrapper}>
              <Text style={styles.successTitle}>Payment Reference Generated</Text>
              <Text style={styles.successSubtitle}>
                Your tenancy setup is complete. The payment instruction document is ready to be shared with your tenant.
              </Text>
            </View>

            {/* Document Details Card */}
            <View style={styles.paymentInstructionCard}>
              <View style={styles.pdfBadgeRow}>
                <View style={styles.pdfBadge}>
                  <Text style={styles.pdfBadgeText}>PDF DOCUMENT</Text>
                </View>
                <Text style={styles.pdfSizeText}>245 KB</Text>
              </View>

              <Text style={styles.instructionDocTitle}>Tenancy Payment Instructions</Text>
              <Text style={styles.instructionSubText}>
                Includes direct rent payment link and unique reference ID:
              </Text>
              <Text style={styles.referenceHighlightCode}>
                {paymentData?.reference || 'BS-8892-TX'}
              </Text>

              <View style={styles.amountBox}>
                <View style={styles.amountWalletIconBox}>
                  <SymbolView
                    name={{ ios: 'creditcard.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' }}
                    size={18}
                    tintColor="#D87C24"
                  />
                </View>
                <View style={styles.amountTextCol}>
                  <Text style={styles.amountLabel}>Invoiced Amount to Tenant</Text>
                  <Text style={styles.amountVal}>
                    NGN{(paymentData?.amount || 1557300).toLocaleString('en-US')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.successActionsContainer}>
              <TouchableOpacity
                style={styles.savePdfBtn}
                activeOpacity={0.8}
                onPress={handleSavePdfCopy}
              >
                <SymbolView
                  name={{ ios: 'arrow.down.to.line', android: 'download', web: 'download' }}
                  size={16}
                  tintColor="#D87C24"
                />
                <Text style={styles.savePdfBtnText}>Save PDF Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareTenantBtn}
                activeOpacity={0.8}
                onPress={handleShareWithTenant}
              >
                <SymbolView
                  name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                  size={16}
                  tintColor="#FFFFFF"
                />
                <Text style={styles.shareTenantBtnText}>Share with Tenant</Text>
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
      </AppScreen>
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
  centeredHeaderRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  centeredHeaderTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#D87C24',
    fontWeight: '700',
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
    height: 4,
    backgroundColor: '#EBE6DC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: '#FFA726',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#8A8D93',
  },
  titleWrapper: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
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
  boldSubtitleText: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#1A1C1E',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  dashedBox: {
    borderWidth: 1.5,
    borderColor: '#D87C24',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#FFFDF9',
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  folderImage: {
    width: 48,
    height: 48,
    marginBottom: 10,
  },
  dashedTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#D87C24',
    fontWeight: '700',
    marginBottom: 4,
  },
  dashedSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 12,
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
  },
  uploadedDocumentSection: {
    marginTop: 4,
  },
  uploadedSectionHeader: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 10,
  },
  fileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 12,
  },
  fileCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 2,
  },
  fileSize: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
  },
  deleteBtn: {
    padding: 6,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
  },
  uploadBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFA726',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadBtnDisabled: {
    backgroundColor: '#EBE6DC',
  },
  uploadBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadBtnTextDisabled: {
    color: '#8A8D93',
  },

  // Success Seal Layout
  successContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  sealWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 24,
    position: 'relative',
    height: 100,
  },
  sealScallop: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#D87C24',
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D87C24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  burstDot1: {
    position: 'absolute',
    top: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D87C24',
  },
  burstDot2: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D87C24',
  },
  burstDot3: {
    position: 'absolute',
    left: '32%',
    top: '46%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D87C24',
  },
  burstDot4: {
    position: 'absolute',
    right: '32%',
    top: '46%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D87C24',
  },
  successTitleWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  boldSuccessText: {
    fontFamily: 'Satoshi-Bold',
    color: '#1A1C1E',
    fontWeight: '700',
  },

  // Property Reference Card (Step 2)
  referenceCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 16,
    marginBottom: 'auto',
  },
  referenceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  referenceLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: '#8A8D93',
    fontWeight: '700',
  },
  referenceValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#D87C24',
    fontWeight: '700',
  },
  successDivider: {
    height: 1,
    backgroundColor: '#FAF1E4',
    marginBottom: 12,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  referenceIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfoTextContainer: {
    flex: 1,
  },
  paymentInfoTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentInfoDesc: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
  },
  successActionsContainer: {
    gap: 12,
    marginTop: 20,
  },
  generateBtn: {
    height: 50,
    backgroundColor: '#FFA726',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backDashboardBtn: {
    height: 50,
    backgroundColor: '#FFFDF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backDashboardBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#D87C24',
  },

  // Direction Selection Cards (Step 3)
  directionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0EDE6',
    padding: 16,
    marginBottom: 14,
    gap: 14,
  },
  directionCardActive: {
    borderColor: '#FFE0B2',
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
  },
  directionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionTextCol: {
    flex: 1,
  },
  directionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 4,
  },
  directionDesc: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
  },
  radioBox: {
    paddingLeft: 4,
  },
  infoBannerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 17,
  },
  infoBannerBold: {
    fontFamily: 'Satoshi-Bold',
    color: '#1A1C1E',
    fontWeight: '700',
  },
  bottomSingleButtonContainer: {
    paddingTop: 12,
  },
  fullOrangeBtn: {
    height: 50,
    backgroundColor: '#FFA726',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullOrangeBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Invoice Preview (Step 4)
  invoicePreviewCardWrapper: {
    marginBottom: 16,
  },
  invoiceBottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
  },
  squareDownloadBtn: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFA726',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Payment Reference Details Card (Step 5)
  paymentInstructionCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 18,
    marginBottom: 'auto',
  },
  pdfBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  pdfBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pdfBadgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 10,
    color: '#D87C24',
    fontWeight: '700',
  },
  pdfSizeText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
  },
  instructionDocTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 6,
  },
  instructionSubText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
    marginBottom: 6,
  },
  referenceHighlightCode: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '800',
    color: '#9E6200',
    marginBottom: 16,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  amountWalletIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountTextCol: {
    flex: 1,
  },
  amountLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#6C757D',
    marginBottom: 2,
  },
  amountVal: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#D87C24',
    fontWeight: '700',
  },
  savePdfBtn: {
    height: 50,
    backgroundColor: '#FFFDF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  savePdfBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#D87C24',
  },
  shareTenantBtn: {
    height: 50,
    backgroundColor: '#FFA726',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareTenantBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
