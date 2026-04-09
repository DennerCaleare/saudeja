/**
 * ScreenContainer — wrapper responsivo para todas as telas
 *
 * Em mobile: sem efeito (ocupa 100%)
 * Em web/tablet: centraliza o conteúdo em até 480px
 * com fundo levemente escurecido nas laterais para manter aparência de app
 */
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  /** Se true, não aplica padding horizontal interno */
  noPadding?: boolean;
}

export function ScreenContainer({ children, noPadding }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 640; // tablet + web

  if (!isWide) {
    return <View style={styles.base}>{children}</View>;
  }

  return (
    <View style={styles.webBg}>
      <View style={[styles.content, noPadding && styles.noPad]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
  webBg: {
    flex: 1,
    backgroundColor: '#d6dbd6', // cinza levemente esverdeado nas laterais
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.background,
    // Sombra lateral para "app card" no web
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  noPad: {},
});
