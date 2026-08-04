import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  // Animation configuration variables
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(-60));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    // Clear any active timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ message, type });

    // Animate In
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 4 seconds
    timerRef.current = setTimeout(() => {
      dismissToast();
    }, 4000);
  };

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getStyleForType = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          container: styles.successContainer,
          text: styles.successText,
          iconName: 'checkmark.circle.fill',
          iconColor: '#027A48',
        };
      case 'error':
        return {
          container: styles.errorContainer,
          text: styles.errorText,
          iconName: 'exclamationmark.triangle.fill',
          iconColor: '#B42318',
        };
      case 'info':
      default:
        return {
          container: styles.infoContainer,
          text: styles.infoText,
          iconName: 'info.circle.fill',
          iconColor: '#B54708',
        };
    }
  };

  const currentStyles = toast ? getStyleForType(toast.type) : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {toast && currentStyles && (
        <Animated.View
          style={[
            styles.toastWrapper,
            currentStyles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.toastContent}>
            <SymbolView
              name={{ 
                ios: currentStyles.iconName as any, 
                android: toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info', 
                web: toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'
              }}
              size={18}
              tintColor={currentStyles.iconColor}
            />
            <Text style={[styles.toastText, currentStyles.text]}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  
  // Success styles
  successContainer: {
    backgroundColor: '#ECFDF3',
    borderColor: '#D1FADF',
  },
  successText: {
    color: '#027A48',
  },
  
  // Error styles
  errorContainer: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FEE4E2',
  },
  errorText: {
    color: '#B42318',
  },
  
  // Info styles
  infoContainer: {
    backgroundColor: '#FFFAEB',
    borderColor: '#FEF0C7',
  },
  infoText: {
    color: '#B54708',
  },
});
