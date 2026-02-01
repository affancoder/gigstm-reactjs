document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('custom-sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle-btn'); // Use class or ID
    const mobileTrigger = document.getElementById('mobile-sidebar-trigger');
    
    if (!sidebar) return;

    function toggleSidebar() {
        sidebar.classList.toggle('expanded');
    }

    // Desktop/Internal Toggle
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent document click from closing immediately
            toggleSidebar();
        });
    }

    // Mobile Floating Trigger
    if (mobileTrigger) {
        mobileTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // Close when clicking outside (Mobile mainly, or Desktop overlay if desired)
    document.addEventListener('click', function(e) {
        // If expanded and click is outside sidebar and not on the mobile trigger
        if (sidebar.classList.contains('expanded') && 
            !sidebar.contains(e.target) && 
            (!mobileTrigger || !mobileTrigger.contains(e.target))) {
            
            // On mobile, always close. On desktop, only close if it's an overlay behavior?
            // User requested "Default state: collapsed".
            // If user expands it, they might want it to stay expanded on desktop.
            // But if it overlays content, they might want auto-close.
            // Let's limit auto-close to mobile for now, or if it's overlaying.
            // Since we implemented body padding-left: 60px on desktop, the expanded part (250px) overlays.
            // So clicking outside *should* probably close it on desktop too if it's obscuring content.
            // But often admin sidebars stay open.
            // Let's stick to Mobile auto-close for safety.
            
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('expanded');
            }
        }
    });
});
