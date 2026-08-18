import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

export interface StepRentProps {
  progressBarWidth: any;
  currentPageNumber: number;
  totalPages: number;
  rentAmount: string;
  rentDuration: number;
  rentStartDate: string;
  rentEndDate: string;
  rentDueDate: string;
  showCustomFees: boolean;
  customFeeName: string;
  customFeeAmount: string;
  customFeeDueDate: string;
  onChangeRentAmount: (text: string) => void;
  onChangeRentDuration: (duration: number) => void;
  onOpenStartDatePicker: () => void;
  onOpenEndDatePicker: () => void;
  onOpenDueDatePicker: () => void;
  onOpenFeeDueDatePicker: () => void;
  onToggleCustomFees: (show: boolean) => void;
  onOpenFeeSheet: () => void;
  onChangeCustomFeeAmount: (text: string) => void;
  onResetCustomFee: () => void;
}

export function StepRent({
  progressBarWidth,
  currentPageNumber,
  totalPages,
  rentAmount,
  rentDuration,
  rentStartDate,
  rentEndDate,
  rentDueDate,
  showCustomFees,
  customFeeName,
  customFeeAmount,
  customFeeDueDate,
  onChangeRentAmount,
  onChangeRentDuration,
  onOpenStartDatePicker,
  onOpenEndDatePicker,
  onOpenDueDatePicker,
  onOpenFeeDueDatePicker,
  onToggleCustomFees,
  onOpenFeeSheet,
  onChangeCustomFeeAmount,
  onResetCustomFee,
}: StepRentProps) {
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
        <Text style={styles.sectionMainTitle}>Rent & Dates</Text>
        <Text style={styles.sectionSubtitle}>
          Enter the lease duration, rental amount, and payment schedule for this unit
        </Text>
      </View>

      {/* Rent Amount Input Row */}
      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Rent amount</Text>
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
            value={rentAmount}
            onChangeText={onChangeRentAmount}
          />
        </View>
      </View>

      {/* Rent Duration Selector (Stepper) */}
      <View style={styles.formGroupSpacing}>
        <Text style={styles.fieldLabel}>Rent Duration (in years)</Text>
        <View style={styles.stepperContainer}>
          <View style={{ flex: 1 }} />
          <View style={styles.stepperControls}>
            <TouchableOpacity
              style={styles.stepperBtnMinus}
              onPress={() => rentDuration > 0 && onChangeRentDuration(rentDuration - 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnMinusText}>—</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValText}>{rentDuration}</Text>
            <TouchableOpacity
              style={styles.stepperBtnPlusSquare}
              onPress={() => onChangeRentDuration(rentDuration + 1)}
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
          onPress={onOpenStartDatePicker}
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
          onPress={onOpenEndDatePicker}
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
          onPress={onOpenDueDatePicker}
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
          <TouchableOpacity
            style={styles.customFeeDeleteBtn}
            onPress={onResetCustomFee}
            activeOpacity={0.7}
          >
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={18}
              tintColor="#EF4444"
            />
          </TouchableOpacity>

          <View style={styles.formGroupSpacing}>
            <Text style={styles.fieldLabel}>
              Fee Name <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={onOpenFeeSheet}
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
              onChangeText={onChangeCustomFeeAmount}
            />
          </View>

          <View style={[styles.formGroupSpacing, { marginTop: 12 }]}>
            <Text style={styles.fieldLabel}>Payment is due on</Text>
            <TouchableOpacity
              style={styles.datePickerInputFull}
              onPress={onOpenFeeDueDatePicker}
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

      {/* Add custom fees button */}
      <TouchableOpacity
        style={styles.addCustomFeeBtn}
        onPress={() => onToggleCustomFees(true)}
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
  formGroupSpacing: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 8,
  },
  rentAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  flagCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  flagGreen: {
    flex: 1,
    backgroundColor: '#008751',
  },
  flagWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  currencyText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtnMinus: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F5EFE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnMinusText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: 'bold',
  },
  stepperValText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#1A1C1E',
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  stepperBtnPlusSquare: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datesRowGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateFieldCol: {
    flex: 1,
  },
  datePickerInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerInputFull: {
    height: 48,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTextFilled: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
  },
  datePlaceholder: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#8A8D93',
  },
  dropdownSelector: {
    height: 48,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownPlaceholder: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#8A8D93',
  },
  customFeeCardBox: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  customFeeDeleteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  addCustomFeeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addCustomFeeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#D87C24',
    fontWeight: '700',
  },
});
