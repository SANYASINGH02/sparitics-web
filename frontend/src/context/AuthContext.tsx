import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  userID: string | null;
  userType: string | null;
  isAuthenticated: boolean;
  login: (token: string, userID: string, userType: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserID = localStorage.getItem('userID');
    const storedUserType = localStorage.getItem('userType');
    if (storedToken) {
      setToken(storedToken);
      setUserID(storedUserID);
      setUserType(storedUserType);
    }
  }, []);

  const login = (newToken: string, newUserID: string, newUserType: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userID', newUserID);
    localStorage.setItem('userType', newUserType);
    setToken(newToken);
    setUserID(newUserID);
    setUserType(newUserType);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userID');
    localStorage.removeItem('userType');
    setToken(null);
    setUserID(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ token, userID, userType, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
