import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const SPORT_MEMBER = "sport_member";
  const [user, setUser] = useState(() => {
    try {
      const storedUser = sessionStorage.getItem(SPORT_MEMBER);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.warn("Could not read user from sessionStorage", error);
      return null;
    }
  });

  const login = (userData) => {
    // Expects backend response payload with member_id, member_name, email
    const newUser = {
      member_id: userData.member_id || userData.memberId || 1,
      member_name: userData.member_name || userData.memberName || userData.name || 'Member',
      email: userData.email || ''
    };
    setUser(newUser);
    sessionStorage.setItem(SPORT_MEMBER, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(SPORT_MEMBER);
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
