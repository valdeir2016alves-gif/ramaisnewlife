<script setup>
import { ref, computed } from 'vue';
import styles from '../styles/admin.module.css';
import GlareCard from '../components/GlareCard.vue';
import EditableRow from '../components/EditableRow.vue';
import DescriptionRow from '../components/DescriptionRow.vue';
import StatsChart from '../components/StatsChart.vue';
import {
  getContacts, addContact, deleteContact, updateContact, renameDepartment,
  getReports, deleteReport, authenticateUser, getUsers as fetchUsers,
  addUser as createUser, updateUser as editUser, deleteUser as removeUser,
  getAnalytics, reorderContact, toggleContactVisibility, getDepartmentDescriptions, updateDepartmentDescription,
} from '../api';

const departmentEmojis = {
  'Contatos Regionais e Externos': '📞',
  'Estoque': '📦',
  'Suporte Técnico': '💻',
  'Caixa': '💰',
  'Cancelamento': '🚫',
  'Comercial': '📈',
  'Renovações': '🔄',
  'Recuperação de Crédito': '🛡️',
  'Financeiro': '📊',
  'RH': '🧑‍💼',
  'SAC': '🎧',
  'NOC': '📡',
  'Imobiliária': '🏠',
  'Gerência': '💼',
  'Agendamento': '📅',
};

const getEmoji = (dept) => departmentEmojis[dept] || '🏢';

const currentUser = ref(null);
const loginUsername = ref('');
const loginPassword = ref('');

const contacts = ref([]);
const name = ref('');
const phone = ref('');
const department = ref('');
const ip = ref('');
const phoneModel = ref('');
const newCity = ref('sao_gabriel');
const adminCity = ref('sao_gabriel');
const activeTab = ref('ramais');
const reports = ref([]);
const systemUsers = ref([]);
const expandedDeps = ref({});

const stats = ref([]);
const descriptions = ref({});
const loading = ref(false);

// New user form
const newUsername = ref('');
const newUserPassword = ref('');
const newUserRole = ref('readonly');

const canEdit = computed(() => currentUser.value?.role === 'admin');

function toggleCollapse(dep) {
  expandedDeps.value = { ...expandedDeps.value, [dep]: !expandedDeps.value[dep] };
}

async function loadUsers() {
  systemUsers.value = await fetchUsers();
}

async function loadStats() {
  stats.value = await getAnalytics();
}

async function loadContacts() {
  loading.value = true;
  try {
    const [data, reportsData, descData] = await Promise.all([
      getContacts(), getReports(), getDepartmentDescriptions(),
    ]);
    contacts.value = data || [];
    reports.value = reportsData || [];
    descriptions.value = descData || {};
  } catch (error) {
    console.error('Failed to load data', error);
    contacts.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  loading.value = true;
  const result = await authenticateUser(loginUsername.value, loginPassword.value);
  loading.value = false;
  if (result.success && result.user) {
    if (result.user.username.toLowerCase() === 'admin') {
      alert('O usuário "admin" tem permissão apenas para acessar o site principal (leitura). Use seu usuário pessoal para gerenciar.');
      return;
    }
    currentUser.value = result.user;
    await loadContacts();
    if (result.user.role === 'admin') {
      await loadUsers();
      await loadStats();
    }
  } else {
    alert(result.error || 'Credenciais incorretas!');
  }
}

async function handleAdd(e) {
  e.preventDefault();
  if (!name.value || !phone.value || !department.value) {
    alert('Preencha os campos obrigatórios (Nome, Número, Setor)!');
    return;
  }

  loading.value = true;
  const result = await addContact(name.value, phone.value, department.value, ip.value, newCity.value, phoneModel.value);
  if (result.success) {
    name.value = '';
    phone.value = '';
    department.value = '';
    ip.value = '';
    phoneModel.value = '';
    await loadContacts();
  } else {
    alert(`Erro ao adicionar contato: ${result.error || 'Erro desconhecido. Verifique as configurações de proxy ou permissões.'}`);
    console.error(result.error);
  }
  loading.value = false;
}

async function handleUpdateRow(id, newName, newPhone, newDepartment, newIp, updatedCity, updatedPhoneModel, done) {
  const result = await updateContact(id, newName, newPhone, newDepartment, newIp, updatedCity, updatedPhoneModel);
  if (result.success) {
    await loadContacts();
  } else {
    alert('Erro ao atualizar: ' + result.error);
  }
  done?.();
}

async function handleToggleVisibility(id, hidden, done) {
  loading.value = true;
  const result = await toggleContactVisibility(id, hidden);
  if (result.success) {
    await loadContacts();
  } else {
    alert('Erro: ' + result.error);
  }
  loading.value = false;
  done?.();
}

async function handleDeleteRow(id) {
  if (!confirm('Excluir este contato?')) return;
  loading.value = true;
  await deleteContact(id);
  await loadContacts();
  loading.value = false;
}

async function handleMoveRow(id, direction) {
  loading.value = true;
  const result = await reorderContact(id, direction);
  if (result.success) {
    await loadContacts();
  } else {
    alert('Erro ao reordenar: ' + result.error);
  }
  loading.value = false;
}

async function handleDeleteReportRow(id) {
  if (confirm('Marcar este relato como resolvido/excluído?')) {
    const result = await deleteReport(id);
    if (result.success) {
      await loadContacts();
    } else {
      alert('Erro ao excluir relato: ' + result.error);
    }
  }
}

async function handleRenameDepartment(oldDepartment) {
  const newDepartment = prompt(`Renomear o setor "${oldDepartment}" para:`, oldDepartment);
  if (newDepartment && newDepartment.trim() !== '' && newDepartment !== oldDepartment) {
    loading.value = true;
    const result = await renameDepartment(oldDepartment, newDepartment.trim());
    if (result.success) {
      await loadContacts();
    } else {
      alert('Erro ao renomear setor: ' + result.error);
    }
    loading.value = false;
  }
}

const groupedContacts = computed(() => {
  const groups = {};
  const filtered = contacts.value.filter(c => {
    const cCity = c.city || 'sao_gabriel';
    if (adminCity.value === 'all') return cCity === 'all';
    return cCity === adminCity.value || cCity === 'all';
  });

  filtered.forEach((c) => {
    if (!groups[c.department]) {
      groups[c.department] = [];
    }
    groups[c.department].push(c);
  });
  return groups;
});

async function handleCreateUser(e) {
  e.preventDefault();
  if (!newUsername.value || !newUserPassword.value) {
    alert('Preencha os campos!');
    return;
  }
  loading.value = true;
  const result = await createUser(newUsername.value, newUserPassword.value, newUserRole.value);
  loading.value = false;
  if (result.success) {
    alert('Usuário criado!');
    newUsername.value = '';
    newUserPassword.value = '';
    newUserRole.value = 'readonly';
    await loadUsers();
  } else {
    alert('Erro: ' + result.error);
  }
}

async function handleChangeRole(u, newRole) {
  if (confirm(`Mudar nível de acesso de ${u.username} para ${newRole === 'admin' ? 'Administrador' : 'Leitura'}?`)) {
    loading.value = true;
    const res = await editUser(u.id, u.username, undefined, newRole);
    loading.value = false;
    if (res.success) {
      await loadUsers();
      if (u.username === currentUser.value.username && newRole === 'readonly') {
        window.location.reload();
      }
    } else {
      alert('Erro: ' + res.error);
    }
  } else {
    // revert select back by reloading users list
    await loadUsers();
  }
}

async function handleChangePassword(u) {
  const newPass = prompt(`Nova senha para ${u.username} (deixe em branco para não alterar):`);
  if (newPass !== null) {
    loading.value = true;
    const res = await editUser(u.id, u.username, newPass || undefined, undefined);
    loading.value = false;
    if (res.success) alert('Senha atualizada!');
    else alert('Erro: ' + res.error);
  }
}

async function handleDeleteUser(u) {
  if (confirm(`Excluir usuário ${u.username}?`)) {
    loading.value = true;
    const res = await removeUser(u.id);
    loading.value = false;
    if (res.success) await loadUsers();
    else alert('Erro: ' + res.error);
  }
}

async function handleSaveDescription(dept, newDesc, done) {
  loading.value = true;
  const result = await updateDepartmentDescription(dept, newDesc);
  if (result.success) {
    await loadContacts();
  } else {
    alert('Erro: ' + (result.error || 'Falha ao salvar'));
  }
  loading.value = false;
  done?.();
}
</script>

<template>
  <main :class="styles.container">
    <template v-if="!currentUser">
      <div :class="[styles.loginBox, 'glass']">
        <div style="display: flex; justify-content: center; margin-bottom: 1.5rem">
          <GlareCard :style="{ width: '220px', height: '120px' }">
            <img src="/novo-logo.jpg" alt="Admin Logo" width="220" height="120" style="object-fit: contain; filter: drop-shadow(0 0 10px rgba(255,255,255,0.2))" />
          </GlareCard>
        </div>
        <h1 :class="styles.title">Admin - Contatos</h1>
        <p :class="styles.subtitle">Digite seu usuário e senha para acessar</p>
        <form @submit="handleLogin" :class="styles.form">
          <input type="text" placeholder="Usuário" v-model="loginUsername" :class="styles.input" required />
          <input type="password" placeholder="Senha" v-model="loginPassword" :class="styles.input" required />
          <button type="submit" :class="styles.btnPrimary" :disabled="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </template>

    <template v-else>
      <datalist id="departments-list">
        <option v-for="dep in Object.keys(groupedContacts)" :key="dep" :value="dep" />
      </datalist>

      <header :class="styles.header">
        <h1 :class="styles.title">Admin Panel</h1>
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap">
          <button :class="activeTab === 'ramais' ? styles.btnPrimary : styles.btnSecondary" @click="activeTab = 'ramais'">
            Contatos
          </button>
          <button :class="activeTab === 'reports' ? styles.btnPrimary : styles.btnSecondary" @click="activeTab = 'reports'">
            Relatórios de Erro {{ reports.length > 0 ? `(${reports.length})` : '' }}
          </button>
          <button v-if="canEdit" :class="activeTab === 'descriptions' ? styles.btnPrimary : styles.btnSecondary" @click="activeTab = 'descriptions'">
            Balões de Informação
          </button>
          <template v-if="canEdit">
            <button :class="activeTab === 'users' ? styles.btnPrimary : styles.btnSecondary" @click="activeTab = 'users'">
              Usuários
            </button>
            <button :class="activeTab === 'stats' ? styles.btnPrimary : styles.btnSecondary" @click="activeTab = 'stats'">
              Acessos
            </button>
          </template>
          <a href="/" :class="styles.link" style="margin-left: 1rem">Voltar ao Site</a>
          <button @click="currentUser = null" :class="styles.btnDanger" style="margin-left: auto">
            Sair ({{ currentUser.username }})
          </button>
        </div>
      </header>

      <template v-if="activeTab === 'ramais'">
        <section v-if="canEdit" :class="[styles.addSection, 'glass']">
          <h2>Adicionar Novo Contato</h2>
          <form @submit="handleAdd" :class="styles.formRow">
            <input type="text" placeholder="Nome (ex: João Silva)" v-model="name" :class="styles.input" />
            <input type="text" placeholder="Número (ex: 4050)" v-model="phone" :class="styles.input" />
            <input type="text" list="departments-list" placeholder="Setor (ex: Suporte Técnico)" v-model="department" :class="styles.input" />
            <input type="text" placeholder="IP (Opcional)" v-model="ip" :class="styles.input" />
            <select v-model="newCity" :class="styles.input">
              <option value="sao_gabriel">São Gabriel</option>
              <option value="bage">Bagé</option>
              <option value="passo_fundo">Passo Fundo</option>
              <option value="all">Global (Todas as Unidades)</option>
            </select>
            <select v-model="phoneModel" :class="styles.input">
              <option value="">Selecione o Modelo</option>
              <option value="Intelbras ATA 200">Intelbras ATA 200</option>
              <option value="Telefone IP Intelbras TIP 125i">Telefone IP Intelbras TIP 125i</option>
              <option value="Telefone IP Intelbras TIP 200">Telefone IP Intelbras TIP 200</option>
              <option value="Telefone Sem Fio TS 2510">Telefone Sem Fio TS 2510</option>
              <option value="MicroSIP">MicroSIP</option>
            </select>
            <div :class="styles.actionButtons">
              <button type="submit" :class="styles.btnPrimary" :disabled="loading">
                {{ loading ? 'Adicionando...' : 'Adicionar' }}
              </button>
            </div>
          </form>
        </section>

        <section :class="styles.listSection">
          <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; justify-content: center">
            <button :class="adminCity === 'sao_gabriel' ? styles.btnPrimary : styles.btnSecondary" @click="adminCity = 'sao_gabriel'">São Gabriel</button>
            <button :class="adminCity === 'bage' ? styles.btnPrimary : styles.btnSecondary" @click="adminCity = 'bage'">Bagé</button>
            <button :class="adminCity === 'passo_fundo' ? styles.btnPrimary : styles.btnSecondary" @click="adminCity = 'passo_fundo'">Passo Fundo</button>
            <button :class="adminCity === 'all' ? styles.btnPrimary : styles.btnSecondary" @click="adminCity = 'all'">Global</button>
          </div>
          <h2>Contatos Cadastrados</h2>
          <p v-if="Object.keys(groupedContacts).length === 0">Nenhum contato cadastrado.</p>
          <div v-for="(deptContacts, dept) in groupedContacts" :key="dept" :class="styles.departmentGroup">
            <h3 :class="styles.departmentTitle" style="cursor: pointer; display: flex; align-items: center" @click="toggleCollapse(dept)">
              <span :style="{ marginRight: '8px', fontSize: '0.8em', transition: 'transform 0.2s', transform: expandedDeps[dept] ? 'rotate(0)' : 'rotate(-90deg)' }">▼</span>
              {{ getEmoji(dept) }} {{ dept }}
              <button
                v-if="canEdit"
                @click.stop="handleRenameDepartment(dept)"
                :class="styles.btnSecondary"
                style="margin-left: 1rem; padding: 0.2rem 0.5rem; font-size: 0.8rem"
                :disabled="loading"
              >
                ✎ Editar Nome
              </button>
            </h3>
            <div v-if="expandedDeps[dept]" :class="styles.tableContainer">
              <table :class="styles.table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Número</th>
                    <th>IP</th>
                    <th>Modelo</th>
                    <th v-if="canEdit">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <EditableRow
                    v-for="contact in deptContacts"
                    :key="contact.id"
                    :contact="contact"
                    :can-edit="canEdit"
                    @save="handleUpdateRow"
                    @delete="handleDeleteRow"
                    @move="handleMoveRow"
                    @toggle-visibility="handleToggleVisibility"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </template>

      <section v-else-if="activeTab === 'reports'" :class="styles.listSection">
        <h2>Relatórios de Contatos com Problema</h2>
        <p v-if="reports.length === 0">Nenhum relato encontrado. Tudo certo por aqui!</p>
        <div v-else :class="styles.tableContainer">
          <table :class="styles.table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Reportado por</th>
                <th>Ramal</th>
                <th>Problema</th>
                <th v-if="canEdit">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in reports" :key="r.id">
                <td>{{ new Date(r.date).toLocaleString('pt-BR') }}</td>
                <td>{{ r.name || 'Anônimo' }}</td>
                <td>{{ r.ramal }}</td>
                <td>{{ r.message }}</td>
                <td v-if="canEdit">
                  <button @click="handleDeleteReportRow(r.id)" :class="styles.btnDanger">
                    Resolver / Excluir
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="activeTab === 'descriptions' && canEdit" :class="styles.listSection">
        <h2>Balões de Informação</h2>
        <p style="margin-bottom: 1rem; color: #ccc">Edite os textos exibidos nos balões de informação de cada setor. Deixe em branco para ocultar o balão.</p>
        <div :class="styles.tableResponsive">
          <table :class="styles.table">
            <thead>
              <tr>
                <th>Setor</th>
                <th style="width: 60%">Texto do Balão</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <DescriptionRow
                v-for="dep in [...new Set(contacts.map(c => c.department))]"
                :key="dep"
                :department="dep"
                :initial-description="descriptions[dep.toLowerCase().replace(/–/g, '-').trim()] || ''"
                @save="handleSaveDescription"
              />
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="activeTab === 'users' && canEdit" :class="styles.listSection">
        <h2>Gerenciar Usuários</h2>
        <div :class="[styles.addSection, 'glass']" style="margin-bottom: 2rem">
          <h3>Adicionar Usuário</h3>
          <form @submit="handleCreateUser" :class="styles.formRow">
            <input type="text" v-model="newUsername" placeholder="Nome de Usuário" :class="styles.input" required />
            <input type="password" v-model="newUserPassword" placeholder="Senha" :class="styles.input" required />
            <select v-model="newUserRole" :class="styles.input" required>
              <option value="readonly">Somente Leitura</option>
              <option value="admin">Administrador</option>
            </select>
            <button type="submit" :class="styles.btnPrimary" :disabled="loading">Criar</button>
          </form>
        </div>

        <div :class="styles.tableContainer">
          <table :class="styles.table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Nível de Acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in systemUsers" :key="u.id">
                <td>{{ u.username }}</td>
                <td>
                  <select
                    :value="u.role"
                    @change="(e) => handleChangeRole(u, e.target.value)"
                    :class="styles.inputInline"
                    :disabled="loading || u.username === currentUser.username"
                    style="padding: 0.3rem; margin: 0; width: 100%; font-size: 0.9rem"
                  >
                    <option value="admin">Administrador</option>
                    <option value="readonly">Leitura</option>
                  </select>
                </td>
                <td>
                  <div :class="styles.tableActions">
                    <button @click="handleChangePassword(u)" :class="styles.btnSecondary" :disabled="loading">
                      Trocar Senha
                    </button>
                    <button @click="handleDeleteUser(u)" :class="styles.btnDanger" :disabled="loading || u.username === currentUser.username">
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="activeTab === 'stats' && canEdit" :class="styles.listSection">
        <div :class="styles.tableHeader">
          <h2>Estatísticas de Acesso (Últimos 30 dias)</h2>
          <button @click="loadStats" :class="styles.btnSecondary" :disabled="loading">
            Atualizar
          </button>
        </div>
        <div :class="styles.tableContainer" style="padding: 2rem">
          <p v-if="stats.length === 0" style="text-align: center; color: var(--text-muted)">Nenhum dado de acesso registrado ainda.</p>
          <div v-else style="height: 350px; width: 100%; margin-top: 20px">
            <StatsChart :stats="stats" />
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
