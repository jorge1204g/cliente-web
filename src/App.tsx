import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateOrderPage from './pages/CreateOrderPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/inicio" element={<Dashboard />} />
          <Route path="/crear-pedido" element={<CreateOrderPage />} />
          <Route path="/mis-pedidos" element={<MyOrdersPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/inicio" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
