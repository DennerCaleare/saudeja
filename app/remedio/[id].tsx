import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Linking, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { medicamentosDB } from '../../data/medicamentosDB';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useResponsive } from '../../hooks/useResponsive';

export default function RemedioDetalhes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const med = medicamentosDB.porId(id || '');
  const similares = med ? medicamentosDB.buscarSimilares(med.id) : [];
  const { scaleFont, px } = useResponsive();

  if (!med) {
    return (
      <ScreenContainer>
        <SafeAreaView style={styles.container}>
          <View style={styles.erroBox}>
            <Text style={styles.erroTexto}>Remédio não encontrado.</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScreenContainer>
    );
  }

  function whatsappUBS() {
    Linking.openURL('https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/f/farmacia-popular/onde-encontrar');
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryContainer} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Ionicons name="location-outline" size={14} color={colors.primaryContainer} />
          <Text style={styles.navTitle}>Poupa Remédio</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingHorizontal: px }]}>

        {/* Hero — identidade */}
        <View style={styles.hero}>
          {med.gratuito && (
            <View style={styles.heroBadges}>
              <View style={styles.badgeSUS}>
                <Text style={styles.badgeSUSText}>SUS / FARMÁCIA POPULAR</Text>
              </View>
            </View>
          )}
          {!med.gratuito && (
            <View style={styles.heroBadges}>
              <View style={[styles.badgeSUS, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={[styles.badgeSUSText, { color: colors.onSurfaceVariant }]}>MERCADO PRIVADO</Text>
              </View>
            </View>
          )}
          <Text style={[styles.heroNome, { fontSize: scaleFont(44, 32, 52) }]}>{med.nome}</Text>
          <Text style={styles.heroPrincipio}>{med.principioAtivo}</Text>
          <Text style={styles.heroClasse}>{med.classeTerapeutica}</Text>

          <TouchableOpacity 
            style={styles.bulaBtn} 
            onPress={() => Linking.openURL(med.bulaUrl || `https://www.google.com/search?q=Bula+paciente+${encodeURIComponent(med.nome)}`)}
          >
            <Ionicons name="document-text" size={16} color={colors.primary} />
            <Text style={styles.bulaBtnText}>Ler Bula Simplificada</Text>
          </TouchableOpacity>
        </View>

        {/* Card principal: GRATUITO ou MERCADO PRIVADO */}
        {med.gratuito ? (
          <View style={styles.gratuitoCard}>
            <View style={styles.gratuitoGlow} />
            <View style={styles.gratuitoTop}>
              <View style={styles.gratuitoIconBox}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primaryFixed} />
              </View>
              <Text style={styles.gratuitoSupra}>PROGRAMA FEDERAL GRATUITO</Text>
            </View>
            <Text style={styles.gratuitoTitulo}>R$ 0,00{'\n'}no SUS ou FP</Text>
            <Text style={styles.gratuitoDesc}>
              Apresente receita médica + documento com foto.
            </Text>
            <TouchableOpacity style={styles.gratuitoBtn} onPress={whatsappUBS}>
              <Ionicons name="navigate" size={16} color={colors.primary} />
              <Text style={styles.gratuitoBtnText}>Ver farmácias participantes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.gratuitoCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={styles.gratuitoTop}>
              <View style={[styles.gratuitoIconBox, { backgroundColor: colors.outlineVariant }]}>
                <Ionicons name="information-circle" size={24} color={colors.onSurfaceVariant} />
              </View>
              <Text style={[styles.gratuitoSupra, { color: colors.onSurfaceVariant }]}>COMPRA EM FARMÁCIA</Text>
            </View>
            <Text style={[styles.gratuitoTitulo, { color: colors.onSurface }]}>Não faz parte{'\n'}da rede gratuita</Text>
            <Text style={[styles.gratuitoDesc, { color: colors.onSurfaceVariant }]}>
              Medicamento não pertence ao RENAME ou Farmácia Popular. Você deve adquiri-lo em farmácias particulares.
            </Text>
          </View>
        )}

        {/* Onde buscar (só para SUS) */}
        {med.gratuito && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Onde buscar gratuitamente</Text>

            {[
              {
                icon: 'business' as const,
                titulo: 'Farmácia Popular',
                descricao: 'Farmácias privadas credenciadas. Leve receita + documento.',
                cor: colors.primaryContainer,
              },
              {
                icon: 'medkit' as const,
                titulo: 'UBS (Posto de Saúde)',
                descricao: 'Medicamentos básicos distribuídos direto na unidade. Sem fila de compra.',
                cor: colors.primaryContainer,
              },
            ].map((item) => (
              <View key={item.titulo} style={styles.ondeCard}>
                <View style={[styles.ondeIconBox, { backgroundColor: `${item.cor}22` }]}>
                  <Ionicons name={item.icon} size={22} color={item.cor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ondeTitle}>{item.titulo}</Text>
                  <Text style={styles.ondeDesc}>{item.descricao}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.mapaBtn} 
              onPress={() => router.push({ pathname: '/(tabs)/perto', params: { contexto: 'sus', medNome: med.nome } })}
            >
              <Ionicons name="map" size={16} color={colors.primary} />
              <Text style={styles.mapaBtnText}>Ver no mapa (SUS)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Compra Particular Conveniência (Aparece em todos que tiverem preco) */}
        {med.gratuito && med.precoReferencia && med.precoReferencia > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comprar por conveniência</Text>
            <View style={[styles.ondeCard, { borderColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
              <View style={[styles.ondeIconBox, { backgroundColor: colors.secondaryContainer }]}>
                <Ionicons name="cart" size={22} color={colors.onSecondaryContainer} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ondeTitle}>Farmácias Particulares</Text>
                <Text style={styles.ondeDesc}>Preço médio: R$ {med.precoReferencia.toFixed(2).replace('.', ',')}</Text>
                <TouchableOpacity 
                  style={styles.inlineBtn} 
                  onPress={() => router.push({ pathname: '/(tabs)/perto', params: { contexto: 'particular', medNome: med.nome } })}
                >
                  <Text style={styles.inlineBtnText}>Ver no mapa (Farmácias)</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Dosagens */}
        {med.dosagens && med.dosagens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dosagens {med.gratuito ? 'disponíveis gratuitamente' : 'mais comuns'}</Text>
            <View style={styles.dosagemGrid}>
              {med.dosagens.map((d) => (
                <View key={d} style={styles.dosagemCard}>
                  <Text style={styles.dosagemValor}>{d}</Text>
                  <Text style={styles.dosagemForma}>{med.forma}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Para que serve */}
        {med.indicacoes && med.indicacoes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Para que serve?</Text>
            <View style={styles.indicacoesBox}>
              {med.indicacoes.map((ind) => (
                <View key={ind} style={styles.indicacaoRow}>
                  <View style={styles.indicacaoDot} />
                  <Text style={styles.indicacaoText}>{ind}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Como usar */}
        {med.comoUsar && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Como usar?</Text>
            <View style={styles.comoUsarBox}>
              <Ionicons name="information-circle" size={20} color={colors.primaryContainer} />
              <Text style={styles.comoUsarText}>{med.comoUsar}</Text>
            </View>
          </View>
        )}

        {/* Atenção */}
        {med.atencao && (
          <View style={styles.atencaoBox}>
            <Ionicons name="warning" size={20} color={colors.tertiaryContainer} />
            <Text style={styles.atencaoText}>{med.atencao}</Text>
          </View>
        )}

        {/* Economia */}
        {med.precoReferencia && med.precoReferencia > 0 ? (
          <View style={styles.economiaBox}>
            <View>
              <Text style={styles.economiaLabel}>ECONOMIA ESTIMADA</Text>
              <Text style={styles.economiaValor}>R$ {med.precoReferencia.toFixed(2).replace('.', ',')} / mês</Text>
            </View>
            <View style={styles.economiaAnual}>
              <Text style={styles.economiaAnualLabel}>por ano</Text>
              <Text style={styles.economiaAnualValor}>R$ {(med.precoReferencia * 12).toLocaleString('pt-BR')}</Text>
            </View>
          </View>
        ) : null}

        {/* Similares e Genéricos */}
        {similares.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similares e Genéricos</Text>
            <Text style={styles.sectionSubtitle}>Mesmo princípio ativo ({med.principioAtivo})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similaresScroll}>
              {similares.map((sim, idx) => (
                <TouchableOpacity 
                  key={sim.id} 
                  style={[styles.similarCard, { marginLeft: idx === 0 ? 0 : spacing.sm }]}
                  onPress={() => router.replace(`/remedio/${sim.id}` as any)}
                >
                  <View style={styles.similarIcon}>
                    <Ionicons name="medical" size={18} color={colors.onSurfaceVariant} />
                  </View>
                  <Text style={styles.similarNome}>{sim.nome}</Text>
                  {sim.gratuito && (
                    <View style={styles.similarBadge}>
                      <Text style={styles.similarBadgeText}>SUS</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Rodapé */}
        <Text style={styles.rodape}>
          Fonte: Ministério da Saúde / Programa Farmácia Popular do Brasil{'\n'}
          Consulte sempre seu médico ou farmacêutico.
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  erroBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  erroTexto: { fontFamily: 'PublicSans-Regular', fontSize: 16, color: colors.onSurfaceVariant },
  backBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md },
  backBtnText: { fontFamily: 'PublicSans-Bold', fontSize: 15, color: colors.onPrimary },

  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  navBtn: { padding: spacing.sm },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navTitle: { fontFamily: 'PublicSans-SemiBold', fontSize: 15, color: colors.primaryContainer },

  scroll: { paddingTop: 0 },

  // Hero
  hero: { marginBottom: spacing.xl, gap: spacing.sm },
  heroBadges: { flexDirection: 'row' },
  badgeSUS: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeSUSText: { fontFamily: 'PublicSans-Black', fontSize: 10, color: colors.onSecondaryContainer, letterSpacing: 1.2 },
  heroNome: { fontFamily: 'PublicSans-Black', fontSize: 44, color: colors.primary, letterSpacing: -1.5, lineHeight: 48 },
  heroPrincipio: { fontFamily: 'PublicSans-Medium', fontSize: 16, color: colors.onSurfaceVariant, fontStyle: 'italic' },
  heroClasse: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.outline },
  
  bulaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: `${colors.primary}11`,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.full, alignSelf: 'flex-start', marginTop: spacing.sm,
  },
  bulaBtnText: { fontFamily: 'PublicSans-Bold', fontSize: 13, color: colors.primary },

  // Card Gratuito
  gratuitoCard: {
    backgroundColor: colors.primary,
    borderRadius: radius['3xl'],
    padding: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  gratuitoGlow: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.primaryFixed, opacity: 0.1,
  },
  gratuitoTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gratuitoIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  gratuitoSupra: { fontFamily: 'PublicSans-Bold', fontSize: 11, color: colors.primaryFixed, letterSpacing: 1.5 },
  gratuitoTitulo: { fontFamily: 'PublicSans-Black', fontSize: 34, color: colors.onPrimary, lineHeight: 38, letterSpacing: -1 },
  gratuitoDesc: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  gratuitoBtn: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  gratuitoBtnText: { fontFamily: 'PublicSans-Bold', fontSize: 15, color: colors.primary },

  // Onde buscar
  section: { marginBottom: spacing.xl, gap: spacing.md },
  sectionTitle: { fontFamily: 'PublicSans-ExtraBold', fontSize: 20, color: colors.onSurface },
  ondeCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '50',
  },
  ondeIconBox: { width: 44, height: 44, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  ondeTitle: { fontFamily: 'PublicSans-Bold', fontSize: 16, color: colors.onSurface },
  ondeDesc: { fontFamily: 'PublicSans-Regular', fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 18, marginTop: 3 },
  mapaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: radius.full, paddingVertical: spacing.md,
  },
  mapaBtnText: { fontFamily: 'PublicSans-Bold', fontSize: 14, color: colors.primary },
  inlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  inlineBtnText: { fontFamily: 'PublicSans-Bold', fontSize: 13, color: colors.primary },

  // Dosagens
  dosagemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  dosagemCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dosagemValor: { fontFamily: 'PublicSans-Black', fontSize: 22, color: colors.onSurface },
  dosagemForma: { fontFamily: 'PublicSans-Regular', fontSize: 12, color: colors.onSurfaceVariant },

  // Indicações
  indicacoesBox: { gap: spacing.sm },
  indicacaoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  indicacaoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryContainer },
  indicacaoText: { fontFamily: 'PublicSans-Regular', fontSize: 15, color: colors.onSurface, flex: 1 },

  // Como usar
  comoUsarBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl, padding: spacing.lg,
    flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start',
  },
  comoUsarText: { flex: 1, fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.onSurface, lineHeight: 21 },

  // Atenção
  atencaoBox: {
    backgroundColor: `${colors.tertiaryContainer}22`,
    borderRadius: radius.xl, padding: spacing.lg,
    flexDirection: 'row', gap: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1, borderColor: `${colors.tertiaryContainer}55`,
  },
  atencaoText: { flex: 1, fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.onSurface, lineHeight: 21 },

  // Economia
  economiaBox: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xl, padding: spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xl,
  },
  economiaLabel: { fontFamily: 'PublicSans-Bold', fontSize: 10, color: colors.onPrimaryContainer, letterSpacing: 1.5, marginBottom: 4 },
  economiaValor: { fontFamily: 'PublicSans-Black', fontSize: 26, color: colors.onPrimary, letterSpacing: -1 },
  economiaAnual: { alignItems: 'flex-end' },
  economiaAnualLabel: { fontFamily: 'PublicSans-Regular', fontSize: 12, color: colors.onPrimaryContainer, marginBottom: 2 },
  economiaAnualValor: { fontFamily: 'PublicSans-Black', fontSize: 20, color: colors.onPrimary },

  rodape: { fontFamily: 'PublicSans-Regular', fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 18 },

  // Similares
  sectionSubtitle: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.onSurfaceVariant, marginTop: -spacing.md, marginBottom: spacing.md },
  similaresScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  similarCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.md,
    width: 140,
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.md,
  },
  similarIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  similarNome: { fontFamily: 'PublicSans-Bold', fontSize: 14, color: colors.onSurface, textAlign: 'center' },
  similarBadge: { backgroundColor: colors.secondaryContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  similarBadgeText: { fontFamily: 'PublicSans-Black', fontSize: 9, color: colors.onSecondaryContainer },

});
