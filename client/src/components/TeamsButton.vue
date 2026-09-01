<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import styles from '../styles/page.module.css';

defineProps({
  department: { type: String, required: true },
  contacts: { type: Array, default: () => [] },
});

const showPopover = ref(false);
const wrapperRef = ref(null);
const copiedEmail = ref(null);

function teamsLink(email) {
  return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(email)}`;
}

function copyEmail(email) {
  navigator.clipboard.writeText(email).then(() => {
    copiedEmail.value = email;
    setTimeout(() => {
      if (copiedEmail.value === email) {
        copiedEmail.value = null;
      }
    }, 2000);
  });
}

function togglePopover() {
  showPopover.value = !showPopover.value;
}

function handleClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    showPopover.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div ref="wrapperRef" :class="styles.teamsButtonWrapper">
    <button
      type="button"
      :class="styles.teamsButton"
      :aria-label="`Contatos Teams - ${department}`"
      @click.stop="togglePopover"
    >
      <img src="/teams-icon.svg" alt="Teams" width="14" height="14" />
    </button>
    <div v-if="showPopover" :class="styles.teamsPopover" @click.stop>
      <div :class="styles.teamsPopoverHeader">
        <span>Contatos Teams</span>
      </div>
      <div :class="styles.teamsPopoverBody">
        <div v-if="contacts.length === 0" style="padding: 1rem 0.5rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
          Nenhum contato Teams cadastrado.
        </div>
        <div
          v-for="contact in contacts"
          :key="contact.id"
          :class="styles.teamsContactItem"
        >
          <div style="display: flex; align-items: center; gap: 0.6rem; min-width: 0; flex-grow: 1;">
            <img src="/teams-icon.svg" alt="" width="16" height="16" :class="styles.teamsContactIcon" />
            <div :class="styles.teamsContactInfo">
              <span :class="styles.teamsContactName">{{ contact.name }}</span>
              <span :class="styles.teamsContactEmail">{{ contact.email }}</span>
            </div>
          </div>
          
          <div style="display: flex; gap: 0.4rem; flex-shrink: 0; margin-left: 0.5rem;">
            <button 
              @click.stop="copyEmail(contact.email)" 
              :title="copiedEmail === contact.email ? 'Copiado!' : 'Copiar Contato'" 
              :class="styles.teamsActionBtn"
            >
              <svg v-if="copiedEmail === contact.email" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #4CAF50;"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <a 
              :href="teamsLink(contact.email)" 
              target="_blank" 
              rel="noopener noreferrer" 
              title="Abrir no Teams" 
              :class="styles.teamsActionBtn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
