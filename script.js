
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}


function openModal(doctor = '', service = '') {

    const modal = document.getElementById('appointmentModal');
    if (!modal) {
        alert('Форма записи временно недоступна. Пожалуйста, позвоните нам по телефону.');
        return;
    }

    const serviceInfo = document.getElementById('selectedServiceInfo');
    const serviceText = document.getElementById('selectedServiceText');

    if (doctor || service) {
        serviceInfo.style.display = 'block';
        if (doctor) {
            serviceText.textContent = `Запись к врачу: ${doctor}`;

            // Пытаемся выбрать врача в выпадающем списке
            const doctorSelect = document.getElementById('doctor');
            if (doctorSelect) {
                for (let option of doctorSelect.options) {
                    if (option.text.includes(doctor.split(' ')[0])) {
                        doctorSelect.value = option.value;
                        break;
                    }
                }
            }
        } else if (service) {
            serviceText.textContent = `Услуга: ${service}`;
        }
    } else {
        if (serviceInfo) serviceInfo.style.display = 'none';
    }

    // Устанавливаем минимальную дату (сегодня)
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Сбрасываем форму
        const form = document.getElementById('appointmentForm');
        if (form) form.reset();

        // Скрываем ошибки
        document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    }
}

// Валидация телефона
function validatePhone(phone) {
    const phoneRegex = /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Отправка формы
function submitAppointment(event) {
    event.preventDefault();

    // Сброс ошибок
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));

    // Получаем значения
    const name = document.getElementById('name')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const date = document.getElementById('date')?.value;
    const doctor = document.getElementById('doctor')?.value;
    const comment = document.getElementById('comment')?.value;
    const callRequest = document.getElementById('callRequest')?.checked;
    const consent = document.getElementById('consent')?.checked;

    let isValid = true;

    if (!name) {
        const nameError = document.getElementById('nameError');
        if (nameError) nameError.classList.add('show');
        isValid = false;
    }

    if (!phone || !validatePhone(phone)) {
        const phoneError = document.getElementById('phoneError');
        if (phoneError) phoneError.classList.add('show');
        isValid = false;
    }

    if (!date) {
        const dateError = document.getElementById('dateError');
        if (dateError) dateError.classList.add('show');
        isValid = false;
    }

    if (!consent) {
        const consentError = document.getElementById('consentError');
        if (consentError) consentError.classList.add('show');
        isValid = false;
    }

    if (!isValid) return;


// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setActiveNav();

    // Добавляем обработчики для кнопок записи
    document.querySelectorAll('.btn-appointment, .btn-outline, .btn-primary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();

            const doctorItem = this.closest('.doctor-item');
            const serviceItem = this.closest('.service-item');

            if (doctorItem) {
                const doctorName = doctorItem.querySelector('h4')?.textContent;
                openModal(doctorName);
            } else if (serviceItem) {
                const serviceName = serviceItem.querySelector('h4')?.textContent;
                openModal('', serviceName);
            } else {
                openModal();
            }
        });
    });

    // Закрытие модального окна по клику на фон
    window.onclick = function(event) {
        const modal = document.getElementById('appointmentModal');
        if (event.target === modal) {
            closeModal();
        }
    };

    // Маска для телефона
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.startsWith('7')) {
                    value = '+7' + value.slice(1);
                } else if (value.startsWith('8')) {
                    value = '+7' + value.slice(1);
                } else {
                    value = '+7' + value;
                }
            }
            e.target.value = value;
        });
    }
});

// Эта функция вызывается при нажатии на кнопку
function saveAppointment() {

  // Получаем данные из формы
  const name = document.getElementById("name").value;
  const doctor = document.getElementById("doctor").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  // Создаем объект
  const appointment = {
    id: Date.now(),
    name: name,
    doctor: doctor,
    date: date,
    time: time
  };

  // Получаем старые записи или пустой массив
  let appointments = JSON.parse(localStorage.getItem("appointments")) || [];

  // Добавляем новую запись
  appointments.push(appointment);

  // Сохраняем обратно
  localStorage.setItem("appointments", JSON.stringify(appointments));

  // Проверка
  console.log("Сохранено:", appointments);
}