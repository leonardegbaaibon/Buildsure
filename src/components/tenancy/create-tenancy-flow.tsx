import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  useWindowDimensions,
  Platform,
  TextInput,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { AppBottomSheet } from '@/components/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getProperties,
  subscribeProperties,
  setShouldStartAddProperty,
  setActiveTab,
  PropertyItem,
} from '@/utils/user-store';

interface CreateTenancyFlowProps {
  visible: boolean;
  onClose: () => void;
}

interface PropertyOption {
  id: string;
  title: string;
  address: string;
  image: any;
}

interface UnitOption {
  id: string;
  status: 'occupied' | 'vacant';
}

interface UploadedFile {
  id: string;
  name: string;
  date: string;
  size: string;
}

const mockProperties: PropertyOption[] = [
  {
    id: 'p-1',
    title: 'Apo Wumba Homes',
    address: 'Plot 432, Apo Wumba District, Abuja, FCT',
    image: require('../../../assets/images/apo_wumba.png'),
  },
  {
    id: 'p-2',
    title: 'Wuse II Apartments',
    address: '12 Aminu Kano Cres, Wuse, Abuja, FCT',
    image: require('../../../assets/images/onboarding_1.png'),
  },
  {
    id: 'p-3',
    title: 'Maitama Heights',
    address: '5 Maitama Avenue, Maitama, Abuja, FCT',
    image: require('../../../assets/images/onboarding_3.png'),
  },
];

const mockUnits: UnitOption[] = [
  { id: 'A1', status: 'occupied' },
  { id: 'A2', status: 'occupied' },
  { id: 'A3', status: 'occupied' },
  { id: 'A4', status: 'occupied' },
  { id: 'B1', status: 'vacant' },
  { id: 'B2', status: 'vacant' },
  { id: 'B3', status: 'occupied' },
  { id: 'B4', status: 'occupied' },
  { id: 'B5', status: 'occupied' },
  { id: 'B6', status: 'occupied' },
  { id: 'C1', status: 'vacant' },
  { id: 'C2', status: 'occupied' },
  { id: 'C3', status: 'occupied' },
  { id: 'C4', status: 'vacant' },
  { id: 'C5', status: 'occupied' },
];

export default function CreateTenancyFlow({ visible, onClose }: CreateTenancyFlowProps) {
  const { width } = useWindowDimensions();

  // Wizard flow states
  const [tenancyType, setTenancyType] = useState<'new' | 'existing'>('new');
  const [wizardStep, setWizardStep] = useState<number>(0); 

  // Shared properties state loaded dynamically
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  useEffect(() => {
    const updateList = (list: PropertyItem[]) => {
      setProperties(list.map(p => ({
        id: p.id,
        title: p.title,
        address: p.address,
        image: p.hasImage 
          ? require('../../../assets/images/apo_wumba.png') 
          : require('../../../assets/images/onboarding_1.png')
      })));
    };
    updateList(getProperties());
    const unsubscribe = subscribeProperties(updateList);
    return unsubscribe;
  }, []);

  // Step sequence mapping:
  const steps = useMemo(() => {
    if (tenancyType === 'new') {
      return ['type', 'property', 'resident', 'rent', 'confirm', 'sign'];
    } else {
      return ['type', 'property', 'uploads', 'resident', 'rent', 'confirm'];
    }
  }, [tenancyType]);

  // Progress bar smooth animation
  const progressAnim = useMemo(() => new Animated.Value(0.2), []);

  useEffect(() => {
    if (wizardStep >= 1 && wizardStep <= 5) {
      Animated.timing(progressAnim, {
        toValue: wizardStep * 0.2,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [wizardStep, progressAnim]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0.2, 1.0],
    outputRange: ['20%', '100%'],
    extrapolate: 'clamp',
  });
  
  // Page 1 states
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null);
  const [isPropertySheetVisible, setIsPropertySheetVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // Page 2 states
  const [activeDocTab, setActiveDocTab] = useState<'contract' | 'receipts'>('contract');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: 'f-1',
      name: "Mr. John's Tenancy_Agreement.pdf",
      date: 'Uploaded on 2nd June, 2026',
      size: '1.2MB',
    },
  ]);

  // Page 3 states
  const [rentAmount, setRentAmount] = useState('');
  const [showCustomFees, setShowCustomFees] = useState(false);
  const [customFeeName, setCustomFeeName] = useState('');
  const [customFeeAmount, setCustomFeeAmount] = useState('');
  const [rentDuration, setRentDuration] = useState(0);
  const [rentStartDate, setRentStartDate] = useState('');
  const [rentEndDate, setRentEndDate] = useState('');
  const [rentDueDate, setRentDueDate] = useState('');
  const [showLateFee, setShowLateFee] = useState(false);
  const [lateFeeAmount, setLateFeeAmount] = useState('');

  // Page 4 states
  const [residentName, setResidentName] = useState('');
  const [residentEmail, setResidentEmail] = useState('');
  const [residentPhone, setResidentPhone] = useState('');

  // Page 5 states
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  // eslint-disable-next-line react-hooks/purity
  const agreementRef = useMemo(() => `B-#${Math.floor(100000 + Math['random']() * 900000)}`, []);

  // Submit and Success Modal states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const resetAllStates = () => {
    setWizardStep(0);
    setTenancyType('new');
    setSelectedProperty(null);
    setSelectedUnit(null);
    setUploadedFiles([
      {
        id: 'f-1',
        name: "Mr. John's Tenancy_Agreement.pdf",
        date: 'Uploaded on 2nd June, 2026',
        size: '1.2MB',
      },
    ]);
    setRentAmount('');
    setShowCustomFees(false);
    setCustomFeeName('');
    setCustomFeeAmount('');
    setRentDuration(0);
    setRentStartDate('');
    setRentEndDate('');
    setRentDueDate('');
    setShowLateFee(false);
    setLateFeeAmount('');
    setResidentName('');
    setResidentEmail('');
    setResidentPhone('');
    setAgreeToTerms(false);
    setSignatureName('');
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    resetAllStates();
    onClose();
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    resetAllStates();
  };

  const handleBack = () => {
    if (wizardStep === 0) {
      onClose();
    } else {
      setWizardStep((prev) => prev - 1);
    }
  };

  const handleProceed = () => {
    const currentStep = steps[wizardStep];

    if (currentStep === 'type') {
      setWizardStep(1);
      if (!selectedProperty) {
        setSelectedProperty(mockProperties[0]);
      }
    } else if (currentStep === 'property') {
      if (!selectedProperty) {
        Alert.alert('Required Field', 'Please select a property.');
        return;
      }
      if (!selectedUnit) {
        Alert.alert('Required Field', 'Please select a vacant unit.');
        return;
      }
      // For 'new' flow, next is 'resident' (index 2). For 'existing', next is 'uploads' (index 2).
      setWizardStep(2);
    } else if (currentStep === 'uploads') {
      if (uploadedFiles.length === 0) {
        Alert.alert('Required Field', 'Please upload at least one tenancy document.');
        return;
      }
      setWizardStep(3);
    } else if (currentStep === 'resident') {
      if (!residentName) {
        Alert.alert('Required Field', 'Please enter resident name.');
        return;
      }
      setWizardStep(wizardStep + 1);
    } else if (currentStep === 'rent') {
      if (!rentAmount) {
        Alert.alert('Required Field', 'Please enter a rent amount.');
        return;
      }
      if (!rentStartDate || !rentEndDate || !rentDueDate) {
        Alert.alert('Required Field', 'Please fill in all dates.');
        return;
      }
      setWizardStep(wizardStep + 1);
    } else if (currentStep === 'confirm') {
      if (tenancyType === 'new') {
        setWizardStep(5); // Go to signature (sign) screen
      } else {
        setIsSubmitting(true);
        setTimeout(() => {
          setIsSubmitting(false);
          setShowSuccessModal(true);
        }, 1500);
      }
    } else if (currentStep === 'sign') {
      if (!agreeToTerms) {
        Alert.alert('Agreement Required', 'Please accept the tenancy terms to complete creation.');
        return;
      }
      if (!signatureName.trim()) {
        Alert.alert('Signature Required', 'Please type your name to sign the agreement.');
        return;
      }
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccessModal(true);
      }, 1500);
    }
  };

  const selectPropertyFromSheet = (property: PropertyOption) => {
    setSelectedProperty(property);
    setSelectedUnit(null); // Reset unit choice on property change
    setIsPropertySheetVisible(false);
  };

  const selectUnit = (unit: UnitOption) => {
    if (unit.status === 'occupied') {
      Alert.alert('Unit Occupied', `Unit ${unit.id} is currently occupied.`);
      return;
    }
    setSelectedUnit(unit.id === selectedUnit ? null : unit.id);
  };

  // Real document picker upload
  const handleUploadPress = async () => {
    if (uploadedFiles.length >= 2) {
      Alert.alert('Limit Reached', 'You can upload up to 2 documents for testing.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: activeDocTab === 'contract' ? ['application/pdf'] : ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const newFile: UploadedFile = {
          id: `f-${Date.now()}`,
          name: file.name,
          date: `Uploaded on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          size: file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : 'Unknown size',
        };
        setUploadedFiles([...uploadedFiles, newFile]);
      }
    } catch {
      Alert.alert('Upload Error', 'An error occurred while selecting the file.');
    }
  };

  const handleDeleteFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
  };

  // Date Picker States
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | 'due' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleOpenDatePicker = (type: 'start' | 'end' | 'due') => {
    setActiveDatePicker(type);
    
    // Set tempDate to existing value if set, else new Date()
    let currentVal = '';
    if (type === 'start') currentVal = rentStartDate;
    if (type === 'end') currentVal = rentEndDate;
    if (type === 'due') currentVal = rentDueDate;

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

  const handleConfirmDate = () => {
    saveSelectedDate(tempDate);
    setActiveDatePicker(null);
  };

  const saveSelectedDate = (date: Date) => {
    const formatted = formatDate(date);
    if (activeDatePicker === 'start') setRentStartDate(formatted);
    if (activeDatePicker === 'end') setRentEndDate(formatted);
    if (activeDatePicker === 'due') setRentDueDate(formatted);
  };

  const handleStartDatePress = () => {
    handleOpenDatePicker('start');
  };
  const handleEndDatePress = () => {
    handleOpenDatePicker('end');
  };
  const handleDueDatePress = () => {
    handleOpenDatePicker('due');
  };

  // Screen 0: Choose Tenancy Type
  const renderTypeSelection = () => (
    <View style={styles.content}>
      <Text style={styles.wizardLabel}>Select Tenancy Type</Text>
      
      {/* New Tenancy Card */}
      <TouchableOpacity
        style={[
          styles.selectionCard,
          tenancyType === 'new' ? styles.selectionCardActive : styles.selectionCardInactive,
        ]}
        onPress={() => setTenancyType('new')}
        activeOpacity={0.8}
      >
        <View style={[styles.avatarCircle, tenancyType === 'new' ? styles.avatarCircleActive : styles.avatarCircleInactive]}>
          <SymbolView
            name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
            size={22}
            tintColor={tenancyType === 'new' ? '#D87C24' : '#8A8D93'}
          />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>New Tenancy</Text>
          <Text style={styles.cardSubtitle}>
            Create new lease terms, send a contract, and request the initial payment link.
          </Text>
        </View>
        <View style={styles.checkCircleContainer}>
          {tenancyType === 'new' ? (
            <SymbolView
              name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
              size={22}
              tintColor="#D87C24"
            />
          ) : (
            <View style={styles.emptyCircle} />
          )}
        </View>
      </TouchableOpacity>

      {/* Existing Tenancy Card */}
      <TouchableOpacity
        style={[
          styles.selectionCard,
          tenancyType === 'existing' ? styles.selectionCardActive : styles.selectionCardInactive,
        ]}
        onPress={() => setTenancyType('existing')}
        activeOpacity={0.8}
      >
        <View style={[styles.avatarCircle, tenancyType === 'existing' ? styles.avatarCircleActive : styles.avatarCircleInactive]}>
          <SymbolView
            name={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
            size={22}
            tintColor={tenancyType === 'existing' ? '#D87C24' : '#8A8D93'}
          />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>Existing Tenancy</Text>
          <Text style={styles.cardSubtitle}>
            Onboard an active resident to the platform without resending contracts or payment links.
          </Text>
        </View>
        <View style={styles.checkCircleContainer}>
          {tenancyType === 'existing' ? (
            <SymbolView
              name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
              size={22}
              tintColor="#D87C24"
            />
          ) : (
            <View style={styles.emptyCircle} />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  // Screen 1: Property Details & Unit Selection (Page 1 of 3)
  const renderPropertyAndUnits = () => {
    const unitBoxWidth = (width - 48 - 20) / 3;

    return (
      <View style={styles.content}>
        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
          </View>
          <Text style={styles.progressText}>Page 1 of 3</Text>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionMainTitle}>Property Details</Text>
          <Text style={styles.sectionSubtitle}>
            Select the property and unit you want to create a tenancy for
          </Text>
        </View>

        {/* Selected Property Card / Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Select Property</Text>
          
          {!selectedProperty ? (
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setIsPropertySheetVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownPlaceholder}>Select Property</Text>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={16}
                tintColor="#8A8D93"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.selectedPropertyCardButton}
              onPress={() => setIsPropertySheetVisible(true)}
              activeOpacity={0.7}
            >
              <Image
                source={selectedProperty.image}
                style={styles.propertyThumb}
              />
              <View style={styles.selectedPropertyInfo}>
                <Text style={styles.propertyCardTitle}>{selectedProperty.title}</Text>
                <Text style={styles.propertyCardAddress} numberOfLines={2}>
                  {selectedProperty.address}
                </Text>
              </View>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={16}
                tintColor="#8A8D93"
              />
            </TouchableOpacity>
          )}

          {/* Info Banner */}
          <View style={styles.tenancyInfoBanner}>
            <View style={styles.tenancyInfoIconBg}>
              <SymbolView
                name={{ ios: 'info.circle', android: 'info', web: 'info' }}
                size={14}
                tintColor="#D87C24"
              />
            </View>
            <Text style={styles.tenancyInfoText}>
              A 1% adminstration charge applies to every new tenancy created and any existing tenancy that is under 1 month.
            </Text>
          </View>
        </View>

        {/* Units Selection Grid */}
        {selectedProperty && (
          <View style={styles.unitsSection}>
            <Text style={styles.unitGridTitle}>Select one of the Available Vacant Units</Text>
            
            <View style={styles.unitsGrid}>
              {mockUnits.map((unit) => {
                const isOccupied = unit.status === 'occupied';
                const isSelected = selectedUnit === unit.id;

                let cardStyle = styles.unitBoxVacant;
                let textStyle = styles.unitIdTextVacant;
                let statusStyle = styles.unitStatusTextVacant;

                if (isOccupied) {
                  cardStyle = styles.unitBoxOccupied;
                  textStyle = styles.unitIdTextOccupied;
                  statusStyle = styles.unitStatusTextOccupied;
                } else if (isSelected) {
                  cardStyle = styles.unitBoxSelected;
                  textStyle = styles.unitIdTextSelected;
                  statusStyle = styles.unitStatusTextSelected;
                }

                return (
                  <TouchableOpacity
                    key={unit.id}
                    style={[styles.unitBox, { width: unitBoxWidth }, cardStyle]}
                    onPress={() => selectUnit(unit)}
                    activeOpacity={isOccupied ? 1 : 0.7}
                  >
                    <Text style={[styles.unitIdText, textStyle]}>{unit.id}</Text>
                    <Text style={[styles.unitStatusText, statusStyle]}>
                      {isOccupied ? 'Occupied' : 'Vacant'}
                    </Text>

                    {/* Orange checkmark badge on selected unit */}
                    {isSelected && (
                      <View style={styles.unitCheckBadge}>
                        <SymbolView
                          name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                          size={14}
                          tintColor="#D87C24"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Screen 2: Upload Documents (Page 2 of 5)
  const renderUploadDocuments = () => (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>Page 2 of 5</Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionMainTitle}>Upload Documents</Text>
        <Text style={styles.sectionSubtitle}>
          Upload tenancy documents to auto-fill tenancy details
        </Text>
      </View>

      {/* Tabs selection */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabBox,
            activeDocTab === 'contract' ? styles.tabBoxActive : styles.tabBoxInactive,
          ]}
          onPress={() => setActiveDocTab('contract')}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
            size={22}
            tintColor={activeDocTab === 'contract' ? '#D87C24' : '#8A8D93'}
          />
          <Text style={[styles.tabBoxText, activeDocTab === 'contract' ? styles.tabBoxTextActive : styles.tabBoxTextInactive]}>
            Tenancy Contract
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBox,
            activeDocTab === 'receipts' ? styles.tabBoxActive : styles.tabBoxInactive,
          ]}
          onPress={() => setActiveDocTab('receipts')}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'scroll.fill', android: 'receipt_long', web: 'receipt_long' }}
            size={22}
            tintColor={activeDocTab === 'receipts' ? '#D87C24' : '#8A8D93'}
          />
          <Text style={[styles.tabBoxText, activeDocTab === 'receipts' ? styles.tabBoxTextActive : styles.tabBoxTextInactive]}>
            Rent Receipts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Drag & Drop area */}
      <TouchableOpacity
        style={styles.uploadDropzone}
        onPress={handleUploadPress}
        activeOpacity={0.8}
      >
        <SymbolView
          name={{ ios: 'square.and.arrow.up', android: 'upload', web: 'upload' }}
          size={32}
          tintColor="#D87C24"
        />
        <Text style={styles.uploadMainText}>Tap to upload to drag files here.</Text>
        <Text style={styles.uploadSubText}>JPG, PNG, WEBP, PDF (max. 5MB)</Text>
      </TouchableOpacity>

      {/* Uploaded Documents List */}
      <View style={styles.documentListSection}>
        <View style={styles.docSectionHeader}>
          <Text style={styles.docSectionTitle}>Upload Documents</Text>
          <Text style={styles.docSectionStatus}>{uploadedFiles.length}/2 Uploaded</Text>
        </View>

        {uploadedFiles.map((file) => (
          <View key={file.id} style={styles.uploadedDocCard}>
            {/* Miniature page representation */}
            <View style={styles.docThumbnail}>
              <View style={styles.thumbnailLineLong} />
              <View style={styles.thumbnailLineShort} />
              <View style={styles.thumbnailLineLong} />
              <View style={styles.thumbnailLineMedium} />
            </View>

            {/* Document details */}
            <View style={styles.docDetailsCol}>
              <Text style={styles.docTitle} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.docDate}>{file.date}</Text>
              
              {/* Green status badge */}
              <View style={styles.uploadedBadge}>
                <SymbolView
                  name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                  size={12}
                  tintColor="#2E7D32"
                />
                <Text style={styles.uploadedBadgeText}>Uploaded</Text>
              </View>
            </View>

            {/* Red delete trash bin action */}
            <TouchableOpacity
              style={styles.deleteFileBtn}
              onPress={() => handleDeleteFile(file.id)}
              activeOpacity={0.7}
            >
              <SymbolView
                name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
                size={16}
                tintColor="#EF4444"
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  // Screen 3: Rent & Dates (Page 3 of 5)
  const renderRentDates = () => (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>Page 3 of 5</Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionMainTitle}>Rent & Dates</Text>
        <Text style={styles.sectionSubtitle}>
          Enter the lease duration, rental amount, and payment schedule for this unit
        </Text>
      </View>

      {/* Rent Amount Input Row */}
      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Rent amount</Text>
        
        <View style={styles.rentAmountRow}>
          {/* NGN dropdown */}
          <View style={styles.currencyBox}>
            <View style={styles.flagContainer}>
              <View style={[styles.flagStrip, { backgroundColor: '#008751' }]} />
              <View style={[styles.flagStrip, { backgroundColor: '#FFFFFF' }]} />
              <View style={[styles.flagStrip, { backgroundColor: '#008751' }]} />
            </View>
            <Text style={styles.currencyText}>NGN</Text>
          </View>

          {/* Amount input */}
          <TextInput
            style={styles.amountInput}
            placeholder="Enter amount"
            placeholderTextColor="#8A8D93"
            keyboardType="numeric"
            value={rentAmount}
            onChangeText={setRentAmount}
          />
        </View>

        {/* Custom Fees expander view */}
        {showCustomFees && (
          <View style={styles.customFeeContainer}>
            <View style={styles.customFeeRow}>
              <View style={styles.feeField}>
                <Text style={styles.fieldLabelSub}>Fee</Text>
                <TextInput
                  style={styles.feeInput}
                  placeholder="Enter Fee Name"
                  placeholderTextColor="#8A8D93"
                  value={customFeeName}
                  onChangeText={setCustomFeeName}
                />
              </View>

              <View style={styles.feeField}>
                <Text style={styles.fieldLabelSub}>Amount</Text>
                <TextInput
                  style={styles.feeInput}
                  placeholder="Enter Amount"
                  placeholderTextColor="#8A8D93"
                  keyboardType="numeric"
                  value={customFeeAmount}
                  onChangeText={setCustomFeeAmount}
                />
              </View>
            </View>
          </View>
        )}

        {/* Add custom fees link */}
        <TouchableOpacity
          style={styles.addPropertyLink}
          onPress={() => setShowCustomFees(!showCustomFees)}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'doc.badge.plus', android: 'note_add', web: 'note_add' }}
            size={16}
            tintColor="#D87C24"
          />
          <Text style={styles.addPropertyLinkText}>
            {showCustomFees ? 'Hide custom fees' : 'Add custom fees'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rent Duration Selector (Stepper) */}
      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Rent Duration (in years)</Text>
        
        <View style={styles.stepperContainer}>
          <View style={{ flex: 1 }} />
          <View style={styles.stepperControls}>
            {/* Minus */}
            <TouchableOpacity
              style={styles.stepperBtnMinus}
              onPress={() => rentDuration > 0 && setRentDuration(rentDuration - 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnMinusText}>-</Text>
            </TouchableOpacity>

            {/* Value */}
            <Text style={styles.stepperValText}>{rentDuration}</Text>

            {/* Plus */}
            <TouchableOpacity
              style={styles.stepperBtnPlus}
              onPress={() => setRentDuration(rentDuration + 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnPlusText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Rent Start & End Dates */}
      <View style={styles.datesRowGrid}>
        <TouchableOpacity
          style={styles.dateFieldCol}
          onPress={handleStartDatePress}
          activeOpacity={0.8}
        >
          <Text style={styles.fieldLabel}>Rent start date</Text>
          <View style={styles.datePickerInput}>
            <Text style={rentStartDate ? styles.dateTextFilled : styles.datePlaceholder}>
              {rentStartDate || 'Select date'}
            </Text>
            <SymbolView
              name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
              size={16}
              tintColor="#8A8D93"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateFieldCol}
          onPress={handleEndDatePress}
          activeOpacity={0.8}
        >
          <Text style={styles.fieldLabel}>Rent end date</Text>
          <View style={styles.datePickerInput}>
            <Text style={rentEndDate ? styles.dateTextFilled : styles.datePlaceholder}>
              {rentEndDate || 'Select date'}
            </Text>
            <SymbolView
              name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
              size={16}
              tintColor="#8A8D93"
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Rent is due on */}
      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Rent is due on</Text>
        <TouchableOpacity
          style={styles.datePickerInputFull}
          onPress={handleDueDatePress}
          activeOpacity={0.8}
        >
          <Text style={rentDueDate ? styles.dateTextFilled : styles.datePlaceholder}>
            {rentDueDate || 'Select date'}
          </Text>
          <SymbolView
            name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
            size={16}
            tintColor="#8A8D93"
          />
        </TouchableOpacity>
      </View>

      {/* Late fee selector expander view */}
      {showLateFee && (
        <View style={styles.customFeeContainer}>
          <Text style={styles.fieldLabelSub}>Late Fee Amount (NGN)</Text>
          <TextInput
            style={styles.datePickerInputFull}
            placeholder="Enter late fee amount"
            placeholderTextColor="#8A8D93"
            keyboardType="numeric"
            value={lateFeeAmount}
            onChangeText={setLateFeeAmount}
          />
        </View>
      )}

      {/* Add late fee link */}
      <TouchableOpacity
        style={[styles.addPropertyLink, { marginTop: 12 }]}
        onPress={() => setShowLateFee(!showLateFee)}
        activeOpacity={0.7}
      >
        <SymbolView
          name={{ ios: 'doc.badge.plus', android: 'note_add', web: 'note_add' }}
          size={16}
          tintColor="#D87C24"
        />
        <Text style={styles.addPropertyLinkText}>
          {showLateFee ? 'Hide late fee' : 'Add late fee'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Screen 4: Resident Details (Page 4 of 5)
  const renderResidentDetails = () => (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>Page 4 of 5</Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionMainTitle}>Resident Details</Text>
        <Text style={styles.sectionSubtitle}>
          Enter the contact details for the primary resident of this tenancy
        </Text>
      </View>

      {/* Fields */}
      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Resident Full Name</Text>
        <TextInput
          style={styles.datePickerInputFull}
          placeholder="Enter resident full name"
          placeholderTextColor="#8A8D93"
          value={residentName}
          onChangeText={setResidentName}
        />
      </View>

      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Email Address</Text>
        <TextInput
          style={styles.datePickerInputFull}
          placeholder="Enter resident email address"
          placeholderTextColor="#8A8D93"
          keyboardType="email-address"
          value={residentEmail}
          onChangeText={setResidentEmail}
        />
      </View>

      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
        <TextInput
          style={styles.datePickerInputFull}
          placeholder="Enter resident phone number"
          placeholderTextColor="#8A8D93"
          keyboardType="phone-pad"
          value={residentPhone}
          onChangeText={setResidentPhone}
        />
      </View>
    </View>
  );

  // Screen 5: Review & Confirm (Page 4 of 5 or Page 5 of 5)
  const renderReviewSubmit = () => (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>Page {wizardStep} of 5</Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionMainTitle}>
          {tenancyType === 'new' ? 'Confirm Details' : 'Review & Confirm'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {tenancyType === 'new'
            ? 'Confirm all details are correct before generating the tenancy agreement.'
            : 'Double check all fields before finalizing the tenancy creation'}
        </Text>
      </View>

      {/* Property Details Card */}
      <View style={styles.reviewSectionCard}>
        <View style={styles.reviewCardHeader}>
          <Text style={styles.reviewHeader}>Property Details</Text>
          <TouchableOpacity onPress={() => setWizardStep(1)}>
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Property</Text>
          <Text style={styles.reviewValue}>{selectedProperty?.title || 'Apo Wumba Homes'}</Text>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Unit</Text>
          <Text style={styles.reviewValue}>{selectedUnit || 'B1'}</Text>
        </View>
      </View>

      {/* Tenant Profile Card */}
      <View style={styles.reviewSectionCard}>
        <View style={styles.reviewCardHeader}>
          <Text style={styles.reviewHeader}>Tenant Profile</Text>
          <TouchableOpacity onPress={() => setWizardStep(steps.indexOf('resident'))}>
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Name</Text>
          <Text style={styles.reviewValue}>{residentName || 'Saad Bashar'}</Text>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Email address</Text>
          <Text style={styles.reviewValue}>{residentEmail || 'saadbashar1433@gmail.com'}</Text>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Phone Number</Text>
          <Text style={styles.reviewValue}>{residentPhone || '+234 (0) 814 171 4124'}</Text>
        </View>
      </View>

      {/* Rent & Dates Card */}
      <View style={styles.reviewSectionCard}>
        <View style={styles.reviewCardHeader}>
          <Text style={styles.reviewHeader}>Rent & Dates</Text>
          <TouchableOpacity onPress={() => setWizardStep(steps.indexOf('rent'))}>
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Rent Amount</Text>
          <Text style={styles.reviewValue}>
            NGN {rentAmount ? Number(rentAmount).toLocaleString() : '1,270,000'}
          </Text>
        </View>

        {showCustomFees && customFeeName && (
          <View style={styles.reviewItemRow}>
            <Text style={styles.reviewLabel}>{customFeeName}</Text>
            <Text style={styles.reviewValue}>
              NGN {customFeeAmount ? Number(customFeeAmount).toLocaleString() : '300,000'}
            </Text>
          </View>
        )}

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Rent Duration (in years)</Text>
          <Text style={styles.reviewValue}>
            {rentDuration} {rentDuration === 1 ? 'year' : 'years'}
          </Text>
        </View>
      </View>

      {/* Uploaded Documents Card (Existing Tenancy Only) */}
      {tenancyType === 'existing' && uploadedFiles.length > 0 && (
        <View style={styles.reviewSectionCard}>
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewHeader}>Uploaded Documents</Text>
            <TouchableOpacity onPress={() => setWizardStep(steps.indexOf('uploads'))}>
              <Text style={styles.editLinkText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.reviewItemRow}>
            <Text style={styles.reviewLabel}>Document</Text>
            <Text style={styles.reviewValue} numberOfLines={1}>{uploadedFiles[0].name}</Text>
          </View>
        </View>
      )}
    </View>
  );

  // Screen 6: Sign Agreement (Page 5 of 5 for New Tenancy)
  const renderSignAgreement = () => (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>Page 5 of 5</Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionMainTitle}>Sign Agreement</Text>
        <Text style={styles.sectionSubtitle}>
          Review the generated agreement and sign below to complete the tenancy setup
        </Text>
      </View>

      {/* Document Preview Card */}
      <View style={styles.documentPreviewCard}>
        <ScrollView style={styles.docScrollView} nestedScrollEnabled={true}>
          <Text style={styles.docPreviewTitle}>TENANCY LEASE AGREEMENT</Text>
          <Text style={styles.docSub}>Ref: {agreementRef}</Text>
          <Text style={styles.docParagraph}>
            {"This Tenancy Lease Agreement (the \"Agreement\") is made and entered into on this day of creation by and between the Landlord and the primary Tenant:"}
          </Text>
          <Text style={styles.docFieldText}><Text style={styles.docFieldLabel}>Tenant Name:</Text> {residentName || 'Saad Bashar'}</Text>
          <Text style={styles.docFieldText}><Text style={styles.docFieldLabel}>Email Address:</Text> {residentEmail || 'saadbashar1433@gmail.com'}</Text>
          <Text style={styles.docFieldText}><Text style={styles.docFieldLabel}>Phone Number:</Text> {residentPhone || '+234 (0) 814 171 4124'}</Text>
          
          <View style={styles.docDivider} />
          
          <Text style={styles.docParagraph}>
            The Landlord hereby agrees to lease the following premises to the Tenant under the terms specified:
          </Text>
          <Text style={styles.docFieldText}><Text style={styles.docFieldLabel}>Property:</Text> {selectedProperty?.title || 'Apo Wumba Homes'}</Text>
          <Text style={styles.docFieldText}><Text style={styles.docFieldLabel}>Unit:</Text> Unit {selectedUnit || 'B1'}</Text>
          <Text style={styles.docFieldText}><Text style={styles.docFieldLabel}>Rent Amount:</Text> NGN {Number(rentAmount).toLocaleString() || '1,270,000'} / Year</Text>
          <Text style={styles.docFieldText}><Text style={styles.docFieldLabel}>Duration:</Text> {rentDuration} {rentDuration === 1 ? 'Year' : 'Years'}</Text>
          <Text style={styles.docFieldText}><Text style={styles.docFieldLabel}>Start Date:</Text> {rentStartDate || '16/09/2024'}</Text>
          <Text style={styles.docFieldText}><Text style={styles.docFieldLabel}>End Date:</Text> {rentEndDate || '15/09/2025'}</Text>
          <Text style={styles.docFieldText}><Text style={styles.docFieldLabel}>Due Date:</Text> {rentDueDate || '16/09/2024'}</Text>
          
          <View style={styles.docDivider} />
          
          <Text style={styles.docParagraph}>
            {"By typing your name below and submitting this agreement, you authorize the generation of this contract and confirm that all representations and details are true, correct, and legally binding."}
          </Text>
        </ScrollView>
      </View>

      {/* Signature Input */}
      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Type Name to Sign</Text>
        <TextInput
          style={styles.datePickerInputFull}
          placeholder="Type full name to sign"
          placeholderTextColor="#8A8D93"
          value={signatureName}
          onChangeText={setSignatureName}
        />
      </View>

      {/* Script Signature Preview Card */}
      {signatureName.trim().length > 0 && (
        <View style={styles.signaturePreviewCard}>
          <Text style={styles.signatureLabel}>Signature Preview</Text>
          <View style={styles.signatureTextWrapper}>
            <Text style={styles.signatureScriptText}>{signatureName}</Text>
          </View>
        </View>
      )}

      {/* Checkbox wrapper */}
      <TouchableOpacity 
        style={styles.checkboxRow}
        onPress={() => setAgreeToTerms(!agreeToTerms)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkboxOutline, agreeToTerms && styles.checkboxFilled]}>
          {agreeToTerms && (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={12}
              tintColor="#FFFFFF"
              weight="bold"
            />
          )}
        </View>
        <Text style={styles.checkboxLabelText}>
          I confirm and agree to the tenancy terms
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={18}
              tintColor="#1A1C1E"
              weight="bold"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Tenancy</Text>
        </View>

        {properties.length === 0 ? (
          /* Empty Create Tenancy State when no properties exist */
          <View style={styles.emptyTenancyContainer}>
            <Image
              source={require('../../../assets/images/empty_state.png')}
              style={styles.emptyTenancyBoxImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTenancyTitle}>You do not have any property yet!</Text>
            <Text style={styles.emptyTenancySubtitle}>
              Before you are able to set up a tenancy, you need to add your property on the application beforehand.
            </Text>
            <TouchableOpacity
              style={styles.emptyTenancyAddBtn}
              onPress={() => {
                onClose();
                setShouldStartAddProperty(true);
                setActiveTab('properties');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyTenancyAddBtnText}>Add Property →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Scroll Body */}
            <ScrollView 
              style={styles.body} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {steps[wizardStep] === 'type' && renderTypeSelection()}
              {steps[wizardStep] === 'property' && renderPropertyAndUnits()}
              {steps[wizardStep] === 'uploads' && renderUploadDocuments()}
              {steps[wizardStep] === 'resident' && renderResidentDetails()}
              {steps[wizardStep] === 'rent' && renderRentDates()}
              {steps[wizardStep] === 'confirm' && renderReviewSubmit()}
              {steps[wizardStep] === 'sign' && renderSignAgreement()}
            </ScrollView>

            {/* Custom Layout Footer */}
            {steps[wizardStep] === 'type' || (steps[wizardStep] === 'property' && !selectedUnit) ? (
              /* Single Proceed Button footer */
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={handleProceed}
                  activeOpacity={0.8}
                >
                  <Text style={styles.proceedButtonText}>Proceed</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Multi Button footer (Back button on bottom left + Proceed on right) */
              <View style={styles.footerRowContainer}>
                <TouchableOpacity
                  style={styles.squareBackButton}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <SymbolView
                    name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                    size={18}
                    tintColor="#1A1C1E"
                    weight="bold"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.proceedButtonRight}
                  onPress={handleProceed}
                  activeOpacity={0.8}
                >
                  <Text style={styles.proceedButtonText}>
                    {steps[wizardStep] === 'confirm' 
                      ? (tenancyType === 'new' ? 'Generate Agreement' : 'Create Tenancy') 
                      : steps[wizardStep] === 'sign' 
                        ? 'Complete Tenancy' 
                        : 'Proceed'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Screen 3: Choose Property Bottom Sheet */}
        <AppBottomSheet
          visible={isPropertySheetVisible}
          onClose={() => setIsPropertySheetVisible(false)}
          title="Choose Property"
        >
          <View style={styles.bottomSheetList}>
            {properties.map((prop, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sheetItemRow}
                onPress={() => selectPropertyFromSheet(prop)}
                activeOpacity={0.8}
              >
                <Image
                  source={prop.image}
                  style={styles.propertyThumbLarge}
                />
                <View style={styles.sheetItemInfo}>
                  <Text style={styles.sheetItemTitle}>{prop.title}</Text>
                  <Text style={styles.sheetItemAddress} numberOfLines={2}>
                    {prop.address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Bottom Sheet Proceed Button */}
            <TouchableOpacity
              style={styles.sheetProceedButton}
              onPress={() => {
                if (properties.length > 0) {
                  selectPropertyFromSheet(properties[0]);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetProceedText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </AppBottomSheet>

        {/* Real Date Picker Overlay */}
        {activeDatePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={true}
            onRequestClose={() => setActiveDatePicker(null)}
          >
            <View style={styles.datePickerModalOverlay}>
              <TouchableOpacity
                style={styles.datePickerModalDismiss}
                activeOpacity={1}
                onPress={() => setActiveDatePicker(null)}
              />
              <View style={styles.datePickerContainer}>
                {/* Drag handle */}
                <View style={styles.dragIndicator} />
                
                {/* Title */}
                <Text style={styles.datePickerTitle}>
                  {activeDatePicker === 'start' 
                    ? 'Select start date' 
                    : activeDatePicker === 'end' 
                      ? 'Select end date' 
                      : 'Select due date'}
                </Text>
                
                <View style={styles.divider} />
                
                {/* Native Spinner picker */}
                <View style={styles.pickerWrapper}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    themeVariant="light"
                    accentColor="#D87C24"
                    onChange={(event, date) => {
                      if (date) {
                        setTempDate(date);
                      }
                    }}
                    style={styles.nativeSpinner}
                  />
                </View>
                
                {/* Proceed Button */}
                <TouchableOpacity
                  style={styles.datePickerProceedBtn}
                  onPress={handleConfirmDate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.datePickerProceedBtnText}>Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Submission Loading Spinner Modal */}
        <Modal
          transparent={true}
          animationType="fade"
          visible={isSubmitting}
        >
          <View style={styles.spinnerOverlay}>
            <View style={styles.spinnerCard}>
              <ActivityIndicator size="large" color="#FFA726" />
            </View>
          </View>
        </Modal>

        {/* Success Bottom Sheet Modal */}
        <Modal
          transparent={true}
          animationType="slide"
          visible={showSuccessModal}
          onRequestClose={handleGoToDashboard}
        >
          <View style={styles.successModalOverlay}>
            <TouchableOpacity
              style={styles.successModalDismiss}
              activeOpacity={1}
              onPress={handleGoToDashboard}
            />
            <View style={styles.successSheetContainer}>
              {/* Drag Indicator */}
              <View style={styles.dragIndicator} />

              {/* Success Badge Row */}
              <View style={styles.successBadgeRow}>
                <View style={styles.dashedBorderCircle}>
                  <View style={styles.successIconCircle}>
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={20}
                      tintColor="#FFFFFF"
                      weight="bold"
                    />
                  </View>
                </View>
              </View>

              {/* Text Section */}
              <Text style={styles.successTitle}>Tenant Submitted!</Text>
              <Text style={styles.successDescription}>
                {"The tenant's documents are now being reviewed by our administrators. We will notify you once verified."}
              </Text>

              {/* Stacked Pill Buttons */}
              <TouchableOpacity 
                style={styles.successGoDashboardBtn} 
                onPress={handleGoToDashboard}
                activeOpacity={0.8}
              >
                <Text style={styles.successGoDashboardText}>Go to dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.successCreateAnotherBtn} 
                onPress={handleCreateAnother}
                activeOpacity={0.8}
              >
                <Text style={styles.successCreateAnotherText}>Create another tenancy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    position: 'relative',
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#D87C24',
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  wizardLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#8A8D93',
    marginBottom: 16,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  selectionCardActive: {
    borderColor: '#FFA726',
  },
  selectionCardInactive: {
    borderColor: '#EBE6DC',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarCircleActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
  },
  avatarCircleInactive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  cardSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 18,
  },
  checkCircleContainer: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    backgroundColor: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FEFAF4',
    borderTopWidth: 1,
    borderTopColor: '#EBE6DC',
  },
  footerRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FEFAF4',
    borderTopWidth: 1,
    borderTopColor: '#EBE6DC',
  },
  squareBackButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedButtonRight: {
    backgroundColor: '#FFA726',
    width: 160,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  proceedButton: {
    backgroundColor: '#FFA726',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  proceedButtonText: {
    fontFamily: 'Satoshi-Bold',
    color: '#1A1C1E',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#EBE6DC',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFA726',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8D93',
  },
  sectionHeader: {
    marginBottom: 24,
    gap: 4,
  },
  sectionMainTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  sectionSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#8A8D93',
    lineHeight: 18,
  },
  formGroup: {
    gap: 8,
  },
  formGroupSpacing: {
    gap: 8,
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  fieldLabelSub: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8D93',
  },
  dropdownSelector: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dropdownPlaceholder: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#8A8D93',
  },
  addPropertyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  addPropertyLinkText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#D87C24',
  },
  selectedPropertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  propertyThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  selectedPropertyInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 24,
    gap: 4,
  },
  propertyCardTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  propertyCardAddress: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    lineHeight: 15,
  },
  selectedCheckBadge: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -9,
  },
  unitsSection: {
    marginTop: 16,
  },
  unitGridTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 12,
  },
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  unitBox: {
    height: 64,
    borderWidth: 1.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
    position: 'relative',
  },
  unitBoxOccupied: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE3C6',
  },
  unitBoxVacant: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
  },
  unitBoxSelected: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFA726',
  },
  unitCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  unitIdText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  unitIdTextOccupied: {
    color: '#D87C24',
  },
  unitIdTextVacant: {
    color: '#1A1C1E',
  },
  unitIdTextSelected: {
    color: '#D87C24',
  },
  unitStatusText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    fontWeight: '500',
  },
  unitStatusTextOccupied: {
    color: '#D87C24',
  },
  unitStatusTextVacant: {
    color: '#8A8D93',
  },
  unitStatusTextSelected: {
    color: '#D87C24',
  },
  bottomSheetList: {
    width: '100%',
    gap: 12,
    paddingBottom: 16,
  },
  sheetItemRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 12,
    backgroundColor: '#FFFDF9',
  },
  propertyThumbLarge: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  sheetItemInfo: {
    flex: 1,
    marginLeft: 14,
    gap: 4,
  },
  sheetItemTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  sheetItemAddress: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    lineHeight: 16,
  },
  sheetProceedButton: {
    backgroundColor: '#FFA726',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  sheetProceedText: {
    fontFamily: 'Satoshi-Bold',
    color: '#1A1C1E',
    fontSize: 16,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tabBox: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBoxActive: {
    backgroundColor: '#FFFDF9',
    borderColor: '#FFA726',
  },
  tabBoxInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
  },
  tabBoxText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBoxTextActive: {
    color: '#D87C24',
  },
  tabBoxTextInactive: {
    color: '#8A8D93',
  },
  uploadDropzone: {
    height: 140,
    borderWidth: 1.5,
    borderColor: '#D87C24',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#FFFDF9',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  uploadMainText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '500',
  },
  uploadSubText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
  },
  documentListSection: {
    gap: 12,
  },
  docSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  docSectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  docSectionStatus: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFA726',
  },
  uploadedDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 12,
  },
  docThumbnail: {
    width: 48,
    height: 60,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 4,
    padding: 6,
    gap: 4,
    justifyContent: 'center',
  },
  thumbnailLineLong: {
    height: 3,
    backgroundColor: '#EBE6DC',
    width: '90%',
    borderRadius: 1.5,
  },
  thumbnailLineMedium: {
    height: 3,
    backgroundColor: '#EBE6DC',
    width: '70%',
    borderRadius: 1.5,
  },
  thumbnailLineShort: {
    height: 3,
    backgroundColor: '#EBE6DC',
    width: '40%',
    borderRadius: 1.5,
  },
  docDetailsCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    gap: 3,
  },
  docTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  docDate: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  uploadedBadgeText: {
    fontFamily: 'Satoshi-Bold',
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: '700',
  },
  deleteFileBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE3E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rentAmountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyBox: {
    width: 80,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  flagContainer: {
    width: 16,
    height: 12,
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#EBE6DC',
  },
  flagStrip: {
    flex: 1,
    height: '100%',
  },
  currencyText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  amountInput: {
    fontFamily: 'Satoshi-Medium',
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1A1C1E',
  },
  customFeeContainer: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  customFeeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  feeField: {
    flex: 1,
    gap: 6,
  },
  feeInput: {
    fontFamily: 'Satoshi-Regular',
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1A1C1E',
  },
  stepperContainer: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  stepperValueText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
  },

  datesRowGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateFieldCol: {
    flex: 1,
    gap: 8,
  },
  datePickerInput: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  datePickerInputFull: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  datePlaceholder: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#8A8D93',
  },
  dateTextFilled: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '500',
  },
  reviewSectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  reviewHeader: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#D87C24',
    borderBottomWidth: 1,
    borderBottomColor: '#FEFAF4',
    paddingBottom: 8,
    marginBottom: 4,
  },
  reviewItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  reviewLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#8A8D93',
    fontWeight: '500',
  },
  reviewValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  datePickerModalDismiss: {
    flex: 1,
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  datePickerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EBE6DC',
    marginBottom: 8,
  },
  pickerWrapper: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nativeSpinner: {
    width: '100%',
    height: 200,
  },
  datePickerProceedBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFA726',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  datePickerProceedBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Custom Stepper Styles
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtnMinus: {
    width: 28,
    height: 28,
    backgroundColor: '#FEFAF4',
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnMinusText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#D87C24',
    fontWeight: '700',
  },
  stepperValText: {
    fontFamily: 'Satoshi-Bold',
    width: 28,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  stepperBtnPlus: {
    width: 28,
    height: 28,
    backgroundColor: '#FFA726',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnPlusText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Review Cards Header
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
    paddingBottom: 8,
    marginBottom: 12,
  },
  editLinkText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#D87C24',
    fontWeight: '700',
  },
  // Sign Agreement Styles
  documentPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 12,
    padding: 16,
    height: 220,
    marginBottom: 20,
  },
  docScrollView: {
    flex: 1,
  },
  docPreviewTitle: {
    fontFamily: 'Satoshi-Black',
    fontSize: 15,
    fontWeight: '900',
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 4,
  },
  docSub: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#8A8D93',
    textAlign: 'center',
    marginBottom: 12,
  },
  docParagraph: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
    marginBottom: 10,
  },
  docFieldText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#1A1C1E',
    marginBottom: 4,
  },
  docFieldLabel: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#6C757D',
  },
  docDivider: {
    height: 1,
    backgroundColor: '#EBE6DC',
    marginVertical: 12,
  },
  signaturePreviewCard: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  signatureLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#8A8D93',
    fontWeight: '700',
    marginBottom: 8,
  },
  signatureTextWrapper: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
    borderStyle: 'dashed',
  },
  signatureScriptText: {
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'sans-serif-condensed',
    fontSize: 26,
    color: '#D87C24',
    fontStyle: 'italic',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  checkboxOutline: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D87C24',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxFilled: {
    backgroundColor: '#D87C24',
  },
  checkboxLabelText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '500',
  },
  spinnerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  successModalDismiss: {
    flex: 1,
  },
  successSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EBE6DC',
    alignSelf: 'center',
    marginBottom: 24,
  },
  successBadgeRow: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  dashedBorderCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#D87C24',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D87C24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 10,
  },
  successDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#8A8D93',
    lineHeight: 20,
    marginBottom: 24,
  },
  successGoDashboardBtn: {
    backgroundColor: '#FFA726',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  successGoDashboardText: {
    fontFamily: 'Satoshi-Bold',
    color: '#1A1C1E',
    fontSize: 15,
    fontWeight: '700',
  },
  successCreateAnotherBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFA726',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  successCreateAnotherText: {
    fontFamily: 'Satoshi-Bold',
    color: '#D87C24',
    fontSize: 15,
    fontWeight: '700',
  },
  
  // Empty State styling
  emptyTenancyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  emptyTenancyBoxImage: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  emptyTenancyTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyTenancySubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#8A8D93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyTenancyAddBtn: {
    backgroundColor: '#FFA726',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTenancyAddBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
  },

  // Selected Property card as a button
  selectedPropertyCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },

  // Info Banner step 1 styling
  tenancyInfoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFDF9',
    borderColor: '#FFE3C6',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  tenancyInfoIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenancyInfoText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
    flex: 1,
    lineHeight: 18,
  },
});
