/**
 * User Provider Component
 * 
 * This component provides a context for user information that can be accessed
 * throughout the application, even when the full auth context is not available
 * (such as in SSR environments or before authentication is initialized).
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserInfo, getUserInfo, saveUserInfo } from '../../utils/userInfoStorage';

// Context for user information
const UserContext = createContext<{
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo) => void;
  clearUserInfo: () => void;
}>({
  userInfo: null,
  setUserInfo: () => {},
  clearUserInfo: () => {}
});

interface UserProviderProps {
  children: ReactNode;
}

/**
 * UserProvider component that manages user information state and provides it to the application
 */
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null);

  // Initialize user info from localStorage when component mounts
  useEffect(() => {
    const storedUserInfo = getUserInfo();
    if (storedUserInfo) {
      setUserInfoState(storedUserInfo);
    }
  }, []);

  // Function to set user info and persist it to localStorage
  const setUserInfo = (info: UserInfo) => {
    setUserInfoState(info);
    saveUserInfo(info);
  };

  // Function to clear user info
  const clearUserInfo = () => {
    setUserInfoState(null);
    localStorage.removeItem('user_info');
  };

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo, clearUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Custom hook to access user info from the context
 */
export const useUserInfo = () => {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error('useUserInfo must be used within a UserProvider');
  }
  
  return context;
};
