const BASE = '/api';

async function request(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
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
