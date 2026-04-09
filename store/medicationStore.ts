import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MedicacaoEmUso, Medicamento } from '../types';

interface MedicationState {
  medicacoes: MedicacaoEmUso[];
  addMedicacao: (medicacao: MedicacaoEmUso) => void;
  removeMedicacao: (id: string) => void;
  updateEstoque: (id: string, quantidade: number) => void;
  toggleNotificacoes: (id: string) => void;
  calcularProximaDose: (medicacaoId: string) => string | null;
  getMedicacoesComEstoqueBaixo: () => MedicacaoEmUso[];
  carregarMedicacoes: () => Promise<void>;
}

function calcularDiasRestantes(estoque: number, horarios: string[]): number {
  const dosesPerDay = horarios.length;
  if (!dosesPerDay) return 0;
  return Math.floor(estoque / dosesPerDay);
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medicacoes: [],

  addMedicacao: async (medicacao) => {
    const comDiasRestantes: MedicacaoEmUso = {
      ...medicacao,
      diasRestantes: medicacao.estoque
        ? calcularDiasRestantes(medicacao.estoque, medicacao.horarios)
        : undefined,
    };
    set((state) => ({ medicacoes: [...state.medicacoes, comDiasRestantes] }));
    await AsyncStorage.setItem('medicacoes', JSON.stringify(get().medicacoes));
  },

  removeMedicacao: async (id) => {
    set((state) => ({ medicacoes: state.medicacoes.filter((m) => m.id !== id) }));
    await AsyncStorage.setItem('medicacoes', JSON.stringify(get().medicacoes));
  },

  updateEstoque: async (id, quantidade) => {
    set((state) => ({
      medicacoes: state.medicacoes.map((m) =>
        m.id === id
          ? {
              ...m,
              estoque: quantidade,
              diasRestantes: calcularDiasRestantes(quantidade, m.horarios),
            }
          : m
      ),
    }));
    await AsyncStorage.setItem('medicacoes', JSON.stringify(get().medicacoes));
  },

  toggleNotificacoes: async (id) => {
    set((state) => ({
      medicacoes: state.medicacoes.map((m) =>
        m.id === id ? { ...m, notificacoesAtivas: !m.notificacoesAtivas } : m
      ),
    }));
    await AsyncStorage.setItem('medicacoes', JSON.stringify(get().medicacoes));
  },

  calcularProximaDose: (medicacaoId) => {
    const medicacao = get().medicacoes.find((m) => m.id === medicacaoId);
    if (!medicacao?.horarios.length) return null;
    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();

    const proximos = medicacao.horarios
      .map((h) => {
        const [hh, mm] = h.split(':').map(Number);
        const minutos = hh * 60 + mm;
        return { horario: h, diff: minutos > horaAtual ? minutos - horaAtual : 1440 - (horaAtual - minutos) };
      })
      .sort((a, b) => a.diff - b.diff);

    if (!proximos.length) return null;
    const { diff, horario } = proximos[0];
    if (diff < 60) return `em ${diff} min (${horario})`;
    return `às ${horario}`;
  },

  getMedicacoesComEstoqueBaixo: () => {
    return get().medicacoes.filter((m) => {
      if (!m.estoque || !m.alertaEstoqueMinimo) return false;
      return m.estoque <= m.alertaEstoqueMinimo;
    });
  },

  carregarMedicacoes: async () => {
    try {
      const raw = await AsyncStorage.getItem('medicacoes');
      if (raw) set({ medicacoes: JSON.parse(raw) });
    } catch {
      // Silencia
    }
  },
}));
