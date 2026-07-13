(() => {
  const studentForm = document.getElementById('studentForm');
  const teacherForm = document.getElementById('teacherForm');
  const studentCode = document.getElementById('studentCode');
  const teacherUser = document.getElementById('teacherUser');
  const teacherPass = document.getElementById('teacherPass');

  const studentCodes = new Set(['KINDER', 'SEGUNDO', 'SEXTO']);

  studentForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const code = String(studentCode?.value || '').trim().toUpperCase();
    if (studentCodes.has(code)) {
      window.location.href = './juego.html';
      return;
    }
    alert('Código de curso inválido. Revisa e intenta otra vez.');
    studentCode?.focus();
    studentCode?.select?.();
  });

  teacherForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = String(teacherUser?.value || '').trim().toLowerCase();
    const pass = String(teacherPass?.value || '').trim();
    if (user === 'profesora' && pass === 'admin123') {
      window.location.href = './dashboard.html';
      return;
    }
    teacherUser.value = '';
    teacherPass.value = '';
    alert('Acceso denegado.');
    teacherUser?.focus();
  });
})();
