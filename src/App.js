import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { EquipmentProvider } from './context/EquipmentContext';
import LoginForm from './components/LoginForm/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import IssueEquipmentForm from './components/EnrollmentForm/IssueEquipmentForm';

const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RedirectIfAuthenticated = ({ children }) => {
  const { user } = useUser();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <UserProvider>
      <EquipmentProvider>
        <BrowserRouter>
          <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '20px' }}>
            <Routes>
              <Route
                path="/login"
                element={<RedirectIfAuthenticated> <LoginForm /> </RedirectIfAuthenticated>}
              />
              <Route
                path="/dashboard"
                element={<ProtectedRoute><Dashboard /> </ProtectedRoute>}
              />
              <Route
                path="/issue-equipment"
                element={
                  <ProtectedRoute>
                    <IssueEquipmentForm />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </EquipmentProvider>
    </UserProvider>
  );
}

export default App;
