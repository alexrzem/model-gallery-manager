<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard title="Total Models" :value="models.length" color="bg-blue-600" />
    <StatCard title="Checkpoints" :value="models.filter(m => m.type === 'Checkpoint').length" color="bg-blue-600" />
    <StatCard title="LoRAs" :value="models.filter(m => m.type === 'LoRA').length" color="bg-purple-600" />
    <StatCard title="Combinations" :value="combinations.length" color="bg-emerald-600" />

    <div class="md:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
      <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Models</h3>
      <div class="space-y-3">
        <div
          v-for="model in models.slice(0, 3)"
          :key="model.id"
          class="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          @click="$emit('selectModel', model)"
        >
          <div class="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden flex-shrink-0">
            <img v-if="model.thumbnailUrl" :src="model.thumbnailUrl" class="w-full h-full object-cover" />
          </div>
          <div>
            <div class="font-medium text-slate-900 dark:text-slate-200">{{ model.name }}</div>
            <div class="text-xs text-slate-500">{{ model.type }} • {{ model.version }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatCard from './StatCard.vue';
import type { Model, Combination } from '../types';

defineProps<{
  models: Model[];
  combinations: Combination[];
}>();

defineEmits<{
  selectModel: [model: Model];
}>();
</script>
