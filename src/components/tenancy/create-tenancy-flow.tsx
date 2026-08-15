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

interface CreateTenancyFlowProps {
  visible: boolean;
  onClose: () => void;
}

interface PropertyOption {
  id: string;
  title: string;
  address: string;
  imageUrl?: string | null;
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

export default function CreateTenancyFlow({ visible, onClose }: CreateTenancyFlowProps) {
  const { width } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const reduxProperties = useAppSelector((state) => state.properties.properties);
  const { emailError, phoneError, validateEmail, validatePhone } = useValidation();

  // Wizard flow states
  const [tenancyType, setTenancyType] = useState<'new' | 'existing'>('new');
  const [wizardStep, setWizardStep] = useState<number>(0); 

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
  const [customFeeDueDate, setCustomFeeDueDate] = useState('');
  const [isFeeSheetVisible, setIsFeeSheetVisible] = useState(false);
  const [rentDuration, setRentDuration] = useState(1);
  const [rentStartDate, setRentStartDate] = useState('');
  const [rentEndDate, setRentEndDate] = useState('');
  const [rentDueDate, setRentDueDate] = useState('');
  const [showLateFee, setShowLateFee] = useState(false);
  const [lateFeeAmount, setLateFeeAmount] = useState('');

  // Toast banner for recorded tenancy
  const [showToastBanner, setShowToastBanner] = useState(false);

  useEffect(() => {
    if (showToastBanner) {
      const timer = setTimeout(() => {
        setShowToastBanner(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToastBanner]);

  useEffect(() => {
    if (visible) {
      setWizardStep(0);
      dispatch(fetchProperties());
    }
  }, [visible, dispatch]);

  // Shared properties state loaded dynamically
  const [localProperties, setLocalProperties] = useState<PropertyItem[]>([]);

  useEffect(() => {
    setLocalProperties(getProperties());
    const unsubscribe = subscribeProperties((list) => setLocalProperties(list));
    return unsubscribe;
  }, []);

  const properties: PropertyOption[] = useMemo(() => {
    const list: PropertyOption[] = [];

    if (reduxProperties && reduxProperties.length > 0) {
      reduxProperties.forEach((p: any) => {
        const title = p.propertyName || p.title || 'Untitled Property';
        const address = p.streetAddress
          ? `${p.streetAddress}${p.city ? `, ${p.city}` : ''}${p.state ? `, ${p.state}` : ''}`
          : (p.address || 'Abuja, FCT');
        const imageUrl = p.coverImage || (p.images && p.images[0]?.imageUrl) || p.imageUrl || null;

        list.push({
          id: p.id,
          title,
          address,
          imageUrl,
        });
      });
    }

    localProperties.forEach((lp: any) => {
      if (!list.some((item) => item.id === lp.id)) {
        list.push({
          id: lp.id,
          title: lp.title,
          address: lp.address,
          imageUrl: lp.imageUrl || null,
        });
      }
    });

    return list;
  }, [reduxProperties, localProperties]);

  // Determine if rent start date is in the past (Existing Tenancy)
  const isExistingTenancy = useMemo(() => {
    if (!rentStartDate) return tenancyType === 'existing';
    const parts = rentStartDate.split('/');
    if (parts.length !== 3) return false;
    const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }, [rentStartDate, tenancyType]);

  // Step sequence mapping
  const steps = useMemo(() => {
    if (isExistingTenancy) {
      return ['property', 'resident', 'rent', 'uploads', 'pay', 'confirm'];
    }
    return ['property', 'resident', 'rent', 'pay', 'confirm', 'sign'];
  }, [isExistingTenancy]);

  const totalPagesForFlow = useMemo(() => {
    return isExistingTenancy ? 5 : 6;
  }, [isExistingTenancy]);

  const currentPageNumber = useMemo(() => {
    return wizardStep + 1;
  }, [wizardStep]);

  // Progress bar smooth animation
  const progressAnim = useMemo(() => new Animated.Value(0.33), []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentPageNumber / 3,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentPageNumber, progressAnim]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0.33, 1.0],
    outputRange: ['33%', '100%'],
    extrapolate: 'clamp',
  });
  


  // Page 2 states (Tenant Profile)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

    if (currentStep === 'property') {
      if (!selectedProperty) {
        Alert.alert('Required Field', 'Please select a property.');
        return;
      }
      if (!selectedUnit) {
        Alert.alert('Required Field', 'Please select a vacant unit.');
        return;
      }
      setWizardStep(1);
    } else if (currentStep === 'uploads') {
      if (uploadedFiles.length === 0) {
        Alert.alert('Required Field', 'Please upload at least one tenancy document.');
        return;
      }
      setWizardStep(2);
    } else if (currentStep === 'resident') {
      if (!firstName.trim()) {
        Alert.alert('Required Field', 'Please enter first name.');
        return;
      }
      if (!lastName.trim()) {
        Alert.alert('Required Field', 'Please enter last name.');
        return;
      }
      const isEmailValid = validateEmail(residentEmail, true);
      const isPhoneValid = validatePhone(residentPhone, true);

      if (!isEmailValid || !isPhoneValid) {
        return;
      }
      setWizardStep(2);
    } else if (currentStep === 'rent') {
      if (!rentAmount) {
        Alert.alert('Required Field', 'Please enter a rent amount.');
        return;
      }
      if (!rentStartDate || !rentEndDate || !rentDueDate) {
        Alert.alert('Required Field', 'Please fill in all dates.');
        return;
      }
      if (isExistingTenancy) {
        setTenancyType('existing');
        setWizardStep(steps.indexOf('uploads'));
      } else {
        setTenancyType('new');
        setWizardStep(steps.indexOf('pay'));
      }
    } else if (currentStep === 'uploads') {
      if (uploadedFiles.length === 0) {
        Alert.alert('Required Field', 'Please upload at least one tenancy document.');
        return;
      }
      setWizardStep(steps.indexOf('pay'));
    } else if (currentStep === 'pay') {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setWizardStep(steps.indexOf('confirm'));
      }, 1000);
    } else if (currentStep === 'confirm') {
      if (isExistingTenancy || tenancyType === 'existing') {
        setIsSubmitting(true);
        setTimeout(() => {
          setIsSubmitting(false);
          setShowToastBanner(true);
          setShowSuccessModal(true);
        }, 1200);
      } else {
        setWizardStep(steps.indexOf('sign'));
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

  const [propertyUnits, setPropertyUnits] = useState<UnitOption[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // Automatically select first property and fetch real units from GET /api/v1/properties/{id}
  useEffect(() => {
    if (visible && properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0]);
    }
  }, [visible, properties]);

  useEffect(() => {
    if (visible && selectedProperty?.id) {
      setIsLoadingUnits(true);
      dispatch(fetchPropertyById(selectedProperty.id))
        .unwrap()
        .then((result: any) => {
          const rawUnits = result?.units || result?.data?.units || [];
          if (Array.isArray(rawUnits) && rawUnits.length > 0) {
            const mappedUnits: UnitOption[] = rawUnits.map((u: any) => ({
              id: u.unitIdentifier || u.id || 'Unit',
              status: u.isOccupied ? 'occupied' : 'vacant',
            }));
            setPropertyUnits(mappedUnits);
          } else {
            setPropertyUnits([]);
          }
        })
        .catch(() => {
          setPropertyUnits([]);
        })
        .finally(() => {
          setIsLoadingUnits(false);
        });
    } else if (!selectedProperty) {
      setPropertyUnits([]);
    }
  }, [visible, selectedProperty?.id, dispatch]);

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
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | 'due' | 'feeDue' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleOpenDatePicker = (type: 'start' | 'end' | 'due' | 'feeDue') => {
    setActiveDatePicker(type);
    
    // Set tempDate to existing value if set, else new Date()
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

  const handleConfirmDate = () => {
    saveSelectedDate(tempDate);
    setActiveDatePicker(null);
  };

  const saveSelectedDate = (date: Date) => {
    const formatted = formatDate(date);
    if (activeDatePicker === 'start') setRentStartDate(formatted);
    if (activeDatePicker === 'end') setRentEndDate(formatted);
    if (activeDatePicker === 'due') setRentDueDate(formatted);
    if (activeDatePicker === 'feeDue') setCustomFeeDueDate(formatted);
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
          <Text style={styles.progressText}>Page {currentPageNumber} of 3</Text>
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
              {selectedProperty.imageUrl ? (
                <Image
                  source={{ uri: selectedProperty.imageUrl }}
                  style={styles.propertyThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.propertyThumbPlaceholder}>
                  <SymbolView
                    name={{ ios: 'building.2.fill', android: 'apartment', web: 'apartment' }}
                    size={20}
                    tintColor="#D87C24"
                  />
                </View>
              )}
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
              A 1% adminstration charge applies to every new tenancy created and any existing tenancy that is under <Text style={{ fontWeight: 'bold', color: '#1A1C1E' }}>1 month.</Text>
            </Text>
          </View>
        </View>

        {/* Units Selection Grid */}
        {selectedProperty && (
          <View style={styles.unitsSection}>
            <Text style={styles.unitGridTitle}>Select one of the Available Vacant Units</Text>
            
            {isLoadingUnits ? (
              <ActivityIndicator size="small" color="#D87C24" style={{ marginVertical: 20 }} />
            ) : propertyUnits.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Satoshi-Regular', fontSize: 13, color: '#8A8D93' }}>
                  No units registered for this property.
                </Text>
              </View>
            ) : (
              <View style={styles.unitsGrid}>
                {propertyUnits.map((unit) => {
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
            )}
          </View>
        )}
      </View>
    );
  };

  // Screen 2: Upload Documents (Page 2 of 5)
  // Screen 4: Upload Documents (Page 3 of 3)
  const renderUploadDocuments = () => (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>Page {currentPageNumber} of 3</Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionMainTitle}>Upload Documents</Text>
        <Text style={styles.sectionSubtitle}>
          Upload tenancy documents to auto-fill tenancy details
        </Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabBoxCard,
            activeDocTab === 'contract' ? styles.tabBoxActive : styles.tabBoxInactive,
          ]}
          onPress={() => setActiveDocTab('contract')}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }}
            size={24}
            tintColor={activeDocTab === 'contract' ? '#D87C24' : '#8A8D93'}
          />
          <Text
            style={[
              styles.tabBoxText,
              activeDocTab === 'contract' ? styles.tabBoxTextActive : styles.tabBoxTextInactive,
            ]}
          >
            Tenancy{'\n'}Contract
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBoxCard,
            activeDocTab === 'receipts' ? styles.tabBoxActive : styles.tabBoxInactive,
          ]}
          onPress={() => setActiveDocTab('receipts')}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'receipt', android: 'receipt', web: 'receipt' }}
            size={24}
            tintColor={activeDocTab === 'receipts' ? '#D87C24' : '#8A8D93'}
          />
          <Text
            style={[
              styles.tabBoxText,
              activeDocTab === 'receipts' ? styles.tabBoxTextActive : styles.tabBoxTextInactive,
            ]}
          >
            Rent{'\n'}Receipts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Upload Drag & Drop Area */}
      <TouchableOpacity
        style={styles.uploadDropzone}
        onPress={handleUploadPress}
        activeOpacity={0.8}
      >
        <SymbolView
          name={{ ios: 'square.and.arrow.up', android: 'upload', web: 'upload' }}
          size={36}
          tintColor="#D87C24"
        />
        <Text style={styles.uploadMainText}>Tap to upload to drag files here.</Text>
        <Text style={styles.uploadSubText}>JPG, PNG, WEBP,PDF (max. 5MB)</Text>
      </TouchableOpacity>

      {/* Uploaded Documents List */}
      <View style={styles.documentListSection}>
        <View style={styles.docSectionHeader}>
          <Text style={styles.docSectionTitle}>Uploaded Documents</Text>
          <Text style={styles.docSectionStatus}>{uploadedFiles.length}/2 Uploaded</Text>
        </View>

        {uploadedFiles.map((file) => (
          <View key={file.id} style={styles.uploadedDocCard}>
            {/* Miniature page thumbnail */}
            <View style={styles.docThumbnail}>
              <View style={styles.thumbnailLineLong} />
              <View style={styles.thumbnailLineShort} />
              <View style={styles.thumbnailLineLong} />
              <View style={styles.thumbnailLineMedium} />
            </View>

            {/* Document details */}
            <View style={styles.docDetailsCol}>
              <Text style={styles.docTitle} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.docDate}>{file.size || '102KB'}</Text>
            </View>

            {/* Light pink trash icon button */}
            <TouchableOpacity
              style={styles.deleteFileBtnSquare}
              onPress={() => handleDeleteFile(file.id)}
              activeOpacity={0.7}
            >
              <SymbolView
                name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                size={18}
                tintColor="#EF4444"
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  // Screen 3: Rent & Dates (Page 3 of 3)
  const renderRentDates = () => (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>Page {currentPageNumber} of 3</Text>
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
          {/* NGN currency box */}
          <View style={styles.currencyBox}>
            <View style={styles.flagCircleSmall}>
              <View style={styles.flagGreen} />
              <View style={styles.flagWhite} />
              <View style={styles.flagGreen} />
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
              <Text style={styles.stepperBtnMinusText}>—</Text>
            </TouchableOpacity>

            {/* Value */}
            <Text style={styles.stepperValText}>{rentDuration}</Text>

            {/* Plus (Orange square button) */}
            <TouchableOpacity
              style={styles.stepperBtnPlusSquare}
              onPress={() => setRentDuration(rentDuration + 1)}
              activeOpacity={0.7}
            >
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={16}
                tintColor="#FFFFFF"
                weight="bold"
              />
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

      {/* Custom Fee Card Container */}
      {showCustomFees && (
        <View style={styles.customFeeCardBox}>
          {/* Delete Icon on Top Right */}
          <TouchableOpacity
            style={styles.customFeeDeleteBtn}
            onPress={() => {
              setShowCustomFees(false);
              setCustomFeeName('');
              setCustomFeeAmount('');
              setCustomFeeDueDate('');
            }}
            activeOpacity={0.7}
          >
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={18}
              tintColor="#EF4444"
            />
          </TouchableOpacity>

          {/* Fee Name * Dropdown */}
          <View style={styles.formGroupSpacing}>
            <Text style={styles.fieldLabel}>
              Fee Name <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setIsFeeSheetVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={customFeeName ? styles.dateTextFilled : styles.dropdownPlaceholder}>
                {customFeeName || 'Select Fee'}
              </Text>
              <SymbolView
                name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow_drop_down' }}
                size={18}
                tintColor="#8A8D93"
              />
            </TouchableOpacity>
          </View>

          {/* Fee Amount row */}
          <View style={styles.rentAmountRow}>
            <View style={styles.currencyBox}>
              <View style={styles.flagCircleSmall}>
                <View style={styles.flagGreen} />
                <View style={styles.flagWhite} />
                <View style={styles.flagGreen} />
              </View>
              <Text style={styles.currencyText}>NGN</Text>
            </View>

            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="#8A8D93"
              keyboardType="numeric"
              value={customFeeAmount}
              onChangeText={setCustomFeeAmount}
            />
          </View>

          {/* Payment is due on */}
          <View style={[styles.formGroupSpacing, { marginTop: 12 }]}>
            <Text style={styles.fieldLabel}>Payment is due on</Text>
            <TouchableOpacity
              style={styles.datePickerInputFull}
              onPress={() => handleOpenDatePicker('feeDue')}
              activeOpacity={0.8}
            >
              <Text style={customFeeDueDate ? styles.dateTextFilled : styles.datePlaceholder}>
                {customFeeDueDate || 'Select date'}
              </Text>
              <SymbolView
                name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                size={16}
                tintColor="#8A8D93"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add custom fees link */}
      <TouchableOpacity
        style={styles.addCustomFeeBtn}
        onPress={() => setShowCustomFees(true)}
        activeOpacity={0.7}
      >
        <SymbolView
          name={{ ios: 'doc.badge.plus', android: 'note_add', web: 'note_add' }}
          size={18}
          tintColor="#D87C24"
        />
        <Text style={styles.addCustomFeeText}>Add custom fees</Text>
      </TouchableOpacity>
    </View>
  );

  // Screen 2: Tenant Profile (Page 2 of 3)
  const renderResidentDetails = () => (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>Page {currentPageNumber} of 3</Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionMainTitle}>Tenant Profile</Text>
        <Text style={styles.sectionSubtitle}>
          Enter the tenant details to proceed
        </Text>
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
            onChangeText={(text) => {
              setFirstName(text);
              setResidentName(`${text} ${lastName}`.trim());
            }}
          />
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.fieldLabel}>Last name</Text>
          <TextInput
            style={styles.datePickerInputFull}
            placeholder="Enter last name"
            placeholderTextColor="#8A8D93"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              setResidentName(`${firstName} ${text}`.trim());
            }}
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
          onChangeText={(text) => {
            setResidentEmail(text);
            if (emailError) validateEmail(text, true);
          }}
          onBlur={() => validateEmail(residentEmail, true)}
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
            onChangeText={(text) => {
              setResidentPhone(text);
              if (phoneError) validatePhone(text, true);
            }}
            onBlur={() => validatePhone(residentPhone, true)}
          />
        </View>
        {phoneError ? <Text style={styles.fieldErrorText}>{phoneError}</Text> : null}
      </View>
    </View>
  );

  // Pay Administration Charge Screen (Images 4 & 5)
  const renderPayAdminCharge = () => {
    const numRent = Number(rentAmount.replace(/,/g, '')) || 1500000;
    const adminFee = Math.round(numRent * 0.01);

    return (
      <View style={styles.content}>
        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
          </View>
          <Text style={styles.progressText}>Page 3 of 3</Text>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionMainTitle}>Pay Administration Charge</Text>
          <Text style={styles.sectionSubtitle}>
            Pay the administration charge of this tenancy to have premium access.
          </Text>
        </View>

        {/* Payment Summary Box */}
        <View style={styles.paySummaryCard}>
          <Text style={styles.paySummaryHeader}>Payment Summary</Text>

          <View style={styles.paySummaryRow}>
            <Text style={styles.paySummaryLabel}>Tenancy Value</Text>
            <Text style={styles.paySummaryVal}>
              ₦{numRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.paySummaryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.paySummaryLabel}>Administrative Fee (1%)</Text>
              <SymbolView
                name={{ ios: 'info.circle', android: 'info', web: 'info' }}
                size={14}
                tintColor="#8A8D93"
              />
            </View>
            <Text style={styles.paySummaryVal}>
              ₦{adminFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Screen 5: Confirm Details (Image 2)
  const renderReviewSubmit = () => {
    const numRent = Number(rentAmount.replace(/,/g, '')) || 1270000;
    const adminFee = Math.round(numRent * 0.1); // 10% charge representation matching mockup
    const customFeeNum = customFeeAmount ? Number(customFeeAmount.replace(/,/g, '')) : 300000;

    return (
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
          <Text style={styles.sectionMainTitle}>Confirm Details</Text>
          <Text style={styles.sectionSubtitle}>
            Confirm all details are correct before generating the tenancy agreement.
          </Text>
        </View>

        {/* Property Details Card */}
        <View style={styles.reviewSectionCard}>
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewHeader}>Property Details</Text>
            <TouchableOpacity onPress={() => setWizardStep(0)}>
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
            <TouchableOpacity onPress={() => setWizardStep(1)}>
              <Text style={styles.editLinkText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewItemRow}>
            <Text style={styles.reviewLabel}>Name</Text>
            <Text style={styles.reviewValue}>
              {residentName || (firstName ? `${firstName} ${lastName}`.trim() : 'Saad Bashar')}
            </Text>
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

        {/* Payments Card */}
        <View style={styles.reviewSectionCard}>
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewHeader}>Payments</Text>
            <TouchableOpacity onPress={() => setWizardStep(2)}>
              <Text style={styles.editLinkText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewItemRow}>
            <Text style={styles.reviewLabel}>Rent</Text>
            <Text style={styles.reviewValue}>NGN {numRent.toLocaleString()}</Text>
          </View>

          <View style={styles.reviewItemRow}>
            <Text style={styles.reviewLabel}>Administrative Charge (1%)</Text>
            <Text style={styles.reviewValue}>NGN {adminFee.toLocaleString()}</Text>
          </View>

          <View style={styles.reviewItemRow}>
            <Text style={styles.reviewLabel}>Deposit Fee</Text>
            <Text style={styles.reviewValue}>NGN {customFeeNum.toLocaleString()}</Text>
          </View>

          <View style={styles.reviewItemRow}>
            <Text style={styles.reviewLabel}>Occupiers' Liability Insurance</Text>
            <Text style={styles.reviewValue}>NGN 5,000</Text>
          </View>

          <View style={styles.reviewItemRow}>
            <Text style={styles.reviewLabel}>Rent Duration (in years)</Text>
            <Text style={styles.reviewValue}>
              {rentDuration || 1} {rentDuration === 1 ? 'year' : 'years'}
            </Text>
          </View>
        </View>

        {/* Bottom Info Banner */}
        <View style={[styles.infoBanner, { marginTop: 16 }]}>
          <View style={styles.infoIconWrapper}>
            <SymbolView
              name={{ ios: 'info.circle', android: 'info', web: 'info' }}
              size={18}
              tintColor="#D87C24"
            />
          </View>
          <Text style={styles.tenancyInfoText}>
            A 1% adminstration charge applies to every new tenancy created and any existing tenancy
            that is under <Text style={{ fontWeight: 'bold', color: '#1A1C1E' }}>1 month.</Text>
          </Text>
        </View>
      </View>
    );
  };

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
        {/* Top Toast Banner for Recorded Tenancy (Image 3) */}
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
              {steps[wizardStep] === 'pay' && renderPayAdminCharge()}
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
                      ? (isExistingTenancy ? 'Record Tenant' : 'Generate Agreement') 
                      : steps[wizardStep] === 'pay' 
                        ? `Pay ₦${Math.round((Number(rentAmount.replace(/,/g, '')) || 1500000) * 0.01).toLocaleString()} →`
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
                key={prop.id || index}
                style={styles.sheetItemRow}
                onPress={() => selectPropertyFromSheet(prop)}
                activeOpacity={0.8}
              >
                {prop.imageUrl ? (
                  <Image
                    source={{ uri: prop.imageUrl }}
                    style={styles.propertyThumbLarge}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.propertyThumbLargePlaceholder}>
                    <SymbolView
                      name={{ ios: 'building.2.fill', android: 'apartment', web: 'apartment' }}
                      size={24}
                      tintColor="#D87C24"
                    />
                  </View>
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
            {['Caution Deposit', 'Service Charge', 'Legal Fee', 'Agency Fee', 'Maintenance Fee', 'Utility Fee', 'Other'].map((fee, idx) => (
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
  propertyThumbPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE3C6',
  },
  propertyThumbLargePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE3C6',
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
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
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
  tabBoxCard: {
    width: 100,
    height: 96,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBoxActive: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE3C6',
  },
  tabBoxInactive: {
    backgroundColor: '#FAFAFA',
    borderColor: '#EBE6DC',
  },
  tabBoxText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
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
    borderColor: '#C7C9CC',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#FFFDF9',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  uploadMainText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#4A4D52',
    fontWeight: '700',
  },
  uploadSubText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
  },
  deleteFileBtnSquare: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    borderRadius: 12,
    gap: 12,
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

  // Payment Summary & Toast Styles
  paySummaryCard: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    marginTop: 12,
  },
  paySummaryHeader: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#D87C24',
  },
  paySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paySummaryLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#4A4D52',
  },
  paySummaryVal: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  topToastContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#D87C24',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  toastCheckSquare: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    flex: 1,
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Tenant Profile styles
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  nameCol: {
    flex: 1,
    gap: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phoneCountryBox: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  flagCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  phoneInputFlex: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#1A1C1E',
  },
  fieldErrorText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },

  // Custom Fee Card & Stepper styles
  customFeeCardBox: {
    backgroundColor: '#F8F6F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  customFeeDeleteBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 4,
  },
  stepperBtnPlusSquare: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomFeeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
    alignSelf: 'flex-start',
  },
  addCustomFeeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#D87C24',
  },
  flagCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
  },
  sheetOptionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetOptionText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1C1E',
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFE3C6',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  infoIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenancyInfoText: {
    flex: 1,
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
    lineHeight: 16,
  },
});
