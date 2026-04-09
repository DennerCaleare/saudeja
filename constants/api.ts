export const API = {
  // ANVISA — "esse remédio é legítimo?"
  ANVISA_BASE: 'https://consultas.anvisa.gov.br/api',
  ANVISA_MEDICAMENTOS: 'https://consultas.anvisa.gov.br/api/consulta/medicamentos',
  ANVISA_BULARIO: 'https://consultas.anvisa.gov.br/api/consulta',

  // Farmácia Popular — "esse remédio é de graça?"
  CNES_BASE: 'https://cnes.datasus.gov.br/services',
  FARMACIA_POPULAR_LISTA: 'https://www.consultaremedios.com.br/farmacia-popular/medicamentos',

  // BrasilAPI
  BRASIL_API: 'https://brasilapi.com.br/api',

  // OpenStreetMap
  NOMINATIM: 'https://nominatim.openstreetmap.org',
  NOMINATIM_USER_AGENT: 'SaúdeJá/1.0 (contato@saudeja.app)',

  // SI-PNI / Vacinação — "a vacina do meu filho está atrasada?"
  SIPNI_BASE: 'https://apidadosabertos.saude.gov.br/v1',

  // OpenDataSUS — "tem surto de dengue na minha rua?"
  OPENDATASUS: 'https://opendatasus.saude.gov.br/api/3/action',

  // BPS — Banco de Preços em Saúde
  BPS_BASE: 'https://bps.saude.gov.br/rest',

  // RENAME
  RENAME_BASE: 'https://rename.saude.gov.br/api',
} as const;
