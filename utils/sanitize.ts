export const sanitize = {
  busca: (input: string): string => {
    return input
      .trim()
      .slice(0, 100)
      .replace(/[<>"'%;()&+]/g, '')
      .replace(/\s+/g, ' ');
  },

  cep: (cep: string): string => cep.replace(/\D/g, '').slice(0, 8),

  ean: (ean: string): string => ean.replace(/\D/g, '').slice(0, 13),

  validarCEP: (cep: string): boolean => /^\d{8}$/.test(sanitize.cep(cep)),

  validarEAN13: (ean: string): boolean => {
    const digits = ean.replace(/\D/g, '');
    if (digits.length !== 13) return false;
    const sum = digits
      .slice(0, 12)
      .split('')
      .reduce((acc, d, i) => acc + parseInt(d) * (i % 2 === 0 ? 1 : 3), 0);
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(digits[12]);
  },

  /** Arredonda coordenada GPS para 2 casas decimais antes de sair do device */
  coordenada: (valor: number): number => Math.round(valor * 100) / 100,
};
