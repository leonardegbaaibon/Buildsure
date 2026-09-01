import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  cancelable?: boolean;
  type?: 'info' | 'success' | 'warning' | 'error' | 'destructive';
}

export interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

let globalShowAlert: ((title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void) | null = null;

/**
 * Direct drop-in function replacement for Alert.alert
 * Example:
 * CustomAlert.alert('Title', 'Message', [{ text: 'OK', onPress: () => {} }])
 */
export const CustomAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
    if (globalShowAlert) {
      globalShowAlert(title, message, buttons, options);
    } else {
      console.warn('[CustomAlert] Provider is not mounted yet.');
    }
  },
};

export const showAlert = CustomAlert.alert;

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const show = (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
    const finalButtons: AlertButton[] = buttons && buttons.length > 0
      ? buttons
      : [{ text: 'OK', style: 'default' }];

    setConfig({ title, message, buttons: finalButtons, options });
    setVisible(true);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
    });
  };

  useEffect(() => {
    globalShowAlert = show;
    return () => {
      globalShowAlert = null;
    };
  }, []);

  // Determine icon and badge style based on title or options
  const getBadgeDetails = () => {
    if (!config) return null;
    const lowerTitle = (config.title || '').toLowerCase();
    const hasDestructive = config.buttons?.some((b) => b.style === 'destructive');
    const type = config.options?.type;

    if (type === 'success' || lowerTitle.includes('success') || lowerTitle.includes('saved') || lowerTitle.includes('confirmed') || lowerTitle.includes('downloaded')) {
      return {
        bg: '#EBFDF2',
        border: '#A6F4C5',
        color: '#039855',
        icon: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
      };
    }
    if (type === 'error' || lowerTitle.includes('error') || lowerTitle.includes('failed') || lowerTitle.includes('invalid') || lowerTitle.includes('required')) {
      return {
        bg: '#FEE4E2',
        border: '#FECDCA',
        color: '#D92D20',
        icon: { ios: 'exclamationmark.triangle.fill', android: 'error', web: 'error' },
      };
    }
    if (type === 'destructive' || hasDestructive || lowerTitle.includes('delete') || lowerTitle.includes('remove') || lowerTitle.includes('clear') || lowerTitle.includes('log out')) {
      return {
        bg: '#FEE4E2',
        border: '#FECDCA',
        color: '#F04438',
        icon: { ios: 'trash.fill', android: 'delete', web: 'delete' },
      };
    }
    if (lowerTitle.includes('contract') || lowerTitle.includes('upload') || lowerTitle.includes('document')) {
      return {
        bg: '#FFF4E5',
        border: '#FFE0B2',
        color: '#D87C24',
        icon: { ios: 'doc.text.fill', android: 'description', web: 'description' },
      };
    }

    return {
      bg: '#FFF4E5',
      border: '#FFE0B2',
      color: '#D87C24',
      icon: { ios: 'info.circle.fill', android: 'info', web: 'info' },
    };
  };

  const badge = getBadgeDetails();

  const handleButtonPress = (btn: AlertButton) => {
    hide();
    if (btn.onPress) {
      setTimeout(() => {
        btn.onPress?.();
      }, 150);
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert: show, hideAlert: hide }}>
      {children}

      <Modal
        transparent={true}
        visible={visible}
        animationType="none"
        onRequestClose={() => {
          if (config?.options?.cancelable !== false) {
            hide();
          }
        }}
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: opacityAnim },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => {
                if (config?.options?.cancelable !== false) {
                  hide();
                }
              }}
            />
          </Animated.View>

          {config && (
            <Animated.View
              style={[
                styles.dialogContainer,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Badge Icon */}
              {badge && (
                <View style={[styles.badgeCircle, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  <SymbolView
                    name={badge.icon as any}
                    size={26}
                    tintColor={badge.color}
                  />
                </View>
              )}

              {/* Title */}
              <Text style={styles.titleText}>{config.title}</Text>

              {/* Message */}
              {!!config.message && (
                <Text style={styles.messageText}>{config.message}</Text>
              )}

              {/* Action Buttons */}
              <View
                style={[
                  styles.buttonsRow,
                  (config.buttons?.length || 0) > 2 && styles.buttonsCol,
                ]}
              >
                {config.buttons?.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  const isPrimary = !isCancel && !isDestructive;

                  let btnStyle = styles.primaryBtn;
                  let textStyle = styles.primaryBtnText;

                  if (isCancel) {
                    btnStyle = styles.cancelBtn;
                    textStyle = styles.cancelBtnText;
                  } else if (isDestructive) {
                    btnStyle = styles.destructiveBtn;
                    textStyle = styles.destructiveBtnText;
                  }

                  return (
                    <TouchableOpacity
                      key={`${btn.text}-${index}`}
                      style={[
                        styles.baseBtn,
                        btnStyle,
                        (config.buttons?.length || 0) <= 2 && styles.halfBtn,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleButtonPress(btn)}
                    >
                      <Text style={[styles.baseBtnText, textStyle]}>{btn.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  dialogContainer: {
    width: Math.min(width - 48, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0EDE6',
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  buttonsCol: {
    flexDirection: 'column',
    width: '100%',
  },
  baseBtn: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  halfBtn: {
    flex: 1,
  },
  baseBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#FFA726',
  },
  primaryBtnText: {
    color: '#FFFFFF',
  },
  destructiveBtn: {
    backgroundColor: '#F04438',
  },
  destructiveBtnText: {
    color: '#FFFFFF',
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EBE6DC',
  },
  cancelBtnText: {
    color: '#4B5563',
  },
});
