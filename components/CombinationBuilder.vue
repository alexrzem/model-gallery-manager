<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
    <!-- List of Existing Combinations -->
    <div class="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 overflow-y-auto shadow-sm dark:shadow-none">
      <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
        <Save :size="20" class="text-indigo-600 dark:text-indigo-500" />
        Saved Recipes
      </h2>
      <div class="space-y-4">
        <div 
          v-for="combo in combinations" 
          :key="combo.id"
          @click="handleSelect(combo)"
          :class="[
            'p-4 rounded-lg border transition-all cursor-pointer group',
            editingId === combo.id 
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-md shadow-indigo-900/20' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800/80'
          ]"
        >
          <div class="flex gap-3 mb-2">
            <div v-if="combo.referenceImageUrl" class="flex-shrink-0 w-12 h-12 rounded overflow-hidden border border-slate-200 dark:border-slate-700">
              <img :src="combo.referenceImageUrl" alt="Reference" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start">
                <h3 :class="['font-semibold truncate', editingId === combo.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-100']">{{ combo.name }}</h3>
                <button 
                  @click.stop="handleDeleteCombo(combo.id)" 
                  class="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded ml-1"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{{ combo.description }}</p>
            </div>
          </div>

          <div class="space-y-2 text-xs text-slate-500">
            <div class="flex items-center gap-2">
              <span class="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">CP</span>
              {{ getModelName(combo.checkpointId) || 'Unknown' }}
            </div>
            <div v-if="combo.loraIds.length > 0" class="flex items-center gap-2">
              <span class="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">LoRA</span>
              {{ combo.loraIds.length }} active
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-if="combo.vaeId" class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">VAE</span>
              <span v-if="combo.clipId" class="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded border border-pink-200 dark:border-pink-900/50">CLIP</span>
              <span v-if="combo.textEncoderId" class="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-900/50">TE</span>
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <span class="text-slate-400">{{ combo.settings.steps }} steps</span>
              <span>•</span>
              <span class="text-slate-400">CFG {{ combo.settings.cfgScale }}</span>
              <span>•</span>
              <span class="text-slate-400">{{ combo.settings.sampler }}</span>
            </div>
            <div v-if="combo.triggerWords && combo.triggerWords.length > 0" class="flex flex-wrap gap-1 mt-1">
              <span v-for="(tw, i) in combo.triggerWords" :key="i" class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-300">{{ tw }}</span>
            </div>
          </div>
        </div>
        <div v-if="!combinations.length" class="text-slate-500 dark:text-slate-600 text-center py-8">No recipes saved yet.</div>
      </div>
    </div>

    <!-- Builder Form -->
    <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 overflow-y-auto shadow-sm dark:shadow-none">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Sliders :size="20" class="text-indigo-600 dark:text-indigo-500" />
          {{ editingId ? 'Edit Recipe' : 'Create New Recipe' }}
        </h2>
        <button 
          v-if="editingId"
          @click="handleClear" 
          class="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <X :size="14" /> Cancel Edit
        </button>
      </div>

      <div class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Recipe Name</label>
            <input 
              type="text" 
              v-model="comboName"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-400 dark:placeholder-slate-600"
              placeholder="e.g. Cinematic Sci-Fi"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <input 
              type="text" 
              v-model="description"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-400 dark:placeholder-slate-600"
              placeholder="Brief notes..."
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Reference Image (Visual Goal)</label>
          <div class="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div class="w-24 h-24 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative overflow-hidden group">
              <template v-if="referenceImage">
                <img :src="referenceImage" class="w-full h-full object-cover" alt="Reference" />
                <button 
                  @click="referenceImage = ''"
                  class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                >
                  <Trash2 :size="16" />
                </button>
              </template>
              <ImageIcon v-else class="text-slate-400" :size="24" />
            </div>
            <div class="flex-1">
              <label class="cursor-pointer bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 transition-colors shadow-sm">
                <Upload :size="16" />
                Upload Image
                <input type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
              </label>
              <p class="text-xs text-slate-500 mt-2">Upload a reference image to remember the style, composition, or lighting you are aiming for with this combination.</p>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Trigger Words (Combined)</label>
          <input 
            type="text" 
            v-model="triggerWords"
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-400 dark:placeholder-slate-600 transition-colors"
            placeholder="e.g. detailed, 8k, masterpiece (comma separated)"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">1. Select Checkpoint (Base)</label>
          <select 
            v-model="selectedCheckpoint"
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">-- Select Checkpoint --</option>
            <option v-for="cp in checkpoints" :key="cp.id" :value="cp.id">{{ cp.name }} ({{ cp.version }})</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">2. Add LoRAs (Optional)</label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div 
              v-for="lora in loras"
              :key="lora.id"
              @click="handleToggleLora(lora.id)"
              :class="[
                'flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
                selectedLoras.includes(lora.id) 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-500/50' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
              ]"
            >
              <span :class="['text-sm truncate', selectedLoras.includes(lora.id) ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300']">{{ lora.name }}</span>
              <div v-if="selectedLoras.includes(lora.id)" class="flex items-center gap-2" @click.stop>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="2"
                  :value="loraWeights[lora.id] || 0"
                  @input="handleLoraWeightChange(lora.id, ($event.target as HTMLInputElement).value)"
                  class="w-16 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-xs text-right text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div v-if="!loras.length" class="text-slate-500 text-sm p-2">No LoRAs available.</div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">3. Additional Models (Optional)</label>
              
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1 mt-2">VAE</label>
              <select 
                v-model="selectedVae"
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Default / None --</option>
                <option v-for="vae in vaes" :key="vae.id" :value="vae.id">{{ vae.name }}</option>
              </select>

              <label class="block text-xs font-bold text-slate-500 uppercase mb-1 mt-3">CLIP</label>
              <select 
                v-model="selectedClip"
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Default / None --</option>
                <option v-for="clip in clips" :key="clip.id" :value="clip.id">{{ clip.name }}</option>
              </select>

              <label class="block text-xs font-bold text-slate-500 uppercase mb-1 mt-3">Text Encoder</label>
              <select 
                v-model="selectedTextEncoder"
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Default / None --</option>
                <option v-for="te in textEncoders" :key="te.id" :value="te.id">{{ te.name }}</option>
              </select>
            </div>
          </div>
          
          <div class="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800 h-fit">
            <div class="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-300 font-medium text-sm">
              <Settings2 :size="16" /> Generation Settings
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Steps</label>
                <input 
                  type="number" 
                  v-model="steps"
                  class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-slate-200"
                />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">CFG Scale</label>
                <input 
                  type="number" step="0.5"
                  v-model="cfgScale"
                  class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-slate-200"
                />
              </div>
              <div class="col-span-2">
                <label class="block text-xs text-slate-500 mb-1">Sampler</label>
                <select 
                  v-model="sampler"
                  class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-slate-200"
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

        <button
          @click="handleSave"
          :disabled="!comboName || !selectedCheckpoint"
          :class="[
            'w-full text-white font-semibold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-4',
            editingId 
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 dark:shadow-emerald-900/50' 
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 dark:shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed'
          ]"
        >
          <Save v-if="editingId" :size="20" />
          <Plus v-else :size="20" />
          {{ editingId ? 'Update Recipe' : 'Save New Recipe' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Model, Combination } from '../types';
import { Plus, Save, Trash2, Sliders, Settings2, X, Upload, Image as ImageIcon } from 'lucide-vue-next';

const props = defineProps<{
  models: Model[];
  combinations: Combination[];
}>();

const emit = defineEmits<{
  save: [combo: Combination];
  delete: [id: string];
}>();

const checkpoints = computed(() => props.models.filter(m => m.type === 'Checkpoint'));
const vaes = computed(() => props.models.filter(m => m.type === 'VAE'));
const loras = computed(() => props.models.filter(m => m.type === 'LoRA'));
const clips = computed(() => props.models.filter(m => m.type === 'CLIP'));
const textEncoders = computed(() => props.models.filter(m => m.type === 'TextEncoder'));

const editingId = ref<string | null>(null);
const selectedCheckpoint = ref('');
const selectedVae = ref('');
const selectedClip = ref('');
const selectedTextEncoder = ref('');
const selectedLoras = ref<string[]>([]);
const loraWeights = ref<Record<string, number>>({});
const comboName = ref('');
const description = ref('');
const triggerWords = ref('');
const steps = ref(30);
const cfgScale = ref(7.0);
const sampler = ref('Euler a');
const referenceImage = ref('');

const getModelName = (id: string) => {
  return props.models.find(m => m.id === id)?.name;
};

const handleClear = () => {
  editingId.value = null;
  comboName.value = '';
  description.value = '';
  selectedCheckpoint.value = '';
  selectedVae.value = '';
  selectedClip.value = '';
  selectedTextEncoder.value = '';
  selectedLoras.value = [];
  loraWeights.value = {};
  triggerWords.value = '';
  steps.value = 30;
  cfgScale.value = 7.0;
  sampler.value = 'Euler a';
  referenceImage.value = '';
};

const handleSelect = (combo: Combination) => {
  editingId.value = combo.id;
  comboName.value = combo.name;
  description.value = combo.description;
  selectedCheckpoint.value = combo.checkpointId;
  selectedVae.value = combo.vaeId || '';
  selectedClip.value = combo.clipId || '';
  selectedTextEncoder.value = combo.textEncoderId || '';
  selectedLoras.value = combo.loraIds;
  loraWeights.value = combo.loraWeights;
  triggerWords.value = combo.triggerWords?.join(', ') || '';
  steps.value = combo.settings.steps;
  cfgScale.value = combo.settings.cfgScale;
  sampler.value = combo.settings.sampler;
  referenceImage.value = combo.referenceImageUrl || '';
};

const handleToggleLora = (id: string) => {
  if (selectedLoras.value.includes(id)) {
    selectedLoras.value = selectedLoras.value.filter(l => l !== id);
    const newWeights = { ...loraWeights.value };
    delete newWeights[id];
    loraWeights.value = newWeights;
  } else {
    selectedLoras.value = [...selectedLoras.value, id];
    loraWeights.value = { ...loraWeights.value, [id]: 1.0 };
  }
};

const handleLoraWeightChange = (id: string, value: string) => {
  let numValue = parseFloat(value);
  
  if (isNaN(numValue)) numValue = 0;
  if (numValue < 0) numValue = 0;
  if (numValue > 2) numValue = 2;

  loraWeights.value = { ...loraWeights.value, [id]: numValue };
};

const handleImageUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      referenceImage.value = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handleSave = () => {
  if (!comboName.value || !selectedCheckpoint.value) return;
  
  const newCombo: Combination = {
    id: editingId.value || crypto.randomUUID(),
    name: comboName.value,
    description: description.value,
    checkpointId: selectedCheckpoint.value,
    vaeId: selectedVae.value || undefined,
    clipId: selectedClip.value || undefined,
    textEncoderId: selectedTextEncoder.value || undefined,
    loraIds: selectedLoras.value,
    loraWeights: loraWeights.value,
    triggerWords: triggerWords.value.split(',').map(s => s.trim()).filter(Boolean),
    settings: {
      steps: steps.value,
      cfgScale: cfgScale.value,
      sampler: sampler.value,
      width: 1024,
      height: 1024
    },
    referenceImageUrl: referenceImage.value || undefined
  };
  emit('save', newCombo);
  handleClear();
};

const handleDeleteCombo = (id: string) => {
  emit('delete', id);
  if (id === editingId.value) handleClear();
};
</script>
