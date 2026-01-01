<template>
  <div 
    @click="$emit('click')"
    class="group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer hover:shadow-xl hover:shadow-indigo-900/5 dark:hover:shadow-indigo-900/20 shadow-sm"
  >
    <div class="aspect-[3/2] bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
      <img 
        v-if="model.thumbnailUrl"
        :src="model.thumbnailUrl" 
        :alt="model.name" 
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
      />
      <div v-else class="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
        <Box :size="48" />
      </div>
      <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-xs font-mono px-2 py-1 rounded text-white border border-white/10">
        {{ model.version }}
      </div>
    </div>

    <div class="p-4">
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1 min-w-0 pr-2">
          <h3 class="font-semibold text-lg text-slate-900 dark:text-slate-100 truncate" :title="model.name">
            {{ model.name }}
          </h3>
          <div class="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider mb-1">
            {{ model.type }}
          </div>
        </div>
        <div class="flex gap-1 shrink-0">
          <button 
            @click.stop="$emit('delete', $event)"
            class="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Delete Model"
          >
            <Trash2 :size="18" />
          </button>
          <button 
            @click.stop="$emit('edit', $event)"
            class="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Edit Model"
          >
            <MoreHorizontal :size="18" />
          </button>
        </div>
      </div>

      <p class="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-3 min-h-[40px]">
        {{ model.description || "No description provided." }}
      </p>
      
      <div class="flex flex-wrap gap-1 mb-3">
        <span 
          v-for="(tag, i) in model.tags?.slice(0, 3)" 
          :key="i" 
          class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center gap-1"
        >
          <Hash :size="8" /> {{ tag }}
        </span>
        <span 
          v-if="model.tags && model.tags.length > 3" 
          class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 dark:text-slate-400"
        >
          +{{ model.tags.length - 3 }}
        </span>
      </div>

      <div class="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-3">
        <div class="flex items-center gap-1">
          <Tag :size="12" />
          <span v-if="model.triggerWords && model.triggerWords.length > 0">
            {{ model.triggerWords.length }} triggers
          </span>
          <span v-else>No triggers</span>
        </div>
        <div class="ml-auto flex items-center gap-1">
          <Star :size="12" class="text-yellow-500" />
          <span>{{ model.prompts.length }} Prompts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Model } from '../types';
import { MoreHorizontal, Star, Box, Tag, Trash2, Hash } from 'lucide-vue-next';

defineProps<{
  model: Model;
}>();

defineEmits<{
  click: [];
  edit: [event: MouseEvent];
  delete: [event: MouseEvent];
}>();
</script>
