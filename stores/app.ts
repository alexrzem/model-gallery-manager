import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AppState, Model, Combination, User } from '../types';
import { loadAppState, saveModel, deleteModel as deleteModelFromDb, saveCombination, deleteCombination, saveModels } from '../services/storage';

export const useAppStore = defineStore('app', () => {
  const models = ref<Model[]>([]);
  const combinations = ref<Combination[]>([]);
  const loading = ref(true);
  const selectedModel = ref<Model | null>(null);
  const searchQuery = ref('');
  const selectedTags = ref<string[]>([]);
  const isDarkMode = ref(true);
  const user = ref<User | null>(null);

  // Computed
  const allTags = computed(() => {
    const tags = new Set<string>();
    models.value.forEach(m => m.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  });

  // Actions
  async function initialize() {
    try {
      const appState = await loadAppState();
      models.value = appState.models;
      combinations.value = appState.combinations;
    } catch (e) {
      console.error("Failed to load IndexedDB", e);
    } finally {
      loading.value = false;
    }

    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    isDarkMode.value = shouldBeDark;
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Auth initialization
    const storedUser = localStorage.getItem('user_session');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (e) {
        localStorage.removeItem('user_session');
      }
    }
  }

  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value;
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
  }

  function setUser(newUser: User | null) {
    user.value = newUser;
    if (newUser) {
      localStorage.setItem('user_session', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user_session');
    }
  }

  async function updateModel(updatedModel: Model) {
    const index = models.value.findIndex(m => m.id === updatedModel.id);
    if (index !== -1) {
      models.value[index] = updatedModel;
    }
    selectedModel.value = updatedModel;

    try {
      await saveModel(updatedModel);
    } catch (e) {
      console.error("Failed to save model", e);
    }
  }

  async function deleteModel(modelId: string) {
    if (confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      models.value = models.value.filter(m => m.id !== modelId);
      
      if (selectedModel.value?.id === modelId) {
        selectedModel.value = null;
      }

      await deleteModelFromDb(modelId);
    }
  }

  async function addModel(model: Model) {
    models.value = [model, ...models.value];
    selectedModel.value = model;
    await saveModel(model);
  }

  async function importModels(importedModels: Model[]) {
    models.value = [...models.value, ...importedModels];
    await saveModels(importedModels);
  }

  async function updateCombination(combo: Combination) {
    const exists = combinations.value.some(c => c.id === combo.id);
    
    if (exists) {
      const index = combinations.value.findIndex(c => c.id === combo.id);
      if (index !== -1) {
        combinations.value[index] = combo;
      }
    } else {
      combinations.value = [...combinations.value, combo];
    }
    
    await saveCombination(combo);
  }

  async function removeCombination(id: string) {
    combinations.value = combinations.value.filter(c => c.id !== id);
    await deleteCombination(id);
  }

  function toggleTag(tag: string) {
    if (selectedTags.value.includes(tag)) {
      selectedTags.value = selectedTags.value.filter(t => t !== tag);
    } else {
      selectedTags.value = [...selectedTags.value, tag];
    }
  }

  return {
    // State
    models,
    combinations,
    loading,
    selectedModel,
    searchQuery,
    selectedTags,
    isDarkMode,
    user,
    // Computed
    allTags,
    // Actions
    initialize,
    toggleTheme,
    setUser,
    updateModel,
    deleteModel,
    addModel,
    importModels,
    updateCombination,
    removeCombination,
    toggleTag,
  };
});
