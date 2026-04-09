/**
 * useResponsive — Hook central de responsividade do SaúdeJá
 *
 * Filosofia:
 * - Mobile first (< 480px): tamanhos base
 * - Tablet (480-768px): grid de 2 colunas, fontes levemente maiores
 * - Web (> 768px): limita largura em 480px centrado, mantém aparência de app
 *
 * Uso:
 *   const { w, h, isTablet, isWeb, scaleFont, hp } = useResponsive();
 */
import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'sm' | 'md' | 'lg';

export function useResponsive() {
  const { width: w, height: h } = useWindowDimensions();

  const isSmall = w < 360;           // Celular pequeno (Moto E, Galaxy A03)
  const isMobile = w < 480;          // Celular padrão
  const isTablet = w >= 480 && w < 900;
  const isWeb = w >= 900;

  /**
   * Escala uma fonte proporcionalmente à janela,
   * respeitando limites min/max para legibilidade.
   */
  function scaleFont(base: number, min?: number, max?: number): number {
    // Em mobile, comprime levemente em telas muito pequenas
    const scale = isSmall ? 0.88 : isMobile ? 1 : isTablet ? 1.04 : 1.06;
    const scaled = Math.round(base * scale);
    if (min !== undefined && scaled < min) return min;
    if (max !== undefined && scaled > max) return max;
    return scaled;
  }

  /**
   * Padding horizontal adaptativo — mais espaço em tablet/web
   */
  const px = isSmall ? 16 : isMobile ? 24 : isTablet ? 32 : 40;

  /**
   * Largura do container principal (para web: limitado em 480px)
   * Garante que o app nunca fique com visual "esticado"
   */
  const contentWidth = isWeb ? Math.min(w, 480) : w;

  /**
   * Número de colunas para grids (bento, lista de medicamentos)
   */
  const cols = isTablet || isWeb ? 2 : 1;
  const bentoCols = isSmall ? 2 : 2; // sempre 2 no bento mobile

  /**
   * Espaçamento adaptativo
   */
  const gap = isSmall ? 8 : 12;

  return {
    w,           // largura real da janela
    h,           // altura real da janela
    contentWidth, // largura útil do conteúdo
    px,           // padding horizontal padrão
    gap,
    cols,
    bentoCols,
    isSmall,
    isMobile,
    isTablet,
    isWeb,
    scaleFont,
  };
}
