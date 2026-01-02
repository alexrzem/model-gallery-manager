<script setup lang="ts">
import { ref } from 'vue';
import { Model, ModelType } from '../types';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Image as ImageIcon,
  Search,
  Sparkles,
  FileType,
  Hash,
  ExternalLink,
  Plus,
  Loader2
} from 'lucide-vue-next';
import { findImageForModel, generateThumbnailForModel } from '../services/geminiService';

// Props
interface ImportSettingsProps {
  existingModels: Model[];
}

const props = defineProps<ImportSettingsProps>();

// Emits
const emit = defineEmits<{
  import: [models: Model[]];
}>();

// Window interface extension
declare global {
  interface Window {
    initSqlJs: any;
  }
}

// State
const activeTab = ref<'db' | 'file'>('db');

// DB Import State
const status = ref<'idle' | 'loading' | 'processing' | 'success' | 'error'>('idle');
const message = ref('');
const stats = ref({ imported: 0, skipped: 0 });
const thumbnailStrategy = ref<'none' | 'search' | 'generate'>('none');
const processedCount = ref(0);
const totalToProcess = ref(0);

// File Import State
const fileStatus = ref<'idle' | 'hashing' | 'looking_up' | 'ready' | 'error'>('idle');
const fileHash = ref('');
const scannedModel = ref<Partial<Model> | null>(null);
const fileError = ref('');

// Drag State
const isDraggingDb = ref(false);
const isDraggingFile = ref(false);

// Mapping functions
const mapInvokeType = (type: string): ModelType | null => {
  switch (type) {
    case 'main': return 'Checkpoint';
    case 'lora': return 'LoRA';
    case 'vae': return 'VAE';
    case 'embedding': return 'Embedding';
    case 'text_encoder': return 'TextEncoder';
    case 'clip': return 'CLIP';
    case 'controlnet': return 'ControlNet';
    case 'ip_adapter': return 'IPAdapter';
    case 'clip_vision': return 'CLIPVision';
    case 'clip_embed': return 'CLIPEmbed';
    default: return null;
  }
};

const mapInvokeBase = (base: string): string => {
  switch (base) {
    case 'sd-1': return 'SD v1.5';
    case 'sd-2': return 'SD v2';
    case 'sdxl': return 'SDXL';
    case 'flux': return 'Flux v1';
    default: return base;
  }
};

const mapCivitAiType = (type: string): ModelType => {
  switch(type) {
    case 'Checkpoint': return 'Checkpoint';
    case 'LORA': return 'LoRA';
    case 'LoCon': return 'LoRA';
    case 'TextualInversion': return 'Embedding';
    case 'VAE': return 'VAE';
    case 'ControlNet': return 'ControlNet';
    default: return 'Checkpoint'; // Fallback
  }
};

const processDatabaseFile = async (file: File) => {
  status.value = 'loading';
  message.value = 'Loading database...';
  stats.value = { imported: 0, skipped: 0 };
  processedCount.value = 0;
  totalToProcess.value = 0;

  try {
    if (!window.initSqlJs) {
      throw new Error("SQL.js not loaded. Please refresh the page.");
    }

    const SQL = await window.initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    const buffer = await file.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(buffer));

    const stmt = db.prepare("SELECT id, config FROM models");

    const potentialModels: any[] = [];
    let skippedCount = 0;

    while (stmt.step()) {
      const row = stmt.getAsObject();
      try {
        const config = JSON.parse(row.config as string);

        const type = mapInvokeType(config.type);
        if (!type) continue;

        if (props.existingModels.some(m => m.id === String(row.id) || m.name === config.name)) {
          skippedCount++;
          continue;
        }

        potentialModels.push({
          id: String(row.id),
          config,
          type
        });
      } catch (err) {
        console.warn("Failed to parse model row", row, err);
      }
    }

    stmt.free();
    db.close();

    totalToProcess.value = potentialModels.length;
    status.value = 'processing';
    message.value = thumbnailStrategy.value !== 'none' ? 'Processing models and fetching thumbnails...' : 'Importing models...';

    const newModels: Model[] = [];

    for (let i = 0; i < potentialModels.length; i++) {
      const item = potentialModels[i];
      const { config, type, id } = item;

      let thumbUrl = undefined;
      let civitData = null;
      let hash = null;

      // Check if config has a SHA256 hash
      if (typeof config.hash === 'string' && config.hash.startsWith('sha256:')) {
        hash = config.hash.slice(7); // Remove 'sha256:' prefix
      }

      // Update progress if we are doing work (hash lookup or thumb generation)
      if (hash || thumbnailStrategy.value !== 'none') {
        processedCount.value = i + 1;
        message.value = `Processing ${i + 1}/${potentialModels.length}: ${config.name}${hash ? ' (Checking CivitAI...)' : ''}`;
      }

      // If hash exists, try to fetch metadata from CivitAI
      if (hash) {
        try {
          const res = await fetch(`https://civitai.com/api/v1/model-versions/by-hash/${hash}`);
          if (res.ok) {
            civitData = await res.json();
          }
        } catch(e) {
          console.warn(`CivitAI lookup failed for ${config.name}`, e);
        }
      }

      // Determine Thumbnail (Priority: CivitAI -> Strategy -> None)
      if (civitData?.images?.[0]?.url) {
        thumbUrl = civitData.images[0].url;
      } else if (thumbnailStrategy.value !== 'none') {
        try {
          if (thumbnailStrategy.value === 'search') {
            thumbUrl = await findImageForModel(config.name);
          } else {
            thumbUrl = await generateThumbnailForModel(config.name, type);
          }
        } catch (e) {
          console.warn(`Thumbnail fetch failed for ${config.name}`);
        }
      }

      const model: Model = {
        id: id,
        // Use CivitAI name if available, else config name
        name: civitData?.model?.name ? `${civitData.model.name} (${civitData.name})` : (config.name || 'Unknown Model'),
        type: type, // Keep InvokeAI type for consistency
        version: civitData?.baseModel || mapInvokeBase(config.base) || 'Unknown',
        description: civitData?.description?.replace(/<[^>]*>/g, '').slice(0, 300) + '...' || config.description || '',
        triggerWords: civitData?.trainedWords || (Array.isArray(config.trigger_phrases) ? config.trigger_phrases : []),
        fileLocation: config.path || '',
        prompts: [],
        thumbnailUrl: thumbUrl,
        tags: civitData?.model?.tags || []
      };
      newModels.push(model);
    }

    emit('import', newModels);
    stats.value = { imported: newModels.length, skipped: skippedCount };
    status.value = 'success';
    message.value = `Successfully processed database.`;

  } catch (err: any) {
    console.error(err);
    status.value = 'error';
    message.value = err.message || "Failed to import database. Ensure the file is not locked by another application.";
  }
};

const handleDbUploadChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processDatabaseFile(file);
  }
  target.value = '';
};

const processModelFile = async (file: File) => {
  fileStatus.value = 'hashing';
  fileError.value = '';
  scannedModel.value = null;
  fileHash.value = '';

  try {
    // Calculate SHA256
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    fileHash.value = hashHex;
    fileStatus.value = 'looking_up';

    // Lookup CivitAI
    const response = await fetch(`https://civitai.com/api/v1/model-versions/by-hash/${hashHex}`);

    let modelData: Partial<Model> = {
      id: crypto.randomUUID(),
      fileLocation: file.name,
      prompts: [],
      tags: []
    };

    if (response.ok) {
      const data = await response.json();

      // Map CivitAI data
      modelData = {
        ...modelData,
        name: data.model?.name ? `${data.model.name} (${data.name})` : file.name,
        type: mapCivitAiType(data.model?.type),
        version: data.baseModel || 'Unknown',
        description: data.description?.replace(/<[^>]*>/g, '').slice(0, 300) + '...' || '',
        thumbnailUrl: data.images?.[0]?.url,
        triggerWords: data.trainedWords || [],
        tags: data.model?.tags || []
      };
    } else {
      // Fallback if not found
      modelData = {
        ...modelData,
        name: file.name.split('.')[0].replace(/_/g, ' '),
        type: 'Checkpoint', // Default assumption
        version: 'SDXL', // Default assumption
        description: 'Imported local file. Metadata not found in CivitAI.'
      };
    }

    scannedModel.value = modelData;
    fileStatus.value = 'ready';

  } catch (err: any) {
    console.error(err);
    let errMsg = "Failed to process file.";
    if (err.name === 'NotReadableError') {
      errMsg = "Could not read file. Ensure it is not locked by another application.";
    } else if (file.size > 2 * 1024 * 1024 * 1024) {
      errMsg = "File is too large for browser-based hashing (Limit is approx 2GB).";
    }
    fileError.value = errMsg;
    fileStatus.value = 'error';
  }
};

const handleModelFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processModelFile(file);
  }
  target.value = '';
};

const saveScannedModel = () => {
  if (scannedModel.value) {
    emit('import', [scannedModel.value as Model]);
    fileStatus.value = 'idle';
    scannedModel.value = null;
    fileHash.value = '';
    // Optional: Switch tab or show success toast
    alert('Model added successfully!');
  }
};

// Drag and Drop Handlers
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleDbDragEnter = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDraggingDb.value = true;
};

const handleDbDragLeave = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDraggingDb.value = false;
};

const handleDbDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDraggingDb.value = false;

  const file = e.dataTransfer?.files?.[0];
  if (file) {
    processDatabaseFile(file);
  }
};

const handleFileDragEnter = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDraggingFile.value = true;
};

const handleFileDragLeave = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDraggingFile.value = false;
};

const handleFileDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDraggingFile.value = false;

  const file = e.dataTransfer?.files?.[0];
  if (file) {
    processModelFile(file);
  }
};
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-8">
    <!-- Tab Switcher -->
    <div class="flex p-1 mx-auto mb-6 bg-neutral-100 rounded-lg dark:bg-neutral-800 w-fit">
      <button
        @click="activeTab = 'db'"
        :class="[
          'px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
          activeTab === 'db'
            ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-sm'
            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
        ]"
      >
        <Database :size="16" /> Import Database
      </button>
      <button
        @click="activeTab = 'file'"
        :class="[
          'px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
          activeTab === 'file'
            ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-sm'
            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
        ]"
      >
        <FileType :size="16" /> Import Model File
      </button>
    </div>

    <div class="p-8 transition-colors bg-white border border-neutral-200 shadow-sm dark:bg-neutral-900 rounded-xl dark:border-neutral-800 dark:shadow-none">
      <!-- DB Import Tab -->
      <template v-if="activeTab === 'db'">
        <div class="flex items-center gap-3 mb-6">
          <div class="p-3 text-blue-600 bg-blue-100 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
            <Database :size="24" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-neutral-900 dark:text-white">Import from InvokeAI</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">Upload your <code>invokeai.db</code> file to import models.</p>
          </div>
        </div>

        <!-- Strategy Selection -->
        <div class="p-4 mb-6 border border-neutral-200 rounded-lg bg-neutral-50 dark:bg-neutral-950/50 dark:border-neutral-800">
          <h3 class="flex items-center gap-2 mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <ImageIcon :size="16" />
            Thumbnail Generation
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <button
              @click="thumbnailStrategy = 'none'"
              :class="[
                'text-xs p-3 rounded-lg border transition-all flex flex-col items-center gap-2',
                thumbnailStrategy === 'none'
                  ? 'bg-white dark:bg-neutral-800 border-blue-500 text-blue-700 dark:text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-neutral-400'
              ]"
            >
              <div class="flex items-center justify-center w-8 h-8 bg-neutral-200 rounded-full dark:bg-neutral-800">
                <FileUp :size="16" />
              </div>
              None
            </button>
            <button
              @click="thumbnailStrategy = 'search'"
              :class="[
                'text-xs p-3 rounded-lg border transition-all flex flex-col items-center gap-2',
                thumbnailStrategy === 'search'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-neutral-400'
              ]"
            >
              <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full dark:bg-blue-900/40">
                <Search :size="16" />
              </div>
              Search Google
            </button>
            <button
              @click="thumbnailStrategy = 'generate'"
              :class="[
                'text-xs p-3 rounded-lg border transition-all flex flex-col items-center gap-2',
                thumbnailStrategy === 'generate'
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-300'
                  : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-neutral-400'
              ]"
            >
              <div class="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full dark:bg-purple-900/40">
                <Sparkles :size="16" />
              </div>
              Generate AI
            </button>
          </div>
          <p v-if="thumbnailStrategy !== 'none'" class="text-[10px] text-neutral-500 mt-2 text-center">
            Note: This will significantly increase import time as it processes each model individually.
          </p>
        </div>

        <div
          @dragover="handleDragOver"
          @dragenter="handleDbDragEnter"
          @dragleave="handleDbDragLeave"
          @drop="handleDbDrop"
          :class="[
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors bg-neutral-50 dark:bg-neutral-950/50',
            isDraggingDb
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500'
          ]"
        >
          <input
            type="file"
            id="db-upload"
            accept=".db,.sqlite"
            @change="handleDbUploadChange"
            class="hidden"
          />
          <label
            for="db-upload"
            :class="[
              'cursor-pointer flex flex-col items-center gap-3',
              status === 'loading' || status === 'processing' ? 'pointer-events-none opacity-50' : ''
            ]"
          >
            <div class="flex items-center justify-center w-16 h-16 text-neutral-400 transition-colors bg-neutral-200 rounded-full dark:bg-neutral-800 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-white">
              <div v-if="status === 'loading' || status === 'processing'" class="w-8 h-8 border-2 border-blue-500 rounded-full animate-spin border-t-transparent" />
              <FileUp v-else :size="32" />
            </div>
            <div>
              <span class="font-medium text-blue-600 dark:text-blue-400 hover:underline">Click to upload</span>
              <span class="text-neutral-500"> or drag and drop</span>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-600">Supported formats: .db, .sqlite</p>
          </label>
        </div>

        <div v-if="status === 'processing'" class="mt-6">
          <div class="flex justify-between mb-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span>Processing...</span>
            <span>{{ processedCount }} / {{ totalToProcess }}</span>
          </div>
          <div class="w-full h-2 overflow-hidden bg-neutral-200 rounded-full dark:bg-neutral-800">
            <div
              class="h-full transition-all duration-300 bg-blue-500"
              :style="{ width: `${(processedCount / totalToProcess) * 100}%` }"
            />
          </div>
          <p class="mt-2 text-xs text-center text-neutral-500">{{ message }}</p>
        </div>

        <div v-if="status === 'success'" class="flex items-start gap-3 p-4 mt-6 border rounded-lg bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50">
          <CheckCircle2 class="text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" :size="20" />
          <div>
            <h3 class="font-medium text-emerald-700 dark:text-emerald-400">Import Complete</h3>
            <p class="mt-1 text-sm text-emerald-600 dark:text-emerald-500/80">
              {{ message }} Added {{ stats.imported }} models. Skipped {{ stats.skipped }} duplicates.
            </p>
          </div>
        </div>

        <div v-if="status === 'error'" class="flex items-start gap-3 p-4 mt-6 bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-900/50">
          <AlertCircle class="text-red-600 dark:text-red-500 shrink-0 mt-0.5" :size="20" />
          <div>
            <h3 class="font-medium text-red-700 dark:text-red-400">Import Failed</h3>
            <p class="mt-1 text-sm text-red-600 dark:text-red-500/80">{{ message }}</p>
          </div>
        </div>
      </template>

      <!-- File Import Tab -->
      <template v-else>
        <div class="flex items-center gap-3 mb-6">
          <div class="p-3 text-pink-600 bg-pink-100 rounded-lg dark:bg-pink-900/30 dark:text-pink-400">
            <Hash :size="24" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-neutral-900 dark:text-white">File Identification & Import</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">Calculate hash and identify models using CivitAI.</p>
          </div>
        </div>

        <div
          @dragover="handleDragOver"
          @dragenter="handleFileDragEnter"
          @dragleave="handleFileDragLeave"
          @drop="handleFileDrop"
          :class="[
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors bg-neutral-50 dark:bg-neutral-950/50',
            isDraggingFile
              ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-pink-500 dark:hover:border-pink-500'
          ]"
        >
          <input
            type="file"
            id="file-upload"
            accept=".safetensors,.ckpt,.pt,.bin"
            @change="handleModelFileChange"
            class="hidden"
          />
          <label
            for="file-upload"
            :class="[
              'cursor-pointer flex flex-col items-center gap-3',
              fileStatus === 'hashing' || fileStatus === 'looking_up' ? 'pointer-events-none opacity-50' : ''
            ]"
          >
            <div class="flex items-center justify-center w-16 h-16 text-neutral-400 transition-colors bg-neutral-200 rounded-full dark:bg-neutral-800 dark:text-neutral-400 group-hover:text-pink-600 dark:group-hover:text-white">
              <Loader2 v-if="fileStatus === 'hashing' || fileStatus === 'looking_up'" class="text-pink-500 animate-spin" :size="32" />
              <FileUp v-else :size="32" />
            </div>
            <div>
              <span class="font-medium text-pink-600 dark:text-pink-400 hover:underline">Select Model File</span>
              <span class="text-neutral-500"> (.safetensors, .ckpt)</span>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-600">Calculates SHA256 in browser. Max file size depends on browser/RAM.</p>
          </label>
        </div>

        <div v-if="fileStatus !== 'idle'" class="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <!-- Hash Display -->
          <div class="flex items-center justify-between p-4 bg-neutral-100 rounded-lg dark:bg-neutral-800">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="flex items-center justify-center w-8 h-8 bg-neutral-200 rounded-full dark:bg-neutral-700 shrink-0">
                <Hash :size="14" class="text-neutral-600 dark:text-neutral-400" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-bold text-neutral-500 uppercase">SHA256 Hash</span>
                <code class="font-mono text-xs text-neutral-700 truncate dark:text-neutral-300">
                  {{ fileHash || 'Calculating...' }}
                </code>
              </div>
            </div>
            <div v-if="fileHash" class="flex gap-2 shrink-0">
              <a
                :href="`https://civarchive.com/models?hash=${fileHash}`"
                target="_blank"
                rel="noreferrer"
                class="p-2 text-neutral-500 rounded hover:bg-white dark:hover:bg-neutral-600 hover:text-blue-500"
                title="Check CivArchive"
              >
                <ExternalLink :size="16" />
              </a>
              <a
                href="https://github.com/airborne-commando/civitai-mirror-list"
                target="_blank"
                rel="noreferrer"
                class="p-2 text-neutral-500 rounded hover:bg-white dark:hover:bg-neutral-600 hover:text-green-500"
                title="Check Mirror List"
              >
                <Search :size="16" />
              </a>
            </div>
          </div>

          <div v-if="fileStatus === 'error'" class="flex items-center gap-2 p-4 text-sm text-red-600 rounded-lg bg-red-50 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle :size="16" /> {{ fileError }}
          </div>

          <div v-if="fileStatus === 'ready' && scannedModel" class="flex flex-col overflow-hidden bg-white border border-neutral-200 shadow-lg dark:bg-neutral-800 dark:border-neutral-700 rounded-xl md:flex-row">
            <div class="md:w-1/3 bg-neutral-200 dark:bg-neutral-900 relative min-h-[200px]">
              <img v-if="scannedModel.thumbnailUrl" :src="scannedModel.thumbnailUrl" class="absolute inset-0 object-cover w-full h-full" />
              <div v-else class="flex items-center justify-center w-full h-full text-neutral-400">
                <ImageIcon :size="48" />
              </div>
            </div>
            <div class="flex flex-col p-6 md:w-2/3">
              <div class="flex-1">
                <h3 class="mb-1 text-xl font-bold text-neutral-900 dark:text-white">{{ scannedModel.name }}</h3>
                <div class="flex items-center gap-2 mb-4 text-sm text-neutral-500">
                  <span class="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{{ scannedModel.type }}</span>
                  <span>{{ scannedModel.version }}</span>
                </div>
                <p class="mb-4 text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3">
                  {{ scannedModel.description }}
                </p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="tw in scannedModel.triggerWords"
                    :key="tw"
                    class="text-[10px] bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600"
                  >
                    {{ tw }}
                  </span>
                </div>
              </div>
              <div class="flex justify-end pt-4 mt-6 border-t border-neutral-100 dark:border-neutral-700/50">
                <button
                  @click="saveScannedModel"
                  class="flex items-center gap-2 px-6 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-500"
                >
                  <Plus :size="18" /> Add to Library
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="p-6 transition-colors bg-white border border-neutral-200 shadow-sm dark:bg-neutral-900 rounded-xl dark:border-neutral-800 dark:shadow-none">
      <h3 class="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Supported Import Types</h3>
      <div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
          Main Checkpoints
        </div>
        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
          LoRAs / LyCORIS
        </div>
        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          VAEs
        </div>
        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span class="w-2 h-2 bg-pink-500 rounded-full"></span>
          Text Encoders
        </div>
        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
          CLIP Models
        </div>
        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
          ControlNet
        </div>
        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span class="w-2 h-2 rounded-full bg-cyan-500"></span>
          IP Adapter
        </div>
        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
          Embeddings
        </div>
        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span class="w-2 h-2 bg-red-500 rounded-full"></span>
          CLIP Vision
        </div>
      </div>
    </div>
  </div>
</template>
