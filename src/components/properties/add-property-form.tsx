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
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { AppBottomSheet } from '@/components/bottom-sheet';
import { SegmentedControl } from '@/components/ui/segmented-control';
import * as ImagePicker from 'expo-image-picker';

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
  const { width } = useWindowDimensions();

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

  // Real image picking
  const handlePickImage = async () => {
    if (uploadedImages.length >= 2) {
      Alert.alert('Limit Reached', 'You can upload up to 2 photos.');
      return;
    }
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access gallery is required to upload property images.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadedImages([...uploadedImages, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Upload Error', 'An error occurred while picking the image.');
    }
  };

  // Handle Proceed submission
  const handleProceed = () => {
    if (!formName.trim() || !formAddress.trim() || !formCity.trim() || !formState.trim()) {
      Alert.alert('Required Fields', 'Please fill in all fields marked with an asterisk (*)');
      return;
    }

    if (unitType === 'single') {
      if (!singleUnitName.trim()) {
        Alert.alert('Required Field', 'Please enter a Unit Number or Name');
        return;
      }
    } else {
      const emptyUnits = multipleUnits.some(u => !u.name.trim());
      if (emptyUnits) {
        Alert.alert('Required Field', 'Please enter a Unit Number or Name for all units');
        return;
      }
    }

    const isMultiple = unitType === 'multiple';
    const newProperty: PropertyItem = {
      id: 'property-' + Date.now(),
      title: formName,
      address: formAddress,
      type: isMultiple ? 'multiple' : 'single',
      unitsCount: isMultiple ? multipleUnits.length : 1,
      occupiedCount: isMultiple ? Math.max(1, Math.floor(multipleUnits.length * 0.6)) : 1,
      hasImage: uploadedImages.length > 0,
    };

    onProceed(newProperty);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
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
        <Text style={styles.headerTitle}>Add Property</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollContent}>
        {/* Section Title */}
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
          onPress={handleProceed}
          activeOpacity={0.8}
        >
          <Text style={styles.formProceedBtnText}>Proceed</Text>
        </TouchableOpacity>
      </View>

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
    color: '#1A1C1E',
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
});
