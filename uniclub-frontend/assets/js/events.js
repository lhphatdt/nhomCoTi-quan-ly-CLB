/**
 * UniClub Hub - Events & Checkin Client Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initEventFilters();
  initRegistrationModal();
  initQrScanner();
});

// Event filtering & search
function initEventFilters() {
  const searchInput = document.getElementById('eventSearchInput');
  const typeFilter = document.getElementById('eventTypeFilter');
  const eventCards = document.querySelectorAll('.event-card-item');

  function filterEvents() {
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedType = typeFilter ? typeFilter.value : 'ALL';

    eventCards.forEach(card => {
      const title = card.getAttribute('data-title')?.toLowerCase() || '';
      const type = card.getAttribute('data-type') || '';
      const matchKeyword = !keyword || title.includes(keyword);
      const matchType = selectedType === 'ALL' || type === selectedType;

      if (matchKeyword && matchType) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });

    const noResultAlert = document.getElementById('noEventFoundAlert');
    if (noResultAlert) {
      const visibleCount = Array.from(eventCards).filter(c => c.style.display !== 'none').length;
      noResultAlert.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  if (searchInput) searchInput.addEventListener('input', filterEvents);
  if (typeFilter) typeFilter.addEventListener('change', filterEvents);
}

// Event Registration Form Handler
function initRegistrationModal() {
  const regForm = document.getElementById('eventRegistrationForm');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const eventTitle = document.getElementById('modalEventTitle')?.textContent || 'Sự kiện';
      const format = document.querySelector('input[name="participationFormat"]:checked')?.value || 'Trực tiếp';
      
      const modalElem = document.getElementById('registerEventModal');
      if (modalElem) {
        const modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();
      }

      showToast(`Đăng ký tham gia "${eventTitle}" (${format}) thành công! Trạng thái: Chờ duyệt.`, 'success');
      
      // Update button state on current page if present
      const joinBtn = document.getElementById('btnJoinEventDetail');
      if (joinBtn) {
        joinBtn.disabled = true;
        joinBtn.className = 'btn btn-secondary disabled w-100 py-2 fw-bold';
        joinBtn.innerHTML = '<i class="bi bi-clock-history me-1"></i> Đã đăng ký (Chờ duyệt)';
      }
    });
  }
}

// Dynamic QR Scanner Simulator
function initQrScanner() {
  const scanBtn = document.getElementById('btnStartQrScan');
  const scanStatus = document.getElementById('qrScanStatusBox');
  const scanResultSuccess = document.getElementById('qrScanResultSuccess');
  const scanResultFail = document.getElementById('qrScanResultFail');

  if (scanBtn) {
    scanBtn.addEventListener('click', () => {
      scanBtn.disabled = true;
      scanBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang quét mã QR từ camera...';
      
      if (scanStatus) scanStatus.style.display = 'block';
      if (scanResultSuccess) scanResultSuccess.style.display = 'none';
      if (scanResultFail) scanResultFail.style.display = 'none';

      // Simulate QR Token verification (2.5 seconds)
      setTimeout(() => {
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<i class="bi bi-qr-code-scan me-1"></i> Quét lại mã QR';
        
        // 90% chance success mock
        const isSuccess = Math.random() < 0.9;
        if (isSuccess && scanResultSuccess) {
          scanResultSuccess.style.display = 'block';
          showToast('Điểm danh thành công! Hệ thống đã ghi nhận tham dự lúc ' + new Date().toLocaleTimeString(), 'success');
        } else if (scanResultFail) {
          scanResultFail.style.display = 'block';
          showToast('Mã QR không hợp lệ hoặc đã hết hạn (token đổi mỗi 30s)!', 'danger');
        }
      }, 2000);
    });
  }
}
