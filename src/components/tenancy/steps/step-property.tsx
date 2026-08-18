import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

export interface PropertyOption {
  id: string;
  title: string;
  address: string;
  imageUrl?: string;
}

export interface UnitOption {
  id: string;
  unitIdentifier?: string;
  status?: 'vacant' | 'occupied';
}

export interface StepPropertyProps {
  progressBarWidth: any;
  currentPageNumber: number;
  totalPages: number;
  selectedProperty: PropertyOption | null;
  propertyUnits: UnitOption[];
  selectedUnit: string | null;
  isLoadingUnits: boolean;
  onOpenPropertySheet: () => void;
  onSelectUnit: (unit: UnitOption) => void;
}

export function StepProperty({
  progressBarWidth,
  currentPageNumber,
  totalPages,
  selectedProperty,
  propertyUnits,
  selectedUnit,
  isLoadingUnits,
  onOpenPropertySheet,
  onSelectUnit,
}: StepPropertyProps) {
  const { width } = useWindowDimensions();
  const unitBoxWidth = (width - 48 - 20) / 3;

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
            onPress={onOpenPropertySheet}
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
            onPress={onOpenPropertySheet}
            activeOpacity={0.7}
          >
            {selectedProperty.imageUrl ? (
              <Image
                source={{ uri: selectedProperty.imageUrl }}
                style={styles.propertyThumb}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../../../../assets/images/apo_wumba.png')}
                style={styles.propertyThumb}
                resizeMode="cover"
              />
            )}
            <View style={styles.selectedPropertyInfo}>
              <Text style={styles.propertyCardTitle}>{selectedProperty.title}</Text>
              {!!selectedProperty.address && (
                <Text style={styles.propertyCardAddress} numberOfLines={2}>
                  {selectedProperty.address}
                </Text>
              )}
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
            A 1% adminstration charge applies to every new tenancy created and any existing tenancy that is under{' '}
            <Text style={{ fontWeight: 'bold', color: '#1A1C1E' }}>1 month.</Text>
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
                    onPress={() => onSelectUnit(unit)}
                    activeOpacity={isOccupied ? 1 : 0.7}
                  >
                    <Text style={[styles.unitIdText, textStyle]}>
                      {unit.unitIdentifier || unit.id}
                    </Text>
                    <Text style={[styles.unitStatusText, statusStyle]}>
                      {isOccupied ? 'Occupied' : 'Vacant'}
                    </Text>

                    {isSelected && (
                      <View style={styles.unitCheckBadge}>
                        <SymbolView
                          name={{
                            ios: 'checkmark.circle.fill',
                            android: 'check_circle',
                            web: 'check_circle',
                          }}
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
  formGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 8,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dropdownPlaceholder: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#8A8D93',
  },
  selectedPropertyCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    marginBottom: 12,
  },
  propertyThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5EFE6',
  },
  propertyThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFF4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedPropertyInfo: {
    flex: 1,
    marginRight: 8,
  },
  propertyCardTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 3,
  },
  propertyCardAddress: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
    lineHeight: 16,
  },
  tenancyInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F5F0',
    borderWidth: 1,
    borderColor: '#EFEAE2',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  tenancyInfoIconBg: {
    width: 20,
    height: 20,
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
  unitsSection: {
    marginTop: 8,
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
  },
  unitBox: {
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unitBoxVacant: {
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
  },
  unitBoxOccupied: {
    borderColor: '#EBE6DC',
    backgroundColor: '#F8F9FA',
    opacity: 0.6,
  },
  unitBoxSelected: {
    borderColor: '#FFA726',
    backgroundColor: '#FFF9F0',
  },
  unitIdText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  unitIdTextVacant: {
    color: '#1A1C1E',
  },
  unitIdTextOccupied: {
    color: '#8A8D93',
  },
  unitIdTextSelected: {
    color: '#D87C24',
  },
  unitStatusText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
  },
  unitStatusTextVacant: {
    color: '#2E7D32',
  },
  unitStatusTextOccupied: {
    color: '#8A8D93',
  },
  unitStatusTextSelected: {
    color: '#D87C24',
  },
  unitCheckBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});
