import { HorarioFarmacia } from '../types';

function toMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function diaEstaNoRange(diasStr: string, diaSemanaAtual: number, diasDaSemanaMap: Record<string, number>): boolean {
  // Trata casos simples "Mo-Fr", múltiplos fragmentos separados por vírgula "Mo,We,Fr"
  const fragments = diasStr.split(',');
  
  for (const part of fragments) {
    if (part.includes('-')) {
      // Range "Mo-Fr"
      const [start, end] = part.split('-');
      const startIndex = diasDaSemanaMap[start];
      const endIndex = diasDaSemanaMap[end];
      if (startIndex === undefined || endIndex === undefined) continue;
      
      // Avalia de forma ciclica se necessário, ex: Su-Tu = 0, 1, 2
      let cur = startIndex;
      while (true) {
        if (cur === diaSemanaAtual) return true;
        if (cur === endIndex) break;
        cur = (cur + 1) % 7;
      }
    } else {
      // Único "Mo"
      if (diasDaSemanaMap[part] === diaSemanaAtual) return true;
    }
  }
  return false;
}

export function parsearHorarioOSM(raw: string | null | undefined): HorarioFarmacia {
  if (!raw) return { abertaAgora: null, textoHoje: 'Consulte a farmácia', funcionamento24h: false };
  if (raw === '24/7') return { abertaAgora: true, textoHoje: 'Aberta 24 horas', funcionamento24h: true };

  const diasOSM: Record<string, number> = {
    Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0
  };

  const agora = new Date();
  const diaSemanaAtual = agora.getDay();        // 0=dom, 1=seg...
  const horaAtual = agora.getHours() * 60 + agora.getMinutes();

  // Parseia cada regra separada por ";" e lida com espaços em excesso
  const regras = raw.split(';').map(r => r.trim()).filter(Boolean);

  let achouRegraDia = false;
  let regraFormatadaParaHoje = '';
  let statusAbertaAqui = false;

  for (const regra of regras) {
    // Tenta extrair dias e horário (ex: "Mo-Fr 08:00-22:00")
    // Note: Suporta "Mo-Sa 08:00-18:00" e "Mo,We 10:00-12:00"
    const match = regra.match(/^([A-Za-z,-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!match) {
      // Regras soltas como "Su off"
      const matchOff = regra.match(/^([A-Za-z,-]+)\s+off$/i);
      if (matchOff && diaEstaNoRange(matchOff[1], diaSemanaAtual, diasOSM)) {
         return { abertaAgora: false, textoHoje: 'Fechada hoje', funcionamento24h: false };
      }
      continue;
    }

    const [, dias, inicio, fim] = match;
    const minutosInicio = toMinutos(inicio);
    const minutosFim = toMinutos(fim);

    // Verifica se hoje está no range de dias
    if (diaEstaNoRange(dias, diaSemanaAtual, diasOSM)) {
      achouRegraDia = true;
      const aberta = horaAtual >= minutosInicio && horaAtual < minutosFim;
      
      // Pode haver multiplos turnos para o mesmo dia (ex: 08:00-12:00, 14:00-18:00), junta eles.
      if (aberta) statusAbertaAqui = true;
      
      if (regraFormatadaParaHoje) regraFormatadaParaHoje += ` e ${inicio}-${fim}`;
      else regraFormatadaParaHoje = `${inicio} - ${fim}`;
    }
  }

  if (achouRegraDia) {
    return {
      abertaAgora: statusAbertaAqui,
      textoHoje: regraFormatadaParaHoje,
      funcionamento24h: false,
    };
  }

  return { abertaAgora: false, textoHoje: 'Fechada hoje', funcionamento24h: false };
}
