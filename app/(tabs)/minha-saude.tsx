import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Switch, StatusBar, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMedicationStore } from '../../store/medicationStore';
import { useUserProfileStore } from '../../store/userProfileStore';
import { farmaciaPopularService } from '../../services/farmaciaPopularService';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useResponsive } from '../../hooks/useResponsive';

export default function MinhaSaudeScreen() {
  const { perfil } = useUserProfileStore();
  const { medicacoes, toggleNotificacoes, removeMedicacao } = useMedicationStore();
  const { scaleFont, px } = useResponsive();

  const economiaCalc = farmaciaPopularService.calcularEconomiaUsuario(
    medicacoes.map((m) => m.medicamento.nomeGenerico)
  );

  const primeiroNome = perfil?.nome?.split(' ')[0];
  const saudacao = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia,' : h < 18 ? 'Boa tarde,' : 'Boa noite,';
  };

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingHorizontal: px }]}>

        {/* Header */}
        <View style={styles.topBar}>
          {perfil?.municipio && (
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={16} color={colors.primaryContainer} />
              <Text style={styles.locText}>{perfil.municipio}{perfil.uf ? `, ${perfil.uf}` : ''}</Text>
            </View>
          )}
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="alert-circle-outline" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{primeiroNome?.[0] || '👤'}</Text>
            </View>
          </View>
        </View>

        {/* Saudação */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSub}>{saudacao()}</Text>
          <Text style={[styles.welcomeTitle, { fontSize: scaleFont(36, 28, 40) }]}>{primeiroNome ? `Seu ${primeiroNome}` : 'Meu Perfil'}</Text>
        </View>

        {/* Card Economia */}
        {economiaCalc.economiaTotal > 0 ? (
          <View style={styles.economiaCard}>
            <View style={styles.economiaTop}>
              <View style={styles.cofrinhoBox}>
                <Text style={styles.cofrinhoEmoji}>🐷</Text>
              </View>
              <View style={styles.susRename}>
                <Text style={styles.susText}>SUS / RENAME</Text>
              </View>
            </View>
            <Text style={styles.economiaSub}>Economia total com remédios gratuitos</Text>
            <Text style={styles.economiaValor}>
              R$ {economiaCalc.economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} /ano
            </Text>
          </View>
        ) : (
          <View style={styles.economiaCard}>
            <View style={styles.cofrinhoBox}>
              <Text style={styles.cofrinhoEmoji}>🐷</Text>
            </View>
            <Text style={styles.economiaSub}>Adicione seus medicamentos</Text>
            <Text style={styles.economiaValorZero}>para calcular sua economia</Text>
          </View>
        )}

        {/* Dados do cartão SUS */}
        <View style={styles.dadosGrid}>
          <View style={styles.dadoCns}>
            <Text style={styles.dadoLabel}>CARTÃO CNS</Text>
            <Text style={styles.dadoValor}>{perfil?.cartaoSUS || '— — —'}</Text>
          </View>
          <View style={styles.dadoTipo}>
            <View>
              <Text style={styles.dadoLabel}>SANGUE</Text>
              <Text style={[styles.dadoValor, { color: colors.tertiary }]}>{perfil?.tipoSanguineo || '—'}</Text>
            </View>
            <View>
              <Text style={styles.dadoLabel}>IDADE</Text>
              <Text style={styles.dadoValor}>{perfil?.dataNascimento ? calcularIdade(new Date(perfil.dataNascimento)) : '—'}</Text>
            </View>
          </View>
        </View>

        {/* Seção Medicação */}
        <View style={styles.medSection}>
          <View style={styles.medSectionHeader}>
            <View>
              <Text style={styles.medSectionTitle}>Minha Medicação</Text>
              <Text style={styles.medSectionSub}>Acompanhe seus horários e estoque.</Text>
            </View>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Adicionar</Text>
            </TouchableOpacity>
          </View>

          {medicacoes.length === 0 && (
            <View style={styles.medEmpty}>
              <Text style={styles.medEmptyText}>
                Nenhum medicamento cadastrado.{'\n'}Toque em "+ Adicionar" para começar.
              </Text>
            </View>
          )}

          {medicacoes.map((med) => {
            const estoqueBaixo = (med.estoque || 0) <= (med.alertaEstoqueMinimo || 5);
            const isGratuito = med.medicamento.gratuitoFarmaciaPopular;
            const pctEstoque = Math.min(100, ((med.estoque || 0) / 30) * 100);

            return (
              <View key={med.id} style={styles.medCard}>
                {/* Nome e Badge */}
                <View style={styles.medHeader}>
                  <Text style={styles.medNome}>{med.medicamento.nome}</Text>
                  {isGratuito && (
                    <View style={styles.badgeGratuito}>
                      <Text style={styles.badgeGratuitoText}>GRATUITO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.medPosologia}>{med.posologia}</Text>

                {/* Horários como pills */}
                <View style={styles.horariosRow}>
                  {med.horarios.map((h) => {
                    const isPrimario = med.horarios[0] === h;
                    return (
                      <View key={h} style={[styles.horarioPill, !isPrimario && styles.horarioPillInativo]}>
                        <Text style={[styles.horarioH, !isPrimario && styles.horarioHInativo]}>{h}</Text>
                        <Text style={[styles.horarioAcao, !isPrimario && styles.horarioAcaoInativo]}>
                          TOMAR
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Estoque */}
                {med.estoque !== undefined && (
                  <View style={styles.estoqueSection}>
                    <View style={styles.estoqueRow}>
                      <Text style={styles.estoqueText}>
                        Estoque: {med.estoque} {med.estoque === 1 ? 'dose' : 'doses'} restantes
                      </Text>
                      {med.diasRestantes !== undefined && (
                        <View style={[styles.acabandoPill, !estoqueBaixo && styles.acabandoPillOk]}>
                          {estoqueBaixo && <Ionicons name="warning" size={12} color={colors.onTertiary} />}
                          <Text style={[styles.acabandoText, !estoqueBaixo && styles.acabandoTextOk]}>
                            {estoqueBaixo ? `Acaba em ${med.diasRestantes} dias` : 'EM DIA'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${pctEstoque}%`,
                            backgroundColor: estoqueBaixo ? colors.tertiaryContainer : colors.primaryContainer,
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}

                {/* Notificações toggle */}
                <View style={styles.notifRow}>
                  <Text style={styles.notifLabel}>Alarmes de horário</Text>
                  <Switch
                    value={med.notificacoesAtivas}
                    onValueChange={() => toggleNotificacoes(med.id)}
                    trackColor={{ true: colors.primaryContainer, false: colors.surfaceContainerHigh }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Card Vacinas */}
        <TouchableOpacity
          style={styles.vacinaCard}
          onPress={() => router.push('/(tabs)/vacinas')}
          activeOpacity={0.85}
        >
          <View style={styles.vacinaIconBox}>
            <Ionicons name="shield-checkmark" size={22} color={colors.secondaryContainer} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vacinaTitle}>Calendário de Vacinação</Text>
            <Text style={styles.vacinaSub}>Veja o calendário completo</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.outline} />
        </TouchableOpacity>

        {/* Privacidade */}
        <View style={styles.privacidadeCard}>
          <Ionicons name="lock-closed" size={16} color={colors.primaryContainer} />
          <Text style={styles.privacidadeText}>
            Seus dados ficam apenas neste celular. O SaúdeJá não coleta nem envia suas informações.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

function calcularIdade(nasc: Date): string {
  const anos = Math.floor((Date.now() - nasc.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return String(anos);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: spacing.md },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.lg },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontFamily: 'PublicSans-SemiBold', fontSize: 14, color: colors.primaryContainer },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: { padding: 6 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontFamily: 'PublicSans-Bold', fontSize: 18, color: colors.onSurface },

  welcomeSection: { marginTop: spacing.lg, marginBottom: spacing.xl },
  welcomeSub: { fontFamily: 'PublicSans-Regular', fontSize: 16, color: colors.onSurfaceVariant },
  welcomeTitle: { fontFamily: 'PublicSans-Black', fontSize: 36, color: colors.primary, letterSpacing: -1, lineHeight: 40 },

  // Economia
  economiaCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  economiaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cofrinhoBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  cofrinhoEmoji: { fontSize: 22 },
  susRename: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  susText: { fontFamily: 'PublicSans-Black', fontSize: 10, color: colors.primaryFixed, letterSpacing: 1.5 },
  economiaSub: { fontFamily: 'PublicSans-Regular', fontSize: 13, color: colors.onPrimaryContainer, marginTop: 4 },
  economiaValor: { fontFamily: 'PublicSans-Black', fontSize: 30, color: colors.onPrimary, letterSpacing: -1 },
  economiaValorZero: { fontFamily: 'PublicSans-Medium', fontSize: 16, color: colors.onPrimaryContainer },

  // Dados
  dadosGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  dadoCns: { flex: 1, backgroundColor: colors.surfaceContainerLow, borderRadius: radius.xl, padding: spacing.lg },
  dadoTipo: { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  dadoLabel: { fontFamily: 'PublicSans-Bold', fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 4 },
  dadoValor: { fontFamily: 'PublicSans-Black', fontSize: 18, color: colors.onSurface },

  // Medicação
  medSection: { gap: spacing.md, marginBottom: spacing.lg },
  medSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  medSectionTitle: { fontFamily: 'PublicSans-Bold', fontSize: 20, color: colors.onSurface },
  medSectionSub: { fontFamily: 'PublicSans-Regular', fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.secondaryFixed,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: { fontFamily: 'PublicSans-Bold', fontSize: 14, color: colors.secondary },

  medEmpty: { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  medEmptyText: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },

  medCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.xs,
  },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  medNome: { fontFamily: 'PublicSans-Bold', fontSize: 20, color: colors.onSurface, flex: 1 },
  badgeGratuito: {
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeGratuitoText: { fontFamily: 'PublicSans-Black', fontSize: 9, color: colors.onPrimaryFixed, letterSpacing: 1.5 },
  medPosologia: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.onSurfaceVariant },

  horariosRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  horarioPill: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  horarioPillInativo: { backgroundColor: colors.surfaceContainerLow },
  horarioH: { fontFamily: 'PublicSans-Black', fontSize: 20, color: colors.onSurface },
  horarioHInativo: { color: colors.onSurfaceVariant },
  horarioAcao: { fontFamily: 'PublicSans-Bold', fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1.2, marginTop: 2 },
  horarioAcaoInativo: { color: colors.outlineVariant },

  estoqueSection: { gap: spacing.sm },
  estoqueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estoqueText: { fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.onSurfaceVariant },
  acabandoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  acabandoPillOk: { backgroundColor: colors.primaryFixed },
  acabandoText: { fontFamily: 'PublicSans-Bold', fontSize: 11, color: colors.onTertiary },
  acabandoTextOk: { color: colors.onPrimaryFixed },
  progressBar: { height: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full },

  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifLabel: { fontFamily: 'PublicSans-Medium', fontSize: 15, color: colors.onSurface },

  // Vacinas
  vacinaCard: {
    backgroundColor: colors.secondaryFixed,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  vacinaIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  vacinaTitle: { fontFamily: 'PublicSans-Bold', fontSize: 16, color: colors.secondary },
  vacinaSub: { fontFamily: 'PublicSans-Regular', fontSize: 13, color: colors.secondary, marginTop: 2 },

  // Privacidade
  privacidadeCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  privacidadeText: { flex: 1, fontFamily: 'PublicSans-Regular', fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 19 },
});
