import type * as React from "react";

export interface WithChildrenProps {
  children: React.ReactNode;
}

export interface RootLayoutProps extends WithChildrenProps {
  modal?: React.ReactNode;
}

export interface DashboardLayoutProps extends WithChildrenProps {}

export interface DashboardPermissions {
  role: string;
  isAdmin: boolean;
  isTecnico: boolean;
  canViewDashboard: boolean;
  canViewTecnicos: boolean;
  canViewAdmins: boolean;
  canViewAgendamentos: boolean;
  canManageMaquinas: boolean;
  canManageSensores: boolean;
  canManageTecnicos: boolean;
  canManageAdmins: boolean;
  canManageAgendamentos: boolean;
  canCreateAlertas: boolean;
  canDeleteAlertas: boolean;
  canUpdateAlertStatus: boolean;
  canEditOwnProfile: boolean;
}

export type Criticidade = "ALTA" | "MEDIA" | "BAIXA";
export type StatusMaquina = "OK" | "ALERTA";

export interface Maquina {
  id: number;
  nome: string;
  setor: string;
  tipo: string;
  criticidade: Criticidade;
  integridade: number;
  scoreEstabilidade: number;
  status: StatusMaquina;
  ultimaLeituraEm: string;
  sensores: number;
  previsaoManutencao: string | null;
  janelaManuInicio: string | null;
  janelaManuFim: string | null;
  imagem: string | null;
  caminhoImagem: string | null;
}

export interface NovaMaquinaInput {
  nome: string;
  setor: string;
  tipo: string;
  criticidade: Criticidade;
}

export type AtualizacaoMaquinaInput = Partial<NovaMaquinaInput>;

export interface SensorLeitura {
  valorAtual: number;
  limiteMin: number;
  limiteMax: number;
}

export interface SensorLeituraApi {
  id: number | null;
  sensorId: number;
  temperatura: number | null;
  vibracao: number | null;
  criadoEm: string;
}

export type StatusSensor = "ONLINE" | "OFFLINE";

export interface Sensor {
  id: number;
  nome: string;
  tipo: string;
  maquinaId: number | null;
  maquinaNome: string;
  status: StatusSensor;
  active: boolean;
  ultimaLeituraEm: string;
  limiteTemperatura: number;
  idealTemperatura: number;
  limiteVibracao: number;
  idealVibracao: number;
  temperatura: SensorLeitura | null;
  vibracao: SensorLeitura | null;
}

export interface NovoSensorInput {
  tipo: string;
  maquinaId: number | null;
  status: StatusSensor;
  limiteTemperatura: number;
  idealTemperatura: number;
  limiteVibracao: number;
  idealVibracao: number;
}

export type AtualizacaoSensorInput = Partial<NovoSensorInput>;

export type StatusTecnico = "ATIVO" | "INATIVO";

export interface Tecnico {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  especialidade: string;
  status: StatusTecnico;
  alertasAtendidos: number;
  criadoEm: string;
  foto: string | null;
}

export interface NovoTecnicoInput {
  nome: string;
  email: string;
  senha: string;
  role: string;
}

export interface AtualizacaoTecnicoInput {
  nome?: string;
  email?: string;
  telefone?: string;
  especialidade?: string;
  ativo?: boolean;
  foto?: string | null;
}

export type StatusAdmin = "ATIVO" | "INATIVO";

export interface Admin {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  role: "ADMIN";
  status: StatusAdmin;
  criadoEm: string;
  foto: string | null;
}

export type TipoAlerta =
  | "LIMITE_ULTRAPASSADO"
  | "TENDENCIA_CURTA"
  | "TENDENCIA_LONGA"
  | "DEGRADACAO_ACELERADA"
  | "INSTABILIDADE";

export type SeveridadeAlerta = "ALTA" | "MEDIA" | "BAIXA";
export type StatusAlerta = "ATIVO" | "EM_ANDAMENTO" | "RESOLVIDO" | "CANCELADO";
export type RecenciaAlerta = "RECENTE" | "ANTIGO";

export interface Alerta {
  id: number;
  tipo: TipoAlerta;
  maquinaId: number | null;
  maquinaNome: string;
  sensorId: number | null;
  sensorNome: string;
  severidade: SeveridadeAlerta;
  status: StatusAlerta;
  mensagem: string;
  criadoEm: string;
  atualizadoEm?: string | null;
  ocorrencias: number;
  ultimaOcorrenciaEm: string;
  recencia: RecenciaAlerta;
  duplicado: boolean;
  tecnicoId?: number | null;
  tecnicoNome?: string | null;
}

export interface NovoAlertaInput {
  tipo: TipoAlerta;
  maquinaId?: number | null;
  maquinaNome: string;
  sensorId?: number | null;
  sensorNome: string;
  severidade: SeveridadeAlerta;
  mensagem: string;
}

export type AtualizacaoAlertaInput = Partial<NovoAlertaInput>;

export interface MaquinasContextValue {
  maquinas: Maquina[];
  status: "loading" | "success" | "error";
  mensagem: string;
  carregando: boolean;
  salvando: boolean;
  adicionarMaquina: (dados: NovaMaquinaInput) => Promise<void>;
  editarMaquina: (id: number, dados: AtualizacaoMaquinaInput) => Promise<void>;
  excluirMaquina: (id: number) => Promise<void>;
  atualizarImagemMaquina: (id: number, imagem: File) => Promise<void>;
  recarregarMaquinas: () => Promise<void>;
  resetarDados: () => Promise<void>;
}

export interface SensoresContextValue {
  sensores: Sensor[];
  status: "loading" | "success" | "error";
  mensagem: string;
  carregando: boolean;
  salvando: boolean;
  adicionarSensor: (dados: NovoSensorInput) => Promise<void>;
  editarSensor: (id: number, dados: AtualizacaoSensorInput) => Promise<void>;
  excluirSensor: (id: number) => Promise<void>;
  recarregarSensores: () => Promise<void>;
  resetarDados: () => Promise<void>;
}

export interface TecnicosContextValue {
  tecnicos: Tecnico[];
  status: "loading" | "success" | "error";
  mensagem: string;
  carregando: boolean;
  salvando: boolean;
  totalPaginas: number;
  paginaAtual: number;
  adicionarTecnico: (dados: NovoTecnicoInput) => Promise<void>;
  editarTecnico: (id: number, dados: AtualizacaoTecnicoInput) => Promise<void>;
  excluirTecnico: (id: number) => Promise<void>;
  recarregarTecnicos: (page?: number, limit?: number) => Promise<void>;
  resetarDados: () => Promise<void>;
}

export interface AdminsContextValue {
  admins: Admin[];
  status: "loading" | "success" | "error";
  mensagem: string;
  carregando: boolean;
  totalPaginas: number;
  paginaAtual: number;
  recarregarAdmins: (page?: number, limit?: number) => Promise<void>;
  resetarDados: () => Promise<void>;
}

export interface AlertasContextValue {
  alertas: Alerta[];
  status: "loading" | "success" | "error";
  mensagem: string;
  carregando: boolean;
  salvando: boolean;
  adicionarAlerta: (dados: NovoAlertaInput) => Promise<void>;
  atualizarStatus: (id: number, novoStatus: StatusAlerta) => Promise<void>;
  cancelarAlerta: (id: number) => Promise<void>;
  recarregarAlertas: () => Promise<void>;
  resetarDados: () => Promise<void>;
}

export interface DashboardAiResponse {
  pergunta: string;
  resposta: string;
  contextoGeradoEm: string | null;
}

export interface ChartConfigItem {
  label?: React.ReactNode;
  icon?: React.ComponentType;
  color?: string;
  theme?: Record<string, string>;
}

export type ChartConfig = Record<string, ChartConfigItem>;

export interface ChartContextValue {
  config: ChartConfig;
}

export interface ChartContainerProps extends React.ComponentProps<"div"> {
  id?: string;
  config: ChartConfig;
  children: React.ReactNode;
}

export type ChartIndicator = "dot" | "line" | "dashed";

export interface ChartPayloadItem extends Record<string, unknown> {
  payload?: Record<string, unknown>;
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | null;
  type?: string;
  color?: string;
  fill?: string;
}

export interface ChartTooltipContentProps {
  active?: boolean;
  payload?: ChartPayloadItem[];
  className?: string;
  indicator?: ChartIndicator;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  label?: string | number;
  labelFormatter?: (
    value: React.ReactNode,
    payload: ChartPayloadItem[]
  ) => React.ReactNode;
  labelClassName?: string;
  formatter?: (
    value: unknown,
    name: unknown,
    item: ChartPayloadItem,
    index: number,
    payload: Record<string, unknown>
  ) => React.ReactNode;
  color?: string;
  nameKey?: string;
  labelKey?: string;
}

export interface ChartLegendContentProps {
  className?: string;
  hideIcon?: boolean;
  payload?: ChartPayloadItem[];
  verticalAlign?: "top" | "bottom";
  nameKey?: string;
}

export interface CriticidadeChartDatum {
  criticidade: Criticidade;
  label: string;
  operando: number;
  emAlerta: number;
  semSensor: number;
}

export interface IntegridadeSetorChartDatum {
  setor: string;
  setorLabel: string;
  integridade: number;
  maquinas: number;
}

export interface AlertTrendChartDatum {
  date: string;
  limite: number;
  tendencia: number;
}

export interface IntegridadeTrendChartDatum {
  date: string;
  integridade: number | null;
  maquinas: number;
  estimado?: boolean;
}

export interface StatusDistribuicaoChartDatum {
  status: "Estavel" | "Alerta" | "Critico";
  quantidade: number;
  fill: string;
}

export interface StatusHistoricoChartDatum {
  date: string;
  label: string;
  ok: number;
  semSensor: number;
  emAndamento: number;
  emAlerta: number;
  total: number;
}

export interface DashboardChartsContextValue {
  status: "loading" | "success" | "error";
  mensagem: string;
  maquinas: Maquina[];
  sensores: Sensor[];
  integrityTrendData: IntegridadeTrendChartDatum[];
  errors: {
    maquinas: string;
    sensores: string;
    integrityTrend: string;
  };
  notices: {
    integrityTrend: string;
  };
}
