import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { AppBottomSheet } from '@/components/bottom-sheet';
import { SegmentedControl } from '@/components/ui/segmented-control';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useToast } from '@/components/ui/toast';
import { useAppDispatch } from '@/store/hooks';
import { createProperty, fetchProperties, addLocalProperty } from '@/store/slices/property-slice';
import { CreatePropertyPayload } from '@/types/property';

export interface PropertyItem {
  id: string;
  title: string;
  address: string;
  type: 'multiple' | 'single';
  unitsCount?: number;
  occupiedCount?: number;
  hasImage?: boolean;
}

interface AddPropertyFormProps {
  onClose: () => void;
  onProceed: (newProperty: PropertyItem) => void;
}

export default function AddPropertyForm({ onClose, onProceed }: AddPropertyFormProps) {
  // Wizard Step state: 1 = Property Details, 2 = Upload Land Documents
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const dispatch = useAppDispatch();

  // Form states
  const [formType, setFormType] = useState('Single Family Home');
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formAge, setFormAge] = useState('Above 7 years');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('FCT');
  const [isStatePickerVisible, setIsStatePickerVisible] = useState(false);

  // Unit configurations
  const [unitType, setUnitType] = useState<'single' | 'multiple'>('single');
  
  // Single Unit states
  const [singleUnitName, setSingleUnitName] = useState('');
  const [singleUnitBedrooms, setSingleUnitBedrooms] = useState(1);
  const [singleUnitBathrooms, setSingleUnitBathrooms] = useState(1);
  
  // Multiple Units states
  const [multipleUnits, setMultipleUnits] = useState<{ id: string; name: string; bedrooms: number; bathrooms: number; }[]>([
    { id: 'unit-1', name: '', bedrooms: 1, bathrooms: 1 }
  ]);

  // Uploaded images state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Land document upload state
  const [landDocument, setLandDocument] = useState<{ name: string; uri: string; size?: number } | null>(null);

  // Real image picking
  const handlePickImage = async () => {
    if (uploadedImages.length >= 2) {
      showToast('You can upload up to 2 photos.', 'error');
      return;
    }
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast('Permission to access gallery is required to upload property images.', 'error');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadedImages([...uploadedImages, result.assets[0].uri]);
      }
    } catch {
      showToast('An error occurred while picking the image.', 'error');
    }
  };

  // Document picking logic (PDF, PNG, JPG)
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/png', 'image/jpeg'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setLandDocument({
          name: asset.name,
          uri: asset.uri,
          size: asset.size,
        });
      }
    } catch {
      showToast('An error occurred while picking the document.', 'error');
    }
  };

  const formatBytes = (bytes: number, decimals = 0) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Step 1 Validation & Proceed
  const handleProceedStep1 = () => {
    if (!formName.trim() || !formAddress.trim() || !formCity.trim() || !formState.trim()) {
      showToast('Please fill in all fields marked with an asterisk (*)', 'error');
      return;
    }

    if (unitType === 'single') {
      if (!singleUnitName.trim()) {
        showToast('Please enter a Unit Number or Name', 'error');
        return;
      }
    } else {
      const emptyUnits = multipleUnits.some(u => !u.name.trim());
      if (emptyUnits) {
        showToast('Please enter a Unit Number or Name for all units', 'error');
        return;
      }
    }

    // Advance to Document Upload step
    setStep(2);
  };

  // Step 2 Submission (Create Property)
  const handleSubmit = async () => {
    if (!landDocument) {
      showToast('Please upload supporting land documents.', 'error');
      return;
    }

    setIsSubmitting(true);

    const propertyTypeMap: Record<string, string> = {
      'Single Family Home': 'residential',
      'Apartment': 'residential',
      'Duplex': 'residential',
      'Commercial': 'commercial',
      'Industrial': 'industrial',
      'Land': 'land',
      'Other': 'other',
    };

    const propertyAgeMap: Record<string, string> = {
      'Below 1 year': 'below_1',
      '1 - 3 years': '1_to_3',
      '3 - 7 years': '3_to_7',
      'Above 7 years': 'above_7',
    };

    const unitsPayload =
      unitType === 'single'
        ? [
            {
              unitIdentifier: singleUnitName.trim() || 'Unit 1',
              bedrooms: singleUnitBedrooms,
              bathrooms: singleUnitBathrooms,
              isOccupied: false,
              monthlyRent: 0,
            },
          ]
        : multipleUnits.map((u) => ({
            unitIdentifier: u.name.trim() || 'Unit',
            bedrooms: u.bedrooms,
            bathrooms: u.bathrooms,
            isOccupied: false,
            monthlyRent: 0,
          }));

    const payload: CreatePropertyPayload = {
      propertyType: propertyTypeMap[formType] || 'other',
      customPropertyType: formType,
      propertyName: formName.trim(),
      streetAddress: formAddress.trim(),
      apartmentSuiteFloor: formUnit.trim() || undefined,
      city: formCity.trim(),
      state: formState.trim(),
      propertyAge: propertyAgeMap[formAge] || 'above_7',
      hasProofOfOwnership: true,
      hasProofOfInsurance: false,
      units: unitsPayload,
      images: uploadedImages,
    };

    const isMultiple = unitType === 'multiple';
    const localPropertyItem: PropertyItem = {
      id: 'property-' + Date.now(),
      title: formName.trim(),
      address: `${formAddress.trim()}, ${formCity.trim()}, ${formState.trim()}`,
      type: isMultiple ? 'multiple' : 'single',
      unitsCount: isMultiple ? multipleUnits.length : 1,
      occupiedCount: isMultiple ? Math.max(1, Math.floor(multipleUnits.length * 0.6)) : 1,
      hasImage: uploadedImages.length > 0,
    };

    try {
      // 1. Dispatch createProperty thunk to API
      await dispatch(createProperty(payload)).unwrap();
      // 2. Refresh properties list from server
      await dispatch(fetchProperties());
      showToast('Property created successfully!', 'success');
      setIsSubmitting(false);
      onProceed(localPropertyItem);
    } catch (err: any) {
      if (__DEV__) {
        console.warn('[AddPropertyForm] API creation failed:', err);
      }
      setIsSubmitting(false);
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to create property on server.';
      showToast(errorMessage, 'error');
    }
  };

  const handleHeaderBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onClose();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleHeaderBack}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={18}
            tintColor="#1A1C1E"
            weight="bold"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Property</Text>
      </View>

      {step === 1 ? (
        /* Step 1: Property Details Form */
        <>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollContent}>
            <View style={styles.formTitleContainer}>
              <Text style={styles.formMainTitle}>Property Details</Text>
              <Text style={styles.formSubtitle}>Add the details of your property below</Text>
            </View>

            {/* Select Property Type */}
            <View style={styles.formFieldContainer}>
              <Text style={styles.fieldLabel}>Select Property Type <Text style={styles.asterisk}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeSelectorRow}>
                {[
                  { label: 'Townhome', icon: 'house.circle' },
                  { label: 'Single Family Home', icon: 'house.fill' },
                  { label: 'Apartment', icon: 'building.2.fill' },
                  { label: 'Duplex/Triplex', icon: 'building' },
                  { label: 'Others', icon: 'building.columns' },
                ].map((item) => {
                  const isActive = formType === item.label;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.typeCard,
                        isActive ? styles.typeCardActive : styles.typeCardInactive,
                      ]}
                      onPress={() => setFormType(item.label)}
                      activeOpacity={0.7}
                    >
                      <SymbolView
                        name={{ ios: item.icon as any, android: 'home', web: 'home' }}
                        size={20}
                        tintColor={isActive ? '#D87C24' : '#8A8D93'}
                        weight={isActive ? 'bold' : 'regular'}
                      />
                      <Text style={[styles.typeCardText, isActive ? styles.typeCardTextActive : styles.typeCardTextInactive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Property Name */}
            <View style={styles.formFieldContainer}>
              <Text style={styles.fieldLabel}>Property Name <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter Property Name"
                placeholderTextColor="#A0A5AB"
                value={formName}
                onChangeText={setFormName}
              />
            </View>

            {/* Street Address */}
            <View style={styles.formFieldContainer}>
              <Text style={styles.fieldLabel}>Street Address <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter Property Address"
                placeholderTextColor="#A0A5AB"
                value={formAddress}
                onChangeText={setFormAddress}
              />
            </View>

            {/* Apartment Unit Suite */}
            <View style={styles.formFieldContainer}>
              <Text style={styles.fieldLabel}>Apartment, Unit Suite or Floor #</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g Floor 1"
                placeholderTextColor="#A0A5AB"
                value={formUnit}
                onChangeText={setFormUnit}
              />
            </View>

            {/* Upload Image Section */}
            <View style={styles.formFieldContainer}>
              <Text style={styles.fieldLabelSecondary}>Upload property image <Text style={styles.smallText}>(Max. 2 photos)</Text></Text>
              <View style={styles.uploadRow}>
                {uploadedImages.map((uri, idx) => (
                  <View key={idx} style={styles.uploadedPhotoContainer}>
                    <Image
                      source={{ uri: uri }}
                      style={styles.uploadedPhoto}
                    />
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() => {
                        setUploadedImages(uploadedImages.filter((_, i) => i !== idx));
                      }}
                      activeOpacity={0.7}
                    >
                      <SymbolView
                        name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                        size={18}
                        tintColor="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {uploadedImages.length < 2 && (
                  <TouchableOpacity
                    style={[
                      styles.uploadBox,
                      uploadedImages.length > 0 ? { flex: 1, height: 80 } : null
                    ]}
                    onPress={handlePickImage}
                    activeOpacity={0.7}
                  >
                    <SymbolView
                      name={{ ios: 'photo.badge.plus', android: 'add_photo_alternate', web: 'add_photo_alternate' }}
                      size={18}
                      tintColor="#D87C24"
                      weight="semibold"
                    />
                    <Text style={styles.uploadBoxText}>Add image(s)</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Age of Property */}
            <View style={styles.formFieldContainer}>
              <Text style={styles.fieldLabel}>Age of Property</Text>
              <View style={styles.ageGrid}>
                {[
                  'Less than 2 years',
                  'Less than 5 years',
                  'Less than 7 years',
                  'Above 7 years',
                ].map((age) => {
                  const isActive = formAge === age;
                  return (
                    <TouchableOpacity
                      key={age}
                      style={[
                        styles.ageBtn,
                        isActive ? styles.ageBtnActive : styles.ageBtnInactive,
                      ]}
                      onPress={() => setFormAge(age)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.ageBtnText, isActive ? styles.ageBtnTextActive : styles.ageBtnTextInactive]}>
                        {age}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Location details */}
            <View style={styles.locationRow}>
              {/* City */}
              <View style={styles.locationField}>
                <Text style={styles.fieldLabel}>City <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter City"
                  placeholderTextColor="#A0A5AB"
                  value={formCity}
                  onChangeText={setFormCity}
                />
              </View>

              {/* State */}
              <View style={styles.locationField}>
                <Text style={styles.fieldLabel}>State <Text style={styles.asterisk}>*</Text></Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setIsStatePickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownText}>{formState}</Text>
                  <SymbolView
                    name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow_drop_down' }}
                    size={16}
                    tintColor="#8A8D93"
                    weight="semibold"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Unit Type Selection Toggle */}
            <SegmentedControl
              values={['Single Unit', 'Multiple Units']}
              selectedIndex={unitType === 'single' ? 0 : 1}
              onChange={(index) => setUnitType(index === 0 ? 'single' : 'multiple')}
              width="auto"
              style={{ marginHorizontal: 24, marginBottom: 14 }}
            />

            {/* Optional helper text */}
            <Text style={styles.optionalHelperText}>
              The # beds, bathrooms and sizes are optional
            </Text>

            {/* Single Unit Details Card */}
            {unitType === 'single' && (
              <View style={{ marginHorizontal: 24, marginBottom: 14 }}>
                <View style={styles.unitCard}>
                  <View style={styles.unitCardHeader}>
                    <Text style={styles.fieldLabel}>Unit Number or Name <Text style={styles.asterisk}>*</Text></Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter Unit A"
                    placeholderTextColor="#A0A5AB"
                    value={singleUnitName}
                    onChangeText={setSingleUnitName}
                  />

                  {/* Bedroom Counter Row */}
                  <View style={styles.counterRow}>
                    <View style={styles.counterLabelContainer}>
                      <SymbolView
                        name={{ ios: 'bed.double.fill', android: 'king_bed', web: 'king_bed' }}
                        size={16}
                        tintColor="#8A8D93"
                      />
                      <Text style={styles.counterLabelText}># Bedroom</Text>
                    </View>
                    <View style={styles.counterControls}>
                      <TouchableOpacity
                        style={styles.counterBtnMinus}
                        onPress={() => setSingleUnitBedrooms(Math.max(0, singleUnitBedrooms - 1))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.counterBtnMinusText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterVal}>{singleUnitBedrooms}</Text>
                      <TouchableOpacity
                        style={styles.counterBtnPlus}
                        onPress={() => setSingleUnitBedrooms(singleUnitBedrooms + 1)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.counterBtnPlusText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Bathroom Counter Row */}
                  <View style={styles.counterRow}>
                    <View style={styles.counterLabelContainer}>
                      <SymbolView
                        name={{ ios: 'shower.fill', android: 'shower', web: 'shower' }}
                        size={16}
                        tintColor="#8A8D93"
                      />
                      <Text style={styles.counterLabelText}># Bathrooms</Text>
                    </View>
                    <View style={styles.counterControls}>
                      <TouchableOpacity
                        style={styles.counterBtnMinus}
                        onPress={() => setSingleUnitBathrooms(Math.max(0, singleUnitBathrooms - 1))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.counterBtnMinusText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterVal}>{singleUnitBathrooms}</Text>
                      <TouchableOpacity
                        style={styles.counterBtnPlus}
                        onPress={() => setSingleUnitBathrooms(singleUnitBathrooms + 1)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.counterBtnPlusText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Multiple Units Cards */}
            {unitType === 'multiple' && (
              <View style={{ marginHorizontal: 24, gap: 14, marginBottom: 14 }}>
                {multipleUnits.map((unit, index) => (
                  <View key={unit.id} style={styles.unitCard}>
                    {/* Delete Unit Header */}
                    <View style={styles.unitCardHeader}>
                      <Text style={styles.fieldLabel}>Unit Number or Name <Text style={styles.asterisk}>*</Text></Text>
                      <TouchableOpacity
                        style={styles.trashBtn}
                        onPress={() => {
                          const newUnits = multipleUnits.filter(u => u.id !== unit.id);
                          setMultipleUnits(newUnits);
                        }}
                        activeOpacity={0.7}
                      >
                        <SymbolView
                          name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                          size={18}
                          tintColor="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={styles.formInput}
                      placeholder="(i.e) Unit A"
                      placeholderTextColor="#A0A5AB"
                      value={unit.name}
                      onChangeText={(val) => {
                        const newUnits = [...multipleUnits];
                        newUnits[index] = { ...unit, name: val };
                        setMultipleUnits(newUnits);
                      }}
                    />

                    {/* Bedroom Counter Row */}
                    <View style={styles.counterRow}>
                      <View style={styles.counterLabelContainer}>
                        <SymbolView
                          name={{ ios: 'bed.double.fill', android: 'king_bed', web: 'king_bed' }}
                          size={16}
                          tintColor="#8A8D93"
                        />
                        <Text style={styles.counterLabelText}># Bedroom</Text>
                      </View>
                      <View style={styles.counterControls}>
                        <TouchableOpacity
                          style={styles.counterBtnMinus}
                          onPress={() => {
                            const newUnits = [...multipleUnits];
                            newUnits[index] = { ...unit, bedrooms: Math.max(0, unit.bedrooms - 1) };
                            setMultipleUnits(newUnits);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.counterBtnMinusText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterVal}>{unit.bedrooms}</Text>
                        <TouchableOpacity
                          style={styles.counterBtnPlus}
                          onPress={() => {
                            const newUnits = [...multipleUnits];
                            newUnits[index] = { ...unit, bedrooms: unit.bedrooms + 1 };
                            setMultipleUnits(newUnits);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.counterBtnPlusText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Bathroom Counter Row */}
                    <View style={styles.counterRow}>
                      <View style={styles.counterLabelContainer}>
                        <SymbolView
                          name={{ ios: 'shower.fill', android: 'shower', web: 'shower' }}
                          size={16}
                          tintColor="#8A8D93"
                        />
                        <Text style={styles.counterLabelText}># Bathrooms</Text>
                      </View>
                      <View style={styles.counterControls}>
                        <TouchableOpacity
                          style={styles.counterBtnMinus}
                          onPress={() => {
                            const newUnits = [...multipleUnits];
                            newUnits[index] = { ...unit, bathrooms: Math.max(0, unit.bathrooms - 1) };
                            setMultipleUnits(newUnits);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.counterBtnMinusText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterVal}>{unit.bathrooms}</Text>
                        <TouchableOpacity
                          style={styles.counterBtnPlus}
                          onPress={() => {
                            const newUnits = [...multipleUnits];
                            newUnits[index] = { ...unit, bathrooms: unit.bathrooms + 1 };
                            setMultipleUnits(newUnits);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.counterBtnPlusText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Add another unit button link */}
                <TouchableOpacity
                  style={styles.addUnitLinkBtn}
                  onPress={() => {
                    setMultipleUnits([
                      ...multipleUnits,
                      { id: 'unit-' + Date.now(), name: '', bedrooms: 1, bathrooms: 1 }
                    ]);
                  }}
                  activeOpacity={0.7}
                >
                  <SymbolView
                    name={{ ios: 'doc.badge.plus', android: 'note_add', web: 'note_add' }}
                    size={16}
                    tintColor="#D87C24"
                  />
                  <Text style={styles.addUnitLinkBtnText}>Add another unit</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions Bar */}
          <View style={styles.formBottomBar}>
            <TouchableOpacity
              style={styles.formBackBtn}
              onPress={onClose}
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
              style={styles.formProceedBtn}
              onPress={handleProceedStep1}
              activeOpacity={0.8}
            >
              <Text style={styles.formProceedBtnText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Step 2: Upload Land Documents Screen */
        <>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollContent}>
            <View style={styles.formTitleContainer}>
              <Text style={styles.formMainTitle}>Upload Land Documents</Text>
              <Text style={styles.formSubtitle}>Upload supporting documents</Text>
            </View>

            {/* Dashed Drop Zone */}
            <TouchableOpacity
              style={styles.dottedUploadZone}
              onPress={handlePickDocument}
              activeOpacity={0.8}
            >
              <View style={styles.folderIllustrationContainer}>
                <View style={styles.folderIllustration}>
                  {/* CSS Folder graphic matching the mockup */}
                  <View style={styles.folderBack} />
                  <View style={styles.folderPaper} />
                  <View style={styles.folderFront} />
                  <Text style={styles.plusSymbolTop}>+</Text>
                  <Text style={styles.plusSymbolBottom}>+</Text>
                </View>
              </View>
              <Text style={styles.clickToBrowseText}>Click to browse</Text>
              <Text style={styles.supportFormatText}>Support PDF, PNG or JPG (Max. 5MB)</Text>
            </TouchableOpacity>

            {/* Info Warning Card */}
            <View style={styles.infoBanner}>
              <SymbolView
                name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }}
                size={16}
                tintColor="#D87C24"
              />
              <Text style={styles.infoBannerText}>
                Please ensure all pages of the document are clearly visible and the signatures are legible before uploading.
              </Text>
            </View>

            {/* Uploaded Document details */}
            {landDocument && (
              <View style={styles.uploadedDocSection}>
                <Text style={styles.uploadedDocHeader}>Uploaded Document</Text>
                <View style={styles.docCard}>
                  <View style={styles.docCardLeft}>
                    <View style={styles.docIconBg}>
                      <SymbolView
                        name={{ ios: 'doc.text.fill', android: 'article', web: 'article' }}
                        size={20}
                        tintColor="#D87C24"
                      />
                    </View>
                    <View style={styles.docDetails}>
                      <Text style={styles.docName} numberOfLines={1}>
                        {landDocument.name}
                      </Text>
                      {landDocument.size && (
                        <Text style={styles.docSize}>
                          {formatBytes(landDocument.size)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.docDeleteBtn}
                    onPress={() => setLandDocument(null)}
                    activeOpacity={0.7}
                  >
                    <SymbolView
                      name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                      size={18}
                      tintColor="#EF4444"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions Bar */}
          <View style={styles.formBottomBar}>
            <TouchableOpacity
              style={styles.formBackBtn}
              onPress={() => setStep(1)}
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
              style={[
                styles.formSubmitBtn,
                (!landDocument || isSubmitting) && styles.formSubmitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!landDocument || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <SymbolView
                    name={{ ios: 'arrow.up.doc.fill', android: 'publish', web: 'publish' }}
                    size={16}
                    tintColor={landDocument ? '#FFFFFF' : '#8A8D93'}
                  />
                  <Text style={[
                    styles.formSubmitBtnText,
                    !landDocument && styles.formSubmitBtnTextDisabled,
                  ]}>
                    Submit Property
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* State Picker Bottom Sheet */}
      <AppBottomSheet
        visible={isStatePickerVisible}
        onClose={() => setIsStatePickerVisible(false)}
        title="Select State"
        options={[
          { label: 'FCT', onPress: () => setFormState('FCT') },
          { label: 'Lagos', onPress: () => setFormState('Lagos') },
          { label: 'Rivers', onPress: () => setFormState('Rivers') },
          { label: 'Enugu', onPress: () => setFormState('Enugu') },
          { label: 'Kano', onPress: () => setFormState('Kano') },
        ]}
      />
    </SafeAreaView>
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
  formScrollContent: {
    paddingBottom: 30,
  },
  formTitleContainer: {
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 20,
  },
  formMainTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  formSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#8A8D93',
    marginTop: 4,
  },
  formFieldContainer: {
    marginHorizontal: 24,
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 8,
  },
  fieldLabelSecondary: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 8,
  },
  smallText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8D93',
  },
  asterisk: {
    color: '#EF4444',
  },
  typeSelectorRow: {
    gap: 10,
    paddingRight: 24,
    paddingVertical: 2,
  },
  typeCard: {
    width: 90,
    height: 78,
    borderWidth: 1.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  typeCardActive: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE3C6',
  },
  typeCardInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
  },
  typeCardText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  typeCardActiveText: {
    color: '#D87C24',
  },
  typeCardInactiveText: {
    color: '#8A8D93',
  },
  typeCardTextActive: {
    color: '#D87C24',
  },
  typeCardTextInactive: {
    color: '#8A8D93',
  },
  formInput: {
    fontFamily: 'Satoshi-Regular',
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1A1C1E',
  },
  uploadBox: {
    height: 80,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    backgroundColor: '#FFFDF9',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadBoxText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#D87C24',
  },
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ageBtn: {
    width: '48%',
    height: 44,
    borderWidth: 1.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageBtnActive: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE3C6',
  },
  ageBtnInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
  },
  ageBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
  },
  ageBtnTextActive: {
    color: '#D87C24',
  },
  ageBtnTextInactive: {
    color: '#1A1C1E',
  },
  locationRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  locationField: {
    flex: 1,
  },
  dropdownTrigger: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '500',
  },
  formBottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EBE6DC',
    backgroundColor: '#FEFAF4',
    gap: 12,
    alignItems: 'center',
  },
  formBackBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formProceedBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFA726',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  formProceedBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionalHelperText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    marginHorizontal: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  unitCard: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
  },
  unitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trashBtn: {
    padding: 4,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  counterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterLabelText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtnMinus: {
    width: 28,
    height: 28,
    backgroundColor: '#FEFAF4',
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnMinusText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#8A8D93',
    fontWeight: '700',
  },
  counterVal: {
    fontFamily: 'Satoshi-Bold',
    width: 28,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  counterBtnPlus: {
    width: 28,
    height: 28,
    backgroundColor: '#FFA726',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnPlusText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addUnitLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  addUnitLinkBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#D87C24',
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadedPhotoContainer: {
    flex: 1,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    overflow: 'hidden',
    position: 'relative',
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },

  // Step 2 Upload Documents Screen Styling
  dottedUploadZone: {
    marginHorizontal: 24,
    marginTop: 10,
    height: 220,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFA726',
    borderStyle: 'dashed',
    backgroundColor: '#FFFDF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderIllustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  folderIllustration: {
    position: 'relative',
    width: 72,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderBack: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    width: 64,
    height: 48,
    backgroundColor: '#B57428',
    borderRadius: 6,
  },
  folderPaper: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFE3C6',
  },
  folderFront: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 72,
    height: 40,
    backgroundColor: '#D87C24',
    borderRadius: 6,
    transform: [{ skewX: '-10deg' }],
  },
  plusSymbolTop: {
    position: 'absolute',
    top: -12,
    right: 2,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B57428',
  },
  plusSymbolBottom: {
    position: 'absolute',
    bottom: -6,
    right: -8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B57428',
  },
  clickToBrowseText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 6,
  },
  supportFormatText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#8A8D93',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF5EC',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
    marginTop: 20,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoBannerText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
    flex: 1,
    lineHeight: 18,
  },
  uploadedDocSection: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  uploadedDocHeader: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 10,
  },
  docCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: '#FFE3C6',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  docCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docDetails: {
    gap: 4,
    flex: 1,
  },
  docName: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#1A1C1E',
  },
  docSize: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
  },
  docDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderColor: '#FEE4E2',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
  },
  formSubmitBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFA726',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  formSubmitBtnDisabled: {
    backgroundColor: '#FFE0B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  formSubmitBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formSubmitBtnTextDisabled: {
    color: '#8A8D93',
  },
});
