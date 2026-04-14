import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import PartImportPage from './pages/PartImportPage';
import UserManagementPage from './pages/UserManagementPage';
import CountingDashboard from './pages/CountingDashboard';
import CountingInterfacePage from './pages/CountingInterfacePage';
import TransactionLoadPage from './pages/TransactionLoadPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/parts/import" element={<PartImportPage />} />
            <Route path="/users/manage" element={<UserManagementPage />} />
            <Route path="/counting" element={<CountingDashboard />} />
            <Route path="/counting/interface" element={<CountingInterfacePage />} />
            <Route path="/transactions" element={<TransactionLoadPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
