/**
 * UniClub Hub - Admin Dashboard Metrics & Chart.js Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initDashboardCharts();
  initExportReport();
});

function initDashboardCharts() {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') return;

  // 1. Monthly Events & Attendance Chart
  const attendanceCanvas = document.getElementById('attendanceTrendChart');
  if (attendanceCanvas) {
    new Chart(attendanceCanvas, {
      type: 'line',
      data: {
        labels: ['Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11'],
        datasets: [
          {
            label: 'Lượt đăng ký',
            data: [45, 60, 75, 110, 140, 185],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.35
          },
          {
            label: 'Đã điểm danh thực tế',
            data: [40, 52, 68, 98, 128, 170],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // 2. Department Breakdown Chart
  const deptCanvas = document.getElementById('departmentShareChart');
  if (deptCanvas) {
    new Chart(deptCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Ban Chuyên môn', 'Ban Sự kiện', 'Ban Truyền thông', 'Ban Đối ngoại', 'Ban Chủ nhiệm'],
        datasets: [{
          data: [35, 25, 20, 15, 5],
          backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

function initExportReport() {
  const exportBtn = document.getElementById('btnExportReportCsv');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      showToast('Đang trích xuất dữ liệu báo cáo ra file Excel (.xlsx)...', 'info');
      setTimeout(() => {
        showToast('Xuất báo cáo tổng kết hoạt động CLB thành công! File đã sẵn sàng tải xuống.', 'success');
      }, 1200);
    });
  }
}
