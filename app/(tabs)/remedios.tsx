import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, StatusBar, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { medicamentosDB, type MedicamentoLocal } from '../../data/medicamentosDB';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useResponsive } from '../../hooks/useResponsive';

const CHIPS_RAPIDOS = [
  { label: 'Pressão Alta', busca: 'hipertensão' },
  { label: 'Diabetes', busca: 'diabetes' },
  { label: 'Colesterol', busca: 'colesterol' },
  { label: 'Depressão', busca: 'depressão' },
  { label: 'Tireoide', busca: 'tireoide' },
  { label: 'Asma', busca: 'asma' },
  { label: 'Antibiótico', busca: 'antibiótico' },
];

export default function RemediosScreen() {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<MedicamentoLocal[]>([]);
  const [mostrandoTodos, setMostrandoTodos] = useState(false);
  const { scaleFont, px } = useResponsive();

  // Ao abrir a tela — mostra os mais populares
  useFocusEffect(
    useCallback(() => {
      if (!busca) {
        setResultados(medicamentosDB.listarGratuitos().slice(0, 8));
        setMostrandoTodos(false);
      }
    }, [busca])
  );

  function pesquisar(termo: string) {
    setBusca(termo);
    if (!termo.trim()) {
      setResultados(medicamentosDB.listarGratuitos().slice(0, 8));
      setMostrandoTodos(false);
      return;
    }
    const found = medicamentosDB.buscar(termo);
    setResultados(found);
    setMostrandoTodos(false);
  }

  function usarChip(busca: string) {
    pesquisar(busca);
  }

  function verTodos() {
    setResultados(medicamentosDB.listarGratuitos());
    setMostrandoTodos(true);
  }

  const buscouMasNadaEncontrado = busca.trim().length > 1 && resultados.length === 0;

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: px }]}>
          <Text style={styles.headerSub}>Farmácia Popular / SUS</Text>
          <Text style={[styles.headerTitle, { fontSize: scaleFont(32, 26, 36) }]}>O que você precisa?</Text>
        </View>

        {/* Campo de busca */}
        <View style={[styles.searchWrapper, { paddingHorizontal: px }]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Busque por nome ou doença..."
              placeholderTextColor={colors.outline}
              value={busca}
              onChangeText={pesquisar}
              autoCorrect={false}
              returnKeyType="search"
            />
            {busca.length > 0 && (
              <TouchableOpacity onPress={() => pesquisar('')}>
                <Ionicons name="close-circle" size={20} color={colors.outline} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Chips de atalho */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipsContainer, { paddingLeft: px, paddingRight: px }]}
        >
          {CHIPS_RAPIDOS.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={[styles.chip, busca === c.busca && styles.chipActive]}
              onPress={() => usarChip(c.busca)}
            >
              <Text style={[styles.chipText, busca === c.busca && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Aviso nada encontrado */}
        {buscouMasNadaEncontrado && (
          <View style={styles.semResultados}>
            <Text style={styles.semResultadosEmoji}>🔍</Text>
            <Text style={styles.semResultadosTitulo}>Não encontramos "{busca}"</Text>
            <Text style={styles.semResultadosTexto}>
              Tente o nome do princípio ativo ou a doença que trata.{'\n'}
              Ex: busque "pressão" para ver losartana, atenolol e outros.
            </Text>
          </View>
        )}

        {/* Label da seção */}
        {resultados.length > 0 && (
          <View style={[styles.sectionLabel, { paddingHorizontal: px }]}>
            <Text style={styles.sectionLabelText}>
              {busca ? `${resultados.length} resultado${resultados.length > 1 ? 's' : ''}` : '🆓 DISPONÍVEIS NO SUS / FARMÁCIA POPULAR'}
            </Text>
            {!busca && !mostrandoTodos && (
              <TouchableOpacity onPress={verTodos}>
                <Text style={styles.verTodosLink}>Ver todos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Lista de resultados */}
        <View style={[styles.lista, { paddingHorizontal: px }]}>
          {resultados.map((med) => (
            <MedicamentoCard
              key={med.id}
              med={med}
              onPress={() => router.push({ pathname: '/remedio/[id]', params: { id: med.id } })}
            />
          ))}
        </View>

        {/* Aviso de fonte */}
        <View style={[styles.fonte, { paddingHorizontal: px }]}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primaryContainer} />
          <Text style={styles.fonteText}>
            Programa Farmácia Popular do Brasil — Ministério da Saúde
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

function MedicamentoCard({ med, onPress }: { med: MedicamentoLocal; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Barra lateral verde = gratuito */}
      <View style={[styles.cardBorda, { backgroundColor: med.gratuito ? colors.primaryContainer : colors.outlineVariant }]} />

      <View style={styles.cardBody}>
        {/* Nome + badge */}
        <View style={styles.cardTop}>
          <Text style={styles.cardNome}>{med.nome}</Text>
          {med.gratuito && (
            <View style={styles.badgeGratuito}>
              <Text style={styles.badgeGratuitoText}>GRATUITO</Text>
            </View>
          )}
          {!med.gratuito && med.subsidiado && (
            <View style={[styles.badgeGratuito, { backgroundColor: colors.secondaryContainer }]}>
              <Text style={[styles.badgeGratuitoText, { color: colors.onSecondaryContainer }]}>COM DESCONTO</Text>
            </View>
          )}
        </View>

        {/* Princípio ativo */}
        <Text style={styles.cardPrincipio}>{med.principioAtivo}</Text>

        {/* Classe */}
        <Text style={styles.cardClasse}>{med.classeTerapeutica}</Text>

        {/* Dosagens disponíveis */}
        {med.dosagens && med.dosagens.length > 0 && (
          <View style={styles.dosagensRow}>
            {med.dosagens.slice(0, 3).map((d) => (
              <View key={d} style={styles.dosagemPill}>
                <Text style={styles.dosagemText}>{d}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Indicações */}
        {med.indicacoes && med.indicacoes.length > 0 && (
          <View style={styles.indicacoesRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primaryContainer} />
            <Text style={styles.indicacoesText} numberOfLines={2}>
              {med.indicacoes.join(' · ')}
            </Text>
          </View>
        )}

        {/* CTA */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.btnOndeEncontrar, !med.gratuito && styles.btnOndeEncontrarOutline]} onPress={onPress}>
            <Ionicons name={med.gratuito ? "navigate" : "information-circle"} size={14} color={med.gratuito ? colors.onPrimary : colors.primary} />
            <Text style={[styles.btnOndeEncontrarText, !med.gratuito && { color: colors.primary }]}>
              {med.gratuito ? 'Onde encontrar de graça' : 'Ver informações e preços'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDetalhes} onPress={onPress}>
            <Text style={styles.btnDetalhesText}>Ver bula</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingTop: spacing.xl, paddingBottom: spacing.md },
  headerSub: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  headerTitle: { fontFamily: 'PublicSans-Black', fontSize: 32, color: colors.primary, letterSpacing: -1, lineHeight: undefined, marginTop: 2 },

  // Busca
  searchWrapper: { marginBottom: spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    ...shadows.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PublicSans-Regular',
    fontSize: 16,
    color: colors.onSurface,
  },

  // Chips
  chipsContainer: { gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipActive: { backgroundColor: colors.primaryFixed, borderColor: colors.primaryFixed },
  chipText: { fontFamily: 'PublicSans-SemiBold', fontSize: 13, color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.onPrimaryFixed },

  // Sem resultados
  semResultados: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl, gap: spacing.md },
  semResultadosEmoji: { fontSize: 40 },
  semResultadosTitulo: { fontFamily: 'PublicSans-Bold', fontSize: 18, color: colors.onSurface },
  semResultadosTexto: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },

  // Label seção
  sectionLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionLabelText: { fontFamily: 'PublicSans-Bold', fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1.2 },
  verTodosLink: { fontFamily: 'PublicSans-Bold', fontSize: 13, color: colors.primary },

  // Cards
  lista: { gap: spacing.md },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius['2xl'],
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.xs,
  },
  cardBorda: { width: 6 },
  cardBody: { flex: 1, padding: spacing.lg, gap: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardNome: { fontFamily: 'PublicSans-ExtraBold', fontSize: 20, color: colors.onSurface, flex: 1 },
  badgeGratuito: {
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginLeft: spacing.sm,
  },
  badgeGratuitoText: { fontFamily: 'PublicSans-Black', fontSize: 9, color: colors.onPrimaryFixed, letterSpacing: 1.5 },
  cardPrincipio: { fontFamily: 'PublicSans-Medium', fontSize: 14, color: colors.onSurfaceVariant, fontStyle: 'italic' },
  cardClasse: { fontFamily: 'PublicSans-Regular', fontSize: 12, color: colors.outline },
  dosagensRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  dosagemPill: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dosagemText: { fontFamily: 'PublicSans-SemiBold', fontSize: 12, color: colors.onSurfaceVariant },
  indicacoesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  indicacoesText: { flex: 1, fontFamily: 'PublicSans-Regular', fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 18 },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btnOndeEncontrar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  btnOndeEncontrarOutline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
  btnOndeEncontrarText: { fontFamily: 'PublicSans-Bold', fontSize: 13, color: colors.onPrimary },
  btnDetalhes: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  btnDetalhesText: { fontFamily: 'PublicSans-Bold', fontSize: 13, color: colors.onSurface },

  // Fonte
  fonte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  fonteText: { fontFamily: 'PublicSans-Regular', fontSize: 12, color: colors.onSurfaceVariant, flex: 1, lineHeight: 17 },
});
