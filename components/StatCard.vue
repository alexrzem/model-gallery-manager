<template>
  <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
    <div :class="['absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity', color]"></div>
    <h3 class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">{{ title }}</h3>
    <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ value }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  value: number;
  color: string;
}>();
</script>
