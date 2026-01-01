<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans flex transition-colors duration-300">
    <Sidebar 
      :activeTab="activeTab" 
      @update:activeTab="activeTab = $event"
      :isDarkMode="appStore.isDarkMode"
      @toggleTheme="appStore.toggleTheme()"
      :user="appStore.user"
      @login="handleGoogleLogin"
      @logout="handleLogout"
    />
    
    <main class="flex-1 ml-20 p-8 overflow-y-auto h-screen transition-all duration-300">
      <div class="max-w-7xl mx-auto h-full">
        <component :is="renderContent()" />
      </div>
    </main>

    <ModelDetail 
      v-if="appStore.selectedModel" 
      :model="appStore.selectedModel" 
      @close="appStore.selectedModel = null" 
      @update="appStore.updateModel"
      @delete="() => appStore.deleteModel(appStore.selectedModel!.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { useAppStore } from './stores/app';
import Sidebar from './components/Sidebar.vue';
import ModelCard from './components/ModelCard.vue';
import CombinationBuilder from './components/CombinationBuilder.vue';
import ModelDetail from './components/ModelDetail.vue';
import ImportSettings from './components/ImportSettings.vue';
import { Search, Plus, Loader2, Hash, X } from 'lucide-vue-next';
import type { ModelType } from './types';

const appStore = useAppStore();
const activeTab = ref('dashboard');

onMounted(() => {
  appStore.initialize();
});

const handleGoogleLogin = (credentialResponse: any) => {
  try {
    const base64Url = credentialResponse.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    const newUser = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    };
    appStore.setUser(newUser);
  } catch (e) {
    console.error("Failed to decode JWT", e);
  }
};

const handleLogout = () => {
  appStore.setUser(null);
};

const handleAddModel = async (type: ModelType) => {
  const newModel = {
    id: crypto.randomUUID(),
    name: 'New ' + type,
    type: type,
    version: 'SDXL',
    description: '',
    prompts: []
  };
  
  await appStore.addModel(newModel as any);
};

// Filter models based on active tab, search, and selected tags
const filteredModels = computed(() => {
  return appStore.models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(appStore.searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    // Check tags (AND logic: model must have all selected tags)
    if (appStore.selectedTags.length > 0) {
      const hasAllTags = appStore.selectedTags.every(t => m.tags?.includes(t));
      if (!hasAllTags) return false;
    }
    
    if (activeTab.value === 'checkpoints') return m.type === 'Checkpoint';
    if (activeTab.value === 'loras') return m.type === 'LoRA';
    if (activeTab.value === 'others') return ['VAE', 'TextEncoder', 'CLIP', 'ControlNet', 'IPAdapter', 'CLIPVision', 'Embedding', 'CLIPEmbed'].includes(m.type);
    return true;
  });
});

const renderContent = () => {
  if (appStore.loading) {
    return () => h('div', { class: 'h-full flex flex-col items-center justify-center text-slate-500 gap-2' }, [
      h(Loader2, { class: 'animate-spin', size: 32 }),
      h('p', 'Loading Library...')
    ]);
  }

  if (activeTab.value === 'settings') {
    return () => h(ImportSettings, {
      onImport: appStore.importModels,
      existingModels: appStore.models
    });
  }

  if (activeTab.value === 'combinations') {
    return () => h(CombinationBuilder, {
      models: appStore.models,
      combinations: appStore.combinations,
      onSave: appStore.updateCombination,
      onDelete: appStore.removeCombination
    });
  }

  if (activeTab.value === 'dashboard') {
    return () => h('div', { class: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' }, [
      h(StatCard, { title: 'Total Models', value: appStore.models.length, color: 'bg-blue-600' }),
      h(StatCard, { title: 'Checkpoints', value: appStore.models.filter(m => m.type === 'Checkpoint').length, color: 'bg-indigo-600' }),
      h(StatCard, { title: 'LoRAs', value: appStore.models.filter(m => m.type === 'LoRA').length, color: 'bg-purple-600' }),
      h(StatCard, { title: 'Combinations', value: appStore.combinations.length, color: 'bg-emerald-600' }),
      
      h('div', { class: 'md:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none' }, [
        h('h3', { class: 'text-lg font-bold text-slate-900 dark:text-white mb-4' }, 'Recent Models'),
        h('div', { class: 'space-y-3' }, 
          appStore.models.slice(0, 3).map(m => 
            h('div', { 
              key: m.id, 
              class: 'flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
              onClick: () => appStore.selectedModel = m
            }, [
              h('div', { class: 'w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden flex-shrink-0' }, 
                m.thumbnailUrl ? [h('img', { src: m.thumbnailUrl, class: 'w-full h-full object-cover' })] : []
              ),
              h('div', {}, [
                h('div', { class: 'font-medium text-slate-900 dark:text-slate-200' }, m.name),
                h('div', { class: 'text-xs text-slate-500' }, m.type + ' • ' + m.version)
              ])
            ])
          )
        )
      ])
    ]);
  }

  // List view for models
  const tabLabel = activeTab.value.substring(0, activeTab.value.length - 1);
  return () => h('div', { class: 'space-y-6' }, [
    h('div', { class: 'flex justify-between items-center' }, [
      h('h2', { class: 'text-2xl font-bold text-slate-900 dark:text-white capitalize' }, activeTab.value),
      h('div', { class: 'flex gap-2' }, 
        activeTab.value === 'others' ? [
          h('div', { class: 'flex gap-0 rounded-lg shadow-sm' }, [
            h('select', {
              class: 'bg-indigo-600 text-white pl-3 pr-8 py-2 rounded-l-lg outline-none appearance-none cursor-pointer hover:bg-indigo-500 transition-colors text-sm font-medium border-r border-indigo-400',
              onChange: (e: Event) => {
                const value = (e.target as HTMLSelectElement).value;
                if (value) {
                  handleAddModel(value as ModelType);
                  (e.target as HTMLSelectElement).value = '';
                }
              }
            }, [
              h('option', { value: '', disabled: true, selected: true }, 'Add Model...'),
              h('option', { value: 'VAE' }, 'VAE'),
              h('option', { value: 'CLIP' }, 'CLIP'),
              h('option', { value: 'TextEncoder' }, 'Text Encoder'),
              h('option', { value: 'ControlNet' }, 'ControlNet'),
              h('option', { value: 'IPAdapter' }, 'IP Adapter'),
              h('option', { value: 'CLIPVision' }, 'CLIP Vision'),
              h('option', { value: 'Embedding' }, 'Embedding'),
              h('option', { value: 'CLIPEmbed' }, 'CLIP Embed')
            ]),
            h('div', { class: 'bg-indigo-600 text-white px-3 py-2 rounded-r-lg flex items-center pointer-events-none' }, [
              h(Plus, { size: 16 })
            ])
          ])
        ] : [
          h('button', {
            onClick: () => handleAddModel(activeTab.value === 'checkpoints' ? 'Checkpoint' : 'LoRA'),
            class: 'flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
          }, [
            h(Plus, { size: 16 }),
            'Add ' + tabLabel
          ])
        ]
      )
    ]),

    h('div', { class: 'space-y-4' }, [
      // Search
      h('div', { class: 'relative' }, [
        h(Search, { class: 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-500', size: 20 }),
        h('input', {
          type: 'text',
          placeholder: 'Search ' + activeTab.value + '...',
          value: appStore.searchQuery,
          onInput: (e: Event) => appStore.searchQuery = (e.target as HTMLInputElement).value,
          class: 'w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm dark:shadow-none placeholder-slate-400 dark:placeholder-slate-500'
        })
      ]),

      // Tag Filter
      appStore.allTags.length > 0 ? h('div', { class: 'flex flex-wrap gap-2 items-center' }, [
        h('span', { class: 'text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1' }, [
          h(Hash, { size: 12 }),
          ' Tags:'
        ]),
        ...appStore.allTags.map(tag => {
          const isSelected = appStore.selectedTags.includes(tag);
          return h('button', {
            key: tag,
            onClick: () => appStore.toggleTag(tag),
            class: 'px-3 py-1 rounded-full text-xs font-medium border transition-all ' + (
              isSelected 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
            )
          }, tag);
        }),
        appStore.selectedTags.length > 0 ? h('button', {
          onClick: () => appStore.selectedTags = [],
          class: 'ml-2 text-xs text-slate-400 hover:text-red-500 flex items-center gap-1'
        }, [
          h(X, { size: 12 }),
          ' Clear Filter'
        ]) : null
      ]) : null
    ]),

    h('div', { class: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' }, [
      ...filteredModels.value.map(model => 
        h(ModelCard, {
          key: model.id,
          model: model,
          onClick: () => appStore.selectedModel = model,
          onEdit: (e: MouseEvent) => {
            e.stopPropagation();
            appStore.selectedModel = model;
          },
          onDelete: (e: MouseEvent) => {
            e.stopPropagation();
            appStore.deleteModel(model.id);
          }
        })
      ),
      filteredModels.value.length === 0 ? h('div', { class: 'col-span-full py-20 text-center text-slate-500' }, 'No models found matching your filters.') : null
    ])
  ]);
};

// StatCard Component
const StatCard = (props: { title: string, value: number, color: string }) => {
  return h('div', { class: 'bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none' }, [
    h('div', { class: 'absolute -right-4 -top-4 w-24 h-24 rounded-full ' + props.color + ' opacity-10 group-hover:opacity-20 transition-opacity' }),
    h('h3', { class: 'text-slate-500 text-sm font-medium uppercase tracking-wider mb-2' }, props.title),
    h('p', { class: 'text-3xl font-bold text-slate-900 dark:text-white' }, props.value)
  ]);
};
</script>
