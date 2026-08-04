import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  useWindowDimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SwipeButton } from '../swipe-button';
import { TouchableOpacity } from 'react-native';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    image: require('../../../assets/images/onboarding_1.jpg'),
    highlightedText: 'Build',
    normalText: ' Your Digital Foundation',
    subtitle: 'Establish a digital foundation for your property portfolio that is as solid as the structures you manage.',
  },
  {
    image: require('../../../assets/images/onboarding_2.jpg'),
    highlightedText: 'Surety',
    normalText: ' In Your Management',
    subtitle: 'Leverage the intelligence of Buildsure to keep your properties safe, certified, and profitable',
  },
  {
    image: require('../../../assets/images/onboarding_3.png'),
    highlightedText: 'Building',
    normalText: ' Operations',
    prefixText: 'Optimizing Your ',
    subtitle: 'Maximize the performance of your housing properties with innovative tech that simplifies complex logistics',
  },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { width, height } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentStep && index >= 0 && index < steps.length) {
      setCurrentStep(index);
    }
  };
  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Content (Images & Text) */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
      >
        {steps.map((step, index) => (
          <View key={index} style={{ width, height }}>
            {/* Image section */}
            <View style={styles.imageShadowWrapper}>
              <View style={[styles.imageContainer, { height: height * 0.58 }]}>
                <Image
                  source={step.image}
                  style={styles.image}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={[
                    'rgba(0, 0, 0, 0.8)',
                    'rgba(0, 0, 0, 0.784)',
                    'rgba(0, 0, 0, 0.32)',
                  ]}
                  locations={[0.1686, 0.4126, 0.7769]}
                  style={styles.gradientOverlay}
                />
              </View>
            </View>

            {/* Text section */}
            <View style={styles.textSection}>
              {/* Dynamic Title */}
              <View style={styles.titleWrapper}>
                <Text style={styles.title}>
                  {step.prefixText && <Text>{step.prefixText}</Text>}
                  <Text style={styles.highlightedText}>{step.highlightedText}</Text>
                  <Text>{step.normalText}</Text>
                </Text>
              </View>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                {step.subtitle}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Fixed Header */}
      <SafeAreaView style={styles.header} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/icon.png')}
              style={styles.logoIconImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>BUILDSURE</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Fixed Bottom Controls (Dots & Button) */}
      <View style={styles.bottomControls} pointerEvents="box-none">
        {/* Page Indicators */}
        <View style={styles.indicatorContainer}>
          {steps.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => handleDotPress(index)}
              style={[
                styles.indicator,
                index === currentStep ? styles.indicatorActive : styles.indicatorInactive,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.buttonWrapper}>
          <SwipeButton
            onSwipeComplete={onComplete}
            text="Get Started"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  imageShadowWrapper: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.125, // #00000020
    shadowRadius: 2.6,
    elevation: 3,
    backgroundColor: '#FEFAF4',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconImage: {
    width: 30,
    height: 30,
  },
  logoText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  headerSignInButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerSignInText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  textSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
    paddingBottom: 180, // Safe distance for absolute bottom controls
  },
  titleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'center',
    lineHeight: 40,
  },
  highlightedText: {
    color: '#D87C24',
  },
  subtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
  indicatorActive: {
    width: 28,
    backgroundColor: '#FFA726',
  },
  indicatorInactive: {
    width: 6,
    backgroundColor: '#E5E0D8',
  },
  buttonWrapper: {
    width: '100%',
  },
});
