const BASE = '/api';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !url.startsWith(`${BASE}/auth/`)) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new ApiError(data.error || 'Falha na comunicação com o servidor.', res.status, data);
  }
  return data;
}

// Contacts
export const getContacts = (query) =>
  request(`${BASE}/contacts${query ? `?q=${encodeURIComponent(query)}` : ''}`);

export const getLastUpdated = () =>
  request(`${BASE}/contacts/last-updated`).then((r) => r.lastUpdated);

export const addContact = (name, phone, department, ip = '', city = 'sao_gabriel', phoneModel = '') =>
  request(`${BASE}/contacts`, {
    method: 'POST',
    body: JSON.stringify({ name, phone, department, ip, city, phoneModel }),
  });

export const updateContact = (id, name, phone, department, ip = '', city = 'sao_gabriel', phoneModel = '') =>
  request(`${BASE}/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, phone, department, ip, city, phoneModel }),
  });

export const deleteContact = (id) =>
  request(`${BASE}/contacts/${id}`, { method: 'DELETE' });

export const toggleContactVisibility = (id, hidden) =>
  request(`${BASE}/contacts/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ hidden }),
  });

export const reorderContact = (id, direction) =>
  request(`${BASE}/contacts/${id}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ direction }),
  });

export const renameDepartment = (oldDepartment, newDepartment) =>
  request(`${BASE}/contacts/department/rename`, {
    method: 'PATCH',
    body: JSON.stringify({ oldDepartment, newDepartment }),
  });

// Reports
export const getReports = () => request(`${BASE}/reports`);

export const submitReport = (name, ramal, message) =>
  request(`${BASE}/reports`, {
    method: 'POST',
    body: JSON.stringify({ name, ramal, message }),
  });

export const deleteReport = (id) =>
  request(`${BASE}/reports/${id}`, { method: 'DELETE' });

// Auth / Users
export const authenticateUser = (username, password) =>
  request(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const getCurrentUser = () => request(`${BASE}/auth/me`);

export const endSession = () =>
  request(`${BASE}/auth/logout`, { method: 'POST' });

export const getUsers = () => request(`${BASE}/users`);

export const addUser = (username, password, role) =>
  request(`${BASE}/users`, {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  });

export const updateUser = (id, username, password, role) =>
  request(`${BASE}/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ username, password, role }),
  });

export const deleteUser = (id) =>
  request(`${BASE}/users/${id}`, { method: 'DELETE' });

// Analytics
export const registerVisit = () =>
  request(`${BASE}/analytics/visit`, { method: 'POST' });

export const getAnalytics = () => request(`${BASE}/analytics`);

// Descriptions
export const getDepartmentDescriptions = () => request(`${BASE}/descriptions`);

export const updateDepartmentDescription = (department, description) =>
  request(`${BASE}/descriptions`, {
    method: 'PUT',
    body: JSON.stringify({ department, description }),
  });

// Teams Contacts
export const getTeamsContacts = () => request(`${BASE}/teams`);

export const getTeamsContactsByDepartment = (department) =>
  request(`${BASE}/teams/${encodeURIComponent(department)}`);

export const addTeamsContact = (department, name, email) =>
  request(`${BASE}/teams`, {
    method: 'POST',
    body: JSON.stringify({ department, name, email }),
  });

export const updateTeamsContact = (id, department, name, email) =>
  request(`${BASE}/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ department, name, email }),
  });

export const deleteTeamsContact = (id) =>
  request(`${BASE}/teams/${id}`, { method: 'DELETE' });

// Sectors available to the authenticated user
export const getSectors = () => request(`${BASE}/sectors`).then((result) => result.sectors);

export const getSector = (id) =>
  request(`${BASE}/sectors/${id}`).then((result) => result.sector);

export const getPersonalFavorites = () => request(`${BASE}/favorites`).then((result) => result.favorites);
export const createPersonalFavorite = (data) => request(`${BASE}/favorites`, { method: 'POST', body: JSON.stringify(data) });
export const updatePersonalFavorite = (id, data) => request(`${BASE}/favorites/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePersonalFavorite = (id) => request(`${BASE}/favorites/${id}`, { method: 'DELETE' });
export const reorderPersonalFavorites = (ids) => request(`${BASE}/favorites/order/all`, { method: 'PUT', body: JSON.stringify({ ids }) });
export const getSectorShortcuts = (sectorId) => request(`${BASE}/sectors/${sectorId}/shortcuts`).then((result) => result.shortcuts);
export const createSectorShortcut = (sectorId, data) => request(`${BASE}/sectors/${sectorId}/shortcuts`, { method: 'POST', body: JSON.stringify(data) });
export const updateSectorShortcut = (sectorId, id, data) => request(`${BASE}/sectors/${sectorId}/shortcuts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSectorShortcut = (sectorId, id) => request(`${BASE}/sectors/${sectorId}/shortcuts/${id}`, { method: 'DELETE' });
export const getPersonalNotes = () => request(`${BASE}/notes`).then((result) => result.notes);
export const createPersonalNote = (data) => request(`${BASE}/notes`, { method: 'POST', body: JSON.stringify(data) });
export const updatePersonalNote = (id, data) => request(`${BASE}/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePersonalNote = (id) => request(`${BASE}/notes/${id}`, { method: 'DELETE' });
export const getSectorNotes = (sectorId) => request(`${BASE}/sectors/${sectorId}/notes`).then((result) => result.notes);
export const createSectorNote = (sectorId, data) => request(`${BASE}/sectors/${sectorId}/notes`, { method: 'POST', body: JSON.stringify(data) });
export const updateSectorNote = (sectorId, id, data) => request(`${BASE}/sectors/${sectorId}/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSectorNote = (sectorId, id) => request(`${BASE}/sectors/${sectorId}/notes/${id}`, { method: 'DELETE' });
export const getSchedule = (sectorId, from, to) => request(`${BASE}/sectors/${sectorId}/schedule?from=${from}&to=${to}`);
export const createScheduleMember = (sectorId, data) => request(`${BASE}/sectors/${sectorId}/schedule/members`, { method: 'POST', body: JSON.stringify(data) });
export const updateScheduleMember = (sectorId, memberId, data) => request(`${BASE}/sectors/${sectorId}/schedule/members/${memberId}`, { method: 'PATCH', body: JSON.stringify(data) });
export const saveScheduleEntries = (sectorId, entries) => request(`${BASE}/sectors/${sectorId}/schedule/entries`, { method: 'PUT', body: JSON.stringify({ entries }) });
