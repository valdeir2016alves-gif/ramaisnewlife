<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  createPersonalFavorite, createPersonalNote, createSectorNote, createSectorShortcut,
  deletePersonalFavorite, deletePersonalNote, deleteSectorNote, deleteSectorShortcut,
  getPersonalFavorites, getPersonalNotes, getScheduleSummary, getSectorNotes,
  getSectorShortcuts, getSectors, updatePersonalNote,
} from '../api';

const router = useRouter();
const favorites = ref([]);
const personalNotes = ref([]);
const sectors = ref([]);
const selectedSectorId = ref(null);
const shortcuts = ref([]);
const sectorNotes = ref([]);
const summary = ref(null);
const newNote = ref('');
const loadingSector = ref(false);
const selectedSector = computed(() => sectors.value.find((sector) => sector.id === Number(selectedSectorId.value)) || null);

async function loadPersonal() {
  [favorites.value, personalNotes.value, sectors.value] = await Promise.all([
    getPersonalFavorites(), getPersonalNotes(), getSectors(),
  ]);
  if (!selectedSectorId.value && sectors.value.length) selectedSectorId.value = sectors.value[0].id;
}

async function loadSector() {
  const sector = selectedSector.value;
  shortcuts.value = []; sectorNotes.value = []; summary.value = null;
  if (!sector) return;
  loadingSector.value = true;
  try {
    [shortcuts.value, sectorNotes.value] = await Promise.all([
      getSectorShortcuts(sector.id), getSectorNotes(sector.id),
    ]);
    if (sector.features.schedule) summary.value = await getScheduleSummary(sector.id);
  } finally { loadingSector.value = false; }
}

async function addFavorite() {
  const title = prompt('Nome do favorito:'); if (!title) return;
  const url = prompt('URL (https://...):'); if (!url) return;
  await createPersonalFavorite({ title, url }); favorites.value = await getPersonalFavorites();
}
async function removeFavorite(id) { await deletePersonalFavorite(id); favorites.value = await getPersonalFavorites(); }
async function addPersonalNote() { if (!newNote.value.trim()) return; await createPersonalNote({ content: newNote.value }); newNote.value = ''; personalNotes.value = await getPersonalNotes(); }
async function patchNote(note, data) { await updatePersonalNote(note.id, data); personalNotes.value = await getPersonalNotes(); }
async function removeNote(id) { await deletePersonalNote(id); personalNotes.value = await getPersonalNotes(); }
async function addShortcut() {
  const title = prompt('Nome do atalho:'); if (!title) return;
  const url = prompt('URL (https://...):'); if (!url) return;
  await createSectorShortcut(selectedSector.value.id, { title, url }); await loadSector();
}
async function removeShortcut(id) { await deleteSectorShortcut(selectedSector.value.id, id); await loadSector(); }
async function addSectorNote() {
  const title = prompt('Título da nota (opcional):') || null;
  const content = prompt('Conteúdo da nota:'); if (!content) return;
  await createSectorNote(selectedSector.value.id, { title, content }); await loadSector();
}
async function removeSectorNote(id) { await deleteSectorNote(selectedSector.value.id, id); await loadSector(); }
function weekday(date) { return new Date(`${String(date).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' }); }

watch(selectedSectorId, loadSector);
onMounted(loadPersonal);
</script>

<template>
  <section class="portal">
    <div class="portal-title"><div><span>Central New Life</span><h2>Seu espaço de trabalho</h2></div><select v-if="sectors.length" v-model="selectedSectorId" aria-label="Setor selecionado"><option v-for="sector in sectors" :key="sector.id" :value="sector.id">{{ sector.name }}</option></select></div>
    <div class="grid personal-grid">
      <article class="widget"><header><h3>⭐ Meus favoritos</h3><button @click="addFavorite">＋</button></header><div class="links"><a v-for="item in favorites" :key="item.id" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.title }} <button title="Remover" @click.prevent="removeFavorite(item.id)">×</button></a><p v-if="!favorites.length">Adicione os sistemas que você mais usa.</p></div></article>
      <article class="widget"><header><h3>📝 Minhas notas</h3></header><form class="note-form" @submit.prevent="addPersonalNote"><input v-model="newNote" placeholder="Nova nota pessoal" /><button>Adicionar</button></form><ul><li v-for="note in personalNotes" :key="note.id" :class="{ completed: note.completed }"><button title="Fixar" @click="patchNote(note,{ pinned: !note.pinned })">{{ note.pinned ? '📌' : '·' }}</button><span @click="patchNote(note,{ completed: !note.completed })">{{ note.content }}</span><button title="Excluir" @click="removeNote(note.id)">×</button></li></ul></article>
    </div>

    <div v-if="selectedSector" class="sector-area">
      <div class="sector-heading"><h2>{{ selectedSector.name }}</h2><small v-if="loadingSector">Atualizando...</small></div>
      <div class="grid">
        <article class="widget"><header><h3>🔗 Atalhos do setor</h3><button v-if="selectedSector.permissions.canManage" @click="addShortcut">＋</button></header><div class="links"><a v-for="item in shortcuts" :key="item.id" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.title }} <button v-if="selectedSector.permissions.canManage" @click.prevent="removeShortcut(item.id)">×</button></a><p v-if="!shortcuts.length">Nenhum atalho publicado.</p></div></article>
        <article class="widget"><header><h3>📣 Notas do setor</h3><button v-if="selectedSector.permissions.canManage" @click="addSectorNote">＋</button></header><ul><li v-for="note in sectorNotes" :key="note.id"><span><strong v-if="note.title">{{ note.title }} — </strong>{{ note.content }}</span><button v-if="selectedSector.permissions.canManage" @click="removeSectorNote(note.id)">×</button></li></ul><p v-if="!sectorNotes.length">Nenhum comunicado ativo.</p></article>
        <article v-if="selectedSector.features.schedule" class="widget schedule-widget"><header><h3>📅 Escala</h3><button @click="router.push(`/schedule/${selectedSector.id}`)">{{ selectedSector.permissions.canManage ? 'Editar' : 'Ver' }}</button></header><template v-if="summary"><h4>Próximo domingo · {{ String(summary.next_sunday.date).slice(0,10).split('-').reverse().join('/') }}</h4><p>{{ summary.next_sunday.people.map(p => p.name).join(', ') || 'Sem plantão registrado' }}</p><h4>Próximo feriado</h4><p v-if="summary.next_holiday"><strong>{{ summary.next_holiday.name }}</strong> · {{ String(summary.next_holiday.date).slice(0,10).split('-').reverse().join('/') }}<br>{{ summary.next_holiday.people.map(p => p.name).join(', ') || 'Sem plantão registrado' }}</p><p v-else>Nenhum feriado cadastrado.</p><h4>Folgas da semana</h4><p v-for="item in summary.week.days_off" :key="`${item.member_id}-${item.date}`">{{ item.name }} — {{ weekday(item.date) }}</p><p v-if="!summary.week.days_off.length">Nenhuma folga registrada.</p></template></article>
      </div>
    </div>

    <div class="general"><h2>Acesso rápido</h2><div class="links general-links"><a href="https://app.octadesk.com/login" target="_blank" rel="noopener noreferrer">Atendimento</a><a href="https://downdetector.com.br/" target="_blank" rel="noopener noreferrer">DownDetector</a><a href="https://minhanewlife.com.br/" target="_blank" rel="noopener noreferrer">New Life</a></div></div>
  </section>
</template>

<style scoped>
.portal{max-width:1400px;margin:0 auto 3rem;padding:1rem}.portal-title,.sector-heading,.widget header{display:flex;justify-content:space-between;align-items:center;gap:1rem}.portal-title span{color:var(--primary-color);font-weight:800;text-transform:uppercase}.portal-title h2{margin:.25rem 0}.portal-title select,.note-form input{padding:.65rem;border:1px solid var(--card-border);border-radius:8px;background:var(--card-bg);color:var(--text-main)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}.personal-grid{margin:1rem 0 2rem}.widget{padding:1rem;border:1px solid var(--card-border);border-radius:14px;background:var(--card-bg);color:var(--text-main)}.widget h3{margin:0}.widget header button,.note-form button{border:0;border-radius:7px;padding:.45rem .7rem;background:var(--primary-color);color:white;cursor:pointer}.links{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem}.links a{padding:.55rem .75rem;border-radius:8px;background:rgba(59,130,246,.12);color:var(--text-main);text-decoration:none}.links button,.widget li button{border:0;background:transparent;color:inherit;cursor:pointer}.note-form{display:flex;gap:.5rem;margin-top:1rem}.note-form input{flex:1}.widget ul{list-style:none;padding:0}.widget li{display:flex;justify-content:space-between;gap:.5rem;padding:.5rem 0;border-bottom:1px solid var(--card-border)}.widget li span{flex:1;cursor:pointer}.completed span{text-decoration:line-through;opacity:.6}.sector-area{margin-top:1rem}.schedule-widget h4{margin:1rem 0 .25rem}.schedule-widget p{margin:.2rem 0;color:var(--text-muted)}.general{margin-top:2rem}.general-links a{font-weight:700}@media(max-width:600px){.portal-title{align-items:flex-start;flex-direction:column}.portal-title select{width:100%}.note-form{flex-direction:column}}
</style>
