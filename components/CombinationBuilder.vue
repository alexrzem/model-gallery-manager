<template>
    <div class="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- List of Existing Combinations -->
        <div class="p-6 overflow-y-auto bg-white border shadow-sm border-neutral-200 lg:col-span-1 dark:bg-neutral-900 rounded-xl dark:border-neutral-800 dark:shadow-none">
            <h2 class="flex items-center gap-2 mb-4 text-xl font-bold text-neutral-900 dark:text-white">
                <Save :size="20" class="text-blue-600 dark:text-blue-500" />
                Saved Recipes
            </h2>
            <div class="space-y-4">
                <div
                    v-for="combo in combinations"
                    :key="combo.id"
                    @click="handleSelect(combo)"
                    :class="[
                        'p-4 rounded-lg border transition-all cursor-pointer group',
                        editingId === combo.id ?
                            'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-md shadow-blue-900/20'
                        :   'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-neutral-800/80',
                    ]">
                    <div class="flex gap-3 mb-2">
                        <div v-if="combo.referenceImageUrl" class="flex-shrink-0 w-12 h-12 overflow-hidden border rounded border-neutral-200 dark:border-neutral-700">
                            <img :src="combo.referenceImageUrl" alt="Reference" class="object-cover w-full h-full" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between">
                                <h3 :class="['font-semibold truncate', editingId === combo.id ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-900 dark:text-neutral-100']">
                                    {{ combo.name }}
                                </h3>
                                <Button
                                    @click.stop="handleDeleteCombo(combo.id)"
                                    class="p-1 ml-1 transition-opacity rounded opacity-0 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-700">
                                    <Trash2 :size="16" />
                                </Button>
                            </div>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{{ combo.description }}</p>
                        </div>
                    </div>

                    <div class="space-y-2 text-xs text-neutral-500">
                        <div class="flex items-center gap-2">
                            <span class="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">CP</span>
                            {{ getModelName(combo.checkpointId) || 'Unknown' }}
                        </div>
                        <div v-if="combo.loraIds.length > 0" class="flex items-center gap-2">
                            <span class="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">LoRA</span>
                            {{ combo.loraIds.length }} active
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <span
                                v-if="combo.vaeId"
                                class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">
                                VAE
                            </span>
                            <span
                                v-if="combo.clipId"
                                class="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded border border-pink-200 dark:border-pink-900/50">
                                CLIP
                            </span>
                            <span
                                v-if="combo.textEncoderId"
                                class="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-900/50">
                                TE
                            </span>
                        </div>
                        <div class="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700/50">
                            <span class="text-neutral-400">{{ combo.settings.steps }} steps</span>
                            <span>•</span>
                            <span class="text-neutral-400">CFG {{ combo.settings.cfgScale }}</span>
                            <span>•</span>
                            <span class="text-neutral-400">{{ combo.settings.sampler }}</span>
                        </div>
                        <div v-if="combo.triggerWords && combo.triggerWords.length > 0" class="flex flex-wrap gap-1 mt-1">
                            <span
                                v-for="(tw, i) in combo.triggerWords"
                                :key="i"
                                class="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-[10px] text-neutral-600 dark:text-neutral-300">
                                {{ tw }}
                            </span>
                        </div>
                    </div>
                </div>
                <div v-if="!combinations.length" class="py-8 text-center text-neutral-500 dark:text-neutral-600">No recipes saved yet.</div>
            </div>
        </div>

        <!-- Builder Form -->
        <div class="p-6 overflow-y-auto bg-white border shadow-sm border-neutral-200 lg:col-span-2 dark:bg-neutral-900 rounded-xl dark:border-neutral-800 dark:shadow-none">
            <div class="flex items-center justify-between mb-6">
                <h2 class="flex items-center gap-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    <Sliders :size="20" class="text-blue-600 dark:text-blue-500" />
                    {{ editingId ? 'Edit Recipe' : 'Create New Recipe' }}
                </h2>
                <Button
                    v-if="editingId"
                    @click="handleClear"
                    class="text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-neutral-200 dark:border-neutral-700">
                    <X :size="14" />
                    Cancel Edit
                </Button>
            </div>

            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">Recipe Name</label>
                        <input
                            type="text"
                            v-model="comboName"
                            class="w-full px-4 py-2 transition-colors border rounded-lg text-neutral-900 placeholder-neutral-400 border-neutral-200 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:border-blue-500 dark:placeholder-neutral-600"
                            placeholder="e.g. Cinematic Sci-Fi" />
                    </div>
                    <div>
                        <label class="block mb-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">Description</label>
                        <input
                            type="text"
                            v-model="description"
                            class="w-full px-4 py-2 transition-colors border rounded-lg text-neutral-900 placeholder-neutral-400 border-neutral-200 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:border-blue-500 dark:placeholder-neutral-600"
                            placeholder="Brief notes..." />
                    </div>
                </div>

                <div>
                    <label class="block mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">Reference Image (Visual Goal)</label>
                    <div class="flex items-start gap-4 p-4 border rounded-lg border-neutral-200 bg-neutral-50 dark:bg-neutral-950/50 dark:border-neutral-800">
                        <div
                            class="relative flex items-center justify-center flex-shrink-0 w-24 h-24 overflow-hidden border-2 border-dashed rounded-lg bg-neutral-100 border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 group">
                            <template v-if="referenceImage">
                                <img :src="referenceImage" class="object-cover w-full h-full" alt="Reference" />
                                <Button
                                    @click="referenceImage = ''"
                                    class="absolute inset-0 flex items-center justify-center text-white transition-opacity opacity-0 bg-black/50 group-hover:opacity-100">
                                    <Trash2 :size="16" />
                                </Button>
                            </template>
                            <ImageIcon v-else class="text-neutral-400" :size="24" />
                        </div>
                        <div class="flex-1">
                            <label
                                class="inline-flex items-center gap-2 px-4 py-2 text-sm transition-colors bg-white border rounded-lg shadow-sm cursor-pointer text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-neutral-300">
                                <Upload :size="16" />
                                Upload Image
                                <input type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
                            </label>
                            <p class="mt-2 text-xs text-neutral-500">
                                Upload a reference image to remember the style, composition, or lighting you are aiming for with this combination.
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block mb-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">Trigger Words (Combined)</label>
                    <input
                        type="text"
                        v-model="triggerWords"
                        class="w-full px-4 py-2 transition-colors border rounded-lg text-neutral-900 placeholder-neutral-400 border-neutral-200 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:border-blue-500 dark:placeholder-neutral-600"
                        placeholder="e.g. detailed, 8k, masterpiece (comma separated)" />
                </div>

                <div>
                    <label class="block mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">1. Select Checkpoint (Base)</label>
                    <Select
                        v-model="selectedCheckpoint"
                        class="w-full px-4 py-3 transition-colors border rounded-lg text-neutral-900 border-neutral-200 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:border-blue-500">
                        <option value="">-- Select Checkpoint --</option>
                        <option v-for="cp in checkpoints" :key="cp.id" :value="cp.id">{{ cp.name }} ({{ cp.version }})</option>
                    </Select>
                </div>

                <div>
                    <label class="block mb-2 text-sm font-medium text-pink-600 dark:text-pink-400">2. Add LoRAs (Optional)</label>
                    <div
                        class="grid grid-cols-1 gap-2 p-2 overflow-y-auto border rounded-lg border-neutral-200 md:grid-cols-2 max-h-48 bg-neutral-50 dark:bg-neutral-950/50 dark:border-neutral-800">
                        <div
                            v-for="lora in loras"
                            :key="lora.id"
                            @click="handleToggleLora(lora.id)"
                            :class="[
                                'flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
                                selectedLoras.includes(lora.id) ?
                                    'bg-blue-100 dark:bg-blue-900/30 border border-blue-500/50'
                                :   'hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent',
                            ]">
                            <span :class="['text-sm truncate', selectedLoras.includes(lora.id) ? 'text-blue-900 dark:text-blue-200' : 'text-neutral-700 dark:text-neutral-300']">
                                {{ lora.name }}
                            </span>
                            <div v-if="selectedLoras.includes(lora.id)" class="flex items-center gap-2" @click.stop>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="2"
                                    :value="loraWeights[lora.id] || 0"
                                    @input="handleLoraWeightChange(lora.id, ($event.target as HTMLInputElement).value)"
                                    class="w-16 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded px-1 py-0.5 text-xs text-right text-neutral-900 dark:text-white" />
                            </div>
                        </div>
                        <div v-if="!loras.length" class="p-2 text-sm text-neutral-500">No LoRAs available.</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div class="space-y-4">
                        <div>
                            <label class="block mb-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">3. Additional Models (Optional)</label>

                            <label class="block mt-2 mb-1 text-xs font-bold uppercase text-neutral-500">VAE</label>
                            <Select
                                v-model="selectedVae"
                                class="w-full px-3 py-2 text-sm transition-colors border rounded-lg text-neutral-900 border-neutral-200 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:border-blue-500">
                                <option value="">-- Default / None --</option>
                                <option v-for="vae in vaes" :key="vae.id" :value="vae.id">{{ vae.name }}</option>
                            </Select>

                            <label class="block mt-3 mb-1 text-xs font-bold uppercase text-neutral-500">CLIP</label>
                            <Select
                                v-model="selectedClip"
                                class="w-full px-3 py-2 text-sm transition-colors border rounded-lg text-neutral-900 border-neutral-200 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:border-blue-500">
                                <option value="">-- Default / None --</option>
                                <option v-for="clip in clips" :key="clip.id" :value="clip.id">{{ clip.name }}</option>
                            </Select>

                            <label class="block mt-3 mb-1 text-xs font-bold uppercase text-neutral-500">Text Encoder</label>
                            <Select
                                v-model="selectedTextEncoder"
                                class="w-full px-3 py-2 text-sm transition-colors border rounded-lg text-neutral-900 border-neutral-200 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:border-blue-500">
                                <option value="">-- Default / None --</option>
                                <option v-for="te in textEncoders" :key="te.id" :value="te.id">{{ te.name }}</option>
                            </Select>
                        </div>
                    </div>

                    <div class="p-4 border rounded-lg border-neutral-200 bg-neutral-50 dark:bg-neutral-950/50 dark:border-neutral-800 h-fit">
                        <div class="flex items-center gap-2 mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            <Settings2 :size="16" />
                            Generation Settings
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block mb-1 text-xs text-neutral-500">Steps</label>
                                <input
                                    type="number"
                                    v-model="steps"
                                    class="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-900 dark:text-neutral-200" />
                            </div>
                            <div>
                                <label class="block mb-1 text-xs text-neutral-500">CFG Scale</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    v-model="cfgScale"
                                    class="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-900 dark:text-neutral-200" />
                            </div>
                            <div class="col-span-2">
                                <label class="block mb-1 text-xs text-neutral-500">Sampler</label>
                                <Select
                                    v-model="sampler"
                                    :options="SAMPLERS"
                                    option-value="id"
                                    option-label="label"
                                    class="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-900 dark:text-neutral-200"></Select>
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    @click="handleSave"
                    :disabled="!comboName || !selectedCheckpoint"
                    :class="[
                        'w-full text-white font-semibold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-4',
                        editingId ?
                            'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 dark:shadow-emerald-900/50'
                        :   'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 dark:shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed',
                    ]">
                    <Save v-if="editingId" :size="20" />
                    <Plus v-else :size="20" />
                    {{ editingId ? 'Update Recipe' : 'Save New Recipe' }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import type { Model, Combination, MODEL_FAMILIES, MODEL_TYPES, SAMPLERS } from '@/types';
import { Plus, Save, Trash2, Sliders, Settings2, X, Upload, Image as ImageIcon } from 'lucide-vue-next';

const props = defineProps<{
    models: Model[];
    combinations: Combination[];
}>();

const emit = defineEmits<{
    save: [combo: Combination];
    delete: [id: string];
}>();

const checkpoints = computed(() => props.models.filter((m) => m.type === 'Checkpoint'));
const vaes = computed(() => props.models.filter((m) => m.type === 'VAE'));
const loras = computed(() => props.models.filter((m) => m.type === 'LoRA'));
const clips = computed(() => props.models.filter((m) => m.type === 'CLIP'));
const textEncoders = computed(() => props.models.filter((m) => m.type === 'TextEncoder'));

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
    return props.models.find((m) => m.id === id)?.name;
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
        selectedLoras.value = selectedLoras.value.filter((l) => l !== id);
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
        triggerWords: triggerWords.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        settings: {
            steps: steps.value,
            cfgScale: cfgScale.value,
            sampler: sampler.value,
            width: 1024,
            height: 1024,
        },
        referenceImageUrl: referenceImage.value || undefined,
    };
    emit('save', newCombo);
    handleClear();
};

const handleDeleteCombo = (id: string) => {
    emit('delete', id);
    if (id === editingId.value) handleClear();
};
</script>
