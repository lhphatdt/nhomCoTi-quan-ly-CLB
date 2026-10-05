/**
 * UniClub Hub - Admin Control Panel Interactions & Session Gate
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminSidebar();
  initTableSearch();
  initRegistrationActions();
  initMembershipRequestActions();
  initMemberStatusToggle();
  initSessionManagement();
});

// Sidebar toggle on mobile
function initAdminSidebar() {
  const toggleBtn = document.getElementById('adminSidebarToggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });
  }
}

// Universal table search
function initTableSearch() {
  const searchInput = document.getElementById('adminTableSearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    const rows = document.querySelectorAll('.admin-data-table tbody tr');

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(val) ? '' : 'none';
    });
  });
}

// Registration Approval / Rejection
function initRegistrationActions() {
  document.querySelectorAll('.btn-approve-reg').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      const badge = row.querySelector('.badge-reg-status');
      if (badge) {
        badge.className = 'badge badge-status-approved badge-reg-status';
        badge.textContent = 'Đã duyệt';
      }
      this.parentElement.innerHTML = '<span class="text-success small fw-bold"><i class="bi bi-check-circle me-1"></i>Đã duyệt</span>';
      showToast('Đã phê duyệt đăng ký tham gia thành công!', 'success');
    });
  });

  const rejectConfirmBtn = document.getElementById('btnConfirmRejectReg');
  if (rejectConfirmBtn) {
    rejectConfirmBtn.addEventListener('click', () => {
      const reason = document.getElementById('rejectReasonInput')?.value || 'Đã đủ số lượng chỗ';
      const modal = bootstrap.Modal.getInstance(document.getElementById('rejectReasonModal'));
      if (modal) modal.hide();
      showToast(`Đã từ chối đăng ký với lý do: "${reason}"`, 'danger');
    });
  }
}

// Membership Request Actions
function initMembershipRequestActions() {
  document.querySelectorAll('.btn-approve-member-req').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      const badge = row.querySelector('.badge-req-status');
      if (badge) {
        badge.className = 'badge badge-status-approved badge-req-status';
        badge.textContent = 'Đã kết nạp';
      }
      this.parentElement.innerHTML = '<span class="text-success small fw-bold"><i class="bi bi-person-check-fill me-1"></i>Đã duyệt</span>';
      showToast('Đã xét duyệt đơn và tự động thêm hội viên mới vào danh sách CLB!', 'success');
    });
  });
}

// Member Lock / Unlock Toggle
function initMemberStatusToggle() {
  document.querySelectorAll('.btn-toggle-member-status').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      const badge = row.querySelector('.badge-member-status');
      const isLocked = badge && badge.textContent.includes('Khóa');

      if (isLocked) {
        badge.className = 'badge badge-status-active badge-member-status';
        badge.textContent = 'Hoạt động';
        this.innerHTML = '<i class="bi bi-lock text-danger"></i> Khóa';
        showToast('Đã mở khóa tài khoản hội viên thành công.', 'success');
      } else if (badge) {
        badge.className = 'badge badge-status-rejected badge-member-status';
        badge.textContent = 'Tạm khóa';
        this.innerHTML = '<i class="bi bi-unlock text-success"></i> Mở';
        showToast('Đã tạm khóa tài khoản hội viên theo kỷ luật.', 'danger');
      }
    });
  });
}

// Single Active Admin Session Management
function initSessionManagement() {
  // Approve new admin machine
  document.querySelectorAll('.btn-approve-session').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      const badge = row.querySelector('.badge-session-status');
      if (badge) {
        badge.className = 'badge badge-status-active badge-session-status';
        badge.textContent = 'ACTIVE (Secondary)';
      }
      this.parentElement.innerHTML = '<button class="btn btn-sm btn-outline-danger btn-kick-session"><i class="bi bi-power me-1"></i>Kickout</button>';
      showToast('Đã chấp thuận cấp quyền Admin cho thiết bị mới thành công!', 'success');
    });
  });

  // Reject new machine
  document.querySelectorAll('.btn-reject-session').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      const badge = row.querySelector('.badge-session-status');
      if (badge) {
        badge.className = 'badge badge-status-rejected badge-session-status';
        badge.textContent = 'REJECTED';
      }
      this.parentElement.innerHTML = '<span class="text-muted small">Từ chối</span>';
      showToast('Đã từ chối quyền truy cập của thiết bị mới.', 'danger');
    });
  });

  // Kickout session
  document.addEventListener('click', (e) => {
    if (e.target && (e.target.matches('.btn-kick-session') || e.target.closest('.btn-kick-session'))) {
      const btn = e.target.matches('.btn-kick-session') ? e.target : e.target.closest('.btn-kick-session');
      const row = btn.closest('tr');
      const badge = row.querySelector('.badge-session-status');
      if (badge) {
        badge.className = 'badge badge-status-kicked badge-session-status';
        badge.textContent = 'KICKED';
      }
      btn.parentElement.innerHTML = '<span class="text-danger small fw-bold">Đã ngắt kết nối</span>';
      showToast('Đã ngắt kết nối (Kickout) phiên làm việc thành công!', 'danger');
    }
  });

  // Revoke trusted device
  document.querySelectorAll('.btn-revoke-device').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      const badge = row.querySelector('.badge-device-status');
      if (badge) {
        badge.className = 'badge badge-status-rejected badge-device-status';
        badge.textContent = 'REVOKED';
      }
      this.parentElement.innerHTML = '<span class="text-muted small">Đã thu hồi</span>';
      showToast('Đã thu hồi token của thiết bị tin cậy!', 'danger');
    });
  });
}
