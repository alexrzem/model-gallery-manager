<template>
    <div>
        <div
            class="fixed top-0 left-0 z-50 flex flex-col w-20 h-full transition-all duration-300 ease-in-out bg-white border-r shadow-xl border-neutral-200 group dark:bg-neutral-900 dark:border-neutral-800 hover:w-64 shadow-black/5 dark:shadow-black/50">
            <!-- Header -->
            <div
                class="flex items-center justify-center flex-shrink-0 h-20 mb-2 overflow-hidden transition-all duration-300 border-b border-neutral-200 group-hover:justify-start group-hover:px-6 dark:border-neutral-800/50">
                <div class="flex items-center justify-center flex-shrink-0 w-10 h-10 text-white bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20">
                    <Sparkles :size="20" />
                </div>
                <div class="w-0 ml-0 overflow-hidden transition-all duration-300 opacity-0 group-hover:ml-3 group-hover:w-auto group-hover:opacity-100 whitespace-nowrap">
                    <h1 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">NeuroGallery</h1>
                </div>
            </div>

            <!-- Nav -->
            <nav class="flex-1 px-3 py-4 space-y-2 overflow-x-hidden overflow-y-auto">
                <Button
                    v-for="item in navItems"
                    :key="item.id"
                    @click="router.push(item.path)"
                    :title="item.label"
                    :class="[
                        'w-full flex items-center h-12 rounded-lg transition-all duration-200 relative whitespace-nowrap justify-center group-hover:justify-start group-hover:px-4',
                        isActiveRoute(item.path) ?
                            'bg-blue-600 text-white shadow-md shadow-blue-600/30 dark:shadow-blue-900/30'
                        :   'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200',
                    ]">
                    <div class="flex-shrink-0">
                        <component :is="item.icon" :size="20" />
                    </div>

                    <span class="w-0 ml-0 overflow-hidden font-medium transition-all duration-300 opacity-0 group-hover:ml-3 group-hover:w-auto group-hover:opacity-100">
                        {{ item.label }}
                    </span>
                </Button>
            </nav>

            <!-- Footer / Theme Toggle / User -->
            <div
                class="flex flex-col items-center flex-shrink-0 gap-2 p-4 overflow-hidden border-t text-neutral-500 border-neutral-200 dark:border-neutral-800 group-hover:items-start whitespace-nowrap">
                <Button
                    @click="$emit('toggleTheme')"
                    class="flex items-center justify-center w-full p-2 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 group-hover:justify-start"
                    :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
                    <Sun v-if="isDarkMode" :size="20" />
                    <Moon v-else :size="20" />
                    <span class="w-0 ml-0 overflow-hidden text-sm font-medium transition-all duration-300 opacity-0 group-hover:ml-3 group-hover:opacity-100 group-hover:w-auto">
                        {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
                    </span>
                </Button>

                <div
                    v-if="user"
                    class="flex items-center justify-center w-full p-2 mt-1 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 group-hover:justify-start">
                    <img :src="user.picture" :alt="user.name" class="flex-shrink-0 w-5 h-5 rounded-full ring-2 ring-blue-500" />
                    <div
                        class="flex flex-col items-start w-0 ml-0 overflow-hidden transition-all duration-300 opacity-0 group-hover:ml-3 group-hover:opacity-100 group-hover:w-auto">
                        <span class="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[120px]">{{ user.name }}</span>
                        <Button @click="$emit('logout')" class="text-[10px] text-red-500 hover:underline flex items-center gap-1">Log Out</Button>
                    </div>
                </div>

                <Button
                    v-else
                    @click="showAuthModal = true"
                    class="flex items-center justify-center w-full p-2 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 group-hover:justify-start"
                    title="Sign In">
                    <LogIn :size="20" />
                    <span class="w-0 ml-0 overflow-hidden text-sm font-medium transition-all duration-300 opacity-0 group-hover:ml-3 group-hover:opacity-100 group-hover:w-auto">
                        Sign In
                    </span>
                </Button>

                <div class="w-full pt-2 text-xs text-center group-hover:text-left">
                    <span class="hidden transition-opacity duration-300 delay-100 opacity-0 group-hover:opacity-100 group-hover:inline-block">v1.0.0</span>
                    <span class="inline-block opacity-50 group-hover:hidden">v1</span>
                </div>
            </div>
        </div>

        <!-- Auth Modal -->
        <div v-if="showAuthModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div class="relative w-full max-w-sm p-8 bg-white border shadow-2xl border-neutral-200 dark:bg-neutral-900 rounded-2xl dark:border-neutral-700">
                <Button @click="showAuthModal = false" class="absolute text-neutral-400 top-4 right-4 hover:text-neutral-900 dark:hover:text-white">
                    <X :size="20" />
                </Button>

                <div class="mb-8 text-center">
                    <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                        <LogIn :size="32" />
                    </div>
                    <h2 class="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Welcome Back</h2>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Sign in to sync your preferences and access premium features.</p>
                </div>

                <div class="flex justify-center min-h-[50px]">
                    <div id="google-signin-btn"></div>
                </div>

                <div class="mt-6 text-xs text-center text-neutral-400 dark:text-neutral-600">By signing in, you agree to our Terms of Service and Privacy Policy.</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import { LayoutDashboard, Database, Layers, Component, Palette, Sparkles, Settings, Sun, Moon, LogIn, LogOut, X } from 'lucide-vue-next';
import type { User } from '@/types';

const props = defineProps<{
    isDarkMode: boolean;
    user: User | null;
}>();

const emit = defineEmits<{
    toggleTheme: [];
    login: [response: any];
    logout: [];
}>();

const route = useRoute();
const router = useRouter();
const showAuthModal = ref(false);

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'checkpoints', label: 'Checkpoints', icon: Database, path: '/checkpoints' },
    { id: 'loras', label: 'LoRAs', icon: Layers, path: '/loras' },
    { id: 'others', label: 'VAE / CLIP / Text', icon: Component, path: '/others' },
    { id: 'combinations', label: 'Combinations', icon: Palette, path: '/combinations' },
    { id: 'settings', label: 'Import / Settings', icon: Settings, path: '/settings' },
];

const isActiveRoute = (path: string) => {
    return route.path === path;
};

watch(showAuthModal, (newVal) => {
    if (newVal) {
        setTimeout(() => {
            if ((window as any).google) {
                (window as any).google.accounts.id.initialize({
                    client_id: '429109660694-adfb0tvhh3f848ml4tf0kvqfvt2f8nle.apps.googleusercontent.com',
                    callback: (response: any) => {
                        emit('login', response);
                        showAuthModal.value = false;
                    },
                });

                const btnDiv = document.getElementById('google-signin-btn');
                if (btnDiv) {
                    (window as any).google.accounts.id.renderButton(btnDiv, { theme: props.isDarkMode ? 'filled_black' : 'outline', size: 'large', width: 250 });
                }
            }
        }, 100);
    }
});
</script>
