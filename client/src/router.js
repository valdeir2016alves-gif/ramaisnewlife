import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Admin from './views/Admin.vue';
import Login from './views/Login.vue';
import { authState, initializeAuth } from './auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login },
    { path: '/', name: 'home', component: Home, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: Admin, meta: { requiresAuth: true, roles: ['admin'] } },
  ],
});

router.beforeEach(async (to) => {
  await initializeAuth();

  if (to.name === 'login' && authState.user) return { name: 'home' };
  if (to.meta.requiresAuth && !authState.user) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.roles && !to.meta.roles.includes(authState.user?.role)) return { name: 'home' };
  return true;
});

export default router;
