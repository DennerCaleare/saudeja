import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, StatusBar, Linking, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { cnesService } from '../../services/cnesService';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useResponsive } from '../../hooks/useResponsive';
import type { EstabelecimentoSaude } from '../../types';
import { buscarFarmaciasPopular } from '../../services/farmaciaPopularService';
import { buscarFarmaciasGooglePlaces } from '../../services/farmaciaGooglePlacesService';
import { TABELA_CMED_BASE, calcularPMC } from '../../services/precoService';

// Cores solicitadas pela especificação:
// Verde (#006B3C): Farmácia Popular
// Azul (#1565C0): Privada (OSM)
// Cinza (#546E7A): SUS / UBS / CNES
const COR_TIPO: Record<string, string> = {
  UBS:      '#546E7A', 
  CAPS:     '#546E7A', 
  UPA:      '#546E7A', 
  Hospital: '#546E7A', 
  Farmacia: '#1565C0', // Particular. Se for FP, injetaremos verde manualmente.
};

const TAG_TIPO: Record<string, string> = {
  UBS:      'SUS — DISTRIBUIÇÃO GRATUITA',
  CAPS:     'SUS — SAÚDE MENTAL',
  UPA:      'ATENÇÃO — URGÊNCIA 24H',
  Hospital: 'HOSPITAL',
  Farmacia: 'FARMÁCIA PARTICULAR',
};

export default function PertoScreen() {
  const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoSaude[]>([]);
  const [upa, setUPA] = useState<EstabelecimentoSaude | null>(null);
  const [loading, setLoading] = useState(false);
  const [localizacao, setLocalizacao] = useState<{ lat: number; lon: number } | null>(null);
  const [erroLoc, setErroLoc] = useState(false);
  const [selectedEst, setSelectedEst] = useState<EstabelecimentoSaude | null>(null);
  const buscaFeita = useRef(false);
  const { contexto, medNome } = useLocalSearchParams<{ contexto?: string; medNome?: string }>();
  
  const { px, scaleFont } = useResponsive();

  // Filtragem Dinâmica
  const estabelecimentosFiltrados = estabelecimentos.filter((est) => {
    if (contexto === 'sus')
      // SUS público (UBS/CAPS/UPA) + Farmácias Populares (credenciadas, remédios gratuitos)
      return est.tipo === 'UBS' || est.tipo === 'CAPS' || est.tipo === 'UPA' || est.participaFarmaciaPopular === true;
    if (contexto === 'particular') return est.tipo === 'Farmacia';
    return true;
  });

  // Escuta postMessage do iframe do mapa (clique no pin)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.id) setSelectedEst(data as EstabelecimentoSaude);
      } catch {
        // Mensagem não é nosso dado, ignora
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (buscaFeita.current) return;
    buscaFeita.current = true;
    solicitarLocalizacao();
  }, []);

  async function solicitarLocalizacao() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setErroLoc(true); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setLocalizacao({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      // Fontes em paralelo:
      // 1. OSM (Overpass) — farmácias populares + postos SUS comunitários
      // 2. Google Places — farmácias comerciais (Drogasil, Raia, Pacheco...)
      // 3. Farmácia Popular gov — para marcar pinos verdes
      const [osmTodos, gpFarmacias, fpResult] = await Promise.all([
        cnesService.buscarEstabelecimentosProximos(loc.coords.latitude, loc.coords.longitude),
        buscarFarmaciasGooglePlaces(loc.coords.latitude, loc.coords.longitude, 15000).catch(() => [] as EstabelecimentoSaude[]),
        buscarFarmaciasPopular(loc.coords.latitude, loc.coords.longitude, 15).catch(() => [] as EstabelecimentoSaude[]),
      ]);

      // Deduplica Google Places vs OSM por proximidade (<80m = mesma farmácia)
      // OSM tem prioridade se o ponto já exists; Google Places preenche o que falta
      const gpSemDuplicata = gpFarmacias.filter(gp =>
        !osmTodos.some(osm =>
          osm.tipo === 'Farmacia' &&
          Math.abs(gp.coordenadas.lat - osm.coordenadas.lat) < 0.0008 &&
          Math.abs(gp.coordenadas.lon - osm.coordenadas.lon) < 0.0008
        )
      );

      // Marca como Farmácia Popular as farmácias que coincidem com API FP
      const checarFP = (est: EstabelecimentoSaude): EstabelecimentoSaude => {
        const isFP = fpResult.some(fp =>
          Math.abs(est.coordenadas.lat - fp.coordenadas.lat) < 0.001 &&
          Math.abs(est.coordenadas.lon - fp.coordenadas.lon) < 0.001
        );
        return isFP ? { ...est, participaFarmaciaPopular: true, atendeSUS: true } : est;
      };

      const taggedOSM = osmTodos.map(checarFP);
      const taggedGP  = gpSemDuplicata.map(checarFP);

      // FP extras (governo) sem correspondência em nenhuma fonte anterior
      const fpExtras = fpResult.filter(fp =>
        !taggedOSM.some(e =>
          Math.abs(e.coordenadas.lat - fp.coordenadas.lat) < 0.001 &&
          Math.abs(e.coordenadas.lon - fp.coordenadas.lon) < 0.001
        ) && !taggedGP.some(e =>
          Math.abs(e.coordenadas.lat - fp.coordenadas.lat) < 0.001 &&
          Math.abs(e.coordenadas.lon - fp.coordenadas.lon) < 0.001
        )
      );

      // UPA extraida do próprio OSM — sem chamada Overpass extra
      const upaProx = taggedOSM.find(e => e.tipo === 'UPA') ?? null;

      const allEstabs = [...taggedOSM, ...taggedGP, ...fpExtras];
      setEstabelecimentos(allEstabs);
      setUPA(upaProx);
    } catch { setErroLoc(true); }
    finally { setLoading(false); }
  }

  function abrirMapa(est: EstabelecimentoSaude) {
    const query = encodeURIComponent(`${est.nome} ${est.endereco.municipio || ''}`);
    const { lat, lon } = est.coordenadas;
    // Usa o nome para busca inteligente em vez de coordenadas estritas (contorna falhas de GPS em desktops)
    const url = Platform.OS === 'ios' 
      ? `maps://?q=${query}&ll=${lat},${lon}` 
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  }

  function renderMapaIntegrado() {
    if (!localizacao) return null;
    
    if (Platform.OS === 'web') {
      const { lat, lon } = localizacao;
      // Serializa TODOS os dados dos marcadores (inclusive tel, horario, endereco)
      const markersJSON = JSON.stringify(
        estabelecimentosFiltrados.map(e => ({
          id: e.id,
          nome: e.nome ? e.nome.replace(/'/g, '').replace(/"/g, '') : 'N/A', // Evita quebrar o script com aspas simples/duplas
          tipo: e.tipo,
          lat: e.coordenadas.lat,
          lon: e.coordenadas.lon,
          funcionamento24h: e.funcionamento24h,
          horarioFuncionamento: e.horarioFuncionamento ? e.horarioFuncionamento.replace(/'/g, '').replace(/"/g, '') : '',
          horarioParsed: e.horarioParsed,
          telefone: e.telefone || '',
          atendeSUS: e.atendeSUS,
          participaFarmaciaPopular: e.participaFarmaciaPopular,
          distanciaKm: e.distanciaKm || 0,
          endereco: e.endereco,
        }))
      );

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body,html,#map{margin:0;padding:0;height:100%;width:100%;font-family:sans-serif;}
            .leaflet-popup-content b { font-size: 14px; }
            .popup-btn {
              display: inline-block; margin-top: 8px;
              background: #2E7D32; color: white;
              border: none; border-radius: 20px;
              padding: 6px 16px; font-size: 13px;
              cursor: pointer; width: 100%;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${lat}, ${lon}], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '\u00a9 OpenStreetMap' }).addTo(map);
            
            var cIcon = function(color) {
              return new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-'+color+'.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
              });
            };

            // Sua Localiza\u00e7\u00e3o
            L.marker([${lat}, ${lon}], {icon: cIcon('red')})
              .addTo(map)
              .bindPopup('<b>\u{1F4CD} Voc\u00ea est\u00e1 aqui</b>')
              .openPopup();

            var locais = ${markersJSON};
            locais.forEach(function(est) {
              var isFP  = !!est.participaFarmaciaPopular;
              // CAPS, UBS e UPA são todos SUS (cinza); farmácia particular fica azul
              var isSUS = est.atendeSUS || est.tipo === 'UBS' || est.tipo === 'UPA' || est.tipo === 'CAPS';
              
              var corHex   = isFP ? '#006B3C' : isSUS ? '#546E7A' : '#1565C0';
              var cIconName = isFP ? 'green'  : isSUS ? 'grey'    : 'blue';

              var lbl = isFP  ? '\u2728 Farm\u00e1cia Popular'
                      : isSUS ? (est.tipo === 'UPA'  ? '\ud83d\udea8 Urg\u00eancia / UPA'
                              : est.tipo === 'CAPS' ? '\ud83e\udde0 Sa\u00fade Mental (CAPS)'
                              : '\u2705 SUS / P\u00fablica')
                              : '\ud83d\udcb0 Farm\u00e1cia Particular';

              var horarioTxt = est.horarioParsed && est.horarioParsed.textoHoje 
                    ? est.horarioParsed.textoHoje 
                    : (est.funcionamento24h ? '\u23f0 24 horas / 7 dias'
                      : est.horarioFuncionamento ? '\u23f0 ' + est.horarioFuncionamento
                      : 'Consulte o estabelecimento');

              var distKm = typeof est.distanciaKm === 'number' ? est.distanciaKm : 0;
              var dist = distKm < 1 ? (distKm * 1000).toFixed(0) + 'm' : distKm.toFixed(1) + 'km';
              var tel = est.telefone ? '<br>\ud83d\udcde ' + est.telefone : '';

              var popup = '<b>' + est.nome + '</b>' +
                '<br><small style="color:' + corHex + '"><b>' + lbl + '</b></small>' +
                '<br><small>' + horarioTxt + tel + '</small>' +
                '<br><small>\ud83d\udeb6 ' + dist + ' de dist\u00e2ncia</small>' +
                '<br><button class="popup-btn" style="background:' + corHex + ';" onclick="sendEst(\\'' + est.id + '\\')">Ver detalhes</button>';

              L.marker([est.lat, est.lon], {icon: cIcon(cIconName)})
                .addTo(map)
                .bindPopup(popup);
            });

            function sendEst(id) {
              var est = locais.find(function(l) { return l.id === id; });
              if (!est) return;
              try {
                window.parent.postMessage(JSON.stringify({
                  id: est.id,
                  cnes: '',
                  nome: est.nome,
                  tipo: est.tipo,
                  endereco: est.endereco,
                  coordenadas: { lat: est.lat, lon: est.lon },
                  telefone: est.telefone,
                  horarioFuncionamento: est.horarioFuncionamento,
                  horarioParsed: est.horarioParsed,
                  funcionamento24h: est.funcionamento24h,
                  atendeSUS: est.atendeSUS,
                  participaFarmaciaPopular: est.participaFarmaciaPopular,
                  distanciaKm: est.distanciaKm
                }), '*');
              } catch(e) { console.error(e); }
            }
          </script>
        </body>
        </html>
      `;

      return React.createElement('iframe', {
        srcDoc: htmlContent,
        style: { width: '100%', height: '100%', border: 'none' },
      });
    }

    // Fallback nativo simples (sem depender de libs instáveis se não configuradas)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e3eae1' }}>
        <Ionicons name="map" size={40} color={colors.primary} style={{ opacity: 0.5 }} />
        <Text style={{ fontFamily: 'PublicSans-Bold', color: colors.primary, marginTop: 8 }}>Mapa Ativo</Text>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Card SAMU — sempre visível */}
        <View style={[styles.samuCard, { marginHorizontal: px }]}>
          <View style={styles.samuTop}>
            <View style={styles.samuLeft}>
              <View style={styles.samuIconBox}>
                <Ionicons name="warning" size={22} color={colors.onTertiary} />
              </View>
              <View>
                <Text style={styles.samuSupra}>ATENDIMENTO URGENTE</Text>
                <Text style={styles.samuNumero}>🚑 SAMU: 192</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.samuBtn}
              onPress={() => Linking.openURL('tel:192')}
            >
              <Text style={styles.samuBtnText}>LIGAR{'\n'}AGORA</Text>
            </TouchableOpacity>
          </View>
          {upa && (
            <TouchableOpacity style={styles.upaRow} onPress={() => abrirMapa(upa)}>
              <Ionicons name="navigate" size={16} color={colors.onTertiary} />
              <Text style={styles.upaText}>
                UPA mais próxima: {upa.distanciaKm?.toFixed(1)}km
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Cabeçalho Contextual (se veio do clique de um remédio) */}
        {medNome && (
          <View style={[styles.contextoBox, { marginHorizontal: px }]}>
            <Ionicons name="search-circle" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contextoTitle}>
                Buscando onde encontrar: <Text style={{ fontFamily: 'PublicSans-Black' }}>{medNome}</Text>
              </Text>
              <Text style={styles.contextoAviso}>
                Lembrete: A disponibilidade depende do estoque presencial e não pode ser garantida pelo app. {contexto === 'sus' ? 'Leve receita + documento. Mostramos UBS, Farmácias Populares e UPA próximos.' : 'Ligue na farmácia para confirmar disponibilidade e preço.'}
              </Text>
            </View>
          </View>
        )}

        {/* Mapa Interativo ou Placeholder */}
        <View style={[styles.mapaPlaceholder, { marginHorizontal: px }]}>
          {renderMapaIntegrado()}
        </View>

        {/* LEGENDA DO MAPA */}
        <View style={{ marginHorizontal: px, flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              { cor: '#cb2b3e', label: 'Você' },
              { cor: '#006B3C', label: 'Farmácia Popular' },
              { cor: '#1565C0', label: 'Particular' },
              { cor: '#546E7A', label: 'SUS / UBS' },
            ].map(({ cor, label }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="location" size={16} color={cor} />
                <Text style={{ fontSize: 12, fontFamily: 'PublicSans-Bold', color: colors.onSurfaceVariant }}>{label}</Text>
              </View>
            ))}
        </View>

        {/* Lista de serviços */}
        <View style={[styles.listaSection, { paddingHorizontal: px }]}>
          <Text style={styles.listaTitle}>SERVIÇOS DISPONÍVEIS NA REGIÃO</Text>

          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Localizando estabelecimentos...</Text>
            </View>
          )}

          {erroLoc && !loading && (
            <View style={styles.erroBox}>
              <Ionicons name="location" size={40} color={colors.onSurfaceVariant} />
              <Text style={styles.erroText}>Precisamos da sua localização</Text>
              <TouchableOpacity style={styles.permBtn} onPress={solicitarLocalizacao}>
                <Text style={styles.permBtnText}>Permitir</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !erroLoc && estabelecimentosFiltrados.length === 0 && (
            <View style={styles.erroBox}>
              <Ionicons name="search" size={40} color={colors.onSurfaceVariant} />
              <Text style={styles.erroText}>Nenhum local correspondente encontrado nos arredores.</Text>
            </View>
          )}

          {!loading && !erroLoc && estabelecimentosFiltrados.slice(0, 15).map((est) => {
            const cor = COR_TIPO[est.tipo] || colors.primary;
            const tag = TAG_TIPO[est.tipo];
            const distText = est.distanciaKm !== undefined
              ? est.distanciaKm < 1
                ? `${(est.distanciaKm * 1000).toFixed(0)}m`
                : `${est.distanciaKm.toFixed(1)}km`
              : '';
            const horario = est.funcionamento24h
              ? '24 horas'
              : est.horarioFuncionamento || 'Seg–Sex 08h–17h';

            return (
              <TouchableOpacity
                key={est.id}
                style={styles.estabCard}
                onPress={() => setSelectedEst(est)}
                activeOpacity={0.85}
              >
                <View style={[styles.estabIcon, { backgroundColor: cor }]}>
                  <Ionicons name={est.tipo === 'UPA' ? 'alert-circle' : est.tipo === 'Farmacia' ? 'medkit' : 'medical-outline'} size={22} color="#FFFFFF" />
                </View>
                <View style={styles.estabInfo}>
                  <View style={styles.estabHeader}>
                    <Text style={styles.estabNome} numberOfLines={1}>{est.nome}</Text>
                    {distText ? <Text style={styles.estabDist}>{distText}</Text> : null}
                  </View>
                  {est.endereco.logradouro !== 'N/A' && (
                    <Text style={styles.estabEnd} numberOfLines={1}>
                      {est.endereco.logradouro}, {est.endereco.numero}
                    </Text>
                  )}
                  <View style={styles.estabHorarioRow}>
                    <Ionicons name={est.funcionamento24h ? 'moon' : 'time-outline'} size={12} color={est.funcionamento24h ? '#2aad27' : colors.onSurfaceVariant} />
                    <Text style={[styles.estabHorario, est.funcionamento24h && { color: '#2aad27' }]}>{horario}</Text>
                  </View>
                  {tag && (
                    <View style={[styles.estabTag, { backgroundColor: `${cor}22` }]}>
                      <Text style={[styles.estabTagText, { color: cor }]}>{tag}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.outline} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal de Detalhes do Estabelecimento */}
      <Modal
        visible={selectedEst !== null}
        transparent animationType="slide"
        onRequestClose={() => setSelectedEst(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedEst(null)} />
        {selectedEst && (() => {
          const isFP = selectedEst.participaFarmaciaPopular;
          const isSUS = selectedEst.atendeSUS || selectedEst.tipo === 'UBS' || selectedEst.tipo === 'UPA';
          
          const corHex = isFP ? '#006B3C' : isSUS ? '#546E7A' : '#1565C0';
          const iconName = selectedEst.tipo === 'Farmacia' ? 'medkit' : 'medical';
          
          let statusText = 'Consulte a farmácia';
          let statusColor = colors.onSurfaceVariant;
          if (selectedEst.horarioParsed) {
            if (selectedEst.horarioParsed.abertaAgora === true) {
              statusText = `Aberta agora · ${selectedEst.horarioParsed.textoHoje}`;
              statusColor = '#006B3C' as any;
            } else if (selectedEst.horarioParsed.abertaAgora === false) {
              statusText = `Fechada · ${selectedEst.horarioParsed.textoHoje}`;
              statusColor = '#cb2b3e' as any;
            } else {
              statusText = selectedEst.horarioParsed.textoHoje;
            }
          } else if (selectedEst.funcionamento24h) {
            statusText = 'Aberta 24 horas';
            statusColor = '#006B3C' as any;
          } else if (selectedEst.horarioFuncionamento) {
            statusText = selectedEst.horarioFuncionamento;
          }

          return (
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />

              <View style={[styles.modalIconRow]}>
                <View style={[styles.modalIcon, { backgroundColor: corHex }]}>
                  <Ionicons name={iconName} size={28} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalNome}>{selectedEst.nome}</Text>
                  <Text style={[styles.modalTipo, isFP && { color: '#006B3C', fontFamily: 'PublicSans-Bold'}]}>
                    {isFP ? 'Farmácia Popular – Remédios Gratuitos' : isSUS ? 'SUS / Rede Pública' : 'Farmácia Particular'}
                  </Text>
                </View>
              </View>

              <View style={styles.modalInfoBox}>
                <Ionicons name="location-outline" size={18} color={colors.onSurfaceVariant} />
                <Text style={styles.modalInfoText}>
                  {selectedEst.endereco.logradouro}, {selectedEst.endereco.numero}
                  {selectedEst.endereco.bairro ? ` — ${selectedEst.endereco.bairro}` : ''}
                  {selectedEst.endereco.municipio ? `, ${selectedEst.endereco.municipio}` : ''}
                </Text>
              </View>

              <View style={styles.modalInfoBox}>
                <Ionicons name="time-outline" size={18} color={statusColor as any} />
                <Text style={[styles.modalInfoText, { color: statusColor as any, fontFamily: statusColor === colors.onSurfaceVariant ? 'PublicSans-Regular' : 'PublicSans-Bold' }]}>{statusText}</Text>
              </View>

              {selectedEst.distanciaKm !== undefined && (
                <View style={styles.modalInfoBox}>
                  <Ionicons name="walk-outline" size={18} color={colors.onSurfaceVariant} />
                  <Text style={styles.modalInfoText}>
                    {selectedEst.distanciaKm < 1
                      ? `${(selectedEst.distanciaKm * 1000).toFixed(0)} metros de distância`
                      : `${selectedEst.distanciaKm.toFixed(1)} km de distância`}
                  </Text>
                </View>
              )}

              {/* Tabela CMED (se aplicável ao tipo Farmacia) */}
              {selectedEst.tipo === 'Farmacia' && !isSUS && (
                <View style={{ marginTop: spacing.sm }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                    {Object.values(TABELA_CMED_BASE).slice(0, 3).map((item, idx) => (
                      <View key={idx} style={{ backgroundColor: colors.surfaceContainer, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.outlineVariant }}>
                        <Text style={{ fontFamily: 'PublicSans-Medium', fontSize: 11, color: colors.onSurface }}>{item.nome}</Text>
                        <Text style={{ fontFamily: 'PublicSans-Black', fontSize: 13, color: colors.primary }}>até R$ {calcularPMC(item.pf, selectedEst.endereco.uf).toFixed(2).replace('.', ',')}</Text>
                      </View>
                    ))}
                  </ScrollView>
                  <Text style={{ fontFamily: 'PublicSans-Regular', fontSize: 10, color: colors.onSurfaceVariant, marginTop: 4 }}>Preços baseados no teto ANVISA · Valores reais podem ser menores</Text>
                </View>
              )}

              <View style={styles.modalBtns}>
                {selectedEst.telefone && (
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: '#2aad27' }]}
                    onPress={() => Linking.openURL(`tel:${selectedEst.telefone}`)}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.modalBtnText}>Ligar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: corHex, flex: 1 }]}
                  onPress={() => { abrirMapa(selectedEst); setSelectedEst(null); }}
                >
                  <Ionicons name="navigate" size={18} color="#fff" />
                  <Text style={styles.modalBtnText}>Como chegar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </Modal>

      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // SAMU
  samuCard: {
    backgroundColor: colors.tertiaryContainer,
    marginTop: spacing.xl,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    ...shadows.md,
  },
  samuTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  samuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  samuIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  samuSupra: { fontFamily: 'PublicSans-Bold', fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: 1.2 },
  samuNumero: { fontFamily: 'PublicSans-Black', fontSize: 20, color: colors.onTertiary, marginTop: 2 },
  samuBtn: {
    backgroundColor: colors.onTertiary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  samuBtnText: { fontFamily: 'PublicSans-Black', fontSize: 14, color: colors.tertiaryContainer, textAlign: 'center', lineHeight: 18 },
  upaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  upaText: { fontFamily: 'PublicSans-SemiBold', fontSize: 13, color: colors.onTertiary },

  // Contexto
  contextoBox: {
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  contextoTitle: { fontFamily: 'PublicSans-Medium', fontSize: 15, color: colors.onSurface, marginBottom: 2 },
  contextoAviso: { fontFamily: 'PublicSans-Regular', fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 16 },

  // Mapa placeholder
  mapaPlaceholder: {
    height: 200,
    backgroundColor: '#b8c9b0',
    marginTop: spacing.xl,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapaDots: { flexDirection: 'row', gap: spacing.xxl, alignItems: 'flex-end' },
  mapaMarcador: {
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    ...shadows.sm,
  },
  mapaMarcadorDestaque: { paddingHorizontal: spacing.md },
  mapaLabel: { fontFamily: 'PublicSans-Bold', fontSize: 11, color: '#FFFFFF', maxWidth: 80 },

  // Lista
  listaSection: { marginTop: spacing.xl },
  listaTitle: { fontFamily: 'PublicSans-Bold', fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: spacing.md },
  loadingBox: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.md },
  loadingText: { fontFamily: 'PublicSans-Medium', fontSize: 14, color: colors.onSurfaceVariant },
  erroBox: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.md },
  erroText: { fontFamily: 'PublicSans-Medium', fontSize: 16, color: colors.onSurfaceVariant, textAlign: 'center' },
  permBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md },
  permBtnText: { fontFamily: 'PublicSans-Bold', fontSize: 15, color: colors.onPrimary },

  estabCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  estabIcon: {
    width: 48, height: 48, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  estabInfo: { flex: 1, gap: 3 },
  estabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estabNome: { fontFamily: 'PublicSans-Bold', fontSize: 16, color: colors.onSurface, flex: 1 },
  estabDist: { fontFamily: 'PublicSans-Bold', fontSize: 14, color: colors.onSurfaceVariant },
  estabEnd: { fontFamily: 'PublicSans-Regular', fontSize: 13, color: colors.onSurfaceVariant },
  estabTag: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  estabTagText: { fontFamily: 'PublicSans-Black', fontSize: 9, letterSpacing: 1.2 },
  estabHorarioRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  estabHorario: { fontFamily: 'PublicSans-Regular', fontSize: 12, color: colors.onSurfaceVariant },

  // Modal Bottom Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    paddingBottom: 36,
    gap: spacing.md,
    ...shadows.md,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center', marginBottom: spacing.sm,
  },
  modalIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  modalIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalNome: { fontFamily: 'PublicSans-Black', fontSize: 18, color: colors.onSurface, lineHeight: 22 },
  modalTipo: { fontFamily: 'PublicSans-Medium', fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
  modalInfoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  modalInfoText: { flex: 1, fontFamily: 'PublicSans-Regular', fontSize: 14, color: colors.onSurface, lineHeight: 20 },
  modalBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: radius.full, minWidth: 100,
  },
  modalBtnText: { fontFamily: 'PublicSans-Bold', fontSize: 15, color: '#fff' },
});
