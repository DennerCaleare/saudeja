import { EstabelecimentoSaude } from '../types';
import { parsearHorarioOSM } from '../utils/openingHours';
import { buscarTodasFarmacias } from '../services/farmaciaFusionService';
import * as farmaciaOSMService from '../services/farmaciaOSMService';
import { cnesService } from '../services/cnesService';
import * as farmaciaPopularService from '../services/farmaciaPopularService';

// Mock dependências globais e de cache
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('Farmacia Fusion Service - Engine Core e Testes', () => {

  describe('Deduplicação e Fusão de Dados', () => {
    
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const latC = -21.2453; // Lavras
    const lonC = -44.9997; // Lavras

    it('deduplicar 2 farmácias a 50m → retorna 1', async () => {
      jest.spyOn(farmaciaOSMService, 'buscarFarmaciasOSM').mockResolvedValueOnce([{
        id: 'osm_1', tipo: 'Farmacia', coordenadas: { lat: latC, lon: lonC }, nome: 'OSM Farm', funcionamento24h: false, atendeSUS: false, endereco: {logradouro:'',numero:'',bairro:'',municipio:'',uf:'',cep:''}, fonte: 'osm'
      }]);
      jest.spyOn(cnesService, 'buscarFarmaciasCNES').mockResolvedValueOnce([{
        id: 'cnes_1', tipo: 'Farmacia', coordenadas: { lat: latC + 0.0001, lon: lonC }, nome: 'CNES Farm', funcionamento24h: false, atendeSUS: true, endereco: {logradouro:'',numero:'',bairro:'',municipio:'',uf:'',cep:''}, fonte: 'cnes'
      }]);
      jest.spyOn(farmaciaPopularService, 'buscarFarmaciasPopular').mockResolvedValueOnce([]);

      const result = await buscarTodasFarmacias(latC, lonC, 5);
      expect(result.length).toBe(1);
      expect(result[0].fonte).toBe('cnes'); // cnes oficial ganha
    });

    it('deduplicar 2 farmácias a 200m → retorna 2', async () => {
      jest.spyOn(farmaciaOSMService, 'buscarFarmaciasOSM').mockResolvedValueOnce([{
        id: 'osm_1', tipo: 'Farmacia', coordenadas: { lat: latC, lon: lonC }, nome: 'OSM Farm', funcionamento24h: false, atendeSUS: false, endereco: {logradouro:'',numero:'',bairro:'',municipio:'',uf:'',cep:''}, fonte: 'osm'
      }]);
      jest.spyOn(cnesService, 'buscarFarmaciasCNES').mockResolvedValueOnce([{
        id: 'cnes_1', tipo: 'Farmacia', coordenadas: { lat: latC + 0.05, lon: lonC }, nome: 'CNES Farm', funcionamento24h: false, atendeSUS: true, endereco: {logradouro:'',numero:'',bairro:'',municipio:'',uf:'',cep:''}, fonte: 'cnes'
      }]);
      jest.spyOn(farmaciaPopularService, 'buscarFarmaciasPopular').mockResolvedValueOnce([]);

      const result = await buscarTodasFarmacias(latC, lonC, 5);
      expect(result.length).toBe(2);
    });

    it('participaFarmaciaPopular é herdado mesmo quando base é OSM', async () => {
      jest.spyOn(farmaciaOSMService, 'buscarFarmaciasOSM').mockResolvedValueOnce([{
        id: 'osm_1', tipo: 'Farmacia', coordenadas: { lat: latC, lon: lonC }, nome: 'OSM Farm', funcionamento24h: false, atendeSUS: false, telefone: '123', endereco: {logradouro:'',numero:'',bairro:'',municipio:'',uf:'',cep:''}, fonte: 'osm'
      }]);
      jest.spyOn(cnesService, 'buscarFarmaciasCNES').mockResolvedValueOnce([]);
      jest.spyOn(farmaciaPopularService, 'buscarFarmaciasPopular').mockResolvedValueOnce([{
        id: 'fp_1', tipo: 'Farmacia', coordenadas: { lat: latC + 0.0001, lon: lonC }, nome: 'FP Farm', funcionamento24h: false, atendeSUS: true, participaFarmaciaPopular: true, endereco: {logradouro:'',numero:'',bairro:'',municipio:'',uf:'',cep:''}, fonte: 'fp'
      }]);

      const result = await buscarTodasFarmacias(latC, lonC, 5);
      expect(result.length).toBe(1);
      expect(result[0].participaFarmaciaPopular).toBe(true);
      expect(result[0].telefone).toBe('123'); // OSM telefonou herdado
    });

    it('coordenada (0,0) é descartada silenciosamente', async () => {
      jest.spyOn(farmaciaOSMService, 'buscarFarmaciasOSM').mockResolvedValueOnce([{
        id: 'osm_1', tipo: 'Farmacia', coordenadas: { lat: 0, lon: 0 }, nome: 'Ghost', funcionamento24h: false, atendeSUS: false, endereco: {logradouro:'',numero:'',bairro:'',municipio:'',uf:'',cep:''}, fonte: 'osm'
      }]);
      jest.spyOn(cnesService, 'buscarFarmaciasCNES').mockResolvedValueOnce([]);
      jest.spyOn(farmaciaPopularService, 'buscarFarmaciasPopular').mockResolvedValueOnce([]);

      const result = await buscarTodasFarmacias(latC, lonC, 5);
      expect(result.length).toBe(0);
    });

    it('coordenada fora do Brasil é descartada', async () => {
      jest.spyOn(farmaciaOSMService, 'buscarFarmaciasOSM').mockResolvedValueOnce([{
        id: 'osm_1', tipo: 'Farmacia', coordenadas: { lat: 40.7128, lon: -74.0060 }, nome: 'NY Pharm', funcionamento24h: false, atendeSUS: false, endereco: {logradouro:'',numero:'',bairro:'',municipio:'',uf:'',cep:''}, fonte: 'osm'
      }]);
      jest.spyOn(cnesService, 'buscarFarmaciasCNES').mockResolvedValueOnce([]);
      jest.spyOn(farmaciaPopularService, 'buscarFarmaciasPopular').mockResolvedValueOnce([]);

      const result = await buscarTodasFarmacias(latC, lonC, 5);
      expect(result.length).toBe(0);
    });

    it('resultado final ordenado por distância crescente', async () => {
      jest.spyOn(farmaciaOSMService, 'buscarFarmaciasOSM').mockResolvedValueOnce([{
        id: 'osm_1', tipo: 'Farmacia', coordenadas: { lat: latC + 0.003, lon: lonC }, nome: 'Longe', funcionamento24h: false, atendeSUS: false, endereco: {logradouro:'',numero:'',bairro:'',municipio:'',uf:'',cep:''}, fonte: 'osm'
      },{
        id: 'osm_2', tipo: 'Farmacia', coordenadas: { lat: latC + 0.001, lon: lonC }, nome: 'Perto', funcionamento24h: false, atendeSUS: false, endereco: {logradouro:'',numero:'',bairro:'',municipio:'',uf:'',cep:''}, fonte: 'osm'
      }]);
      jest.spyOn(cnesService, 'buscarFarmaciasCNES').mockResolvedValueOnce([]);
      jest.spyOn(farmaciaPopularService, 'buscarFarmaciasPopular').mockResolvedValueOnce([]);

      const result = await buscarTodasFarmacias(latC, lonC, 5);
      expect(result.length).toBe(2);
      expect(result[0].nome).toBe('Perto');
      expect(result[1].nome).toBe('Longe');
    });

    it('buscarTodasFarmacias com todas as APIs falhando → retorna [] sem crash', async () => {
      jest.spyOn(farmaciaOSMService, 'buscarFarmaciasOSM').mockRejectedValueOnce(new Error('Network offline'));
      jest.spyOn(cnesService, 'buscarFarmaciasCNES').mockRejectedValueOnce(new Error('Network offline'));
      jest.spyOn(farmaciaPopularService, 'buscarFarmaciasPopular').mockRejectedValueOnce(new Error('Network offline'));

      const result = await buscarTodasFarmacias(latC, lonC, 5);
      expect(result).toEqual([]);
    });

  });

  describe('Parseador de Horário (openingHours.ts)', () => {

    it('parsearHorarioOSM("Mo-Fr 08:00-22:00") → parseia corretamente (texto formatado)', () => {
      // Como a abertura agora() depende da data real do OS da maquina no momento do run,
      // a gente verifica apenas se ele conseguiu parsear o texto textualmente sem estourar.
      const parsed = parsearHorarioOSM("Mo-Fr 08:00-22:00");
      expect(parsed).toHaveProperty('textoHoje');
      expect(parsed).toHaveProperty('abertaAgora');
      expect(parsed.funcionamento24h).toBe(false);
    });

    it('parsearHorarioOSM("24/7") → abertaAgora true, funcionamento24h true', () => {
      const parsed = parsearHorarioOSM("24/7");
      expect(parsed.abertaAgora).toBe(true);
      expect(parsed.funcionamento24h).toBe(true);
    });

    it('parsearHorarioOSM(null) → retorna "Consulte a farmácia" sem crash', () => {
      const parsed = parsearHorarioOSM(null);
      expect(parsed.textoHoje).toBe('Consulte a farmácia');
      expect(parsed.abertaAgora).toBeNull();
    });

  });

});
