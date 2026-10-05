/**
 * UniClub Hub - Form Validation & UI Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initFormValidations();
});

// Toggle Password Visibility
function initPasswordToggles() {
  document.querySelectorAll('.btn-toggle-password').forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      const icon = this.querySelector('i');
      if (input && input.type === 'password') {
        input.type = 'text';
        if (icon) {
          icon.classList.remove('bi-eye');
          icon.classList.add('bi-eye-slash');
        }
      } else if (input) {
        input.type = 'password';
        if (icon) {
          icon.classList.remove('bi-eye-slash');
          icon.classList.add('bi-eye');
        }
      }
    });
  });
}

// Universal Bootstrap form validation
function initFormValidations() {
  const forms = document.querySelectorAll('.needs-validation');

  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      // Check password match if confirmPassword field exists
      const pass = form.querySelector('input[name="password"]');
      const confirmPass = form.querySelector('input[name="confirmPassword"]');
      if (pass && confirmPass && pass.value !== confirmPass.value) {
        confirmPass.setCustomValidity('Mật khẩu xác nhận không khớp');
      } else if (confirmPass) {
        confirmPass.setCustomValidity('');
      }

      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        // If form has custom data-success-msg, handle with toast
        const successMsg = form.getAttribute('data-success-msg');
        if (successMsg) {
          event.preventDefault();
          showToast(successMsg, 'success');
          form.reset();
          form.classList.remove('was-validated');
          return;
        }
      }

      form.classList.add('was-validated');
    }, false);
  });
}
