<template>
  <LoadingView v-if="appStore.loading" />
  <CombinationBuilder
    v-else
    :models="appStore.models"
    :combinations="appStore.combinations"
    @save="appStore.updateCombination"
    @delete="appStore.removeCombination"
  />
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/app';
import LoadingView from '../components/LoadingView.vue';
import CombinationBuilder from '../components/CombinationBuilder.vue';

const appStore = useAppStore();
</script>
