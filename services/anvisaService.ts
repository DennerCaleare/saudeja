import axios from 'axios';
import { API } from '../constants/api';
import type { Medicamento, AlertaSaude } from '../types';

const CACHE: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

function fromCache<T>(key: string): T | null {
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any) {
  CACHE.set(key, { data, timestamp: Date.now() });
}

const client = axios.create({
  baseURL: API.ANVISA_BASE,
  timeout: 12000,
  headers: { Authorization: 'Guest' },
});

// Retry automático para 5xx e timeouts (max 2x)
client.interceptors.response.use(undefined, async (error) => {
  const config = error.config as any;
  config._retryCount = config._retryCount || 0;
  const isServerError = error.response?.status >= 500;
  const isTimeout = error.code === 'ECONNABORTED';
  if ((isServerError || isTimeout) && config._retryCount < 2) {
    config._retryCount++;
    await new Promise((r) => setTimeout(r, 800 * config._retryCount));
    return client(config);
  }
  return Promise.reject(error);
});

function mapToMedicamento(item: any): Medicamento {
  return {
    id: item.numeroRegistro || String(Math.random()),
    nome: item.nomeProduto || '',
    nomeGenerico: item.substancia || '',
    laboratorio: item.empresa || '',
    apresentacao: item.apresentacao || '',
    registroAnvisa: item.numeroRegistro || '',
    ean: [item.ean1, item.ean2, item.ean3].filter(Boolean),
    classeTerapeutica: item.classeTerapeutica || '',
    tipoRegistro: mapTipoRegistro(item.categoria),
    regimePreco: 'Regulado',
    situacao: item.situacao === 'Ativo' ? 'Ativo' : 'Cancelado',
    precoFabrica: 0,
    precoMaximoConsumidor: {},
    gratuitoFarmaciaPopular: false,
    subsidiadoFarmaciaPopular: false,
    disponivelSUS: false,
    bulaUrl: item.urlBulaProfissional || undefined,
    bulaConsumidorUrl: item.urlBulaConsumidor || undefined,
    restricaoHospitalar: item.restricaoHospitalar === 'Sim',
  };
}

function mapTipoRegistro(
  categoria: string
): Medicamento['tipoRegistro'] {
  const map: Record<string, Medicamento['tipoRegistro']> = {
    'Referência': 'Referencia',
    'Genérico': 'Generico',
    'Similar': 'Similar',
    'Novo': 'Novo',
    'Biológico': 'Biologico',
  };
  return map[categoria] || 'Similar';
}

export const anvisaService = {
  async buscarPorNome(
    nome: string,
    pagina = 1
  ): Promise<{ items: Medicamento[]; total: number }> {
    if (!nome.trim()) return { items: [], total: 0 };
    const cacheKey = `nome:${nome}:${pagina}`;
    const cached = fromCache<{ items: Medicamento[]; total: number }>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await client.get('/consulta/medicamentos', {
        params: {
          count: 20,
          page: pagina,
          'filter[nomeProduto]': nome,
        },
      });
      const result = {
        items: (data.content || []).map(mapToMedicamento),
        total: data.totalElements || 0,
      };
      setCache(cacheKey, result);
      return result;
    } catch {
      return { items: [], total: 0 };
    }
  },

  async buscarPorPrincipioAtivo(principio: string): Promise<Medicamento[]> {
    if (!principio.trim()) return [];
    const cacheKey = `principio:${principio}`;
    const cached = fromCache<Medicamento[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await client.get('/consulta/medicamentos', {
        params: { count: 20, 'filter[substancia]': principio },
      });
      const items = (data.content || []).map(mapToMedicamento);
      // Genéricos primeiro — mais barato, mesmo efeito
      items.sort((a: Medicamento, b: Medicamento) => {
        const order = { Generico: 0, Similar: 1, Referencia: 2, Novo: 3, Biologico: 4 };
        return (order[a.tipoRegistro] || 99) - (order[b.tipoRegistro] || 99);
      });
      setCache(cacheKey, items);
      return items;
    } catch {
      return [];
    }
  },

  async buscarPorEAN(ean: string): Promise<Medicamento | null> {
    if (!ean.trim()) return null;
    const cacheKey = `ean:${ean}`;
    const cached = fromCache<Medicamento | null>(cacheKey);
    if (cached !== null) return cached;

    for (const field of ['ean1', 'ean2', 'ean3']) {
      try {
        const { data } = await client.get('/consulta/medicamentos', {
          params: { count: 1, [`filter[${field}]`]: ean },
        });
        if (data.content?.length) {
          const result = mapToMedicamento(data.content[0]);
          setCache(cacheKey, result);
          return result;
        }
      } catch {
        continue;
      }
    }
    setCache(cacheKey, null);
    return null;
  },

  async obterDetalhes(registroAnvisa: string): Promise<Medicamento | null> {
    const cacheKey = `detalhes:${registroAnvisa}`;
    const cached = fromCache<Medicamento | null>(cacheKey);
    if (cached !== null) return cached;

    try {
      const { data } = await client.get(`/consulta/${registroAnvisa}`);
      const result = mapToMedicamento(data);
      setCache(cacheKey, result);
      return result;
    } catch {
      return null;
    }
  },

  async obterBula(
    registroAnvisa: string
  ): Promise<{ profissional: string | null; consumidor: string | null }> {
    try {
      const { data } = await client.get(`/consulta/${registroAnvisa}/pdf`);
      return {
        profissional: data.urlBulaProfissional || null,
        consumidor: data.urlBulaConsumidor || null, // Prioridade — escrita para quem não é médico
      };
    } catch {
      return { profissional: null, consumidor: null };
    }
  },

  async buscarPrecoCMED(
    registroAnvisa: string,
    uf: string
  ): Promise<number | null> {
    const med = await anvisaService.obterDetalhes(registroAnvisa);
    if (!med) return null;
    return med.precoMaximoConsumidor[uf] || null;
  },

  async verificarRecalls(): Promise<AlertaSaude[]> {
    const cacheKey = 'recalls';
    const cached = fromCache<AlertaSaude[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await client.get('/consulta/irregularidades');
      const alerts: AlertaSaude[] = (data.content || []).map((item: any) => ({
        id: item.id || String(Math.random()),
        tipo: 'Recall' as const,
        titulo: item.nomeProduto || 'Produto irregular',
        descricao: item.descricao || '',
        dataInicio: new Date(item.data || Date.now()),
        nivel: 'alerta' as const,
        acaoRecomendada: 'Não utilize este produto. Procure a farmácia onde comprou para devolução.',
      }));
      setCache(cacheKey, alerts);
      return alerts;
    } catch {
      return [];
    }
  },

  async buscarPorClasseTerapeutica(classe: string): Promise<Medicamento[]> {
    return anvisaService.buscarPorNome(classe).then((r) => r.items);
  },
};
