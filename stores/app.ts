import _ from 'lodash';
import { defineStore } from 'pinia';
import { type AppState, type Model, type ModelType, type Combination, type User, MODEL_TYPES } from '@/types';
import { loadAppState, saveModel, deleteModel as deleteModelFromDb, saveCombination, deleteCombination, saveModels } from '@/stores/storage';

export const useAppStore = defineStore('app', {
  state: (): AppState => {
    return {
      models: [] as Model[],
      combinations: [] as Combination[],
      loading: true,
      selectedModel: null as Model,
      searchQuery: '',
      selectedTags: [] as string[],
      isDarkMode: true,
      user: null as User,
    };
  },

  getters: {
    allTags: (state) => {
      const tags = new Set<string>();
      state.models.forEach((m) => m.tags?.forEach((t) => tags.add(t)));
      return Array.from(tags).sort();
    },

    checkpoints: (state): Model[] => {
      return _.filter(state.models, { type: 'Checkpoint' });
    },
    clips: (state): Model[] => {
      return _.filter(state.models, { type: 'CLIP' });
    },
    clipembeds: (state): Model[] => {
      return _.filter(state.models, { type: 'CLIPEmbed' });
    },
    clipvisions: (state): Model[] => {
      return _.filter(state.models, { type: 'CLIPVision' });
    },
    controlnets: (state): Model[] => {
      return _.filter(state.models, { type: 'ControlNet' });
    },
    embeddings: (state): Model[] => {
      return _.filter(state.models, { type: 'Embedding' });
    },
    ipadapters: (state): Model[] => {
      return _.filter(state.models, { type: 'IPAdapter' });
    },
    loras: (state): Model[] => {
      return _.filter(state.models, { type: 'Checkpoint' });
    },
    textencoders: (state): Model[] => {
      return _.filter(state.models, { type: 'TextEncoder' });
    },
    vaes: (state): Model[] => {
      return _.filter(state.models, { type: 'VAE' });
    },
  },

  actions: {
    async initialize() {
      try {
        const appState = await loadAppState();
        this.models = appState.models;
        this.combinations = appState.combinations;
      } catch (e) {
        console.error('Failed to load IndexedDB', e);
      } finally {
        this.loading = false;
      }

      // Theme initialization
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

      this.isDarkMode = shouldBeDark;
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Auth initialization
      const storedUser = localStorage.getItem('user_session');
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
        } catch (e) {
          localStorage.removeItem('user_session');
        }
      }
    },

    toggleTheme() {
      this.isDarkMode = !this.isDarkMode;
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    },

    setUser(newUser: User | null) {
      this.user = newUser;
      if (newUser) {
        localStorage.setItem('user_session', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('user_session');
      }
    },

    async updateModel(updatedModel: Model) {
      const index = this.models.findIndex((m) => m.id === updatedModel.id);
      if (index !== -1) {
        this.models[index] = updatedModel;
      }
      this.selectedModel = updatedModel;

      try {
        await saveModel(updatedModel);
      } catch (e) {
        console.error('Failed to save model', e);
      }
    },

    async deleteModel(modelId: string) {
      if (confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
        this.models = this.models.filter((m) => m.id !== modelId);

        if (this.selectedModel?.id === modelId) {
          this.selectedModel = null;
        }

        await deleteModelFromDb(modelId);
      }
    },

    async addModel(model: Model) {
      this.models = [model, ...this.models];
      this.selectedModel = model;
      await saveModel(model);
    },

    async importModels(importedModels: Model[]) {
      this.models = [...this.models, ...importedModels];
      await saveModels(importedModels);
    },

    async updateCombination(combo: Combination) {
      const exists = this.combinations.some((c) => c.id === combo.id);

      if (exists) {
        const index = this.combinations.findIndex((c) => c.id === combo.id);
        if (index !== -1) {
          this.combinations[index] = combo;
        }
      } else {
        this.combinations = [...this.combinations, combo];
      }

      await saveCombination(combo);
    },

    async removeCombination(id: string) {
      this.combinations = this.combinations.filter((c) => c.id !== id);
      await deleteCombination(id);
    },

    toggleTag(tag: string) {
      if (this.selectedTags.includes(tag)) {
        this.selectedTags = this.selectedTags.filter((t) => t !== tag);
      } else {
        this.selectedTags = [...this.selectedTags, tag];
      }
    },
  },
});
