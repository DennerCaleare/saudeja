/**
 * medicamentosDB.ts
 *
 * Base de dados LOCAL dos medicamentos do Programa Farmácia Popular (PFPB).
 * Fonte: Ministério da Saúde / RENAME 2022 / Portaria GM/MS nº 2.111/2020
 *
 * Esta base é suficiente para a funcionalidade CORE do app:
 * "Este remédio é gratuito? Onde pego?"
 *
 * Não depende de nenhuma API — funciona offline.
 */

export interface MedicamentoLocal {
  id: string;
  nome: string;             // Nome comercial mais conhecido
  principioAtivo: string;   // Nome genérico (INN)
  dosagens?: string[];       // Ex: ["25mg", "50mg", "100mg"]
  forma?: string;            // Comprimido, cápsula, solução, etc.
  gratuito: boolean;        // 100% gratuito no Farmácia Popular / SUS
  subsidiado: boolean;      // 90% de desconto
  percentualDesconto: number;
  disponibilidadeUBS: boolean; // Disponível nas UBS do SUS
  classeTerapeutica: string;
  indicacoes?: string[];     // em linguagem do paciente
  comoUsar?: string;
  atencao?: string;         // Aviso importante
  precoReferencia?: number;  // PMC médio mensal (R$) — para calcular economia
  bulaUrl?: string;          // Link web otimizado para o paciente (ex: Consulta Remédios)
}

const MEDICAMENTOS_CURADOS: MedicamentoLocal[] = [
  // ───── HIPERTENSÃO ─────────────────────────────────────────────────────
  {
    id: 'losartana',
    nome: 'Losartana',
    principioAtivo: 'losartana potássica',
    dosagens: ['25mg', '50mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Anti-hipertensivo',
    indicacoes: ['Pressão alta (hipertensão)', 'Proteção dos rins em diabéticos'],
    comoUsar: 'Tome 1 comprimido por dia, sempre no mesmo horário. Não pare sem avisar o médico.',
    precoReferencia: 45,
  },
  {
    id: 'atenolol',
    nome: 'Atenolol',
    principioAtivo: 'atenolol',
    dosagens: ['25mg', '50mg', '100mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Anti-hipertensivo / Betabloqueador',
    indicacoes: ['Pressão alta', 'Angina', 'Arritmias'],
    comoUsar: 'Tome 1 comprimido ao dia. Não pare abruptamente — reduza a dose gradualmente com orientação médica.',
    atencao: 'Não suspenda de forma brusca. Pode mascarar sintomas de hipoglicemia em diabéticos.',
    precoReferencia: 22,
  },
  {
    id: 'captopril',
    nome: 'Captopril',
    principioAtivo: 'captopril',
    dosagens: ['12,5mg', '25mg', '50mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Anti-hipertensivo (IECA)',
    indicacoes: ['Pressão alta', 'Insuficiência cardíaca', 'Proteção dos rins'],
    comoUsar: 'Tome 30 minutos antes das refeições. Comece com dose baixa.',
    precoReferencia: 25,
  },
  {
    id: 'enalapril',
    nome: 'Enalapril',
    principioAtivo: 'maleato de enalapril',
    dosagens: ['5mg', '10mg', '20mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Anti-hipertensivo (IECA)',
    indicacoes: ['Pressão alta', 'Insuficiência cardíaca'],
    comoUsar: 'Tome 1 ou 2 vezes ao dia conforme prescrição.',
    precoReferencia: 30,
  },
  {
    id: 'hidroclorotiazida',
    nome: 'Hidroclorotiazida',
    principioAtivo: 'hidroclorotiazida',
    dosagens: ['25mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Diurético / Anti-hipertensivo',
    indicacoes: ['Pressão alta', 'Retenção de líquidos'],
    comoUsar: 'Tome pela manhã para evitar acordar à noite para urinar.',
    precoReferencia: 19,
  },
  {
    id: 'anlodipino',
    nome: 'Anlodipino',
    principioAtivo: 'besilato de anlodipino',
    dosagens: ['5mg', '10mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Anti-hipertensivo (Bloqueador de canal de cálcio)',
    indicacoes: ['Pressão alta', 'Angina'],
    comoUsar: '1 comprimido ao dia, com ou sem alimento.',
    precoReferencia: 31,
  },
  {
    id: 'propranolol',
    nome: 'Propranolol',
    principioAtivo: 'cloridrato de propranolol',
    dosagens: ['10mg', '40mg', '80mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Betabloqueador',
    indicacoes: ['Pressão alta', 'Arritmia', 'Tremor essencial', 'Enxaqueca (prevenção)'],
    comoUsar: 'Tome com as refeições para melhor absorção.',
    precoReferencia: 28,
  },

  // ───── DIABETES ────────────────────────────────────────────────────────
  {
    id: 'metformina',
    nome: 'Metformina',
    principioAtivo: 'cloridrato de metformina',
    dosagens: ['500mg', '850mg', '1000mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antidiabético (Biguanida)',
    indicacoes: ['Diabetes tipo 2', 'Pré-diabetes', 'Síndrome do ovário policístico'],
    comoUsar: 'Tome durante ou após as refeições para reduzir efeitos estomacais.',
    precoReferencia: 38,
  },
  {
    id: 'glibenclamida',
    nome: 'Glibenclamida',
    principioAtivo: 'glibenclamida',
    dosagens: ['5mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antidiabético (Sulfonilureia)',
    indicacoes: ['Diabetes tipo 2'],
    comoUsar: 'Tome 30 minutos antes do café da manhã.',
    atencao: 'Risco de hipoglicemia (baixar o açúcar). Não pule refeições.',
    precoReferencia: 22,
  },
  {
    id: 'insulina-nph',
    nome: 'Insulina NPH',
    principioAtivo: 'insulina humana NPH',
    dosagens: ['100 UI/mL'],
    forma: 'Solução injetável',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antidiabético (Insulina)',
    indicacoes: ['Diabetes tipo 1', 'Diabetes tipo 2 com necessidade de insulina'],
    comoUsar: 'Aplique sob a pele conforme orientação do médico. Mantenha refrigerada.',
    precoReferencia: 80,
  },
  {
    id: 'insulina-regular',
    nome: 'Insulina Regular',
    principioAtivo: 'insulina humana regular',
    dosagens: ['100 UI/mL'],
    forma: 'Solução injetável',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antidiabético (Insulina)',
    indicacoes: ['Diabetes tipo 1', 'Emergências hiperglicêmicas'],
    comoUsar: 'Aplique 30 minutos antes das refeições conforme orientação.',
    precoReferencia: 80,
  },

  // ───── COLESTEROL ──────────────────────────────────────────────────────
  {
    id: 'sinvastatina',
    nome: 'Sinvastatina',
    principioAtivo: 'sinvastatina',
    dosagens: ['10mg', '20mg', '40mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Hipolipemiante (Estatina)',
    indicacoes: ['Colesterol alto', 'Prevenção cardiovascular'],
    comoUsar: 'Tome à noite, preferencialmente no jantar.',
    precoReferencia: 41,
  },

  // ───── ANTICOAGULANTE / CARDIOVASCULAR ────────────────────────────────
  {
    id: 'acs',
    nome: 'AAS / Aspirina',
    principioAtivo: 'ácido acetilsalicílico',
    dosagens: ['100mg', '500mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antiagregante plaquetário / Analgésico',
    indicacoes: ['Prevenção de infarto e AVC', 'Dor', 'Febre'],
    comoUsar: 'Para prevenção cardíaca: 1 comprimido de 100mg ao dia com alimento.',
    atencao: 'Evite em crianças com febre (risco de Síndrome de Reye). Pode causar sangramento.',
    precoReferencia: 28,
  },

  // ───── SISTEMA DIGESTIVO ───────────────────────────────────────────────
  {
    id: 'omeprazol',
    nome: 'Omeprazol',
    principioAtivo: 'omeprazol',
    dosagens: ['10mg', '20mg', '40mg'],
    forma: 'Cápsula',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Inibidor de bomba de prótons',
    indicacoes: ['Gastrite', 'Úlcera gástrica', 'Refluxo (queimação)'],
    comoUsar: 'Tome 30 minutos antes do café da manhã, em jejum.',
    precoReferencia: 36,
  },

  // ───── TIREOIDE ────────────────────────────────────────────────────────
  {
    id: 'levotiroxina',
    nome: 'Levotiroxina',
    principioAtivo: 'levotiroxina sódica',
    dosagens: ['25mcg', '50mcg', '75mcg', '100mcg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Hormônio tireoidiano',
    indicacoes: ['Hipotireoidismo (tireoide lenta)'],
    comoUsar: 'Tome em jejum, 30-60 minutos antes do café. Não tome com cálcio ou ferro.',
    atencao: 'Não pare de tomar sem orientação médica. O TSH deve ser monitorado.',
    precoReferencia: 35,
  },

  // ───── SAÚDE MENTAL ────────────────────────────────────────────────────
  {
    id: 'fluoxetina',
    nome: 'Fluoxetina',
    principioAtivo: 'cloridrato de fluoxetina',
    dosagens: ['10mg', '20mg'],
    forma: 'Cápsula',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antidepressivo (SSRI)',
    indicacoes: ['Depressão', 'TOC', 'Bulimia', 'Transtorno de pânico'],
    comoUsar: 'Tome 1 vez ao dia, pela manhã. O efeito demora 2-4 semanas para aparecer.',
    atencao: 'Não pare abruptamente. Informe o médico se tiver pensamentos de automutilação.',
    precoReferencia: 28,
  },
  {
    id: 'amitriptilina',
    nome: 'Amitriptilina',
    principioAtivo: 'cloridrato de amitriptilina',
    dosagens: ['10mg', '25mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antidepressivo tricíclico',
    indicacoes: ['Depressão', 'Dor crônica', 'Enxaqueca (prevenção)', 'Insônia'],
    comoUsar: 'Tome à noite — causa sonolência.',
    precoReferencia: 24,
  },
  {
    id: 'haloperidol',
    nome: 'Haloperidol',
    principioAtivo: 'haloperidol',
    dosagens: ['1mg', '5mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antipsicótico',
    indicacoes: ['Esquizofrenia', 'Psicose', 'Agitação'],
    comoUsar: 'Siga rigorosamente a prescrição médica.',
    precoReferencia: 30,
  },

  // ───── EPILEPSIA / NEUROLOGIA ──────────────────────────────────────────
  {
    id: 'carbamazepina',
    nome: 'Carbamazepina',
    principioAtivo: 'carbamazepina',
    dosagens: ['200mg', '400mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antiepilético',
    indicacoes: ['Epilepsia', 'Dor do nervo (neuralgia)'],
    comoUsar: 'Tome com alimentos. Não misture com álcool.',
    precoReferencia: 38,
  },
  {
    id: 'fenobarbital',
    nome: 'Fenobarbital',
    principioAtivo: 'fenobarbital',
    dosagens: ['50mg', '100mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antiepilético / Barbitúrico',
    indicacoes: ['Epilepsia'],
    comoUsar: 'Tome no mesmo horário todos os dias. Não pare sem orientação médica.',
    precoReferencia: 22,
  },

  // ───── PARKINSON ───────────────────────────────────────────────────────
  {
    id: 'levodopa-carbidopa',
    nome: 'Levodopa + Carbidopa',
    principioAtivo: 'levodopa / carbidopa',
    dosagens: ['250mg/25mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antiparkinsononiano',
    indicacoes: ['Doença de Parkinson'],
    comoUsar: 'Tome 30 minutos antes das refeições. Evite proteínas na mesma refeição.',
    precoReferencia: 65,
  },

  // ───── RESPIRATÓRIO ────────────────────────────────────────────────────
  {
    id: 'salbutamol',
    nome: 'Salbutamol',
    principioAtivo: 'sulfato de salbutamol',
    dosagens: ['100mcg/dose', '2mg', '4mg'],
    forma: 'Aerossol / Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Broncodilatador',
    indicacoes: ['Asma', 'DPOC', 'Broncoespasmo'],
    comoUsar: '2 inalações quando sentir falta de ar. Máx. 4x ao dia.',
    precoReferencia: 42,
  },
  {
    id: 'beclometasona',
    nome: 'Beclometasona',
    principioAtivo: 'dipropionato de beclometasona',
    dosagens: ['50mcg/dose', '200mcg/dose'],
    forma: 'Aerossol',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Corticoide inalatório',
    indicacoes: ['Asma (prevenção)', 'Rinite alérgica'],
    comoUsar: 'Use diariamente mesmo sem sintomas — é preventivo, não de alívio.',
    precoReferencia: 55,
  },

  // ───── ANTIINFECCIOSO ──────────────────────────────────────────────────
  {
    id: 'amoxicilina',
    nome: 'Amoxicilina',
    principioAtivo: 'amoxicilina',
    dosagens: ['250mg', '500mg'],
    forma: 'Cápsula / Pó para suspensão',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antibiótico (Penicilina)',
    indicacoes: ['Infecções bacterianas (garganta, ouvido, urinária, pneumonia)'],
    comoUsar: 'Complete todo o tratamento mesmo se melhorar antes.',
    atencao: 'Não use sem prescrição. Informe sobre alergia à penicilina.',
    precoReferencia: 24,
  },
  {
    id: 'azitromicina',
    nome: 'Azitromicina',
    principioAtivo: 'dihidrato de azitromicina',
    dosagens: ['250mg', '500mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antibiótico (Macrolídeo)',
    indicacoes: ['Infecções respiratórias', 'DSTs (clamídia, gonorreia)', 'Pneumonia'],
    comoUsar: '1 comprimido ao dia por 3-5 dias conforme prescrição.',
    precoReferencia: 38,
  },
  {
    id: 'ciprofloxacino',
    nome: 'Ciprofloxacino',
    principioAtivo: 'cloridrato de ciprofloxacino',
    dosagens: ['250mg', '500mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antibiótico (Fluoroquinolona)',
    indicacoes: ['Infecção urinária', 'Diarreia bacteriana'],
    comoUsar: 'Tome de 12 em 12 horas. Evite laticínios próximo à dose.',
    precoReferencia: 32,
  },
  {
    id: 'cefalexina',
    nome: 'Cefalexina',
    principioAtivo: 'cefalexina monohidratada',
    dosagens: ['500mg'],
    forma: 'Cápsula / Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true, // Disponível na UBS, não no FP privado
    classeTerapeutica: 'Antibiótico (Cefalosporina)',
    indicacoes: ['Infecção de pele', 'Infecção urinária', 'Infeccões respiratórias'],
    comoUsar: 'Tome de 6 em 6 horas, completando o ciclo todo.',
    precoReferencia: 30,
  },

  // ───── ANALGÉSICOS E ANTI-INFLAMATÓRIOS (BÁSICOS UBS) ─────────────────
  {
    id: 'paracetamol',
    nome: 'Paracetamol',
    principioAtivo: 'paracetamol',
    dosagens: ['500mg', '750mg', '200mg/mL (gotas)'],
    forma: 'Comprimido / Gotas',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true, // Disponível na UBS
    classeTerapeutica: 'Analgésico e Antitérmico',
    indicacoes: ['Dor de cabeça', 'Febre', 'Dor no corpo (dengue, viroses)'],
    comoUsar: '1 comprimido a cada 6 ou 8 horas. Evite uso excessivo (risco ao fígado).',
    precoReferencia: 15,
  },
  {
    id: 'dipirona',
    nome: 'Dipirona',
    principioAtivo: 'dipirona monoidratada',
    dosagens: ['500mg', '1g', '500mg/mL (gotas)'],
    forma: 'Comprimido / Gotas',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Analgésico e Antitérmico',
    indicacoes: ['Dor forte', 'Febre alta', 'Enxaqueca'],
    comoUsar: 'Em caso de dor ou febre, até 4 vezes ao dia.',
    precoReferencia: 12,
  },
  {
    id: 'ibuprofeno',
    nome: 'Ibuprofeno',
    principioAtivo: 'ibuprofeno',
    dosagens: ['300mg', '600mg', '50mg/mL (gotas)'],
    forma: 'Comprimido / Gotas',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Anti-inflamatório Neosteroide (AINE)',
    indicacoes: ['Dor inflamatória', 'Febre', 'Dor de garganta', 'Cólica menstrual'],
    comoUsar: 'Tome após as refeições para não agredir o estômago.',
    atencao: 'Não usar em caso de suspeita de Dengue.',
    precoReferencia: 18,
  },
  {
    id: 'diclofenaco',
    nome: 'Diclofenaco',
    principioAtivo: 'diclofenaco sódico',
    dosagens: ['50mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Anti-inflamatório (AINE)',
    indicacoes: ['Dor muscular', 'Inflamações articulares', 'Dor de dente'],
    comoUsar: 'Tome após as refeições.',
    atencao: 'Evite uso prolongado. Não usar com suspeita de Dengue.',
    precoReferencia: 14,
  },

  // ───── ANTIALÉRGICOS ──────────────────────────────────────────────────
  {
    id: 'loratadina',
    nome: 'Loratadina',
    principioAtivo: 'loratadina',
    dosagens: ['10mg', '1mg/mL (xarope)'],
    forma: 'Comprimido / Xarope',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antialérgico (Anti-histamínico)',
    indicacoes: ['Rinite alérgica', 'Urticária', 'Alergias crônicas'],
    comoUsar: '1 comprimido ao dia. Não costuma dar sono.',
    precoReferencia: 20,
  },
  {
    id: 'dexclorfeniramina',
    nome: 'Dexclorfeniramina (Polaramine)',
    principioAtivo: 'maleato de dexclorfeniramina',
    dosagens: ['2mg', '0,4mg/mL (xarope)'],
    forma: 'Comprimido / Xarope',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Antialérgico',
    indicacoes: ['Coceira', 'Alergias agudas', 'Picada de inseto'],
    comoUsar: 'Tome a cada 8 horas. Causa muita sonolência.',
    precoReferencia: 15,
  },

  // ───── SUPLEMENTAÇÃO ───────────────────────────────────────────────────
  {
    id: 'sulfato-ferroso',
    nome: 'Sulfato Ferroso',
    principioAtivo: 'sulfato ferroso',
    dosagens: ['40mg', '200mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Suplemento de ferro',
    indicacoes: ['Anemia ferropriva', 'Gestantes', 'Crianças'],
    comoUsar: 'Tome em jejum ou com suco de laranja (vitamina C aumenta absorção). Pode escurecer as fezes.',
    precoReferencia: 18,
  },
  {
    id: 'acido-folico',
    nome: 'Ácido Fólico',
    principioAtivo: 'ácido fólico',
    dosagens: ['400mcg', '5mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Vitamina B9',
    indicacoes: ['Prevenção de defeitos do tubo neural (gestantes)', 'Anemia megaloblástica'],
    comoUsar: 'Gestantes: tome idealmente desde antes de engravidar.',
    precoReferencia: 15,
  },

  // ───── CONTRACEPTIVOS ──────────────────────────────────────────────────
  {
    id: 'levonorgestrel-etinilestradiol',
    nome: 'Anticoncepcional (Levonorgestrel + Etinilestradiol)',
    principioAtivo: 'levonorgestrel / etinilestradiol',
    dosagens: ['0,15mg/0,03mg'],
    forma: 'Comprimido',
    gratuito: true, subsidiado: false, percentualDesconto: 100,
    disponibilidadeUBS: true,
    classeTerapeutica: 'Contraceptivo oral',
    indicacoes: ['Anticoncepção', 'Regulação menstrual'],
    comoUsar: 'Tome 1 comprimido ao dia no mesmo horário. Comece no 1º dia da menstruação.',
    precoReferencia: 25,
  },
];

// ==========================================
// INTEGRAÇÃO BASE CMED (Mercado Completo via Nuvem)
// ==========================================
// Foi removido o import estático (todos_medicamentos.json) para reduzir o tamanho do APK.
// A base agora chega via Network Fetch no syncService.ts

let MERCADO_COMPLETO: MedicamentoLocal[] = [...MEDICAMENTOS_CURADOS];
const nomesCurados = new Set(MEDICAMENTOS_CURADOS.map(m => m.nome.toLowerCase()));

// ─── Funções de busca ─────────────────────────────────────────────────────────

function normalizar(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim();
}

export const medicamentosDB = {
  /** Busca por nome, princípio ativo, indicação ou classe terapêutica */
  buscar(termo: string): MedicamentoLocal[] {
    if (!termo || termo.trim().length < 2) return [];
    const t = normalizar(termo);
    const termos = t.split(' ').filter(Boolean);

    return MERCADO_COMPLETO.filter((m) => {
      const campos = normalizar(
        `${m.nome} ${m.principioAtivo} ${m.classeTerapeutica} ${(m.indicacoes || []).join(' ')}`
      );
      return termos.every((t) => campos.includes(t));
    });
  },

  /** Retorna todos os medicamentos (para listagem de gratuitos) */
  listarTodos(): MedicamentoLocal[] {
    return MERCADO_COMPLETO;
  },

  /** Retorna só os gratuitos */
  listarGratuitos(): MedicamentoLocal[] {
    return MERCADO_COMPLETO.filter((m) => m.gratuito);
  },

  /** Busca por ID */
  porId(id: string): MedicamentoLocal | undefined {
    return MERCADO_COMPLETO.find((m) => m.id === id);
  },

  /** Verifica se um nome/princípio é gratuito (para o cálculo de economia) */
  verificarDisponibilidade(nome: string): { gratuito: boolean; desconto: number } {
    const resultados = medicamentosDB.buscar(nome);
    const gratuito = resultados.some((m) => m.gratuito);
    if (gratuito) return { gratuito: true, desconto: 100 };
    const subsidiado = resultados.find((m) => m.subsidiado);
    if (subsidiado) return { gratuito: false, desconto: subsidiado.percentualDesconto };
    return { gratuito: false, desconto: 0 };
  },

  /** Calcula a economia mensal baseada nos medicamentos em uso */
  calcularEconomia(medicamentosEmUso: string[]): {
    economiaTotal: number;
    economiaAnual: number;
    detalhes: { nome: string; economia: number }[];
  } {
    const detalhes: { nome: string; economia: number }[] = [];
    for (const nome of medicamentosEmUso) {
      const m = medicamentosDB.buscar(nome)[0];
      if (m?.gratuito && m.precoReferencia && m.precoReferencia > 0) {
        detalhes.push({ nome: m.nome, economia: m.precoReferencia });
      }
    }
    const economiaTotal = detalhes.reduce((s, d) => s + d.economia, 0);
    return { economiaTotal, economiaAnual: economiaTotal * 12, detalhes };
  },

  /** 
   * Função para o sistema de Sincronização em Nuvem (syncService)
   * injetar os milhares de dados assim que baixar da rede.
   */
  injetarBaseNuvem(dadosDaNuvem: any[]) {
    if (!dadosDaNuvem || dadosDaNuvem.length === 0) return;

    const novosMedicamentos = dadosDaNuvem.map((med) => {
      // Evita duplicar medicações que já cuidamos com Ouro no SUS
      if (nomesCurados.has(String(med.nome).toLowerCase())) return null;

      return {
        id: med.id || String(Math.random()),
        nome: med.nome,
        principioAtivo: med.principioAtivo,
        classeTerapeutica: med.classeTerapeutica || med.classe || 'Medicamento',
        gratuito: false,
        subsidiado: false,
        percentualDesconto: 0,
        disponibilidadeUBS: false,
      } as MedicamentoLocal;
    }).filter(Boolean) as MedicamentoLocal[];

    MERCADO_COMPLETO = [...MEDICAMENTOS_CURADOS, ...novosMedicamentos];
    console.log(`[MedicamentosDB] Injetou nova base da Nuvem. Total Indexado: ${MERCADO_COMPLETO.length}`);
  },

  /** 
   * Retorna até 5 medicamentos que possuem o mesmo princípio ativo, 
   * omitindo o próprio medicamento pesquisado.
   */
  buscarSimilares(idOriginal: string): MedicamentoLocal[] {
    const original = this.porId(idOriginal);
    if (!original || !original.principioAtivo) return [];
    
    // Normaliza para comparação cruzada (ex: tira "potássica" ou "sódica" se precisar, mas vamos no bruto primeiro)
    const paOriginal = normalizar(original.principioAtivo);

    return MERCADO_COMPLETO.filter((m) => {
      if (m.id === idOriginal) return false;
      if (!m.principioAtivo) return false;
      const paOutro = normalizar(m.principioAtivo);
      // Retorna se o prinipio ativo bate parcialmente
      return paOutro === paOriginal || paOutro.includes(paOriginal) || paOriginal.includes(paOutro);
    }).slice(0, 5); // Traz no máximo 5 alternativos
  }
};
