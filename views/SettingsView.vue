<template>
  <LoadingView v-if="appStore.loading" />
  <ImportSettings
    v-else
    @import="appStore.importModels"
    :existingModels="appStore.models"
  />
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/app';
import LoadingView from '../components/LoadingView.vue';
import ImportSettings from '../components/ImportSettings.vue';

const appStore = useAppStore();
</script>
