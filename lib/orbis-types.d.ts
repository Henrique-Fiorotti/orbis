import type * as React from "react";

export interface WithChildrenProps {
  children: React.ReactNode;
}

export interface RootLayoutProps extends WithChildrenProps {
  modal?: React.ReactNode;
}

export interface DashboardLayoutProps extends WithChildrenProps {}

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

export type StatusSensor = "ONLINE" | "OFFLINE";

export interface Sensor {
  id: number;
  nome: string;
  maquinaId: number;
  maquinaNome: string;
  status: StatusSensor;
  ultimaLeituraEm: string;
  temperatura: SensorLeitura | null;
  vibracao: SensorLeitura | null;
}

export interface NovoSensorInput {
  nome: string;
  maquinaId: number;
  maquinaNome: string;
  temperatura: SensorLeitura | null;
  vibracao: SensorLeitura | null;
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
  telefone: string;
  especialidade: string;
  status: StatusTecnico;
  foto: string | null;
}

export type AtualizacaoTecnicoInput = Partial<NovoTecnicoInput>;

export type TipoAlerta =
  | "LIMITE_ULTRAPASSADO"
  | "TENDENCIA_CURTA"
  | "TENDENCIA_LONGA"
  | "DEGRADACAO_ACELERADA"
  | "INSTABILIDADE";

export type SeveridadeAlerta = "ALTA" | "MEDIA" | "BAIXA";
export type StatusAlerta = "ABERTO" | "ATENDIDO" | "IGNORADO";

export interface Alerta {
  id: number;
  tipo: TipoAlerta;
  maquinaId: number | null;
  maquinaNome: string;
  sensorId: number | null;
  sensorNome: string;
  severidade: SeveridadeAlerta;
  status: StatusAlerta;
  descricao: string;
  criadoEm: string;
}

export interface NovoAlertaInput {
  tipo: TipoAlerta;
  maquinaId?: number | null;
  maquinaNome: string;
  sensorId?: number | null;
  sensorNome: string;
  severidade: SeveridadeAlerta;
  descricao: string;
}

export type AtualizacaoAlertaInput = Partial<NovoAlertaInput>;

export interface MaquinasContextValue {
  maquinas: Maquina[];
  adicionarMaquina: (dados: NovaMaquinaInput) => Maquina;
  editarMaquina: (id: number, dados: AtualizacaoMaquinaInput) => void;
  excluirMaquina: (id: number) => void;
  resetarDados: () => void;
}

export interface SensoresContextValue {
  sensores: Sensor[];
  adicionarSensor: (dados: NovoSensorInput) => Sensor;
  editarSensor: (id: number, dados: AtualizacaoSensorInput) => void;
  excluirSensor: (id: number) => void;
  resetarDados: () => void;
}

export interface TecnicosContextValue {
  tecnicos: Tecnico[];
  adicionarTecnico: (dados: NovoTecnicoInput) => Tecnico;
  editarTecnico: (id: number, dados: AtualizacaoTecnicoInput) => void;
  excluirTecnico: (id: number) => void;
  resetarDados: () => void;
}

export interface AlertasContextValue {
  alertas: Alerta[];
  adicionarAlerta: (dados: NovoAlertaInput) => Alerta;
  editarAlerta: (id: number, dados: AtualizacaoAlertaInput) => void;
  atualizarStatus: (id: number, novoStatus: StatusAlerta) => void;
  excluirAlerta: (id: number) => void;
  resetarDados: () => void;
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

export interface StatusDistribuicaoChartDatum {
  status: "Estavel" | "Alerta" | "Critico";
  quantidade: number;
  fill: string;
}

export interface DashboardChartsContextValue {
  status: "loading" | "success" | "error";
  mensagem: string;
  maquinas: Maquina[];
  sensores: Sensor[];
  alertTrendData: AlertTrendChartDatum[];
  errors: {
    maquinas: string;
    sensores: string;
    alertTrend: string;
  };
  notices: {
    alertTrend: string;
  };
}
