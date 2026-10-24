/**
 * UniClub Hub - Events & Checkin Client Logic
 * Enhanced with J.6.1 Race-Condition Protection & Dynamic Capacity Sync
 */

document.addEventListener('DOMContentLoaded', () => {
  initEventFilters();
  initRegistrationModal();
  initQrScanner();
});

// Event filtering & search with empty state support
function initEventFilters() {
  const searchInput = document.getElementById('eventSearchInput');
  const typeFilter = document.getElementById('eventTypeFilter');
  const eventCards = document.querySelectorAll('.event-card-item');

  function filterEvents() {
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedType = typeFilter ? typeFilter.value : 'ALL';
    let visibleCount = 0;

    eventCards.forEach(card => {
      const title = card.getAttribute('data-title')?.toLowerCase() || '';
      const type = card.getAttribute('data-type') || '';
      const matchKeyword = !keyword || title.includes(keyword);
      const matchType = selectedType === 'ALL' || type === selectedType;

      if (matchKeyword && matchType) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    const noResultAlert = document.getElementById('noEventFoundAlert');
    if (noResultAlert) {
      noResultAlert.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  if (searchInput) searchInput.addEventListener('input', filterEvents);
  if (typeFilter) typeFilter.addEventListener('change', filterEvents);
}

// Event Registration Form Handler with Concurrency & Seat Validation (J.6.1)
function initRegistrationModal() {
  const regForm = document.getElementById('eventRegistrationForm');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const eventTitle = document.getElementById('modalEventTitle')?.textContent || 'Workshop Git & GitHub Actions CI/CD Thực Chiến';
      const format = document.querySelector('input[name="participationFormat"]:checked')?.value || 'Trực tiếp';
      const eventId = 1; // Sample target event ID
      const currentMssv = '2374820143';

      // 1. Check duplicate registration (UNIQUE constraint mock TC58)
      const existingRegs = JSON.parse(localStorage.getItem('uniclub_registrations') || '[]');
      const isDuplicate = existingRegs.some(r => r.mssv === currentMssv && (r.eventTitle === eventTitle || r.id === eventId) && r.status !== 'CANCELLED');

      if (isDuplicate) {
        showToast(`Bạn đã có đơn đăng ký tham gia sự kiện này rồi (Mã ràng buộc: UNIQUE(event_id, user_id))!`, 'warning');
        const modalElem = document.getElementById('registerEventModal');
        if (modalElem) {
          const modal = bootstrap.Modal.getInstance(modalElem);
          if (modal) modal.hide();
        }
        return;
      }

      // 2. Capacity Check (Race Condition prevention mock TC57)
      const events = JSON.parse(localStorage.getItem('uniclub_events') || '[]');
      const targetEvent = events.find(ev => ev.id === eventId || ev.title === eventTitle);

      if (targetEvent && targetEvent.remainingSeats <= 0) {
        showToast('Sự kiện đã hết suất nhận đăng ký trong tích tắc (Capacity limit reached)!', 'danger');
        return;
      }

      // 3. Decrement seats atomically & persist
      if (targetEvent) {
        targetEvent.remainingSeats = Math.max(0, targetEvent.remainingSeats - 1);
        localStorage.setItem('uniclub_events', JSON.stringify(events));
      }

      // 4. Save registration record
      const newReg = {
        id: Date.now(),
        memberName: 'Lưu Hữu Phát',
        mssv: currentMssv,
        eventTitle: eventTitle,
        form: format,
        regDate: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        checkin: 'NONE'
      };
      existingRegs.push(newReg);
      localStorage.setItem('uniclub_registrations', JSON.stringify(existingRegs));

      // Close modal
      const modalElem = document.getElementById('registerEventModal');
      if (modalElem) {
        const modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();
      }

      showToast(`Đăng ký tham gia "${eventTitle}" (${format}) thành công! Số chỗ còn lại đã được cập nhật.`, 'success');
      
      // Update button state on current page if present
      const joinBtn = document.getElementById('btnJoinEventDetail');
      if (joinBtn) {
        joinBtn.disabled = true;
        joinBtn.className = 'btn btn-secondary disabled w-100 py-2.5 rounded-pill fw-bold shadow-none';
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
      scanBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang kết nối camera và giải mã token QR...';
      
      if (scanStatus) scanStatus.style.display = 'block';
      if (scanResultSuccess) scanResultSuccess.style.display = 'none';
      if (scanResultFail) scanResultFail.style.display = 'none';

      // Simulate QR Token verification (2.0 seconds)
      setTimeout(() => {
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<i class="bi bi-qr-code-scan me-1"></i> Bắt đầu Quét mã QR';
        if (scanStatus) scanStatus.style.display = 'none';
        
        // 90% chance success mock
        const isSuccess = Math.random() < 0.9;
        if (isSuccess && scanResultSuccess) {
          scanResultSuccess.style.display = 'block';
          showToast('Điểm danh thành công! Token QR động (30s) hợp lệ.', 'success');
        } else if (scanResultFail) {
          scanResultFail.style.display = 'block';
          showToast('Mã QR đã hết hạn hoặc không khớp sự kiện đã duyệt!', 'danger');
        }
      }, 1800);
    });
  }
}
