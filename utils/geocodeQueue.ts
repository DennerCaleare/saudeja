import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class GeocodeQueue {
  private queue: Array<{endereco: string, resolve: Function}> = [];
  private processing = false;

  async geocodificar(logradouro: string, municipio: string, uf: string): Promise<{lat: number, lon: number} | null> {
    const qEndereco = `${logradouro}, ${municipio}, ${uf}, Brasil`;
    const cacheKey = `geocode_${qEndereco}`.toLowerCase();
    
    // Tenta cache primeiro
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {} // Se der erro no asyncstorage (ex: web ssr), ignora e faz o fetch
    
    // Coloca na fila
    return new Promise(resolve => {
      this.queue.push({ 
        endereco: qEndereco,
        resolve 
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;
      
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(item.endereco)}&format=json&limit=1&countrycodes=br`;
        
        // Uso de fetch vanilla (compatível nativamente no ReactNative e mockável em testes)
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        
        const res = await fetch(url, {
          headers: { 'User-Agent': 'PoupaRemedioApp/1.0 (contato@pouparemedio.app)' },
          signal: controller.signal
        });
        clearTimeout(timer);
        
        if (!res.ok) {
          item.resolve(null);
        } else {
          const json = await res.json();
          const coords = json[0]
            ? { lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) }
            : null;
            
          if (coords) {
            const cacheKey = `geocode_${item.endereco}`.toLowerCase();
            await AsyncStorage.setItem(cacheKey, JSON.stringify(coords)).catch(() => {});
          }
          
          item.resolve(coords);
        }
      } catch {
        item.resolve(null);
      }
      
      // Rate limit: aguarda 1.1s antes da próxima chamada. Política severa do OSM.
      await new Promise(r => setTimeout(r, 1100));
    }
    
    this.processing = false;
  }
}

export const geocodeQueue = new GeocodeQueue();
