import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import { saveSession } from './lib/sessions';
import Landing from './components/Landing';
import Login from './components/Login';
import Painel from './components/Painel';
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

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/painel" replace />;
  return <Landing />;
}

// Wrappers do PAINEL (salão logado): salvam via client com a sessão do dono.
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
          {/* Rotas fixas (prioridade sobre /:slug) */}
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/painel" element={<Protected><Painel /></Protected>} />
          <Route path="/provador/nail" element={<Protected><NailRoute /></Protected>} />
          <Route path="/provador/hair" element={<Protected><HairRoute /></Protected>} />
          <Route path="/" element={<RootRoute />} />

          {/* Página pública do salão — o cliente acessa por aqui */}
          <Route path="/:slug" element={<PublicSalon />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
