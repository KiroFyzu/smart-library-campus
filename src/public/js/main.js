// Sidebar toggle for mobile
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function() {
      sidebar.classList.toggle('active');
      document.body.classList.toggle('sidebar-open', sidebar.classList.contains('active'));
    });

    sidebar.querySelectorAll('.nav-link').forEach(function(link) {
      link.addEventListener('click', function() {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      });
    });

    document.addEventListener('click', function(event) {
      if (!sidebar.classList.contains('active')) return;
      if (sidebar.contains(event.target) || toggleBtn.contains(event.target)) return;

      sidebar.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    });
  }

  // Auto-dismiss alerts after 5 seconds
  document.querySelectorAll('.alert-dismissible').forEach(function(alert) {
    setTimeout(function() {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      bsAlert.close();
    }, 5000);
  });
});

// Confirm delete action
function confirmDelete(message) {
  return confirm(message || 'Apakah Anda yakin ingin menghapus?');
}

// Format number as currency (IDR)
function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
