<template>
  <div 
    @click="$emit('click')"
    class="relative overflow-hidden transition-all bg-white border border-neutral-200 shadow-sm cursor-pointer group dark:bg-neutral-800 rounded-xl dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/5 dark:hover:shadow-blue-900/20"
  >
    <div class="aspect-[3/2] bg-neutral-100 dark:bg-neutral-700 relative overflow-hidden">
      <img 
        v-if="model.thumbnailUrl"
        :src="model.thumbnailUrl" 
        :alt="model.name" 
        class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" 
      />
      <div v-else class="flex items-center justify-center w-full h-full text-neutral-400 dark:text-neutral-600">
        <Box :size="48" />
      </div>
      <div class="absolute px-2 py-1 font-mono text-xs text-white border rounded top-2 right-2 bg-black/60 backdrop-blur-sm border-white/10">
        {{ model.version }}
      </div>
    </div>

    <div class="p-4">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1 min-w-0 pr-2">
          <h3 class="text-lg font-semibold text-neutral-900 truncate dark:text-neutral-100" :title="model.name">
            {{ model.name }}
          </h3>
          <div class="mb-1 text-xs font-medium tracking-wider text-blue-600 uppercase dark:text-blue-400">
            {{ model.type }}
          </div>
        </div>
        <div class="flex gap-1 shrink-0">
          <button 
            @click.stop="$emit('delete', $event)"
            class="p-1 text-neutral-400 transition-colors rounded-md dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            title="Delete Model"
          >
            <Trash2 :size="18" />
          </button>
          <button 
            @click.stop="$emit('edit', $event)"
            class="p-1 text-neutral-400 transition-colors rounded-md dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700"
            title="Edit Model"
          >
            <MoreHorizontal :size="18" />
          </button>
        </div>
      </div>

      <p class="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-2 mb-3 min-h-[40px]">
        {{ model.description || "No description provided." }}
      </p>
      
      <div class="flex flex-wrap gap-1 mb-3">
        <span 
          v-for="(tag, i) in model.tags?.slice(0, 3)" 
          :key="i" 
          class="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-[10px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600 flex items-center gap-1"
        >
          <Hash :size="8" /> {{ tag }}
        </span>
        <span 
          v-if="model.tags && model.tags.length > 3" 
          class="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-[10px] text-neutral-500 dark:text-neutral-400"
        >
          +{{ model.tags.length - 3 }}
        </span>
      </div>

      <div class="flex items-center gap-2 pt-3 text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-700">
        <div class="flex items-center gap-1">
          <Tag :size="12" />
          <span v-if="model.triggerWords && model.triggerWords.length > 0">
            {{ model.triggerWords.length }} triggers
          </span>
          <span v-else>No triggers</span>
        </div>
        <div class="flex items-center gap-1 ml-auto">
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
