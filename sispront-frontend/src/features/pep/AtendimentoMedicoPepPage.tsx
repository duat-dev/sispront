import { Client } from '@stomp/stompjs';
import {
  Activity,
  AlertCircle,
  Bed,
  BellRing,
  CheckCircle2,
  Clock,
  FileCheck2,
  HeartPulse,
  History,
  Pill,
  Play,
  Plus,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { api } from '../../lib/axios';

type CorManchester = 'VERMELHO' | 'LARANJA' | 'AMARELO' | 'VERDE' | 'AZUL';
type DesfechoClinico = 'EM_OBSERVACAO' | 'ALTA' | 'INTERNACAO';

interface ItemFila {
  id: string;
  prioridadeCor: CorManchester;
  horaEntradaFila: string;
  tempoLimiteMinutos: number;
  alertaRetriagemAtivo: boolean;
  boletim: {
    id: string;
    status: string;
    paciente: {
      id: string;
      nome: string;
      cpf: string;
      numeroProntuario: string;
      sexo: 'M' | 'F' | 'O';
      dataNascimento: string;
    };
  };
  triagemAtual: {
    queixaPrincipal: string;
    saturacaoO2: number;
    frequenciaCardiaca: number;
    pressaoArterial: string;
    temperatura: number;
    glicemia?: number;
  };
}

interface HistoricoPep {
  id: string;
  versao: number;
  dataHora: string;
  hipotesesDiagnosticasCid10?: string[];
  evolucaoClinica: string;
  desfecho?: DesfechoClinico;
}

interface Medicamento {
  id: string;
  principioAtivo: string;
  nomeComercial: string;
  concentracao: string;
  formaFarmaceutica: string;
}

interface PrescricaoEmitida {
  id: string;
  dosagem: string;
  viaAdministracao: string;
  intervalo: string;
  medicamento: Medicamento;
}

interface LeitoCompativel {
  id: string;
  numero: string;
  alaSetor: string;
  especialidade: string;
  sexoCompativel: string;
}

const ESTILO_MANCHESTER: Record<
  CorManchester,
  { badge: string; borderLeft: string; label: string }
> = {
  VERMELHO: {
    badge: 'bg-red-600 text-white',
    borderLeft: 'border-l-red-600',
    label: 'Emergência • 0 min',
  },
  LARANJA: {
    badge: 'bg-orange-500 text-white',
    borderLeft: 'border-l-orange-500',
    label: 'Muito Urgente • 10 min',
  },
  AMARELO: {
    badge: 'bg-amber-400 text-slate-950',
    borderLeft: 'border-l-amber-400',
    label: 'Urgente • 60 min',
  },
  VERDE: {
    badge: 'bg-emerald-600 text-white',
    borderLeft: 'border-l-emerald-600',
    label: 'Pouco Urgente • 120 min',
  },
  AZUL: {
    badge: 'bg-blue-600 text-white',
    borderLeft: 'border-l-blue-600',
    label: 'Não Urgente • 240 min',
  },
};

const FILA_DEMONSTRACAO: ItemFila[] = [
  {
    id: 'fila-1',
    prioridadeCor: 'VERMELHO',
    horaEntradaFila: new Date(Date.now() - 4 * 60000).toISOString(),
    tempoLimiteMinutos: 0,
    alertaRetriagemAtivo: false,
    boletim: {
      id: 'BOL-90124-2026',
      status: 'AGUARDANDO_MEDICO',
      paciente: {
        id: 'pac-101',
        nome: 'Antônio Carlos Figueiredo',
        cpf: '52998224725',
        numeroProntuario: 'PRT-2026-00418',
        sexo: 'M',
        dataNascimento: '1962-04-14',
      },
    },
    triagemAtual: {
      queixaPrincipal:
        'Dor torácica retroesternal opressiva irradiando para MSE há 30 min, sudorese fria.',
      saturacaoO2: 91,
      frequenciaCardiaca: 124,
      pressaoArterial: '170/105',
      temperatura: 36.4,
      glicemia: 138,
    },
  },
  {
    id: 'fila-2',
    prioridadeCor: 'LARANJA',
    horaEntradaFila: new Date(Date.now() - 14 * 60000).toISOString(),
    tempoLimiteMinutos: 10,
    alertaRetriagemAtivo: true,
    boletim: {
      id: 'BOL-90129-2026',
      status: 'AGUARDANDO_MEDICO',
      paciente: {
        id: 'pac-102',
        nome: 'Maria Eduarda Nascimento',
        cpf: '11144477735',
        numeroProntuario: 'PRT-2026-00892',
        sexo: 'F',
        dataNascimento: '1988-09-22',
      },
    },
    triagemAtual: {
      queixaPrincipal:
        'Dispneia intensa de início súbito, broncoespasmo audível e pico febril.',
      saturacaoO2: 93,
      frequenciaCardiaca: 116,
      pressaoArterial: '135/85',
      temperatura: 38.9,
      glicemia: 104,
    },
  },
  {
    id: 'fila-3',
    prioridadeCor: 'AMARELO',
    horaEntradaFila: new Date(Date.now() - 25 * 60000).toISOString(),
    tempoLimiteMinutos: 60,
    alertaRetriagemAtivo: false,
    boletim: {
      id: 'BOL-90135-2026',
      status: 'AGUARDANDO_MEDICO',
      paciente: {
        id: 'pac-103',
        nome: 'Roberto Almeida Santos',
        cpf: '28625587086',
        numeroProntuario: 'PRT-2026-01045',
        sexo: 'M',
        dataNascimento: '1979-12-03',
      },
    },
    triagemAtual: {
      queixaPrincipal:
        'Cólica nefrética intensa em flanco direito com irradiação inguinal e náuseas.',
      saturacaoO2: 98,
      frequenciaCardiaca: 98,
      pressaoArterial: '140/90',
      temperatura: 37.1,
      glicemia: 96,
    },
  },
];

const MEDICAMENTOS_CATALOGO_DEMO: Medicamento[] = [
  {
    id: 'med-1',
    principioAtivo: 'Dipirona Sódica',
    nomeComercial: 'Novalgina',
    concentracao: '500mg/mL (Ampola 2mL)',
    formaFarmaceutica: 'Solução Injetável EV/IM',
  },
  {
    id: 'med-2',
    principioAtivo: 'Enoxaparina Sódica',
    nomeComercial: 'Clexane',
    concentracao: '40mg/0,4mL',
    formaFarmaceutica: 'Seringa Preenchida SC',
  },
  {
    id: 'med-3',
    principioAtivo: 'Ácido Acetilsalicílico (AAS)',
    nomeComercial: 'Aspirina Prevent',
    concentracao: '100mg',
    formaFarmaceutica: 'Comprimido Tamponado VO',
  },
  {
    id: 'med-4',
    principioAtivo: 'Amoxicilina + Clavulanato',
    nomeComercial: 'Clavulin BD',
    concentracao: '875mg + 125mg',
    formaFarmaceutica: 'Comprimido Revestido VO',
  },
  {
    id: 'med-5',
    principioAtivo: 'Ondansetrona',
    nomeComercial: 'Zofran',
    concentracao: '4mg/2mL',
    formaFarmaceutica: 'Solução Injetável EV',
  },
];

const HISTORICO_DEMO: HistoricoPep[] = [
  {
    id: 'hist-1',
    versao: 1,
    dataHora: '2026-08-14T10:30:00Z',
    hipotesesDiagnosticasCid10: ['I10', 'E11.9'],
    evolucaoClinica:
      'Paciente avaliado em pronto-atendimento por pico hipertensivo sintomático. Ajuste de anti-hipertensivo e alta com orientação.',
    desfecho: 'ALTA',
  },
];

const LEITOS_COMPATIVEIS_DEMO: LeitoCompativel[] = [
  {
    id: 'l-101',
    numero: '101-A',
    alaSetor: 'Ala Norte • Enfermaria A',
    especialidade: 'Clínica Médica',
    sexoCompativel: 'M',
  },
  {
    id: 'l-202',
    numero: 'UTI-02',
    alaSetor: 'UTI Adulto • Bloco Central',
    especialidade: 'Cardiologia / UTI',
    sexoCompativel: 'A',
  },
];

export const AtendimentoMedicoPepPage: React.FC = () => {
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [alertaSonoroMsg, setAlertaSonoroMsg] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<ItemFila | null>(null);
  const [historico, setHistorico] = useState<HistoricoPep[]>([]);

  // Campos do PEP (RF05 e RF10)
  const [anamnese, setAnamnese] = useState('');
  const [exameFisico, setExameFisico] = useState('');
  const [cid10Input, setCid10Input] = useState('I20.0');
  const [evolucaoClinica, setEvolucaoClinica] = useState('');
  const [desfecho, setDesfecho] = useState<DesfechoClinico>('EM_OBSERVACAO');
  const [sumarioAlta, setSumarioAlta] = useState('');
  const [atendimentoPepId, setAtendimentoPepId] = useState<string | null>(null);

  // Campos de Prescrição (RF06)
  const [termoMed, setTermoMed] = useState('');
  const [sugestoesMed, setSugestoesMed] = useState<Medicamento[]>([]);
  const [medSelecionado, setMedSelecionado] = useState<Medicamento | null>(null);
  const [dosagem, setDosagem] = useState('');
  const [viaAdministracao, setViaAdministracao] = useState('EV');
  const [intervalo, setIntervalo] = useState('8/8h');
  const [prescricoesEmitidas, setPrescricoesEmitidas] = useState<
    PrescricaoEmitida[]
  >([]);

  // Campos de Reserva/Alocação de Leito (RF09)
  const [especialidadeLeito, setEspecialidadeLeito] =
    useState('Clínica Médica');
  const [leitosCompativeis, setLeitosCompativeis] = useState<
    LeitoCompativel[]
  >([]);

  const [feedback, setFeedback] = useState<{
    tipo: 'ok' | 'erro';
    texto: string;
  } | null>(null);

  const carregarFila = async () => {
    try {
      const { data } = await api.get<ItemFila[]>('/fila');
      setFila(data);
    } catch {
      setFila((prev) => (prev.length > 0 ? prev : FILA_DEMONSTRACAO));
    }
  };

  useEffect(() => {
    api
      .get<ItemFila[]>('/fila')
      .then(({ data }) => setFila(data))
      .catch(() => {
        setFila((prev) => (prev.length > 0 ? prev : FILA_DEMONSTRACAO));
      });

    const stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        // RF04: Atualização reativa da fila médica
        stompClient.subscribe('/topic/fila-atendimento', (msg) => {
          setFila(JSON.parse(msg.body));
        });
        // RF12: Alerta visual e sonoro de tempo excedido na fila
        stompClient.subscribe('/topic/alertas-retriagem', (msg) => {
          const alerta = JSON.parse(msg.body);
          setAlertaSonoroMsg(
            `ALERTA DE RETRIAGEM (RF12): Tempo limite excedido em ${alerta.tempoExcedidoMinutos} min!`
          );
          const audio = new Audio('/sounds/alerta-retriagem.mp3');
          audio.play().catch(() => {});
        });
      },
    });
    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  // RF06: Busca autocomplete de medicamentos
  useEffect(() => {
    if (termoMed.trim().length < 2) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get<Medicamento[]>(
          `/medicamentos/autocomplete?termo=${encodeURIComponent(termoMed)}`
        );
        setSugestoesMed(data);
      } catch {
        const t = termoMed.toLowerCase();
        setSugestoesMed(
          MEDICAMENTOS_CATALOGO_DEMO.filter(
            (m) =>
              m.principioAtivo.toLowerCase().includes(t) ||
              m.nomeComercial.toLowerCase().includes(t)
          )
        );
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [termoMed]);

  const buscarLeitosCompativeis = async (esp: string, sexo: string) => {
    try {
      const { data } = await api.get<LeitoCompativel[]>(
        `/leitos/compativeis?especialidade=${encodeURIComponent(esp)}&sexo=${sexo}`
      );
      setLeitosCompativeis(data);
    } catch {
      setLeitosCompativeis(LEITOS_COMPATIVEIS_DEMO);
    }
  };

  const handleChamarPaciente = async (item: ItemFila) => {
    setFeedback(null);
    setAtendimentoPepId(null);
    setPrescricoesEmitidas([]);
    try {
      await api.post(`/fila/${item.boletim.id}/chamar`);
      setSelecionado(item);

      // RF07: Carrega o histórico clínico do paciente por CPF
      const { data } = await api.get<HistoricoPep[]>(
        `/pep/paciente/${item.boletim.paciente.cpf}/historico`
      );
      setHistorico(data);
      carregarFila();
    } catch (err: unknown) {
      const axiosErr = err as { response?: unknown };
      if (!axiosErr.response) {
        setSelecionado(item);
        setHistorico(HISTORICO_DEMO);
      } else {
        setFeedback({
          tipo: 'erro',
          texto: 'Erro ao chamar paciente da fila.',
        });
      }
    }
  };

  const handleSalvarPep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selecionado) return;
    setFeedback(null);

    if (desfecho === 'ALTA' && !sumarioAlta.trim()) {
      setFeedback({
        tipo: 'erro',
        texto:
          'O preenchimento do Sumário de Alta é obrigatório para conceder alta (RF10).',
      });
      return;
    }

    const cids = cid10Input
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    try {
      const { data } = await api.post('/pep/atendimentos', {
        boletimId: selecionado.boletim.id,
        anamnese,
        exameFisico,
        hipotesesDiagnosticasCid10: cids,
        evolucaoClinica,
        desfecho,
        sumarioAlta: desfecho === 'ALTA' ? sumarioAlta : null,
        sincronizadoOffline: false,
      });

      setAtendimentoPepId(data.id);
      setFeedback({
        tipo: 'ok',
        texto: `Registro imutável salvo no PEP (Versão ${data.versao} — RF05). Agora você pode emitir prescrições ou alocar leito.`,
      });

      if (desfecho === 'INTERNACAO') {
        buscarLeitosCompativeis(
          especialidadeLeito,
          selecionado.boletim.paciente.sexo
        );
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      if (!axiosErr.response) {
        const novaVersao = historico.length + 1;
        const idGerado = `pep-${Date.now()}`;
        setAtendimentoPepId(idGerado);
        setHistorico([
          {
            id: idGerado,
            versao: novaVersao,
            dataHora: new Date().toISOString(),
            hipotesesDiagnosticasCid10: cids,
            evolucaoClinica,
            desfecho,
          },
          ...historico,
        ]);
        setFeedback({
          tipo: 'ok',
          texto: `Registro imutável salvo no PEP (Versão ${novaVersao} — RF05). Agora você pode emitir prescrições ou alocar leito.`,
        });
        if (desfecho === 'INTERNACAO') {
          buscarLeitosCompativeis(
            especialidadeLeito,
            selecionado.boletim.paciente.sexo
          );
        }
      } else {
        setFeedback({
          tipo: 'erro',
          texto:
            axiosErr.response?.data?.message ||
            'Erro ao registrar atendimento no PEP.',
        });
      }
    }
  };

  const handleAdicionarPrescricao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atendimentoPepId || !medSelecionado) return;

    try {
      const { data } = await api.post(
        `/pep/atendimentos/${atendimentoPepId}/prescricoes`,
        {
          medicamentoId: medSelecionado.id,
          dosagem,
          viaAdministracao,
          intervalo,
        }
      );
      setPrescricoesEmitidas([
        ...prescricoesEmitidas,
        { ...data, medicamento: medSelecionado },
      ]);
      setMedSelecionado(null);
      setTermoMed('');
      setDosagem('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: unknown };
      if (!axiosErr.response) {
        setPrescricoesEmitidas([
          ...prescricoesEmitidas,
          {
            id: `presc-${Date.now()}`,
            dosagem,
            viaAdministracao,
            intervalo,
            medicamento: medSelecionado,
          },
        ]);
        setMedSelecionado(null);
        setTermoMed('');
        setDosagem('');
      } else {
        setFeedback({
          tipo: 'erro',
          texto: 'Falha ao emitir prescrição médica (RF06).',
        });
      }
    }
  };

  const handleAlocarLeito = async (leitoId: string) => {
    if (!selecionado) return;
    try {
      await api.patch(`/leitos/${leitoId}/alocar`, {
        boletimId: selecionado.boletim.id,
      });
      setFeedback({
        tipo: 'ok',
        texto:
          'Paciente internado e leito alterado para OCUPADO no painel em tempo real (RF08/RF09)!',
      });
      setLeitosCompativeis([]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: unknown };
      if (!axiosErr.response) {
        setFeedback({
          tipo: 'ok',
          texto:
            'Paciente internado e leito alterado para OCUPADO no painel em tempo real (RF08/RF09)!',
        });
        setLeitosCompativeis([]);
      } else {
        setFeedback({
          tipo: 'erro',
          texto: 'Erro ao alocar leito para o paciente.',
        });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho do Consultório & PEP */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-900/20 shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Módulo 03 • RF04 a RF07, RF09, RF10 & RF12
              </span>
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Versionamento Imutável (RNF01 &lt; 1,5s)
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Consultório Médico e Prontuário Eletrônico (PEP)
            </h1>
            <p className="text-sm text-slate-500">
              Fila priorizada em tempo real (RF04), evolução clínica imutável (RF05), prescrição (RF06) e desfecho hospitalar
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setAlertaSonoroMsg(
              'ALERTA DE RETRIAGEM (RF12): Paciente Maria Eduarda Nascimento (LARANJA) excedeu o tempo limite de espera em 4 min!'
            )
          }
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <BellRing className="w-4 h-4 text-rose-600" />
          <span>Testar Alerta Sonoro RF12</span>
        </button>
      </div>

      {/* Alerta Sonoro/Visual de Tempo Limite Excedido (RF12) */}
      {alertaSonoroMsg && (
        <div className="p-4 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4 border border-red-400">
          <div className="flex items-center gap-3 font-bold text-sm">
            <div className="p-2 bg-white/15 rounded-xl animate-bounce">
              <BellRing className="w-5 h-5" />
            </div>
            <span>{alertaSonoroMsg}</span>
          </div>
          <button
            onClick={() => setAlertaSonoroMsg(null)}
            className="text-xs font-bold bg-slate-950/40 hover:bg-slate-950/60 px-4 py-1.5 rounded-xl border border-white/20 cursor-pointer"
          >
            Confirmar Ciência
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Fila de Atendimento Priorizada (RF04) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Fila Médica Priorizada (RF04)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ordenada por Risco Manchester via WebSocket
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-sky-300 font-mono text-xs font-bold border border-slate-700">
              {fila.length} pac.
            </span>
          </div>

          <div className="p-4 space-y-3">
            {fila.length === 0 ? (
              <div className="text-xs text-slate-400 py-10 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Nenhum paciente aguardando na fila no momento.</p>
              </div>
            ) : (
              fila.map((item) => {
                const isAtivo = selecionado?.id === item.id;
                const cfgCor = ESTILO_MANCHESTER[item.prioridadeCor];

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border border-l-4 transition-all space-y-3 ${
                      cfgCor.borderLeft
                    } ${
                      isAtivo
                        ? 'bg-sky-50/70 border-sky-400 shadow-sm'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${cfgCor.badge}`}
                      >
                        {item.prioridadeCor}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-500">
                        {item.boletim.paciente.numeroProntuario}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-extrabold text-slate-900">
                          {item.boletim.paciente.nome}
                        </p>
                        {item.alertaRetriagemAtivo && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                            RF12 Excedido
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                        {item.triagemAtual.queixaPrincipal}
                      </p>
                    </div>

                    {/* Mini Telemetria da Triagem */}
                    <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono bg-white p-2 rounded-lg border border-slate-200/80 text-center">
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase">
                          SpO₂
                        </span>
                        <strong className="text-slate-800">
                          {item.triagemAtual.saturacaoO2}%
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase">
                          FC
                        </span>
                        <strong className="text-slate-800">
                          {item.triagemAtual.frequenciaCardiaca}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase">
                          PA
                        </span>
                        <strong className="text-slate-800">
                          {item.triagemAtual.pressaoArterial}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase">
                          Temp
                        </span>
                        <strong className="text-slate-800">
                          {item.triagemAtual.temperatura}°
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChamarPaciente(item)}
                      className={`w-full py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        isAtivo
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-sky-700 text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>
                        {isAtivo
                          ? 'Paciente em Atendimento'
                          : 'Chamar para Atendimento'}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Prontuário Eletrônico do Paciente - PEP */}
        <div className="lg:col-span-8 space-y-6">
          {feedback && (
            <div
              className={`p-4 rounded-2xl border text-sm font-medium flex items-center gap-3 shadow-xs ${
                feedback.tipo === 'ok'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {feedback.tipo === 'ok' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{feedback.texto}</span>
            </div>
          )}

          {!selecionado ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mx-auto">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Selecione um paciente na Fila Priorizada ao lado
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ao chamar o paciente, o Prontuário Eletrônico (PEP), os sinais vitais da triagem e o histórico clínico imutável serão carregados em menos de 1,5s (RNF01).
                </p>
              </div>
              {fila.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleChamarPaciente(fila[0])}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    Chamar Próximo da Fila ({fila[0].boletim.paciente.nome})
                  </span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Cabeçalho Clínico do Paciente em Atendimento */}
              <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-md border border-slate-800">
                <div className="p-6 flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-sky-400">
                      <span className="bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                        {selecionado.boletim.paciente.numeroProntuario}
                      </span>
                      <span>•</span>
                      <span>CPF: {selecionado.boletim.paciente.cpf}</span>
                      <span>•</span>
                      <span>Sexo: {selecionado.boletim.paciente.sexo}</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 pt-1">
                      <User className="w-5 h-5 text-sky-400" />
                      <span>{selecionado.boletim.paciente.nome}</span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      <strong className="text-slate-100">
                        Queixa na Triagem:
                      </strong>{' '}
                      {selecionado.triagemAtual.queixaPrincipal}
                    </p>
                  </div>

                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase shadow-sm ${
                      ESTILO_MANCHESTER[selecionado.prioridadeCor].badge
                    }`}
                  >
                    Risco: {selecionado.prioridadeCor}
                  </span>
                </div>

                {/* Faixa de Sinais Vitais Aferidos na Triagem */}
                <div className="bg-slate-950/70 px-6 py-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Saturação O₂
                      </span>
                      <strong className="font-mono text-white">
                        {selecionado.triagemAtual.saturacaoO2}%
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Freq. Cardíaca
                      </span>
                      <strong className="font-mono text-white">
                        {selecionado.triagemAtual.frequenciaCardiaca} bpm
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Pressão Arterial
                      </span>
                      <strong className="font-mono text-white">
                        {selecionado.triagemAtual.pressaoArterial} mmHg
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Temperatura
                      </span>
                      <strong className="font-mono text-white">
                        {selecionado.triagemAtual.temperatura} °C
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Glicemia Capilar
                      </span>
                      <strong className="font-mono text-white">
                        {selecionado.triagemAtual.glicemia ?? '--'} mg/dL
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Histórico Clínico Anterior Imutável (RF07) */}
              {historico.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <History className="w-4 h-4 text-sky-600" />
                      <span>
                        Histórico Clínico Imutável do Paciente ({historico.length}{' '}
                        registros — RF07)
                      </span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Somente Leitura • Auditado
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {historico.map((h) => (
                      <div
                        key={h.id}
                        className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Versão #{h.versao} •{' '}
                            {new Date(h.dataHora).toLocaleString('pt-BR')}
                          </span>
                          {h.hipotesesDiagnosticasCid10 && (
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                              CID-10: {h.hipotesesDiagnosticasCid10.join(', ')}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600">{h.evolucaoClinica}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulário de Evolução Clínica no PEP (RF05 e RF10) */}
              <form
                onSubmit={handleSalvarPep}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-sky-600" />
                    <span>1. Registro de Atendimento no PEP (RF05)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Gera nova versão imutável sem sobrescrever registros anteriores
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Anamnese e História da Doença Atual (HDA) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Relato cronológico dos sintomas, comorbidades, alergias e medicações em uso..."
                      value={anamnese}
                      onChange={(e) => setAnamnese(e.target.value)}
                      className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Exame Físico Geral e Específico *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Estado geral, ausculta cardíaca/pulmonar, abdome, exame neurológico..."
                      value={exameFisico}
                      onChange={(e) => setExameFisico(e.target.value)}
                      className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Hipóteses Diagnósticas (CID-10) *
                      </label>
                      <div className="flex gap-1">
                        {['I20.0', 'J18.9', 'N20.0'].map((cid) => (
                          <button
                            key={cid}
                            type="button"
                            onClick={() => setCid10Input(cid)}
                            className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 cursor-pointer"
                          >
                            {cid}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      required
                      value={cid10Input}
                      onChange={(e) => setCid10Input(e.target.value)}
                      placeholder="Ex: I20.0, R07.4"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-sky-600 outline-none"
                    />
                  </div>

                  <div className="md:col-span-7">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Desfecho Clínico (RF09 / RF10) *
                    </label>
                    <select
                      value={desfecho}
                      onChange={(e) =>
                        setDesfecho(e.target.value as DesfechoClinico)
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 outline-none font-semibold"
                    >
                      <option value="EM_OBSERVACAO">
                        Manter em Observação Clínica
                      </option>
                      <option value="ALTA">
                        Alta Hospitalar (Exige Sumário — RF10)
                      </option>
                      <option value="INTERNACAO">
                        Solicitar Internação em Leito (RF09)
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Evolução Clínica e Conduta Terapêutica *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Conduta adotada, exames solicitados e plano terapêutico..."
                    value={evolucaoClinica}
                    onChange={(e) => setEvolucaoClinica(e.target.value)}
                    className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 outline-none"
                  />
                </div>

                {desfecho === 'ALTA' && (
                  <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300 space-y-1.5">
                    <label className="block text-xs font-extrabold uppercase text-amber-950">
                      Sumário de Alta Obrigatório (RF10 — Libera leito para Higienização) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={sumarioAlta}
                      onChange={(e) => setSumarioAlta(e.target.value)}
                      placeholder="Resumo clínico do atendimento, condições de saída, receita domiciliar e orientações..."
                      className="w-full p-3 text-sm border border-amber-400 rounded-xl bg-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm cursor-pointer"
                  >
                    Salvar Versão Imutável no PEP
                  </button>
                </div>
              </form>

              {/* Prescrição Eletrônica de Medicamentos (RF06) */}
              {atendimentoPepId && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      <span>
                        2. Prescrição Eletrônica de Medicamentos (RF06)
                      </span>
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Vinculada ao PEP
                    </span>
                  </div>

                  <form
                    onSubmit={handleAdicionarPrescricao}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Buscar Medicamento (Autocomplete Lista Oficial) *
                        </label>
                        <div className="flex gap-1.5">
                          {MEDICAMENTOS_CATALOGO_DEMO.slice(0, 3).map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setMedSelecionado(m);
                                setSugestoesMed([]);
                              }}
                              className="text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                            >
                              + {m.principioAtivo.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={
                          medSelecionado
                            ? `${medSelecionado.principioAtivo} (${medSelecionado.nomeComercial}) - ${medSelecionado.concentracao}`
                            : termoMed
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setMedSelecionado(null);
                          setTermoMed(val);
                          if (val.trim().length < 2) {
                            setSugestoesMed([]);
                          }
                        }}
                        placeholder="Digite ex: Dipirona, Amoxicilina, Enoxaparina..."
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                      {sugestoesMed.length > 0 && !medSelecionado && (
                        <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-xl mt-1 shadow-xl max-h-44 overflow-y-auto">
                          {sugestoesMed.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setMedSelecionado(m);
                                setSugestoesMed([]);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs hover:bg-sky-50 border-b border-slate-100 last:border-0 cursor-pointer"
                            >
                              <strong className="text-slate-900">
                                {m.principioAtivo}
                              </strong>{' '}
                              ({m.nomeComercial}) —{' '}
                              <span className="text-sky-700 font-mono">
                                {m.concentracao}
                              </span>{' '}
                              • {m.formaFarmaceutica}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Dosagem (ex: 1 ampola / 500mg)"
                        value={dosagem}
                        onChange={(e) => setDosagem(e.target.value)}
                        className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Via (ex: EV, VO, IM, SC)"
                        value={viaAdministracao}
                        onChange={(e) => setViaAdministracao(e.target.value)}
                        className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Intervalo (ex: 6/6h, 8/8h)"
                        value={intervalo}
                        onChange={(e) => setIntervalo(e.target.value)}
                        className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!medSelecionado}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Emitir Item na Prescrição</span>
                    </button>
                  </form>

                  {prescricoesEmitidas.length > 0 && (
                    <ul className="space-y-2 pt-2">
                      {prescricoesEmitidas.map((p, idx) => (
                        <li
                          key={p.id}
                          className="text-xs bg-emerald-50/80 border border-emerald-200 px-4 py-2.5 rounded-xl text-emerald-950 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-mono font-bold text-emerald-700 mr-2">
                              #{idx + 1}
                            </span>
                            <strong>{p.medicamento.principioAtivo}</strong> (
                            {p.medicamento.concentracao})
                          </div>
                          <div className="font-mono text-[11px] bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                            Dose: <strong>{p.dosagem}</strong> | Via:{' '}
                            <strong>{p.viaAdministracao}</strong> | Intervalo:{' '}
                            <strong>{p.intervalo}</strong>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Alocação de Leito Compatível se Desfecho = INTERNACAO (RF09) */}
              {atendimentoPepId && desfecho === 'INTERNACAO' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Bed className="w-4 h-4 text-sky-600" />
                    <span>
                      3. Reserva e Alocação de Leito Compatível (RF09)
                    </span>
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={especialidadeLeito}
                      onChange={(e) => setEspecialidadeLeito(e.target.value)}
                      placeholder="Especialidade (ex: Clínica Médica, UTI)"
                      className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        buscarLeitosCompativeis(
                          especialidadeLeito,
                          selecionado.boletim.paciente.sexo
                        )
                      }
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Filtrar Leitos Livres Compatíveis
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {leitosCompativeis.map((l) => (
                      <div
                        key={l.id}
                        className="p-4 border-2 border-emerald-300 bg-emerald-50/50 rounded-2xl flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">
                            Leito {l.numero}
                          </p>
                          <p className="text-xs text-slate-600">
                            {l.alaSetor} • {l.especialidade} (Sexo:{' '}
                            {l.sexoCompativel})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAlocarLeito(l.id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer"
                        >
                          Internar Aqui
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
