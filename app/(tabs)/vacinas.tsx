import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, StatusBar, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfileStore } from '../../store/userProfileStore';
import { imunizacaoService, CALENDARIO_VACINAL } from '../../services/imunizacaoService';
import { cnesService } from '../../services/cnesService';
import * as Location from 'expo-location';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useResponsive } from '../../hooks/useResponsive';
import type { VacinaUsuario, EstabelecimentoSaude } from '../../types';

export default function VacinasScreen() {
  const { perfil, filhos } = useUserProfileStore();
  const [cartao, setCartao] = useState<VacinaUsuario[]>([]);
  const [ubsProximas, setUBSProximas] = useState<EstabelecimentoSaude[]>([]);
  const [loadingUBS, setLoadingUBS] = useState(false);
  const { px } = useResponsive();

  const filhoAtivo = filhos[0] || null;
  const dataNasc = filhoAtivo
    ? new Date(filhoAtivo.dataNascimento)
    : perfil?.dataNascimento ? new Date(perfil.dataNascimento) : new Date();

  const nomeCalendario = filhoAtivo
    ? `Calendário do ${filhoAtivo.nome.split(' ')[0]}`
    : 'Meu Calendário';

  const idadeTexto = filhoAtivo
    ? calcularIdadeTexto(new Date(filhoAtivo.dataNascimento))
    : '';

  const vacinasCalendario = imunizacaoService.getCalendarioVacinal(
    dataNasc, perfil?.gestante || false, perfil?.comorbidades || []
  );
  const vacinasAtrasadas = imunizacaoService.calcularVacinasAtrasadas(dataNasc, cartao);
  const campanhasAtivas = imunizacaoService.getCampanhasAtivas().filter((c) => c.ativa);

  useEffect(() => {
    buscarUBS();
  }, []);

  function calcularIdadeTexto(nasc: Date): string {
    const diff = Date.now() - nasc.getTime();
    const meses = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    if (meses < 24) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    const anos = Math.floor(meses / 12);
    return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  }

  async function buscarUBS() {
    setLoadingUBS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const locais = await cnesService.buscarUBSProximas(loc.coords.latitude, loc.coords.longitude);
      setUBSProximas(locais.slice(0, 3));
    } catch {}
    finally { setLoadingUBS(false); }
  }

  function marcarTomada(vacinaId: string) {
    setCartao((prev) => {
      const existente = prev.find((c) => c.vacinaId === vacinaId);
      if (existente) return prev.map((c) => c.vacinaId === vacinaId ? { ...c, doses: c.doses.map((d) => ({ ...d, aplicada: true, dataAplicacao: new Date() })) } : c);
      const vacina = CALENDARIO_VACINAL.find((v) => v.id === vacinaId);
      return [...prev, { vacinaId, nome: vacina?.nome || '', doses: [{ numero: 1, aplicada: true, dataAplicacao: new Date() }] }];
    });
  }

  function isTomada(vacinaId: string) {
    return cartao.find((c) => c.vacinaId === vacinaId)?.doses.some((d) => d.aplicada) || false;
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingHorizontal: px }]}>

        {/* Header */}
        <View style={styles.headerSection}>
          {/* Avatar criança (emoji placeholder) */}
          {filhoAtivo && (
            <View style={styles.avatarBox}>
              <Text style={styles.avatarEmoji}>👶</Text>
            </View>
          )}
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>{nomeCalendario}</Text>
            {idadeTexto ? <Text style={styles.headerSub}>({idadeTexto})</Text> : null}
          </View>
        </View>

        {/* Banner de vacinasAtrasadas */}
        {vacinasAtrasadas.length > 0 && (
          <View style={styles.atrasadasBanner}>
            <Ionicons name="alert-circle" size={22} color={colors.onTertiary} />
            <Text style={styles.atrasadasText}>
              {vacinasAtrasadas.length} vacina{vacinasAtrasadas.length > 1 ? 's' : ''} atrasada{vacinasAtrasadas.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Lista de vacinas */}
        <View style={styles.vacinasList}>
          {vacinasCalendario.map((vacina) => {
            const tomada = isTomada(vacina.id);
            const atrasada = vacinasAtrasadas.find((a) => a.vacina.id === vacina.id);

            if (atrasada && !tomada) {
              // Card ATRASADA — estilo Stitch
              return (
                <View key={vacina.id} style={styles.cardAtrasada}>
                  <View style={styles.atrasadaTag}>
                    <Text style={styles.atrasadaTagText}>ATRASADA</Text>
                  </View>
                  <View style={styles.cardAtrasadaBody}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.vacinaNomePopular}>{vacina.nomePopular}</Text>
                      <Text style={styles.vacinaTecnico}>{vacina.nome} · {atrasada.diasAtraso} dias atrasada</Text>
                      {vacina.doencasProtegidasSimples.length > 0 && (
                        <View style={styles.doencasBox}>
                          <Text style={styles.doencasLabel}>PREVENÇÃO CONTRA:</Text>
                          <View style={styles.doencasRow}>
                            {vacina.doencasProtegidasSimples.slice(0, 5).map((d) => (
                              <View key={d} style={styles.doencaChip}>
                                <Text style={styles.doencaText}>{d}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity style={styles.sacolaBtn}>
                      <Ionicons name="briefcase" size={20} color={colors.tertiary} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.agendarBtn}>
                    <Ionicons name="calendar" size={18} color={colors.onPrimary} />
                    <Text style={styles.agendarBtnText}>Agendar Agora</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            // Card normal
            return (
              <View key={vacina.id} style={styles.cardNormal}>
                <View style={[styles.statusIcon, tomada ? styles.statusOk : styles.statusPendente]}>
                  <Ionicons name={tomada ? 'checkmark' : 'medical'} size={20} color={tomada ? colors.primaryContainer : colors.onSurfaceVariant} />
                </View>
                <View style={styles.cardNormalInfo}>
                  <Text style={styles.cardNormalNome} numberOfLines={2}>{vacina.nomePopular}</Text>
                  <Text style={styles.cardNormalSub}>{vacina.nome}</Text>
                </View>
                <View style={[styles.statusPill, tomada ? styles.statusPillOk : styles.statusPillPendente]}>
                  <Text style={[styles.statusPillText, tomada ? styles.statusPillTextOk : styles.statusPillTextPendente]}>
                    {tomada ? 'EM DIA' : 'PENDENTE'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Card localização UBS */}
        <TouchableOpacity
          style={styles.ubsCard}
          onPress={() => {
            if (ubsProximas[0]?.coordenadas) {
              const { lat, lon } = ubsProximas[0].coordenadas;
              Linking.openURL(`https://maps.google.com/?q=${lat},${lon}`);
            }
          }}
        >
          <View style={styles.ubsCardOverlay} />
          <View style={styles.ubsCardContent}>
            <Text style={styles.ubsCardSupra}>LOCALIZAÇÃO</Text>
            <Text style={styles.ubsCardTitle}>Onde vacinar</Text>
            <Text style={styles.ubsCardSub}>
              {loadingUBS ? 'Localizando UBS mais próxima...'
                : ubsProximas[0] ? `${ubsProximas[0].nome} · ${ubsProximas[0].distanciaKm?.toFixed(1)} km`
                : 'Encontre a UBS mais próxima de você agora.'}
            </Text>
          </View>
          <View style={styles.ubsNavBtn}>
            <Ionicons name="navigate" size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: spacing.lg },

  // Header
  headerSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  avatarBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.outlineVariant,
  },
  avatarEmoji: { fontSize: 30 },
  headerTexts: { flex: 1 },
  headerTitle: { fontFamily: 'PublicSans-Black', fontSize: 28, color: colors.onSurface, lineHeight: 32 },
  headerSub: { fontFamily: 'PublicSans-Regular', fontSize: 15, color: colors.onSurfaceVariant, marginTop: 2 },

  // Banner atrasadas
  atrasadasBanner: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  atrasadasText: { fontFamily: 'PublicSans-Bold', fontSize: 16, color: colors.onTertiary, flex: 1 },

  // Lista
  vacinasList: { gap: spacing.md, marginBottom: spacing.xl },

  // Card ATRASADA
  cardAtrasada: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.sm,
  },
  atrasadaTag: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  atrasadaTagText: { fontFamily: 'PublicSans-Black', fontSize: 10, color: colors.onTertiary, letterSpacing: 1.5 },
  cardAtrasadaBody: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  vacinaNomePopular: { fontFamily: 'PublicSans-Bold', fontSize: 22, color: colors.onSurface, lineHeight: 26 },
  vacinaTecnico: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.onSurfaceVariant },
  doencasBox: { marginTop: spacing.sm, backgroundColor: colors.surfaceContainerLow, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  doencasLabel: { fontFamily: 'PublicSans-Bold', fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 1.2 },
  doencasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  doencaChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  doencaText: { fontFamily: 'PublicSans-Medium', fontSize: 13, color: colors.onSurface },
  sacolaBtn: {
    width: 48, height: 48, borderRadius: radius.xl,
    backgroundColor: colors.tertiaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  agendarBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  agendarBtnText: { fontFamily: 'PublicSans-Bold', fontSize: 16, color: colors.onPrimary },

  // Card normal
  cardNormal: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  statusOk: { backgroundColor: colors.primaryFixed },
  statusPendente: { backgroundColor: colors.surfaceContainerHigh },
  cardNormalInfo: { flex: 1 },
  cardNormalNome: { fontFamily: 'PublicSans-Bold', fontSize: 16, color: colors.onSurface, lineHeight: 20 },
  cardNormalSub: { fontFamily: 'PublicSans-Regular', fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusPillOk: { backgroundColor: colors.primaryFixed },
  statusPillPendente: { backgroundColor: colors.surfaceContainerHigh },
  statusPillText: { fontFamily: 'PublicSans-Black', fontSize: 10, letterSpacing: 1.2 },
  statusPillTextOk: { color: colors.onPrimaryFixed },
  statusPillTextPendente: { color: colors.onSurfaceVariant },

  // Card UBS (foto dark)
  ubsCard: {
    backgroundColor: '#1a2a1e',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    minHeight: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  ubsCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,50,20,0.6)',
  },
  ubsCardContent: { flex: 1, zIndex: 2 },
  ubsCardSupra: { fontFamily: 'PublicSans-Bold', fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.8, marginBottom: 4 },
  ubsCardTitle: { fontFamily: 'PublicSans-Black', fontSize: 22, color: '#FFFFFF', lineHeight: 26 },
  ubsCardSub: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  ubsNavBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
});
