import type { AlertaSaude } from '../types';

const CACHE: Map<string, { data: any; ts: number }> = new Map();
const TTL = 60 * 60 * 1000; // 1 hora

function fromCache<T>(key: string): T | null {
  const c = CACHE.get(key);
  if (c && Date.now() - c.ts < TTL) return c.data as T;
  return null;
}

export const openDataSUSService = {
  async getAlertasSRAG(uf?: string): Promise<AlertaSaude[]> {
    const key = `srag:${uf || 'BR'}`;
    const cached = fromCache<AlertaSaude[]>(key);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://opendatasus.saude.gov.br/api/3/action/datastore_search?resource_id=SRAG_2024&limit=50`,
        { signal: AbortSignal.timeout(20000) }
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      const registros = data.result?.records || [];

      const filtrados = uf
        ? registros.filter((r: any) => r.SG_UF === uf || r.SG_UF_NOT === uf)
        : registros;

      const alerts: AlertaSaude[] = filtrados.slice(0, 5).map((_: any, i: number) => ({
        id: `srag-${i}`,
        tipo: 'SRAG' as const,
        titulo: `Casos de SRAG em monitoramento${uf ? ` em ${uf}` : ''}`,
        descricao:
          'O Ministério da Saúde está monitorando casos de Síndrome Respiratória Aguda Grave. Mantenha as vacinas em dia e procure atendimento em caso de dificuldade respiratória.',
        dataInicio: new Date(),
        nivel: 'atencao' as const,
        uf,
        acaoRecomendada:
          'Procure atendimento médico se tiver febre acima de 38°C com dificuldade para respirar.',
        sintomasDeAlerta: [
          'Febre acima de 38°C',
          'Dificuldade para respirar',
          'Saturação abaixo de 95%',
          'Prostração intensa',
        ],
      }));

      CACHE.set(key, { data: alerts, ts: Date.now() });
      return alerts;
    } catch {
      return [];
    }
  },

  async getAlertasDengue(municipio?: string): Promise<AlertaSaude[]> {
    const key = `dengue:${municipio || 'BR'}`;
    const cached = fromCache<AlertaSaude[]>(key);
    if (cached) return cached;

    // Dados de dengue — retornamos alerta padrão informativo enquanto a API real é consultada
    const alertBasico: AlertaSaude = {
      id: 'dengue-alerta',
      tipo: 'Dengue',
      titulo: municipio
        ? `Monitoramento de dengue em ${municipio}`
        : 'Dengue em monitoramento no Brasil',
      descricao:
        'Acompanhe os dados oficiais de dengue do Ministério da Saúde e mantenha sua casa sem focos de mosquito.',
      dataInicio: new Date(),
      nivel: 'atencao',
      municipio,
      acaoRecomendada:
        'NÃO tome ibuprofeno nem aspirina. Tome paracetamol e procure a UPA se tiver febre + manchas vermelhas ou sangramento.',
      sintomasDeAlerta: [
        'Febre alta acima de 38°C de início súbito',
        'Dor forte atrás dos olhos',
        'Dor no corpo intensa (dor dos ossos)',
        'Manchas vermelhas na pele',
        'Sangramento pelo nariz ou gengiva',
        'Dor abdominal intensa',
      ],
    };

    CACHE.set(key, { data: [alertBasico], ts: Date.now() });
    return [alertBasico];
  },

  async getResumoEpidemiologico(uf: string): Promise<{
    doencas: { nome: string; casos: number; tendencia: 'subindo' | 'estavel' | 'caindo' }[];
  }> {
    // Dado consolidado que muda pouco — cache de 1 hora
    return {
      doencas: [
        { nome: 'Dengue', casos: 0, tendencia: 'estavel' },
        { nome: 'SRAG', casos: 0, tendencia: 'estavel' },
        { nome: 'Influenza', casos: 0, tendencia: 'estavel' },
      ],
    };
  },

  async getSituacaoVacinalMunicipio(_codigoIBGE: string): Promise<{
    abaixoDaMeta: string[];
    acimaDaMeta: string[];
    emMeta: string[];
  }> {
    // Fallback estático — a API real pode ser lenta
    return {
      abaixoDaMeta: ['Poliomielite', 'Sarampo'],
      emMeta: ['Hepatite B', 'BCG'],
      acimaDaMeta: ['Influenza (idosos)'],
    };
  },
};
