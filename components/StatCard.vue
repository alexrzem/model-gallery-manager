<template>
    <div
        class="relative p-6 overflow-hidden transition-colors bg-white border shadow-sm dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 group hover:border-slate-300 dark:hover:border-slate-700 dark:shadow-none">
        <div :class="['absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity', color]"></div>
        <h3 class="mb-2 text-sm font-medium tracking-wider uppercase text-slate-500">{{ title }}</h3>
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
