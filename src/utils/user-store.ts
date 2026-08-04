let userName = '';
let userPhone = '';

export const getUserName = () => userName;
export const setUserName = (name: string) => {
  userName = name;
};

export const getUserPhone = () => userPhone;
export const setUserPhone = (phone: string) => {
  userPhone = phone;
};

let isTabBarHidden = false;
const tabBarListeners = new Set<(hidden: boolean) => void>();

export const getTabBarHidden = () => isTabBarHidden;
export const setTabBarHidden = (hidden: boolean) => {
  if (isTabBarHidden !== hidden) {
    isTabBarHidden = hidden;
    tabBarListeners.forEach(listener => listener(hidden));
  }
};
export const subscribeTabBarHidden = (listener: (hidden: boolean) => void) => {
  tabBarListeners.add(listener);
  return () => {
    tabBarListeners.delete(listener);
  };
};

export type AppFlowState = 'onboarding' | 'signup' | 'login' | 'verify-phone' | 'otp' | 'app';
let flowState: AppFlowState = 'onboarding';
const flowStateListeners = new Set<(state: AppFlowState) => void>();

export const getFlowState = () => flowState;
export const setFlowState = (state: AppFlowState) => {
  if (flowState !== state) {
    flowState = state;
    flowStateListeners.forEach(listener => listener(state));
  }
};
export const subscribeFlowState = (listener: (state: AppFlowState) => void) => {
  flowStateListeners.add(listener);
  return () => {
    flowStateListeners.delete(listener);
  };
};

export type AppTabName = 'home' | 'properties' | 'documents' | 'profile';
let activeTab: AppTabName = 'home';
const activeTabListeners = new Set<(tab: AppTabName) => void>();

export const getActiveTab = () => activeTab;
export const setActiveTab = (tab: AppTabName) => {
  if (activeTab !== tab) {
    activeTab = tab;
    activeTabListeners.forEach(listener => listener(tab));
  }
};
export const subscribeActiveTab = (listener: (tab: AppTabName) => void) => {
  activeTabListeners.add(listener);
  return () => {
    activeTabListeners.delete(listener);
  };
};

let shouldStartAddProperty = false;
const addPropertyListeners = new Set<(start: boolean) => void>();

export const getShouldStartAddProperty = () => shouldStartAddProperty;
export const setShouldStartAddProperty = (start: boolean) => {
  shouldStartAddProperty = start;
  addPropertyListeners.forEach(listener => listener(start));
};
export const subscribeShouldStartAddProperty = (listener: (start: boolean) => void) => {
  addPropertyListeners.add(listener);
  return () => {
    addPropertyListeners.delete(listener);
  };
};

export interface PropertyItem {
  id: string;
  title: string;
  address: string;
  type: 'multiple' | 'single';
  unitsCount?: number;
  occupiedCount?: number;
  hasImage?: boolean;
}

let propertiesList: PropertyItem[] = [];

const propertyListeners = new Set<(list: PropertyItem[]) => void>();

export const getProperties = () => propertiesList;
export const setProperties = (list: PropertyItem[]) => {
  propertiesList = list;
  propertyListeners.forEach(listener => listener(list));
};
export const subscribeProperties = (listener: (list: PropertyItem[]) => void) => {
  propertyListeners.add(listener);
  return () => {
    propertyListeners.delete(listener);
  };
};
