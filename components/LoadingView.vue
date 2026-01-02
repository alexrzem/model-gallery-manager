<template>
    <div class="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
        <Loader2 class="animate-spin" :size="32" />
        <p>Loading Library...</p>
    </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';
</script>
