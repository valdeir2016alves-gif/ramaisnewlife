import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { clearAuth } from './auth';
import './styles/globals.css';

window.addEventListener('auth:unauthorized', () => {
  clearAuth();
  if (router.currentRoute.value.name !== 'login') {
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
  }
});

createApp(App).use(router).mount('#app');
