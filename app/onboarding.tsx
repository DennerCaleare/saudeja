import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radius } from '../constants/theme';
import { useUserProfileStore } from '../store/userProfileStore';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import type { PerfilUsuario } from '../types';

// Slides inspirados no mockup Stitch — fundo verde escuro, tipografia pesada
interface Slide {
  id: string;
  emoji: string;
  titulo: string;
  subtitulo: string;
  destaque?: string;
  bgColor: string;
}

const SLIDES: Slide[] = [
  {
    id: 'choque',
    emoji: '💊',
    titulo: 'Sabia que muitos brasileiros pagam por remédios que o governo oferece DE GRAÇA?',
    subtitulo: 'Dona Maria economizou o suficiente para o presente dos netos apenas usando o SaúdeJá.',
    destaque: 'R$ 220',
    bgColor: colors.primary,           // verde escuro #00502c
  },
  {
    id: 'prova',
    emoji: '🆓',
    titulo: 'Esses remédios são 100% gratuitos',
    subtitulo: 'Losartana, Metformina, Atenolol e mais de 100 medicamentos — SUS e Farmácia Popular. Só a receita médica.',
    bgColor: colors.primaryContainer,  // verde escuro mais intenso
  },
  {
    id: 'vacinas',
    emoji: '💉',
    titulo: 'Seus filhos estão com as vacinas em dia?',
    subtitulo: 'O app avisa quando está na hora e explica em linguagem simples. Pentavalente = proteção contra coqueluche, tétano, meningite e mais.',
    bgColor: '#4a2d7a',               // roxo — secundário
  },
  {
    id: 'vigilancia',
    emoji: '🦟',
    titulo: 'Alertas de saúde na sua cidade — antes de todo mundo',
    subtitulo: 'Dados oficiais do Ministério da Saúde: dengue, gripe, SRAG. Sempre atualizados, com o que você deve fazer.',
    bgColor: '#5a3a00',               // marrom escuro
  },
  {
    id: 'emergencia',
    emoji: '🏥',
    titulo: 'UPA e UBS mais próximas em segundos',
    subtitulo: 'Em caso de emergência, você sabe onde está a UPA? O SAMU (192) fica a um toque.',
    bgColor: colors.tertiaryContainer, // vermelho escuro
  },
];

const REMEDIOS_GRATUITOS = [
  { nome: 'Losartana 50mg', preco: 45 },
  { nome: 'Metformina 850mg', preco: 38 },
  { nome: 'Atenolol 25mg', preco: 22 },
  { nome: 'Omeprazol 20mg', preco: 36 },
  { nome: 'Sinvastatina 20mg', preco: 41 },
  { nome: 'Captopril 25mg', preco: 25 },
];

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG',
  'MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR',
  'RS','SC','SE','SP','TO',
];

export default function Onboarding() {
  const flatListRef = useRef<FlatList>(null);
  const [slideAtual, setSlideAtual] = useState(0);
  const { setOnboardingConcluido, setPerfil } = useUserProfileStore();
  const { width: winW } = useWindowDimensions();
  // Em web limita a 480px, em celular usa a largura toda
  const SCREEN_W = Math.min(winW, 480);

  const [nome, setNome] = useState('');
  const [uf, setUf] = useState('');
  const [hipertensao, setHipertensao] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [asma, setAsma] = useState(false);
  const [gestante, setGestante] = useState(false);
  const [filhosPequenos, setFilhosPequenos] = useState(false);

  function irParaProximo() {
    if (slideAtual < SLIDES.length) {
      flatListRef.current?.scrollToIndex({ index: slideAtual + 1, animated: true });
      setSlideAtual((s) => s + 1);
    }
  }

  function concluir() {
    const comorbidades: string[] = [];
    if (hipertensao) comorbidades.push('Hipertensão');
    if (diabetes) comorbidades.push('Diabetes');
    if (asma) comorbidades.push('Asma/DPOC');

    const perfil: PerfilUsuario = {
      id: Date.now().toString(),
      nome: nome || undefined,
      uf: uf || undefined,
      gestante,
      comorbidades,
      alergias: [],
    };

    setPerfil(perfil);
    setOnboardingConcluido(true);
    router.replace('/(tabs)');
  }

  function pular() {
    setOnboardingConcluido(true);
    router.replace('/(tabs)');
  }

  const totalSlides = SLIDES.length + 1;

  function renderSlide({ item, index }: { item: Slide | null; index: number }) {
    // Último slide — formulário
    if (index === SLIDES.length) {
      return (
        <ScrollView
          style={[styles.slide, { width: SCREEN_W, backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formSlide}
        >
          <Text style={styles.formEmoji}>🎯</Text>
          <Text style={styles.formTitulo}>Personalize para você</Text>
          <Text style={styles.formSubtitulo}>
            Com essas informações, mostramos exatamente o que é gratuito para o seu perfil.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Seu nome (opcional)</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Como você quer ser chamado?"
              placeholderTextColor={colors.outline}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Seu estado (UF)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.ufRow}>
                {UFS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.ufChip, uf === u && styles.ufChipSelected]}
                    onPress={() => setUf(u)}
                  >
                    <Text style={[styles.ufChipText, uf === u && styles.ufChipTextSelected]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <Text style={styles.inputLabel}>Condições de saúde</Text>
          <Text style={styles.inputSub}>Para mostrar os remédios gratuitos certos para você</Text>

          {[
            { label: '💊 Tenho hipertensão', value: hipertensao, set: setHipertensao, sub: 'Losartana, Captopril, Atenolol — gratuitos' },
            { label: '🩺 Tenho diabetes', value: diabetes, set: setDiabetes, sub: 'Metformina, Insulina, Glibenclamida — gratuitos' },
            { label: '💨 Tenho asma ou DPOC', value: asma, set: setAsma, sub: 'Salbutamol, Beclometasona — gratuitos' },
            { label: '🤰 Sou gestante', value: gestante, set: setGestante, sub: 'Vacinas e suplementos específicos' },
            { label: '👶 Tenho filhos pequenos', value: filhosPequenos, set: setFilhosPequenos, sub: 'Calendário vacinal completo das crianças' },
          ].map((item) => (
            <View key={item.label} style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{item.label}</Text>
                <Text style={styles.toggleSub}>{item.sub}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.set}
                trackColor={{ true: colors.primaryContainer, false: colors.surfaceContainerHigh }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}

          <Text style={styles.privacidade}>
            🔒 Seus dados ficam apenas no seu celular. Não coletamos nem vendemos informações pessoais.
          </Text>

          <TouchableOpacity style={styles.btnConcluir} onPress={concluir}>
            <Text style={styles.btnConcluirText}>Começar a usar o SaúdeJá →</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      );
    }

    const slide = item!;
    return (
      <View style={[styles.slide, { width: SCREEN_W, backgroundColor: slide.bgColor }]}>
        {/* Conteúdo central */}
        <View style={styles.slideContent}>
          {/* Card de destaque (só slide 0) */}
          {slide.destaque && (
            <View style={styles.destaqueContainer}>
              <Text style={styles.destaqueValor}>{slide.destaque}</Text>
              <Text style={styles.destaquePor}>por mês</Text>
              <View style={styles.jogadosForaPill}>
                <Text style={styles.jogadosForaText}>JOGADOS FORA</Text>
              </View>
            </View>
          )}

          {/* Lista de remédios (slide 1) */}
          {index === 1 && (
            <View style={styles.listaGratuitos}>
              {REMEDIOS_GRATUITOS.map((r) => (
                <View key={r.nome} style={styles.remedioRow}>
                  <Text style={styles.remedioNome}>{r.nome}</Text>
                  <View style={styles.remedioPrecos}>
                    <Text style={styles.remedioRiscado}>R${r.preco}</Text>
                    <View style={styles.badgeGratis}>
                      <Text style={styles.badgeGratisText}>GRATUITO</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Título — tipografia Stitch: enorme, negrita */}
          <Text style={styles.slideTitulo}>{slide.titulo}</Text>
          <Text style={styles.slideSubtitulo}>{slide.subtitulo}</Text>
        </View>

        {/* Footer */}
        <View style={styles.slideFooter}>
          <TouchableOpacity style={styles.btnProximo} onPress={irParaProximo}>
            <Text style={styles.btnProximoText}>
              {index === SLIDES.length - 1 ? 'Personalizar →' : 'Próximo →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const allSlides: (Slide | null)[] = [...SLIDES, null];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* PULAR */}
      <TouchableOpacity style={styles.btnPular} onPress={pular}>
        <Text style={styles.btnPularText}>PULAR</Text>
      </TouchableOpacity>

      {/* Dots de progresso — topo, estilo Stitch */}
      <View style={styles.dotsTop}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === slideAtual ? styles.dotActive : styles.dotInativo,
            ]}
          />
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={allSlides}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1, maxWidth: SCREEN_W }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setSlideAtual(index);
        }}
        getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },

  // Pular
  btnPular: {
    position: 'absolute',
    top: 52,
    right: spacing.xl,
    zIndex: 10,
    padding: spacing.sm,
  },
  btnPularText: {
    fontFamily: 'PublicSans-Bold',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    letterSpacing: 1.2,
  },

  // Dots topo (estilo Stitch: linhas horizontais, não bolinhas)
  dotsTop: {
    position: 'absolute',
    top: 56,
    left: spacing.xl,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 28,
    backgroundColor: '#FFFFFF',
  },
  dotInativo: {
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  // Slide
  slide: {
    flex: 1,
    justifyContent: 'space-between',
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 110,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  // Card destaque R$ 220 (Stitch)
  destaqueContainer: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  destaqueValor: {
    fontFamily: 'PublicSans-Black',
    fontSize: 72,
    color: colors.primaryFixed,  // verde menta #9df6b9
    letterSpacing: -2,
    lineHeight: 76,
  },
  destaquePor: {
    fontFamily: 'PublicSans-Regular',
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  jogadosForaPill: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  jogadosForaText: {
    fontFamily: 'PublicSans-Black',
    fontSize: 12,
    color: colors.onTertiary,
    letterSpacing: 2,
  },

  // Lista gratuitos
  listaGratuitos: { marginBottom: spacing.md, gap: 6 },
  remedioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  remedioNome: { fontFamily: 'PublicSans-SemiBold', color: '#FFFFFF', fontSize: 14, flex: 1 },
  remedioPrecos: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  remedioRiscado: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecorationLine: 'line-through' },
  badgeGratis: {
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeGratisText: { fontFamily: 'PublicSans-Black', fontSize: 9, color: colors.onPrimaryFixed, letterSpacing: 1.2 },

  // Título slide — estilo Stitch: enorme, centrado
  slideTitulo: {
    fontFamily: 'PublicSans-Black',
    fontSize: 36,
    color: '#FFFFFF',
    lineHeight: 42,
    textAlign: 'center',
  },
  slideSubtitulo: {
    fontFamily: 'PublicSans-Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Footer
  slideFooter: { padding: spacing.xl, paddingTop: 0 },
  btnProximo: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  btnProximoText: {
    fontFamily: 'PublicSans-Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },

  // ─── Formulário (último slide) ──────────────────────────────────────────
  formSlide: {
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
  },
  formEmoji: { fontSize: 48, textAlign: 'center', marginBottom: spacing.md },
  formTitulo: {
    fontFamily: 'PublicSans-Black',
    fontSize: 28,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 34,
  },
  formSubtitulo: {
    fontFamily: 'PublicSans-Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  inputGroup: { marginBottom: spacing.lg },
  inputLabel: {
    fontFamily: 'PublicSans-Bold',
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  inputSub: {
    fontFamily: 'PublicSans-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: radius.xl,
    padding: spacing.md,
    fontFamily: 'PublicSans-Regular',
    fontSize: 16,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
    minHeight: 52,
  },
  ufRow: { flexDirection: 'row', gap: spacing.sm },
  ufChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  ufChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  ufChipText: { fontFamily: 'PublicSans-SemiBold', fontSize: 14, color: colors.onSurfaceVariant },
  ufChipTextSelected: { color: '#FFFFFF' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '60',
  },
  toggleInfo: { flex: 1, marginRight: spacing.md },
  toggleLabel: { fontFamily: 'PublicSans-SemiBold', fontSize: 15, color: colors.onSurface },
  toggleSub: { fontFamily: 'PublicSans-Regular', fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
  privacidade: {
    fontFamily: 'PublicSans-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    lineHeight: 19,
  },
  btnConcluir: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  btnConcluirText: {
    fontFamily: 'PublicSans-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
