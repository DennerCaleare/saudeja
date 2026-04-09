/**
 * farmaciaGooglePlacesService
 *
 * Usa a Google Places API (New) — Nearby Search — para buscar farmácias
 * comerciais que não estão no OpenStreetMap (Drogasil, Raia, Pacheco etc.).
 *
 * COMO ATIVAR:
 * 1. Crie um projeto em https://console.cloud.google.com
 * 2. Ative "Places API (New)"
 * 3. Gere uma API Key e adicione em constants/api.ts → GOOGLE_PLACES_API_KEY
 * 4. Restrinja a key ao seu domínio/bundle ID no painel do Google Cloud
 *
 * Sem a key → retorna [] silenciosamente (OSM continua funcionando).
 */
import type { EstabelecimentoSaude } from '../types';
import { haversineKm } from '../utils/haversine';
import { API } from '../constants/api';

const CACHE = new Map<string, { data: EstabelecimentoSaude[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function buscarFarmaciasGooglePlaces(
  lat: number,
  lon: number,
  raioM = 15000
): Promise<EstabelecimentoSaude[]> {
  if (!API.GOOGLE_PLACES_API_KEY) return [];

  const cacheKey = `gp:${lat.toFixed(2)}:${lon.toFixed(2)}:${raioM}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.data.length > 0 && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API.GOOGLE_PLACES_API_KEY,
        // Solicita apenas campos necessários — reduz custo de billing
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.shortFormattedAddress',
          'places.location',
          'places.regularOpeningHours',
          'places.currentOpeningHours',
          'places.internationalPhoneNumber',
          'places.nationalPhoneNumber',
        ].join(','),
      },
      body: JSON.stringify({
        // Google reconhece farmácias e drogarias pelos tipos abaixo
        includedTypes: ['pharmacy', 'drugstore'],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lon },
            radius: raioM,
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (!resp.ok) return [];

    const data = await resp.json();
    const places: any[] = data.places || [];

    const farmacias: EstabelecimentoSaude[] = places.map((p) => {
      const plat = p.location?.latitude ?? 0;
      const plon = p.location?.longitude ?? 0;
      const nome = (p.displayName?.text || 'Farmácia').replace(/['"]/g, '');

      // Horário: usa descrição textual do Google (ex: "Segunda: 09:00–22:00")
      const horarioTexto: string | undefined =
        p.currentOpeningHours?.weekdayDescriptions?.[0] ??
        p.regularOpeningHours?.weekdayDescriptions?.[0] ??
        undefined;

      // 24/7: qualquer período sem hora de fechamento na segunda-feira
      const is24h = p.regularOpeningHours?.periods?.some(
        (period: any) =>
          period.open?.day === 0 &&
          period.open?.hour === 0 &&
          period.open?.minute === 0 &&
          !period.close
      ) ?? false;

      // Aberta agora via Google
      const abertaAgora: boolean | null =
        p.currentOpeningHours?.openNow != null
          ? p.currentOpeningHours.openNow
          : p.regularOpeningHours?.openNow != null
          ? p.regularOpeningHours.openNow
          : null;

      return {
        id: `gp_${p.id}`,
        cnes: '',
        nome,
        tipo: 'Farmacia' as const,
        endereco: {
          logradouro: p.shortFormattedAddress || p.formattedAddress || '',
          numero: '',
          bairro: '',
          municipio: '',
          uf: '',
          cep: '',
        },
        coordenadas: { lat: plat, lon: plon },
        telefone: p.internationalPhoneNumber || p.nationalPhoneNumber,
        horarioFuncionamento: horarioTexto,
        horarioParsed: horarioTexto
          ? { abertaAgora, textoHoje: horarioTexto, funcionamento24h: is24h }
          : undefined,
        funcionamento24h: is24h,
        atendeSUS: false,
        participaFarmaciaPopular: false,
        fonte: 'gp' as const,
        distanciaKm: haversineKm(lat, lon, plat, plon),
      };
    });

    CACHE.set(cacheKey, { data: farmacias, ts: Date.now() });
    return farmacias;
  } catch {
    return [];
  }
}
