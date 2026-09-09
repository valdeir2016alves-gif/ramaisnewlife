<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '../api';
import { useAuth } from '../auth';

const route = useRoute();
const router = useRouter();
const { login } = useAuth();
const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  loading.value = true;
  errorMessage.value = '';
  try {
    await login(username.value, password.value);
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/';
    await router.replace(redirect);
  } catch (error) {
    errorMessage.value = error instanceof ApiError
      ? error.message
      : 'Não foi possível entrar. Tente novamente.';
  } finally {
    password.value = '';
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <img src="/logo.png" alt="New Life" class="login-logo" />
      <h1>Acesso Interno</h1>
      <p>Entre para acessar a Central New Life e o diretório de Ramais.</p>
      <form @submit.prevent="handleLogin">
        <label>
          Usuário
          <input v-model.trim="username" type="text" autocomplete="username" required autofocus />
        </label>
        <label>
          Senha
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>
        <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page { min-height: calc(100vh - 70px); display: grid; place-items: center; padding: 2rem; }
.login-card { width: min(100%, 360px); padding: 2rem; border: 1px solid var(--card-border); border-radius: 16px; background: var(--card-bg); box-shadow: 0 18px 50px rgba(0, 0, 0, .18); text-align: center; }
.login-logo { width: 220px; max-width: 100%; height: 80px; object-fit: contain; filter: var(--logo-filter); }
h1 { color: var(--primary-color); margin-bottom: .5rem; }
p { color: var(--text-muted); line-height: 1.5; }
form, label { display: flex; flex-direction: column; text-align: left; }
form { gap: 1rem; margin-top: 1.5rem; }
label { gap: .4rem; color: var(--text-main); font-weight: 600; }
input { padding: .8rem; border-radius: 7px; border: 1px solid var(--card-border); background: transparent; color: var(--text-main); }
button { padding: .85rem; border: 0; border-radius: 7px; background: var(--primary-color); color: #fff; font-weight: 700; cursor: pointer; }
button:disabled { cursor: wait; opacity: .7; }
.login-error { margin: 0; color: #ef4444; text-align: left; }
</style>
