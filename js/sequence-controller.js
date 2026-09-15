/**
 * IGNITE - Sequence Controller
 * Orchestrates the exact 7-stage cinematic narrative:
 * 1. Darkness -> 2. Spark -> 3. Firewood Catches -> 4. Explosion -> 5. Flames Form IGNITE -> 6. Title Lock -> 7. Event Portal
 */

class IgniteSequenceController {
    constructor() {
        this.currentStage = 'DARKNESS';
        this.isIgnited = false;
        this.canClick = true;

        // DOM Elements
        this.promptEl = null;
        this.titleLockContainer = null;
        this.mainWebsite = null;
        this.navHeader = null;
        this.heatDistortionOverlay = null;
    }

    init() {
        this.promptEl = document.getElementById('initial-prompt');
        this.titleLockContainer = document.getElementById('title-lock-container');
        this.mainWebsite = document.getElementById('event-website');
        this.navHeader = document.getElementById('main-nav');
        this.heatDistortionOverlay = document.getElementById('heat-distortion-overlay');

        // Global click listener for the opening scene
        const clickCatcher = document.getElementById('opening-click-catcher');
        if (clickCatcher) {
            clickCatcher.addEventListener('click', (e) => {
                this.handleUserIgniteClick(e);
            });
        }
    }

    handleUserIgniteClick(e) {
        if (!this.canClick || this.isIgnited) return;
        this.isIgnited = true;
        this.canClick = false;

        // Hide click catcher so normal site clicks can happen later
        const clickCatcher = document.getElementById('opening-click-catcher');
        if (clickCatcher) {
            clickCatcher.style.pointerEvents = 'none';
        }

        // Initialize audio engine on user interaction
        if (window.igniteAudio) {
            window.igniteAudio.init();
        }

        // Run the 7-stage cinematic sequence
        this.runSequence();
    }

    runSequence() {
        // -------------------------------------------------------------
        // STAGE 2: USER CLICKS — SPARK (0s - 0.8s)
        // -------------------------------------------------------------
        this.currentStage = 'SPARK';
        document.body.classList.add('stage-spark');

        // Fade out initial prompt
        if (this.promptEl) {
            this.promptEl.classList.add('fade-out');
        }

        // Play ignition sound & trigger spark particles
        if (window.igniteAudio) {
            window.igniteAudio.playSpark();
        }
        if (window.igniteEngine) {
            window.igniteEngine.triggerSpark();
        }

        // -------------------------------------------------------------
        // STAGE 3: FIREWOOD CATCHES FIRE (at 0.85s)
        // -------------------------------------------------------------
        setTimeout(() => {
            this.currentStage = 'FIREWOOD_CATCHES';
            document.body.classList.add('stage-catches');

            if (window.igniteAudio) {
                window.igniteAudio.startFire(0.28);
            }
            if (window.igniteEngine) {
                window.igniteEngine.triggerFirewoodCatches();
            }
        }, 850);

        // -------------------------------------------------------------
        // STAGE 4: BONFIRE EXPLOSION (at 2.4s)
        // -------------------------------------------------------------
        setTimeout(() => {
            this.currentStage = 'BONFIRE_EXPLOSION';
            document.body.classList.add('stage-explosion');

            // Flash effect
            const flash = document.getElementById('explosion-flash');
            if (flash) {
                flash.classList.add('active');
                setTimeout(() => flash.classList.remove('active'), 600);
            }

            if (window.igniteAudio) {
                window.igniteAudio.playExplosion();
            }
            if (window.igniteEngine) {
                window.igniteEngine.triggerBonfireExplosion();
            }
        }, 2400);

        // -------------------------------------------------------------
        // STAGE 5: FLAMES FORM “IGNITE” (at 4.2s)
        // -------------------------------------------------------------
        setTimeout(() => {
            this.currentStage = 'FLAMES_FORM_IGNITE';
            document.body.classList.add('stage-flame-text');

            if (this.heatDistortionOverlay) {
                this.heatDistortionOverlay.classList.add('active');
            }

            if (window.igniteEngine) {
                window.igniteEngine.triggerFlamesFormText();
            }
        }, 4200);

        // -------------------------------------------------------------
        // STAGE 6: TITLE LOCKS INTO PLACE (at 6.4s)
        // -------------------------------------------------------------
        setTimeout(() => {
            this.currentStage = 'TITLE_LOCK';
            document.body.classList.add('stage-title-locked');

            if (this.titleLockContainer) {
                this.titleLockContainer.classList.add('locked');
            }

            if (window.igniteAudio) {
                window.igniteAudio.playTitleLock();
            }
            if (window.igniteEngine) {
                window.igniteEngine.triggerTitleLock();
            }
        }, 6400);

        // -------------------------------------------------------------
        // STAGE 7: TRANSITION INTO THE EVENT WEBSITE (at 8.2s)
        // -------------------------------------------------------------
        setTimeout(() => {
            this.currentStage = 'WEBSITE_READY';
            document.body.classList.add('stage-website-ready');

            // Allow page scrolling
            document.body.style.overflow = 'auto';

            if (this.navHeader) {
                this.navHeader.classList.add('revealed');
            }
            if (this.mainWebsite) {
                this.mainWebsite.classList.add('revealed');
            }

            if (window.igniteEngine) {
                window.igniteEngine.transitionToWebsite();
            }
        }, 8200);
    }

    replay() {
        window.location.reload();
    }
}

window.igniteSequence = new IgniteSequenceController();
