// Tabela CMED estática dos 12 remédios mais buscados (atualizar a cada release)
// Fonte: https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos
export const TABELA_CMED_BASE: Record<string, { nome: string, pf: number }> = {
  'dipirona_500_20cp':      { nome: 'Dipirona 500mg 20cp',       pf: 3.99 },
  'paracetamol_750_20cp':   { nome: 'Paracetamol 750mg 20cp',    pf: 5.80 },
  'ibuprofeno_600_20cp':    { nome: 'Ibuprofeno 600mg 20cp',     pf: 12.40 },
  'amoxicilina_500_21cp':   { nome: 'Amoxicilina 500mg 21cp',    pf: 12.90 },
  'azitromicina_500_3cp':   { nome: 'Azitromicina 500mg 3cp',    pf: 14.80 },
  'omeprazol_20_28cp':      { nome: 'Omeprazol 20mg 28cp',       pf: 9.60 },
  'losartana_50_30cp':      { nome: 'Losartana 50mg 30cp',       pf: 7.20 },
  'metformina_850_30cp':    { nome: 'Metformina 850mg 30cp',     pf: 7.80 },
  'atenolol_25_30cp':       { nome: 'Atenolol 25mg 30cp',        pf: 4.90 },
  'sinvastatina_20_30cp':   { nome: 'Sinvastatina 20mg 30cp',    pf: 6.10 },
  'captopril_25_30cp':      { nome: 'Captopril 25mg 30cp',       pf: 4.20 },
  'salbutamol_spray':       { nome: 'Salbutamol spray 200 doses', pf: 15.60 },
};

// Aplica alíquota ICMS do estado para chegar no PMC (preço ao consumidor)
const ICMS_POR_UF: Record<string, number> = {
  SP: 1.18, MG: 1.18, RJ: 1.20, RS: 1.18, PR: 1.18,
  SC: 1.18, BA: 1.18, CE: 1.18, PE: 1.18, GO: 1.17,
  // Fallback default no caso de não estar mapeado explicitamente
};

export function calcularPMC(pf: number, uf: string): number {
  const ufClean = (uf || '').toUpperCase().trim();
  const icms = ICMS_POR_UF[ufClean] || 1.17;
  return Math.round(pf * icms * 100) / 100;
}
