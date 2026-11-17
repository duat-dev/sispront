import { Client } from '@stomp/stompjs';
import {
  Activity,
  BedDouble,
  CheckCircle2,
  Filter,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  Wrench,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { api } from '../../lib/axios';

type StatusLeito =
  | 'LIVRE'
  | 'OCUPADO'
  | 'AGUARDANDO_LIMPEZA'
  | 'EM_LIMPEZA'
  | 'MANUTENCAO';

interface Leito {
  id: string;
  numero: string;
  alaSetor: string;
  especialidade: string;
  sexoCompativel: 'M' | 'F' | 'A';
  status: StatusLeito;
  motivoManutencao?: string;
  qrCodeHash: string;
}

const LEITOS_DEMONSTRACAO: Leito[] = [
  {
    id: 'l-101',
    numero: '101-A',
    alaSetor: 'Ala Norte • Enfermaria A',
    especialidade: 'Clínica Médica',
    sexoCompativel: 'M',
    status: 'LIVRE',
    qrCodeHash: 'LEITO-QR-101A',
  },
  {
    id: 'l-102',
    numero: '102-A',
    alaSetor: 'Ala Norte • Enfermaria A',
    especialidade: 'Clínica Médica',
    sexoCompativel: 'F',
    status: 'OCUPADO',
    qrCodeHash: 'LEITO-QR-102A',
  },
  {
    id: 'l-103',
    numero: '103-B',
    alaSetor: 'Ala Norte • Enfermaria B',
    especialidade: 'Cardiologia',
    sexoCompativel: 'A',
    status: 'AGUARDANDO_LIMPEZA',
    qrCodeHash: 'LEITO-QR-103B',
  },
  {
    id: 'l-104',
    numero: '104-B',
    alaSetor: 'Ala Norte • Enfermaria B',
    especialidade: 'Cardiologia',
    sexoCompativel: 'M',
    status: 'EM_LIMPEZA',
    qrCodeHash: 'LEITO-QR-104B',
  },
  {
    id: 'l-201',
    numero: 'UTI-01',
    alaSetor: 'UTI Adulto • Bloco Central',
    especialidade: 'Terapia Intensiva',
    sexoCompativel: 'A',
    status: 'OCUPADO',
    qrCodeHash: 'LEITO-QR-UTI01',
  },
  {
    id: 'l-202',
    numero: 'UTI-02',
    alaSetor: 'UTI Adulto • Bloco Central',
    especialidade: 'Terapia Intensiva',
    sexoCompativel: 'A',
    status: 'LIVRE',
    qrCodeHash: 'LEITO-QR-UTI02',
  },
  {
    id: 'l-203',
    numero: 'UTI-03',
    alaSetor: 'UTI Adulto • Bloco Central',
    especialidade: 'Terapia Intensiva',
    sexoCompativel: 'A',
    status: 'AGUARDANDO_LIMPEZA',
    qrCodeHash: 'LEITO-QR-UTI03',
  },
  {
    id: 'l-301',
    numero: 'CIR-01',
    alaSetor: 'Ala Sul • Pós-Operatório',
    especialidade: 'Cirurgia Geral',
    sexoCompativel: 'F',
    status: 'MANUTENCAO',
    motivoManutencao: 'Calibração da régua de gases medicinais e vácuo',
    qrCodeHash: 'LEITO-QR-CIR01',
  },
];

// Cores exatas especificadas no RF08: Livre (Verde), Ocupado (Vermelho), Higienização (Amarelo) e Manutenção (Cinza)
const ESTILOS_STATUS_LEITO: Record<
  StatusLeito,
  {
    badge: string;
    cardBorder: string;
    cardBg: string;
    topStrip: string;
    label: string;
    dot: string;
  }
> = {
  LIVRE: {
    label: 'Livre • Disponível',
    badge: 'bg-emerald-600 text-white',
    cardBorder: 'border-emerald-400/90 hover:border-emerald-500',
    cardBg: 'bg-white',
    topStrip: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  OCUPADO: {
    label: 'Ocupado • Paciente Internado',
    badge: 'bg-red-600 text-white',
    cardBorder: 'border-red-400/90 hover:border-red-500',
    cardBg: 'bg-white',
    topStrip: 'bg-red-600',
    dot: 'bg-red-600',
  },
  AGUARDANDO_LIMPEZA: {
    label: 'Higienização (Aguardando 1º Scan)',
    badge: 'bg-amber-400 text-slate-950',
    cardBorder: 'border-amber-400 hover:border-amber-500',
    cardBg: 'bg-amber-50/40',
    topStrip: 'bg-amber-400',
    dot: 'bg-amber-400',
  },
  EM_LIMPEZA: {
    label: 'Em Higienização (Aguardando 2º Scan)',
    badge: 'bg-amber-500 text-slate-950',
    cardBorder: 'border-amber-500 hover:border-amber-600',
    cardBg: 'bg-amber-50/70',
    topStrip: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  MANUTENCAO: {
    label: 'Bloqueado • Manutenção',
    badge: 'bg-slate-600 text-white',
    cardBorder: 'border-slate-300 hover:border-slate-400',
    cardBg: 'bg-slate-50',
    topStrip: 'bg-slate-500',
    dot: 'bg-slate-500',
  },
};

export const MapaLeitosPage: React.FC = () => {
  const [leitos, setLeitos] = useState<Leito[]>([]);
  const [qrInput, setQrInput] = useState('');
  const [aviso, setAviso] = useState<{
    tipo: 'ok' | 'erro';
    msg: string;
  } | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [buscaSetor, setBuscaSetor] = useState('');

  const carregarMapa = async () => {
    try {
      const { data } = await api.get<Leito[]>('/leitos/mapa');
      setLeitos(data);
    } catch {
      setLeitos((prev) => (prev.length > 0 ? prev : LEITOS_DEMONSTRACAO));
    }
  };

  useEffect(() => {
    api
      .get<Leito[]>('/leitos/mapa')
      .then(({ data }) => setLeitos(data))
      .catch(() => {
        setLeitos((prev) => (prev.length > 0 ? prev : LEITOS_DEMONSTRACAO));
      });

    // Conexão WebSocket STOMP para atualização em tempo real (RF08, RF11)
    const stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        stompClient.subscribe('/topic/mapa-leitos', (message) => {
          setLeitos(JSON.parse(message.body));
        });
      },
    });
    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  // RF11: Dispara o 1º ou 2º scan do QR Code do leito
  const handleScanQrCode = async (qrCodeHash: string) => {
    const hashLimpo = qrCodeHash.trim();
    if (!hashLimpo) return;
    setAviso(null);

    try {
      const { data } = await api.post<Leito>(
        `/leitos/qrcode/${hashLimpo}/scan`
      );
      setAviso({
        tipo: 'ok',
        msg: `QR Code [${data.numero}] processado! Novo estado operacional: ${
          ESTILOS_STATUS_LEITO[data.status].label
        }`,
      });
      setQrInput('');
      carregarMapa();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      if (!axiosErr.response) {
        // Fallback local para demonstração da máquina de estados RF11
        const alvo = leitos.find(
          (l) => l.qrCodeHash.toLowerCase() === hashLimpo.toLowerCase()
        );
        if (
          !alvo ||
          (alvo.status !== 'AGUARDANDO_LIMPEZA' &&
            alvo.status !== 'EM_LIMPEZA')
        ) {
          setAviso({
            tipo: 'erro',
            msg: 'Apenas leitos em estado de Higienização aceitam leitura de QR Code de limpeza (RF11).',
          });
          return;
        }
        const novoStatus: StatusLeito =
          alvo.status === 'AGUARDANDO_LIMPEZA' ? 'EM_LIMPEZA' : 'LIVRE';
        setLeitos((prev) =>
          prev.map((l) =>
            l.id === alvo.id ? { ...l, status: novoStatus } : l
          )
        );
        setAviso({
          tipo: 'ok',
          msg: `QR Code [${alvo.numero}] processado! Novo estado operacional: ${ESTILOS_STATUS_LEITO[novoStatus].label}`,
        });
        setQrInput('');
      } else {
        setAviso({
          tipo: 'erro',
          msg:
            axiosErr.response?.data?.message ||
            'Apenas leitos em estado de Higienização aceitam leitura de QR Code de limpeza (RF11).',
        });
      }
    }
  };

  const totalLeitos = leitos.length;
  const totalLivres = leitos.filter((l) => l.status === 'LIVRE').length;
  const totalOcupados = leitos.filter((l) => l.status === 'OCUPADO').length;
  const totalHigienizacao = leitos.filter(
    (l) => l.status === 'AGUARDANDO_LIMPEZA' || l.status === 'EM_LIMPEZA'
  ).length;
  const totalManutencao = leitos.filter(
    (l) => l.status === 'MANUTENCAO'
  ).length;

  const leitosParaHigienizar = leitos.filter(
    (l) => l.status === 'AGUARDANDO_LIMPEZA' || l.status === 'EM_LIMPEZA'
  );

  const leitosFiltrados = leitos.filter((l) => {
    const matchStatus =
      filtroStatus === 'TODOS'
        ? true
        : filtroStatus === 'HIGIENIZACAO'
        ? l.status === 'AGUARDANDO_LIMPEZA' || l.status === 'EM_LIMPEZA'
        : l.status === filtroStatus;

    const termo = buscaSetor.trim().toLowerCase();
    const matchTexto =
      !termo ||
      l.numero.toLowerCase().includes(termo) ||
      l.alaSetor.toLowerCase().includes(termo) ||
      l.especialidade.toLowerCase().includes(termo) ||
      l.qrCodeHash.toLowerCase().includes(termo);

    return matchStatus && matchTexto;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho do Módulo de Gestão de Leitos */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-indigo-900/20 shrink-0">
            <BedDouble className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Módulo 04 • RF08 & RF11
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Telemetria STOMP WebSocket
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Mapa Visual de Leitos e Governança Mobile (QR Code)
            </h1>
            <p className="text-sm text-slate-500">
              Monitoramento sinóptico em tempo real (RF08) e dupla checagem de higienização via QR Code (RF11)
            </p>
          </div>
        </div>

        {/* Legenda Oficial de Cores (RF08) */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            Livre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
            Ocupado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            Higienização
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
            Manutenção
          </span>
        </div>
      </div>

      {/* KPIs de Ocupação Hospitalar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">
            Total Monitorado
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {totalLeitos}
          </p>
          <span className="text-[11px] text-slate-500">
            Unidades de internação
          </span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-800">
            Leitos Livres
          </span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">
            {totalLivres}
          </p>
          <span className="text-[11px] text-emerald-700">
            Prontos para alocação (RF09)
          </span>
        </div>

        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-red-800">
            Leitos Ocupados
          </span>
          <p className="text-2xl font-extrabold text-red-700 mt-1">
            {totalOcupados}
          </p>
          <span className="text-[11px] text-red-700">
            Taxa:{' '}
            {totalLeitos > 0
              ? `${Math.round((totalOcupados / totalLeitos) * 100)}%`
              : '0%'}
          </span>
        </div>

        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-amber-900">
            Em Higienização
          </span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">
            {totalHigienizacao}
          </p>
          <span className="text-[11px] text-amber-800">
            Aguardando Scan QR (RF11)
          </span>
        </div>

        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-300 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase text-slate-600">
            Em Manutenção
          </span>
          <p className="text-2xl font-extrabold text-slate-700 mt-1">
            {totalManutencao}
          </p>
          <span className="text-[11px] text-slate-500">
            Engenharia clínica
          </span>
        </div>
      </div>

      {/* Painel Mobile de Governança / Leitor QR Code (RF11) */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-md shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-white">
                  Terminal Mobile — Equipe de Higienização (RF11)
                </h2>
                <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  Dupla Checagem
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                <strong className="text-amber-300">1º Scan:</strong> Inicia a limpeza (&quot;Em Higienização&quot;) •{' '}
                <strong className="text-emerald-300">2º Scan:</strong> Conclui desinfecção e libera o leito para &quot;Livre&quot;
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2.5">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Hash do QR Code (ex: LEITO-QR-103B)"
              className="flex-1 lg:w-64 px-4 py-2.5 text-xs text-slate-900 bg-white rounded-xl outline-none font-mono border-2 border-transparent focus:border-amber-400"
            />
            <button
              type="button"
              onClick={() => handleScanQrCode(qrInput)}
              disabled={!qrInput.trim()}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Escanear QR Code</span>
            </button>
          </div>
        </div>

        {/* Atalhos Rápidos de QR Codes Pendentes de Higienização */}
        {leitosParaHigienizar.length > 0 && (
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              QR Codes aguardando leitura no momento:
            </span>
            {leitosParaHigienizar.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setQrInput(l.qrCodeHash)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
              >
                {l.qrCodeHash} ({l.numero})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Aviso de Processamento do QR Code */}
      {aviso && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 ${
            aviso.tipo === 'ok'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 ${
                aviso.tipo === 'ok' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
            <span>{aviso.msg}</span>
          </div>
          <button
            onClick={() => setAviso(null)}
            className="underline text-xs font-bold ml-4 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Barra de Filtros por Status e Busca por Ala/Setor */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          {[
            { id: 'TODOS', label: `Todos (${totalLeitos})` },
            { id: 'LIVRE', label: `Livres (${totalLivres})` },
            { id: 'OCUPADO', label: `Ocupados (${totalOcupados})` },
            { id: 'HIGIENIZACAO', label: `Higienização (${totalHigienizacao})` },
            { id: 'MANUTENCAO', label: `Manutenção (${totalManutencao})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltroStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroStatus === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={buscaSetor}
              onChange={(e) => setBuscaSetor(e.target.value)}
              placeholder="Filtrar por leito, ala ou especialidade..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-sky-600"
            />
          </div>

          <button
            type="button"
            onClick={carregarMapa}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Grid de Leitos em Tempo Real (RF08) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {leitosFiltrados.map((leito) => {
          const estilo = ESTILOS_STATUS_LEITO[leito.status];
          const permiteQrScan =
            leito.status === 'AGUARDANDO_LIMPEZA' ||
            leito.status === 'EM_LIMPEZA';

          return (
            <div
              key={leito.id}
              className={`rounded-2xl border-2 transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${estilo.cardBorder} ${estilo.cardBg}`}
            >
              {/* Barra Superior de Cor do Status */}
              <div className={`h-2 w-full ${estilo.topStrip}`} />

              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${estilo.dot}`}
                      />
                      <span className="text-lg font-extrabold text-slate-900">
                        Leito {leito.numero}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Sexo: {leito.sexoCompativel}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      {leito.alaSetor}
                    </p>
                    <p className="text-xs text-slate-500">
                      Especialidade: {leito.especialidade}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span
                    className={`inline-block w-full text-center py-1.5 px-2.5 rounded-xl text-xs font-bold shadow-2xs ${estilo.badge}`}
                  >
                    {estilo.label}
                  </span>

                  {/* Barra de progresso de limpeza em 2 etapas (RF11) */}
                  {permiteQrScan && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-amber-900">
                        <span>Protocolo QR (RF11)</span>
                        <span>
                          {leito.status === 'AGUARDANDO_LIMPEZA'
                            ? 'Etapa 1 de 2'
                            : 'Etapa 2 de 2'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-amber-600 transition-all ${
                            leito.status === 'AGUARDANDO_LIMPEZA'
                              ? 'w-1/2'
                              : 'w-full'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {leito.status === 'MANUTENCAO' && leito.motivoManutencao && (
                    <p className="text-[11px] text-slate-600 bg-slate-200/70 p-2 rounded-lg flex items-start gap-1.5">
                      <Wrench className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-700" />
                      <span>{leito.motivoManutencao}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>QR Hash:</span>
                    <span className="text-slate-600 font-semibold">
                      {leito.qrCodeHash}
                    </span>
                  </div>

                  {permiteQrScan && (
                    <button
                      type="button"
                      onClick={() => handleScanQrCode(leito.qrCodeHash)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>
                        {leito.status === 'AGUARDANDO_LIMPEZA'
                          ? 'Simular 1º Scan (Iniciar Limpeza)'
                          : 'Simular 2º Scan (Liberar Leito)'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
