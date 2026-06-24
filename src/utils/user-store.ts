let userName = 'Saad Bashar';
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
