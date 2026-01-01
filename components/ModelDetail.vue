<template>
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4"
    @click="$emit('close')"
  >
    <div 
      class="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-700 flex overflow-hidden shadow-2xl"
      @click.stop
    >
      
      <!-- Left Column: Image & Quick Info -->
      <div class="w-1/3 bg-slate-50 dark:bg-slate-950 p-6 flex flex-col border-r border-slate-200 dark:border-slate-800">
        <div class="aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 mb-6 border border-slate-200 dark:border-slate-700 group relative shadow-inner">
          <img :src="editedModel.thumbnailUrl || 'https://via.placeholder.com/400'" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span class="text-white text-xs px-2 py-1 bg-black/60 rounded border border-white/10 cursor-not-allowed">Change Thumbnail</span>
          </div>
        </div>
        
        <div class="space-y-4 mb-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
              <div class="relative">
                <select 
                  v-model="editedModel.type"
                  class="w-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-200 text-sm font-semibold rounded px-2 py-2 focus:outline-none appearance-none"
                >
                  <option v-for="t in modelTypes" :key="t" :value="t">{{ t }}</option>
                </select>
                <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" :size="14" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Family</label>
              <div class="relative">
                <select 
                  v-model="editedModel.version"
                  class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-2 pr-6 py-2 text-slate-900 dark:text-slate-200 text-sm focus:border-indigo-500 focus:outline-none appearance-none"
                >
                  <option v-for="f in modelFamilies" :key="f" :value="f">{{ f }}</option>
                  <option v-if="!modelFamilies.includes(editedModel.version as any)" :value="editedModel.version">{{ editedModel.version }}</option>
                </select>
                <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" :size="14" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1"></div>

        <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <button 
            @click="handleSaveInfo"
            class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save :size="18" />
            Save Changes
          </button>
          
          <button 
            @click="$emit('delete')"
            class="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 :size="16" />
            Delete Model
          </button>
        </div>
      </div>

      <!-- Right Column: Tabs & Content -->
      <div class="w-2/3 flex flex-col bg-white dark:bg-slate-900">
        <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div class="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg">
            <button 
              @click="activeTab = 'info'"
              :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'info' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white']"
            >
              Settings & Triggers
            </button>
            <button 
              @click="activeTab = 'prompts'"
              :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'prompts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white']"
            >
              Prompt Gallery
            </button>
          </div>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X :size="24" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="activeTab === 'info'" class="space-y-6">
            
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Model Name</label>
                <input 
                  type="text" 
                  v-model="editedModel.name"
                  class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-bold text-lg focus:border-indigo-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-600 transition-colors"
                  placeholder="Model Name"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">File Location</label>
                <div class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-500 dark:text-slate-400 text-xs font-mono break-all leading-tight">
                  {{ editedModel.fileLocation || "N/A" }}
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea 
                  class="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-none resize-none transition-colors"
                  v-model="editedModel.description"
                />
                <button 
                  @click="handleAiDescription"
                  :disabled="isGenerating"
                  class="mt-2 w-full flex items-center justify-center gap-2 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 py-2 rounded-lg transition-colors"
                >
                  <div v-if="isGenerating" class="animate-spin rounded-full h-3 w-3 border-2 border-indigo-500 border-t-transparent"/>
                  <BrainCircuit v-else :size="14" />
                  Generate Description with AI
                </button>
              </div>
            </div>

            <div class="w-full h-px bg-slate-200 dark:bg-slate-800 my-2"></div>
            
            <!-- Style Tags Section -->
            <div>
              <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                <Hash :size="14" /> Style Tags
              </label>
              <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                <div class="flex flex-wrap gap-2 mb-3">
                  <span v-for="tag in editedModel.tags || []" :key="tag" class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300">
                    #{{ tag }}
                    <button @click="handleRemoveTag(tag)" class="hover:text-red-500 ml-1"><X :size="12" /></button>
                  </span>
                  <span v-if="!(editedModel.tags || []).length" class="text-slate-400 text-sm italic">No tags added yet.</span>
                </div>
                <div class="flex gap-2">
                  <input 
                    type="text" 
                    v-model="newTag"
                    @keydown.enter="handleAddTag"
                    placeholder="Add a tag..." 
                    class="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    @click="handleAddTag"
                    class="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus :size="16" /> Add
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Trigger Words (comma separated)</label>
              <input 
                type="text" 
                :value="editedModel.triggerWords?.join(', ') || ''"
                @input="editedModel.triggerWords = ($event.target as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean)"
                class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. masterpiece, best quality"
              />
            </div>
            
            <div class="bg-slate-50 dark:bg-slate-950 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Wand2 :size="18" class="text-indigo-600 dark:text-indigo-400" />
                Best Settings
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-slate-500 uppercase font-bold tracking-wider">Steps</label>
                  <input 
                    type="number" 
                    :value="editedModel.preferredSettings?.steps || 30"
                    @input="editedModel.preferredSettings = {...editedModel.preferredSettings, steps: parseInt(($event.target as HTMLInputElement).value)}"
                    class="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label class="text-xs text-slate-500 uppercase font-bold tracking-wider">CFG Scale</label>
                  <input 
                    type="number" step="0.5"
                    :value="editedModel.preferredSettings?.cfgScale || 7"
                    @input="editedModel.preferredSettings = {...editedModel.preferredSettings, cfgScale: parseFloat(($event.target as HTMLInputElement).value)}"
                    class="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label class="text-xs text-slate-500 uppercase font-bold tracking-wider">Sampler</label>
                  <select 
                    :value="editedModel.preferredSettings?.sampler || 'Euler a'"
                    @change="editedModel.preferredSettings = {...editedModel.preferredSettings, sampler: ($event.target as HTMLSelectElement).value}"
                    class="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-slate-200"
                  >
                    <option>Euler a</option>
                    <option>DPM++ 2M Karras</option>
                    <option>DDIM</option>
                    <option>UniPC</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'prompts'" class="space-y-6">
            <div class="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Record a successful prompt</label>
              <div class="relative">
                <textarea 
                  v-model="newPromptText"
                  class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 h-24 pr-24 transition-colors"
                  placeholder="Type prompt here..."
                />
                <button 
                  @click="handleAiEnhancePrompt"
                  :disabled="isGenerating || !newPromptText"
                  class="absolute bottom-2 right-2 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1"
                >
                  <SparkleIcon v-if="!isGenerating" />
                  <span v-else>...</span>
                  Enhance
                </button>
              </div>
              <button 
                @click="addPrompt"
                :disabled="!newPromptText"
                class="mt-3 w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Add to Gallery
              </button>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div v-for="prompt in editedModel.prompts" :key="prompt.id" class="bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 group">
                <div class="aspect-square relative">
                  <img :src="prompt.imageUrl" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div class="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p class="text-xs text-white line-clamp-2">{{ prompt.text }}</p>
                  </div>
                </div>
                <div class="p-2 flex items-center justify-between bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                  <div class="text-[10px] text-slate-500 font-mono">
                    {{ prompt.settings.width }}x{{ prompt.settings.height }} • {{ prompt.settings.steps }}s
                  </div>
                  <button 
                    @click="copyToClipboard(prompt.text)"
                    class="text-slate-400 hover:text-slate-900 dark:hover:text-white" title="Copy Prompt"
                  >
                    <Copy :size="14" />
                  </button>
                </div>
              </div>
              <div v-if="!editedModel.prompts.length" class="col-span-2 text-center py-12 text-slate-500 dark:text-slate-600 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                <ImageIcon :size="32" class="mx-auto mb-2 opacity-50" />
                <p>No prompts recorded yet.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { Model, PromptEntry, ModelType } from '../types';
import { X, Save, Wand2, Image as ImageIcon, Copy, BrainCircuit, ChevronDown, Trash2, Hash, Plus } from 'lucide-vue-next';
import { generateDescription, enhancePrompt } from '../services/geminiService';
import { MODEL_FAMILIES } from '../types';

const props = defineProps<{
  model: Model;
}>();

const emit = defineEmits<{
  close: [];
  update: [updated: Model];
  delete: [];
}>();

const activeTab = ref<'info' | 'prompts'>('info');
const editedModel = reactive<Model>({ ...props.model });
const newPromptText = ref('');
const newTag = ref('');
const isGenerating = ref(false);

const modelTypes: ModelType[] = ['Checkpoint', 'LoRA', 'VAE', 'TextEncoder', 'CLIP', 'ControlNet', 'IPAdapter', 'CLIPVision', 'Embedding', 'CLIPEmbed'];
const modelFamilies = MODEL_FAMILIES;

const handleSaveInfo = () => {
  emit('update', editedModel);
  emit('close');
};

const handleAiDescription = async () => {
  isGenerating.value = true;
  const desc = await generateDescription(editedModel.name, editedModel.type, editedModel.triggerWords?.join(', ') || '');
  editedModel.description = desc;
  isGenerating.value = false;
};

const handleAiEnhancePrompt = async () => {
  if (!newPromptText.value) return;
  isGenerating.value = true;
  const enhanced = await enhancePrompt(newPromptText.value);
  newPromptText.value = enhanced;
  isGenerating.value = false;
};

const addPrompt = () => {
  if (!newPromptText.value) return;
  const newEntry: PromptEntry = {
    id: crypto.randomUUID(),
    text: newPromptText.value,
    settings: {
      steps: editedModel.preferredSettings?.steps || 30,
      cfgScale: editedModel.preferredSettings?.cfgScale || 7,
      sampler: editedModel.preferredSettings?.sampler || 'Euler a',
      width: 1024, 
      height: 1024
    },
    imageUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
    createdAt: Date.now()
  };
  editedModel.prompts = [newEntry, ...editedModel.prompts];
  emit('update', editedModel);
  newPromptText.value = '';
};

const handleAddTag = () => {
  if (!newTag.value.trim()) return;
  const currentTags = editedModel.tags || [];
  if (!currentTags.includes(newTag.value.trim())) {
    editedModel.tags = [...currentTags, newTag.value.trim()];
  }
  newTag.value = '';
};

const handleRemoveTag = (tagToRemove: string) => {
  editedModel.tags = (editedModel.tags || []).filter(t => t !== tagToRemove);
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};
</script>

<script lang="ts">
const SparkleIcon = () => {
  return {
    template: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>`
  };
};
</script>
