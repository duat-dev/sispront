import {
  Activity,
  BedDouble,
  ClipboardList,
  HeartPulse,
  LogOut,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import React from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { MapaLeitosPage } from './features/leitos/MapaLeitosPage';
import { AtendimentoMedicoPepPage } from './features/pep/AtendimentoMedicoPepPage';
import { RecepcaoPage } from './features/recepcao/RecepcaoPage';
import { TriagemPage } from './features/triagem/TriagemPage';
import { type PerfilUsuario, useAuthStore } from './stores/useAuthStore';

const PERFIL_LABELS: Record<
  PerfilUsuario,
  { label: string; badge: string }
> = {
  RECEPCIONISTA: {
    label: 'Recepção Hospitalar',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
  },
  ENFERMEIRO_TRIAGEM: {
    label: 'Enfermagem • Triagem',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
  },
  MEDICO_PLANTONISTA: {
    label: 'Médico Plantonista',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  },
  GESTOR_LEITOS: {
    label: 'Gestão de Leitos (NIR)',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
  },
  EQUIPE_HIGIENIZACAO: {
    label: 'Governança & Higienização',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  },
};

const NAV_ITEMS = [
  {
    to: '/recepcao',
    step: '01',
    label: 'Recepção & Admissão',
    rf: 'RF01',
    icon: ClipboardList,
  },
  {
    to: '/triagem',
    step: '02',
    label: 'Triagem Manchester',
    rf: 'RF02 • RF03',
    icon: HeartPulse,
  },
  {
    to: '/pep',
    step: '03',
    label: 'Consultório & PEP',
    rf: 'RF04–RF07 • RF10',
    icon: Stethoscope,
  },
  {
    to: '/leitos',
    step: '04',
    label: 'Mapa de Leitos & QR',
    rf: 'RF08 • RF11',
    icon: BedDouble,
  },
];

const PrivateLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, nome, perfil, logout } = useAuthStore();
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  const perfilInfo = perfil
    ? PERFIL_LABELS[perfil]
    : {
        label: 'Profissional de Saúde',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      };

  return (
    <div className="min-h-screen bg-slate-100 bg-clinical-grid flex flex-col">
      {/* Top Institutional Clinical Bar */}
      <div className="bg-slate-950 text-slate-400 border-b border-slate-800/80 px-4 lg:px-8 py-1.5 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Rede Hospitalar Conectada
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">
            Protocolo de Manchester & Prontuário Eletrônico Imutável
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Proteção de Sessão Ativa (Timeout 10 min — RNF03)
          </span>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center shadow-lg shadow-sky-900/40 border border-white/15">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  SISPRONT
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  HIS • PEP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Gestão de Pronto-Socorro, Triagem e Leitos
              </p>
            </div>
          </div>

          {/* Clinical Workflow Navigation */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 shrink-0 border ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white border-sky-400/50 shadow-md shadow-sky-950/50'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : 'text-sky-400 group-hover:text-sky-300'
                    }`}
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 leading-none">
                      <span
                        className={`text-[10px] font-mono ${
                          isActive ? 'text-sky-200' : 'text-slate-400'
                        }`}
                      >
                        {item.step}.
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={`block text-[10px] font-mono mt-0.5 ${
                        isActive ? 'text-sky-100/90' : 'text-slate-400'
                      }`}
                    >
                      {item.rf}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Professional Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-sky-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-xs leading-tight">
                <p className="font-semibold text-slate-100">{nome}</p>
                <span
                  className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded border ${perfilInfo.badge}`}
                >
                  {perfilInfo.label}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Encerrar plantão e sair"
              className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Clinical Workspace */}
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">{children}</main>

      {/* Institutional Footer */}
      <footer className="bg-white/80 backdrop-blur border-t border-slate-200/80 py-3 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <span className="font-semibold text-slate-700">SISPRONT</span>
            <span>— Sistema Hospitalar de Triagem Manchester, PEP e Gestão de Leitos</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>SLA &lt; 1.5s (RNF01)</span>
            <span>•</span>
            <span>Auditoria Imutável (RF05/RF07)</span>
            <span>•</span>
            <span>WebSocket STOMP Tempo Real</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/recepcao"
          element={
            <PrivateLayout>
              <RecepcaoPage />
            </PrivateLayout>
          }
        />
        <Route
          path="/triagem"
          element={
            <PrivateLayout>
              <TriagemPage />
            </PrivateLayout>
          }
        />
        <Route
          path="/leitos"
          element={
            <PrivateLayout>
              <MapaLeitosPage />
            </PrivateLayout>
          }
        />
        <Route
          path="/pep"
          element={
            <PrivateLayout>
              <AtendimentoMedicoPepPage />
            </PrivateLayout>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
