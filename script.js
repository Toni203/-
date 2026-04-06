// ===== script.js — ДОПОЛНИТЕЛЬНЫЕ СКРИПТЫ ДЛЯ САЙТА =====
// Этот файл отвечает за:
// - подсветку активного пункта меню
// - открытие/закрытие модального окна записи
// - валидацию формы
// - маску для телефона
// - сохранение записей в localStorage (упрощённая версия)

// ===== 1. ПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ =====
// Эта функция определяет, на какой странице мы находимся,
// и добавляет класс active соответствующей ссылке в меню
function setActiveNav() {
    // Получаем имя текущего файла из адресной строки
    // Например: "/doctors.html" → "doctors.html"
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Находим все ссылки в меню навигации
    const navLinks = document.querySelectorAll('nav a');

    // Перебираем все ссылки
    navLinks.forEach(link => {
        link.classList.remove('active'); // Убираем подсветку у всех
        const href = link.getAttribute('href'); // Берём адрес из ссылки
        if (href === currentPage) {          // Если адрес совпадает с текущей страницей
            link.classList.add('active');     // Добавляем подсветку
        }
    });
}

// ===== 2. ОТКРЫТИЕ МОДАЛЬНОГО ОКНА =====
// doctor — имя врача (если запись к конкретному врачу)
// service — название услуги (если запись на конкретную услугу)
function openModal(doctor = '', service = '') {

    // Находим модальное окно на странице
    const modal = document.getElementById('appointmentModal');

    // Если модального окна нет (например, на какой-то странице его забыли добавить)
    if (!modal) {
        alert('Форма записи временно недоступна. Пожалуйста, позвоните нам по телефону.');
        return;
    }

    // Находим блок с дополнительной информацией (кто/что выбрано)
    const serviceInfo = document.getElementById('selectedServiceInfo');
    const serviceText = document.getElementById('selectedServiceText');

    // Если передан врач или услуга — показываем информационный блок
    if (doctor || service) {
        serviceInfo.style.display = 'block'; // Показываем блок

        if (doctor) {
            // Если запись к врачу — пишем "Запись к врачу: Имя"
            serviceText.textContent = `Запись к врачу: ${doctor}`;

            // Автоматически выбираем этого врача в выпадающем списке
            const doctorSelect = document.getElementById('doctor');
            if (doctorSelect) {
                for (let option of doctorSelect.options) {
                    // Сравниваем по первому слову (имени)
                    if (option.text.includes(doctor.split(' ')[0])) {
                        doctorSelect.value = option.value;
                        break;
                    }
                }
            }
        } else if (service) {
            // Если запись на услугу — пишем "Услуга: Название"
            serviceText.textContent = `Услуга: ${service}`;
        }
    } else {
        // Если ничего не передано — скрываем информационный блок
        if (serviceInfo) serviceInfo.style.display = 'none';
    }

    // Устанавливаем минимальную дату — сегодня (нельзя записаться в прошлое)
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0]; // Формат: 2025-04-06
        dateInput.min = today;
    }

    // Показываем модальное окно (добавляем класс active)
    modal.classList.add('active');
    // Запрещаем прокрутку фона страницы
    document.body.style.overflow = 'hidden';
}

// ===== 3. ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА =====
function closeModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.classList.remove('active');      // Скрываем окно
        document.body.style.overflow = '';    // Возвращаем прокрутку

        // Сбрасываем форму (очищаем все поля)
        const form = document.getElementById('appointmentForm');
        if (form) form.reset();

        // Скрываем все сообщения об ошибках
        document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    }
}

// ===== 4. ВАЛИДАЦИЯ ТЕЛЕФОНА =====
// Проверяет, соответствует ли номер формату:
// +7 123 456 78 90 или 8 123 456 78 90 (с пробелами, скобками, дефисами)
function validatePhone(phone) {
    // Регулярное выражение для проверки российского номера телефона
    const phoneRegex = /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
    return phoneRegex.test(phone.replace(/\s+/g, '')); // Убираем пробелы и проверяем
}

// ===== 5. ОТПРАВКА ФОРМЫ (упрощённая версия) =====
// Эта функция вызывается при нажатии кнопки "Отправить заявку"
function submitAppointment(event) {
    event.preventDefault(); // Отменяем перезагрузку страницы

    // Сбрасываем старые сообщения об ошибках
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));

    // Получаем значения из полей формы
    const name = document.getElementById('name')?.value.trim();      // ФИО
    const phone = document.getElementById('phone')?.value.trim();    // Телефон
    const date = document.getElementById('date')?.value;            // Дата
    const doctor = document.getElementById('doctor')?.value;        // Врач
    const comment = document.getElementById('comment')?.value;      // Комментарий
    const callRequest = document.getElementById('callRequest')?.checked; // Заказать звонок?
    const consent = document.getElementById('consent')?.checked;     // Согласие на обработку

    let isValid = true; // Флаг, что форма заполнена правильно

    // Проверка: ФИО не пустое
    if (!name) {
        const nameError = document.getElementById('nameError');
        if (nameError) nameError.classList.add('show');
        isValid = false;
    }

    // Проверка: телефон не пустой и соответствует формату
    if (!phone || !validatePhone(phone)) {
        const phoneError = document.getElementById('phoneError');
        if (phoneError) phoneError.classList.add('show');
        isValid = false;
    }

    // Проверка: дата выбрана
    if (!date) {
        const dateError = document.getElementById('dateError');
        if (dateError) dateError.classList.add('show');
        isValid = false;
    }

    // Проверка: согласие на обработку данных
    if (!consent) {
        const consentError = document.getElementById('consentError');
        if (consentError) consentError.classList.add('show');
        isValid = false;
    }

    // Если есть ошибки — останавливаем отправку
    if (!isValid) return;

    // Если всё хорошо — здесь можно отправить данные на сервер
    // В текущей версии данные НЕ сохраняются в localStorage,
    // только выводятся в консоль и показывается уведомление

    // ... (дальше код обрывается, нет уведомления об успехе)
}

// ===== 6. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =====
document.addEventListener('DOMContentLoaded', function() {
    // Подсвечиваем активный пункт меню
    setActiveNav();

    // Навешиваем обработчики на все кнопки записи
    document.querySelectorAll('.btn-appointment, .btn-outline, .btn-primary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault(); // Отменяем стандартное поведение кнопки

            // Проверяем, находится ли кнопка внутри карточки врача
            const doctorItem = this.closest('.doctor-item');
            // Проверяем, находится ли кнопка внутри карточки услуги
            const serviceItem = this.closest('.service-item');

            if (doctorItem) {
                // Если кнопка у врача — берём имя врача из заголовка h4
                const doctorName = doctorItem.querySelector('h4')?.textContent;
                openModal(doctorName);
            } else if (serviceItem) {
                // Если кнопка у услуги — берём название услуги из заголовка h4
                const serviceName = serviceItem.querySelector('h4')?.textContent;
                openModal('', serviceName);
            } else {
                // Обычная кнопка записи (без предвыбора)
                openModal();
            }
        });
    });

    // Закрытие модального окна при клике на затемнённый фон
    window.onclick = function(event) {
        const modal = document.getElementById('appointmentModal');
        if (event.target === modal) {
            closeModal();
        }
    };

    // МАСКА ДЛЯ ТЕЛЕФОНА
    // Автоматически подставляет +7 при вводе
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Оставляем только цифры

            if (value.length > 0) {
                if (value.startsWith('7')) {
                    value = '+7' + value.slice(1);      // +7XXXXXXXXXX
                } else if (value.startsWith('8')) {
                    value = '+7' + value.slice(1);      // 8 → +7
                } else {
                    value = '+7' + value;               // Просто добавляем +7
                }
            }
            e.target.value = value;
        });
    }
});

// ===== 7. СОХРАНЕНИЕ ЗАПИСИ (отдельная функция) =====
// Эта функция вызывается при нажатии на какую-то кнопку (возможно, не используется)
function saveAppointment() {

    // Получаем данные из формы
    const name = document.getElementById("name").value;
    const doctor = document.getElementById("doctor").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    // Создаём объект записи
    const appointment = {
        id: Date.now(),           // ID = текущая дата в миллисекундах
        name: name,
        doctor: doctor,
        date: date,
        time: time
    };

    // Получаем старые записи из localStorage (или пустой массив)
    let appointments = JSON.parse(localStorage.getItem("appointments")) || [];

    // Добавляем новую запись
    appointments.push(appointment);

    // Сохраняем обратно в localStorage
    localStorage.setItem("appointments", JSON.stringify(appointments));

    // Выводим в консоль для проверки
    console.log("Сохранено:", appointments);
}
