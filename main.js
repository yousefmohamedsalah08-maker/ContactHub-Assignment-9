const STORAGE_KEY = 'contactHubContacts';

const dom = {
  modal: document.getElementById('contactModal'),
  modalTitle: document.getElementById('modalTitle'),
  form: document.getElementById('contactForm'),
  grid: document.getElementById('contactsGrid'),
  search: document.getElementById('searchInput'),
  favoritesList: document.getElementById('favoritesList'),
  emergencyList: document.getElementById('emergencyList'),
  totalCount: document.getElementById('totalCount'),
  favoriteCount: document.getElementById('favoriteCount'),
  emergencyCount: document.getElementById('emergencyCount'),
  subtitle: document.getElementById('contactsSubtitle'),
  name: document.getElementById('contactName'),
  phone: document.getElementById('contactPhone'),
  email: document.getElementById('contactEmail'),
  address: document.getElementById('contactAddress'),
  group: document.getElementById('contactGroup'),
  notes: document.getElementById('contactNotes'),
  favorite: document.getElementById('contactFavorite'),
  emergency: document.getElementById('contactEmergency'),
  photo: document.getElementById('contactPhoto'),
  photoPreview: document.getElementById('photoPreview')
};

let contacts = readContacts();
let editingId = null;
let photoData = '';

function readContacts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function avatarMarkup(contact, small = false) {
  const className = small ? 'mini-avatar' : 'avatar';
  return `<span class="${className}">${contact.photo ? `<img src="${contact.photo}" alt="${escapeHTML(contact.name)}">` : escapeHTML(initials(contact.name))}</span>`;
}

function render() {
  const term = dom.search.value.trim().toLowerCase();
  const visible = contacts.filter(contact => [contact.name, contact.phone, contact.email].some(value => (value || '').toLowerCase().includes(term)));

  dom.totalCount.textContent = contacts.length;
  dom.favoriteCount.textContent = contacts.filter(contact => contact.favorite).length;
  dom.emergencyCount.textContent = contacts.filter(contact => contact.emergency).length;
  dom.subtitle.textContent = `Manage and organize your ${contacts.length} contact${contacts.length === 1 ? '' : 's'}`;

  if (!visible.length) {
    const searching = Boolean(term);
    dom.grid.innerHTML = `<div class="empty-state"><span class="empty-icon"><i class="fa-solid ${searching ? 'fa-magnifying-glass' : 'fa-address-book'}"></i></span><strong>${searching ? 'No matching contacts' : 'No contacts found'}</strong><p>${searching ? 'Try a different name, phone, or email' : 'Click "Add Contact" to get started'}</p></div>`;
  } else {
    dom.grid.innerHTML = visible.map(contactCard).join('');
  }

  renderSideList(dom.favoritesList, contacts.filter(contact => contact.favorite), 'No favorites yet');
  renderSideList(dom.emergencyList, contacts.filter(contact => contact.emergency), 'No emergency contacts');
}

function contactCard(contact) {
  return `<article class="contact-card">
    <div class="contact-main">
      ${avatarMarkup(contact)}
      <div class="contact-info">
        <div class="name-row"><h3 title="${escapeHTML(contact.name)}">${escapeHTML(contact.name)}</h3>${contact.group ? `<span class="group-badge">${escapeHTML(contact.group)}</span>` : ''}</div>
        <div class="contact-detail"><i class="fa-solid fa-phone phone-icon"></i><span>${escapeHTML(contact.phone)}</span></div>
        ${contact.email ? `<div class="contact-detail"><i class="fa-solid fa-envelope mail-icon"></i><span>${escapeHTML(contact.email)}</span></div>` : ''}
        ${contact.address ? `<div class="contact-detail"><i class="fa-solid fa-location-dot location-icon"></i><span>${escapeHTML(contact.address)}</span></div>` : ''}
      </div>
    </div>
    <div class="contact-actions">
      <a class="call" href="tel:${encodeURIComponent(contact.phone)}" aria-label="Call ${escapeHTML(contact.name)}"><i class="fa-solid fa-phone"></i></a>
      ${contact.email ? `<a class="email" href="mailto:${encodeURIComponent(contact.email)}" aria-label="Email ${escapeHTML(contact.name)}"><i class="fa-solid fa-envelope"></i></a>` : '<span class="email"></span>'}
      <button class="favorite ${contact.favorite ? 'is-active' : ''}" data-action="favorite" data-id="${contact.id}" aria-label="Toggle favorite"><i class="${contact.favorite ? 'fa-solid' : 'fa-regular'} fa-star"></i></button>
      <button class="emergency ${contact.emergency ? 'is-active' : ''}" data-action="emergency" data-id="${contact.id}" aria-label="Toggle emergency"><i class="${contact.emergency ? 'fa-solid' : 'fa-regular'} fa-heart"></i></button>
      <button class="edit" data-action="edit" data-id="${contact.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
      <button class="delete" data-action="delete" data-id="${contact.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
    </div>
  </article>`;
}

function renderSideList(target, list, emptyText) {
  target.innerHTML = list.length ? list.map(contact => `<div class="side-person">${avatarMarkup(contact, true)}<div><strong>${escapeHTML(contact.name)}</strong><small>${escapeHTML(contact.phone)}</small></div><a class="side-call" href="tel:${encodeURIComponent(contact.phone)}" aria-label="Call ${escapeHTML(contact.name)}"><i class="fa-solid fa-phone"></i></a></div>`).join('') : `<div class="side-empty">${emptyText}</div>`;
}

function openModal(contact = null) {
  clearErrors();
  dom.form.reset();
  editingId = contact?.id || null;
  photoData = contact?.photo || '';
  dom.modalTitle.textContent = contact ? 'Update Contact' : 'Add New Contact';

  if (contact) {
    dom.name.value = contact.name;
    dom.phone.value = contact.phone;
    dom.email.value = contact.email || '';
    dom.address.value = contact.address || '';
    dom.group.value = contact.group || '';
    dom.notes.value = contact.notes || '';
    dom.favorite.checked = contact.favorite;
    dom.emergency.checked = contact.emergency;
  }

  updatePhotoPreview();
  dom.modal.classList.add('is-open');
  dom.modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setTimeout(() => dom.name.focus(), 50);
}

function closeModal() {
  dom.modal.classList.remove('is-open');
  dom.modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function updatePhotoPreview() {
  dom.photoPreview.innerHTML = photoData ? `<img src="${photoData}" alt="Contact preview">` : '<i class="fa-solid fa-user"></i>';
}

function setError(input, message) {
  const group = input.closest('.form-group');
  group.classList.add('is-invalid');
  group.querySelector('.error-message').textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.form-group.is-invalid').forEach(group => group.classList.remove('is-invalid'));
}

function validate() {
  clearErrors();
  const name = dom.name.value.trim();
  const phone = dom.phone.value.trim().replace(/\s+/g, '');
  const email = dom.email.value.trim();
  let valid = true;

  if (name.length < 3 || !/^[\p{L}][\p{L}\s.'-]{1,48}[\p{L}.]$/u.test(name)) {
    setError(dom.name, 'Enter a valid name (at least 3 letters).'); valid = false;
  }
  if (!/^(?:\+?20)?01[0125]\d{8}$/.test(phone)) {
    setError(dom.phone, 'Enter a valid Egyptian mobile number.'); valid = false;
  } else if (contacts.some(contact => contact.phone === phone && contact.id !== editingId)) {
    setError(dom.phone, 'This phone number already exists.'); valid = false;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    setError(dom.email, 'Enter a valid email address.'); valid = false;
  }
  return valid;
}

async function submitContact(event) {
  event.preventDefault();
  if (!validate()) return;

  const contact = {
    id: editingId || crypto.randomUUID(),
    name: dom.name.value.trim(),
    phone: dom.phone.value.trim().replace(/\s+/g, ''),
    email: dom.email.value.trim(),
    address: dom.address.value.trim(),
    group: dom.group.value,
    notes: dom.notes.value.trim(),
    favorite: dom.favorite.checked,
    emergency: dom.emergency.checked,
    photo: photoData
  };

  const updating = Boolean(editingId);
  contacts = updating ? contacts.map(item => item.id === editingId ? contact : item) : [contact, ...contacts];
  saveContacts(); render(); closeModal();
  await Swal.fire({ icon: 'success', title: updating ? 'Updated!' : 'Added!', text: `Contact has been ${updating ? 'updated' : 'added'} successfully.`, timer: 1500, showConfirmButton: false });
}

async function handleCardAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const contact = contacts.find(item => item.id === button.dataset.id);
  if (!contact) return;

  if (button.dataset.action === 'edit') return openModal(contact);

  if (button.dataset.action === 'delete') {
    const result = await Swal.fire({ title: 'Delete contact?', text: `Are you sure you want to delete ${contact.name}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e80746', cancelButtonColor: '#697080', confirmButtonText: 'Yes, delete it' });
    if (!result.isConfirmed) return;
    contacts = contacts.filter(item => item.id !== contact.id);
    saveContacts(); render();
    await Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Contact has been deleted.', timer: 1300, showConfirmButton: false });
    return;
  }

  const key = button.dataset.action;
  contact[key] = !contact[key];
  saveContacts(); render();
}

document.getElementById('addContactBtn').addEventListener('click', () => openModal());
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
dom.modal.addEventListener('click', event => { if (event.target === dom.modal) closeModal(); });
dom.form.addEventListener('submit', submitContact);
dom.search.addEventListener('input', render);
dom.grid.addEventListener('click', handleCardAction);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && dom.modal.classList.contains('is-open')) closeModal(); });

dom.photo.addEventListener('change', () => {
  const file = dom.photo.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 1_500_000) {
    Swal.fire({ icon: 'error', title: 'Invalid image', text: 'Choose an image smaller than 1.5 MB.' });
    dom.photo.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => { photoData = reader.result; updatePhotoPreview(); };
  reader.readAsDataURL(file);
});

render();
