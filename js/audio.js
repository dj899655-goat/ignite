/**
 * IGNITE - Procedural Web Audio API Sound Engine
 * Synthesizes cinematic audio effects completely in-browser without external audio dependencies.
 */
class IgniteAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isInitialized = false;
        this.masterGain = null;
        this.fireGain = null;
        this.droneGain = null;
        this.fireNoiseNode = null;
        this.crackleInterval = null;
    }

    init() {
        if (this.isInitialized) {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            console.warn('Web Audio API not supported in this browser.');
            return;
        }

        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.fireGain = this.ctx.createGain();
        this.fireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
        this.fireGain.connect(this.masterGain);

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
        this.droneGain.connect(this.masterGain);

        this.isInitialized = true;
        this.startAmbientDrone();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime, 0.05);
        }
        return this.isMuted;
    }

    // 1. Subtle Dark Ambient Drone
    startAmbientDrone() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Sub oscillator
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(55, now); // A1

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(55.8, now); // Slight beating detune

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, now);

        // LFO for slow breathing filter
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.15, now); // Slow cycle
        lfoGain.gain.setValueAtTime(30, now);
        lfo.connect(filter.frequency);
        lfo.start(now);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.droneGain);

        osc1.start(now);
        osc2.start(now);

        this.droneGain.gain.setTargetAtTime(0.18, now, 2.0);
    }

    // 2. Spark Ignition Sound
    playSpark() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // High frequency click & snap
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(2400, now);
        clickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

        clickGain.gain.setValueAtTime(0.6, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        clickOsc.connect(clickGain);
        clickGain.connect(this.masterGain);
        clickOsc.start(now);
        clickOsc.stop(now + 0.07);

        // Resonant metallic ping (flint striker)
        const pingOsc = this.ctx.createOscillator();
        const pingGain = this.ctx.createGain();
        pingOsc.type = 'sine';
        pingOsc.frequency.setValueAtTime(3800, now);
        pingOsc.frequency.exponentialRampToValueAtTime(1600, now + 0.25);

        pingGain.gain.setValueAtTime(0.35, now);
        pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        pingOsc.connect(pingGain);
        pingGain.connect(this.masterGain);
        pingOsc.start(now);
        pingOsc.stop(now + 0.26);

        // Micro noise burst
        this._playNoiseBurst(now, 0.08, 1200, 4800, 0.4);
    }

    // 3. Fire Crackle & Roar
    startFire(intensity = 0.2) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Continuous roar buffer
        if (!this.fireNoiseNode) {
            const bufferSize = 2 * this.ctx.sampleRate;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;

            // Generate brown/pinkish noise for fire roar
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99 * b0 + white * 0.05;
                b1 = 0.96 * b1 + white * 0.11;
                b2 = 0.86 * b2 + white * 0.25;
                output[i] = (b0 + b1 + b2) * 0.35;
            }

            const noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            const fireFilter = this.ctx.createBiquadFilter();
            fireFilter.type = 'bandpass';
            fireFilter.frequency.setValueAtTime(350, now);
            fireFilter.Q.setValueAtTime(1.2, now);

            noiseSource.connect(fireFilter);
            fireFilter.connect(this.fireGain);
            noiseSource.start(now);
            this.fireNoiseNode = noiseSource;
        }

        // Ramp fire volume
        this.fireGain.gain.setTargetAtTime(intensity, now, 0.8);

        // Wood crackle impulses
        if (!this.crackleInterval) {
            this.crackleInterval = setInterval(() => {
                if (this.ctx && !this.isMuted && Math.random() > 0.3) {
                    this._playCracklePop();
                }
            }, 120);
        }
    }

    setFireIntensity(targetIntensity, rampTime = 0.5) {
        if (!this.fireGain || !this.ctx) return;
        this.fireGain.gain.setTargetAtTime(targetIntensity, this.ctx.currentTime, rampTime);
    }

    _playCracklePop() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        const popFilter = this.ctx.createBiquadFilter();

        const freq = 600 + Math.random() * 2800;
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(freq, now);
        popOsc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.03);

        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(freq, now);
        popFilter.Q.setValueAtTime(4.0, now);

        const vol = 0.05 + Math.random() * 0.18;
        popGain.gain.setValueAtTime(vol, now);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        popOsc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.masterGain);

        popOsc.start(now);
        popOsc.stop(now + 0.04);
    }

    // 4. Cinematic Explosion Impact
    playExplosion() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Sub-bass pitch drop (85Hz -> 24Hz)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(85, now);
        subOsc.frequency.exponentialRampToValueAtTime(24, now + 1.2);

        subGain.gain.setValueAtTime(0.9, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start(now);
        subOsc.stop(now + 1.5);

        // Explosive mid whoosh & roar burst
        this._playNoiseBurst(now, 1.0, 180, 1200, 0.7);

        // High transient punch
        const punchOsc = this.ctx.createOscillator();
        const punchGain = this.ctx.createGain();
        punchOsc.type = 'triangle';
        punchOsc.frequency.setValueAtTime(220, now);
        punchOsc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

        punchGain.gain.setValueAtTime(0.8, now);
        punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        punchOsc.connect(punchGain);
        punchGain.connect(this.masterGain);
        punchOsc.start(now);
        punchOsc.stop(now + 0.25);

        // Ramp fire sound up to full roar
        this.setFireIntensity(0.5, 0.3);
    }

    // 5. Title Lock Cinematic Braaam & Metallic Thud
    playTitleLock() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Cinematic Braaam Low End
        const oscLow1 = this.ctx.createOscillator();
        const oscLow2 = this.ctx.createOscillator();
        const dist = this.ctx.createWaveShaper();
        const braaamFilter = this.ctx.createBiquadFilter();
        const braaamGain = this.ctx.createGain();

        oscLow1.type = 'sawtooth';
        oscLow1.frequency.setValueAtTime(65, now); // C2
        oscLow2.type = 'sawtooth';
        oscLow2.frequency.setValueAtTime(65.4, now); // Phasing detune

        dist.curve = this._makeDistortionCurve(20);
        dist.oversample = '2x';

        braaamFilter.type = 'lowpass';
        braaamFilter.frequency.setValueAtTime(1400, now);
        braaamFilter.frequency.exponentialRampToValueAtTime(120, now + 1.8);

        braaamGain.gain.setValueAtTime(0.8, now);
        braaamGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        oscLow1.connect(dist);
        oscLow2.connect(dist);
        dist.connect(braaamFilter);
        braaamFilter.connect(braaamGain);
        braaamGain.connect(this.masterGain);

        oscLow1.start(now);
        oscLow2.start(now);
        oscLow1.stop(now + 2.1);
        oscLow2.stop(now + 2.1);

        // Sharp metallic lock transient
        const lockOsc = this.ctx.createOscillator();
        const lockGain = this.ctx.createGain();
        lockOsc.type = 'sine';
        lockOsc.frequency.setValueAtTime(980, now);
        lockOsc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

        lockGain.gain.setValueAtTime(0.5, now);
        lockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        lockOsc.connect(lockGain);
        lockGain.connect(this.masterGain);
        lockOsc.start(now);
        lockOsc.stop(now + 0.16);
    }

    _playNoiseBurst(startTime, duration, lowFreq, highFreq, maxVol) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime((lowFreq + highFreq) / 2, startTime);
        filter.Q.setValueAtTime(0.9, startTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(maxVol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(startTime);
        noise.stop(startTime + duration);
    }

    _makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }
}

window.igniteAudio = new IgniteAudioEngine();
