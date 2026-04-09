import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@medicamentos_cmed';
// Simulando uma URL de S3 ou GitHub Gist contendo o JSON Oficial Completo.
const CLOUD_URL = 'https://raw.githubusercontent.com/yod-io/saudeja-cloud/main/bulario_completo.json';

// Carga Inicial Embutida para garantir o funcionamento offline na 1ª vez se não houver internet (ou URL falhar):
const CARGA_INICIAL = [
  { id: "1", nome: "Neosaldina", principioAtivo: "Dipirona + Isometepteno + Cafeina", classeTerapeutica: "Analgésico", laboratorio: "Takeda" },
  { id: "2", nome: "Dorflex", principioAtivo: "Dipirona + Orfenadrina + Cafeina", classeTerapeutica: "Relaxante Muscular", laboratorio: "Sanofi" },
  { id: "3", nome: "Tylenol", principioAtivo: "Paracetamol", classeTerapeutica: "Analgésico", laboratorio: "Janssen" },
  { id: "4", nome: "Amoxicilina", principioAtivo: "Amoxicilina", classeTerapeutica: "Antibiótico", laboratorio: "Genérico" },
  { id: "5", nome: "Roacutan", principioAtivo: "Isotretinoina", classeTerapeutica: "Dermatológico", laboratorio: "Roche" },
  { id: "6", nome: "Azitromicina", principioAtivo: "Azitromicina", classeTerapeutica: "Antibiótico", laboratorio: "Genérico" },
  { id: "7", nome: "Rivotril", principioAtivo: "Clonazepam", classeTerapeutica: "Ansiolítico", laboratorio: "Roche" },
  { id: "8", nome: "Xarelto", principioAtivo: "Rivaroxabana", classeTerapeutica: "Anticoagulante", laboratorio: "Bayer" },
  { id: "9", nome: "Glifage", principioAtivo: "Metformina", classeTerapeutica: "Antidiabético", laboratorio: "Merck" },
  { id: "10", nome: "Avamys", principioAtivo: "Fluticasona", classeTerapeutica: "Corticoide Nasal", laboratorio: "GSK" },
  { id: "11", nome: "Nebacetin", principioAtivo: "Neomicina + Bacitracina", classeTerapeutica: "Antibiótico Tópico", laboratorio: "Takeda" },
  { id: "12", nome: "Cataflam", principioAtivo: "Diclofenaco", classeTerapeutica: "Anti-inflamatório", laboratorio: "Novartis" },
  { id: "13", nome: "Nimesulida", principioAtivo: "Nimesulida", classeTerapeutica: "Anti-inflamatório", laboratorio: "Genérico" },
  { id: "14", nome: "Ibuprofeno", principioAtivo: "Ibuprofeno", classeTerapeutica: "Anti-inflamatório", laboratorio: "Genérico" },
  { id: "15", nome: "Buscopan", principioAtivo: "Escopolamina", classeTerapeutica: "Antiespasmódico", laboratorio: "Boehringer" },
  { id: "16", nome: "Salonpas", principioAtivo: "Salicilato de Metila", classeTerapeutica: "Analgésico Tópico", laboratorio: "Hisamitsu" },
  { id: "17", nome: "Allegra", principioAtivo: "Fexofenadina", classeTerapeutica: "Antialérgico", laboratorio: "Sanofi" },
  { id: "18", nome: "Polaramine", principioAtivo: "Dexclorfeniramina", classeTerapeutica: "Antialérgico", laboratorio: "Mantecorp" },
  { id: "19", nome: "Loratadina", principioAtivo: "Loratadina", classeTerapeutica: "Antialérgico", laboratorio: "Genérico" },
  { id: "20", nome: "Viagra", principioAtivo: "Sildenafila", classeTerapeutica: "Vasodilatador", laboratorio: "Pfizer" },
  { id: "21", nome: "Cialis", principioAtivo: "Tadalafila", classeTerapeutica: "Vasodilatador", laboratorio: "Eli Lilly" },
  { id: "22", nome: "Losartana", principioAtivo: "Losartana Potássica", classeTerapeutica: "Anti-hipertensivo", laboratorio: "Genérico" },
  { id: "23", nome: "Omeprazol", principioAtivo: "Omeprazol", classeTerapeutica: "Protetor Gástrico", laboratorio: "Genérico" },
  { id: "24", nome: "Puran T4", principioAtivo: "Levotiroxina Sódica", classeTerapeutica: "Hormônio Tireoidiano", laboratorio: "Sanofi" },
  { id: "25", nome: "AAS", principioAtivo: "Ácido Acetilsalicílico", classeTerapeutica: "Antiagregante Plaquetário", laboratorio: "Sanofi" },
  { id: "26", nome: "Atenolol", principioAtivo: "Atenolol", classeTerapeutica: "Betabloqueador", laboratorio: "Genérico" },
  { id: "27", nome: "Enalapril", principioAtivo: "Maleato de Enalapril", classeTerapeutica: "Anti-hipertensivo", laboratorio: "Genérico" },
  { id: "28", nome: "Hidroclorotiazida", principioAtivo: "Hidroclorotiazida", classeTerapeutica: "Diurético", laboratorio: "Genérico" },
  { id: "29", nome: "Sinvastatina", principioAtivo: "Sinvastatina", classeTerapeutica: "Hipolipemiante", laboratorio: "Genérico" },
  { id: "30", nome: "Pantoprazol", principioAtivo: "Pantoprazol", classeTerapeutica: "Protetor Gástrico", laboratorio: "Genérico" },
  { id: "31", nome: "Escitalopram", principioAtivo: "Oxalato de Escitalopram", classeTerapeutica: "Antidepressivo", laboratorio: "Genérico" },
  { id: "32", nome: "Lexapro", principioAtivo: "Oxalato de Escitalopram", classeTerapeutica: "Antidepressivo", laboratorio: "Lundbeck" },
  { id: "33", nome: "Sertralina", principioAtivo: "Cloridrato de Sertralina", classeTerapeutica: "Antidepressivo", laboratorio: "Genérico" },
  { id: "34", nome: "Zoloft", principioAtivo: "Cloridrato de Sertralina", classeTerapeutica: "Antidepressivo", laboratorio: "Pfizer" },
  { id: "35", nome: "Venvanse", principioAtivo: "Lisdexanfetamina", classeTerapeutica: "Estimulante do SNC", laboratorio: "Takeda" },
  { id: "36", nome: "Ritalina", principioAtivo: "Metilfenidato", classeTerapeutica: "Estimulante do SNC", laboratorio: "Novartis" },
  { id: "37", nome: "Concerta", principioAtivo: "Metilfenidato", classeTerapeutica: "Estimulante do SNC", laboratorio: "Janssen" },
  { id: "38", nome: "Ozempic", principioAtivo: "Semaglutida", classeTerapeutica: "Antidiabético / Emagrecedor", laboratorio: "Novo Nordisk" },
  { id: "39", nome: "Wegovy", principioAtivo: "Semaglutida", classeTerapeutica: "Emagrecedor", laboratorio: "Novo Nordisk" },
  { id: "40", nome: "Saxenda", principioAtivo: "Liraglutida", classeTerapeutica: "Emagrecedor", laboratorio: "Novo Nordisk" },
  { id: "41", nome: "Diane 35", principioAtivo: "Ciproterona + Etinilestradiol", classeTerapeutica: "Anticoncepcional", laboratorio: "Bayer" },
  { id: "42", nome: "Selene", principioAtivo: "Ciproterona + Etinilestradiol", classeTerapeutica: "Anticoncepcional", laboratorio: "Eurofarma" },
  { id: "43", nome: "Yaz", principioAtivo: "Drospirenona + Etinilestradiol", classeTerapeutica: "Anticoncepcional", laboratorio: "Bayer" },
  { id: "44", nome: "Microvlar", principioAtivo: "Levonorgestrel + Etinilestradiol", classeTerapeutica: "Anticoncepcional", laboratorio: "Bayer" },
  { id: "45", nome: "Torsilax", principioAtivo: "Diclofenaco + Carisoprodol + Paracetamol + Cafeina", classeTerapeutica: "Relaxante Muscular", laboratorio: "Neo Química" },
  { id: "46", nome: "Mioflex A", principioAtivo: "Carisoprodol + Fenilbutazona + Paracetamol", classeTerapeutica: "Relaxante Muscular", laboratorio: "Farmoquímica" },
  { id: "47", nome: "Tandrilax", principioAtivo: "Diclofenaco + Carisoprodol + Paracetamol + Cafeina", classeTerapeutica: "Relaxante Muscular", laboratorio: "Aché" },
  { id: "48", nome: "Diprosalic", principioAtivo: "Betametasona + Ácido Salicílico", classeTerapeutica: "Dermatológico", laboratorio: "Mantecorp" },
  { id: "49", nome: "Novalgina", principioAtivo: "Dipirona", classeTerapeutica: "Analgésico", laboratorio: "Sanofi" },
  { id: "50", nome: "Cefalexina", principioAtivo: "Cefalexina", classeTerapeutica: "Antibiótico", laboratorio: "Genérico" },
  { id: "51", nome: "Lírica", principioAtivo: "Pregabalina", classeTerapeutica: "Anticonvulsivante / Dor Neuropática", laboratorio: "Pfizer" },
  { id: "52", nome: "Pregabalina", principioAtivo: "Pregabalina", classeTerapeutica: "Anticonvulsivante / Dor Neuropática", laboratorio: "Genérico" },
  { id: "53", nome: "Zolpidem", principioAtivo: "Hemitartarato de Zolpidem", classeTerapeutica: "Hipnótico (Insônia)", laboratorio: "Genérico" },
  { id: "54", nome: "Stilnox", principioAtivo: "Hemitartarato de Zolpidem", classeTerapeutica: "Hipnótico (Insônia)", laboratorio: "Sanofi" },
  { id: "55", nome: "Fluoxetina", principioAtivo: "Cloridrato de Fluoxetina", classeTerapeutica: "Antidepressivo", laboratorio: "Genérico" },
  { id: "56", nome: "Daflon", principioAtivo: "Diosmina + Hesperidina", classeTerapeutica: "Vasoprotetor", laboratorio: "Servier" }
];

export const syncService = {
  /**
   * Baixa a base da Nuvem (ex: AWS S3 ou Github) e salva no dispositivo.
   */
  async sincronizarDaNuvem(): Promise<boolean> {
    try {
      console.log('🔄 Iniciando download da base da rede...');
      // Faz o fetch sem bloqueio de WAF/CORS (pois roda nativo)
      const response = await fetch(CLOUD_URL, {
        headers: { 'Cache-Control': 'no-cache' } // Pega sempre o mais recente
      });
      
      if (!response.ok) {
        throw new Error('Falha ao baixar da nuvem. Código: ' + response.status);
      }

      const dadosRede = await response.json();

      if (dadosRede && Array.isArray(dadosRede) && dadosRede.length > 0) {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(dadosRede));
        console.log(`✅ Base baixada: ${dadosRede.length} medicamentos syncados!`);
        return true;
      }
      return false;
    } catch (error) {
      console.log('☁️ Nuvem temporariamente inacessível. Usando base local (Cache). Error:', error);
      return false;
    }
  },

  /**
   * Carrega os dados offline. Se não existir, popula com os embutidos básicos.
   */
  async carregarDoDispositivo(): Promise<any[]> {
    try {
      const dbStr = await AsyncStorage.getItem(CACHE_KEY);
      if (dbStr) {
        return JSON.parse(dbStr);
      }
      // Se for a absoluta primeira vez instalando o app sem internet alguma:
      return CARGA_INICIAL;
    } catch (e) {
      return CARGA_INICIAL;
    }
  },

  /**
   * Processo Completo: Tenta carregar do HD e já dispara a sincronozação da Rede para a próxima.
   */
  async getBaseCompleta(): Promise<any[]> {
    // Para não travar a abertura, retornamos o armazenamento local imediatamente...
    const dadosMemoria = await this.carregarDoDispositivo();
    
    // ...enquanto aciona a nuvem silenciosamente em Background.
    this.sincronizarDaNuvem();

    return dadosMemoria;
  }
};
