import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToasterProvider } from '@/hooks/useToast';
import { ProtectedRoute, PublicRoute } from '@/routes/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import Customers from '@/pages/Customers';
import Invoices from '@/pages/Invoices';
import InvoiceBuilder from '@/pages/InvoiceBuilder';
import InvoiceFormats from '@/pages/InvoiceFormats';
import PublicInvoice from '@/pages/PublicInvoice';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToasterProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/invoice/:invoiceNumber" element={<PublicInvoice />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/formats" element={<ProtectedRoute><InvoiceFormats /></ProtectedRoute>} />
            <Route path="/invoices/new" element={<ProtectedRoute><InvoiceBuilder /></ProtectedRoute>} />
            <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceBuilder /></ProtectedRoute>} />
            <Route path="/invoices/:id/edit" element={<ProtectedRoute><InvoiceBuilder /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToasterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
