/**
 * farmaciaCNESDataSUSService
 *
 * Usa a API gratuita de Dados Abertos do Ministério da Saúde (CNES) para buscar
 * TODAS as farmácias cadastradas num município — incluindo redes como Drogasil,
 * Pacheco, Raia, Minas Mais, Teixeira etc.
 *
 * Fluxo:
 *   1. Nominatim reverse geocode → nome da cidade + UF
 *   2. API Macrorregião/Saúde → código de município CNES (6 dígitos)
 *   3. API CNES /estabelecimentos (tipo=43, paginado) → lista de farmácias
 *   4. Filtra por raio e ordena por distância
 *
 * Sem custo, sem chave de API.
 */
import type { EstabelecimentoSaude } from '../types';
import { haversineKm } from '../utils/haversine';
import { API } from '../constants/api';

const CNES_DATASUS = 'https://apidadosabertos.saude.gov.br';
const TIPO_FARMACIA = 43;

// Cache em memória: chave = "lat2,lon2" → código município (6 dígitos)
const MUNICIPIO_CACHE = new Map<string, string>();
// Cache em memória: chave = código município → lista de farmácias
const FARMACIAS_CACHE = new Map<string, { data: EstabelecimentoSaude[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// ─────────────────────────────────────────────────────────────────────────────
// Passo 1 — Resolve código município a partir de coordenadas
// ─────────────────────────────────────────────────────────────────────────────
async function resolverCodigoMunicipio(lat: number, lon: number): Promise<string | null> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = MUNICIPIO_CACHE.get(cacheKey);
  if (cached) return cached;

  // Reverse geocode via Nominatim (já usamos em outros services)
  const revResp = await fetch(
    `${API.NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
    {
      headers: { 'User-Agent': API.NOMINATIM_USER_AGENT },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!revResp.ok) return null;
  const revData = await revResp.json();

  const cidade = (
    revData.address?.city ||
    revData.address?.town ||
    revData.address?.village ||
    revData.address?.municipality ||
    ''
  ).toUpperCase().trim();

  const uf: string = (
    revData.address?.state_code ||
    revData.address?.['ISO3166-2-lvl4']?.replace('BR-', '') ||
    ''
  ).toUpperCase().trim();

  if (!cidade || !uf) return null;

  // Consulta tabela de macrorregião para obter o código CNES de 6 dígitos
  const regResp = await fetch(
    `${CNES_DATASUS}/macrorregiao-e-regiao-de-saude/municipio?municipio=${encodeURIComponent(cidade)}&sigla_uf=${uf}&limit=5`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!regResp.ok) return null;
  const regData = await regResp.json();

  const codigo: string | null =
    regData.macrorregiao_regiao_saude_municipios?.[0]?.codigo_municipio ?? null;

  if (codigo) MUNICIPIO_CACHE.set(cacheKey, String(codigo));
  return codigo ? String(codigo) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Passo 2 — Busca todas as farmácias do município (paginação automática)
// ─────────────────────────────────────────────────────────────────────────────
async function buscarFarmaciasNaMunicipalidade(
  codigoMunicipio: string
): Promise<EstabelecimentoSaude[]> {
  const cached = FARMACIAS_CACHE.get(codigoMunicipio);
  if (cached && cached.data.length > 0 && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const todas: EstabelecimentoSaude[] = [];
  let offset = 0;

  while (true) {
    let resp: Response;
    try {
      resp = await fetch(
        `${CNES_DATASUS}/cnes/estabelecimentos` +
          `?codigo_tipo_unidade=${TIPO_FARMACIA}` +
          `&codigo_municipio=${codigoMunicipio}` +
          `&status=1` +
          `&limit=20&offset=${offset}`,
        { signal: AbortSignal.timeout(15000) }
      );
    } catch {
      break;
    }
    if (!resp.ok) break;

    const data = await resp.json();
    const batch: any[] = data.estabelecimentos ?? [];
    if (batch.length === 0) break;

    for (const e of batch) {
      const eLat: number | null = e.latitude_estabelecimento_decimo_grau;
      const eLon: number | null = e.longitude_estabelecimento_decimo_grau;
      if (!eLat || !eLon) continue;

      const turno: string | undefined = e.descricao_turno_atendimento || undefined;

      todas.push({
        id: `cnes-${e.codigo_cnes}`,
        cnes: String(e.codigo_cnes),
        nome: (e.nome_fantasia || e.nome_razao_social || 'Farmácia').trim(),
        tipo: 'Farmacia',
        endereco: {
          logradouro: e.endereco_estabelecimento || '',
          numero: e.numero_estabelecimento || '',
          bairro: e.bairro_estabelecimento || '',
          municipio: '',
          uf: '',
          cep: e.codigo_cep_estabelecimento || '',
        },
        coordenadas: { lat: eLat, lon: eLon },
        telefone: e.numero_telefone_estabelecimento || undefined,
        horarioFuncionamento: turno,
        funcionamento24h: false,
        atendeSUS: e.estabelecimento_faz_atendimento_ambulatorial_sus === 'SIM',
        fonte: 'cnes',
      });
    }

    // API retorna no máximo 20 por página — se vier menos, acabou
    if (batch.length < 20) break;
    offset += 20;
  }

  if (todas.length > 0) {
    FARMACIAS_CACHE.set(codigoMunicipio, { data: todas, ts: Date.now() });
  }

  return todas;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exportação pública
// ─────────────────────────────────────────────────────────────────────────────
export async function buscarFarmaciasDataSUS(
  lat: number,
  lon: number,
  raioKm = 15
): Promise<EstabelecimentoSaude[]> {
  try {
    const codigoMunicipio = await resolverCodigoMunicipio(lat, lon);
    if (!codigoMunicipio) return [];

    const todas = await buscarFarmaciasNaMunicipalidade(codigoMunicipio);

    // Filtra por raio e ordena por distância
    return todas
      .map((e) => ({
        ...e,
        distanciaKm: haversineKm(lat, lon, e.coordenadas.lat, e.coordenadas.lon),
      }))
      .filter((e) => e.distanciaKm! <= raioKm)
      .sort((a, b) => a.distanciaKm! - b.distanciaKm!);
  } catch {
    return [];
  }
}
