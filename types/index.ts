// ===== MEDICAMENTOS =====
export interface Medicamento {
  id: string;
  nome: string;            // Nome comercial
  nomeGenerico: string;    // Princípio ativo
  laboratorio: string;
  apresentacao: string;    // "500mg comprimido cx 20"
  registroAnvisa: string;
  ean: string[];
  classeTerapeutica: string;
  tipoRegistro: 'Referencia' | 'Generico' | 'Similar' | 'Novo' | 'Biologico';
  regimePreco: 'Regulado' | 'Liberado' | 'Monitorado';
  situacao: 'Ativo' | 'Cancelado' | 'Vencido';

  // Preços
  precoFabrica: number;
  precoMaximoConsumidor: { [uf: string]: number };
  precoBPS?: number;       // Preço real praticado no SUS

  // Programas SUS — dinheiro na mão do usuário
  gratuitoFarmaciaPopular: boolean;
  subsidiadoFarmaciaPopular: boolean;
  percentualDesconto?: number;
  disponivelSUS: boolean;
  codigoRENAME?: string;

  // Conteúdo
  bulaUrl?: string;
  bulaConsumidorUrl?: string;

  // Metadados
  dataVencimentoRegistro?: string;
  restricaoHospitalar: boolean;
}

// ===== FARMÁCIAS =====
export interface Farmacia {
  id: string;
  cnes: string;
  nome: string;
  nomeFantasia?: string;
  cnpj: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  coordenadas: { lat: number; lon: number };
  telefone?: string;
  horarioFuncionamento?: string;
  participaFarmaciaPopular: boolean;
  distanciaKm?: number;
}

export type HorarioFarmacia = {
  abertaAgora: boolean | null;
  textoHoje: string;
  funcionamento24h: boolean;
};

// ===== ESTABELECIMENTOS DE SAÚDE =====
export type TipoEstabelecimento =
  | 'UBS'
  | 'UPA'
  | 'Hospital'
  | 'CAPS'
  | 'CEO'
  | 'CRIE'
  | 'Farmacia'
  | 'Laboratorio'
  | 'Outro';

export interface EstabelecimentoSaude {
  id: string;
  cnes: string;
  nome: string;
  tipo: TipoEstabelecimento;
  nivelUrgencia?: 1 | 2 | 3 | 4;
  especialidades?: string[];
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  coordenadas: { lat: number; lon: number };
  telefone?: string;
  horarioFuncionamento?: string;   // Original/Raw string
  horarioParsed?: HorarioFarmacia; // Novo parser OSM
  funcionamento24h: boolean;
  atendeSUS: boolean;
  participaFarmaciaPopular?: boolean;
  fonte?: 'osm' | 'cnes' | 'fp';
  distanciaKm?: number;
}

// ===== VACINAS =====
export type FaixaEtaria =
  | 'recem-nascido'
  | '1-mes'
  | '2-meses'
  | '3-meses'
  | '4-meses'
  | '5-meses'
  | '6-meses'
  | '9-meses'
  | '12-meses'
  | '15-meses'
  | '4-anos'
  | '9-anos'
  | '11-anos'
  | 'adolescente'
  | 'adulto'
  | 'idoso-60'
  | 'gestante'
  | 'indigena';

export interface Vacina {
  id: string;
  nome: string;                     // Nome técnico: "Pentavalente"
  nomePopular: string;              // "Proteção contra 5 doenças graves"
  doencasProtegidas: string[];      // ["Difteria", "Tétano", "Coqueluche"]
  doencasProtegidasSimples: string[]; // ["coqueluche", "meningite", "hepatite B"]
  faixasEtarias: FaixaEtaria[];
  numeroDoses: number;
  intervaloDoses?: string;
  viaAdministracao: string;
  gratuitaSUS: boolean;
  disponibilidade: 'UBS' | 'CRIE' | 'Campanha' | 'UBS e CRIE';
  contraindicacoes?: string[];
  observacoes?: string;
  mensagemAtraso?: string;          // "Guilherme está com essa vacina atrasada desde {data}"
}

export interface VacinaUsuario {
  vacinaId: string;
  nome: string;
  doses: {
    numero: number;
    dataAplicacao?: Date;
    aplicada: boolean;
    dataLembrete?: Date;
    dataVencimento?: Date;
  }[];
}

// ===== ALERTAS / VIGILÂNCIA =====
export interface AlertaSaude {
  id: string;
  tipo: 'SRAG' | 'Dengue' | 'Gripe' | 'Recall' | 'Campanha' | 'Epidemia';
  titulo: string;
  descricao: string;
  uf?: string;
  municipio?: string;
  dataInicio: Date;
  dataFim?: Date;
  nivel: 'info' | 'atencao' | 'alerta' | 'emergencia';
  fonteUrl?: string;
  acaoRecomendada?: string;
  sintomasDeAlerta?: string[];
}

// ===== PERFIL DO USUÁRIO =====
export interface PerfilUsuario {
  id: string;
  nome?: string;
  dataNascimento?: Date;
  sexo?: 'M' | 'F' | 'Outro';
  uf?: string;
  municipio?: string;
  codigoIBGE?: string;
  gestante: boolean;
  comorbidades: string[];    // ["Diabetes", "Hipertensão"]
  alergias: string[];
  tipoSanguineo?: string;
  planoSaude?: string;
  cartaoSUS?: string;
  economiaCalculada?: number; // R$ economizados identificados com remédios gratuitos
}

// ===== PERFIL INFANTIL =====
export interface PerfilInfantil {
  id: string;
  nome: string;
  dataNascimento: Date;
  sexo?: 'M' | 'F';
  cartaoVacinas: VacinaUsuario[];
}

// ===== MEDICAÇÃO EM USO =====
export interface MedicacaoEmUso {
  id: string;
  medicamento: Medicamento;
  posologia: string;
  horarios: string[];         // ["08:00", "16:00", "00:00"]
  dataInicio: Date;
  dataFim?: Date;
  notificacoesAtivas: boolean;
  estoque?: number;           // Comprimidos restantes
  alertaEstoqueMinimo?: number;
  diasRestantes?: number;     // Calculado automaticamente
}

// ===== CAMPANHA VACINAL =====
export interface CampanhaVacinal {
  id: string;
  nome: string;               // "Campanha Nacional de Vacinação contra Influenza"
  vacina: string;
  publico: string;            // "Idosos, crianças, gestantes e profissionais de saúde"
  inicio: Date;
  fim: Date;
  ativa: boolean;
  descricao?: string;
}

// ===== RESULTADO DE BUSCA =====
export interface ResultadoBuscaMedicamento {
  items: Medicamento[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

// ===== ECONOMIA CALCULADA =====
export interface EconomiaCalculada {
  economiaTotal: number;       // R$ por mês
  economiaAnual: number;       // R$ por ano
  detalhes: {
    nome: string;
    precoPago: number;
    precoGratuito: number;
    economia: number;
  }[];
}
