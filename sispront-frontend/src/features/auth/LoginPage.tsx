import {
  Activity,
  ArrowRight,
  BedDouble,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileText,
  HeartPulse,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/axios';
import { type PerfilUsuario, useAuthStore } from '../../stores/useAuthStore';

const PERFIS_PLANTAO: {
  perfil: PerfilUsuario;
  label: string;
  loginSugerido: string;
  nomeDemo: string;
  rota: string;
  cor: string;
}[] = [
  {
    perfil: 'RECEPCIONISTA',
    label: 'Recepção (RF01)',
    loginSugerido: 'rec.atendimento',
    nomeDemo: 'Carla Mendes • Recepção',
    rota: '/recepcao',
    cor: 'hover:border-sky-500 hover:bg-sky-50 text-sky-800 border-sky-200 bg-sky-50/50',
  },
  {
    perfil: 'ENFERMEIRO_TRIAGEM',
    label: 'Triagem (RF02/03)',
    loginSugerido: 'enf.triagem',
    nomeDemo: 'Enf. Rafael Costa • COREN 41920',
    rota: '/triagem',
    cor: 'hover:border-rose-500 hover:bg-rose-50 text-rose-800 border-rose-200 bg-rose-50/50',
  },
  {
    perfil: 'MEDICO_PLANTONISTA',
    label: 'Médico PEP (RF04–10)',
    loginSugerido: 'med.plantonista',
    nomeDemo: 'Dra. Helena Vasconcelos • CRM 28410',
    rota: '/pep',
    cor: 'hover:border-emerald-500 hover:bg-emerald-50 text-emerald-800 border-emerald-200 bg-emerald-50/50',
  },
  {
    perfil: 'GESTOR_LEITOS',
    label: 'Mapa de Leitos (RF08)',
    loginSugerido: 'gestor.nir',
    nomeDemo: 'Marcos Albuquerque • NIR Leitos',
    rota: '/leitos',
    cor: 'hover:border-indigo-500 hover:bg-indigo-50 text-indigo-800 border-indigo-200 bg-indigo-50/50',
  },
  {
    perfil: 'EQUIPE_HIGIENIZACAO',
    label: 'Higienização QR (RF11)',
    loginSugerido: 'hig.governanca',
    nomeDemo: 'Luciana Rocha • Governança QR',
    rota: '/leitos',
    cor: 'hover:border-amber-500 hover:bg-amber-50 text-amber-900 border-amber-200 bg-amber-50/50',
  },
];

export const LoginPage: React.FC = () => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const redirecionarPorPerfil = (perfil: PerfilUsuario) => {
    switch (perfil) {
      case 'RECEPCIONISTA':
        navigate('/recepcao');
        break;
      case 'ENFERMEIRO_TRIAGEM':
        navigate('/triagem');
        break;
      case 'MEDICO_PLANTONISTA':
        navigate('/pep');
        break;
      default:
        navigate('/leitos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setBloqueado(false);
    setLoading(true);

    try {
      const { data } = await api.post<{
        accessToken: string;
        perfil: PerfilUsuario;
        nome: string;
      }>('/auth/login', { login, senha });

      setAuth(data.accessToken, data.nome, data.perfil);
      redirecionarPorPerfil(data.perfil);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (axiosErr.response?.status === 423) {
        setBloqueado(true);
        setErro(
          axiosErr.response.data?.message ||
            'Conta bloqueada por 15 minutos após 3 tentativas inválidas consecutivas (RNF03).'
        );
      } else {
        setErro('Credenciais inválidas ou servidor indisponível. Verifique seu login e senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcessoDemo = (item: (typeof PERFIS_PLANTAO)[number]) => {
    setAuth(`demo-token-${item.perfil.toLowerCase()}`, item.nomeDemo, item.perfil);
    navigate(item.rota);
  };

  return (
    <div className="min-h-screen bg-hospital-hero flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/15">
        {/* Coluna Esquerda: Identidade Institucional e Módulos Hospitalares */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            {/* Selo Institucional */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-semibold">
              <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>UNIDADE HOSPITALAR DE PRONTO ATENDIMENTO • 24H</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
                  <Stethoscope className="w-7 h-7 text-slate-950" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    SISPRONT
                  </h1>
                  <p className="text-xs font-medium text-sky-300 uppercase tracking-widest">
                    Sistema Integrado de Prontuário e Triagem Clínica
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl pt-1">
                Plataforma hospitalar de missão crítica para recepção unificada,
                classificação de risco pelo <strong className="text-white">Protocolo de Manchester</strong>,
                prontuário eletrônico imutável e governança de leitos em tempo real.
              </p>
            </div>

            {/* Cards dos 4 Pilares Clínicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-center gap-2.5 text-sky-300 font-bold text-xs uppercase tracking-wider mb-1">
                  <ClipboardCheck className="w-4 h-4 text-sky-400" />
                  1. Admissão & CPF (RF01)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Validação matemática de CPF, prevenção de prontuários duplicados e abertura imediata de Boletim.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-center gap-2.5 text-rose-300 font-bold text-xs uppercase tracking-wider mb-1">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  2. Triagem Manchester (RF02/03)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Travas fisiológicas de sinais vitais, cálculo automático de prioridade e auditoria de sobreposição.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-xs uppercase tracking-wider mb-1">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  3. PEP Imutável (RF05–RF07)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Evolução clínica versionada, prescrição com autocomplete oficial, CID-10 e Sumário de Alta obrigatório.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-center gap-2.5 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
                  <BedDouble className="w-4 h-4 text-amber-400" />
                  4. Leitos & QR Code (RF08/11)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Painel sinóptico via WebSocket STOMP e liberação de higienização por dupla checagem de QR Code.
                </p>
              </div>
            </div>
          </div>

          {/* Barra do Protocolo de Manchester & Conformidade */}
          <div className="pt-8 space-y-4 relative z-10">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                <span>ESCALA INTERNACIONAL DE PRIORIDADE CLÍNICA (MANCHESTER)</span>
                <span className="font-mono text-sky-400">RF03 • RF04 • RF12</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-[10px] font-bold text-center">
                <div className="bg-red-600 text-white py-1.5 px-1 rounded-lg">
                  VERMELHO • 0m
                </div>
                <div className="bg-orange-500 text-white py-1.5 px-1 rounded-lg">
                  LARANJA • 10m
                </div>
                <div className="bg-amber-400 text-slate-950 py-1.5 px-1 rounded-lg">
                  AMARELO • 60m
                </div>
                <div className="bg-emerald-600 text-white py-1.5 px-1 rounded-lg">
                  VERDE • 120m
                </div>
                <div className="bg-blue-600 text-white py-1.5 px-1 rounded-lg">
                  AZUL • 240m
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Controle de Acesso RBAC & Bloqueio Automático (RNF03)
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                Tempo de Resposta &lt; 1,5s (RNF01)
              </span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Formulário de Autenticação Hospitalar */}
        <div className="lg:col-span-5 bg-white p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                Acesso Restrito ao Corpo Clínico
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">
                Identificação do Plantonista
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Insira sua matrícula hospitalar e credencial de segurança para iniciar o turno.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isExpired && !erro && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Sessão Encerrada por Inatividade (RNF03)</p>
                    <p className="text-amber-800 mt-0.5">
                      Para proteção dos dados clínicos (LGPD), sua sessão expirou após 10 minutos sem interação.
                    </p>
                  </div>
                </div>
              )}

              {erro && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                    bloqueado
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="font-bold">
                      {bloqueado ? 'Credencial Temporariamente Bloqueada' : 'Falha na Autenticação'}
                    </p>
                    <p className="mt-0.5">{erro}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                  Usuário / Matrícula Funcional
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="Ex: enf.triagem, med.plantonista"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:border-sky-600 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                    Senha de Acesso
                  </label>
                  <span className="text-[11px] text-slate-400">Política RNF03</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mín. 8 caracteres, maiúscula, número e símbolo"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:border-sky-600 outline-none transition"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {mostrarSenha ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-sky-900/15 cursor-pointer"
              >
                <span>{loading ? 'Autenticando Credencial...' : 'Acessar Estação Clínica'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Acesso Rápido para Simulação / Avaliação de Perfis (Seção 1.3) */}
          <div className="pt-6 mt-6 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Acesso Rápido por Perfil (Ambiente de Simulação)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Selecione um perfil hospitalar abaixo para inspecionar imediatamente sua estação de trabalho:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PERFIS_PLANTAO.map((item) => (
                <button
                  key={item.perfil}
                  type="button"
                  onClick={() => handleAcessoDemo(item)}
                  className={`px-2.5 py-2 rounded-xl border text-left text-[11px] font-semibold transition cursor-pointer ${item.cor}`}
                >
                  <span className="block truncate font-bold">{item.label}</span>
                  <span className="block text-[10px] opacity-75 font-mono truncate">
                    {item.loginSugerido}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
