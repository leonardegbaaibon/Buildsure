import { Platform } from 'react-native';

// In-memory fallback cache
const memoryStore = new Map<string, string>();

/**
 * Robust async storage interface that uses:
 * 1. expo-secure-store if available on native platforms
 * 2. localStorage on web platforms
 * 3. In-memory storage as a final fallback
 */
export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn('LocalStorage is not available, falling back to memory store', e);
      }
    } else {
      // Try to dynamically require expo-secure-store
      try {
        const SecureStore = require('expo-secure-store');
        await SecureStore.setItemAsync(key, value);
        return;
      } catch {
        // Safe fallback in case library is not present in bundle/node_modules
        if (__DEV__) {
          console.log(`[Storage Fallback] expo-secure-store not available. Storing in memory: ${key}`);
        }
      }
    }
    
    // In-memory fallback
    memoryStore.set(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return window.localStorage.getItem(key);
      } catch {
        // Fallback to memory
      }
    } else {
      try {
        const SecureStore = require('expo-secure-store');
        return await SecureStore.getItemAsync(key);
      } catch {
        // Fallback to memory
      }
    }
    
    return memoryStore.get(key) || null;
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // Fallback to memory
      }
    } else {
      try {
        const SecureStore = require('expo-secure-store');
        await SecureStore.deleteItemAsync(key);
        return;
      } catch {
        // Fallback to memory
      }
    }
    
    memoryStore.delete(key);
  }
};
