import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SymbolView } from 'expo-symbols';

export interface StepTypeProps {
  tenancyType: 'new' | 'existing';
  onSelectType: (type: 'new' | 'existing') => void;
}

export function StepType({ tenancyType, onSelectType }: StepTypeProps) {
  return (
    <View style={styles.content}>
      <Text style={styles.wizardLabel}>Select Tenancy Type</Text>

      {/* New Tenancy Card */}
      <TouchableOpacity
        style={[
          styles.selectionCard,
          tenancyType === 'new' ? styles.selectionCardActive : styles.selectionCardInactive,
        ]}
        onPress={() => onSelectType('new')}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.avatarCircle,
            tenancyType === 'new' ? styles.avatarCircleActive : styles.avatarCircleInactive,
          ]}
        >
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
        onPress={() => onSelectType('existing')}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.avatarCircle,
            tenancyType === 'existing' ? styles.avatarCircleActive : styles.avatarCircleInactive,
          ]}
        >
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
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  wizardLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 16,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  selectionCardActive: {
    borderColor: '#FFA726',
    backgroundColor: '#FFF9F0',
  },
  selectionCardInactive: {
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarCircleActive: {
    backgroundColor: '#FFF0D9',
  },
  avatarCircleInactive: {
    backgroundColor: '#F5EFE6',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
  },
  checkCircleContainer: {
    marginLeft: 10,
  },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D5D5D5',
  },
});
