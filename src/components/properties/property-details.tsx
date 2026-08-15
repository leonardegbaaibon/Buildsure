import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useAppSelector } from '@/store/hooks';
import { getGoogleStaticMapUrl, getGoogleMapsUrl } from '@/utils/google-maps-service';

interface UnitItem {
  id: string;
  status: 'occupied' | 'vacant';
}

interface PropertyDetailsProps {
  onClose: () => void;
  onOpenMenu: () => void;
  onCreateTenancyPress?: () => void;
}

export default function PropertyDetails({ onClose, onOpenMenu, onCreateTenancyPress }: PropertyDetailsProps) {
  const { width } = useWindowDimensions();
  const unitBoxWidth = (width - 48 - 20) / 3;
  const selectedProperty = useAppSelector((state) => state.properties.selectedProperty);

  const titleText = selectedProperty?.propertyName || (selectedProperty as any)?.title || 'Property Details';

  const fullAddress = useMemo(() => {
    if (!selectedProperty) return 'Address not specified';
    if (selectedProperty.streetAddress) {
      return `${selectedProperty.streetAddress}${selectedProperty.city ? `, ${selectedProperty.city}` : ''}${selectedProperty.state ? `, ${selectedProperty.state}` : ''}`;
    }
    return (selectedProperty as any).address || 'Address not specified';
  }, [selectedProperty]);

  const unitsList = useMemo(() => {
    if (selectedProperty?.units && Array.isArray(selectedProperty.units)) {
      return selectedProperty.units.map((u: any) => ({
        id: u.unitIdentifier || u.id || 'Unit',
        status: u.isOccupied ? 'occupied' : 'vacant',
      }));
    }
    return [];
  }, [selectedProperty]);

  const rentsCollectedText = useMemo(() => {
    if (!selectedProperty?.units || selectedProperty.units.length === 0) return '₦0';
    const sum = selectedProperty.units.reduce((acc: number, u: any) => {
      if (u.isOccupied && u.monthlyRent) return acc + (Number(u.monthlyRent) * 12);
      return acc;
    }, 0);
    return sum > 0 ? `₦${sum.toLocaleString()}` : '₦0';
  }, [selectedProperty]);

  const rentsDueText = useMemo(() => {
    if (!selectedProperty?.units || selectedProperty.units.length === 0) return '₦0';
    const sum = selectedProperty.units.reduce((acc: number, u: any) => {
      if (!u.isOccupied && u.monthlyRent) return acc + Number(u.monthlyRent);
      return acc;
    }, 0);
    return sum > 0 ? `₦${sum.toLocaleString()}` : '₦0';
  }, [selectedProperty]);

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
        <Text style={styles.headerTitle} numberOfLines={1}>{titleText}</Text>
        <TouchableOpacity
          style={styles.headerRightMenu}
          onPress={(e) => {
            e.stopPropagation?.();
            onOpenMenu();
          }}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' } as const}
            size={18}
            tintColor="#D87C24"
            weight="bold"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsScrollContent}>
        {/* Main Image */}
        <View style={styles.detailsImageContainer}>
          {selectedProperty?.coverImage || (selectedProperty?.images && selectedProperty.images[0]?.imageUrl) ? (
            <Image
              source={{ uri: selectedProperty?.coverImage || selectedProperty?.images?.[0]?.imageUrl }}
              style={styles.detailsImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.detailsImage, { backgroundColor: '#FFF5EB', justifyContent: 'center', alignItems: 'center' }]}>
              <SymbolView
                name={{ ios: 'building.2.fill', android: 'apartment', web: 'apartment' }}
                size={48}
                tintColor="#D87C24"
              />
            </View>
          )}
        </View>

        {/* Address row with Google Maps trigger */}
        <TouchableOpacity
          style={styles.addressRow}
          onPress={() => {
            const url = getGoogleMapsUrl(
              fullAddress,
              selectedProperty?.latitude,
              selectedProperty?.longitude
            );
            Linking.openURL(url).catch(() => {});
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addressText} numberOfLines={2}>
            {fullAddress}
          </Text>
          <View style={styles.mapIconCircle}>
            <SymbolView
              name={{ ios: 'map', android: 'map', web: 'map' }}
              size={16}
              tintColor="#D87C24"
              weight="semibold"
            />
          </View>
        </TouchableOpacity>

        {/* Google Maps Preview Card */}
        <TouchableOpacity
          style={styles.googleMapCard}
          onPress={() => {
            const url = getGoogleMapsUrl(
              fullAddress,
              selectedProperty?.latitude,
              selectedProperty?.longitude
            );
            Linking.openURL(url).catch(() => {});
          }}
          activeOpacity={0.9}
        >
          <Image
            source={{
              uri: getGoogleStaticMapUrl(
                fullAddress,
                selectedProperty?.latitude,
                selectedProperty?.longitude
              ),
            }}
            style={styles.googleMapImage}
            resizeMode="cover"
          />
          <View style={styles.googleMapOverlayBadge}>
            <SymbolView
              name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
              size={14}
              tintColor="#D87C24"
            />
            <Text style={styles.googleMapBadgeText}>Open in Google Maps ↗</Text>
          </View>
        </TouchableOpacity>

        {/* Actions Row */}
        <View style={styles.detailsActionsRow}>
          <TouchableOpacity 
            style={styles.detailsBtnPrimary} 
            activeOpacity={0.8}
            onPress={onCreateTenancyPress}
          >
            <SymbolView
              name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
              size={16}
              tintColor="#1A1C1E"
              weight="bold"
            />
            <Text style={styles.detailsBtnPrimaryText}>Create Tenancy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.detailsBtnSecondary} activeOpacity={0.8}>
            <SymbolView
              name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
              size={16}
              tintColor="#D87C24"
              weight="bold"
            />
            <Text style={styles.detailsBtnSecondaryText}>Edit this Property</Text>
          </TouchableOpacity>
        </View>

        {/* Overview */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Overview</Text>
          
          <View style={styles.statsRow}>
            {/* Collected Card */}
            <View style={[styles.statCard, styles.orangeCard, styles.detailsStatCard]}>
              <Text style={styles.detailsCardValue}>{rentsCollectedText}</Text>
              <Text style={styles.detailsCardLabel}>Rents Collected</Text>
            </View>

            {/* Due Card */}
            <View style={[styles.statCard, styles.pinkCard, styles.detailsStatCard]}>
              <Text style={styles.detailsCardValue}>{rentsDueText}</Text>
              <Text style={styles.detailsCardLabelPink}>Rents Due</Text>
            </View>
          </View>
        </View>

        {/* Rental Units */}
        <View style={styles.detailsSection}>
          <View style={styles.unitsSectionHeader}>
            <Text style={styles.detailsSectionTitle}>Rental Units</Text>
            <Text style={styles.unitsCount}>{unitsList.length}</Text>
          </View>

          {/* Units Grid */}
          {unitsList.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Satoshi-Regular', fontSize: 13, color: '#8A8D93' }}>
                No units registered for this property.
              </Text>
            </View>
          ) : (
            <View style={styles.unitsGrid}>
              {unitsList.map((unit: any) => {
                const isOccupied = unit.status === 'occupied';
                return (
                  <View
                    key={unit.id}
                    style={[
                      styles.unitBox,
                      { width: unitBoxWidth },
                      isOccupied ? styles.unitBoxOccupied : styles.unitBoxVacant,
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitIdText,
                        isOccupied ? styles.unitIdTextOccupied : styles.unitIdTextVacant,
                      ]}
                    >
                      {unit.id}
                    </Text>
                    <Text
                      style={[
                        styles.unitStatusText,
                        isOccupied ? styles.unitStatusTextOccupied : styles.unitStatusTextVacant,
                      ]}
                    >
                      {isOccupied ? 'Occupied' : 'Vacant'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
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
  headerRightMenu: {
    position: 'absolute',
    right: 24,
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
  body: {
    flex: 1,
  },
  detailsScrollContent: {
    paddingBottom: 40,
  },
  detailsImageContainer: {
    marginHorizontal: 24,
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
  },
  detailsImage: {
    width: '100%',
    height: '100%',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 14,
    gap: 12,
    justifyContent: 'space-between',
  },
  addressText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#8A8D93',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  mapIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE3C6',
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsActionsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 20,
    gap: 12,
    marginBottom: 16,
  },
  detailsBtnPrimary: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFA726',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  detailsBtnPrimaryText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  detailsBtnSecondary: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFA726',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailsBtnSecondaryText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#D87C24',
  },
  detailsSection: {
    marginTop: 16,
  },
  detailsSectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  orangeCard: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE3C6',
  },
  greenCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  pinkCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFE3E3',
  },
  detailsStatCard: {
    minHeight: 90,
  },
  detailsCardValue: {
    fontFamily: 'Satoshi-Black',
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  detailsCardLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8D93',
    marginTop: 4,
  },
  detailsCardLabelPink: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#DB2777',
    marginTop: 4,
  },
  googleMapCard: {
    marginHorizontal: 24,
    marginTop: 10,
    marginBottom: 16,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBE6DC',
    position: 'relative',
  },
  googleMapImage: {
    width: '100%',
    height: '100%',
  },
  googleMapOverlayBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  googleMapBadgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#1A1C1E',
    fontWeight: '700',
  },
  unitsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  unitsCount: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    fontWeight: '600',
    color: '#8A8D93',
  },
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 24,
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
  },
  unitBoxOccupied: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE3C6',
  },
  unitBoxVacant: {
    backgroundColor: '#F8F9FA',
    borderColor: '#EBE6DC',
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
    color: '#8A8D93',
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
});
