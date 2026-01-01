<template>
  <div>
    <div class="group fixed left-0 top-0 h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out z-50 w-20 hover:w-64 shadow-xl shadow-black/5 dark:shadow-black/50">
      
      <!-- Header -->
      <div class="h-20 flex items-center justify-center group-hover:justify-start group-hover:px-6 transition-all duration-300 border-b border-slate-200 dark:border-slate-800/50 mb-2 overflow-hidden flex-shrink-0">
        <div class="w-10 h-10 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 dark:shadow-indigo-900/20">
          <Sparkles :size="20" />
        </div>
        <div class="ml-0 group-hover:ml-3 overflow-hidden w-0 group-hover:w-auto transition-all duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
          <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400">
            NeuroGallery
          </h1>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-2 overflow-x-hidden overflow-y-auto">
        <button
          v-for="item in navItems"
          :key="item.id"
          @click="$emit('update:activeTab', item.id)"
          :title="item.label"
          :class="[
            'w-full flex items-center h-12 rounded-lg transition-all duration-200 relative whitespace-nowrap justify-center group-hover:justify-start group-hover:px-4',
            activeTab === item.id
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 dark:shadow-indigo-900/30'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          ]"
        >
          <div class="flex-shrink-0">
            <component :is="item.icon" :size="20" />
          </div>
          
          <span class="ml-0 group-hover:ml-3 font-medium transition-all duration-300 opacity-0 w-0 group-hover:w-auto group-hover:opacity-100 overflow-hidden">
            {{ item.label }}
          </span>
        </button>
      </nav>

      <!-- Footer / Theme Toggle / User -->
      <div class="p-4 border-t border-slate-200 dark:border-slate-800 text-slate-500 flex flex-col gap-2 items-center group-hover:items-start overflow-hidden whitespace-nowrap flex-shrink-0">
        
        <button 
          @click="$emit('toggleTheme')"
          class="flex items-center w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors justify-center group-hover:justify-start"
          :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <Sun v-if="isDarkMode" :size="20" />
          <Moon v-else :size="20" />
          <span class="ml-0 group-hover:ml-3 opacity-0 group-hover:opacity-100 transition-all duration-300 w-0 group-hover:w-auto overflow-hidden text-sm font-medium">
            {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
          </span>
        </button>

        <div v-if="user" class="flex items-center w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors justify-center group-hover:justify-start mt-1">
          <img :src="user.picture" :alt="user.name" class="w-5 h-5 rounded-full ring-2 ring-indigo-500 flex-shrink-0" />
          <div class="ml-0 group-hover:ml-3 opacity-0 group-hover:opacity-100 transition-all duration-300 w-0 group-hover:w-auto overflow-hidden flex flex-col items-start">
            <span class="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{{ user.name }}</span>
            <button @click="$emit('logout')" class="text-[10px] text-red-500 hover:underline flex items-center gap-1">
              Log Out
            </button>
          </div>
        </div>

        <button 
          v-else
          @click="showAuthModal = true"
          class="flex items-center w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors justify-center group-hover:justify-start"
          title="Sign In"
        >
          <LogIn :size="20" />
          <span class="ml-0 group-hover:ml-3 opacity-0 group-hover:opacity-100 transition-all duration-300 w-0 group-hover:w-auto overflow-hidden text-sm font-medium">
            Sign In
          </span>
        </button>

        <div class="text-xs text-center group-hover:text-left w-full pt-2">
          <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden group-hover:inline-block delay-100">
            v1.0.0
          </span>
          <span class="group-hover:hidden inline-block opacity-50">
            v1
          </span>
        </div>
      </div>
    </div>

    <!-- Auth Modal -->
    <div v-if="showAuthModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 dark:border-slate-700 relative">
        <button 
          @click="showAuthModal = false"
          class="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <X :size="20" />
        </button>
        
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
            <LogIn :size="32" />
          </div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
          <p class="text-slate-500 dark:text-slate-400 text-sm">Sign in to sync your preferences and access premium features.</p>
        </div>

        <div class="flex justify-center min-h-[50px]">
          <div id="google-signin-btn"></div>
        </div>

        <div class="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { LayoutDashboard, Database, Layers, Component, Palette, Sparkles, Settings, Sun, Moon, LogIn, LogOut, X } from 'lucide-vue-next';
import type { User } from '../types';

const props = defineProps<{
  activeTab: string;
  isDarkMode: boolean;
  user: User | null;
}>();

const emit = defineEmits<{
  'update:activeTab': [tab: string];
  toggleTheme: [];
  login: [response: any];
  logout: [];
}>();

const showAuthModal = ref(false);

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'checkpoints', label: 'Checkpoints', icon: Database },
  { id: 'loras', label: 'LoRAs', icon: Layers },
  { id: 'others', label: 'VAE / CLIP / Text', icon: Component },
  { id: 'combinations', label: 'Combinations', icon: Palette },
  { id: 'settings', label: 'Import / Settings', icon: Settings },
];

watch(showAuthModal, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: "429109660694-adfb0tvhh3f848ml4tf0kvqfvt2f8nle.apps.googleusercontent.com",
          callback: (response: any) => {
            emit('login', response);
            showAuthModal.value = false;
          }
        });
        
        const btnDiv = document.getElementById("google-signin-btn");
        if (btnDiv) {
          (window as any).google.accounts.id.renderButton(
            btnDiv,
            { theme: props.isDarkMode ? "filled_black" : "outline", size: "large", width: 250 }
          );
        }
      }
    }, 100);
  }
});
</script>
