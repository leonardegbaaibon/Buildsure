import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import { useToast } from '@/components/ui/toast';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { AppBottomSheet } from '@/components/bottom-sheet';
import {
  setTabBarHidden,
  setActiveTab as setGlobalActiveTab,
  subscribeShouldStartAddProperty,
  setShouldStartAddProperty,
  getProperties,
  setProperties as setGlobalProperties,
  subscribeProperties,
  PropertyItem,
} from '@/utils/user-store';
import { SegmentedControl } from '@/components/ui/segmented-control';
import AddPropertyForm from '@/components/properties/add-property-form';
import PropertyDetails from '@/components/properties/property-details';
import CreateTenancyFlow from '@/components/tenancy/create-tenancy-flow';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProperties, fetchPropertyById, deleteProperty, clearSelectedProperty } from '@/store/slices/property-slice';

export default function PropertiesScreen() {
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const reduxProperties = useAppSelector((state) => state.properties.properties);
  const reduxHeaderStats = useAppSelector((state) => state.properties.headerStats);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchProperties()).unwrap();
    } catch {
      // Handled in redux slice
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  // Dynamic list derived from Redux
  const displayProperties = reduxProperties;
  const [hasPropertiesOverride, setHasProperties] = useState<boolean | null>(null);
  const hasProperties = hasPropertiesOverride !== null ? hasPropertiesOverride : displayProperties.length > 0;
  
  // View states
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  
  // Toggle states
  const [activeSegment, setActiveSegment] = useState<'properties' | 'analytics'>('properties');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'drafts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activePropertyForMenu, setActivePropertyForMenu] = useState<any | null>(null);
  const [isCreateTenancyVisible, setIsCreateTenancyVisible] = useState(false);

  // Animated values
  const detailsAnim = useRef(new Animated.Value(width)).current;
  const addAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const categoryTabAnim = useRef(new Animated.Value(0)).current;

  // Manage visibility states during animation to avoid rendering offscreen component when not active
  const [renderDetails, setRenderDetails] = useState(false);
  const [renderAdd, setRenderAdd] = useState(false);

  // Cleanup tab bar visibility on unmount
  useEffect(() => {
    return () => {
      setTabBarHidden(false);
    };
  }, []);

  // Listen to global "Add Property" trigger from other screens (e.g. Home screen)
  useEffect(() => {
    const unsubscribe = subscribeShouldStartAddProperty((start) => {
      if (start) {
        setIsAddingProperty(true);
        // Reset trigger state immediately
        setShouldStartAddProperty(false);
      }
    });
    
    const unsubscribeProperties = subscribeProperties(() => {
      dispatch(fetchProperties());
    });

    return () => {
      unsubscribe();
      unsubscribeProperties();
    };
  }, []);

  // Trigger details screen slide animation
  useEffect(() => {
    if (selectedPropertyId) {
      setRenderDetails(true);
      setTabBarHidden(true);
      Animated.timing(detailsAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(detailsAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (!selectedPropertyId) {
          setRenderDetails(false);
          if (!isAddingProperty) {
            setTabBarHidden(false);
          }
        }
      });
    }
  }, [selectedPropertyId, width]);

  // Trigger add property screen slide animation
  useEffect(() => {
    if (isAddingProperty) {
      setRenderAdd(true);
      setTabBarHidden(true);
      Animated.timing(addAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(addAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (!isAddingProperty) {
          setRenderAdd(false);
          if (!selectedPropertyId) {
            setTabBarHidden(false);
          }
        }
      });
    }
  }, [isAddingProperty, width]);

  // Trigger Segment Control Sliding Background Pill and cross-fade
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [activeSegment]);

  // Trigger Category Tab sliding underline
  useEffect(() => {
    let toValue = 0;
    if (activeTab === 'pending') {
      toValue = 1;
    } else if (activeTab === 'drafts') {
      toValue = 2;
    }
    Animated.timing(categoryTabAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  // Handle plus click to open add screen
  const handlePlusPress = () => {
    setIsAddingProperty(true);
  };

  const handleAddPropertySuccess = () => {
    setIsAddingProperty(false);
    dispatch(fetchProperties());
  };

  const categoryTabWidth = (width - 48) / 3;

  return (
    <View style={styles.container}>
      {/* 1. Main Properties List View (Base Layer) */}
      <SafeAreaView
        style={styles.container}
        pointerEvents={(!selectedPropertyId && !isAddingProperty) ? 'auto' : 'none'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setGlobalActiveTab('home')}
            activeOpacity={0.7}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={18}
              tintColor="#1A1C1E"
              weight="bold"
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setHasProperties(!hasProperties)} activeOpacity={0.9}>
            <Text style={styles.headerTitle}>My Properties</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={18}
              tintColor="#8A8D93"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Anything on here"
              placeholderTextColor="#A0A5AB"
              clearButtonMode="while-editing"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.toLowerCase() === 'empty') {
                  setHasProperties(false);
                } else if (text.toLowerCase() === 'show' || text.toLowerCase() === 'properties') {
                  setHasProperties(true);
                }
              }}
            />
          </View>

          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
            <SymbolView
              name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
              size={18}
              tintColor="#1A1C1E"
              weight="semibold"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.plusButton} onPress={handlePlusPress} activeOpacity={0.7}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              size={20}
              tintColor="#1A1C1E"
              weight="bold"
            />
          </TouchableOpacity>
        </View>

        {hasProperties && displayProperties.length > 0 ? (
          <ScrollView 
            style={styles.body} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#D87C24"
                colors={['#D87C24']}
              />
            }
          >
            <TouchableOpacity onPress={() => setHasProperties(false)} activeOpacity={0.9}>
              <Text style={styles.sectionTitle}>Properties Summary</Text>
            </TouchableOpacity>

            {/* Stat Cards Row */}
            <View style={styles.statsRow}>
              {/* Total Properties Card */}
              <TouchableOpacity 
                style={[styles.statCard, styles.orangeCard]}
                onPress={() => {
                  if (displayProperties.length > 0) {
                    dispatch(fetchPropertyById(displayProperties[0].id));
                    setSelectedPropertyId(displayProperties[0].id);
                  }
                }}
                activeOpacity={0.9}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconCircle, styles.orangeIconCircle]}>
                    <SymbolView
                      name={{ ios: 'house.fill', android: 'home', web: 'home' }}
                      size={16}
                      tintColor="#D87C24"
                      weight="bold"
                    />
                  </View>
                  <Text style={styles.orangeCardLabel} numberOfLines={1}>Total Properties</Text>
                </View>
                <Text style={styles.cardValue}>
                  {reduxHeaderStats ? reduxHeaderStats.totalProperties.toLocaleString() : displayProperties.length}
                </Text>
                <View style={styles.cardTrendRow}>
                  <SymbolView
                    name={{ ios: 'triangle.fill', android: 'arrow_drop_up', web: 'arrow_drop_up' }}
                    size={10}
                    tintColor="#2E7D32"
                  />
                  <Text style={styles.trendText}>
                    <Text style={styles.trendGreen}>+1.3%</Text> vs last month
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Held Deposit Card */}
              <View style={[styles.statCard, styles.greenCard]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconCircle, styles.greenIconCircle]}>
                    <SymbolView
                      name={{ ios: 'wallet.pass.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' }}
                      size={16}
                      tintColor="#2E7D32"
                      weight="bold"
                    />
                  </View>
                  <Text style={styles.greenCardLabel} numberOfLines={1}>Held Deposit</Text>
                </View>
                <Text style={styles.cardValue}>
                  {reduxHeaderStats?.heldDeposit 
                    ? `₦${reduxHeaderStats.heldDeposit.total.toLocaleString()}` 
                    : '₦0'}
                </Text>
                <View style={styles.cardTrendRow}>
                  <SymbolView
                    name={{ ios: 'triangle.fill', android: 'arrow_drop_up', web: 'arrow_drop_up' }}
                    size={10}
                    tintColor="#2E7D32"
                  />
                  <Text style={styles.trendText}>
                    <Text style={styles.trendGreen}>+1.3%</Text> vs last month
                  </Text>
                </View>
              </View>
            </View>

            {/* Toggle buttons - Segmented control */}
            <View style={styles.segmentedContainer}>
              <SegmentedControl
                values={['Properties', 'Analytics']}
                selectedIndex={activeSegment === 'properties' ? 0 : 1}
                onChange={(index) => setActiveSegment(index === 0 ? 'properties' : 'analytics')}
                width={220}
              />
            </View>

            {/* Dynamic Content Panel with fade animation */}
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
              {activeSegment === 'properties' ? (
                <View style={{ flex: 1 }}>
                  {/* Navigation Category Tabs */}
                  <View style={styles.tabsRow}>
                    <Animated.View
                      style={[
                        styles.slidingUnderline,
                        {
                          width: 32,
                          transform: [
                            {
                              translateX: categoryTabAnim.interpolate({
                                inputRange: [0, 1, 2],
                                outputRange: [
                                  (categoryTabWidth - 32) / 2,
                                  categoryTabWidth + (categoryTabWidth - 32) / 2,
                                  categoryTabWidth * 2 + (categoryTabWidth - 32) / 2,
                                ],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <TouchableOpacity
                      style={styles.tabItem}
                      onPress={() => setActiveTab('all')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tabLabel, activeTab === 'all' && styles.tabLabelActive]}>All</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.tabItem}
                      onPress={() => setActiveTab('pending')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.tabLabelContainer}>
                        <Text style={[styles.tabLabel, activeTab === 'pending' && styles.tabLabelActive]}>Pending</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.tabItem}
                      onPress={() => setActiveTab('drafts')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tabLabel, activeTab === 'drafts' && styles.tabLabelActive]}>Drafts</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Properties List */}
                  <View style={styles.listContainer}>
                    {displayProperties.map((property: any) => {
                      const title = property.propertyName || property.title || 'Property';
                      const addressParts = [
                        property.streetAddress || property.street_address || property.street || property.addressLine1,
                        property.apartmentSuiteFloor || property.suite || property.unit,
                        property.city || property.town,
                        property.state || property.region
                      ].filter(Boolean);

                      const address = addressParts.length > 0
                        ? addressParts.join(', ')
                        : (property.address && property.address !== 'Address not specified'
                            ? property.address
                            : property.formattedAddress || property.location || '12, Close 9, His Grace Pavilion Estate, Wumba, Apo, FCT');
                      const occupancyType = property.occupancyType || property.type || 'single';
                      const unitCount = property.unitCount || property.unitsCount;
                      const occupiedCount = property.occupiedCount;
                      const coverImage = property.coverImage;

                      return (
                        <TouchableOpacity 
                          key={property.id}
                          style={styles.propertyCard}
                          onPress={() => {
                            dispatch(clearSelectedProperty());
                            dispatch(fetchPropertyById(property.id));
                            setSelectedPropertyId(property.id);
                          }}
                          activeOpacity={0.9}
                        >
                          {coverImage && coverImage.startsWith('http') ? (
                            <Image
                              source={{ uri: coverImage }}
                              style={styles.propertyImage}
                            />
                          ) : (
                            <View style={styles.placeholderImageContainer}>
                              <SymbolView
                                name={{ ios: 'house', android: 'home', web: 'home' }}
                                size={24}
                                tintColor="#D87C24"
                                weight="semibold"
                              />
                            </View>
                          )}
                          
                          <View style={styles.propertyDetails}>
                            <Text style={styles.propertyTitle}>{title}</Text>
                            <Text style={styles.propertyAddress} numberOfLines={2}>
                              {address}
                            </Text>
                            <View style={styles.tagsContainer}>
                              {occupancyType === 'multiple' ? (
                                <>
                                  <View style={[styles.tag, styles.orangeTag]}>
                                    <Text style={styles.orangeTagText}>Multiple Units</Text>
                                  </View>
                                  {unitCount ? (
                                    <View style={[styles.tag, styles.pinkTag]}>
                                      <Text style={styles.pinkTagText}>{unitCount} Rental Units</Text>
                                    </View>
                                  ) : null}
                                  {occupiedCount ? (
                                    <View style={[styles.tag, styles.blueTag]}>
                                      <Text style={styles.blueTagText}>{occupiedCount} Occupied</Text>
                                    </View>
                                  ) : null}
                                </>
                              ) : (
                                <View style={[styles.tag, styles.orangeTag]}>
                                  <Text style={styles.orangeTagText}>Single Unit</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          
                          <TouchableOpacity
                            style={styles.menuButton}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              setActivePropertyForMenu(property);
                              setIsMenuVisible(true);
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
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                /* Portfolio Analytics Mockup Panel */
                <View style={styles.analyticsContainer}>
                  <Text style={styles.sectionTitle}>Portfolio Analytics</Text>
                  
                  {/* Big Chart Card */}
                  <View style={styles.analyticsCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>Monthly Revenue Trend</Text>
                      <Text style={styles.chartValue}>₦14,500,000</Text>
                    </View>
                    
                    <View style={styles.mockupChart}>
                      {[35, 45, 30, 60, 75, 50, 65, 80, 95, 70, 85, 110].map((h, i) => (
                        <View key={i} style={styles.chartBarCol}>
                          <View style={[styles.chartBarProgress, { height: h }]} />
                          <Text style={styles.chartBarLabel}>M{i+1}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Metrics Row */}
                  <View style={styles.statsRow}>
                    <View style={[styles.statCard, styles.orangeCard, { minHeight: 90 }]}>
                      <Text style={styles.cardValue}>85%</Text>
                      <Text style={styles.detailsCardLabel}>Avg. Occupancy Rate</Text>
                    </View>

                    <View style={[styles.statCard, styles.greenCard, { minHeight: 90 }]}>
                      <Text style={styles.cardValue}>98.2%</Text>
                      <Text style={styles.detailsCardLabel}>Rent Collection Rate</Text>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        ) : (
          /* Empty State Content with RefreshControl */
          <ScrollView
            contentContainerStyle={styles.emptyStateContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#D87C24"
                colors={['#D87C24']}
              />
            }
          >
            <Image
              source={require('../../assets/images/empty_state.png')}
              style={styles.emptyBoxImage}
              resizeMode="contain"
            />

            <Text style={styles.emptyTitle}>Add your first Property</Text>

            <Text style={styles.emptyDescription}>
              Add your first property on buildsure to explore more features and setup rent collection and see your property valuation.
            </Text>

            <TouchableOpacity
              style={styles.addPropertyBtn}
              onPress={() => setIsAddingProperty(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addPropertyBtnText}>Add Property →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Options Menu Bottom Sheet */}
        <AppBottomSheet
          visible={isMenuVisible}
          onClose={() => setIsMenuVisible(false)}
          options={[
            {
              label: 'Edit Property',
              onPress: () => {
                setIsMenuVisible(false);
                showToast('Edit Property feature coming soon', 'info');
              },
            },
            {
              label: 'Delete Property',
              type: 'danger',
              onPress: () => {
                const targetId = activePropertyForMenu?.id || reduxProperties[0]?.id;
                setIsMenuVisible(false);
                if (targetId) {
                  Alert.alert(
                    'Delete Property',
                    'Are you sure you want to delete this property? This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await dispatch(deleteProperty(targetId)).unwrap();
                            showToast('Property deleted successfully', 'success');
                            setSelectedPropertyId(null);
                            dispatch(fetchProperties());
                          } catch (err: any) {
                            showToast(err || 'Failed to delete property', 'error');
                          }
                        },
                      },
                    ]
                  );
                }
              },
            },
          ]}
        />
      </SafeAreaView>

      {/* 2. Details View Layer */}
      {renderDetails && (
        <Animated.View
          style={[
            styles.animatedContainer,
            { transform: [{ translateX: detailsAnim }] },
          ]}
          pointerEvents={selectedPropertyId ? 'auto' : 'none'}
        >
          <PropertyDetails
            propertyId={selectedPropertyId || undefined}
            onClose={() => {
              setSelectedPropertyId(null);
              dispatch(clearSelectedProperty());
            }}
            onOpenMenu={() => {
              const target = reduxProperties.find((p) => p.id === selectedPropertyId);
              setActivePropertyForMenu(target || null);
              setIsMenuVisible(true);
            }}
            onCreateTenancyPress={() => setIsCreateTenancyVisible(true)}
          />
        </Animated.View>
      )}

      {/* 3. Add Property Form Layer */}
      {renderAdd && (
        <Animated.View
          style={[
            styles.animatedContainer,
            { transform: [{ translateX: addAnim }] },
          ]}
          pointerEvents={isAddingProperty ? 'auto' : 'none'}
        >
          <AddPropertyForm
            onClose={() => setIsAddingProperty(false)}
            onProceed={handleAddPropertySuccess}
          />
        </Animated.View>
      )}

      {/* Create Tenancy Flow Overlay */}
      <CreateTenancyFlow
        visible={isCreateTenancyVisible}
        onClose={() => setIsCreateTenancyVisible(false)}
      />
    </View>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    fontFamily: 'Satoshi-Regular',
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 14,
    color: '#1A1C1E',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFA726',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  body: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orangeIconCircle: {
    backgroundColor: '#FFF3E0',
  },
  greenIconCircle: {
    backgroundColor: '#E8F5E9',
  },
  orangeCardLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    fontWeight: '600',
    color: '#D87C24',
    flex: 1,
  },
  greenCardLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    flex: 1,
  },
  cardValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
    marginTop: 6,
  },
  cardTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  trendText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 10,
    color: '#8A8D93',
  },
  trendGreen: {
    fontFamily: 'Satoshi-Medium',
    color: '#2E7D32',
    fontWeight: '600',
  },
  segmentedContainer: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 24,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#EBE6DC',
    marginHorizontal: 24,
    marginBottom: 20,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slidingUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: '#D87C24',
    borderRadius: 1.5,
    zIndex: 1,
  },
  tabLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: '#8A8D93',
  },
  tabLabelActive: {
    fontFamily: 'Satoshi-Bold',
    color: '#1A1C1E',
    fontWeight: '700',
  },
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  redBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    height: 16,
    minWidth: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  redBadgeText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  listContainer: {
    marginHorizontal: 24,
    paddingBottom: 120,
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  propertyImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  placeholderImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  propertyTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  propertyAddress: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    lineHeight: 15,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  orangeTag: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE3C6',
  },
  orangeTagText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 9,
    fontWeight: '600',
    color: '#D87C24',
  },
  pinkTag: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FCE7F3',
  },
  pinkTagText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 9,
    fontWeight: '600',
    color: '#DB2777',
  },
  blueTag: {
    backgroundColor: '#F0F9FF',
    borderColor: '#E0F2FE',
  },
  blueTagText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 9,
    fontWeight: '600',
    color: '#0284C7',
  },
  menuButton: {
    padding: 6,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyBoxImage: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#D87C24',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#8A8D93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addPropertyBtn: {
    backgroundColor: '#FFA726',
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addPropertyBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  animatedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FEFAF4',
    zIndex: 20,
  },
  analyticsContainer: {
    marginHorizontal: 24,
    marginTop: 8,
    gap: 16,
    paddingBottom: 120,
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 16,
    padding: 16,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#8A8D93',
    fontWeight: '600',
  },
  chartValue: {
    fontFamily: 'Satoshi-Black',
    fontSize: 24,
    fontWeight: '800',
    color: '#D87C24',
    marginTop: 4,
  },
  mockupChart: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  chartBarProgress: {
    width: 8,
    backgroundColor: '#FFA726',
    borderRadius: 4,
  },
  chartBarLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 8,
    color: '#8A8D93',
    fontWeight: '600',
  },
  detailsCardLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8D93',
    marginTop: 4,
  },
});
