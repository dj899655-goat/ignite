/**
 * IGNITE - 3D WebGL Fire & Particle Engine (Enhanced)
 * Built with Three.js (r128 compatible)
 * Procedural shaders, realistic bonfire logs, dynamic particle systems, and letter attractor simulation.
 */

class IgniteFireEngine {
    constructor() {
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // Lighting
        this.ambientLight = null;
        this.fireLight1 = null;
        this.fireLight2 = null;
        this.woodRimLight = null;

        // Bonfire meshes
        this.woodGroup = null;
        this.coalBed = null;
        this.logs = [];
        this.logMaterials = [];

        // Particle systems
        this.ambientEmbers = null;
        this.smokeParticles = null;
        this.sparkParticles = null;
        this.flameParticles = null;
        this.explosionSparks = null;
        this.letterParticles = null;
        this.letterSparks = null;
        this.shockwaveRing = null;

        // Letter targets for "IGNITE"
        this.letterTargets = [];
        this.letterTargetCount = 1600;

        // Camera shake & choreography
        this.shakeIntensity = 0;
        this.shakeDecay = 0.92;
        this.baseCamPos = new THREE.Vector3(0, 1.8, 6.2);
        this.targetCamPos = new THREE.Vector3(0, 1.8, 6.2);
        this.camLookAt = new THREE.Vector3(0, 1.0, 0);

        // Sequence state tracking
        this.stage = 0; // 0: DARKNESS, 1: SPARK, 2: CATCHES, 3: EXPLOSION, 4: FLAMES_TEXT, 5: TITLE_LOCK, 6: WEBSITE
        this.stageTime = 0;
        this.fireIntensity = 0.0;
        this.targetFireIntensity = 0.0;
        this.woodGlowIntensity = 0.0;

        // Texture cache
        this.textures = {};
    }

    init(container) {
        this.container = container;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x06070a, 0.07);

        // Responsive camera distance based on aspect ratio
        const aspect = width / height;
        const initialZ = aspect < 1.0 ? 7.8 : 6.2;
        this.baseCamPos.set(0, 1.8, initialZ);
        this.targetCamPos.copy(this.baseCamPos);

        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.camera.position.copy(this.baseCamPos);
        this.camera.lookAt(this.camLookAt);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.18;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Generate procedural textures
        this._generateProceduralTextures();

        // Build 3D world
        this._setupLighting();
        this._createGroundAndHearth();
        this._createFirewoodLogs();
        this._createAmbientEmbers();
        this._createSmokeSystem();
        this._createSparkSystem();
        this._createFlameSystem();
        this._createExplosionSparks();
        this._generateLetterTargets();
        this._createLetterParticles();
        this._createLetterSparks();
        this._createShockwaveRing();

        // Re-sample letters when custom fonts are ready
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                this._generateLetterTargets();
                this._updateLetterTargetPositions();
            });
        }

        // Resize listener
        window.addEventListener('resize', () => this.onResize());

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    /* -------------------------------------------------------------
     * Procedural Texture Generation (Zero External Image Assets)
     * ------------------------------------------------------------- */
    _generateProceduralTextures() {
        // 1. Soft Flame Puff Texture
        const canvasFlame = document.createElement('canvas');
        canvasFlame.width = 128;
        canvasFlame.height = 128;
        const ctxF = canvasFlame.getContext('2d');
        const gradF = ctxF.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradF.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradF.addColorStop(0.18, 'rgba(255, 220, 90, 0.95)');
        gradF.addColorStop(0.45, 'rgba(255, 100, 20, 0.6)');
        gradF.addColorStop(0.75, 'rgba(210, 35, 5, 0.2)');
        gradF.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctxF.fillStyle = gradF;
        ctxF.fillRect(0, 0, 128, 128);
        this.textures.flame = new THREE.CanvasTexture(canvasFlame);

        // 2. Crisp Spark / Ember Star Texture
        const canvasSpark = document.createElement('canvas');
        canvasSpark.width = 64;
        canvasSpark.height = 64;
        const ctxS = canvasSpark.getContext('2d');
        const gradS = ctxS.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradS.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradS.addColorStop(0.2, 'rgba(255, 235, 160, 0.95)');
        gradS.addColorStop(0.5, 'rgba(255, 130, 25, 0.45)');
        gradS.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctxS.fillStyle = gradS;
        ctxS.fillRect(0, 0, 64, 64);
        this.textures.spark = new THREE.CanvasTexture(canvasSpark);

        // 3. Smoke Particle Texture
        const canvasSmoke = document.createElement('canvas');
        canvasSmoke.width = 128;
        canvasSmoke.height = 128;
        const ctxSm = canvasSmoke.getContext('2d');
        const gradSm = ctxSm.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradSm.addColorStop(0, 'rgba(190, 185, 180, 0.38)');
        gradSm.addColorStop(0.4, 'rgba(130, 125, 120, 0.2)');
        gradSm.addColorStop(0.75, 'rgba(60, 55, 55, 0.07)');
        gradSm.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctxSm.fillStyle = gradSm;
        ctxSm.fillRect(0, 0, 128, 128);
        this.textures.smoke = new THREE.CanvasTexture(canvasSmoke);

        // 4. Bark / Wood Charcoal Procedural Texture
        const canvasBark = document.createElement('canvas');
        canvasBark.width = 256;
        canvasBark.height = 256;
        const ctxB = canvasBark.getContext('2d');
        ctxB.fillStyle = '#12100d';
        ctxB.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 240; i++) {
            ctxB.fillStyle = Math.random() > 0.5 ? '#1c1813' : '#0a0807';
            ctxB.fillRect(Math.random() * 256, 0, 2 + Math.random() * 3, 256);
        }
        for (let i = 0; i < 600; i++) {
            ctxB.fillStyle = Math.random() > 0.7 ? '#2a2016' : '#050403';
            ctxB.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
        this.textures.bark = new THREE.CanvasTexture(canvasBark);
        this.textures.bark.wrapS = THREE.RepeatWrapping;
        this.textures.bark.wrapT = THREE.RepeatWrapping;
    }

    /* -------------------------------------------------------------
     * Lighting Setup
     * ------------------------------------------------------------- */
    _setupLighting() {
        // Ambient: extremely dark, faint midnight blue
        this.ambientLight = new THREE.AmbientLight(0x0a0c14, 0.32);
        this.scene.add(this.ambientLight);

        // Subtle moonlight rim to define the firewood silhouette in darkness
        this.woodRimLight = new THREE.DirectionalLight(0x3e4f73, 0.35);
        this.woodRimLight.position.set(4, 8, -4);
        this.scene.add(this.woodRimLight);

        // Primary dynamic fire point light (golden fiery orange)
        this.fireLight1 = new THREE.PointLight(0xff5a1f, 0.0, 22, 1.8);
        this.fireLight1.position.set(0, 0.8, 0);
        this.fireLight1.castShadow = true;
        this.fireLight1.shadow.bias = -0.002;
        this.scene.add(this.fireLight1);

        // Secondary fire light (warm amber highlight)
        this.fireLight2 = new THREE.PointLight(0xffaa22, 0.0, 16, 2.0);
        this.fireLight2.position.set(0, 1.6, 0.4);
        this.scene.add(this.fireLight2);
    }

    /* -------------------------------------------------------------
     * Ground & Hearth (Ash bed & charred stones)
     * ------------------------------------------------------------- */
    _createGroundAndHearth() {
        const groundGeo = new THREE.PlaneGeometry(32, 32, 32, 32);
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            pos.setZ(i, (Math.sin(vx * 0.4) * Math.cos(vy * 0.4) + Math.random() * 0.08) * 0.22);
        }
        groundGeo.computeVertexNormals();

        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x07080c,
            roughness: 0.95,
            metalness: 0.05
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.05;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Charred Hearth Stones ring
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x141315,
            roughness: 0.92,
            metalness: 0.1
        });
        const numStones = 18;
        for (let i = 0; i < numStones; i++) {
            const angle = (i / numStones) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
            const radius = 1.38 + Math.random() * 0.28;
            const sx = 0.22 + Math.random() * 0.12;
            const sy = 0.12 + Math.random() * 0.08;
            const sz = 0.18 + Math.random() * 0.1;
            const stoneGeo = new THREE.DodecahedronGeometry(sx, 1);
            const stone = new THREE.Mesh(stoneGeo, stoneMat);
            stone.scale.set(1, sy / sx, sz / sx);
            stone.position.set(Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius);
            stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            stone.castShadow = true;
            stone.receiveShadow = true;
            this.scene.add(stone);
        }

        // Glowing Coal Bed beneath the logs
        const coalGeo = new THREE.CylinderGeometry(0.9, 1.15, 0.14, 18);
        this.coalMat = new THREE.MeshStandardMaterial({
            color: 0x110c08,
            emissive: 0xff2a00,
            emissiveIntensity: 0.0,
            roughness: 0.95
        });
        this.coalBed = new THREE.Mesh(coalGeo, this.coalMat);
        this.coalBed.position.set(0, 0.02, 0);
        this.coalBed.receiveShadow = true;
        this.scene.add(this.coalBed);
    }

    /* -------------------------------------------------------------
     * Firewood Logs (Criss-Cross / Leaning Bonfire Cluster)
     * ------------------------------------------------------------- */
    _createFirewoodLogs() {
        this.woodGroup = new THREE.Group();

        const logConfigs = [
            // Base layer logs
            { len: 1.85, r: 0.12, pos: [0, 0.12, -0.42], rot: [0, 0.15, 1.57] },
            { len: 1.75, r: 0.11, pos: [0, 0.12, 0.42], rot: [0, -0.2, 1.57] },
            { len: 1.85, r: 0.13, pos: [-0.42, 0.22, 0], rot: [1.57, 0, 0.1] },
            { len: 1.8, r: 0.12, pos: [0.42, 0.22, 0], rot: [1.57, 0, -0.15] },

            // Leaning teepee logs
            { len: 1.95, r: 0.10, pos: [-0.35, 0.58, -0.35], rot: [0.65, 0.4, -0.7] },
            { len: 1.9, r: 0.10, pos: [0.4, 0.55, -0.3], rot: [0.6, -0.4, 0.65] },
            { len: 1.95, r: 0.11, pos: [-0.3, 0.58, 0.4], rot: [-0.65, 0.3, -0.6] },
            { len: 1.85, r: 0.09, pos: [0.35, 0.56, 0.35], rot: [-0.6, -0.4, 0.65] },

            // Top cross log
            { len: 1.45, r: 0.08, pos: [0.05, 0.84, -0.05], rot: [0.3, 1.2, 0.4] }
        ];

        logConfigs.forEach(cfg => {
            const geo = new THREE.CylinderGeometry(cfg.r * 0.82, cfg.r, cfg.len, 12);
            // Each log gets its own material so we can heat-glow the center logs dynamically
            const mat = new THREE.MeshStandardMaterial({
                map: this.textures.bark,
                color: 0x1f1712,
                emissive: 0xff3b00,
                emissiveIntensity: 0.0,
                roughness: 0.88,
                metalness: 0.02,
                bumpMap: this.textures.bark,
                bumpScale: 0.035
            });
            this.logMaterials.push(mat);

            const logMesh = new THREE.Mesh(geo, mat);
            logMesh.position.set(...cfg.pos);
            logMesh.rotation.set(...cfg.rot);
            logMesh.castShadow = true;
            logMesh.receiveShadow = true;
            this.logs.push(logMesh);
            this.woodGroup.add(logMesh);
        });

        this.scene.add(this.woodGroup);
    }

    /* -------------------------------------------------------------
     * Stage 1: Ambient Drifting Embers (Subtle, mysterious)
     * ------------------------------------------------------------- */
    _createAmbientEmbers() {
        const count = 65;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const scales = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 5.0;
            positions[i * 3 + 1] = Math.random() * 3.8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 5.0;

            velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.008;
            velocities[i * 3 + 1] = 0.005 + Math.random() * 0.014;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.008;

            scales[i] = 0.6 + Math.random() * 0.8;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        const mat = new THREE.PointsMaterial({
            size: 0.13,
            map: this.textures.spark,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0xffaa44,
            opacity: 0.6
        });

        this.ambientEmbers = new THREE.Points(geo, mat);
        this.scene.add(this.ambientEmbers);
    }

    /* -------------------------------------------------------------
     * Smoke Simulation System
     * ------------------------------------------------------------- */
    _createSmokeSystem() {
        const count = 90;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const life = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 0.6;
            positions[i * 3 + 1] = 0.2 + Math.random() * 4.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;

            velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.02;
            velocities[i * 3 + 1] = 0.025 + Math.random() * 0.04;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

            life[i] = Math.random();
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geo.setAttribute('life', new THREE.BufferAttribute(life, 1));

        const mat = new THREE.PointsMaterial({
            size: 1.5,
            map: this.textures.smoke,
            transparent: true,
            depthWrite: false,
            color: 0x908b86,
            opacity: 0.16
        });

        this.smokeParticles = new THREE.Points(geo, mat);
        this.scene.add(this.smokeParticles);
    }

    /* -------------------------------------------------------------
     * Stage 2: Spark Ignition Particle System
     * ------------------------------------------------------------- */
    _createSparkSystem() {
        const count = 140;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const life = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = 0;
            positions[i * 3 + 1] = 0.45;
            positions[i * 3 + 2] = 0;

            velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.14;
            velocities[i * 3 + 1] = 0.09 + Math.random() * 0.22;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.14;

            life[i] = 0;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geo.setAttribute('life', new THREE.BufferAttribute(life, 1));

        const mat = new THREE.PointsMaterial({
            size: 0.24,
            map: this.textures.spark,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0xfff2bb,
            opacity: 0.0
        });

        this.sparkParticles = new THREE.Points(geo, mat);
        this.scene.add(this.sparkParticles);
    }

    /* -------------------------------------------------------------
     * Stage 3 & 4: Realistic Dense Flame Particles
     * ------------------------------------------------------------- */
    _createFlameSystem() {
        const count = 620;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        const life = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 0.75;
            positions[i * 3 + 1] = 0.3 + Math.random() * 1.9;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.75;

            velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.035;
            velocities[i * 3 + 1] = 0.045 + Math.random() * 0.08;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.035;

            scales[i] = 0.85 + Math.random() * 1.3;
            life[i] = Math.random();
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
        geo.setAttribute('life', new THREE.BufferAttribute(life, 1));

        const mat = new THREE.PointsMaterial({
            size: 1.15,
            map: this.textures.flame,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0xff6611,
            opacity: 0.0
        });

        this.flameParticles = new THREE.Points(geo, mat);
        this.scene.add(this.flameParticles);
    }

    /* -------------------------------------------------------------
     * Stage 4: Explosion Sparks & Upward Blast
     * ------------------------------------------------------------- */
    _createExplosionSparks() {
        const count = 650;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const life = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = 0;
            positions[i * 3 + 1] = 0.5;
            positions[i * 3 + 2] = 0;

            const theta = Math.random() * Math.PI * 2;
            const speed = 0.12 + Math.random() * 0.42;
            velocities[i * 3 + 0] = Math.cos(theta) * speed;
            velocities[i * 3 + 1] = 0.18 + Math.random() * 0.55;
            velocities[i * 3 + 2] = Math.sin(theta) * speed;

            life[i] = 0;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geo.setAttribute('life', new THREE.BufferAttribute(life, 1));

        const mat = new THREE.PointsMaterial({
            size: 0.3,
            map: this.textures.spark,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0xffe277,
            opacity: 0.0
        });

        this.explosionSparks = new THREE.Points(geo, mat);
        this.scene.add(this.explosionSparks);
    }

    /* -------------------------------------------------------------
     * Stage 5: Glyph Sampling for "IGNITE" Letters
     * ------------------------------------------------------------- */
    _generateLetterTargets() {
        const canvas = document.createElement('canvas');
        canvas.width = 1100;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '900 145px "Outfit", "Syne", "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('IGNITE', canvas.width / 2, canvas.height / 2);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const validPoints = [];

        // Aspect ratio compensation for mobile
        const aspect = (this.container?.clientWidth || window.innerWidth) / (this.container?.clientHeight || window.innerHeight);
        const widthScale = aspect < 1.0 ? 3.8 : 5.8;
        const heightScale = aspect < 1.0 ? 1.2 : 1.7;

        const step = 4;
        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                const idx = (y * canvas.width + x) * 4;
                if (imgData[idx] > 170) {
                    const wx = ((x / canvas.width) - 0.5) * widthScale;
                    const wy = 2.4 - ((y / canvas.height) - 0.5) * heightScale;
                    const wz = (Math.random() - 0.5) * 0.22;
                    validPoints.push(new THREE.Vector3(wx, wy, wz));
                }
            }
        }

        // Shuffle
        for (let i = validPoints.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validPoints[i], validPoints[j]] = [validPoints[j], validPoints[i]];
        }

        this.letterTargets = validPoints.slice(0, this.letterTargetCount);
        while (this.letterTargets.length < this.letterTargetCount) {
            this.letterTargets.push(validPoints[Math.floor(Math.random() * validPoints.length)]);
        }
    }

    _updateLetterTargetPositions() {
        if (!this.letterParticles) return;
        const target = this.letterParticles.geometry.attributes.targetPos;
        for (let i = 0; i < this.letterTargetCount; i++) {
            const t = this.letterTargets[i];
            if (t) {
                target.setXYZ(i, t.x, t.y, t.z);
            }
        }
        target.needsUpdate = true;
    }

    _createLetterParticles() {
        const count = this.letterTargetCount;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const originalPositions = new Float32Array(count * 3);
        const targetPositions = new Float32Array(count * 3);
        const noiseOffsets = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const colorPalette = [
            new THREE.Color(0xffffff), // hot white center
            new THREE.Color(0xffd575), // golden amber
            new THREE.Color(0xff6018), // fiery orange
            new THREE.Color(0xdd2800)  // deep crimson
        ];

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 0.9;
            positions[i * 3 + 1] = 0.5 + Math.random() * 0.9;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.9;

            originalPositions[i * 3 + 0] = positions[i * 3 + 0];
            originalPositions[i * 3 + 1] = positions[i * 3 + 1];
            originalPositions[i * 3 + 2] = positions[i * 3 + 2];

            const target = this.letterTargets[i] || new THREE.Vector3(0, 2.3, 0);
            targetPositions[i * 3 + 0] = target.x;
            targetPositions[i * 3 + 1] = target.y;
            targetPositions[i * 3 + 2] = target.z;

            noiseOffsets[i * 3 + 0] = Math.random() * 10;
            noiseOffsets[i * 3 + 1] = Math.random() * 10;
            noiseOffsets[i * 3 + 2] = Math.random() * 10;

            const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3 + 0] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('origPos', new THREE.BufferAttribute(originalPositions, 3));
        geo.setAttribute('targetPos', new THREE.BufferAttribute(targetPositions, 3));
        geo.setAttribute('noiseOffset', new THREE.BufferAttribute(noiseOffsets, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.17,
            map: this.textures.flame,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
            opacity: 0.0
        });

        this.letterParticles = new THREE.Points(geo, mat);
        this.scene.add(this.letterParticles);
    }

    /* Sparks flying around the fiery letters during Stage 5 */
    _createLetterSparks() {
        const count = 180;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const life = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 5.0;
            positions[i * 3 + 1] = 2.0 + Math.random() * 1.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

            velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.04;
            velocities[i * 3 + 1] = 0.03 + Math.random() * 0.06;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.04;

            life[i] = Math.random();
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geo.setAttribute('life', new THREE.BufferAttribute(life, 1));

        const mat = new THREE.PointsMaterial({
            size: 0.18,
            map: this.textures.spark,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0xffd277,
            opacity: 0.0
        });

        this.letterSparks = new THREE.Points(geo, mat);
        this.scene.add(this.letterSparks);
    }

    /* -------------------------------------------------------------
     * Stage 6: Radial Shockwave Ring
     * ------------------------------------------------------------- */
    _createShockwaveRing() {
        const count = 220;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const angles = new Float32Array(count);
        const speeds = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = 0;
            positions[i * 3 + 1] = 2.4;
            positions[i * 3 + 2] = 0;

            angles[i] = (i / count) * Math.PI * 2;
            speeds[i] = 3.2 + Math.random() * 1.8;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
        geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

        const mat = new THREE.PointsMaterial({
            size: 0.22,
            map: this.textures.spark,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0xffd988,
            opacity: 0.0
        });

        this.shockwaveRing = new THREE.Points(geo, mat);
        this.scene.add(this.shockwaveRing);
    }

    /* -------------------------------------------------------------
     * State Machine & Sequence Triggers
     * ------------------------------------------------------------- */
    triggerSpark() {
        this.stage = 1;
        this.stageTime = 0;

        const pos = this.sparkParticles.geometry.attributes.position;
        const life = this.sparkParticles.geometry.attributes.life;
        const count = pos.count;
        for (let i = 0; i < count; i++) {
            pos.setXYZ(i, (Math.random() - 0.5) * 0.1, 0.45 + (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.1);
            life.setX(i, 0.4 + Math.random() * 0.6);
        }
        pos.needsUpdate = true;
        life.needsUpdate = true;
        this.sparkParticles.material.opacity = 1.0;

        this.fireLight1.intensity = 1.4;
        this.fireLight1.distance = 4.5;
        this.fireLight1.color.setHex(0xffeedd);

        this.addCameraShake(0.09);
    }

    triggerFirewoodCatches() {
        this.stage = 2;
        this.stageTime = 0;
        this.targetFireIntensity = 0.6;
        this.woodGlowIntensity = 0.8;

        this.smokeParticles.material.opacity = 0.38;
        this.flameParticles.material.opacity = 0.72;
        this.coalMat.emissiveIntensity = 0.85;

        // Spread fire glow onto individual firewood logs
        this.logMaterials.forEach((mat, idx) => {
            mat.emissiveIntensity = 0.25 + (idx % 3) * 0.2;
        });
    }

    triggerBonfireExplosion() {
        this.stage = 3;
        this.stageTime = 0;
        this.targetFireIntensity = 2.6;
        this.woodGlowIntensity = 2.4;

        this.addCameraShake(0.72);

        const pos = this.explosionSparks.geometry.attributes.position;
        const vel = this.explosionSparks.geometry.attributes.velocity;
        const life = this.explosionSparks.geometry.attributes.life;
        const count = pos.count;

        for (let i = 0; i < count; i++) {
            pos.setXYZ(i, (Math.random() - 0.5) * 0.35, 0.5, (Math.random() - 0.5) * 0.35);
            const theta = Math.random() * Math.PI * 2;
            const speed = 0.14 + Math.random() * 0.45;
            vel.setXYZ(i, Math.cos(theta) * speed, 0.28 + Math.random() * 0.6, Math.sin(theta) * speed);
            life.setX(i, 1.0);
        }
        pos.needsUpdate = true;
        vel.needsUpdate = true;
        life.needsUpdate = true;
        this.explosionSparks.material.opacity = 1.0;

        this.fireLight1.color.setHex(0xff5511);
        this.fireLight1.distance = 28.0;
        this.fireLight2.color.setHex(0xffaa22);
        this.fireLight2.distance = 22.0;
        this.coalMat.emissiveIntensity = 2.5;

        this.logMaterials.forEach(mat => {
            mat.emissiveIntensity = 1.4;
        });
    }

    triggerFlamesFormText() {
        this.stage = 4;
        this.stageTime = 0;
        this.letterParticles.material.opacity = 0.98;
        if (this.letterSparks) {
            this.letterSparks.material.opacity = 0.85;
        }

        const aspect = (this.container?.clientWidth || window.innerWidth) / (this.container?.clientHeight || window.innerHeight);
        const targetZ = aspect < 1.0 ? 7.6 : 5.8;
        this.targetCamPos.set(0, 2.2, targetZ);
        this.camLookAt.set(0, 1.8, 0);
    }

    triggerTitleLock() {
        this.stage = 5;
        this.stageTime = 0;

        this.addCameraShake(0.5);

        this.shockwaveProgress = 0.0;
        this.shockwaveRing.material.opacity = 1.0;

        this.targetFireIntensity = 1.35;
        this.woodGlowIntensity = 1.1;
    }

    transitionToWebsite() {
        this.stage = 6;
        this.stageTime = 0;

        const aspect = (this.container?.clientWidth || window.innerWidth) / (this.container?.clientHeight || window.innerHeight);
        const targetZ = aspect < 1.0 ? 8.8 : 7.8;
        this.targetCamPos.set(0, 2.6, targetZ);
        this.camLookAt.set(0, 1.2, 0);
        this.targetFireIntensity = 1.15;

        if (this.letterParticles) {
            this.letterParticles.material.opacity = 0.3;
        }
        if (this.letterSparks) {
            this.letterSparks.material.opacity = 0.4;
        }
    }

    addCameraShake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    /* -------------------------------------------------------------
     * Main Animation & Render Loop
     * ------------------------------------------------------------- */
    animate() {
        requestAnimationFrame(this.animate);

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        this.stageTime += delta;

        // Smooth fire intensity & log glow interpolation
        this.fireIntensity += (this.targetFireIntensity - this.fireIntensity) * 0.08;

        // Dynamic light flicker
        const flicker = 1.0 + (Math.sin(time * 18.0) * 0.16 + Math.cos(time * 33.0) * 0.12) * Math.min(this.fireIntensity, 1.5);
        this.fireLight1.intensity = this.fireIntensity * 4.6 * flicker;
        this.fireLight2.intensity = this.fireIntensity * 3.2 * (1.0 + Math.sin(time * 24.0) * 0.1);

        // Update 1: Ambient Embers
        if (this.ambientEmbers) {
            const pos = this.ambientEmbers.geometry.attributes.position;
            const vel = this.ambientEmbers.geometry.attributes.velocity;
            for (let i = 0; i < pos.count; i++) {
                pos.setX(i, pos.getX(i) + vel.getX(i) + Math.sin(time + i) * 0.002);
                pos.setY(i, pos.getY(i) + vel.getY(i) * (1.0 + this.fireIntensity * 0.5));
                pos.setZ(i, pos.getZ(i) + vel.getZ(i) + Math.cos(time + i) * 0.002);

                if (pos.getY(i) > 4.8) {
                    pos.setY(i, 0.2);
                    pos.setX(i, (Math.random() - 0.5) * 5.0);
                    pos.setZ(i, (Math.random() - 0.5) * 5.0);
                }
            }
            pos.needsUpdate = true;
        }

        // Update 2: Smoke
        if (this.smokeParticles && this.stage >= 1) {
            const pos = this.smokeParticles.geometry.attributes.position;
            const vel = this.smokeParticles.geometry.attributes.velocity;
            const speedMult = 1.0 + this.fireIntensity * 0.85;
            for (let i = 0; i < pos.count; i++) {
                pos.setY(i, pos.getY(i) + vel.getY(i) * speedMult);
                pos.setX(i, pos.getX(i) + Math.sin(time * 1.5 + i * 0.2) * 0.006);
                if (pos.getY(i) > 5.8) {
                    pos.setY(i, 0.4);
                    pos.setX(i, (Math.random() - 0.5) * 0.7);
                    pos.setZ(i, (Math.random() - 0.5) * 0.7);
                }
            }
            pos.needsUpdate = true;
        }

        // Update 3: Sparks (Stage 1 & 2)
        if (this.sparkParticles && this.sparkParticles.material.opacity > 0.01) {
            const pos = this.sparkParticles.geometry.attributes.position;
            const vel = this.sparkParticles.geometry.attributes.velocity;
            const life = this.sparkParticles.geometry.attributes.life;
            for (let i = 0; i < pos.count; i++) {
                const l = life.getX(i) - delta * 0.7;
                life.setX(i, l);
                if (l > 0) {
                    pos.setX(i, pos.getX(i) + vel.getX(i));
                    pos.setY(i, pos.getY(i) + vel.getY(i));
                    pos.setZ(i, pos.getZ(i) + vel.getZ(i));
                    vel.setY(i, vel.getY(i) - 0.004);
                }
            }
            pos.needsUpdate = true;
            life.needsUpdate = true;
        }

        // Update 4: Flame Particles (Stage 2 onwards)
        if (this.flameParticles && this.stage >= 2) {
            const pos = this.flameParticles.geometry.attributes.position;
            const vel = this.flameParticles.geometry.attributes.velocity;
            const scales = this.flameParticles.geometry.attributes.scale;
            const life = this.flameParticles.geometry.attributes.life;

            for (let i = 0; i < pos.count; i++) {
                let l = life.getX(i) + delta * (1.8 + this.fireIntensity * 0.8);
                if (l >= 1.0) {
                    l = 0.0;
                    pos.setX(i, (Math.random() - 0.5) * 0.85);
                    pos.setY(i, 0.35 + Math.random() * 0.35);
                    pos.setZ(i, (Math.random() - 0.5) * 0.85);
                }
                life.setX(i, l);

                const curl = Math.sin(time * 5.0 + pos.getY(i) * 3.0) * 0.022;
                pos.setX(i, pos.getX(i) + curl);
                pos.setY(i, pos.getY(i) + vel.getY(i) * (1.0 + this.fireIntensity * 0.8));
                pos.setZ(i, pos.getZ(i) + Math.cos(time * 5.0 + pos.getY(i) * 3.0) * 0.022);

                scales.setX(i, (1.0 - l) * (0.95 + this.fireIntensity * 0.65));
            }
            pos.needsUpdate = true;
            scales.needsUpdate = true;
            life.needsUpdate = true;
        }

        // Update 5: Explosion Sparks
        if (this.explosionSparks && this.explosionSparks.material.opacity > 0.01) {
            const pos = this.explosionSparks.geometry.attributes.position;
            const vel = this.explosionSparks.geometry.attributes.velocity;
            const life = this.explosionSparks.geometry.attributes.life;
            for (let i = 0; i < pos.count; i++) {
                const l = life.getX(i) - delta * 0.5;
                life.setX(i, l);
                if (l > 0) {
                    pos.setX(i, pos.getX(i) + vel.getX(i));
                    pos.setY(i, pos.getY(i) + vel.getY(i));
                    pos.setZ(i, pos.getZ(i) + vel.getZ(i));
                    vel.setX(i, vel.getX(i) * 0.98);
                    vel.setY(i, vel.getY(i) - 0.008);
                    vel.setZ(i, vel.getZ(i) * 0.98);
                }
            }
            pos.needsUpdate = true;
            life.needsUpdate = true;
        }

        // Update 6: Letter Particles "IGNITE"
        if (this.letterParticles && this.stage >= 4) {
            const pos = this.letterParticles.geometry.attributes.position;
            const orig = this.letterParticles.geometry.attributes.origPos;
            const target = this.letterParticles.geometry.attributes.targetPos;
            const noise = this.letterParticles.geometry.attributes.noiseOffset;

            const progress = Math.min(this.stageTime * 0.55, 1.0);
            const ease = 1 - Math.pow(1 - progress, 3);

            for (let i = 0; i < pos.count; i++) {
                const tx = target.getX(i);
                const ty = target.getY(i);
                const tz = target.getZ(i);

                const turbX = Math.sin(time * 6.0 + noise.getX(i)) * (0.04 + (1 - ease) * 0.15);
                const turbY = Math.cos(time * 8.0 + noise.getY(i)) * (0.05 + (1 - ease) * 0.2);
                const turbZ = Math.sin(time * 4.0 + noise.getZ(i)) * 0.03;

                const cx = THREE.MathUtils.lerp(orig.getX(i), tx, ease) + turbX;
                const cy = THREE.MathUtils.lerp(orig.getY(i), ty, ease) + turbY;
                const cz = THREE.MathUtils.lerp(orig.getZ(i), tz, ease) + turbZ;

                pos.setXYZ(i, cx, cy, cz);
            }
            pos.needsUpdate = true;
        }

        // Update Letter Sparks (Stage 4 & 5)
        if (this.letterSparks && this.stage >= 4 && this.letterSparks.material.opacity > 0.01) {
            const pos = this.letterSparks.geometry.attributes.position;
            const vel = this.letterSparks.geometry.attributes.velocity;
            const life = this.letterSparks.geometry.attributes.life;
            for (let i = 0; i < pos.count; i++) {
                let l = life.getX(i) - delta * 0.6;
                if (l <= 0) {
                    l = 1.0;
                    // Reset to near a letter
                    pos.setXYZ(i, (Math.random() - 0.5) * 5.0, 2.0 + Math.random() * 0.8, (Math.random() - 0.5) * 0.4);
                }
                life.setX(i, l);

                pos.setX(i, pos.getX(i) + vel.getX(i) + Math.sin(time * 4.0 + i) * 0.005);
                pos.setY(i, pos.getY(i) + vel.getY(i));
                pos.setZ(i, pos.getZ(i) + vel.getZ(i));
            }
            pos.needsUpdate = true;
            life.needsUpdate = true;
        }

        // Update 7: Radial Shockwave Ring on Title Lock
        if (this.shockwaveRing && this.shockwaveRing.material.opacity > 0.01) {
            this.shockwaveProgress = (this.shockwaveProgress || 0) + delta * 3.2;
            const pos = this.shockwaveRing.geometry.attributes.position;
            const angle = this.shockwaveRing.geometry.attributes.angle;
            const speed = this.shockwaveRing.geometry.attributes.speed;

            for (let i = 0; i < pos.count; i++) {
                const r = this.shockwaveProgress * speed.getX(i);
                const a = angle.getX(i);
                pos.setX(i, Math.cos(a) * r);
                pos.setY(i, 2.4 + Math.sin(a * 3.0) * 0.1);
                pos.setZ(i, Math.sin(a) * r);
            }
            pos.needsUpdate = true;
            this.shockwaveRing.material.opacity = Math.max(0, 1.0 - this.shockwaveProgress * 0.35);
        }

        // Camera Smooth Position & Perlin Shake
        this.camera.position.lerp(this.targetCamPos, 0.04);
        this.camera.lookAt(this.camLookAt);

        if (this.shakeIntensity > 0.001) {
            this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= this.shakeDecay;
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        const aspect = width / height;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        // Adjust target camera distance for current stage & aspect
        if (this.stage === 0 || this.stage === 1) {
            this.targetCamPos.z = aspect < 1.0 ? 7.8 : 6.2;
        } else if (this.stage === 4 || this.stage === 5) {
            this.targetCamPos.z = aspect < 1.0 ? 7.6 : 5.8;
        } else if (this.stage === 6) {
            this.targetCamPos.z = aspect < 1.0 ? 8.8 : 7.8;
        }

        // Re-calculate letter width scale
        this._generateLetterTargets();
        this._updateLetterTargetPositions();
    }
}

window.igniteEngine = new IgniteFireEngine();
