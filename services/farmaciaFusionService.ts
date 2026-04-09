import { EstabelecimentoSaude } from '../types';
import { getCacheFarmacias, setCacheFarmacias } from '../utils/farmaciaCache';
import { haversineKm } from '../utils/haversine';
import { buscarFarmaciasOSM } from './farmaciaOSMService';
import { cnesService } from './cnesService';
import { buscarFarmaciasPopular } from './farmaciaPopularService';

export async function buscarTodasFarmacias(
  lat: number,
  lon: number,
  raioKm = 10
): Promise<EstabelecimentoSaude[]> {

  // 1. Verifica cache local primeiro (que gerencia memória e storage)
  const cached = await getCacheFarmacias(lat, lon, raioKm);
  if (cached) return cached;

  // 2. Dispara as 3 fontes em paralelo — nenhuma falha quebra o app
  const [osmResult, cnesResult, fpResult] = await Promise.allSettled([
    buscarFarmaciasOSM(lat, lon, raioKm * 1000),
    cnesService.buscarFarmaciasCNES(lat, lon, raioKm),
    buscarFarmaciasPopular(lat, lon, raioKm),
  ]);

  const todas: EstabelecimentoSaude[] = [
    ...(osmResult.status === 'fulfilled' ? osmResult.value : []),
    ...(cnesResult.status === 'fulfilled' ? cnesResult.value : []),
    ...(fpResult.status === 'fulfilled' ? fpResult.value : []),
  ];

  // 3. Filtra coordenadas inválidas (Fora do Brasil ou (0,0))
  const validas = todas.filter(f =>
    f.coordenadas.lat !== 0 &&
    f.coordenadas.lon !== 0 &&
    f.coordenadas.lat > -34 && f.coordenadas.lat < 6 &&
    f.coordenadas.lon > -74 && f.coordenadas.lon < -33
  );

  // 4. Deduplica por proximidade (< 80 metros = mesma farmácia)
  const deduplicadas = deduplicarPorProximidade(validas, 0.08);

  // 5. Calcula distância final do usuário e ordena
  const comDistancia = deduplicadas.map(f => ({
    ...f,
    distanciaKm: haversineKm(lat, lon, f.coordenadas.lat, f.coordenadas.lon)
  }));

  const ordenadas = comDistancia
    .sort((a, b) => (a.distanciaKm ?? 99) - (b.distanciaKm ?? 99))
    .slice(0, 60);

  // 6. Salva no cache consolidado
  await setCacheFarmacias(lat, lon, raioKm, ordenadas);

  return ordenadas;
}

function deduplicarPorProximidade(farmacias: EstabelecimentoSaude[], raioKmLimiar: number): EstabelecimentoSaude[] {
  const usadas = new Set<number>();
  const resultado: EstabelecimentoSaude[] = [];

  for (let i = 0; i < farmacias.length; i++) {
    if (usadas.has(i)) continue;
    
    const grupo = [farmacias[i]];
    usadas.add(i);

    for (let j = i + 1; j < farmacias.length; j++) {
      if (usadas.has(j)) continue;
      const dist = haversineKm(
        farmacias[i].coordenadas.lat, farmacias[i].coordenadas.lon,
        farmacias[j].coordenadas.lat, farmacias[j].coordenadas.lon
      );
      if (dist < raioKmLimiar) {
        grupo.push(farmacias[j]);
        usadas.add(j);
      }
    }

    // Mescla grupo com prioridade oficial: cnes / fp > osm
    const base = grupo.find(f => f.fonte === 'cnes' || f.fonte === 'fp') || grupo[0];
    
    // Constrói a farmácia final fundindo dados dos itens redundantes (OSM é mestre em telefones/horarios)
    const fused: EstabelecimentoSaude = {
      ...base,
      telefone: base.telefone || grupo.find(f => f.telefone)?.telefone,
      horarioFuncionamento: base.horarioFuncionamento || grupo.find(f => f.horarioFuncionamento)?.horarioFuncionamento,
      horarioParsed: base.horarioParsed || grupo.find(f => f.horarioParsed)?.horarioParsed,
      // NomeFantasia/Brand fallback
      nome: base.nome || grupo.find(f => f.nome)?.nome || 'Farmácia',
      // Flag mais crítica do governo prevalece se ALGUM dos pontos redundantes a tiver (ex: o ponto FP mesclado com o ponto OSM)
      participaFarmaciaPopular: grupo.some(f => f.participaFarmaciaPopular),
      // Atende SUS se for originalmente de CNES
      atendeSUS: grupo.some(f => f.fonte === 'cnes'),
    };

    resultado.push(fused);
  }

  return resultado;
}
