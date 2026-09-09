<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createScheduleMember, getSchedule, getSector, saveScheduleEntries } from '../api';

const route = useRoute();
const router = useRouter();
const sector = ref(null);
const mode = ref('week');
const cursor = ref(new Date());
const members = ref([]);
const holidays = ref([]);
const cells = ref(new Map());
const dirty = ref(new Map());
const loading = ref(true);
const saving = ref(false);
const newMemberName = ref('');
const newMemberCity = ref('');

const pad = (value) => String(value).padStart(2, '0');
const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date, amount) => { const result = new Date(date); result.setDate(result.getDate() + amount); return result; };

const days = computed(() => {
  if (mode.value === 'month') {
    const last = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 0).getDate();
    return Array.from({ length: last }, (_, index) => new Date(cursor.value.getFullYear(), cursor.value.getMonth(), index + 1));
  }
  const start = new Date(cursor.value);
  const weekday = start.getDay() || 7;
  start.setDate(start.getDate() - weekday + 1);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
});

const canManage = computed(() => sector.value?.permissions?.canManage === true);
const scheduleEnabled = computed(() => sector.value?.features?.schedule === true);
const periodLabel = computed(() => mode.value === 'month'
  ? cursor.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  : `${days.value[0]?.toLocaleDateString('pt-BR')} – ${days.value.at(-1)?.toLocaleDateString('pt-BR')}`);

function key(memberId, date) { return `${memberId}:${date}`; }
function cell(memberId, date) { return cells.value.get(key(memberId, date)) || { status: 'NORMAL', note: '' }; }
function symbol(status) { return status === 'PLANTAO' ? 'P' : status === 'FOLGA' ? 'F' : '–'; }
function holidayOn(day) { return holidays.value.filter((holiday) => String(holiday.date).slice(0, 10) === iso(day)); }

function changeCell(member, day) {
  if (!canManage.value) return;
  const date = iso(day);
  const current = cell(member.id, date);
  const status = current.status === 'NORMAL' ? 'PLANTAO' : current.status === 'PLANTAO' ? 'FOLGA' : 'NORMAL';
  const next = { ...current, member_id: member.id, date, status };
  cells.value.set(key(member.id, date), next);
  dirty.value.set(key(member.id, date), next);
}

function editNote(member, day) {
  if (!canManage.value) return;
  const date = iso(day);
  const current = cell(member.id, date);
  const note = prompt('Observação da célula:', current.note || '');
  if (note === null) return;
  const next = { ...current, member_id: member.id, date, note };
  cells.value.set(key(member.id, date), next);
  dirty.value.set(key(member.id, date), next);
}

async function load() {
  loading.value = true;
  try {
    sector.value = await getSector(route.params.sectorId);
    if (!scheduleEnabled.value) return;
    const data = await getSchedule(route.params.sectorId, iso(days.value[0]), iso(days.value.at(-1)));
    members.value = data.members.filter((member) => member.active);
    holidays.value = data.holidays;
    cells.value = new Map(data.entries.map((entry) => [key(entry.member_id, String(entry.date).slice(0, 10)), {
      ...entry, date: String(entry.date).slice(0, 10),
    }]));
    dirty.value = new Map();
  } finally { loading.value = false; }
}

async function save() {
  if (!dirty.value.size) return;
  saving.value = true;
  try {
    await saveScheduleEntries(route.params.sectorId, [...dirty.value.values()]);
    await load();
  } finally { saving.value = false; }
}

async function addMember() {
  if (!newMemberName.value.trim()) return;
  await createScheduleMember(route.params.sectorId, { name: newMemberName.value, city: newMemberCity.value || null });
  newMemberName.value = '';
  newMemberCity.value = '';
  await load();
}

function navigate(direction) {
  const next = new Date(cursor.value);
  if (mode.value === 'month') { next.setDate(1); next.setMonth(next.getMonth() + direction); }
  else next.setDate(next.getDate() + 7 * direction);
  cursor.value = next;
}

watch([mode, cursor], load);
onMounted(load);
</script>

<template>
  <main class="schedule-page">
    <header class="schedule-header">
      <div><button class="link" @click="router.push('/')">← Voltar</button><h1>Escala — {{ sector?.name }}</h1></div>
      <div class="controls">
        <button @click="navigate(-1)">‹</button>
        <strong>{{ periodLabel }}</strong>
        <button @click="navigate(1)">›</button>
        <select v-model="mode"><option value="week">Semana</option><option value="month">Mês</option></select>
        <button v-if="canManage" class="primary" :disabled="!dirty.size || saving" @click="save">
          {{ saving ? 'Salvando...' : `Salvar${dirty.size ? ` (${dirty.size})` : ''}` }}
        </button>
      </div>
    </header>

    <p v-if="loading">Carregando escala...</p>
    <section v-else-if="!scheduleEnabled" class="empty">A escala não está habilitada para este setor.</section>
    <template v-else>
      <form v-if="canManage" class="member-form" @submit.prevent="addMember">
        <input v-model="newMemberName" placeholder="Nome do membro" required />
        <input v-model="newMemberCity" placeholder="Cidade (opcional)" />
        <button class="primary">Adicionar à escala</button>
      </form>
      <p class="legend">P = Plantão · F = Folga · – = expediente normal · clique direito adiciona observação</p>
      <div class="sheet-wrap">
        <table class="sheet">
          <thead><tr><th class="person">Pessoa</th><th v-for="day in days" :key="iso(day)" :class="{ sunday: day.getDay() === 0, holiday: holidayOn(day).length }" :title="holidayOn(day).map(h => h.name).join(', ')">{{ day.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }) }}</th></tr></thead>
          <tbody><tr v-for="member in members" :key="member.id"><th class="person">{{ member.name }}<small v-if="member.city">{{ member.city }}</small></th><td v-for="day in days" :key="iso(day)" :class="['cell', cell(member.id, iso(day)).status.toLowerCase(), { sunday: day.getDay() === 0, holiday: holidayOn(day).some(h => !h.city || h.city === member.city), editable: canManage }]" :title="cell(member.id, iso(day)).note || holidayOn(day).map(h => h.name).join(', ')" @click="changeCell(member, day)" @contextmenu.prevent="editNote(member, day)">{{ symbol(cell(member.id, iso(day)).status) }}<span v-if="cell(member.id, iso(day)).note" class="note-dot">•</span></td></tr></tbody>
        </table>
      </div>
      <p v-if="!members.length" class="empty">Nenhum membro cadastrado na escala.</p>
    </template>
  </main>
</template>

<style scoped>
.schedule-page{padding:2rem;min-height:100vh;color:var(--text-main)}.schedule-header,.controls,.member-form{display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap}.schedule-header h1{margin:.4rem 0 1rem}.controls strong{min-width:190px;text-align:center;text-transform:capitalize}button,select,input{padding:.65rem .85rem;border:1px solid var(--card-border);border-radius:8px;background:var(--card-bg);color:var(--text-main)}button{cursor:pointer}.primary{background:var(--primary-color);color:white;border:0}.link{background:transparent}.member-form{justify-content:flex-start;margin:1rem 0}.sheet-wrap{overflow:auto;border:1px solid var(--card-border);border-radius:12px}.sheet{border-collapse:collapse;min-width:100%;background:var(--card-bg)}th,td{border:1px solid var(--card-border);padding:.65rem;text-align:center;min-width:58px}.person{position:sticky;left:0;z-index:2;min-width:170px;text-align:left;background:var(--card-bg)}.person small{display:block;color:var(--text-muted)}.cell.editable{cursor:pointer}.plantao{background:rgba(16,185,129,.3);font-weight:800}.folga{background:rgba(59,130,246,.3);font-weight:800}.sunday{box-shadow:inset 0 0 0 1px rgba(239,68,68,.45)}.holiday{background-image:linear-gradient(rgba(245,158,11,.14),rgba(245,158,11,.14))}.note-dot{color:#f59e0b;margin-left:2px}.legend,.empty{color:var(--text-muted)}
</style>
