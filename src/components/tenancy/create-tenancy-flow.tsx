import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';
import { AppBottomSheet } from '@/components/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProperties, fetchPropertyById } from '@/store/slices/property-slice';
import { useValidation } from '@/hooks/use-validation';
import {
  getProperties,
  subscribeProperties,
  setShouldStartAddProperty,
  setActiveTab,
  PropertyItem,
} from '@/utils/user-store';
import {
  createNewTenancy,
  createExistingTenancy,
  fetchTenancyBreakdown,
} from '@/store/slices/tenancy-slice';
import { DocumentPreviewCard } from '@/components/documents/document-preview-card';
import {
  StepType,
  StepProperty,
  StepResident,
  StepRent,
  StepUploads,
  StepConfirm,
  StepPay,
  PaymentSuccessOverlay,
  TenantSubmittedSheet,
  PropertyOption,
  UnitOption,
  UploadedFile,
} from './steps';

export interface CreateTenancyFlowProps {
  visible: boolean;
  onClose: () => void;
  isExistingTenancy?: boolean;
}

export function CreateTenancyFlow({
  visible,
  onClose,
  isExistingTenancy = false,
}: CreateTenancyFlowProps) {
  const dispatch = useAppDispatch();
  const reduxProperties = useAppSelector((state) => state.properties.properties);

  // Flow State: 'type' | 'property' | 'resident' | 'rent' | 'uploads' | 'confirm' | 'contract_preview' | 'pay'
  const [tenancyType, setTenancyType] = useState<'new' | 'existing'>('new');
  const [wizardStep, setWizardStep] = useState(0);

  // Property & Unit States
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null);
  const [propertyUnits, setPropertyUnits] = useState<UnitOption[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [isPropertySheetVisible, setIsPropertySheetVisible] = useState(false);

  // Step 2: Tenant Profile States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [residentName, setResidentName] = useState('');
  const [residentEmail, setResidentEmail] = useState('');
  const [residentPhone, setResidentPhone] = useState('');

  // Step 3: Rent & Dates States
  const [rentAmount, setRentAmount] = useState('');
  const [rentDuration, setRentDuration] = useState(1);
  const [rentStartDate, setRentStartDate] = useState('');
  const [rentEndDate, setRentEndDate] = useState('');
  const [rentDueDate, setRentDueDate] = useState('');

  // Custom Fees States
  const [showCustomFees, setShowCustomFees] = useState(false);
  const [customFeeName, setCustomFeeName] = useState('');
  const [customFeeAmount, setCustomFeeAmount] = useState('');
  const [customFeeDueDate, setCustomFeeDueDate] = useState('');
  const [isFeeSheetVisible, setIsFeeSheetVisible] = useState(false);

  // Step 4: Uploads States (Existing Tenancy only)
  const [activeDocTab, setActiveDocTab] = useState<'contract' | 'receipts'>('contract');
  const [contractFiles, setContractFiles] = useState<UploadedFile[]>([]);
  const [receiptFiles, setReceiptFiles] = useState<UploadedFile[]>([]);

  // Generated contract text from server
  const [serverContractText, setServerContractText] = useState<string | null>(null);

  // Date picker state
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | 'due' | 'feeDue' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  // Overlays and modals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showToastBanner, setShowToastBanner] = useState(false);

  // Validation
  const {
    emailError,
    phoneError,
    validateEmail,
    validatePhone,
    clearErrors,
  } = useValidation();

  // Animation
  const progressAnim = useMemo(() => new Animated.Value(0.2), []);

  // Track previous visibility so document picker on iOS doesn't reset wizard
  const prevVisibleRef = React.useRef(false);

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setTenancyType(isExistingTenancy ? 'existing' : 'new');
      setWizardStep(isExistingTenancy ? 0 : 0);
      setSelectedUnit(null);
      setFirstName('');
      setLastName('');
      setResidentName('');
      setResidentEmail('');
      setResidentPhone('');
      setRentAmount('');
      setRentDuration(1);
      setRentStartDate('');
      setRentEndDate('');
      setRentDueDate('');
      setShowCustomFees(false);
      setCustomFeeName('');
      setCustomFeeAmount('');
      setCustomFeeDueDate('');
      setContractFiles([]);
      setReceiptFiles([]);
      setServerContractText(null);
      setShowSuccessModal(false);
      setShowPaymentSuccess(false);
      setShowToastBanner(false);
      clearErrors();
      dispatch(fetchProperties());
    }
    prevVisibleRef.current = visible;
  }, [visible, isExistingTenancy]);

  // Load properties from store
  useEffect(() => {
    if (reduxProperties && reduxProperties.length > 0) {
      const mapped: PropertyOption[] = reduxProperties.map((p: any) => {
        const addressParts = [p.streetAddress, p.apartmentSuiteFloor, p.city, p.state].filter(Boolean);
        const address = addressParts.length > 0 ? addressParts.join(', ') : (p.address || '12, Close 9, His Grace Pavilion Estate, Wumba, Apo, FCT');
        const imageUrl = p.coverImage || p.imageUrl || (p.images && p.images[0]?.imageUrl) || p.documents?.find((d: any) => d.documentType === 'property_image')?.fileUrl;
        return {
          id: p.id,
          title: p.propertyName || p.title || p.streetAddress || 'Apo-Wumba Homes',
          address,
          imageUrl,
        };
      });
      setProperties(mapped);
      if (!selectedProperty && mapped.length > 0) {
        setSelectedProperty(mapped[0]);
      }
    } else {
      const local = getProperties();
      if (local.length > 0) {
        const mapped: PropertyOption[] = local.map((p: any) => ({
          id: p.id,
          title: p.title || 'Apo-Wumba Homes',
          address: p.address || '12, Close 9, His Grace Pavilion Estate, Wumba, Apo, FCT',
          imageUrl: p.imageUrl,
        }));
        setProperties(mapped);
        if (!selectedProperty && mapped.length > 0) {
          setSelectedProperty(mapped[0]);
        }
      }
    }
  }, [reduxProperties]);

  // Load units when property changes
  useEffect(() => {
    if (!selectedProperty?.id) {
      setPropertyUnits([]);
      return;
    }
    setIsLoadingUnits(true);
    dispatch(fetchPropertyById(selectedProperty.id))
      .unwrap()
      .then((fullProperty: any) => {
        setIsLoadingUnits(false);
        if (fullProperty && Array.isArray(fullProperty.units) && fullProperty.units.length > 0) {
          const mappedUnits: UnitOption[] = fullProperty.units.map((u: any) => ({
            id: u.id,
            unitIdentifier: u.unitIdentifier || `Unit ${u.id.substring(0, 4)}`,
            status: u.isOccupied ? 'occupied' : 'vacant',
          }));
          setPropertyUnits(mappedUnits);
        } else {
          setPropertyUnits([
            { id: 'u-101', unitIdentifier: 'Unit 101', status: 'vacant' },
            { id: 'u-102', unitIdentifier: 'Unit 102', status: 'occupied' },
            { id: 'u-103', unitIdentifier: 'Unit 103', status: 'vacant' },
          ]);
        }
      })
      .catch(() => {
        setIsLoadingUnits(false);
        setPropertyUnits([
          { id: 'u-101', unitIdentifier: 'Unit 101', status: 'vacant' },
          { id: 'u-102', unitIdentifier: 'Unit 102', status: 'occupied' },
        ]);
      });
  }, [selectedProperty, dispatch]);

  const isDateInPast = (dateStr: string): boolean => {
    if (!dateStr) return false;
    let d: Date;
    if (dateStr.includes('-')) {
      d = new Date(dateStr);
    } else {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else {
        d = new Date(dateStr);
      }
    }
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isPastStartDate = useMemo(() => {
    if (!rentStartDate) return false;
    return isDateInPast(rentStartDate);
  }, [rentStartDate]);

  const effectiveTenancyType = useMemo<'new' | 'existing'>(() => {
    if (rentStartDate) {
      return isPastStartDate ? 'existing' : 'new';
    }
    return isExistingTenancy ? 'existing' : tenancyType;
  }, [rentStartDate, isPastStartDate, isExistingTenancy, tenancyType]);

  // Step sequence mapping:
  // Existing: Property (1) -> Resident (2) -> Rent (3) -> Uploads (4) -> Confirm (5) -> Administration Charge Pay (6)
  // New: Property (1) -> Resident (2) -> Rent (3) -> Confirm (4) -> Contract Preview (5)
  const steps = useMemo(() => {
    if (effectiveTenancyType === 'existing') {
      return ['property', 'resident', 'rent', 'uploads', 'confirm', 'pay'];
    }
    return ['property', 'resident', 'rent', 'confirm', 'contract_preview'];
  }, [effectiveTenancyType]);

  const totalPagesForFlow = 5;
  const currentPageNumber = Math.min(wizardStep + 1, totalPagesForFlow);

  // Animate progress bar
  useEffect(() => {
    const progress = Math.min(1, Math.max(0.2, (wizardStep + 1) / totalPagesForFlow));
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [wizardStep, totalPagesForFlow]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const toApiDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return dateStr;
  };

  const selectPropertyFromSheet = (property: PropertyOption) => {
    setSelectedProperty(property);
    setSelectedUnit(null);
    setIsPropertySheetVisible(false);
  };

  const selectUnit = (unit: UnitOption) => {
    if (unit.status === 'occupied') {
      CustomAlert.alert('Unit Occupied', `Unit ${unit.unitIdentifier || unit.id} is currently occupied.`);
      return;
    }
    setSelectedUnit(unit.id === selectedUnit ? null : unit.id);
  };

  // Upload documents handlers
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        let safeUri = file.uri;
        try {
          if (file.uri && FileSystemLegacy.cacheDirectory) {
            const cleanName = `${Date.now()}_${(file.name || 'document.pdf').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const destUri = `${FileSystemLegacy.cacheDirectory}${cleanName}`;
            await FileSystemLegacy.copyAsync({ from: file.uri, to: destUri });
            safeUri = destUri;
          }
        } catch (copyErr) {
          console.warn('[Safe file copy error]', copyErr);
          safeUri = file.uri;
        }

        const sizeInKb = Math.round(file.size ? file.size / 1024 : 100);
        const formattedSize = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)}MB` : `${sizeInKb}KB`;
        const newFile: UploadedFile = {
          id: `f-${Date.now()}`,
          name: file.name || (activeDocTab === 'contract' ? 'Tenancy_Contract.pdf' : 'Receipt.pdf'),
          date: `Uploaded on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          size: formattedSize,
          uri: safeUri,
          type: file.mimeType || 'application/pdf',
        };
        if (activeDocTab === 'contract') {
          setContractFiles((prev) => [...prev, newFile]);
        } else {
          setReceiptFiles((prev) => [...prev, newFile]);
        }
      }
    } catch (err: any) {
      console.warn('Document picker error:', err);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        CustomAlert.alert('Permission Required', 'Please allow access to your photo library to select receipt images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `Receipt_${Date.now()}.jpg`;
        let safeUri = asset.uri;
        try {
          if (asset.uri && FileSystemLegacy.cacheDirectory) {
            const cleanName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const destUri = `${FileSystemLegacy.cacheDirectory}${cleanName}`;
            await FileSystemLegacy.copyAsync({ from: asset.uri, to: destUri });
            safeUri = destUri;
          }
        } catch (copyErr) {
          console.warn('[Safe image copy error]', copyErr);
          safeUri = asset.uri;
        }

        const sizeInKb = Math.round(asset.fileSize ? asset.fileSize / 1024 : 150);
        const formattedSize = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)}MB` : `${sizeInKb}KB`;
        const newFile: UploadedFile = {
          id: `f-${Date.now()}`,
          name: fileName,
          date: `Uploaded on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          size: formattedSize,
          uri: safeUri,
          type: asset.mimeType || 'image/jpeg',
        };
        setReceiptFiles((prev) => [...prev, newFile]);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleUploadPress = () => {
    const currentList = activeDocTab === 'contract' ? contractFiles : receiptFiles;
    if (currentList.length >= 5) {
      CustomAlert.alert('Limit Reached', 'You can upload up to 5 documents.');
      return;
    }

    if (activeDocTab === 'contract') {
      pickDocument();
    } else {
      CustomAlert.alert('Upload Receipt', 'Select upload source:', [
        { text: 'Choose from Files (PDF)', onPress: pickDocument },
        { text: 'Choose from Photos (Image)', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleDeleteFile = (id: string) => {
    if (activeDocTab === 'contract') {
      setContractFiles((prev) => prev.filter((f) => f.id !== id));
    } else {
      setReceiptFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleOpenDatePicker = (type: 'start' | 'end' | 'due' | 'feeDue') => {
    setActiveDatePicker(type);
    let currentVal = '';
    if (type === 'start') currentVal = rentStartDate;
    if (type === 'end') currentVal = rentEndDate;
    if (type === 'due') currentVal = rentDueDate;
    if (type === 'feeDue') currentVal = customFeeDueDate;

    if (currentVal) {
      const parts = currentVal.split('/');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        if (!isNaN(d.getTime())) {
          setTempDate(d);
          return;
        }
      }
    }
    setTempDate(new Date());
  };

  const computeEndDate = (startDateStr: string, durationInYears: number): string => {
    if (!startDateStr || durationInYears <= 0) return '';
    const parts = startDateStr.split('/');
    if (parts.length !== 3) return '';
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) return '';

    d.setFullYear(d.getFullYear() + durationInYears);
    d.setDate(d.getDate() - 1);

    const endDay = String(d.getDate()).padStart(2, '0');
    const endMonth = String(d.getMonth() + 1).padStart(2, '0');
    const endYear = d.getFullYear();
    return `${endDay}/${endMonth}/${endYear}`;
  };

  const handleRentDurationChange = (newDuration: number) => {
    const clamped = Math.max(1, newDuration);
    setRentDuration(clamped);
    if (rentStartDate) {
      setRentEndDate(computeEndDate(rentStartDate, clamped));
    }
  };

  const handleConfirmDate = () => {
    const day = String(tempDate.getDate()).padStart(2, '0');
    const month = String(tempDate.getMonth() + 1).padStart(2, '0');
    const year = tempDate.getFullYear();
    const formatted = `${day}/${month}/${year}`;

    if (activeDatePicker === 'start') {
      setRentStartDate(formatted);
      if (rentDuration > 0) {
        setRentEndDate(computeEndDate(formatted, rentDuration));
      }
    }
    if (activeDatePicker === 'end') setRentEndDate(formatted);
    if (activeDatePicker === 'due') setRentDueDate(formatted);
    if (activeDatePicker === 'feeDue') setCustomFeeDueDate(formatted);

    setActiveDatePicker(null);
  };

  // Stepper & Proceed navigation
  const handleProceed = () => {
    const currentStep = steps[wizardStep];

    if (currentStep === 'property') {
      if (!selectedProperty) {
        CustomAlert.alert('Property Required', 'Please select a property.');
        return;
      }
      if (!selectedUnit) {
        CustomAlert.alert('Unit Required', 'Please select a vacant unit.');
        return;
      }
      setWizardStep(steps.indexOf('resident'));
    } else if (currentStep === 'resident') {
      const isEmailValid = validateEmail(residentEmail, true);
      const isPhoneValid = validatePhone(residentPhone, true);
      if (!isEmailValid || !isPhoneValid) return;
      setWizardStep(steps.indexOf('rent'));
    } else if (currentStep === 'rent') {
      const numRent = Number(rentAmount.replace(/,/g, ''));
      if (!numRent || numRent <= 0) {
        CustomAlert.alert('Rent Required', 'Please enter a valid rent amount.');
        return;
      }
      if (!rentStartDate) {
        CustomAlert.alert('Start Date Required', 'Please select a tenancy start date.');
        return;
      }
      if (effectiveTenancyType === 'existing') {
        setWizardStep(steps.indexOf('uploads'));
      } else {
        setWizardStep(steps.indexOf('confirm'));
      }
    } else if (currentStep === 'uploads') {
      setWizardStep(steps.indexOf('confirm'));
    } else if (currentStep === 'confirm') {
      if (effectiveTenancyType === 'existing') {
        // Proceed to Administration Charge Interface
        const payIdx = steps.indexOf('pay');
        setWizardStep(payIdx !== -1 ? payIdx : 5);
      } else {
        // Call POST /api/v1/tenancies to generate legal contract
        setIsSubmitting(true);
        const numRent = Number(rentAmount.replace(/,/g, '')) || 0;
        const customFeesList = [];
        if (customFeeName.trim() && customFeeAmount) {
          customFeesList.push({
            name: customFeeName.trim(),
            amount: Number(customFeeAmount.replace(/,/g, '')) || 0,
            dueDate: customFeeDueDate ? toApiDate(customFeeDueDate) : undefined,
          });
        }

        dispatch(
          createNewTenancy({
            propertyId: selectedProperty?.id || '',
            unitId: selectedUnit || '',
            tenantFirstName: firstName.trim() || 'Saad',
            tenantLastName: lastName.trim() || 'Bashar',
            tenantEmail: residentEmail.trim() || 'saadbashar1433@gmail.com',
            tenantPhoneNumber: residentPhone.trim() || '+2348141714124',
            rentAmount: numRent,
            durationYears: rentDuration || 1,
            rentStartDate: toApiDate(rentStartDate) || '2026-09-01',
            rentEndDate: toApiDate(rentEndDate) || '2027-09-01',
            rentDueDate: rentDueDate || '1st of every month',
            customFees: customFeesList.length > 0 ? customFeesList : undefined,
          })
        )
          .unwrap()
          .then((createdTenancy: any) => {
            setIsSubmitting(false);
            const text = createdTenancy?.contractText || createdTenancy?.data?.contractText || null;
            if (text) {
              setServerContractText(text);
            }
            const previewIdx = steps.indexOf('contract_preview');
            setWizardStep(previewIdx !== -1 ? previewIdx : 4);
          })
          .catch((err: any) => {
            setIsSubmitting(false);
            const errMsg =
              typeof err === 'string'
                ? err
                : err?.message ||
                  'Network error: Failed to create tenancy agreement. Please check your connection and try again.';
            CustomAlert.alert('Unable to Create Tenancy', errMsg);
          });
      }
    } else if (currentStep === 'contract_preview') {
      setShowSuccessModal(true);
    } else if (currentStep === 'pay') {
      // Submit Existing Tenancy with uploaded documents & administration charge
      setIsSubmitting(true);
      const numRent = Number(rentAmount.replace(/,/g, '')) || 0;
      const customFeesList = [];
      if (customFeeName.trim() && customFeeAmount) {
        customFeesList.push({
          name: customFeeName.trim(),
          amount: Number(customFeeAmount.replace(/,/g, '')) || 0,
          dueDate: customFeeDueDate ? toApiDate(customFeeDueDate) : undefined,
        });
      }

      dispatch(
        createExistingTenancy({
          propertyId: selectedProperty?.id || '',
          unitId: selectedUnit || '',
          tenantFirstName: firstName.trim() || 'Tenant',
          tenantLastName: lastName.trim() || 'User',
          tenantEmail: residentEmail.trim(),
          tenantPhoneNumber: residentPhone.trim(),
          rentAmount: numRent,
          durationYears: rentDuration || 1,
          rentStartDate: toApiDate(rentStartDate) || '2025-01-01',
          rentEndDate: toApiDate(rentEndDate) || '2026-01-01',
          rentDueDate: rentDueDate || '1st of every month',
          customFees: customFeesList.length > 0 ? customFeesList : undefined,
          contractFile:
            contractFiles.length > 0 && contractFiles[0].uri
              ? {
                  uri: contractFiles[0].uri,
                  name: contractFiles[0].name,
                  type: contractFiles[0].type || 'application/pdf',
                }
              : null,
          receiptFile:
            receiptFiles.length > 0 && receiptFiles[0].uri
              ? {
                  uri: receiptFiles[0].uri,
                  name: receiptFiles[0].name,
                  type: receiptFiles[0].type || 'application/pdf',
                }
              : null,
        })
      )
        .unwrap()
        .then(() => {
          setIsSubmitting(false);
          setShowPaymentSuccess(true);
        })
        .catch((err: any) => {
          setIsSubmitting(false);
          const errMsg =
            typeof err === 'string'
              ? err
              : err?.message ||
                'Network error: Failed to record existing tenancy. Please check your connection and try again.';
          CustomAlert.alert('Unable to Record Tenancy', errMsg);
        });
    }
  };

  const handleBack = () => {
    if (wizardStep > 0) {
      setWizardStep((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    onClose();
    setActiveTab('home');
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    setShowPaymentSuccess(false);
    setWizardStep(0);
    setSelectedUnit(null);
    setFirstName('');
    setLastName('');
    setResidentName('');
    setResidentEmail('');
    setResidentPhone('');
    setRentAmount('');
  };

  const handleGoToMyTenancy = () => {
    setShowPaymentSuccess(false);
    setShowToastBanner(true);
    setTimeout(() => {
      setShowToastBanner(false);
      onClose();
      setActiveTab('properties');
    }, 1800);
  };

  const currentStep = steps[wizardStep];
  const unitDisplay =
    propertyUnits.find((u) => u.id === selectedUnit)?.unitIdentifier || selectedUnit || 'B1';
  const propCode = selectedProperty?.title
    ? selectedProperty.title.split(' ').map((w) => w[0]).join('').toUpperCase()
    : 'AWH';
  const tenantInitials =
    firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : 'SB';
  const dynamicFilename = `${propCode}-${new Date().getFullYear()}-${unitDisplay}-${tenantInitials}_Tenancy_Agreement.pdf`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <AppScreen edges={['top', 'bottom', 'left', 'right']}>
        {/* Top Toast Banner for Recorded Tenancy */}
        {showToastBanner && (
          <View style={styles.topToastContainer}>
            <View style={styles.toastCheckSquare}>
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={14}
                tintColor="#FFFFFF"
                weight="bold"
              />
            </View>
            <Text style={styles.toastText}>
              Tenancy recorded! We will let you know when it’s approved.
            </Text>
          </View>
        )}

        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={18}
              tintColor="#1A1C1E"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Tenancy</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Step Body */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {currentStep === 'type' && (
            <StepType tenancyType={tenancyType} onSelectType={setTenancyType} />
          )}

          {currentStep === 'property' && (
            <StepProperty
              progressBarWidth={progressBarWidth}
              currentPageNumber={currentPageNumber}
              totalPages={totalPagesForFlow}
              selectedProperty={selectedProperty}
              propertyUnits={propertyUnits}
              selectedUnit={selectedUnit}
              isLoadingUnits={isLoadingUnits}
              onOpenPropertySheet={() => setIsPropertySheetVisible(true)}
              onSelectUnit={selectUnit}
            />
          )}

          {currentStep === 'resident' && (
            <StepResident
              progressBarWidth={progressBarWidth}
              currentPageNumber={currentPageNumber}
              totalPages={totalPagesForFlow}
              firstName={firstName}
              lastName={lastName}
              residentEmail={residentEmail}
              residentPhone={residentPhone}
              emailError={emailError}
              phoneError={phoneError}
              onChangeFirstName={(t) => {
                setFirstName(t);
                setResidentName(`${t} ${lastName}`.trim());
              }}
              onChangeLastName={(t) => {
                setLastName(t);
                setResidentName(`${firstName} ${t}`.trim());
              }}
              onChangeEmail={(t) => {
                setResidentEmail(t);
                if (emailError) validateEmail(t, true);
              }}
              onBlurEmail={() => validateEmail(residentEmail, true)}
              onChangePhone={(t) => {
                setResidentPhone(t);
                if (phoneError) validatePhone(t, true);
              }}
              onBlurPhone={() => validatePhone(residentPhone, true)}
            />
          )}

          {currentStep === 'rent' && (
            <StepRent
              progressBarWidth={progressBarWidth}
              currentPageNumber={currentPageNumber}
              totalPages={totalPagesForFlow}
              rentAmount={rentAmount}
              rentDuration={rentDuration}
              rentStartDate={rentStartDate}
              rentEndDate={rentEndDate}
              rentDueDate={rentDueDate}
              showCustomFees={showCustomFees}
              customFeeName={customFeeName}
              customFeeAmount={customFeeAmount}
              customFeeDueDate={customFeeDueDate}
              onChangeRentAmount={setRentAmount}
              onChangeRentDuration={handleRentDurationChange}
              onOpenStartDatePicker={() => handleOpenDatePicker('start')}
              onOpenEndDatePicker={() => handleOpenDatePicker('end')}
              onOpenDueDatePicker={() => handleOpenDatePicker('due')}
              onOpenFeeDueDatePicker={() => handleOpenDatePicker('feeDue')}
              onToggleCustomFees={setShowCustomFees}
              onOpenFeeSheet={() => setIsFeeSheetVisible(true)}
              onChangeCustomFeeAmount={setCustomFeeAmount}
              onResetCustomFee={() => {
                setShowCustomFees(false);
                setCustomFeeName('');
                setCustomFeeAmount('');
                setCustomFeeDueDate('');
              }}
            />
          )}

          {currentStep === 'uploads' && (
            <StepUploads
              progressBarWidth={progressBarWidth}
              currentPageNumber={currentPageNumber}
              totalPages={totalPagesForFlow}
              activeDocTab={activeDocTab}
              contractFiles={contractFiles}
              receiptFiles={receiptFiles}
              onSelectTab={setActiveDocTab}
              onUploadPress={handleUploadPress}
              onDeleteFile={handleDeleteFile}
            />
          )}

          {currentStep === 'confirm' && (
            <StepConfirm
              progressBarWidth={progressBarWidth}
              currentPageNumber={currentPageNumber}
              totalPages={totalPagesForFlow}
              isExistingTenancy={isExistingTenancy || tenancyType === 'existing'}
              selectedProperty={selectedProperty}
              unitDisplay={unitDisplay}
              residentName={
                residentName || (firstName ? `${firstName} ${lastName}`.trim() : 'Saad Bashar')
              }
              residentEmail={residentEmail || 'saadbashar1433@gmail.com'}
              residentPhone={residentPhone || '+234 (0) 814 171 4124'}
              rentAmount={rentAmount}
              customFeeAmount={customFeeAmount}
              rentDuration={rentDuration}
              onJumpToStep={(stepName) => setWizardStep(steps.indexOf(stepName))}
            />
          )}

          {currentStep === 'contract_preview' && (
            <View style={styles.previewStepContainer}>
              <View style={styles.progressRow}>
                <View style={styles.progressBarBg}>
                  <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
                </View>
                <Text style={styles.progressText}>Page 5 of 5</Text>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionMainTitle}>Contract Preview</Text>
                <Text style={styles.sectionSubtitle}>
                  Review the generated agreement before dispatch.
                </Text>
              </View>

              <DocumentPreviewCard
                filename={dynamicFilename}
                contractText={serverContractText}
                propertyTitle={(selectedProperty as any)?.propertyName || selectedProperty?.title || 'Property'}
                unitName={unitDisplay}
                tenantName={residentName || `${firstName} ${lastName}`.trim() || 'Tenant'}
                rentAmount={rentAmount}
                durationYears={rentDuration || 1}
                startDate={rentStartDate || '17/03/2026'}
                endDate={rentEndDate || '17/08/2028'}
                onClose={() => setWizardStep(steps.indexOf('confirm'))}
              />
            </View>
          )}

          {currentStep === 'pay' && (
            <StepPay
              progressBarWidth={progressBarWidth}
              currentPageNumber={currentPageNumber}
              totalPages={totalPagesForFlow}
              rentAmount={rentAmount}
            />
          )}
        </ScrollView>

        {/* Footer Button Bar */}
        <View style={styles.footerBar}>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={handleProceed}
            activeOpacity={0.8}
          >
            <Text style={styles.proceedButtonText}>
              {currentStep === 'confirm'
                ? isExistingTenancy || tenancyType === 'existing'
                  ? 'Record Tenant'
                  : 'Generate Agreement'
                : currentStep === 'contract_preview'
                ? 'Complete'
                : currentStep === 'pay'
                ? `Pay ₦${Math.round((Number(rentAmount.replace(/,/g, '')) || 1500000) * 0.01).toLocaleString('en-US', { minimumFractionDigits: 2 })} →`
                : 'Proceed'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Choose Property Bottom Sheet */}
        <AppBottomSheet
          visible={isPropertySheetVisible}
          onClose={() => setIsPropertySheetVisible(false)}
          title="Choose Property"
        >
          <View style={styles.bottomSheetList}>
            {properties.map((prop, index) => (
              <TouchableOpacity
                key={prop.id || index}
                style={styles.sheetItemRow}
                onPress={() => selectPropertyFromSheet(prop)}
                activeOpacity={0.8}
              >
                {prop.imageUrl ? (
                  <Image source={{ uri: prop.imageUrl }} style={styles.propertyThumbLarge} resizeMode="cover" />
                ) : (
                  <Image
                    source={require('../../../assets/images/apo_wumba.png')}
                    style={styles.propertyThumbLarge}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.sheetItemInfo}>
                  <Text style={styles.sheetItemTitle}>{prop.title}</Text>
                  <Text style={styles.sheetItemAddress} numberOfLines={2}>
                    {prop.address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </AppBottomSheet>

        {/* Choose Fee Name Bottom Sheet */}
        <AppBottomSheet
          visible={isFeeSheetVisible}
          onClose={() => setIsFeeSheetVisible(false)}
          title="Select Fee"
        >
          <View style={styles.bottomSheetList}>
            {[
              'Caution Deposit',
              'Service Charge',
              'Legal Fee',
              'Agency Fee',
              'Maintenance Fee',
              'Utility Fee',
              'Other',
            ].map((fee, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.sheetOptionRow}
                onPress={() => {
                  setCustomFeeName(fee);
                  setIsFeeSheetVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.sheetOptionText}>{fee}</Text>
                {customFeeName === fee && (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={16}
                    tintColor="#D87C24"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </AppBottomSheet>

        {/* Real Date Picker Overlay */}
        {activeDatePicker && (
          <View style={styles.datePickerModalOverlay}>
            <TouchableOpacity
              style={styles.datePickerModalDismiss}
              activeOpacity={1}
              onPress={() => setActiveDatePicker(null)}
            />
            <View style={styles.datePickerContainer}>
              <View style={styles.dragIndicator} />
              <Text style={styles.datePickerTitle}>
                {activeDatePicker === 'start'
                  ? 'Select start date'
                  : activeDatePicker === 'end'
                  ? 'Select end date'
                  : 'Select due date'}
              </Text>
              <View style={styles.divider} />
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  themeVariant="light"
                  accentColor="#D87C24"
                  onChange={(event, date) => {
                    if (date) setTempDate(date);
                  }}
                  style={styles.nativeSpinner}
                />
              </View>
              <TouchableOpacity
                style={styles.datePickerProceedBtn}
                onPress={handleConfirmDate}
                activeOpacity={0.8}
              >
                <Text style={styles.datePickerProceedBtnText}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Submission Loading Overlay */}
        {isSubmitting && (
          <View style={styles.spinnerOverlay}>
            <View style={styles.spinnerCard}>
              <ActivityIndicator size="large" color="#FFA726" />
            </View>
          </View>
        )}

        {/* Payment Successful Screen */}
        <PaymentSuccessOverlay
          visible={showPaymentSuccess}
          propertyTitle={selectedProperty?.title || 'Apo-Wumba Homes'}
          unitIdentifier={unitDisplay}
          rentAmount={rentAmount}
          onGoToMyTenancy={handleGoToMyTenancy}
        />

        {/* Tenant Submitted Bottom Sheet Modal */}
        <TenantSubmittedSheet
          visible={showSuccessModal}
          isExistingTenancy={isExistingTenancy || tenancyType === 'existing'}
          onGoToDashboard={handleGoToDashboard}
          onCreateAnother={handleCreateAnother}
        />
      </AppScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#D87C24',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  footerBar: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F5EFE6',
    backgroundColor: '#FEFAF4',
  },
  proceedButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  topToastContainer: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    backgroundColor: '#2E281F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  toastCheckSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#D87C24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    flex: 1,
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  previewStepContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
  bottomSheetList: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 24,
  },
  sheetItemRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  propertyThumbLarge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#F5EFE6',
  },
  propertyThumbLargePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFF4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sheetItemInfo: {
    flex: 1,
  },
  sheetItemTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 3,
  },
  sheetItemAddress: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
    lineHeight: 16,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6',
  },
  sheetOptionText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
  },
  datePickerModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  datePickerModalDismiss: {
    flex: 1,
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#EBE6DC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBE6DC',
    marginBottom: 16,
  },
  pickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  nativeSpinner: {
    width: '100%',
    height: 160,
  },
  datePickerProceedBtn: {
    backgroundColor: '#FFA726',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  datePickerProceedBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#1A1C1E',
    fontWeight: '700',
  },
  spinnerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1800,
  },
  spinnerCard: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 4,
  },
});

export default CreateTenancyFlow;
