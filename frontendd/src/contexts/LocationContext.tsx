import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

interface LocationContextType {
  pincode: string | null;
  setPincode: (pincode: string) => void;
  clearPincode: () => void; // optional: clear pincode
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [pincode, setPincodeState] = useState<string | null>(null);

  // Load pincode from localStorage once
  useEffect(() => {
    const savedPincode = localStorage.getItem('userPincode');
    if (savedPincode) {
      setPincodeState(savedPincode);
    }
  }, []);

  // Update pincode state and persist to localStorage
  const setPincode = useCallback((newPincode: string) => {
    setPincodeState(newPincode);
    localStorage.setItem('userPincode', newPincode);
  }, []);

  // Optional: clear the pincode
  const clearPincode = useCallback(() => {
    setPincodeState(null);
    localStorage.removeItem('userPincode');
  }, []);

  const value: LocationContextType = {
    pincode,
    setPincode,
    clearPincode,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};