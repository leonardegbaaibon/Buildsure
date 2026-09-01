import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUnitDetail, clearUnitDetail } from '@/store/slices/property-slice';
import { UnitDetailResponseData } from '@/types/property';

export interface UnitDetailsProps {
  visible: boolean;
  propertyId: string;
  propertyTitle: string;
  unitId: string;
  unitIdentifier?: string;
  onClose: () => void;
  onCreateTenancy?: (propertyId: string, unitId: string) => void;
}

export function UnitDetails({
  visible,
  propertyId,
  propertyTitle,
  unitId,
  unitIdentifier,
  onClose,
  onCreateTenancy,
}: UnitDetailsProps) {
  const dispatch = useAppDispatch();
  const selectedUnitDetail = useAppSelector((state) => state.properties.selectedUnitDetail);
  const unitStatus = useAppSelector((state) => state.properties.unitStatus);

  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');
  const [searchPastQuery, setSearchPastQuery] = useState('');

  useEffect(() => {
    if (visible && propertyId && unitId) {
      setActiveTab('current');
      setSearchPastQuery('');
      dispatch(clearUnitDetail());
      dispatch(fetchUnitDetail({ propertyId, unitId }));
    }
    return () => {
      dispatch(clearUnitDetail());
    };
  }, [visible, propertyId, unitId, dispatch]);

  const unitData = selectedUnitDetail?.unit;
  const currentTenancy = selectedUnitDetail?.currentTenancy;
  const pastTenancies = selectedUnitDetail?.pastTenancies || [];

  const isOccupied = Boolean(
    unitData?.occupied ??
    unitData?.isOccupied ??
    (currentTenancy && currentTenancy.id)
  );

  const displayUnitId = unitIdentifier || unitData?.unitIdentifier || 'Unit';
  const bedrooms = unitData?.bedrooms ?? 2;
  const bathrooms = unitData?.bathrooms ?? 2;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'TN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filteredPastTenancies = useMemo(() => {
    if (!searchPastQuery.trim()) return pastTenancies;
    return pastTenancies.filter(
      (t) =>
        t.tenant?.name?.toLowerCase().includes(searchPastQuery.toLowerCase()) ||
        t.tenant?.email?.toLowerCase().includes(searchPastQuery.toLowerCase())
    );
  }, [pastTenancies, searchPastQuery]);

  const daysRemaining = currentTenancy?.daysRemaining ?? currentTenancy?.tenancyBalance ?? 30;
  const canSendRenewal = daysRemaining <= 30;

  const handleSendRenewal = () => {
    if (!canSendRenewal) {
      CustomAlert.alert(
        'Renewal Unavailable',
        `Renewal invoices can only be sent within 30 days of lease expiration (${daysRemaining} days remaining).`
      );
      return;
    }
    CustomAlert.alert('Renewal Invoice Sent', `A renewal invoice has been dispatched to ${currentTenancy?.tenant?.name || 'the tenant'}.`);
  };

  const handlePromptTenant = () => {
    CustomAlert.alert('Prompt Sent', `A reminder prompt has been sent to ${currentTenancy?.tenant?.name || 'the tenant'}.`);
  };

  const handleTerminateTenancy = () => {
    CustomAlert.alert(
      'Terminate Tenancy',
      `Are you sure you want to terminate the tenancy for ${displayUnitId}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: () => {
            CustomAlert.alert('Tenancy Terminated', 'The tenancy agreement has been marked as ended.');
            onClose();
          },
        },
      ]
    );
  };

  const handleCreateTenancyPress = () => {
    onClose();
    if (onCreateTenancy) {
      onCreateTenancy(propertyId, unitId);
    }
  };

  const isMatchingUnit = selectedUnitDetail?.unit?.id === unitId;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <AppScreen edges={['top', 'bottom', 'left', 'right']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.7}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={18}
              tintColor="#1A1C1E"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {propertyTitle} {displayUnitId}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {unitStatus === 'loading' || !selectedUnitDetail || !isMatchingUnit ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D87C24" />
            <Text style={styles.loadingText}>Loading unit details...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Unit Status Card */}
            <View style={[styles.heroUnitCard, isOccupied ? styles.heroOccupied : styles.heroVacant]}>
              <Text style={[styles.heroUnitTitle, isOccupied ? styles.heroUnitTitleOccupied : styles.heroUnitTitleVacant]}>
                {displayUnitId}
              </Text>
              <Text style={[styles.heroUnitSubtitle, isOccupied ? styles.heroUnitSubtitleOccupied : styles.heroUnitSubtitleVacant]}>
                {isOccupied ? 'Occupied' : 'Vacant'}
              </Text>
            </View>

            {/* Amenities Card */}
            <View style={styles.amenitiesCard}>
              <View style={styles.amenityRow}>
                <View style={styles.amenityLabelRow}>
                  <SymbolView
                    name={{ ios: 'bed.double.fill', android: 'bed', web: 'bed' }}
                    size={18}
                    tintColor="#D87C24"
                  />
                  <Text style={styles.amenityLabel}>Bedrooms</Text>
                </View>
                <Text style={styles.amenityValue}>{bedrooms}</Text>
              </View>

              <View style={styles.amenityDivider} />

              <View style={styles.amenityRow}>
                <View style={styles.amenityLabelRow}>
                  <SymbolView
                    name={{ ios: 'shower.fill', android: 'shower', web: 'shower' }}
                    size={18}
                    tintColor="#D87C24"
                  />
                  <Text style={styles.amenityLabel}>Bathrooms</Text>
                </View>
                <Text style={styles.amenityValue}>{bathrooms}</Text>
              </View>
            </View>

            {/* Tabs Header */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab('current')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'current' && styles.tabTextActive]}>
                  Current Tenancy
                </Text>
                {activeTab === 'current' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab('past')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                  Past Tenancies
                </Text>
                {activeTab === 'past' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            </View>

            {/* Tab 1: Current Tenancy */}
            {activeTab === 'current' && (
              <View style={styles.tabContentContainer}>
                {!isOccupied || !currentTenancy ? (
                  /* Vacant State */
                  <View style={styles.vacantContainer}>
                    <Image
                      source={require('../../../assets/images/empty_box.png')}
                      style={styles.emptyBoxImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.vacantTitle}>This Rental Unit is Vacant!</Text>
                    <Text style={styles.vacantSubtitle}>
                      This unit is currently vacant. Add a tenant to start managing their lease, profile, and payments.
                    </Text>

                    <TouchableOpacity
                      style={styles.createTenancyBtn}
                      onPress={handleCreateTenancyPress}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.createTenancyBtnText}>Create Tenancy →</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Occupied State */
                  <View style={styles.occupiedContainer}>
                    {/* Lease Timeline Info */}
                    <View style={styles.leaseTimelineCard}>
                      <View style={styles.leaseInfoTopRow}>
                        <Text style={styles.leaseDurationText}>
                          {currentTenancy.durationYears || 1} year
                        </Text>
                        <Text style={styles.leaseExpiryDateText}>
                          Exp {formatDate(currentTenancy.expiryDate)}
                        </Text>
                      </View>

                      <View style={styles.leaseDivider} />

                      <Text style={styles.leaseBalanceText}>
                        Tenancy Balance:{' '}
                        <Text style={styles.leaseBalanceHighlight}>
                          {daysRemaining} days
                        </Text>
                      </Text>
                    </View>

                    {/* Expiry Warning Banner (If <= 60 days) */}
                    {daysRemaining <= 60 && (
                      <View style={styles.expiryNoticeBanner}>
                        <SymbolView
                          name={{ ios: 'info.circle', android: 'info', web: 'info' }}
                          size={16}
                          tintColor="#D87C24"
                        />
                        <Text style={styles.expiryNoticeText}>
                          Tenancy agreement expires on {formatDate(currentTenancy.expiryDate)}{' '}
                          <Text style={{ color: '#D87C24', fontWeight: '700' }}>
                            ({daysRemaining} days remaining)
                          </Text>
                          . Select an action below to update the lease status.
                        </Text>
                      </View>
                    )}

                    {/* Prompt Tenant Button */}
                    {daysRemaining <= 60 && (
                      <TouchableOpacity
                        style={styles.promptTenantBtn}
                        onPress={handlePromptTenant}
                        activeOpacity={0.7}
                      >
                        <SymbolView
                          name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
                          size={16}
                          tintColor="#1A1C1E"
                        />
                        <Text style={styles.promptTenantBtnText}>Prompt Tenant</Text>
                      </TouchableOpacity>
                    )}

                    {/* Section Divider: Tenant Profile */}
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionLine} />
                      <Text style={styles.sectionTitleText}>Tenant Profile</Text>
                      <View style={styles.sectionLine} />
                    </View>

                    {/* Tenant Profile Card */}
                    <View style={styles.profileCard}>
                      <View style={styles.profileHeaderRow}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>
                            {getInitials(currentTenancy.tenant?.name)}
                          </Text>
                        </View>
                        <View style={styles.profileNameCol}>
                          <Text style={styles.profileNameText}>
                            {currentTenancy.tenant?.name || 'Saad Bashar'}
                          </Text>
                          <View style={styles.activeBadge}>
                            <View style={styles.activeDot} />
                            <Text style={styles.activeBadgeText}>Active Tenant</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.profileDivider} />

                      {/* Email Row */}
                      <View style={styles.profileDetailRow}>
                        <View style={styles.profileIconBox}>
                          <SymbolView
                            name={{ ios: 'envelope', android: 'mail', web: 'mail' }}
                            size={14}
                            tintColor="#D87C24"
                          />
                        </View>
                        <View style={styles.profileDetailTextCol}>
                          <Text style={styles.profileDetailLabel}>EMAIL</Text>
                          <Text style={styles.profileDetailValue}>
                            {currentTenancy.tenant?.email || 'tenant@buildsure.ng'}
                          </Text>
                        </View>
                      </View>

                      {/* Phone Row */}
                      <View style={styles.profileDetailRow}>
                        <View style={styles.profileIconBox}>
                          <SymbolView
                            name={{ ios: 'phone', android: 'call', web: 'call' }}
                            size={14}
                            tintColor="#D87C24"
                          />
                        </View>
                        <View style={styles.profileDetailTextCol}>
                          <Text style={styles.profileDetailLabel}>PHONE</Text>
                          <Text style={styles.profileDetailValue}>
                            {currentTenancy.tenant?.phoneNumber || '+234 814 171 4124'}
                          </Text>
                        </View>
                      </View>

                      {/* Move-in Date Row */}
                      <View style={styles.profileDetailRow}>
                        <View style={styles.profileIconBox}>
                          <SymbolView
                            name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                            size={14}
                            tintColor="#D87C24"
                          />
                        </View>
                        <View style={styles.profileDetailTextCol}>
                          <Text style={styles.profileDetailLabel}>MOVE-IN DATE</Text>
                          <Text style={styles.profileDetailValue}>
                            {formatDate(currentTenancy.moveInDate)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Bottom Notice */}
                    <View style={styles.bottomInfoRow}>
                      <SymbolView
                        name={{ ios: 'info.circle', android: 'info', web: 'info' }}
                        size={12}
                        tintColor="#8A8D93"
                      />
                      <Text style={styles.bottomInfoText}>
                        You can send a renewal invoice starting 30 days prior to lease expiration.
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity
                      style={[
                        styles.sendRenewalBtn,
                        canSendRenewal ? styles.sendRenewalBtnActive : styles.sendRenewalBtnDisabled,
                      ]}
                      onPress={handleSendRenewal}
                      activeOpacity={0.8}
                    >
                      <SymbolView
                        name={{ ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' }}
                        size={16}
                        tintColor={canSendRenewal ? '#1A1C1E' : '#8A8D93'}
                      />
                      <Text
                        style={[
                          styles.sendRenewalBtnText,
                          canSendRenewal ? styles.sendRenewalBtnTextActive : styles.sendRenewalBtnTextDisabled,
                        ]}
                      >
                        Send Renewal Invoice
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.terminateBtn}
                      onPress={handleTerminateTenancy}
                      activeOpacity={0.7}
                    >
                      <SymbolView
                        name={{ ios: 'nosign', android: 'block', web: 'block' }}
                        size={16}
                        tintColor="#FF4D4F"
                      />
                      <Text style={styles.terminateBtnText}>Terminate Tenancy</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Tab 2: Past Tenancies */}
            {activeTab === 'past' && (
              <View style={styles.tabContentContainer}>
                {/* Search Row */}
                <View style={styles.searchRow}>
                  <View style={styles.searchInputWrapper}>
                    <SymbolView
                      name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                      size={16}
                      tintColor="#8A8D93"
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search Tenants"
                      placeholderTextColor="#8A8D93"
                      value={searchPastQuery}
                      onChangeText={setSearchPastQuery}
                    />
                  </View>
                  <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
                    <SymbolView
                      name={{ ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' }}
                      size={18}
                      tintColor="#1A1C1E"
                    />
                  </TouchableOpacity>
                </View>

                {/* Section Divider */}
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionLine} />
                  <Text style={styles.sectionTitleText}>Tenant Profile</Text>
                  <View style={styles.sectionLine} />
                </View>

                {/* Past Tenancies List */}
                {filteredPastTenancies.length === 0 ? (
                  <View style={styles.emptyPastContainer}>
                    <Text style={styles.emptyPastText}>
                      {searchPastQuery
                        ? `No past tenants found matching "${searchPastQuery}"`
                        : 'No past tenancies recorded for this rental unit.'}
                    </Text>
                  </View>
                ) : (
                  filteredPastTenancies.map((past, idx) => {
                    const ratingNum = past.rating || 0;
                    return (
                      <View key={past.id || idx} style={styles.profileCard}>
                        <View style={styles.profileHeaderRow}>
                          <View style={styles.avatarCirclePast}>
                            <Text style={styles.avatarText}>
                              {getInitials(past.tenant?.name)}
                            </Text>
                          </View>
                          <View style={styles.profileNameCol}>
                            <Text style={styles.profileNameText}>
                              {past.tenant?.name || 'Saad Bashar'}
                            </Text>
                            <View style={styles.pastBadge}>
                              <View style={styles.pastDot} />
                              <Text style={styles.pastBadgeText}>Past Tenant</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.profileDivider} />

                        {/* Email */}
                        <View style={styles.profileDetailRow}>
                          <View style={styles.profileIconBox}>
                            <SymbolView
                              name={{ ios: 'envelope', android: 'mail', web: 'mail' }}
                              size={14}
                              tintColor="#D87C24"
                            />
                          </View>
                          <View style={styles.profileDetailTextCol}>
                            <Text style={styles.profileDetailLabel}>EMAIL</Text>
                            <Text style={styles.profileDetailValue}>
                              {past.tenant?.email || 'tenant@buildsure.ng'}
                            </Text>
                          </View>
                        </View>

                        {/* Phone */}
                        <View style={styles.profileDetailRow}>
                          <View style={styles.profileIconBox}>
                            <SymbolView
                              name={{ ios: 'phone', android: 'call', web: 'call' }}
                              size={14}
                              tintColor="#D87C24"
                            />
                          </View>
                          <View style={styles.profileDetailTextCol}>
                            <Text style={styles.profileDetailLabel}>PHONE</Text>
                            <Text style={styles.profileDetailValue}>
                              {past.tenant?.phoneNumber || '+234 814 171 4124'}
                            </Text>
                          </View>
                        </View>

                        {/* Move-in Date */}
                        <View style={styles.profileDetailRow}>
                          <View style={styles.profileIconBox}>
                            <SymbolView
                              name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                              size={14}
                              tintColor="#D87C24"
                            />
                          </View>
                          <View style={styles.profileDetailTextCol}>
                            <Text style={styles.profileDetailLabel}>MOVE-IN DATE</Text>
                            <Text style={styles.profileDetailValue}>
                              {formatDate(past.moveInDate)}
                            </Text>
                          </View>
                        </View>

                        {/* Rating Section */}
                        <View style={styles.ratingContainer}>
                          <Text style={styles.ratingTitle}>Tenant Ratings</Text>
                          <View style={styles.starsRow}>
                            <Text style={styles.ratingsLabel}>RATINGS: </Text>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <SymbolView
                                key={star}
                                name={{
                                  ios: star <= ratingNum ? 'star.fill' : 'star',
                                  android: star <= ratingNum ? 'star' : 'star_border',
                                  web: star <= ratingNum ? 'star' : 'star_border',
                                }}
                                size={16}
                                tintColor={star <= ratingNum ? '#D87C24' : '#C8C5BD'}
                              />
                            ))}
                          </View>

                          {!!past.review && (
                            <Text style={styles.reviewText}>
                              "{past.review}"
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>
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
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#8A8D93',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  heroUnitCard: {
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroOccupied: {
    backgroundColor: '#7A4515',
  },
  heroVacant: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE6DC',
  },
  heroUnitTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroUnitTitleOccupied: {
    color: '#FFFFFF',
  },
  heroUnitTitleVacant: {
    color: '#1A1C1E',
  },
  heroUnitSubtitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
  },
  heroUnitSubtitleOccupied: {
    color: '#F5E8D8',
  },
  heroUnitSubtitleVacant: {
    color: '#8A8D93',
  },
  amenitiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  amenityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amenityLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
  },
  amenityValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#D87C24',
  },
  amenityDivider: {
    height: 1,
    backgroundColor: '#F5EFE6',
    marginVertical: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
    marginBottom: 20,
  },
  tabItem: {
    marginRight: 24,
    paddingBottom: 10,
    position: 'relative',
  },
  tabText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#8A8D93',
  },
  tabTextActive: {
    fontFamily: 'Satoshi-Bold',
    color: '#1A1C1E',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FFA726',
    borderRadius: 1.5,
  },
  tabContentContainer: {
    paddingTop: 4,
  },
  vacantContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyBoxImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  vacantTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#D87C24',
    textAlign: 'center',
    marginBottom: 8,
  },
  vacantSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#8A8D93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  createTenancyBtn: {
    backgroundColor: '#D87C24',
    paddingHorizontal: 28,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createTenancyBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  occupiedContainer: {
    gap: 14,
  },
  leaseTimelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    padding: 16,
  },
  leaseInfoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaseDurationText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
  },
  leaseExpiryDateText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#D87C24',
  },
  leaseDivider: {
    height: 1,
    backgroundColor: '#F5EFE6',
    marginVertical: 12,
  },
  leaseBalanceText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#1A1C1E',
  },
  leaseBalanceHighlight: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#1A1C1E',
  },
  expiryNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  expiryNoticeText: {
    flex: 1,
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    lineHeight: 16,
  },
  promptTenantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  promptTenantBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBE6DC',
  },
  sectionTitleText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#D87C24',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    padding: 16,
    marginBottom: 12,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#543214',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCirclePast: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5A4026',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  profileNameCol: {
    flex: 1,
  },
  profileNameText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 3,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  activeBadgeText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#2E7D32',
  },
  pastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EFE6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 4,
  },
  pastDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8A8D93',
  },
  pastBadgeText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#8A8D93',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#F5EFE6',
    marginVertical: 14,
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  profileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetailTextCol: {
    flex: 1,
  },
  profileDetailLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 10,
    color: '#8A8D93',
    fontWeight: '700',
    marginBottom: 1,
  },
  profileDetailValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  bottomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  bottomInfoText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
  },
  sendRenewalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    gap: 8,
    marginTop: 6,
  },
  sendRenewalBtnActive: {
    backgroundColor: '#FFA726',
  },
  sendRenewalBtnDisabled: {
    backgroundColor: '#FFE6C7',
  },
  sendRenewalBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
  },
  sendRenewalBtnTextActive: {
    color: '#1A1C1E',
  },
  sendRenewalBtnTextDisabled: {
    color: '#9E8668',
  },
  terminateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#FF5252',
    backgroundColor: '#FFFFFF',
    gap: 8,
    marginTop: 4,
  },
  terminateBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FF5252',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#1A1C1E',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPastContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyPastText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#8A8D93',
    textAlign: 'center',
  },
  ratingContainer: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5EFE6',
  },
  ratingTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingsLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: '#8A8D93',
    fontWeight: '700',
    marginRight: 4,
  },
  reviewText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 17,
    marginTop: 4,
  },
});

export default UnitDetails;
