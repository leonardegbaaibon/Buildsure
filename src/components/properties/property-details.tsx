import React, { useMemo, useState } from 'react';
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
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { WebView } from 'react-native-webview';
import { useAppSelector } from '@/store/hooks';
import { getGoogleStaticMapUrl, getGoogleMapsUrl } from '@/utils/google-maps-service';
import { UnitDetails } from './unit-details';

interface UnitItem {
  id: string;
  unitIdentifier?: string;
  status: 'occupied' | 'vacant';
}

interface PropertyDetailsProps {
  propertyId?: string;
  onClose: () => void;
  onOpenMenu: () => void;
  onCreateTenancyPress?: () => void;
}

export default function PropertyDetails({ propertyId, onClose, onOpenMenu, onCreateTenancyPress }: PropertyDetailsProps) {
  const { width } = useWindowDimensions();
  const unitBoxWidth = (width - 48 - 20) / 3;
  const selectedProperty = useAppSelector((state) => state.properties.selectedProperty);
  const propertyDetailStatus = useAppSelector((state) => state.properties.propertyDetailStatus);
  const [selectedUnitForDetail, setSelectedUnitForDetail] = useState<{ id: string; unitIdentifier?: string } | null>(null);
  const [isFullScreenMapVisible, setIsFullScreenMapVisible] = useState(false);
  const [mapMode, setMapMode] = useState<'hybrid' | 'satellite' | 'standard'>('hybrid');

  const isMatchingProperty = !propertyId || (selectedProperty && selectedProperty.id === propertyId);
  const isLoading = propertyDetailStatus === 'loading' || !selectedProperty || !isMatchingProperty;

  const titleText = isMatchingProperty
    ? selectedProperty?.propertyName || (selectedProperty as any)?.title || 'Property Details'
    : 'Property Details';

  const fullAddress = useMemo(() => {
    if (!selectedProperty) return '12, Close 9, His Grace Pavilion Estate, Wumba, Apo, FCT';
    const addressParts = [
      selectedProperty.streetAddress || (selectedProperty as any).street_address || (selectedProperty as any).street || (selectedProperty as any).addressLine1,
      selectedProperty.apartmentSuiteFloor || (selectedProperty as any).suite || (selectedProperty as any).unit,
      selectedProperty.city || (selectedProperty as any).town,
      selectedProperty.state || (selectedProperty as any).region
    ].filter(Boolean);

    const addr = addressParts.length > 0
      ? addressParts.join(', ')
      : ((selectedProperty as any).address && (selectedProperty as any).address !== 'Address not specified'
          ? (selectedProperty as any).address
          : (selectedProperty as any).formattedAddress || (selectedProperty as any).location || '12, Close 9, His Grace Pavilion Estate, Wumba, Apo, FCT');

    return addr;
  }, [selectedProperty]);

  const coordinates = useMemo(() => {
    if (selectedProperty?.latitude && selectedProperty?.longitude) {
      return { lat: Number(selectedProperty.latitude), lng: Number(selectedProperty.longitude) };
    }
    const addr = fullAddress.toLowerCase();
    if (addr.includes('lagos') || addr.includes('ikeja') || addr.includes('lekki') || addr.includes('ikoyi')) {
      if (addr.includes('lekki')) return { lat: 6.4474, lng: 3.4842 };
      if (addr.includes('ikeja')) return { lat: 6.5956, lng: 3.3488 };
      if (addr.includes('ikoyi')) return { lat: 6.4549, lng: 3.4357 };
      if (addr.includes('victoria island') || addr.includes('vi')) return { lat: 6.4281, lng: 3.4219 };
      return { lat: 6.5244, lng: 3.3792 };
    }
    if (addr.includes('apo') || addr.includes('wumba')) return { lat: 8.9836, lng: 7.4984 };
    if (addr.includes('wuse')) return { lat: 9.0732, lng: 7.4647 };
    if (addr.includes('maitama')) return { lat: 9.0882, lng: 7.4934 };
    if (addr.includes('gwarinpa')) return { lat: 9.1121, lng: 7.4082 };
    if (addr.includes('asokoro')) return { lat: 9.0436, lng: 7.5258 };
    if (addr.includes('guzape')) return { lat: 9.0189, lng: 7.5147 };
    if (addr.includes('jabi') || addr.includes('utako')) return { lat: 9.0747, lng: 7.4258 };
    return { lat: 9.0765, lng: 7.3986 };
  }, [selectedProperty, fullAddress]);

  const getMapHtmlContent = (interactive: boolean, zoom: number, mode: 'hybrid' | 'satellite' | 'standard') => {
    const { lat, lng } = coordinates;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { -webkit-touch-callout: none; -webkit-user-select: none; margin: 0; padding: 0; }
          body, html, #map { width: 100%; height: 100%; background: #1A1C1E; touch-action: none; }
          .custom-marker {
            background: #D87C24;
            border: 3px solid #FFFFFF;
            width: 36px;
            height: 36px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(216, 124, 36, 0.65);
          }
          .marker-dot {
            background: #FFFFFF;
            width: 10px;
            height: 10px;
            border-radius: 5px;
          }
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 3px 12px rgba(0,0,0,0.25) !important;
            border-radius: 10px !important;
            overflow: hidden;
            margin-right: 16px !important;
            margin-bottom: 24px !important;
          }
          .leaflet-control-zoom-in, .leaflet-control-zoom-out {
            background-color: #FFFFFF !important;
            color: #1A1C1E !important;
            width: 40px !important;
            height: 40px !important;
            line-height: 40px !important;
            font-size: 20px !important;
            font-weight: bold !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            center: [${lat}, ${lng}],
            zoom: ${zoom},
            zoomControl: ${interactive},
            attributionControl: false,
            dragging: ${interactive},
            touchZoom: ${interactive},
            doubleClickZoom: ${interactive},
            scrollWheelZoom: ${interactive},
            boxZoom: ${interactive},
            tap: ${interactive}
          });

          ${
            mode === 'satellite'
              ? `
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                  maxZoom: 19
                }).addTo(map);
              `
              : mode === 'hybrid'
              ? `
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                  maxZoom: 19
                }).addTo(map);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
                  maxZoom: 19,
                  subdomains: 'abcd'
                }).addTo(map);
              `
              : `
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                  maxZoom: 19,
                  subdomains: 'abcd'
                }).addTo(map);
              `
          }

          var icon = L.divIcon({
            className: '',
            html: '<div class="custom-marker"><div class="marker-dot"></div></div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });
          L.marker([${lat}, ${lng}], { icon: icon }).addTo(map);
        </script>
      </body>
      </html>
    `;
  };

  const previewMapHtml = useMemo(() => getMapHtmlContent(false, 16, mapMode), [coordinates, mapMode]);
  const fullScreenMapHtml = useMemo(() => getMapHtmlContent(true, 17, mapMode), [coordinates, mapMode]);

  const unitsList = useMemo(() => {
    if (selectedProperty?.units && Array.isArray(selectedProperty.units)) {
      return selectedProperty.units.map((u: any) => ({
        id: u.id,
        unitIdentifier: u.unitIdentifier || u.id || 'Unit',
        status: u.isOccupied || u.occupied ? 'occupied' : 'vacant',
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D87C24" />
          <Text style={styles.loadingText}>Loading property details...</Text>
        </View>
      ) : (
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

        {/* Google Maps Live Preview Card */}
        <TouchableOpacity
          style={styles.googleMapCard}
          onPress={() => setIsFullScreenMapVisible(true)}
          activeOpacity={0.92}
        >
          <View style={styles.googleMapWebViewContainer} pointerEvents="none">
            <WebView
              key={`preview-map-${mapMode}`}
              source={{ html: previewMapHtml }}
              style={styles.googleMapImage}
              scrollEnabled={false}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>

          {/* Live View Layer Badge */}
          <View style={styles.mapLiveBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.mapLiveBadgeText}>Live View</Text>
          </View>

          {/* Expand Fullscreen Pill Badge */}
          <View style={styles.mapExpandToggleBadge}>
            <SymbolView
              name={{
                ios: 'arrow.up.left.and.arrow.down.right',
                android: 'fullscreen',
                web: 'fullscreen',
              }}
              size={13}
              tintColor="#D87C24"
              weight="bold"
            />
            <Text style={styles.mapExpandToggleText}>Fullscreen</Text>
          </View>

          {/* Open External Google Maps Badge */}
          <TouchableOpacity
            style={styles.googleMapOverlayBadge}
            onPress={(e) => {
              e.stopPropagation();
              const url = getGoogleMapsUrl(fullAddress, coordinates.lat, coordinates.lng);
              Linking.openURL(url).catch(() => {});
            }}
            activeOpacity={0.8}
          >
            <SymbolView
              name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
              size={13}
              tintColor="#D87C24"
            />
            <Text style={styles.googleMapBadgeText}>Google Maps ↗</Text>
          </TouchableOpacity>
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
                  <TouchableOpacity
                    key={unit.id}
                    style={[
                      styles.unitBox,
                      { width: unitBoxWidth },
                      isOccupied ? styles.unitBoxOccupied : styles.unitBoxVacant,
                    ]}
                    onPress={() => setSelectedUnitForDetail({ id: unit.id, unitIdentifier: unit.unitIdentifier || unit.id })}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.unitIdText,
                        isOccupied ? styles.unitIdTextOccupied : styles.unitIdTextVacant,
                      ]}
                    >
                      {unit.unitIdentifier || unit.id}
                    </Text>
                    <Text
                      style={[
                        styles.unitStatusText,
                        isOccupied ? styles.unitStatusTextOccupied : styles.unitStatusTextVacant,
                      ]}
                    >
                      {isOccupied ? 'Occupied' : 'Vacant'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      )}

      {/* Fullscreen Interactive Map Modal */}
      <Modal
        visible={isFullScreenMapVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsFullScreenMapVisible(false)}
      >
        <SafeAreaView style={styles.fullScreenMapSafeArea}>
          <View style={styles.fullScreenMapContainer}>
            {/* Interactive Leaflet WebView with full 2-finger zoom & drag */}
            <WebView
              key={`fullscreen-map-${mapMode}`}
              source={{ html: fullScreenMapHtml }}
              style={styles.fullScreenWebView}
              scrollEnabled={false}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={false}
            />

            {/* Floating Top Header Bar */}
            <View style={styles.fullScreenMapHeader}>
              <TouchableOpacity
                style={styles.fullScreenCloseBtn}
                onPress={() => setIsFullScreenMapVisible(false)}
                activeOpacity={0.8}
              >
                <SymbolView
                  name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                  size={18}
                  tintColor="#1A1C1E"
                  weight="bold"
                />
              </TouchableOpacity>
              <View style={styles.fullScreenTitleCard}>
                <Text style={styles.fullScreenPropertyTitle} numberOfLines={1}>
                  {titleText}
                </Text>
                <Text style={styles.fullScreenPropertyAddress} numberOfLines={1}>
                  {fullAddress}
                </Text>
              </View>
            </View>

            {/* Floating Mode Switcher Pills */}
            <View style={styles.fullScreenModeSwitcher}>
              <TouchableOpacity
                style={[styles.modePill, mapMode === 'hybrid' && styles.modePillActive]}
                onPress={() => setMapMode('hybrid')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modePillText, mapMode === 'hybrid' && styles.modePillTextActive]}>
                  🛰️ Hybrid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modePill, mapMode === 'satellite' && styles.modePillActive]}
                onPress={() => setMapMode('satellite')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modePillText, mapMode === 'satellite' && styles.modePillTextActive]}>
                  🌍 Satellite
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modePill, mapMode === 'standard' && styles.modePillActive]}
                onPress={() => setMapMode('standard')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modePillText, mapMode === 'standard' && styles.modePillTextActive]}>
                  🗺️ Map
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Floating Google Maps Button */}
            <View style={styles.fullScreenBottomBar}>
              <TouchableOpacity
                style={styles.fullScreenExternalBtn}
                onPress={() => {
                  const url = getGoogleMapsUrl(fullAddress, coordinates.lat, coordinates.lng);
                  Linking.openURL(url).catch(() => {});
                }}
                activeOpacity={0.85}
              >
                <SymbolView
                  name={{ ios: 'map.fill', android: 'map', web: 'map' }}
                  size={16}
                  tintColor="#FFFFFF"
                  weight="bold"
                />
                <Text style={styles.fullScreenExternalBtnText}>Open in Google Maps App ↗</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Rental Unit Details Modal */}
      {selectedUnitForDetail && (
        <UnitDetails
          visible={!!selectedUnitForDetail}
          propertyId={selectedProperty?.id || ''}
          propertyTitle={titleText}
          unitId={selectedUnitForDetail.id}
          unitIdentifier={selectedUnitForDetail.unitIdentifier}
          onClose={() => setSelectedUnitForDetail(null)}
          onCreateTenancy={() => {
            setSelectedUnitForDetail(null);
            if (onCreateTenancyPress) {
              onCreateTenancyPress();
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#8A8D93',
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
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    backgroundColor: '#FAF7F2',
    position: 'relative',
    marginTop: 8,
  },
  googleMapWebViewContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  googleMapImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF7F2',
  },
  mapLiveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(26, 28, 30, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  mapLiveBadgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mapExpandToggleBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  mapExpandToggleText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  googleMapOverlayBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleMapBadgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  fullScreenMapSafeArea: {
    flex: 1,
    backgroundColor: '#1A1C1E',
  },
  fullScreenMapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1A1C1E',
  },
  fullScreenWebView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1C1E',
  },
  fullScreenMapHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
  },
  fullScreenModeSwitcher: {
    position: 'absolute',
    top: 80,
    left: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 28, 30, 0.88)',
    borderRadius: 20,
    padding: 3,
    gap: 4,
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  modePillActive: {
    backgroundColor: '#D87C24',
  },
  modePillText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#A0A5AB',
  },
  modePillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
  },
  fullScreenCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBE6DC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fullScreenTitleCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  fullScreenPropertyTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  fullScreenPropertyAddress: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#8A8D93',
    marginTop: 2,
  },
  fullScreenBottomBar: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  fullScreenExternalBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D87C24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#D87C24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  fullScreenExternalBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
