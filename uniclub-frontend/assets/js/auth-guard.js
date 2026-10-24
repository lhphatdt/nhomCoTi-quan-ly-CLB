/**
 * UniClub Hub - Strict Authentication & RBAC Guard
 * Protects admin routes and enforces user roles across static frontend pages
 */

(function() {
  const SESSION_KEY = 'uniclub_session';

  // Helper to get active session
  window.getUniClubSession = function() {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  };

  // Helper to set active session
  window.setUniClubSession = function(sessionData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  };

  // Helper to log out
  window.logoutUniClub = function() {
    localStorage.removeItem(SESSION_KEY);
    const isInAdmin = window.location.pathname.includes('/admin/');
    window.location.href = isInAdmin ? '../login.html?logout=true' : 'login.html?logout=true';
  };

  // Execute Guard check on page load
  const session = window.getUniClubSession();
  const path = window.location.pathname;
  const isInAdmin = path.includes('/admin/');

  // 1. ADMIN ROUTE PROTECTION
  if (isInAdmin) {
    if (!session) {
      // Unauthenticated: Immediately redirect to login
      alert('Yêu cầu đăng nhập: Bạn cần đăng nhập tài khoản Quản trị để truy cập trang này.');
      window.location.href = '../login.html?redirect=' + encodeURIComponent(path);
      return;
    }

    // Role check: Only ADMIN, TREASURER, EVENT_LEAD can enter admin
    if (session.role === 'MEMBER' || session.role === 'GUEST') {
      alert('Từ chối truy cập (403): Tài khoản của bạn là Hội viên, không có quyền quản trị viên!');
      window.location.href = '../403.html';
      return;
    }
  }

  // 2. DOM CONTENT LOADED - SYNC NAVBAR UI
  document.addEventListener('DOMContentLoaded', function() {
    syncNavbarAuth();
    attachLogoutHandlers();
  });

  function syncNavbarAuth() {
    const currentSession = window.getUniClubSession();
    const userDropdownContainer = document.querySelector('.dropdown .dropdown-toggle');
    const adminLinkBtn = document.querySelector('a[href*="admin/dashboard.html"]');

    if (!currentSession) {
      // Unauthenticated state in public pages
      if (adminLinkBtn && !isInAdmin) {
        // Change admin button behavior to prompt login
        adminLinkBtn.classList.remove('btn-outline-primary');
        adminLinkBtn.classList.add('btn-outline-secondary');
        adminLinkBtn.innerHTML = '<i class="bi bi-shield-lock me-1"></i> Quản trị (Khóa)';
        adminLinkBtn.onclick = function(e) {
          e.preventDefault();
          alert('Vui lòng đăng nhập với tài khoản Quản trị để vào trang Admin!');
          window.location.href = 'login.html?redirect=admin/dashboard.html';
        };
      }

      // Replace user dropdown with Login button
      const navAuthArea = document.querySelector('.d-flex.align-items-center.gap-2');
      if (navAuthArea && !isInAdmin) {
        const dropdownParent = navAuthArea.querySelector('.dropdown');
        if (dropdownParent) {
          dropdownParent.innerHTML = `
            <a href="login.html" class="btn btn-primary rounded-pill px-3 py-1 font-semibold text-xs">
              <i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập
            </a>
          `;
        }
      }
    } else {
      // Authenticated state: update name and role
      if (userDropdownContainer) {
        const nameSpan = userDropdownContainer.querySelector('span');
        if (nameSpan) {
          nameSpan.textContent = currentSession.name || currentSession.email;
        }
      }

      // Hide admin button for normal members
      if (currentSession.role === 'MEMBER' && adminLinkBtn && !isInAdmin) {
        adminLinkBtn.style.display = 'none';
      }
    }
  }

  function attachLogoutHandlers() {
    document.querySelectorAll('a[href*="login.html"]').forEach(link => {
      if (link.textContent.includes('Đăng xuất') || link.classList.contains('btn-logout')) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          window.logoutUniClub();
        });
      }
    });
  }
})();
