import type { Medicamento } from '../types';

interface MensagemDireito {
  titulo: string;
  descricao: string;
  proximoPasso: string;
  icone: string;
}

// 100 medicamentos mais comuns do RENAME — fallback offline
const RENAME_OFFLINE: Record<string, { nivel: string; financiamento: string }> = {
  'metformina': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'losartana': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'atenolol': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'captopril': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'enalapril': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'hidroclorotiazida': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'anlodipino': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'sinvastatina': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'omeprazol': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'levotiroxina': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'fluoxetina': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'amitriptilina': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'haloperidol': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'carbamazepina': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'fenobarbital': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'salbutamol': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'beclometasona': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'sulfato ferroso': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'acido folico': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'ácido fólico': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'amoxicilina': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'azitromicina': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'ciprofloxacino': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'glibenclamida': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'insulina': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'levodopa': { nivel: 'Atenção Básica', financiamento: 'Municipal' },
  'donepezila': { nivel: 'Média Complexidade', financiamento: 'Estadual' },
  'metotrexato': { nivel: 'Média Complexidade', financiamento: 'Estadual' },
  'adalimumabe': { nivel: 'Alta Complexidade', financiamento: 'Federal' },
  'infliximabe': { nivel: 'Alta Complexidade', financiamento: 'Federal' },
  'imatinibe': { nivel: 'Alta Complexidade', financiamento: 'Federal' },
};

function normalizar(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const renameService = {
  async buscarNaRENAME(principioAtivo: string): Promise<{
    encontrado: boolean;
    nivel: string;
    financiamento: string;
    codigoRENAME: string;
  } | null> {
    const normPA = normalizar(principioAtivo);

    // Primeiro, tenta offline
    for (const [chave, valor] of Object.entries(RENAME_OFFLINE)) {
      if (normPA.includes(normalizar(chave)) || normalizar(chave).includes(normPA)) {
        return {
          encontrado: true,
          nivel: valor.nivel,
          financiamento: valor.financiamento,
          codigoRENAME: `RENAME-${chave.toUpperCase().replace(' ', '-')}`,
        };
      }
    }

    // Tenta API (pode falhar)
    try {
      const response = await fetch(
        `https://rename.saude.gov.br/api/medicamentos?principioAtivo=${encodeURIComponent(principioAtivo)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data?.length > 0) {
        return {
          encontrado: true,
          nivel: data[0].nivel || 'Atenção Básica',
          financiamento: data[0].financiamento || 'Municipal',
          codigoRENAME: data[0].codigo || '',
        };
      }
    } catch {
      // Silencia — offline já respondeu acima
    }

    return { encontrado: false, nivel: '', financiamento: '', codigoRENAME: '' };
  },

  getMensagemDireitoUsuario(medicamento: Medicamento): MensagemDireito {
    if (medicamento.gratuitoFarmaciaPopular) {
      return {
        icone: '✅',
        titulo: 'GRATUITO no Farmácia Popular',
        descricao: `${medicamento.nome} pode ser retirado sem pagar nada no Farmácia Popular. Apresente a receita médica e documento de identidade.`,
        proximoPasso: 'Encontre a farmácia participante mais próxima e retire de graça.',
      };
    }

    const nivel = medicamento.codigoRENAME ? 'Atenção Básica' : null;

    if (nivel === 'Atenção Básica') {
      return {
        icone: '🏥',
        titulo: 'Disponível GRATUITAMENTE na sua UBS',
        descricao: `${medicamento.nomeGenerico} está no RENAME — Relação Nacional de Medicamentos Essenciais. O SUS é obrigado por lei a fornecê-lo gratuitamente na UBS mais próxima.`,
        proximoPasso: 'Vá à UBS com sua receita médica. Não precisa pagar nada.',
      };
    }

    if (medicamento.subsidiadoFarmaciaPopular) {
      return {
        icone: '💙',
        titulo: `${medicamento.percentualDesconto || 90}% de desconto no Farmácia Popular`,
        descricao: `${medicamento.nome} tem desconto no Programa Farmácia Popular. Pague apenas ${100 - (medicamento.percentualDesconto || 90)}% do preço.`,
        proximoPasso: 'Leve a receita médica a uma farmácia participante do programa.',
      };
    }

    return {
      icone: 'ℹ️',
      titulo: 'Não disponível nos programas gratuitos',
      descricao: `${medicamento.nome} não consta no RENAME nem no Farmácia Popular.`,
      proximoPasso: 'Pergunte ao farmacêutico sobre a versão genérica — tem o mesmo efeito e custa menos.',
    };
  },

  verificarNivelAtencao(codigoRENAME: string): string {
    if (codigoRENAME.includes('BASICA')) return 'Atenção Básica';
    if (codigoRENAME.includes('MEDIA')) return 'Média Complexidade';
    if (codigoRENAME.includes('ALTA')) return 'Alta Complexidade';
    return 'Atenção Básica';
  },
};
