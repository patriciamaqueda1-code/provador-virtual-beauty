import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import { saveSession } from './lib/sessions';
import type { UserRole } from './types';
import Landing from './components/Landing';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Painel from './components/Painel';
import SuperAdmin from './components/SuperAdmin';
import CustomerPortal from './components/CustomerPortal';
import PublicSalon from './components/PublicSalon';
import NailTryOn from './components/NailTryOn';
import HairTryOn from './components/HairTryOn';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-fuchsia-600 animate-spin" />
    </div>
  );
}

function homeFor(role: UserRole | null): string {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'customer') return '/minha-conta';
  return '/painel';
}

function Protected({ roles, children }: { roles?: UserRole[]; children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && role && !roles.includes(role)) return <Navigate to={homeFor(role)} replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={homeFor(role)} replace />;
  return <>{children}</>;
}

function RootRoute() {
  const { user, role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={homeFor(role)} replace />;
  return <Landing />;
}

// Painel do salão: provador salva via client com a sessão do dono.
function NailRoute() {
  const navigate = useNavigate();
  const { salon, refreshSalon } = useAuth();
  return (
    <NailTryOn
      onBack={() => navigate('/painel')}
      onResult={(img, params) => {
        if (salon) saveSession(salon.id, 'nail', img, params).then(refreshSalon);
      }}
    />
  );
}
function HairRoute() {
  const navigate = useNavigate();
  const { salon, refreshSalon } = useAuth();
  return (
    <HairTryOn
      onBack={() => navigate('/painel')}
      onResult={(img, params) => {
        if (salon) saveSession(salon.id, 'hair', img, params).then(refreshSalon);
      }}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/onboarding" element={<Protected roles={['seller_owner']}><Onboarding /></Protected>} />

          {/* Super Admin */}
          <Route path="/super-admin" element={<Protected roles={['super_admin']}><SuperAdmin /></Protected>} />

          {/* Seller (salão) */}
          <Route path="/painel" element={<Protected roles={['seller_owner', 'seller_staff']}><Painel /></Protected>} />
          <Route path="/provador/nail" element={<Protected roles={['seller_owner', 'seller_staff']}><NailRoute /></Protected>} />
          <Route path="/provador/hair" element={<Protected roles={['seller_owner', 'seller_staff']}><HairRoute /></Protected>} />

          {/* Cliente final */}
          <Route path="/minha-conta" element={<Protected roles={['customer']}><CustomerPortal /></Protected>} />

          <Route path="/" element={<RootRoute />} />

          {/* Página pública do salão — provador + agendamento */}
          <Route path="/:slug" element={<PublicSalon />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
