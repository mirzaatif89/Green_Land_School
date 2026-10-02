(() => {
  const form = document.getElementById('onlineAdmissionForm');
  const status = document.getElementById('admissionFormStatus');
  const button = document.getElementById('admissionSubmit');
  const notice = document.getElementById('admissionNotice');
  const noticeTitle = document.getElementById('admissionNoticeTitle');
  const noticeMessage = document.getElementById('admissionNoticeMessage');
  const noticeIcon = document.getElementById('admissionNoticeIcon');
  const noticeClose = document.getElementById('admissionNoticeClose');
  if (!form || !status || !button) return;

  function showNotice({ title, message, type = 'success' }) {
    if (!notice || !noticeTitle || !noticeMessage) return;
    noticeTitle.textContent = title;
    noticeMessage.textContent = message;
    notice.dataset.type = type;
    if (noticeIcon) noticeIcon.textContent = type === 'success' ? '✓' : '!';
    notice.hidden = false;
    document.body.classList.add('admission-notice-open');
    noticeClose?.focus();
  }

  function closeNotice() {
    if (!notice || notice.hidden) return;
    notice.hidden = true;
    document.body.classList.remove('admission-notice-open');
    button.focus();
  }

  noticeClose?.addEventListener('click', closeNotice);
  notice?.addEventListener('click', (event) => {
    if (event.target === notice) closeNotice();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNotice();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    if (String(values.website || '').trim()) return;
    delete values.website;

    button.disabled = true;
    status.dataset.state = '';
    status.textContent = 'Submitting your application…';
    try {
      const response = await fetch('/api/online-admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 409 || result.code === 'ALREADY_APPLIED') {
        status.textContent = '';
        showNotice({ title: 'Already applied', message: result.message || 'An application with this B-Form or CNIC is already on file. Please contact the school if you need help.', type: 'error' });
        return;
      }
      if (!response.ok || !result.success) throw new Error(result.message || 'Your application could not be submitted. Please try again.');
      form.reset();
      status.textContent = '';
      showNotice({ title: 'Application received', message: `Your reference number is ${result.application?.id || 'saved'}. Our admissions team will contact you soon.` });
    } catch (error) {
      status.textContent = '';
      showNotice({ title: 'Could not submit', message: error.message || 'Network error. Please try again or call the school.', type: 'error' });
    } finally {
      button.disabled = false;
    }
  });
})();
