<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm" @click="$emit('close')">
        <div
            class="bg-white dark:bg-neutral-900 w-full max-w-5xl h-[90vh] rounded-2xl border border-neutral-200 dark:border-neutral-700 flex overflow-hidden shadow-2xl"
            @click.stop>
            <!-- Left Column: Image & Quick Info -->
            <div class="flex flex-col w-1/3 p-6 border-r border-neutral-200 bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800">
                <div
                    class="relative mb-6 overflow-hidden border shadow-inner bg-neutral-200 border-neutral-200 aspect-square rounded-xl dark:bg-neutral-800 dark:border-neutral-700 group">
                    <img :src="editedModel.thumbnailUrl || 'https://via.placeholder.com/400'" class="object-cover w-full h-full" />
                    <div class="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/50 group-hover:opacity-100">
                        <span class="px-2 py-1 text-xs text-white border rounded cursor-not-allowed bg-black/60 border-white/10">Change Thumbnail</span>
                    </div>
                </div>

                <div class="mb-4 space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block mb-1 text-xs font-bold uppercase text-neutral-500">Type</label>
                            <div class="relative">
                                <select
                                    v-model="editedModel.type"
                                    class="w-full px-2 py-2 text-sm font-semibold text-blue-900 bg-blue-100 border border-blue-200 rounded appearance-none dark:bg-blue-900/30 dark:border-blue-500/30 dark:text-blue-200 focus:outline-none">
                                    <option v-for="t in modelTypes" :key="t" :value="t">{{ t }}</option>
                                </select>
                                <ChevronDown class="absolute text-blue-500 pointer-events-none right-2 top-1/2 -tranneutral-y-1/2" :size="14" />
                            </div>
                        </div>
                        <div>
                            <label class="block mb-1 text-xs font-bold uppercase text-neutral-500">Family</label>
                            <div class="relative">
                                <select
                                    v-model="editedModel.version"
                                    class="w-full py-2 pl-2 pr-6 text-sm bg-white border rounded-lg appearance-none text-neutral-900 border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 focus:border-blue-500 focus:outline-none">
                                    <option v-for="f in modelFamilies" :key="f" :value="f">{{ f }}</option>
                                    <option v-if="!modelFamilies.includes(editedModel.version as any)" :value="editedModel.version">{{ editedModel.version }}</option>
                                </select>
                                <ChevronDown class="absolute pointer-events-none text-neutral-500 right-2 top-1/2 -tranneutral-y-1/2" :size="14" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex-1"></div>

                <div class="pt-6 mt-6 space-y-3 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                        @click="handleSaveInfo"
                        class="flex items-center justify-center w-full gap-2 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-500">
                        <Save :size="18" />
                        Save Changes
                    </button>

                    <button
                        @click="$emit('delete')"
                        class="flex items-center justify-center w-full gap-2 py-2 text-sm font-medium text-red-600 transition-colors bg-white border border-red-200 rounded-lg dark:bg-neutral-900 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400">
                        <Trash2 :size="16" />
                        Delete Model
                    </button>
                </div>
            </div>

            <!-- Right Column: Tabs & Content -->
            <div class="flex flex-col w-2/3 bg-white dark:bg-neutral-900">
                <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div class="flex gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-950">
                        <button
                            @click="activeTab = 'info'"
                            :class="[
                                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                                activeTab === 'info' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
                            ]">
                            Settings & Triggers
                        </button>
                        <button
                            @click="activeTab = 'prompts'"
                            :class="[
                                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                                activeTab === 'prompts' ? 'bg-blue-600 text-white shadow-sm' : (
                                    'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                ),
                            ]">
                            Prompt Gallery
                        </button>
                    </div>
                    <button
                        @click="$emit('close')"
                        class="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <X :size="24" />
                    </button>
                </div>

                <div class="flex-1 p-6 overflow-y-auto">
                    <div v-if="activeTab === 'info'" class="space-y-6">
                        <div class="grid grid-cols-1 gap-4">
                            <div>
                                <label class="block mb-1 text-xs font-bold uppercase text-neutral-500">Model Name</label>
                                <input
                                    type="text"
                                    v-model="editedModel.name"
                                    class="w-full px-3 py-2 text-lg font-bold transition-colors border rounded-lg text-neutral-900 placeholder-neutral-400 border-neutral-200 bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:border-blue-500 focus:outline-none dark:placeholder-neutral-600"
                                    placeholder="Model Name" />
                            </div>

                            <div>
                                <label class="block mb-1 text-xs font-bold uppercase text-neutral-500">File Location</label>
                                <div
                                    class="w-full px-3 py-2 font-mono text-xs leading-tight break-all border rounded-lg text-neutral-500 border-neutral-200 bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-400">
                                    {{ editedModel.fileLocation || 'N/A' }}
                                </div>
                            </div>

                            <div>
                                <label class="block mb-1 text-xs font-bold uppercase text-neutral-500">Description</label>
                                <textarea
                                    class="w-full h-32 p-3 text-sm transition-colors border rounded-lg resize-none text-neutral-700 border-neutral-200 bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-300 focus:border-blue-500 focus:outline-none"
                                    v-model="editedModel.description" />
                                <button
                                    @click="handleAiDescription"
                                    :disabled="isGenerating"
                                    class="flex items-center justify-center w-full gap-2 py-2 mt-2 text-xs text-blue-700 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 dark:text-blue-300">
                                    <div v-if="isGenerating" class="w-3 h-3 border-2 border-blue-500 rounded-full animate-spin border-t-transparent" />
                                    <BrainCircuit v-else :size="14" />
                                    Generate Description with AI
                                </button>
                            </div>
                        </div>

                        <div class="w-full h-px my-2 bg-neutral-200 dark:bg-neutral-800"></div>

                        <!-- Style Tags Section -->
                        <div>
                            <label class="flex items-center block gap-2 mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                <Hash :size="14" />
                                Style Tags
                            </label>
                            <div class="p-3 border rounded-lg border-neutral-200 bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800">
                                <div class="flex flex-wrap gap-2 mb-3">
                                    <span
                                        v-for="tag in editedModel.tags || []"
                                        :key="tag"
                                        class="inline-flex items-center gap-1 px-3 py-1 text-sm bg-white border rounded-full text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300">
                                        #{{ tag }}
                                        <button @click="handleRemoveTag(tag)" class="ml-1 hover:text-red-500"><X :size="12" /></button>
                                    </span>
                                    <span v-if="!(editedModel.tags || []).length" class="text-sm italic text-neutral-400">No tags added yet.</span>
                                </div>
                                <div class="flex gap-2">
                                    <input
                                        type="text"
                                        v-model="newTag"
                                        @keydown.enter="handleAddTag"
                                        placeholder="Add a tag..."
                                        class="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                                    <button
                                        @click="handleAddTag"
                                        class="bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                                        <Plus :size="16" />
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">Trigger Words (comma separated)</label>
                            <input
                                type="text"
                                :value="editedModel.triggerWords?.join(', ') || ''"
                                @input="
                                    editedModel.triggerWords = ($event.target as HTMLInputElement).value
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                "
                                class="w-full px-4 py-2 transition-colors border rounded-lg text-neutral-900 border-neutral-200 bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500"
                                placeholder="e.g. masterpiece, best quality" />
                        </div>

                        <div class="p-6 border border-neutral-200 bg-neutral-50 dark:bg-neutral-950 rounded-xl dark:border-neutral-800">
                            <h3 class="flex items-center gap-2 mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
                                <Wand2 :size="18" class="text-blue-600 dark:text-blue-400" />
                                Best Settings
                            </h3>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="text-xs font-bold tracking-wider uppercase text-neutral-500">Steps</label>
                                    <input
                                        type="number"
                                        :value="editedModel.preferredSettings?.steps || 30"
                                        @input="editedModel.preferredSettings = { ...editedModel.preferredSettings, steps: parseInt(($event.target as HTMLInputElement).value) }"
                                        class="w-full px-3 py-2 mt-1 bg-white border rounded text-neutral-900 border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" />
                                </div>
                                <div>
                                    <label class="text-xs font-bold tracking-wider uppercase text-neutral-500">CFG Scale</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        :value="editedModel.preferredSettings?.cfgScale || 7"
                                        @input="
                                            editedModel.preferredSettings = { ...editedModel.preferredSettings, cfgScale: parseFloat(($event.target as HTMLInputElement).value) }
                                        "
                                        class="w-full px-3 py-2 mt-1 bg-white border rounded text-neutral-900 border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" />
                                </div>
                                <div>
                                    <label class="text-xs font-bold tracking-wider uppercase text-neutral-500">Sampler</label>
                                    <select
                                        :value="editedModel.preferredSettings?.sampler || 'Euler a'"
                                        @change="editedModel.preferredSettings = { ...editedModel.preferredSettings, sampler: ($event.target as HTMLSelectElement).value }"
                                        class="w-full px-3 py-2 mt-1 bg-white border rounded text-neutral-900 border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200">
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
                        <div class="p-4 border border-neutral-200 bg-neutral-50 dark:bg-neutral-950 rounded-xl dark:border-neutral-800">
                            <label class="block mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">Record a successful prompt</label>
                            <div class="relative">
                                <textarea
                                    v-model="newPromptText"
                                    class="w-full h-24 p-3 pr-24 text-sm transition-colors bg-white border rounded-lg text-neutral-900 border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 focus:outline-none focus:border-blue-500"
                                    placeholder="Type prompt here..." />
                                <button
                                    @click="handleAiEnhancePrompt"
                                    :disabled="isGenerating || !newPromptText"
                                    class="absolute bottom-2 right-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1">
                                    <SparkleIcon v-if="!isGenerating" />
                                    <span v-else>...</span>
                                    Enhance
                                </button>
                            </div>
                            <button
                                @click="addPrompt"
                                :disabled="!newPromptText"
                                class="w-full py-2 mt-3 text-sm font-medium transition-colors rounded-lg text-neutral-900 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 dark:text-white">
                                Add to Gallery
                            </button>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div
                                v-for="prompt in editedModel.prompts"
                                :key="prompt.id"
                                class="overflow-hidden border rounded-lg bg-neutral-100 border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 group">
                                <div class="relative aspect-square">
                                    <img :src="prompt.imageUrl" class="object-cover w-full h-full transition-opacity opacity-90 group-hover:opacity-100" />
                                    <div
                                        class="absolute inset-0 flex items-end p-2 transition-opacity opacity-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-100">
                                        <p class="text-xs text-white line-clamp-2">{{ prompt.text }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between p-2 bg-white border-t border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
                                    <div class="text-[10px] text-neutral-500 font-mono">
                                        {{ prompt.settings.width }}x{{ prompt.settings.height }} • {{ prompt.settings.steps }}s
                                    </div>
                                    <button @click="copyToClipboard(prompt.text)" class="text-neutral-400 hover:text-neutral-900 dark:hover:text-white" title="Copy Prompt">
                                        <Copy :size="14" />
                                    </button>
                                </div>
                            </div>
                            <div
                                v-if="!editedModel.prompts.length"
                                class="col-span-2 py-12 text-center border-2 border-dashed text-neutral-500 border-neutral-300 dark:text-neutral-600 dark:border-neutral-800 rounded-xl">
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
import type { Model, PromptEntry, ModelType } from '@/types';
import { X, Save, Wand2, Image as ImageIcon, Copy, BrainCircuit, ChevronDown, Trash2, Hash, Plus } from 'lucide-vue-next';
import { generateDescription, enhancePrompt } from '@/services/geminiService';
import { MODEL_FAMILIES } from '@/types';

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
            height: 1024,
        },
        imageUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
        createdAt: Date.now(),
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
    editedModel.tags = (editedModel.tags || []).filter((t) => t !== tagToRemove);
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
    </svg>`,
    };
};
</script>
