<template>
    <div class="flex min-h-screen font-sans transition-colors duration-300 text-neutral-900 bg-neutral-50 dark:bg-neutral-950 dark:text-neutral-200">
        <Sidebar :isDarkMode="appStore.isDarkMode" @toggleTheme="appStore.toggleTheme()" :user="appStore.user" @login="handleGoogleLogin" @logout="handleLogout" />

        <main class="flex-1 h-screen p-8 ml-20 overflow-y-auto transition-all duration-300">
            <div class="h-full mx-auto max-w-7xl">
                <RouterView />
            </div>
        </main>

        <ModelDetail
            v-if="appStore.selectedModel"
            :model="appStore.selectedModel"
            @close="appStore.selectedModel = null"
            @update="appStore.updateModel"
            @delete="() => appStore.deleteModel(appStore.selectedModel!.id)" />
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useAppStore } from '@/stores/app';
import Sidebar from '@/components/Sidebar.vue';
import ModelDetail from '@/components/ModelDetail.vue';

const appStore = useAppStore();

onMounted(() => {
    appStore.initialize();
});

const handleGoogleLogin = (credentialResponse: any) => {
    try {
        const base64Url = credentialResponse.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join(''),
        );

        const payload = JSON.parse(jsonPayload);
        const newUser = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
        };
        appStore.setUser(newUser);
    } catch (e) {
        console.error('Failed to decode JWT', e);
    }
};

const handleLogout = () => {
    appStore.setUser(null);
};
</script>
