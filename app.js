// js/app.js

// --- Модель данных ---
class Appointment {
    constructor(id, name, phone, doctor, date, time) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.doctor = doctor;
        this.date = date;
        this.time = time;
    }
}

// --- Работа с localStorage ---
const STORAGE_KEY = 'hospital_appointments';

function getAppointments() {
    const appointmentsJSON = localStorage.getItem(STORAGE_KEY);
    return appointmentsJSON ? JSON.parse(appointmentsJSON) : [];
}

function saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    buildIndexes(appointments); // Обновляем индексы при сохранении
}

// --- Вспомогательные функции ---
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

// --- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ---
// Индексы для быстрого поиска и фильтрации
let nameIndex = new Map();  // ключ: ФИО (в нижнем регистре), значение: id записи
let doctorIndex = new Map(); // ключ: врач, значение: массив id записей

// Функция для построения индексов
function buildIndexes(appointments) {
    nameIndex.clear();
    doctorIndex.clear();

    appointments.forEach(app => {
        // Индекс по ФИО
        nameIndex.set(app.name.toLowerCase(), app.id);

        // Индекс по врачу
        if (!doctorIndex.has(app.doctor)) {
            doctorIndex.set(app.doctor, []);
        }
        doctorIndex.get(app.doctor).push(app.id);
    });

    console.log('Индексы обновлены:', {
        nameIndexSize: nameIndex.size,
        doctorIndexSize: doctorIndex.size
    });
}

// Функция для быстрого поиска по ФИО (оптимизированная версия)
function searchByNameOptimized(searchTerm) {
    if (!searchTerm) return getAppointments();

    const searchLower = searchTerm.toLowerCase();
    const appointments = getAppointments();

    // Используем индекс для быстрого поиска
    // В данном случае фильтруем по индексу
    const matchingIds = [];
    for (let [name, id] of nameIndex.entries()) {
        if (name.includes(searchLower)) {
            matchingIds.push(id);
        }
    }

    return appointments.filter(app => matchingIds.includes(app.id));
}

// --- Основные функции CRUD ---
function addAppointment(appointmentData) {
    const appointments = getAppointments();
    const newAppointment = new Appointment(
        generateId(),
        appointmentData.name,
        appointmentData.phone,
        appointmentData.doctor,
        appointmentData.date,
        appointmentData.time
    );
    appointments.push(newAppointment);
    saveAppointments(appointments);
    renderAppointmentsList();
    return newAppointment;
}

function updateAppointment(id, updatedData) {
    let appointments = getAppointments();
    const index = appointments.findIndex(app => app.id === id);
    if (index !== -1) {
        appointments[index] = { ...appointments[index], ...updatedData };
        saveAppointments(appointments);
        renderAppointmentsList();
        return true;
    }
    return false;
}

function deleteAppointment(id) {
    let appointments = getAppointments();
    appointments = appointments.filter(app => app.id !== id);
    saveAppointments(appointments);
    renderAppointmentsList();
}

// --- Функции для рендеринга списка ---
function getFilteredAndSortedAppointments() {
    let appointments = getAppointments();

    // Поиск (можно использовать оптимизированную версию)
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        appointments = appointments.filter(app => app.name.toLowerCase().includes(searchTerm));
    }

    // Фильтрация
    const filterDoctor = document.getElementById('filterDoctor').value;
    if (filterDoctor !== 'all') {
        appointments = appointments.filter(app => app.doctor === filterDoctor);
    }

    // Сортировка
    const sortOrder = document.getElementById('sortDate').value;
    appointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return appointments;
}

function renderAppointmentsList() {
    const container = document.getElementById('appointmentsContainer');
    const appointments = getFilteredAndSortedAppointments();

    if (appointments.length === 0) {
        container.innerHTML = '<p class="placeholder-message">Нет записей, соответствующих условиям.</p>';
        return;
    }

    container.innerHTML = appointments.map(app => `
        <div class="appointment-card" data-id="${app.id}">
            <div class="card-header">
                <h4>${escapeHtml(app.name)}</h4>
                <span class="card-badge">${escapeHtml(app.doctor)}</span>
            </div>
            <div class="card-body">
                <p><i class="fas fa-phone"></i> ${escapeHtml(app.phone)}</p>
                <p><i class="fas fa-calendar-day"></i> ${escapeHtml(app.date)} в ${escapeHtml(app.time)}</p>
            </div>
            <div class="card-actions">
                <button class="btn-edit" data-id="${app.id}"><i class="fas fa-edit"></i> Редактировать</button>
                <button class="btn-delete" data-id="${app.id}"><i class="fas fa-trash-alt"></i> Удалить</button>
            </div>
        </div>
    `).join('');

    // Добавляем обработчики на кнопки
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            loadAppointmentIntoForm(id);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (confirm('Вы уверены, что хотите удалить эту запись?')) {
                deleteAppointment(id);
            }
        });
    });
}

// --- Загрузка записи в форму для редактирования ---
function loadAppointmentIntoForm(id) {
    const appointments = getAppointments();
    const appointment = appointments.find(app => app.id === id);
    if (!appointment) return;

    document.getElementById('editId').value = appointment.id;
    document.getElementById('patientName').value = appointment.name;
    document.getElementById('patientPhone').value = appointment.phone;
    document.getElementById('doctorSelect').value = appointment.doctor;
    document.getElementById('appointmentDate').value = appointment.date;
    document.getElementById('appointmentTime').value = appointment.time;

    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Редактирование записи';
    document.getElementById('submitBtn').innerHTML = 'Обновить запись';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
}

function resetForm() {
    document.getElementById('editId').value = '';
    document.getElementById('appointmentForm').reset();
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Новая запись';
    document.getElementById('submitBtn').innerHTML = 'Сохранить запись';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

// --- Обработка отправки формы ---
function handleFormSubmit(event) {
    event.preventDefault();

    const id = document.getElementById('editId').value;
    const name = document.getElementById('patientName').value.trim();
    const phone = document.getElementById('patientPhone').value.trim();
    const doctor = document.getElementById('doctorSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;

    if (!name || !phone || !doctor || !date || !time) {
        alert('Пожалуйста, заполните все обязательные поля!');
        return;
    }

    const appointmentData = { name, phone, doctor, date, time };

    if (id) {
        updateAppointment(id, appointmentData);
        resetForm();
    } else {
        addAppointment(appointmentData);
        resetForm();
    }
}

// --- Инициализация приложения ---
function initApp() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').min = today;

    // Загружаем данные и строим индексы при старте
    const appointments = getAppointments();
    buildIndexes(appointments);

    document.getElementById('appointmentForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('cancelEditBtn').addEventListener('click', resetForm);
    document.getElementById('searchInput').addEventListener('input', renderAppointmentsList);
    document.getElementById('filterDoctor').addEventListener('change', renderAppointmentsList);
    document.getElementById('sortDate').addEventListener('change', renderAppointmentsList);

    renderAppointmentsList();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);