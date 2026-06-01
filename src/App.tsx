import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './components/Login';
import Painel from './components/Painel';
import NailTryOn from './components/NailTryOn';
import HairTryOn from './components/HairTryOn';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-fuchsia-600 animate-spin" />
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/painel" replace />;
  return <>{children}</>;
}

// Wrappers que injetam navegação nos provadores existentes
function NailRoute() {
  const navigate = useNavigate();
  return <NailTryOn onBack={() => navigate('/painel')} />;
}
function HairRoute() {
  const navigate = useNavigate();
  return <HairTryOn onBack={() => navigate('/painel')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/painel" element={<Protected><Painel /></Protected>} />
          <Route path="/provador/nail" element={<Protected><NailRoute /></Protected>} />
          <Route path="/provador/hair" element={<Protected><HairRoute /></Protected>} />
          <Route path="/" element={<Navigate to="/painel" replace />} />
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
