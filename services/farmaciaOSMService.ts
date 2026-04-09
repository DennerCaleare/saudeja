import { EstabelecimentoSaude } from '../types';
import { parsearHorarioOSM } from '../utils/openingHours';

export async function buscarFarmaciasOSM(lat: number, lon: number, raioM: number): Promise<EstabelecimentoSaude[]> {
  const query = `[out:json][timeout:30];
(
  node["amenity"="pharmacy"](around:${raioM},${lat},${lon});
  way["amenity"="pharmacy"](around:${raioM},${lat},${lon});
  node["shop"="chemist"](around:${raioM},${lat},${lon});
  way["shop"="chemist"](around:${raioM},${lat},${lon});
  node["healthcare"="pharmacy"](around:${raioM},${lat},${lon});
  way["healthcare"="pharmacy"](around:${raioM},${lat},${lon});
);
out center tags;`;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'User-Agent': 'SaudeJaApp/1.0 (contato@saudeja.app)',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) return [];

    const json = await response.json();
    const elements = json.elements || [];

    return elements.map((el: any) => {
      const tags = el.tags || {};
      const elLat = el.type === 'node' ? el.lat : el.center?.lat;
      const elLon = el.type === 'node' ? el.lon : el.center?.lon;
      
      const rawNome = tags.name || tags['name:pt'] || tags.brand || 'Farmácia';
      const cleanNome = rawNome.replace(/['"]/g, ''); // Evitar quebra no leaflet injection
      
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
  } catch (error) {
    console.error('Erro na API OSM:', error);
    return [];
  }
}
