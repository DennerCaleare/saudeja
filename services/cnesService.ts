/**
 * cnesService — Busca estabelecimentos de saúde próximos via OSM Overpass
 *
 * Estratégia robusta:
 * 1. Busca em TODOS os mirrors em PARALELO (Promise.any) — pega o mais rápido
 * 2. Timeout curto por mirror (8s) — falha rápido para não bloquear UX
 * 3. Fallback mínimo local se todos falharem
 */
import type { EstabelecimentoSaude } from '../types';
import { haversineKm } from '../utils/haversine';
import { geocodeQueue } from '../utils/geocodeQueue';
import { parsearHorarioOSM } from '../utils/openingHours';

const CACHE: Map<string, { data: EstabelecimentoSaude[]; ts: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Mirrors do Overpass — busca em PARALELO, pega o primeiro que responder
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

// Mapeamento OSM completo — inclui TODOS os tipos de tag usados para farmácias no Brasil
// amenity=pharmacy: tag principal
// shop=chemist: farmácias tipo drogaria/herbal no OSM
// shop=drugstore: farmácias estilo drugstore
// healthcare=pharmacy: tag alternativa
const TODOS_TIPOS = [
  // ── Farmácias (múltiplas tags para máxima cobertura) ──────────────────
  { amenity: 'pharmacy',    tag: 'amenity', tipo: 'Farmacia' as const },
  // ── Postos SUS ────────────────────────────────────────────────────────
  { amenity: 'clinic',      tag: 'amenity', tipo: 'UBS'      as const },
  { amenity: 'doctors',     tag: 'amenity', tipo: 'UBS'      as const },
  { amenity: 'health_post', tag: 'amenity', tipo: 'UBS'      as const },
  // ── Hospital / UPA ───────────────────────────────────────────────────
  { amenity: 'hospital',    tag: 'amenity', tipo: 'UPA'      as const },
  // ── Saúde Mental ─────────────────────────────────────────────────────
  { amenity: 'mental_health', tag: 'amenity', tipo: 'CAPS'   as const },
];

// Fallback mínimo — só usado se TODOS os mirrors falharem
// Não hardcodeia dados: gera pontos ao redor da localização do usuário
function fallbackMinimo(lat: number, lon: number): EstabelecimentoSaude[] {
  return [
    {
      id: 'fb-aviso',
      cnes: '',
      nome: 'Serviço indisponível no momento',
      tipo: 'UBS',
      endereco: { logradouro: 'Verifique sua conexão', numero: '', bairro: '', municipio: '', uf: '', cep: '' },
      coordenadas: { lat, lon },
      funcionamento24h: false,
      atendeSUS: false,
      distanciaKm: 0,
    },
  ];
}

function mapOSMNode(
  node: any,
  tipoOverride: EstabelecimentoSaude['tipo'],
  userLat: number,
  userLon: number
): EstabelecimentoSaude {
  const lat = node.lat ?? node.center?.lat ?? 0;
  const lon = node.lon ?? node.center?.lon ?? 0;
  const hours = node.tags?.opening_hours;
  const nome = node.tags?.name || node.tags?.['name:pt'] || 'Estabelecimento de Saúde';

  // Heurística: se o nome contiver UPA, reclassifica
  const tipoFinal: EstabelecimentoSaude['tipo'] =
    tipoOverride === 'UPA' && /UBS|posto|saúde|clinica|ESF|PSF/i.test(nome)
      ? 'UBS'
      : tipoOverride === 'UPA' && /farmácia|drogaria|farmacia/i.test(nome)
      ? 'Farmacia'
      : tipoOverride;

  return {
    id: String(node.id),
    cnes: '',
    nome,
    tipo: tipoFinal,
    endereco: {
      logradouro: node.tags?.['addr:street'] || node.tags?.['addr:full'] || '',
      numero: node.tags?.['addr:housenumber'] || 's/n',
      bairro: node.tags?.['addr:suburb'] || node.tags?.['addr:neighbourhood'] || '',
      municipio: node.tags?.['addr:city'] || '',
      uf: node.tags?.['addr:state'] || '',
      cep: node.tags?.['addr:postcode'] || '',
    },
    coordenadas: { lat, lon },
    telefone: node.tags?.phone || node.tags?.['contact:phone'],
    horarioFuncionamento: hours && hours !== '24/7' ? hours : undefined,
    horarioParsed: parsearHorarioOSM(hours),
    funcionamento24h: hours === '24/7',
    atendeSUS: tipoFinal === 'UBS' || tipoFinal === 'UPA',
    fonte: 'osm' as const,
    distanciaKm: haversineKm(userLat, userLon, lat, lon),
  };
}

/** Tenta UM mirror com timeout — retorna null em falha */
async function tentarMirror(
  mirror: string,
  query: string,
  userLat: number,
  userLon: number,
  timeoutMs = 30000  // cliente > servidor (25s) para never abortar antes da resposta
): Promise<EstabelecimentoSaude[] | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(mirror, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const json = await resp.json();
    const elements: any[] = json.elements || [];
    if (elements.length === 0) return null;
    return elements.map((el) => {
      const amenity = el.tags?.amenity || '';
      const shop    = el.tags?.shop    || '';
      const healthcare = el.tags?.healthcare || '';
      // Classifica o tipo pelo contexto
      let tipo: EstabelecimentoSaude['tipo'] = 'UPA';
      if (amenity === 'pharmacy' || shop === 'chemist' || shop === 'drugstore' || healthcare === 'pharmacy') tipo = 'Farmacia';
      else if (amenity === 'clinic' || amenity === 'doctors' || amenity === 'health_post') tipo = 'UBS';
      else if (amenity === 'mental_health') tipo = 'CAPS';
      else if (amenity === 'hospital') tipo = 'UPA';
      return mapOSMNode(el, tipo, userLat, userLon);
    });
  } catch {
    return null;
  }
}

/** Busca em todos os mirrors em PARALELO — usa o primeiro que responder com dados */
async function buscarOSM(
  lat: number,
  lon: number,
  tiposQuery: { amenity: string; tag: string; tipo: EstabelecimentoSaude['tipo'] }[],
  raioM = 15000,
  tipoOriginal?: EstabelecimentoSaude['tipo']
): Promise<EstabelecimentoSaude[]> {
  if (tiposQuery.length === 0) return [];

  // Gera tags OSM dinamicamente a partir dos 'amenities' fornecidos no map
  const amenityTags = tiposQuery
    .map(
      (t) =>
        `node["amenity"="${t.amenity}"](around:${raioM},${lat},${lon});` +
        `way["amenity"="${t.amenity}"](around:${raioM},${lat},${lon});`
    )
    .join('');

  // SÓ adiciona as variações de farmácia se quisermos "Farmacia" explicitamente ou "TODOS"
  const desejaFarmacia = !tipoOriginal || tipoOriginal === 'Farmacia';
  const farmTags = desejaFarmacia
    ? `node["shop"="chemist"](around:${raioM},${lat},${lon});` +
      `way["shop"="chemist"](around:${raioM},${lat},${lon});` +
      `node["shop"="drugstore"](around:${raioM},${lat},${lon});` +
      `way["shop"="drugstore"](around:${raioM},${lat},${lon});` +
      `node["healthcare"="pharmacy"](around:${raioM},${lat},${lon});` +
      `way["healthcare"="pharmacy"](around:${raioM},${lat},${lon});`
    : '';

  const query = `[out:json][timeout:25];(${amenityTags}${farmTags});out center tags;`;

  // Lança TODOS os mirrors em paralelo — pega o primeiro com resultado real
  const promessas = OVERPASS_MIRRORS.map((m) =>
    tentarMirror(m, query, lat, lon, 30000).then((res) => {
      if (!res || res.length === 0) throw new Error('vazio');
      return res;
    })
  );

  try {
    return await Promise.any(promessas);
  } catch {
    return []; // Todos falharam
  }
}

export const cnesService = {
  async buscarEstabelecimentosProximos(
    lat: number,
    lon: number,
    tipo?: EstabelecimentoSaude['tipo'],
    raioKm = 15 // Raio padrão aumentado para 15km
  ): Promise<EstabelecimentoSaude[]> {
    const cacheKey = `estab:${lat.toFixed(2)}:${lon.toFixed(2)}:${tipo ?? 'all'}:${raioKm}`;
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

    const tiposQuery = tipo === 'UPA'
      ? [{ amenity: 'hospital', tag: 'amenity', tipo: 'UPA' as const }]
      : tipo
      ? TODOS_TIPOS.filter((t) => t.tipo === tipo)
      : TODOS_TIPOS;

    const resultados = await buscarOSM(lat, lon, tiposQuery, raioKm * 1000, tipo);
    // Não cacheia resultado vazio/fallback — próxima chamada tentará novamente
    if (resultados.length === 0) return fallbackMinimo(lat, lon);
    const itens = resultados.sort((a, b) => (a.distanciaKm ?? 99) - (b.distanciaKm ?? 99));
    CACHE.set(cacheKey, { data: itens, ts: Date.now() });
    return itens;
  },

  async buscarUBSProximas(lat: number, lon: number): Promise<EstabelecimentoSaude[]> {
    return cnesService.buscarEstabelecimentosProximos(lat, lon, 'UBS');
  },

  async buscarUPAMaisProxima(lat: number, lon: number): Promise<EstabelecimentoSaude | null> {
    try {
      const items = await cnesService.buscarEstabelecimentosProximos(lat, lon, 'UPA', 20);
      // Filtra pelo nome para pegar UPA real (não qualquer hospital)
      const upa = items.find(i => /UPA|urgência|pronto.socorro/i.test(i.nome)) ?? items[0] ?? null;
      return upa;
    } catch {
      return null;
    }
  },

  async buscarHospitais(lat: number, lon: number): Promise<EstabelecimentoSaude[]> {
    return cnesService.buscarEstabelecimentosProximos(lat, lon, 'Hospital');
  },

  limparCache() {
    CACHE.clear();
  },

  // ===== NOVA IMPLEMENTAÇÃO PÚBLICA (FARMÁCIAS SUS) =====
  async buscarFarmaciasCNES(lat: number, lon: number, raioKm: number = 15): Promise<EstabelecimentoSaude[]> {
    try {
      // API Datasus (Padrão) - Requer apenas User-Agent para evitar WAF drop
      const url = `https://cnes.datasus.gov.br/services/estabelecimentos?lat=${lat}&lng=${lon}&distanciaKm=${raioKm}&tipoEstabelecimento=FARMACIA`;
      
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SaudeJaApp/1.0 (contato@saudeja.app)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!response.ok) return [];

      const data = await response.json();
      if (!Array.isArray(data)) return [];

      const farmacias: EstabelecimentoSaude[] = [];

      for (const item of data) {
        // Se a API CNES não retornar lat/lon, jogamos pra geocodeQueue
        let elLat = item.lat || 0;
        let elLon = item.lng || item.lon || 0;

        if ((!elLat || !elLon) && item.endereco && item.municipioStr && item.ufStr) {
          const coords = await geocodeQueue.geocodificar(item.endereco, item.municipioStr, item.ufStr);
          if (coords) {
            elLat = coords.lat;
            elLon = coords.lon;
          }
        }

        farmacias.push({
          id: `cnes_${item.cnes}`,
          cnes: item.cnes,
          nome: item.nomeFantasia || item.razaoSocial || item.nome || 'Farmácia Pública',
          tipo: 'Farmacia',
          endereco: {
            logradouro: item.endereco || '',
            numero: item.numero || 'S/N',
            bairro: item.bairro || '',
            municipio: item.municipioStr || '',
            uf: item.ufStr || '',
            cep: item.cep || '',
          },
          coordenadas: {
            lat: Number(elLat),
            lon: Number(elLon)
          },
          telefone: item.telefone || undefined,
          funcionamento24h: false,
          atendeSUS: true, // É da rede pública/CNES
          participaFarmaciaPopular: false, // Pode ser mesclado depois em fusion
          fonte: 'cnes',
        });
      }

      return farmacias;
    } catch (e) {
      console.warn('Erro ao buscar farmácias do CNES:', e);
      return [];
    }
  }
};
