<template>
  <div class="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
    <Loader2 class="animate-spin" :size="32" />
    <p>Loading Library...</p>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';
</script>
