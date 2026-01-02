<template>
  <LoadingView v-if="appStore.loading" />
  <Dashboard
    v-else
    :models="appStore.models"
    :combinations="appStore.combinations"
    @selectModel="appStore.selectedModel = $event"
  />
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/app';
import LoadingView from '../components/LoadingView.vue';
import Dashboard from '../components/Dashboard.vue';

const appStore = useAppStore();
</script>
