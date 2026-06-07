document.addEventListener('DOMContentLoaded', () => {
  // Add Toast Container to body
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  Object.assign(toastContainer.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '10000',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  });
  document.body.appendChild(toastContainer);

  window.showToast = function(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#1f2937' : '#1f2937';
    const borderLeftColor = type === 'success' ? '#10b981' : '#ef4444';
    const icon = type === 'success' ? '✓' : '✕';
    const iconColor = type === 'success' ? '#10b981' : '#ef4444';

    Object.assign(toast.style, {
      background: bgColor,
      color: '#ffffff',
      padding: '16px 20px',
      borderRadius: '6px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontFamily: 'var(--font-body), sans-serif',
      fontSize: '14px',
      minWidth: '280px',
      transform: 'translateX(120%)',
      opacity: '0',
      transition: 'all 0.4s cubic-bezier(0.21, 1.02, 0.73, 1)',
      borderLeft: `4px solid ${borderLeftColor}`
    });

    toast.innerHTML = `
      <div style="background: ${iconColor}20; color: ${iconColor}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">
        ${icon}
      </div>
      <div>
        <div style="font-weight: 600; margin-bottom: 2px;">${type === 'success' ? 'Thành công' : 'Thất bại'}</div>
        <div style="color: #9ca3af; font-size: 13px;">${message}</div>
      </div>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  };

  // Initialize EmailJS
  emailjs.init("RXX_TykdECBFkRqPj");

  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');

  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const phone = document.getElementById('contact-phone').value.trim();
      const subject = document.getElementById('contact-subject').value;
      const message = document.getElementById('contact-message').value.trim();

      // Validation
      if (!name) {
        showToast('Vui lòng nhập tên của bạn.', 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showToast('Vui lòng nhập Email hợp lệ (ví dụ: a@b.com).', 'error');
        return;
      }
      
      const phoneRegex = /^[0-9]{9,11}$/;
      if (!phone || !phoneRegex.test(phone)) {
        showToast('Số điện thoại không hợp lệ (chỉ nhập số, 9-11 ký tự).', 'error');
        return;
      }

      if (!message) {
        showToast('Vui lòng nhập nội dung liên hệ.', 'error');
        return;
      }

      // Loading state
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'ĐANG GỬI...';
      submitBtn.style.opacity = '0.7';
      submitBtn.style.pointerEvents = 'none';

      // Map parameters to template
      const templateParams = {
        from_name: name,
        reply_to: email, // Maps to the Reply-To setting in EmailJS
        phone_number: phone,
        subject: subject,
        message: message
      };

      // Send via EmailJS using the user's service ID and the user needs to provide Template ID
      emailjs.send("service_upwd7br", "template_kzhye47", templateParams)
        .then(function(response) {
          showToast('Tin nhắn đã được gửi thành công! Chúng tôi sẽ liên hệ sớm nhất.', 'success');
          contactForm.reset();
        }, function(error) {
          console.error('FAILED...', error);
          showToast('Có lỗi xảy ra khi gửi. Vui lòng thử lại sau.', 'error');
        })
        .finally(function() {
          submitBtn.innerHTML = originalBtnText;
          submitBtn.style.opacity = '1';
          submitBtn.style.pointerEvents = 'auto';
        });
    });
  }
});
