// ===== app.js — ОСНОВНАЯ ЛОГИКА ВЕБ-ПРИЛОЖЕНИЯ =====
// Этот файл отвечает за:
// - создание, чтение, обновление, удаление записей (CRUD)
// - сохранение данных в localStorage
// - поиск, фильтрацию и сортировку записей
// - отображение списка записей на странице

// ===== 1. МОДЕЛЬ ДАННЫХ =====
// Класс Appointment — это "чертёж" одной записи на приём
class Appointment {
    constructor(id, name, phone, doctor, date, time) {
        this.id = id;       // Уникальный идентификатор (строка)
        this.name = name;   // ФИО пациента
        this.phone = phone; // Номер телефона
        this.doctor = doctor; // Врач и специализация
        this.date = date;   // Дата приёма (YYYY-MM-DD)
        this.time = time;   // Время приёма (HH:MM)
    }
}

// ===== 2. РАБОТА С LOCALSTORAGE =====
// Ключ, по которому данные хранятся в браузере
const STORAGE_KEY = 'hospital_appointments';

// Получить все записи из localStorage
// Если записей нет — вернуть пустой массив
function getAppointments() {
    const appointmentsJSON = localStorage.getItem(STORAGE_KEY);
    return appointmentsJSON ? JSON.parse(appointmentsJSON) : [];
}

// Сохранить все записи в localStorage
// И заодно обновить индексы для быстрого поиска
function saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    buildIndexes(appointments); // Обновляем индексы при сохранении
}

// ===== 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
// Генерирует уникальный ID для новой записи
// Комбинация: текущее время в миллисекундах + случайная строка
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

// ===== 4. ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ПОИСКА =====
// Это специальные структуры данных (Map), которые ускоряют поиск
// При большом количестве записей (100+) поиск работает мгновенно

// Индекс по ФИО: ключ — ФИО в нижнем регистре, значение — ID записи
let nameIndex = new Map();

// Индекс по врачу: ключ — имя врача, значение — массив ID записей
let doctorIndex = new Map();

// Функция построения индексов (вызывается при загрузке и после каждого изменения)
function buildIndexes(appointments) {
    nameIndex.clear();    // Очищаем старые индексы
    doctorIndex.clear();

    appointments.forEach(app => {
        // Строим индекс по ФИО
        nameIndex.set(app.name.toLowerCase(), app.id);

        // Строим индекс по врачу
        if (!doctorIndex.has(app.doctor)) {
            doctorIndex.set(app.doctor, []);
        }
        doctorIndex.get(app.doctor).push(app.id);
    });

    // Выводим в консоль информацию о размере индексов (для отладки)
    console.log('Индексы обновлены:', {
        nameIndexSize: nameIndex.size,
        doctorIndexSize: doctorIndex.size
    });
}

// Оптимизированный поиск по ФИО (использует индексы)
// Пока не используется, но готов для будущих улучшений
function searchByNameOptimized(searchTerm) {
    if (!searchTerm) return getAppointments();

    const searchLower = searchTerm.toLowerCase();
    const appointments = getAppointments();

    // Ищем ID, у которых ФИО содержит искомую строку
    const matchingIds = [];
    for (let [name, id] of nameIndex.entries()) {
        if (name.includes(searchLower)) {
            matchingIds.push(id);
        }
    }

    // Возвращаем только те записи, ID которых совпали
    return appointments.filter(app => matchingIds.includes(app.id));
}

// ===== 5. ОСНОВНЫЕ CRUD-ОПЕРАЦИИ =====

// CREATE — создание новой записи
function addAppointment(appointmentData) {
    const appointments = getAppointments();           // Берём текущие записи
    const newAppointment = new Appointment(          // Создаём новую запись
        generateId(),                                 // Генерируем ID
        appointmentData.name,
        appointmentData.phone,
        appointmentData.doctor,
        appointmentData.date,
        appointmentData.time
    );
    appointments.push(newAppointment);                // Добавляем в массив
    saveAppointments(appointments);                   // Сохраняем в localStorage
    renderAppointmentsList();                         // Обновляем список на странице
    return newAppointment;
}

// UPDATE — обновление существующей записи
function updateAppointment(id, updatedData) {
    let appointments = getAppointments();
    const index = appointments.findIndex(app => app.id === id); // Ищем индекс записи

    if (index !== -1) { // Если запись найдена
        // Объединяем старые данные с новыми (поверхностное копирование)
        appointments[index] = { ...appointments[index], ...updatedData };
        saveAppointments(appointments);   // Сохраняем
        renderAppointmentsList();         // Обновляем список
        return true;                      // Сообщаем об успехе
    }
    return false; // Запись не найдена
}

// DELETE — удаление записи
function deleteAppointment(id) {
    let appointments = getAppointments();
    // Оставляем только те записи, у которых ID не совпадает с удаляемым
    appointments = appointments.filter(app => app.id !== id);
    saveAppointments(appointments);   // Сохраняем
    renderAppointmentsList();         // Обновляем список
}

// ===== 6. ФУНКЦИИ ДЛЯ ОТОБРАЖЕНИЯ СПИСКА =====

// Получить записи с учётом поиска, фильтрации и сортировки
function getFilteredAndSortedAppointments() {
    let appointments = getAppointments();

    // --- ПОИСК (по ФИО) ---
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        appointments = appointments.filter(app =>
            app.name.toLowerCase().includes(searchTerm)
        );
    }

    // --- ФИЛЬТРАЦИЯ (по врачу) ---
    const filterDoctor = document.getElementById('filterDoctor').value;
    if (filterDoctor !== 'all') {
        appointments = appointments.filter(app => app.doctor === filterDoctor);
    }

    // --- СОРТИРОВКА (по дате и времени) ---
    const sortOrder = document.getElementById('sortDate').value;
    appointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`); // Превращаем в дату
        const dateB = new Date(`${b.date}T${b.time}`);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return appointments;
}

// Отрисовать список записей на странице
function renderAppointmentsList() {
    const container = document.getElementById('appointmentsContainer');
    const appointments = getFilteredAndSortedAppointments();

    // Если записей нет — показываем сообщение
    if (appointments.length === 0) {
        container.innerHTML = '<p class="placeholder-message">Нет записей, соответствующих условиям.</p>';
        return;
    }

    // Создаём HTML для каждой записи
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

    // Навешиваем обработчики на кнопки "Редактировать"
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Чтобы событие не всплывало выше
            const id = btn.dataset.id;
            loadAppointmentIntoForm(id);
        });
    });

    // Навешиваем обработчики на кнопки "Удалить"
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

// ===== 7. ЗАГРУЗКА ЗАПИСИ В ФОРМУ ДЛЯ РЕДАКТИРОВАНИЯ =====
function loadAppointmentIntoForm(id) {
    const appointments = getAppointments();
    const appointment = appointments.find(app => app.id === id);
    if (!appointment) return; // Если запись не найдена — выходим

    // Заполняем поля формы данными из записи
    document.getElementById('editId').value = appointment.id;
    document.getElementById('patientName').value = appointment.name;
    document.getElementById('patientPhone').value = appointment.phone;
    document.getElementById('doctorSelect').value = appointment.doctor;
    document.getElementById('appointmentDate').value = appointment.date;
    document.getElementById('appointmentTime').value = appointment.time;

    // Меняем заголовок и текст кнопки (режим редактирования)
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Редактирование записи';
    document.getElementById('submitBtn').innerHTML = 'Обновить запись';
    document.getElementById('cancelEditBtn').style.display = 'inline-block'; // Показываем кнопку "Отмена"
}

// Сбросить форму в исходное состояние (режим создания)
function resetForm() {
    document.getElementById('editId').value = '';              // Очищаем скрытое поле с ID
    document.getElementById('appointmentForm').reset();        // Очищаем все поля
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Новая запись';
    document.getElementById('submitBtn').innerHTML = 'Сохранить запись';
    document.getElementById('cancelEditBtn').style.display = 'none'; // Прячем кнопку "Отмена"
}

// ===== 8. ОБРАБОТКА ОТПРАВКИ ФОРМЫ =====
function handleFormSubmit(event) {
    event.preventDefault(); // Отменяем перезагрузку страницы

    // Получаем значения из полей формы
    const id = document.getElementById('editId').value;
    const name = document.getElementById('patientName').value.trim();
    const phone = document.getElementById('patientPhone').value.trim();
    const doctor = document.getElementById('doctorSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;

    // Простая валидация: все обязательные поля должны быть заполнены
    if (!name || !phone || !doctor || !date || !time) {
        alert('Пожалуйста, заполните все обязательные поля!');
        return;
    }

    const appointmentData = { name, phone, doctor, date, time };

    if (id) {
        // Если есть ID — значит это редактирование
        updateAppointment(id, appointmentData);
        resetForm();
    } else {
        // Если ID нет — значит это создание новой записи
        addAppointment(appointmentData);
        resetForm();
    }
}

// ===== 9. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
// Эта функция запускается один раз при загрузке страницы
function initApp() {
    // Устанавливаем минимальную дату — сегодня (нельзя выбрать прошедшую дату)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').min = today;

    // Загружаем данные из localStorage и строим индексы
    const appointments = getAppointments();
    buildIndexes(appointments);

    // Навешиваем обработчики событий
    document.getElementById('appointmentForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('cancelEditBtn').addEventListener('click', resetForm);
    document.getElementById('searchInput').addEventListener('input', renderAppointmentsList);
    document.getElementById('filterDoctor').addEventListener('change', renderAppointmentsList);
    document.getElementById('sortDate').addEventListener('change', renderAppointmentsList);

    // Отрисовываем список записей
    renderAppointmentsList();
}

// ===== 10. ЗАЩИТА ОТ XSS-АТАК =====
// Экранирует специальные HTML-символы, чтобы злоумышленник не мог вставить вредоносный код
function escapeHtml(str) {
    if (!str) return '';
    // Заменяем &, <, > на их HTML-сущности
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c; // Сохраняем эмодзи
    });
}

// ===== 11. ЗАПУСК ПРИЛОЖЕНИЯ =====
// Ждём, пока загрузится DOM (HTML-структура), потом запускаем initApp
document.addEventListener('DOMContentLoaded', initApp);
