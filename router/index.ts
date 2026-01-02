import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import ModelsView from '../views/ModelsView.vue';
import CombinationsView from '../views/CombinationsView.vue';
import SettingsView from '../views/SettingsView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/checkpoints',
      name: 'checkpoints',
      component: ModelsView
    },
    {
      path: '/loras',
      name: 'loras',
      component: ModelsView
    },
    {
      path: '/others',
      name: 'others',
      component: ModelsView
    },
    {
      path: '/combinations',
      name: 'combinations',
      component: CombinationsView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    }
  ]
});

export default router;
