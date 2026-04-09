import AsyncStorage from '@react-native-async-storage/async-storage';
import { EstabelecimentoSaude } from '../types';

// Nível 1 — Memória (durante a sessão aberta)
const memoriaCache = new Map<string, { data: EstabelecimentoSaude[]; ts: number }>();
const TTL_MEMORIA = 5 * 60 * 1000;  // 5 minutos

// Nível 2 — AsyncStorage (entre sessões)
const TTL_STORAGE = 24 * 60 * 60 * 1000;  // 24 horas

function chave(lat: number, lon: number, raio: number): string {
  // Arredonda para 2 casas decimais (~1.1km quadrados de "espaço de cache")
  return `farm_${lat.toFixed(2)}_${lon.toFixed(2)}_${raio}`;
}

export async function getCacheFarmacias(lat: number, lon: number, raio: number): Promise<EstabelecimentoSaude[] | null> {
  const k = chave(lat, lon, raio);

  // Tenta memória
  const mem = memoriaCache.get(k);
  if (mem && Date.now() - mem.ts < TTL_MEMORIA) return mem.data;

  // Tenta storage
  try {
    const raw = await AsyncStorage.getItem(k);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL_STORAGE) {
      AsyncStorage.removeItem(k).catch(() => {});
      return null;
    }
    memoriaCache.set(k, { data, ts });
    return data;
  } catch { 
    return null; 
  }
}

export async function setCacheFarmacias(lat: number, lon: number, raio: number, farmacias: EstabelecimentoSaude[]): Promise<void> {
  const k = chave(lat, lon, raio);
  const payload = { data: farmacias, ts: Date.now() };
  memoriaCache.set(k, payload);
  await AsyncStorage.setItem(k, JSON.stringify(payload)).catch(() => {});
}

export async function clearCacheFarmacias(): Promise<void> {
  memoriaCache.clear();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mapKeys = keys.filter(k => k.startsWith('farm_'));
    if (mapKeys.length > 0) {
      await AsyncStorage.multiRemove(mapKeys);
    }
  } catch {}
}
