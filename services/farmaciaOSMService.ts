import { EstabelecimentoSaude } from '../types';
import { parsearHorarioOSM } from '../utils/openingHours';

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

async function fetchMirror(mirror: string, query: string, timeoutMs = 12000): Promise<any[] | null> {
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
    const el: any[] = json.elements || [];
    return el.length > 0 ? el : null;
  } catch {
    return null;
  }
}

export async function buscarFarmaciasOSM(lat: number, lon: number, raioM: number): Promise<EstabelecimentoSaude[]> {
  const query = `[out:json][timeout:15];
(
  node["amenity"="pharmacy"](around:${raioM},${lat},${lon});
  way["amenity"="pharmacy"](around:${raioM},${lat},${lon});
  node["shop"="chemist"](around:${raioM},${lat},${lon});
  way["shop"="chemist"](around:${raioM},${lat},${lon});
  node["healthcare"="pharmacy"](around:${raioM},${lat},${lon});
  way["healthcare"="pharmacy"](around:${raioM},${lat},${lon});
);
out center tags;`;

  let elements: any[] = [];
  try {
    elements = await Promise.any(
      OVERPASS_MIRRORS.map(m => fetchMirror(m, query).then(r => { if (!r) throw new Error('vazio'); return r; }))
    );
  } catch {
    return [];
  }

    return elements.map((el: any) => {
      const tags = el.tags || {};
      const elLat = el.type === 'node' ? el.lat : el.center?.lat;
      const elLon = el.type === 'node' ? el.lon : el.center?.lon;

      const rawNome = tags.name || tags['name:pt'] || tags.brand || 'Farmácia';
      const cleanNome = rawNome.replace(/['"]/g, '');

      const rawHorario = tags.opening_hours;

      return {
        id: `osm_${el.id}`,
        cnes: '',
        nome: cleanNome,
        tipo: 'Farmacia' as const,
        endereco: {
          logradouro: tags['addr:street'] || '',
          numero: tags['addr:housenumber'] || 'S/N',
          bairro: tags['addr:suburb'] || tags['addr:neighbourhood'] || '',
          municipio: tags['addr:city'] || tags['addr:town'] || '',
          uf: tags['addr:state'] || '',
          cep: tags['addr:postcode'] || '',
        },
        coordenadas: {
          lat: elLat ?? 0,
          lon: elLon ?? 0,
        },
        telefone: tags.phone || tags['contact:phone'] || tags['contact:mobile'],
        horarioFuncionamento: rawHorario,
        horarioParsed: parsearHorarioOSM(rawHorario),
        funcionamento24h: rawHorario === '24/7',
        atendeSUS: false,
        participaFarmaciaPopular: false,
        fonte: 'osm' as const,
      };
    });
}
