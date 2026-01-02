<template>
  <div class="space-y-6">
    <!-- Header with Add Button -->
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white capitalize">{{ activeTab }}</h2>
      <div class="flex gap-2">
        <div v-if="activeTab === 'others'" class="flex gap-0 rounded-lg shadow-sm">
          <select
            class="bg-blue-600 text-white pl-3 pr-8 py-2 rounded-l-lg outline-none appearance-none cursor-pointer hover:bg-blue-500 transition-colors text-sm font-medium border-r border-blue-400"
            @change="handleAddModel"
          >
            <option value="" disabled selected>Add Model...</option>
            <option value="VAE">VAE</option>
            <option value="CLIP">CLIP</option>
            <option value="TextEncoder">Text Encoder</option>
            <option value="ControlNet">ControlNet</option>
            <option value="IPAdapter">IP Adapter</option>
            <option value="CLIPVision">CLIP Vision</option>
            <option value="Embedding">Embedding</option>
            <option value="CLIPEmbed">CLIP Embed</option>
          </select>
          <div class="bg-blue-600 text-white px-3 py-2 rounded-r-lg flex items-center pointer-events-none">
            <Plus :size="16" />
          </div>
        </div>
        <button
          v-else
          @click="$emit('addModel', activeTab === 'checkpoints' ? 'Checkpoint' : 'LoRA')"
          class="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus :size="16" />
          Add {{ tabLabel }}
        </button>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="space-y-4">
      <!-- Search -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" :size="20" />
        <input
          type="text"
          :placeholder="'Search ' + activeTab + '...'"
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 shadow-sm dark:shadow-none placeholder-slate-400 dark:placeholder-slate-500"
        />
      </div>

      <!-- Tag Filter -->
      <div v-if="allTags.length > 0" class="flex flex-wrap gap-2 items-center">
        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Hash :size="12" />
          Tags:
        </span>
        <button
          v-for="tag in allTags"
          :key="tag"
          @click="$emit('toggleTag', tag)"
          :class="[
            'px-3 py-1 rounded-full text-xs font-medium border transition-all',
            selectedTags.includes(tag)
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
          ]"
        >
          {{ tag }}
        </button>
        <button
          v-if="selectedTags.length > 0"
          @click="$emit('clearTags')"
          class="ml-2 text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
        >
          <X :size="12" />
          Clear Filter
        </button>
      </div>
    </div>

    <!-- Model Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <ModelCard
        v-for="model in filteredModels"
        :key="model.id"
        :model="model"
        @click="$emit('selectModel', model)"
        @edit="(e) => { e.stopPropagation(); $emit('selectModel', model); }"
        @delete="(e) => { e.stopPropagation(); $emit('deleteModel', model.id); }"
      />
      <div
        v-if="filteredModels.length === 0"
        class="col-span-full py-20 text-center text-slate-500"
      >
        No models found matching your filters.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Search, Plus, Hash, X } from 'lucide-vue-next';
import ModelCard from './ModelCard.vue';
import type { Model, ModelType } from '../types';

const props = defineProps<{
  activeTab: string;
  models: Model[];
  searchQuery: string;
  selectedTags: string[];
  allTags: string[];
}>();

const emit = defineEmits<{
  addModel: [type: ModelType];
  'update:searchQuery': [query: string];
  toggleTag: [tag: string];
  clearTags: [];
  selectModel: [model: Model];
  deleteModel: [id: string];
}>();

const tabLabel = computed(() =>
  props.activeTab.substring(0, props.activeTab.length - 1)
);

const filteredModels = computed(() => {
  return props.models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(props.searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Check tags (AND logic: model must have all selected tags)
    if (props.selectedTags.length > 0) {
      const hasAllTags = props.selectedTags.every(t => m.tags?.includes(t));
      if (!hasAllTags) return false;
    }

    if (props.activeTab === 'checkpoints') return m.type === 'Checkpoint';
    if (props.activeTab === 'loras') return m.type === 'LoRA';
    if (props.activeTab === 'others') return ['VAE', 'TextEncoder', 'CLIP', 'ControlNet', 'IPAdapter', 'CLIPVision', 'Embedding', 'CLIPEmbed'].includes(m.type);
    return true;
  });
});

const handleAddModel = (e: Event) => {
  const value = (e.target as HTMLSelectElement).value;
  if (value) {
    emit('addModel', value as ModelType);
    (e.target as HTMLSelectElement).value = '';
  }
};
</script>
