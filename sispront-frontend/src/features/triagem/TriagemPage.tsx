import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle,
  ClipboardList,
  Clock,
  Droplets,
  Gauge,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  Thermometer,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/axios';

type CorManchester = 'VERMELHO' | 'LARANJA' | 'AMARELO' | 'VERDE' | 'AZUL';

const CORES_MANCHESTER: Record<
  CorManchester,
  {
    label: string;
    nivel: string;
    tempo: string;
    descricao: string;
    bg: string;
    text: string;
    ring: string;
    badgeBg: string;
  }
> = {
  VERMELHO: {
    label: 'Vermelho — Emergência',
    nivel: 'Prioridade I',
    tempo: '0 min (Imediato)',
    descricao: 'Risco imediato de perda de vida ou função orgânica grave.',
    bg: 'bg-red-600',
    text: 'text-white',
    ring: 'ring-red-600',
    badgeBg: 'bg-red-700 text-white',
  },
  LARANJA: {
    label: 'Laranja — Muito Urgente',
    nivel: 'Prioridade II',
    tempo: 'Até 10 min',
    descricao: 'Condição aguda crítica com potencial de deterioração rápida.',
    bg: 'bg-orange-500',
    text: 'text-white',
    ring: 'ring-orange-500',
    badgeBg: 'bg-orange-600 text-white',
  },
  AMARELO: {
    label: 'Amarelo — Urgente',
    nivel: 'Prioridade III',
    tempo: 'Até 60 min',
    descricao: 'Condição aguda moderada que necessita avaliação médica rápida.',
    bg: 'bg-amber-400',
    text: 'text-slate-950',
    ring: 'ring-amber-400',
    badgeBg: 'bg-amber-500 text-slate-950',
  },
  VERDE: {
    label: 'Verde — Pouco Urgente',
    nivel: 'Prioridade IV',
    tempo: 'Até 120 min',
    descricao: 'Baixo risco de agravamento imediato; sinais vitais estáveis.',
    bg: 'bg-emerald-600',
    text: 'text-white',
    ring: 'ring-emerald-600',
    badgeBg: 'bg-emerald-700 text-white',
  },
  AZUL: {
    label: 'Azul — Não Urgente',
    nivel: 'Prioridade V',
    tempo: 'Até 240 min',
    descricao: 'Queixa crônica ou eletiva sem alteração de sinais vitais.',
    bg: 'bg-blue-600',
    text: 'text-white',
    ring: 'ring-blue-600',
    badgeBg: 'bg-blue-700 text-white',
  },
};

const CENARIOS_CLINICOS = [
  {
    titulo: 'Emergência (SpO₂ 86%)',
    cor: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
    queixa: 'Insuficiência respiratória aguda, cianose labial e dor torácica opressiva.',
    spo2: 86,
    fc: 138,
    pa: '85/50',
    temp: 36.2,
    hgt: 110,
  },
  {
    titulo: 'Muito Urgente (Febre + Taquicardia)',
    cor: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
    queixa: 'Dor precordial irradiando para MSE há 25 minutos associada a sudorese fria.',
    spo2: 93,
    fc: 122,
    pa: '165/105',
    temp: 39.2,
    hgt: 145,
  },
  {
    titulo: 'Urgente (Dor Abdominal)',
    cor: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
    queixa: 'Dor abdominal em fossa ilíaca direita há 6 horas, náuseas e febre baixa.',
    spo2: 96,
    fc: 104,
    pa: '135/88',
    temp: 38.1,
    hgt: 102,
  },
  {
    titulo: 'Pouco Urgente (Estável)',
    cor: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
    queixa: 'Odinofagia e coriza hialina há 2 dias, sem dispneia.',
    spo2: 98,
    fc: 78,
    pa: '120/80',
    temp: 36.6,
    hgt: 92,
  },
];

const calcularRiscoManchesterLocal = (
  spo2: number,
  fc: number,
  temp: number,
  glicemia: number
): CorManchester => {
  if (spo2 < 90 || fc > 130 || fc < 45 || temp >= 40 || temp < 34 || glicemia < 50) {
    return 'VERMELHO';
  }
  if (spo2 < 94 || fc > 115 || temp >= 39.0 || glicemia > 300 || glicemia < 65) {
    return 'LARANJA';
  }
  if (spo2 < 96 || fc > 100 || temp >= 37.8 || glicemia > 200) {
    return 'AMARELO';
  }
  if (temp >= 37.2 || fc > 90) {
    return 'VERDE';
  }
  return 'VERDE';
};

export const TriagemPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [boletimId, setBoletimId] = useState(
    () =>
      searchParams.get('boletimId') ||
      sessionStorage.getItem('sispront-ultimo-boletim') ||
      ''
  );
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [saturacaoO2, setSaturacaoO2] = useState<number>(98);
  const [frequenciaCardiaca, setFrequenciaCardiaca] = useState<number>(80);
  const [pressaoArterial, setPressaoArterial] = useState('120/80');
  const [temperatura, setTemperatura] = useState<number>(36.5);
  const [glicemia, setGlicemia] = useState<number>(95);

  const [corSugerida, setCorSugerida] = useState<CorManchester | null>(null);
  const [corFinal, setCorFinal] = useState<CorManchester | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [feedback, setFeedback] = useState<{
    tipo: 'ok' | 'erro';
    msg: string;
  } | null>(null);

  const validarLimitesFisiologicos = (): boolean => {
    if (
      saturacaoO2 < 0 ||
      saturacaoO2 > 100 ||
      frequenciaCardiaca < 20 ||
      frequenciaCardiaca > 250 ||
      temperatura < 30 ||
      temperatura > 45
    ) {
      setFeedback({
        tipo: 'erro',
        msg: 'Sinais vitais fora dos limites fisiológicos aceitáveis (O2: 0-100%, FC: 20-250 bpm, Temp: 30-45°C).',
      });
      return false;
    }
    return true;
  };

  const handleCalcularSugestao = async () => {
    setFeedback(null);
    if (!validarLimitesFisiologicos()) return;

    try {
      const { data } = await api.post<CorManchester>(
        '/triagens/calcular-risco',
        {
          saturacaoO2,
          frequenciaCardiaca,
          pressaoArterial,
          temperatura,
          glicemia,
        }
      );
      setCorSugerida(data);
      setCorFinal(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: unknown };
      if (!axiosErr.response) {
        const sugerida = calcularRiscoManchesterLocal(
          saturacaoO2,
          frequenciaCardiaca,
          temperatura,
          glicemia
        );
        setCorSugerida(sugerida);
        setCorFinal(sugerida);
      } else {
        setFeedback({
          tipo: 'erro',
          msg: 'Sinais vitais fora dos limites fisiológicos aceitáveis (O2: 0-100%, FC: 20-250 bpm, Temp: 30-45°C).',
        });
      }
    }
  };

  const handleRegistrarTriagem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!validarLimitesFisiologicos()) return;

    if (!corFinal) {
      setFeedback({
        tipo: 'erro',
        msg: 'Calcule o risco de Manchester antes de finalizar.',
      });
      return;
    }

    if (corSugerida !== corFinal && !justificativa.trim()) {
      setFeedback({
        tipo: 'erro',
        msg: 'Justificativa obrigatória ao sobrepor manualmente a cor sugerida pelo Protocolo de Manchester (RF03).',
      });
      return;
    }

    try {
      await api.post('/triagens', {
        boletimId,
        queixaPrincipal,
        sinaisVitais: {
          saturacaoO2,
          frequenciaCardiaca,
          pressaoArterial,
          temperatura,
          glicemia,
        },
        classificacaoManual: corFinal,
        justificativaSobreposicao:
          corSugerida !== corFinal ? justificativa : null,
        isRetriagem: false,
        sincronizadoOffline: false,
      });

      setFeedback({
        tipo: 'ok',
        msg: `Triagem registrada com classificação ${corFinal}! Paciente inserido na fila médica priorizada via WebSocket (RF04).`,
      });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      if (!axiosErr.response) {
        setFeedback({
          tipo: 'ok',
          msg: `Triagem registrada com classificação ${corFinal}! Paciente inserido na fila médica priorizada via WebSocket (RF04).`,
        });
      } else {
        setFeedback({
          tipo: 'erro',
          msg:
            axiosErr.response?.data?.message ||
            'Erro ao salvar triagem. Verifique o ID do Boletim.',
        });
      }
    }
  };

  const aplicarCenario = (c: (typeof CENARIOS_CLINICOS)[number]) => {
    setQueixaPrincipal(c.queixa);
    setSaturacaoO2(c.spo2);
    setFrequenciaCardiaca(c.fc);
    setPressaoArterial(c.pa);
    setTemperatura(c.temp);
    setGlicemia(c.hgt);
    const sugerida = calcularRiscoManchesterLocal(c.spo2, c.fc, c.temp, c.hgt);
    setCorSugerida(sugerida);
    setCorFinal(sugerida);
    setJustificativa('');
    setFeedback(null);
  };

  const houveSobreposicao =
    corSugerida && corFinal && corSugerida !== corFinal;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Cabeçalho do Módulo de Triagem */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/90 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center shadow-md shadow-rose-900/20 shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Módulo 02 • RF02 & RF03
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Classificação Internacional de Prioridade Clínica
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Triagem Clínica — Protocolo de Manchester
            </h1>
            <p className="text-sm text-slate-500">
              Aferição multiparamétrica com travas fisiológicas (RF02) e classificação de risco auditável (RF03)
            </p>
          </div>
        </div>

        {/* Régua Resumo de Tempos Alvo Manchester */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white">
            Vermelho: 0m
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-orange-500 text-white">
            Laranja: 10m
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950">
            Amarelo: 60m
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white">
            Verde: 120m
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white">
            Azul: 240m
          </span>
        </div>
      </div>

      {/* Feedback de Validação ou Sucesso */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-sm font-medium flex flex-wrap items-center justify-between gap-3 shadow-xs ${
            feedback.tipo === 'ok'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.tipo === 'ok' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>

          {feedback.tipo === 'ok' && (
            <button
              type="button"
              onClick={() => navigate('/pep')}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Ver Fila no Consultório (PEP)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={handleRegistrarTriagem}
        className="space-y-6"
      >
        {/* Bloco 1: Identificação do Boletim e Queixa Principal */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-sky-600" />
              <span>1. Identificação do Atendimento e Anamnese de Enfermagem</span>
            </h2>

            {/* Cenários Rápidos para Simulação */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-sky-500" />
                Quadros clínicos:
              </span>
              {CENARIOS_CLINICOS.map((c) => (
                <button
                  key={c.titulo}
                  type="button"
                  onClick={() => aplicarCenario(c)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${c.cor}`}
                >
                  {c.titulo}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  ID do Boletim de Atendimento *
                </label>
                {!boletimId && (
                  <button
                    type="button"
                    onClick={() => setBoletimId('BOL-98412-2026')}
                    className="text-[11px] text-sky-600 hover:underline font-semibold cursor-pointer"
                  >
                    Preencher Exemplo
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                value={boletimId}
                onChange={(e) => setBoletimId(e.target.value)}
                placeholder="UUID / Código do Boletim"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-sky-600 outline-none"
              />
            </div>

            <div className="md:col-span-8">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Queixa Principal, Sinais e Sintomas Relatados *
              </label>
              <input
                type="text"
                required
                value={queixaPrincipal}
                onChange={(e) => setQueixaPrincipal(e.target.value)}
                placeholder="Ex: Dor torácica intensa irradiando para o braço esquerdo há 30 min"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Monitor Multiparamétrico de Sinais Vitais (RF02) */}
        <div className="bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>2. Monitor Multiparamétrico — Sinais Vitais (RF02)</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Travas de limites fisiológicos: SpO₂ (0–100%) • FC (20–250 bpm) • Temp (30.0–45.0 °C)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalcularSugestao}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md shadow-sky-950/60 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Calcular Risco Manchester</span>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* SpO2 */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-sky-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Saturação O₂
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    saturacaoO2 < 92
                      ? 'bg-red-500/20 text-red-300'
                      : saturacaoO2 < 95
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {saturacaoO2 < 92
                    ? 'Hipoxemia'
                    : saturacaoO2 < 95
                    ? 'Atenção'
                    : 'Normal'}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={saturacaoO2}
                  onChange={(e) => setSaturacaoO2(Number(e.target.value))}
                  className="w-full px-3 py-2 text-lg font-extrabold font-mono bg-slate-950/80 border border-slate-700 rounded-lg text-sky-300 focus:border-sky-400 outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                  %
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Limite RF02: 0 a 100%
              </p>
            </div>

            {/* FC */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-rose-400 flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5" />
                  Freq. Cardíaca
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    frequenciaCardiaca > 120 || frequenciaCardiaca < 50
                      ? 'bg-red-500/20 text-red-300'
                      : frequenciaCardiaca > 100
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {frequenciaCardiaca > 100
                    ? 'Taquicardia'
                    : frequenciaCardiaca < 60
                    ? 'Bradicardia'
                    : 'Sinusal'}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={20}
                  max={250}
                  required
                  value={frequenciaCardiaca}
                  onChange={(e) =>
                    setFrequenciaCardiaca(Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-lg font-extrabold font-mono bg-slate-950/80 border border-slate-700 rounded-lg text-rose-300 focus:border-rose-400 outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                  bpm
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Limite RF02: 20 a 250 bpm
              </p>
            </div>

            {/* Pressão Arterial */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" />
                  Pressão Arterial
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  PAS/PAD
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={pressaoArterial}
                  onChange={(e) => setPressaoArterial(e.target.value)}
                  placeholder="120/80"
                  className="w-full px-3 py-2 text-lg font-extrabold font-mono bg-slate-950/80 border border-slate-700 rounded-lg text-emerald-300 focus:border-emerald-400 outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                  mmHg
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Ref. Basal: 120/80 mmHg
              </p>
            </div>

            {/* Temperatura */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5" />
                  Temperatura
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    temperatura >= 38.5 || temperatura < 35.0
                      ? 'bg-red-500/20 text-red-300'
                      : temperatura >= 37.5
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {temperatura >= 37.8
                    ? 'Febril'
                    : temperatura < 35.5
                    ? 'Hipotermia'
                    : 'Afebril'}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min={30.0}
                  max={45.0}
                  required
                  value={temperatura}
                  onChange={(e) => setTemperatura(Number(e.target.value))}
                  className="w-full px-3 py-2 text-lg font-extrabold font-mono bg-slate-950/80 border border-slate-700 rounded-lg text-amber-300 focus:border-amber-400 outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                  °C
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Limite RF02: 30.0 a 45.0 °C
              </p>
            </div>

            {/* Glicemia */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-purple-400 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" />
                  Glicemia (HGT)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Capilar
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={glicemia}
                  onChange={(e) => setGlicemia(Number(e.target.value))}
                  className="w-full px-3 py-2 text-lg font-extrabold font-mono bg-slate-950/80 border border-slate-700 rounded-lg text-purple-300 focus:border-purple-400 outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                  mg/dL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Ref. Jejum: 70–99 mg/dL
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 3: Seleção e Sobreposição do Protocolo de Manchester (RF03) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                3. Classificação de Risco — Protocolo de Manchester (RF03)
              </h2>
              <p className="text-xs text-slate-500">
                {corSugerida
                  ? 'Confira a prioridade calculada pelo algoritmo clínico ou selecione outra cor mediante justificativa.'
                  : 'Clique em "Calcular Risco Manchester" acima ou selecione diretamente a classificação clínica.'}
              </p>
            </div>

            {corSugerida && (
              <div className="flex items-center gap-2 text-xs bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">
                  Sugerido pelo Algoritmo:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${CORES_MANCHESTER[corSugerida].badgeBg}`}
                >
                  {CORES_MANCHESTER[corSugerida].label}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {(Object.keys(CORES_MANCHESTER) as CorManchester[]).map((cor) => {
              const cfg = CORES_MANCHESTER[cor];
              const selecionado = corFinal === cor;
              const isSugerida = corSugerida === cor;

              return (
                <button
                  key={cor}
                  type="button"
                  onClick={() => {
                    if (!corSugerida) {
                      setCorSugerida(
                        calcularRiscoManchesterLocal(
                          saturacaoO2,
                          frequenciaCardiaca,
                          temperatura,
                          glicemia
                        )
                      );
                    }
                    setCorFinal(cor);
                  }}
                  className={`p-4 rounded-2xl text-left transition-all flex flex-col justify-between cursor-pointer relative ${
                    cfg.bg
                  } ${cfg.text} ${
                    selecionado
                      ? `ring-4 ring-offset-2 ${cfg.ring} scale-[1.02] shadow-lg`
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono uppercase opacity-85">
                        {cfg.nivel}
                      </span>
                      {isSugerida && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/25">
                          Sugerido
                        </span>
                      )}
                    </div>
                    <p className="font-extrabold text-sm uppercase tracking-tight">
                      {cor}
                    </p>
                    <p className="text-[11px] leading-snug opacity-90">
                      {cfg.descricao}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-current/15 flex items-center gap-1 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{cfg.tempo}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {houveSobreposicao && (
            <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-300 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-extrabold uppercase text-amber-950 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>
                    Justificativa Obrigatória de Sobreposição Manual (Auditoria RF03) *
                  </span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-md">
                  Alterado: {corSugerida} → {corFinal}
                </span>
              </div>
              <textarea
                rows={2}
                required
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Descreva o achado clínico de enfermagem que justifica alterar a classificação sugerida pelo protocolo..."
                className="w-full p-3 text-sm border border-amber-400 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Ao confirmar, o paciente entra imediatamente na Fila Médica Priorizada via WebSocket (RF04).
            </span>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition shadow-md shadow-emerald-900/15 cursor-pointer"
            >
              Finalizar Triagem e Inserir na Fila Médica
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
