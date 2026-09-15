/**
 * IGNITE - Main Application & Website Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize WebGL Canvas
    const canvasContainer = document.getElementById('webgl-canvas-container');
    if (canvasContainer && window.igniteEngine) {
        window.igniteEngine.init(canvasContainer);
    }

    // 2. Initialize Sequence Controller
    if (window.igniteSequence) {
        window.igniteSequence.init();
    }

    // 3. Audio Mute Toggle Button
    const muteBtn = document.getElementById('audio-toggle-btn');
    if (muteBtn && window.igniteAudio) {
        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isMuted = window.igniteAudio.toggleMute();
            muteBtn.classList.toggle('muted', isMuted);
            const label = muteBtn.querySelector('.audio-label');
            if (label) {
                label.textContent = isMuted ? 'Muted' : 'Sound On';
            }
        });
    }

    // 4. Countdown Timer
    initCountdown();

    // 5. Schedule Tabs Switcher
    initScheduleTabs();

    // 6. Events Filter
    initEventsFilter();

    // 7. Modals (Speakers & Details)
    initModals();

    // 8. Smooth Scrolling
    initSmoothScroll();

    // 9. Replay Sequence Button
    const replayBtn = document.getElementById('replay-btn');
    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // 10. Registration Form / Ticket modal
    const regForm = document.getElementById('newsletter-form');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = regForm.querySelector('input[type="email"]');
            const alertBox = document.getElementById('subscribe-success');
            if (input && input.value) {
                if (alertBox) {
                    alertBox.style.display = 'block';
                    setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
                }
                input.value = '';
            }
        });
    }
});

/* Countdown Timer */
function initCountdown() {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 42); // 42 days in future
    eventDate.setHours(18, 0, 0, 0);

    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    function update() {
        const now = new Date().getTime();
        const diff = eventDate.getTime() - now;

        if (diff <= 0) return;

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
        if (minsEl) minsEl.textContent = String(m).padStart(2, '0');
        if (secsEl) secsEl.textContent = String(s).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}

/* Schedule Tab Switcher */
function initScheduleTabs() {
    const tabButtons = document.querySelectorAll('.schedule-tab-btn');
    const dayPanels = document.querySelectorAll('.schedule-day-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetDay = btn.getAttribute('data-day');

            tabButtons.forEach(b => b.classList.remove('active'));
            dayPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPanel = document.getElementById(`schedule-day-${targetDay}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

/* Events Filter */
function initEventsFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const eventCards = document.querySelectorAll('.event-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            eventCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                } else {
                    card.style.display = 'none';
                    card.style.opacity = '0';
                }
            });
        });
    });
}

/* Modal Windows */
function initModals() {
    const modal = document.getElementById('info-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.getElementById('modal-close-btn');

    if (!modal) return;

    // Trigger buttons
    const triggerButtons = document.querySelectorAll('[data-modal-title]');
    triggerButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const title = btn.getAttribute('data-modal-title');
            const desc = btn.getAttribute('data-modal-desc');

            if (modalTitle) modalTitle.textContent = title;
            if (modalBody) modalBody.textContent = desc;

            modal.classList.add('open');
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('open');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('open');
        }
    });
}

/* Smooth Navigation Scrolling */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}
