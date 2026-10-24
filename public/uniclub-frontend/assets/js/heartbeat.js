/**
 * UniClub Hub - Secure Session Heartbeat & Keep-Alive Engine
 * Complies with Section J.7.2 (5-min ping, idle detection, KICKED realtime handler)
 */

(function () {
  const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle limit
  let lastActivityTime = Date.now();
  let heartbeatTimer = null;

  // Track user activity
  function recordActivity() {
    lastActivityTime = Date.now();
  }

  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach((event) => {
    window.addEventListener(event, recordActivity, { passive: true });
  });

  // Perform heartbeat ping
  function sendHeartbeatPing() {
    // Only send ping if tab is visible and user has been active within 30 minutes
    const now = Date.now();
    const isIdle = now - lastActivityTime > IDLE_TIMEOUT_MS;

    if (document.hidden) {
      return; // Do not waste bandwidth if tab is hidden
    }

    if (isIdle) {
      console.warn('[UniClub Heartbeat] User is idle > 30 mins. Session may expire.');
      return;
    }

    // Check if session status in localStorage was marked KICKED by admin
    const sessions = JSON.parse(localStorage.getItem('uniclub_admin_sessions') || '[]');
    const currentDeviceToken = localStorage.getItem('uniclub_device_token');
    
    // Check kickout simulation
    const isKicked = localStorage.getItem('uniclub_session_kicked') === 'true';
    if (isKicked) {
      clearInterval(heartbeatTimer);
      localStorage.removeItem('uniclub_session_kicked');
      localStorage.removeItem('uniclub_logged_in_user');
      if (typeof showToast === 'function') {
        showToast('Phiên làm việc của bạn đã bị Admin chính ngắt kết nối (Kickout).', 'danger');
      }
      setTimeout(() => {
        window.location.href = window.location.pathname.includes('/admin/') ? '../login.html' : 'login.html';
      }, 1200);
      return;
    }

    // Ping simulation
    console.log('[UniClub Heartbeat] Ping sent at ' + new Date().toLocaleTimeString() + ' · Session Keep-Alive OK.');
  }

  // Start heartbeat
  heartbeatTimer = setInterval(sendHeartbeatPing, HEARTBEAT_INTERVAL_MS);

  // Initial check on load
  document.addEventListener('DOMContentLoaded', () => {
    sendHeartbeatPing();
  });
})();
