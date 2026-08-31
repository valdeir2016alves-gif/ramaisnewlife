<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import styles from '../styles/page.module.css';
import UnderlineText from '../components/UnderlineText.vue';
import GlowCard from '../components/GlowCard.vue';
import MapImage from '../components/MapImage.vue';
import InfoButton from '../components/InfoButton.vue';
import Aurora from '../components/Aurora.vue';
import {
  getContacts, getLastUpdated, getDepartmentDescriptions,
  submitReport, registerVisit, authenticateUser,
} from '../api';

function getDepartmentDescription(dept, descriptions) {
  const normalized = dept.toLowerCase().replace(/–/g, '-').trim();

  if (descriptions[normalized]) {
    return descriptions[normalized];
  }

  if (normalized.includes('fideliza')) return descriptions['comercial - (fideliza)'] || descriptions['comercial – (fideliza)'];
  if (normalized.includes('agendamento')) return descriptions['agendamento - (instalação / troca end)'] || descriptions['agendamento – (instalação / troca end)'];
  if (normalized.includes('valoriza') || normalized.includes('recupera')) return descriptions['recuperação de crédito - (valoriza)'] || descriptions['recuperação de crédito – (valoriza)'];
  if (normalized.includes('pessoal') || normalized === 'rh') return descriptions['departamento pessoal (rh)'] || descriptions['departamento pessoal'];
  if (normalized.includes('imóve') || normalized.includes('imove') || normalized.includes('imobili')) return descriptions['new life imóveis'];
  if (normalized.includes('estoque')) return descriptions['estoque'];
  if (normalized.includes('suporte')) return descriptions['suporte técnico'] || descriptions['suporte tecnico'];
  if (normalized.includes('cancelamento')) return descriptions['cancelamento'];
  if (normalized.includes('caixa')) return descriptions['caixa'];
  if (normalized.includes('renova')) return descriptions['renovações'] || descriptions['renovacoes'];
  if (normalized.includes('gerência') || normalized.includes('gerencia')) return descriptions['gerência'] || descriptions['gerencia'];
  if (normalized.includes('financeiro')) return descriptions['financeiro'];
  if (normalized.includes('sac')) return descriptions['sac'];
  if (normalized.includes('noc')) return descriptions['noc'];
  if (normalized.includes('comercial')) return descriptions['comercial'];
  if (normalized.includes('regionais') || normalized.includes('externos')) return descriptions['contatos regionais e externos'];

  return '';
}

function onlyDigits(phone) {
  return phone.replace(/\D/g, '');
}

function isWhatsAppNumber(contact) {
  const onlyNumbers = onlyDigits(contact.phone);
  return onlyNumbers.length >= 11 ||
    (onlyNumbers.length === 10 && onlyNumbers[2] === '9') ||
    contact.name.toLowerCase().includes('whatsapp') ||
    contact.name.toLowerCase().includes('whats');
}

function waLink(contact) {
  return `https://wa.me/55${onlyDigits(contact.phone)}`;
}

const search = ref('');
const city = ref('sao_gabriel');
const theme = ref('dark');
const activeTooltip = ref(null);
const showInstructions = ref(false);
const showMap = ref(false);

const mapDots = [
  {
    start: { lat: -28.2628, lng: -52.4067, label: "Passo Fundo" },
    end: { lat: -30.3361, lng: -54.3204, label: "São Gabriel" }
  },
  {
    start: { lat: -30.3361, lng: -54.3204, label: "São Gabriel" },
    end: { lat: -31.3285, lng: -54.1068, label: "Bagé" }
  }
];
const showReportModal = ref(false);
const reportName = ref('');
const reportRamal = ref('');
const reportMessage = ref('');
const isSubmittingReport = ref(false);

const currentUser = ref(null);
const loginUsername = ref('');
const loginPassword = ref('');
const loginLoading = ref(false);
const isCheckingAuth = ref(true);

const contacts = ref([]);
const lastUpdated = ref('');
const descriptions = ref({});

async function handleReportSubmit(e) {
  e.preventDefault();
  isSubmittingReport.value = true;
  const result = await submitReport(reportName.value, reportRamal.value, reportMessage.value);
  isSubmittingReport.value = false;
  if (result.success) {
    alert('Relato enviado com sucesso! A equipe responsável foi notificada.');
    showReportModal.value = false;
    reportName.value = '';
    reportRamal.value = '';
    reportMessage.value = '';
  } else {
    alert('Erro ao enviar o relato. Tente novamente mais tarde.');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  loginLoading.value = true;
  const result = await authenticateUser(loginUsername.value, loginPassword.value);
  loginLoading.value = false;
  if (result.success && result.user) {
    currentUser.value = result.user;
    sessionStorage.setItem('clientAuth', JSON.stringify(result.user));
  } else {
    alert(result.error || 'Credenciais incorretas!');
  }
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}

onMounted(async () => {
  const savedAuth = sessionStorage.getItem('clientAuth');
  if (savedAuth) {
    try {
      currentUser.value = JSON.parse(savedAuth);
    } catch (e) {
      sessionStorage.removeItem('clientAuth');
    }
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    theme.value = savedTheme;
  }

  if (!sessionStorage.getItem('visited')) {
    registerVisit().catch(console.error);
    sessionStorage.setItem('visited', 'true');
  }

  const [contactsData, lastUpdatedData, descriptionsData] = await Promise.all([
    getContacts(),
    getLastUpdated(),
    getDepartmentDescriptions(),
  ]);
  contacts.value = contactsData || [];
  lastUpdated.value = lastUpdatedData;
  descriptions.value = descriptionsData || {};

  isCheckingAuth.value = false;
});

watch(theme, (value) => {
  document.documentElement.setAttribute('data-theme', value);
  localStorage.setItem('theme', value);
}, { immediate: true });

const groupedContacts = computed(() => {
  const filtered = contacts.value.filter((c) => {
    if (c.hidden) return false;
    const cCity = c.city || 'sao_gabriel';
    const matchesSearch = c.name.toLowerCase().includes(search.value.toLowerCase()) ||
                          c.department.toLowerCase().includes(search.value.toLowerCase()) ||
                          c.phone.includes(search.value);
    const matchesCity = cCity === city.value;
    if (cCity === 'all') return matchesSearch;
    return matchesSearch && matchesCity;
  });

  const groups = {};
  filtered.forEach(c => {
    if (!groups[c.department]) groups[c.department] = [];
    groups[c.department].push(c);
  });

  return groups;
});

const regionalContacts = computed(() => groupedContacts.value['Contatos Regionais e Externos']);
const otherDepartments = computed(() =>
  Object.entries(groupedContacts.value).filter(([dep]) => dep !== 'Contatos Regionais e Externos')
);
const showNoResults = computed(() => otherDepartments.value.length === 0 && !regionalContacts.value);
const noResultsText = computed(() =>
  search.value.trim() !== '' || city.value !== 'passo_fundo' ? 'Nenhum contato encontrado.' : 'Em breve'
);

function isImoveisDept(department) {
  return department.toLowerCase().includes('imóveis') || department.toLowerCase().includes('imobiliária');
}

function openTooltip(department, text) {
  activeTooltip.value = { department, text };
}
</script>

<template>
  <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1;">
    <Aurora :color-stops="['#000B18', '#0047AB', '#000B18']" :blend="0.8" :amplitude="1.5" :speed="0.5" />
  </div>
  <main :class="styles.main" style="min-height: 100vh; display: flex; flex-direction: column;">
    <template v-if="isCheckingAuth">
      <div :class="styles.skeletonHeader"></div>
      <div :class="styles.skeletonTabs"></div>
      <div :class="styles.skeletonGrid">
        <div v-for="i in 6" :key="i" :class="styles.skeletonCard">
          <div :class="styles.skeletonLine" style="width: 60%; height: 24px; margin-bottom: 1.5rem"></div>
          <div v-for="j in 3" :key="j" style="display: flex; justify-content: space-between; margin-bottom: 1rem">
            <div :class="styles.skeletonLine" style="width: 40%"></div>
            <div :class="styles.skeletonLine" style="width: 30%"></div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="!currentUser">
      <div style="max-width: 320px; margin: 40px auto; background: var(--card-bg); padding: 1.5rem 1.5rem; border-radius: 12px; border: 1px solid var(--card-border); box-shadow: 0 10px 25px rgba(0,0,0,0.1)">
        <div style="text-align: center; margin-bottom: 1.5rem">
          <div style="display: flex; justify-content: center; width: 100%; margin-bottom: 1rem">
            <img src="/logo.png" alt="New Life Logo" width="220" height="75" style="object-fit: contain; filter: var(--logo-filter); max-height: 75px; width: auto" />
          </div>
          <h2 style="color: var(--primary-color); margin-top: 0; margin-bottom: 0.5rem; font-size: 1.25rem">Acesso Interno</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.4">
            Diretório de <strong>Ramais</strong> internos das Unidades <strong>São Gabriel</strong>, <strong>Bagé</strong> e <strong>Passo Fundo</strong>
          </p>
        </div>
        <form @submit="handleLogin" style="display: flex; flex-direction: column; gap: 1rem">
          <input
            type="text"
            placeholder="Usuário"
            v-model="loginUsername"
            style="padding: 0.8rem; border-radius: 6px; border: 1px solid var(--card-border); background: transparent; color: var(--text-main)"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            v-model="loginPassword"
            style="padding: 0.8rem; border-radius: 6px; border: 1px solid var(--card-border); background: transparent; color: var(--text-main)"
            required
          />
          <button
            type="submit"
            :disabled="loginLoading"
            style="padding: 0.8rem; border-radius: 6px; border: none; background: var(--primary-color); color: #fff; font-weight: bold; cursor: pointer"
          >
            {{ loginLoading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </template>

    <template v-else>
      <header :class="styles.header">
        <div :class="styles.logoContainer">
          <a href="https://minhanewlife.com.br/" target="_blank" rel="noopener noreferrer" style="display: inline-block">
            <img
              src="/logo.png"
              alt="New Life"
              width="320"
              height="128"
              style="object-fit: contain; filter: var(--logo-filter); max-width: 100%; height: auto; max-height: 110px"
            />
          </a>
        </div>

        <div :class="styles.headerRight">
          <div :class="styles.searchContainer">
            <input
              type="text"
              placeholder="Pesquisar contato, nome ou setor..."
              :class="styles.searchInput"
              v-model="search"
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="styles.searchIcon">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <GlowCard :inner-class-name="styles.glowButtonInner" :class-name="styles.instructionsButtonWrapper" :style="{ '--glow-color': 'rgba(255, 255, 255, 0.4)' }">
            <button
              @click="showInstructions = true"
              :class="styles.instructionsButton"
              title="Instruções de Uso"
              style="border: none; background: transparent"
            >
              ❓ Instruções
            </button>
          </GlowCard>

          <button
            @click="toggleTheme"
            :class="styles.themeToggle"
            :title="theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'"
          >
            {{ theme === 'dark' ? '☀️' : '🌙' }}
          </button>
        </div>
      </header>

      <section :class="styles.heroSection">
        <div :class="styles.heroLeft">
          <h1 :class="styles.heroTitle">
            Diretório de Contatos internos das Unidades <span style="color: var(--primary-color)">São Gabriel, Bagé e Passo Fundo</span>
          </h1>
        </div>
        <div :class="styles.heroRight">
          <div v-if="regionalContacts" :class="styles.departmentSection" style="margin-bottom: 0; height: 100%">
            <div :class="styles.departmentHeader">
              <div :class="styles.departmentHeaderLeft">
                <span :class="styles.departmentSubtitle">Contatos Regionais e Externos</span>
                <h2 :class="styles.departmentTitle">Colaborador(a) e Contatos</h2>
              </div>
              <div :class="styles.departmentHeaderRight">
                <InfoButton
                  department="Contatos Regionais e Externos"
                  :text="getDepartmentDescription('Contatos Regionais e Externos', descriptions)"
                  @open="openTooltip('Contatos Regionais e Externos', getDepartmentDescription('Contatos Regionais e Externos', descriptions))"
                />
              </div>
            </div>
            <div :class="styles.contactList">
              <div v-for="contact in regionalContacts" :key="contact.id" :class="styles.contactItem">
                <span :class="styles.chevron">
                  <img v-if="isWhatsAppNumber(contact)" src="/whatsapp-icon.svg" alt="WhatsApp" width="16" height="16" style="vertical-align: middle" />
                  <img v-else src="/phone-icon.svg" alt="Telefone" width="16" height="16" style="vertical-align: middle" />
                </span>
                <span :class="styles.contactName">{{ contact.name }}</span>
                <a v-if="isWhatsAppNumber(contact)" :href="waLink(contact)" target="_blank" rel="noopener noreferrer" :class="styles.whatsappLink">
                  {{ contact.phone }}
                </a>
                <span v-else :class="styles.contactPhone">{{ contact.phone }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div :class="styles.cityTabs">
        <button :class="[styles.cityTab, city === 'sao_gabriel' ? styles.cityTabActive : '']" @click="city = 'sao_gabriel'">
          São Gabriel
        </button>
        <button :class="[styles.cityTab, city === 'bage' ? styles.cityTabActive : '']" @click="city = 'bage'">
          Bagé
        </button>
        <button :class="[styles.cityTab, city === 'passo_fundo' ? styles.cityTabActive : '']" @click="city = 'passo_fundo'">
          Passo Fundo
        </button>
      </div>

      <section :class="styles.content">
        <div v-if="showNoResults" :class="styles.noResults">
          {{ noResultsText }}
        </div>
        <template v-else>
          <div
            v-for="[department, deptContacts] in otherDepartments"
            :key="department"
            :class="[styles.departmentSection, isImoveisDept(department) ? styles.departmentSectionImoveis : '']"
          >
            <div :class="styles.departmentHeader">
              <div :class="styles.departmentHeaderLeft">
                <span :class="styles.departmentSubtitle">{{ department }}</span>
                <h2 :class="styles.departmentTitle">Colaborador(a) e Contatos</h2>
              </div>
              <div :class="styles.departmentHeaderRight">
                <div v-if="isImoveisDept(department)" :class="styles.departmentLogo">
                  <a href="https://www.newlifeimoveis.imb.br/" target="_blank" rel="noopener noreferrer">
                    <img src="/logo-imoveis.png" alt="New Life Imóveis" width="70" height="50" style="object-fit: contain; max-height: 40px; width: auto" />
                  </a>
                </div>
                <InfoButton
                  :department="department"
                  :text="getDepartmentDescription(department, descriptions)"
                  @open="openTooltip(department, getDepartmentDescription(department, descriptions))"
                />
              </div>
            </div>

            <div :class="styles.contactList">
              <div v-for="contact in deptContacts" :key="contact.id" :class="styles.contactItem">
                <span :class="styles.chevron">
                  <img v-if="isWhatsAppNumber(contact)" src="/whatsapp-icon.svg" alt="WhatsApp" width="16" height="16" style="vertical-align: middle" />
                  <img v-else src="/phone-icon.svg" alt="Telefone" width="16" height="16" style="vertical-align: middle" />
                </span>
                <span :class="styles.contactName">{{ contact.name }}</span>
                <a v-if="isWhatsAppNumber(contact)" :href="waLink(contact)" target="_blank" rel="noopener noreferrer" :class="styles.whatsappLink">
                  {{ contact.phone }}
                </a>
                <span v-else :class="styles.contactPhone">{{ contact.phone }}</span>
              </div>
            </div>
          </div>
        </template>
      </section>

      <footer :class="styles.footer" style="margin-top: auto; flex-direction: row; justify-content: space-between; align-items: flex-end; padding: 2rem 1rem 1rem 1rem; border-top: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap;">
        
        <!-- Esquerda: Info e Erros -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
          <div style="height: 30px; display: flex; justify-content: flex-start; align-items: center;">
            <UnderlineText :text="`Atualizado em: ${lastUpdated} - NOC`" />
          </div>
          <button @click="showReportModal = true" :class="styles.reportLinkBtn" style="padding: 0; background: transparent; border: none; font-family: inherit; cursor: pointer;">
            Encontrou um contato errado? Avise aqui!
          </button>
        </div>

        <!-- Direita: Links Úteis (No estilo do site principal) -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; min-width: 150px; margin-top: 1rem;">
          <h4 style="color: var(--primary-color); font-size: 1rem; margin: 0 0 0.25rem 0; font-weight: 600;">links úteis</h4>
          
          <a href="https://sac.newlifefibra.com.br/mk" target="_blank" style="color: var(--text-muted); text-decoration: none; font-size: 0.85rem; transition: color 0.2s;" onmouseover="this.style.color='var(--text-main)'" onmouseout="this.style.color='var(--text-muted)'">
            MK Solutions
          </a>
          
          <a href="https://app.octadesk.com/login?" target="_blank" style="color: var(--text-muted); text-decoration: none; font-size: 0.85rem; transition: color 0.2s;" onmouseover="this.style.color='var(--text-main)'" onmouseout="this.style.color='var(--text-muted)'">
            Octadesk
          </a>
          
          <a href="#" @click.prevent="showMap = true" style="color: var(--text-muted); text-decoration: none; font-size: 0.85rem; transition: color 0.2s;" onmouseover="this.style.color='var(--text-main)'" onmouseout="this.style.color='var(--text-muted)'">
            Presença no RS
          </a>
        </div>
      </footer>

      <div v-if="showInstructions" :class="styles.modalOverlay" @click="showInstructions = false">
        <div :class="styles.modalContent" style="max-width: 800px" @click.stop>
          <div :class="styles.modalHeader">
            <h3>Instruções de Atendimento</h3>
            <button :class="styles.closeButton" @click="showInstructions = false">✕</button>
          </div>
          <div :class="styles.modalBody" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; padding: 1rem">
            <GlowCard :style="{ '--glow-color': 'rgba(255,255,255,0.4)' }">
              <div style="padding: 1.5rem; background: var(--card-bg); width: 100%; height: 100%; border-radius: 14px">
                <div :class="styles.instructionItem" style="flex-direction: column; gap: 0.75rem">
                  <div :class="styles.instructionIcon">📞</div>
                  <div>
                    <p style="margin-top: 0.5rem">Digite <span>*8</span> e aguarde a ligação ser puxada.</p>
                  </div>
                </div>
              </div>
            </GlowCard>
            <GlowCard :style="{ '--glow-color': 'rgba(255,255,255,0.4)' }">
              <div style="padding: 1.5rem; background: var(--card-bg); width: 100%; height: 100%; border-radius: 14px">
                <div :class="styles.instructionItem" style="flex-direction: column; gap: 0.75rem">
                  <div :class="styles.instructionIcon">🗣️</div>
                  <div>
                    <p style="margin-top: 0.5rem">Digite <span>*2</span>, aguarde a voz automática falar "transferir", digite o ramal desejado e aguarde.</p>
                  </div>
                </div>
              </div>
            </GlowCard>
            <GlowCard :style="{ '--glow-color': 'rgba(255,255,255,0.4)', gridColumn: '1 / -1' }">
              <div style="padding: 1.5rem; background: var(--card-bg); width: 100%; height: 100%; border-radius: 14px">
                <div :class="styles.instructionItem" style="flex-direction: column; gap: 0.75rem">
                  <div :class="styles.instructionIcon">⚠️</div>
                  <div>
                    <p style="margin-top: 0.5rem">Os contatos de WhatsApp disponibilizados nesta página são destinados <strong>exclusivamente</strong> à comunicação interna da empresa. O número de WhatsApp de qualquer colaborador somente poderá ser encaminhado a clientes mediante autorização prévia do responsável pelo contato.</p>
                  </div>
                </div>
              </div>
            </GlowCard>
          </div>
        </div>
      </div>

      <div v-if="showMap" :class="styles.modalOverlay" @click="showMap = false">
        <div :class="styles.modalContent" style="max-width: 900px" @click.stop>
          <div :class="styles.modalHeader">
            <h3 style="text-transform: uppercase;">Presença no RS</h3>
            <button :class="styles.closeButton" @click="showMap = false">✕</button>
          </div>
          <div :class="styles.modalBody" style="padding: 1rem; width: 100%; min-height: 450px; height: 60vh; max-height: 600px; display: flex; justify-content: center; align-items: center; overflow-y: auto;">
            <MapImage />
          </div>
        </div>
      </div>

      <div v-if="showReportModal" :class="styles.modalOverlay" @click="showReportModal = false">
        <div :class="styles.modalContent" @click.stop>
          <div :class="styles.modalHeader">
            <h3>Reportar Contato Errado</h3>
            <button :class="styles.closeButton" @click="showReportModal = false">✕</button>
          </div>
          <form @submit="handleReportSubmit" :class="styles.modalBody">
            <div :class="styles.formGroup">
              <label>Seu Nome / Setor (Opcional)</label>
              <input
                type="text"
                v-model="reportName"
                :class="styles.modalInput"
                placeholder="Ex: João (Suporte)"
              />
            </div>
            <div :class="styles.formGroup">
              <label>Qual contato está com problema?</label>
              <input
                type="text"
                v-model="reportRamal"
                :class="styles.modalInput"
                placeholder="Ex: Contato 4050 do TI"
                required
              />
            </div>
            <div :class="styles.formGroup">
              <label>O que está errado?</label>
              <textarea
                v-model="reportMessage"
                :class="styles.modalInput"
                placeholder="Ex: O contato não chama, ou está na mesa errada..."
                rows="3"
                required
              ></textarea>
            </div>
            <button type="submit" :class="styles.btnPrimary" :disabled="isSubmittingReport">
              {{ isSubmittingReport ? 'Enviando...' : 'Enviar Relato' }}
            </button>
          </form>
        </div>
      </div>
    </template>

    <div v-if="activeTooltip" :class="styles.modalOverlay" @click="activeTooltip = null" style="z-index: 99999">
      <div :class="styles.modalContent" style="max-width: 500px" @click.stop>
        <div :class="styles.modalHeader">
          <h3 style="text-transform: uppercase; font-size: 1.2rem; margin: 0; color: var(--primary-color)">{{ activeTooltip.department }}</h3>
          <button :class="styles.closeButton" @click="activeTooltip = null">✕</button>
        </div>
        <div :class="styles.modalBody" style="padding: 2rem 1.5rem; line-height: 1.6; font-size: 1.05rem; text-align: center">
          <p>{{ activeTooltip.text }}</p>
        </div>
      </div>
    </div>
  </main>
</template>
