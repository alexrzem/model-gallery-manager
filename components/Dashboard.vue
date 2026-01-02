<template>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Models" :value="models.length" color="bg-blue-600" />
        <StatCard title="Checkpoints" :value="models.filter((m) => m.type === 'Checkpoint').length" color="bg-blue-600" />
        <StatCard title="LoRAs" :value="models.filter((m) => m.type === 'LoRA').length" color="bg-purple-600" />
        <StatCard title="Combinations" :value="combinations.length" color="bg-emerald-600" />

        <div class="p-6 bg-white border shadow-sm md:col-span-2 lg:col-span-2 dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 dark:shadow-none">
            <h3 class="mb-4 text-lg font-bold text-slate-900 dark:text-white">Recent Models</h3>
            <div class="space-y-3">
                <div
                    v-for="model in models.slice(0, 3)"
                    :key="model.id"
                    class="flex items-center gap-4 p-3 transition-colors rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                    @click="$emit('selectModel', model)">
                    <div class="flex-shrink-0 w-12 h-12 overflow-hidden rounded-md bg-slate-200 dark:bg-slate-700">
                        <img v-if="model.thumbnailUrl" :src="model.thumbnailUrl" class="object-cover w-full h-full" />
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
import StatCard from '@/components/StatCard.vue';
import type { Model, Combination } from '@/types';

defineProps<{
    models: Model[];
    combinations: Combination[];
}>();

defineEmits<{
    selectModel: [model: Model];
}>();
</script>
