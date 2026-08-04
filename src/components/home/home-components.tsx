import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

// Sparkline area chart wave points to mock the portfolio chart
const chartPoints = [
  24, 26, 25, 28, 30, 27, 26, 29, 32, 34, 30, 28, 31, 35, 38,
  34, 32, 35, 40, 44, 40, 38, 41, 46, 50, 46, 44, 47, 52, 56, 52
];

interface BrandHeaderProps {
  onNotificationPress?: () => void;
  notificationCount?: number;
}

// 1. Header component
export function BrandHeader({ onNotificationPress, notificationCount = 0 }: BrandHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/images/icon.png')}
          style={styles.logoIconImage}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>BUILDSURE</Text>
      </View>
      <TouchableOpacity 
        style={styles.notificationButton} 
        activeOpacity={0.7}
        onPress={onNotificationPress}
      >
        <SymbolView
          name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
          size={24}
          tintColor="#1A1C1E"
        />
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// 1b. Notification Nudge component
interface NotificationNudgeProps {
  message?: string;
  timeAgo?: string;
  onClose: () => void;
  onNotificationPress?: () => void;
}

export function NotificationNudge({ message, timeAgo, onClose, onNotificationPress }: NotificationNudgeProps) {
  if (!message) return null;

  return (
    <TouchableOpacity 
      style={styles.nudgeContainer} 
      activeOpacity={0.9}
      onPress={onNotificationPress}
    >
      <Image
        source={require('../../../assets/images/onboarding_1.png')}
        style={styles.nudgeImage}
        resizeMode="cover"
      />
      <View style={styles.nudgeTextContainer}>
        <Text style={styles.nudgeText}>{message}</Text>
        {timeAgo && <Text style={styles.nudgeTime}>{timeAgo}</Text>}
      </View>
      <TouchableOpacity 
        onPress={(e) => {
          e.stopPropagation?.();
          onClose();
        }} 
        style={styles.closeButton} 
        activeOpacity={0.7}
      >
        <SymbolView
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          size={14}
          tintColor="#6C757D"
          weight="bold"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

interface PortfolioCardProps {
  value: string;
  trend: string;
  currency?: string;
  chartData?: { month: string; value: number }[];
}

export function PortfolioCard({ value, trend, currency = 'NGN', chartData }: PortfolioCardProps) {
  const currencySymbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;

  // Calculate dynamic bar heights if chartData is provided
  const points = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    // Scale values between 18 and 52 for sparkline chart
    return values.map((val) => 18 + ((val - min) / range) * 34);
  }, [chartData]);

  return (
    <View style={styles.portfolioCard}>
      <View style={styles.portfolioHeader}>
        <View style={styles.portfolioTitleRow}>
          <Text style={styles.portfolioTitle}>Total Portfolio Value</Text>
          <SymbolView
            name={{ ios: 'info.circle', android: 'info', web: 'info' }}
            size={14}
            tintColor="#6C757D"
          />
        </View>
        <Text style={styles.nairaSymbol}>{currencySymbol}</Text>
      </View>

      <Text style={styles.amountText}>{value}</Text>

      <View style={styles.trendRow}>
        <Text style={styles.trendLabel}>vs. last month</Text>
        <View style={styles.trendValueContainer}>
          <SymbolView
            name={{ ios: 'triangle.fill', android: 'arrow_drop_up', web: 'arrow_drop_up' }}
            size={10}
            tintColor="#2E7D32"
          />
          <Text style={styles.trendValue}>{trend}</Text>
        </View>
      </View>

      {/* Sparkline chart columns */}
      {points.length > 0 && (
        <View style={styles.chartContainer}>
          {points.map((val, idx) => (
            <View key={idx} style={styles.chartCol}>
              <View style={[styles.chartBar, { height: val }]} />
              <View style={styles.chartLineDot} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

interface ActionRowProps {
  onCreateTenancyPress?: () => void;
  onAddPropertyPress?: () => void;
}

// 3. Action buttons component
export function ActionRow({ onCreateTenancyPress, onAddPropertyPress }: ActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <TouchableOpacity
        style={styles.addPropertyButton}
        activeOpacity={0.8}
        onPress={onAddPropertyPress}
      >
        <SymbolView
          name={{ ios: 'house.fill', android: 'home', web: 'home' }}
          size={18}
          tintColor="#1A1C1E"
          weight="bold"
        />
        <Text style={styles.addPropertyText}>Add Property</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.createTenancyButton} 
        activeOpacity={0.8}
        onPress={onCreateTenancyPress}
      >
        <SymbolView
          name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
          size={18}
          tintColor="#D87C24"
          weight="bold"
        />
        <Text style={styles.createTenancyText}>Create Tenancy</Text>
      </TouchableOpacity>
    </View>
  );
}

// 4. Reusable Overview card component
interface OverviewCardProps {
  title: string;
  value: string;
  trend?: string;
  iconName: string;
  themeColor: 'orange' | 'green' | 'purple' | 'cyan';
}

const themeStyles = {
  orange: {
    cardBg: '#FFF8F0',
    cardBorder: '#FFE3C6',
    iconCircleBg: '#FFF3E0',
    iconColor: '#D87C24',
  },
  green: {
    cardBg: '#F0FDF4',
    cardBorder: '#DCFCE7',
    iconCircleBg: '#E8F5E9',
    iconColor: '#2E7D32',
  },
  purple: {
    cardBg: '#FAF5FA',
    cardBorder: '#F5E5F5',
    iconCircleBg: '#F3E5F5',
    iconColor: '#9C27B0',
  },
  cyan: {
    cardBg: '#F0F9FF',
    cardBorder: '#E0F2FE',
    iconCircleBg: '#E0F7FA',
    iconColor: '#0284C7',
  },
};

export function OverviewCard({ title, value, trend, iconName, themeColor }: OverviewCardProps) {
  const colors = themeStyles[themeColor];

  // Map icon configurations
  const getIconConfig = () => {
    switch (iconName) {
      case 'house':
        return { ios: 'house.fill', android: 'home', web: 'home' } as const;
      case 'person.2':
        return { ios: 'person.2.fill', android: 'group', web: 'group' } as const;
      case 'creditcard':
        return { ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' } as const;
      case 'wallet':
        return { ios: 'wallet.pass.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' } as const;
      default:
        return { ios: 'house.fill', android: 'home', web: 'home' } as const;
    }
  };

  return (
    <View style={[
      styles.overviewCard,
      { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }
    ]}>
      <View style={styles.gridHeader}>
        <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
          <SymbolView
            name={getIconConfig()}
            size={20}
            tintColor={colors.iconColor}
            weight="bold"
          />
        </View>
      </View>
      <Text style={[styles.gridCardLabel, { color: colors.iconColor }]}>{title}</Text>
      <Text style={styles.gridCardValue}>{value}</Text>
      {trend && (
        <View style={styles.gridTrendRow}>
          <SymbolView
            name={{ ios: 'triangle.fill', android: 'arrow_drop_up', web: 'arrow_drop_up' }}
            size={10}
            tintColor="#2E7D32"
          />
          <Text style={styles.gridTrendText}>
            <Text style={styles.trendGreen}>{trend}</Text>
            <Text style={styles.trendGrey}> vs last month</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconImage: {
    width: 28,
    height: 28,
  },
  logoText: {
    fontFamily: 'Satoshi-Bold',
    color: '#1A1C1E',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F04438',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  portfolioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  portfolioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  portfolioTitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  nairaSymbol: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  amountText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1C1E',
    marginTop: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  trendLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#6C757D',
  },
  trendValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendValue: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBar: {
    width: '100%',
    backgroundColor: 'rgba(255, 167, 38, 0.08)',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  chartLineDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFA726',
    position: 'absolute',
    bottom: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  addPropertyButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFA726',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addPropertyText: {
    fontFamily: 'Satoshi-Bold',
    color: '#1A1C1E',
    fontWeight: '700',
    fontSize: 14,
  },
  createTenancyButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFA726',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createTenancyText: {
    fontFamily: 'Satoshi-Bold',
    color: '#D87C24',
    fontWeight: '700',
    fontSize: 14,
  },
  overviewCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridHeader: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  gridCardLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    fontWeight: '600',
  },
  gridCardValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1C1E',
    marginTop: 6,
  },
  gridTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  gridTrendText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    fontWeight: '500',
  },
  trendGreen: {
    fontFamily: 'Satoshi-Medium',
    color: '#2E7D32',
    fontWeight: '600',
  },
  trendGrey: {
    color: '#6C757D',
  },
  nudgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFDF9',
    borderColor: '#EBE6DC',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  nudgeImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  nudgeTextContainer: {
    flex: 1,
    gap: 2,
  },
  nudgeText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#1A1C1E',
  },
  boldOrange: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#D87C24',
  },
  nudgeTime: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
  },
  closeButton: {
    padding: 4,
  },
});
