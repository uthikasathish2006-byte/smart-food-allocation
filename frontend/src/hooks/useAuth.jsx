import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: 'USR-8820',
  name: 'Admin Lead',
  email: 'admin@zerohunger.org',
  role: 'admin',
  organization: 'UN SDG 2 Allocation Network',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smart_food_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    if (user) {
      localStorage.setItem('smart_food_user', JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('smart_food_user');
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = (data) => {
    const userData = data.user || data;
    const token = data.token;
    if (token) {
      localStorage.setItem('token', token);
    }
    const newUser = {
      ...DEFAULT_USER,
      ...userData,
    };
    setUser(newUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('smart_food_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
