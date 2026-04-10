import { EstabelecimentoSaude } from '../types';
import { geocodeQueue } from '../utils/geocodeQueue';

export async function buscarFarmaciasPopular(lat: number, lon: number, raioKm: number = 15): Promise<EstabelecimentoSaude[]> {
  try {
    const url = `https://cnes.datasus.gov.br/services/estabelecimentos-farmaciapopular?lat=${lat}&lng=${lon}&distanciaKm=${raioKm}`;
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PoupaRemedioApp/1.0 (contato@pouparemedio.app),'
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
      // Algumas farmácias não vêm com LAT LON da API de Farmácia Popular
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
        id: `fp_${item.cnes}`,
        cnes: item.cnes,
        nome: item.nomeFantasia || item.razaoSocial || item.nome || 'Farmácia Popular',
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
        atendeSUS: true, // Subsídio governamental
        participaFarmaciaPopular: true, // Tag que colore o Pin de verdinho
        fonte: 'fp',
      });
    }

    return farmacias;
  } catch (e) {
    console.warn('Erro ao buscar farmácias do governo (Farmácia Popular):', e);
    return [];
  }
}
