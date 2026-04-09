import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, SafeAreaView, StatusBar, Platform, Linking,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import { useUserProfileStore } from '../../store/userProfileStore';
import { useMedicationStore } from '../../store/medicationStore';
import { farmaciaPopularService } from '../../services/farmaciaPopularService';
import { imunizacaoService } from '../../services/imunizacaoService';
import { openDataSUSService } from '../../services/openDataSUSService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useResponsive } from '../../hooks/useResponsive';
import type { AlertaSaude } from '../../types';

// Gratuitos fixos por condição de saúde
const GRATUITOS_POR_CONDICAO: Record<string, { nome: string; dosagem: string; condicao: string }[]> = {
  Hipertensão: [
    { nome: 'Losartana', dosagem: '50mg', condicao: 'Hipertensão' },
    { nome: 'Atenolol', dosagem: '25mg', condicao: 'Hipertensão' },
    { nome: 'Captopril', dosagem: '25mg', condicao: 'Hipertensão' },
    { nome: 'Anlodipino', dosagem: '5mg', condicao: 'Hipertensão' },
  ],
  Diabetes: [
    { nome: 'Metformina', dosagem: '850mg', condicao: 'Diabetes' },
    { nome: 'Glibenclamida', dosagem: '5mg', condicao: 'Diabetes' },
    { nome: 'Insulina NPH', dosagem: '100UI/ml', condicao: 'Diabetes' },
  ],
  'Asma/DPOC': [
    { nome: 'Salbutamol', dosagem: 'Spray', condicao: 'Asma/DPOC' },
    { nome: 'Beclometasona', dosagem: 'Spray', condicao: 'Asma/DPOC' },
  ],
};

const DEFAULT_GRATUITOS = [
  { nome: 'Losartana', dosagem: '50mg', condicao: 'Hipertensão' },
  { nome: 'Metformina', dosagem: '850mg', condicao: 'Diabetes' },
  { nome: 'Atenolol', dosagem: '25mg', condicao: 'Hipertensão' },
  { nome: 'Omeprazol', dosagem: '20mg', condicao: 'Estômago' },
  { nome: 'Salbutamol', dosagem: 'Spray', condicao: 'Asma' },
  { nome: 'Sinvastatina', dosagem: '20mg', condicao: 'Colesterol' },
];

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen() {
  const { perfil, filhos, onboardingConcluido, hidratado } = useUserProfileStore();
  const { medicacoes, getMedicacoesComEstoqueBaixo } = useMedicationStore();
  const [alertas, setAlertas] = useState<AlertaSaude[]>([]);
  const [vacinasAtrasadas, setVacinasAtrasadas] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { scaleFont, px, isSmall } = useResponsive();

  useFocusEffect(
    useCallback(() => {
      // Aguarda hidratação do AsyncStorage antes de redirecionar
      if (!hidratado) return;
      if (!onboardingConcluido) {
        router.replace('/onboarding');
      }
    }, [hidratado, onboardingConcluido])
  );

  useEffect(() => {
    carregarDados();
  }, [perfil, filhos]);

  async function carregarDados() {
    if (perfil?.uf) {
      const al = await openDataSUSService.getAlertasSRAG(perfil.uf);
      setAlertas(al);
    }
    if (filhos.length > 0) {
      const atrasadas: any[] = [];
      for (const filho of filhos) {
        const at = imunizacaoService.calcularVacinasAtrasadas(
          new Date(filho.dataNascimento), filho.cartaoVacinas
        );
        if (at.length > 0) atrasadas.push({ filho: filho.nome, atrasadas: at });
      }
      setVacinasAtrasadas(atrasadas);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  }

  function getGratuitos() {
    if (!perfil?.comorbidades?.length) return DEFAULT_GRATUITOS;
    const res: typeof DEFAULT_GRATUITOS = [];
    for (const cond of perfil.comorbidades) {
      res.push(...(GRATUITOS_POR_CONDICAO[cond] || []));
    }
    return res.length ? res : DEFAULT_GRATUITOS;
  }

  // Card de urgência — prioridade: vacina atrasada > estoque baixo > alerta
  function renderUrgencia() {
    const estoqueBaixo = getMedicacoesComEstoqueBaixo();

    if (vacinasAtrasadas.length > 0) {
      const { filho, atrasadas } = vacinasAtrasadas[0];
      const vacina = atrasadas[0];
      return (
        <TouchableOpacity
          style={styles.urgenciaCard}
          onPress={() => router.push('/(tabs)/vacinas')}
          activeOpacity={0.9}
        >
          <View style={styles.urgenciaContent}>
            <View style={styles.urgenciaHeader}>
              <Ionicons name="warning" size={24} color={colors.onTertiary} style={{ marginTop: 2 }} />
              <Text style={styles.urgenciaTitulo}>
                {filho} tem a vacina {vacina.vacina.nomePopular?.split(' ').slice(0, 4).join(' ')} atrasada há {vacina.diasAtraso} dias
              </Text>
            </View>
            <View style={styles.urgentePill}>
              <Text style={styles.urgentePillText}>URGENTE</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.urgenciaBtn}
            onPress={() => router.push('/(tabs)/vacinas')}
          >
            <Text style={styles.urgenciaBtnText}>Ver onde vacinar</Text>
          </TouchableOpacity>
          {/* Decorativo */}
          <View style={styles.urgenciaDecor} pointerEvents="none">
            <Ionicons name="shield-checkmark" size={120} color="rgba(255,255,255,0.1)" />
          </View>
        </TouchableOpacity>
      );
    }

    if (estoqueBaixo.length > 0) {
      const med = estoqueBaixo[0];
      return (
        <TouchableOpacity
          style={[styles.urgenciaCard, { backgroundColor: '#7448a9' }]}
          onPress={() => router.push('/(tabs)/minha-saude')}
          activeOpacity={0.9}
        >
          <View style={styles.urgenciaContent}>
            <View style={styles.urgenciaHeader}>
              <Ionicons name="warning" size={24} color="#FFFFFF" style={{ marginTop: 2 }} />
              <Text style={styles.urgenciaTitulo}>
                {med.medicamento.nome} acaba em {med.diasRestantes} dias
              </Text>
            </View>
            <View style={[styles.urgentePill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={styles.urgentePillText}>ESTOQUE BAIXO</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.urgenciaBtn} onPress={() => router.push('/(tabs)/minha-saude')}>
            <Text style={styles.urgenciaBtnText}>
              {med.medicamento.gratuitoFarmaciaPopular ? 'Retirar de graça na UBS' : 'Ver opções'}
            </Text>
          </TouchableOpacity>
          <View style={styles.urgenciaDecor} pointerEvents="none">
            <Ionicons name="medical" size={120} color="rgba(255,255,255,0.1)" />
          </View>
        </TouchableOpacity>
      );
    }

    // Alerta ou card padrão de economia
    return null;
  }

  // Card de alerta dengue/SRAG
  function renderAlertaCard() {
    const alerta = alertas[0];
    if (!alerta) return null;
    return (
      <View style={styles.alertaCard}>
        <View style={styles.alertaOverlay} />
        <View style={styles.alertaContent}>
          <View style={styles.alertaTopRow}>
            <View style={styles.alertaBadge}>
              <Text style={styles.alertaBadgeText}>ALERTA</Text>
            </View>
            {perfil?.municipio && (
              <Text style={styles.alertaMunicipio}>
                {perfil.municipio}{perfil.uf ? `, ${perfil.uf}` : ''}
              </Text>
            )}
          </View>
          <Text style={styles.alertaTitulo}>{alerta.titulo}</Text>
          {alerta.acaoRecomendada && (
            <Text style={styles.alertaAcao}>{alerta.acaoRecomendada}</Text>
          )}
        </View>
      </View>
    );
  }

  const primeiroNome = perfil?.nome?.split(' ')[0];

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Ionicons name="location-outline" size={18} color={colors.primaryContainer} />
          <Text style={styles.logo}>SaúdeJá</Text>
        </View>
        <TouchableOpacity style={styles.ligar192Btn} onPress={() => Linking.openURL('tel:192')}>
          <Text style={styles.ligar192Text}>Ligar 192</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Saudação */}
        <View style={[styles.welcomeSection, { paddingHorizontal: px }]}>
          <Text style={[styles.welcomeTitle, { fontSize: scaleFont(44, 32, 48) }]}>
            {saudacao()}{primeiroNome ? `, ${primeiroNome}!` : '!'}
          </Text>
          <Text style={styles.welcomeSub}>Seu resumo de saúde e da sua família.</Text>
        </View>

        {/* Card urgência */}
        {renderUrgencia()}

        {/* Bento Grid Ações Rápidas */}
        <View style={[styles.bento, { paddingHorizontal: px }]}>
          {[
            { icon: 'search', label: 'Buscar\nRemédio', route: '/(tabs)/remedios', bg: colors.primaryFixed, iconColor: colors.onPrimaryFixed, textColor: colors.primary },
            { icon: 'shield-checkmark', label: 'Vacinas', route: '/(tabs)/vacinas', bg: colors.secondaryFixed, iconColor: colors.onSecondaryFixed, textColor: colors.secondary },
            { icon: 'alert-circle', label: 'UBS/UPA\nAgora', route: '/(tabs)/perto', bg: colors.tertiaryFixed, iconColor: colors.onTertiaryFixedVariant, textColor: colors.tertiary },
            { icon: 'medical', label: 'Minha\nMedicação', route: '/(tabs)/minha-saude', bg: `${colors.primaryContainer}22`, iconColor: colors.primaryContainer, textColor: colors.primary },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.bentoCell}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.bentoIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
              </View>
              <Text style={[styles.bentoLabel, { color: item.textColor, fontSize: scaleFont(15, 13, 17) }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Remédios Gratuitos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Remédios GRATUITOS para você</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/remedios')}>
            <Text style={styles.verTodosText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gratuitosList}>
          {getGratuitos().slice(0, 4).map((rem) => (
            <TouchableOpacity
              key={rem.nome}
              style={styles.gratuitoRow}
              onPress={() => router.push(`/(tabs)/remedios?busca=${encodeURIComponent(rem.nome)}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.gratuitoLeft}>
                <View style={styles.gratuitoIconBox}>
                  <Ionicons name="medical" size={18} color={colors.onSecondaryContainer} />
                </View>
                <View>
                  <Text style={styles.gratuitoNome}>{rem.nome}</Text>
                  <Text style={styles.gratuitoDosagem}>{rem.dosagem} · {rem.condicao}</Text>
                </View>
              </View>
              <View style={styles.gratuitoBadge}>
                <Text style={styles.gratuitoBadgeText}>GRATUITO</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Saúde na sua cidade */}
        <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>Saúde na sua cidade</Text>
        {alertas.length > 0 ? (
          renderAlertaCard()
        ) : (
          <View style={styles.semAlertas}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primaryContainer} />
            <Text style={styles.semAlertasText}>
              Nenhum alerta de saúde para{' '}
              {perfil?.municipio || 'sua região'} no momento.
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(248,250,248,0.9)',
    ...shadows.xs,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo: { fontFamily: 'PublicSans-Black', fontSize: 22, color: '#005330', letterSpacing: -0.5 },
  ligar192Btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  ligar192Text: { fontFamily: 'PublicSans-Bold', fontSize: 14, color: '#FFFFFF' },
  scroll: { paddingTop: spacing.lg },
  welcomeSection: { marginBottom: spacing.xl },
  welcomeTitle: { fontFamily: 'PublicSans-Black', fontSize: 44, color: colors.primary, letterSpacing: -1.5, lineHeight: undefined },
  welcomeSub: { fontFamily: 'PublicSans-Medium', fontSize: 16, color: colors.onSurfaceVariant, marginTop: 4 },

  // Card urgência (vermelho)
  urgenciaCard: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  urgenciaContent: { gap: spacing.md, zIndex: 2 },
  urgenciaHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  urgenciaTitulo: { flex: 1, fontFamily: 'PublicSans-Bold', fontSize: 18, color: colors.onTertiary, lineHeight: 24 },
  urgentePill: {
    backgroundColor: colors.onTertiary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  urgentePillText: { fontFamily: 'PublicSans-Black', fontSize: 10, color: colors.tertiaryContainer, letterSpacing: 1.5 },
  urgenciaBtn: {
    backgroundColor: colors.onTertiary,
    borderRadius: radius.full,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  urgenciaBtnText: { fontFamily: 'PublicSans-Bold', fontSize: 16, color: colors.tertiaryContainer },
  urgenciaDecor: { position: 'absolute', right: -20, bottom: -20, opacity: 0.15 },

  // Bento grid
  bento: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  bentoCell: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flex: 1,           // ocupa o espaço disponível igualmente
    minWidth: 0,       // permite flex abaixo de 100px
    gap: spacing.md,
    ...shadows.xs,
  },
  bentoIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoLabel: { fontFamily: 'PublicSans-ExtraBold', fontSize: 16, lineHeight: 20 },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontFamily: 'PublicSans-Bold', fontSize: 19, color: colors.onSurface, letterSpacing: -0.3 },
  verTodosText: { fontFamily: 'PublicSans-Bold', fontSize: 13, color: colors.primary },

  // Gratuitos lista
  gratuitosList: { gap: spacing.sm, marginBottom: spacing.xl },
  gratuitoRow: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gratuitoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  gratuitoIconBox: {
    width: 40,
    height: 40,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gratuitoNome: { fontFamily: 'PublicSans-Bold', fontSize: 16, color: colors.onSurface },
  gratuitoDosagem: { fontFamily: 'PublicSans-Medium', fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
  gratuitoBadge: {
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  gratuitoBadgeText: { fontFamily: 'PublicSans-Black', fontSize: 10, color: colors.onPrimaryFixed, letterSpacing: 1.5 },

  // Alerta card (dark + foto)
  alertaCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: '#1a2a1e',
    minHeight: 160,
    marginBottom: spacing.xl,
  },
  alertaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1,
  },
  alertaContent: { padding: spacing.xl, zIndex: 2, flex: 1, justifyContent: 'flex-end', minHeight: 160 },
  alertaTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  alertaBadge: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  alertaBadgeText: { fontFamily: 'PublicSans-Black', fontSize: 10, color: colors.onTertiary, letterSpacing: 1.5 },
  alertaMunicipio: { fontFamily: 'PublicSans-Bold', fontSize: 12, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.8 },
  alertaTitulo: { fontFamily: 'PublicSans-Black', fontSize: 22, color: '#FFFFFF', lineHeight: 28 },
  alertaAcao: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 19 },

  // Sem alertas
  semAlertas: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  semAlertasText: { flex: 1, fontFamily: 'PublicSans-Medium', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 20 },
});
