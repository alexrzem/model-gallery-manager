<template>
  <LoadingView v-if="appStore.loading" />
  <ModelList
    v-else
    :activeTab="route.name as string"
    :models="appStore.models"
    v-model:searchQuery="appStore.searchQuery"
    :selectedTags="appStore.selectedTags"
    :allTags="appStore.allTags"
    @addModel="handleAddModel"
    @toggleTag="appStore.toggleTag"
    @clearTags="appStore.selectedTags = []"
    @selectModel="appStore.selectedModel = $event"
    @deleteModel="appStore.deleteModel"
  />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import LoadingView from '../components/LoadingView.vue';
import ModelList from '../components/ModelList.vue';
import type { ModelType } from '../types';

const route = useRoute();
const appStore = useAppStore();

const handleAddModel = async (type: ModelType) => {
  const newModel = {
    id: crypto.randomUUID(),
    name: 'New ' + type,
    type: type,
    version: 'SDXL',
    description: '',
    prompts: []
  };

  await appStore.addModel(newModel as any);
};
</script>
