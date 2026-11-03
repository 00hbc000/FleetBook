// Interface sans framework ; les appels API restent relatifs (même origine).
const $ = selector => document.querySelector(selector);
let token = sessionStorage.getItem('token');
let currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');
let vehicles = [];

function notify(message) { $('#message').textContent = message; }
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Erreur de requête');
  return data;
}
function run(fn) { Promise.resolve().then(fn).catch(error => notify(error.message)); }
function element(tag, text, parent) {
  const node = document.createElement(tag);
  node.textContent = String(text);
  parent.append(node);
  return node;
}
function button(label, parent, action) {
  const node = element('button', label, parent);
  node.type = 'button';
  node.addEventListener('click', () => run(action));
}
function sessionView() {
  $('#auth').hidden = !!currentUser;
  $('#session').hidden = !currentUser;
  $('#user-area').hidden = !currentUser;
  $('#admin-area').hidden = currentUser?.role !== 'admin';
  $('#welcome').textContent = currentUser ? `${currentUser.name} (${currentUser.role})` : '';
}
async function loadVehicles(search = '') {
  vehicles = await api('/api/vehicles' + (search ? `?search=${encodeURIComponent(search)}` : ''));
  const list = $('#vehicles'); list.replaceChildren();
  for (const v of vehicles) {
    const card = document.createElement('article'); list.append(card);
    element('strong', `${v.name} — ${v.plate}`, card);
    element('p', `${v.seats} places · ${v.daily_price} / jour`, card);
    if (currentUser?.role === 'admin') {
      button('Modifier', card, () => {
        const form = $('#vehicle-form');
        for (const [key, value] of Object.entries({ id: v.id, name: v.name, plate: v.plate, seats: v.seats, dailyPrice: v.daily_price })) form.elements[key].value = value;
        form.scrollIntoView();
      });
      button('Supprimer', card, async () => {
        if (!confirm(`Supprimer ${v.name} ?`)) return;
        await api(`/api/vehicles/${v.id}`, { method: 'DELETE' });
        await refresh();
      });
    }
  }
  const select = $('#vehicle-select'); select.replaceChildren();
  for (const v of vehicles) { const option = new Option(`${v.name} (${v.plate})`, v.id); select.add(option); }
}
function renderBookings(bookings, container, editable) {
  const list = $(container); list.replaceChildren();
  for (const booking of bookings) {
    const card = document.createElement('article'); list.append(card);
    element('strong', `#${booking.id} · ${booking.vehicle_name} · ${booking.user_name}`, card);
    element('p', `${booking.start_date.slice(0, 10)} → ${booking.end_date.slice(0, 10)}`, card);
    const note = document.createElement('div'); card.append(note);
    // VULN-04 : la note enregistrée est injectée dans le DOM sans échappement (XSS stockée).
    note.innerHTML = booking.note || '';
    if (editable) {
      const input = document.createElement('input'); input.placeholder = 'Note pour cette réservation'; card.append(input);
      button('Enregistrer la note', card, async () => {
        await api(`/api/bookings/${booking.id}/note`, { method: 'POST', body: JSON.stringify({ note: input.value }) });
        await refresh();
      });
    }
  }
}
async function refresh() {
  sessionView();
  await loadVehicles();
  if (currentUser) renderBookings(await api('/api/bookings/my'), '#my-bookings', true);
  if (currentUser?.role === 'admin') {
    renderBookings(await api('/api/bookings'), '#all-bookings', false);
    const list = $('#users'); list.replaceChildren();
    for (const user of await api('/api/users')) {
      const card = document.createElement('article'); list.append(card);
      element('p', `${user.name} — ${user.email} (${user.role})`, card);
      element('p', `Tél. ${user.phone} · Permis ${user.license_number}`, card);
    }
  }
}
$('#login').addEventListener('submit', event => {
  event.preventDefault(); run(async () => {
    const { email, password } = Object.fromEntries(new FormData(event.target));
    const result = await api('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    token = result.token; currentUser = result.user;
    sessionStorage.setItem('token', token); sessionStorage.setItem('user', JSON.stringify(currentUser));
    notify('Connexion réussie'); await refresh();
  });
});
$('#register').addEventListener('submit', event => {
  event.preventDefault(); run(async () => {
    await api('/api/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
    event.target.reset(); notify('Compte créé. Connectez-vous.');
  });
});
$('#logout').addEventListener('click', () => {
  sessionStorage.clear(); token = null; currentUser = null;
  $('#my-bookings').replaceChildren(); $('#all-bookings').replaceChildren(); $('#users').replaceChildren();
  notify('Déconnecté'); run(refresh);
});
$('#search').addEventListener('submit', event => {
  event.preventDefault(); run(() => loadVehicles(new FormData(event.target).get('search')));
});
$('#booking').addEventListener('submit', event => {
  event.preventDefault(); run(async () => {
    const values = Object.fromEntries(new FormData(event.target));
    await api('/api/bookings', { method: 'POST', body: JSON.stringify(values) });
    notify('Réservation créée'); await refresh();
  });
});
$('#vehicle-form').addEventListener('submit', event => {
  event.preventDefault(); run(async () => {
    const values = Object.fromEntries(new FormData(event.target));
    const { id, ...vehicle } = values;
    vehicle.seats = Number(vehicle.seats); vehicle.dailyPrice = Number(vehicle.dailyPrice);
    await api(id ? `/api/vehicles/${id}` : '/api/vehicles', { method: id ? 'PUT' : 'POST', body: JSON.stringify(vehicle) });
    event.target.reset(); notify('Véhicule enregistré'); await refresh();
  });
});
$('#cancel-edit').addEventListener('click', () => $('#vehicle-form').reset());
run(refresh);
