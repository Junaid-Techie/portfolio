document.addEventListener('DOMContentLoaded', () => {
    // Navigation Scroll Effect
    const navbar = document.querySelector('.navbar');

    function checkScroll() {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Run checkScroll immediately to handle page reloads on later parts of the page
    checkScroll();

    // Run on full page load to catch any asynchronous browser scroll restoration
    window.addEventListener('load', checkScroll);

    // Bind scroll listener with passive flag for performance
    window.addEventListener('scroll', checkScroll, { passive: true });

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const hamburgerIcon = document.querySelector('.hamburger i');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if (navLinks.classList.contains('active')) {
                hamburgerIcon.classList.remove('fa-bars');
                hamburgerIcon.classList.add('fa-times');
            } else {
                hamburgerIcon.classList.remove('fa-times');
                hamburgerIcon.classList.add('fa-bars');
            }
        });

        // Close mobile menu when a link is clicked
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburgerIcon.classList.remove('fa-times');
                hamburgerIcon.classList.add('fa-bars');
            });
        });
    }

    // Scroll Reveal Animation (Intersection Observer)
    const fadeElements = document.querySelectorAll('.fade-up');

    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    fadeElements.forEach(element => {
        revealOnScroll.observe(element);
    });

    // Handle initial visible elements on load
    setTimeout(() => {
        fadeElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top <= window.innerHeight) {
                element.classList.add('visible');
                revealOnScroll.unobserve(element);
            }
        });
    }, 100);

    // =============================================================
    // UNDERWATER PS5-WAVE AMBIENT BACKGROUND
    // Particles rain from the top, collect onto undulating sine-wave
    // bands (PS5-style), with underwater caustic light and sparkles.
    // =============================================================
    const ambientCanvas = document.createElement('canvas');
    ambientCanvas.id = 'ambient-spore-canvas';
    ambientCanvas.style.position = 'fixed';
    ambientCanvas.style.top = '0';
    ambientCanvas.style.left = '0';
    ambientCanvas.style.width = '100vw';
    ambientCanvas.style.height = '100vh';
    ambientCanvas.style.pointerEvents = 'none';
    ambientCanvas.style.zIndex = '-1';
    ambientCanvas.style.transform = 'translate3d(0, 0, 0)'; // GPU layer — scroll-stable
    ambientCanvas.style.willChange = 'transform';
    document.body.appendChild(ambientCanvas);

    // HiDPI / Retina support — render at device pixel ratio for sharp edges
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const actx = ambientCanvas.getContext('2d');
    let ambientParticles = [];
    const maxAmbientParticles = 460;
    let wavePhase = 0;

    // Stable viewport reference — only updated on true orientation/resize, not mobile scroll
    let referenceWidth  = window.innerWidth;
    let referenceHeight = window.innerHeight;

    // ── Pre-render sparkle (4-point star) templates ──────────────
    const sparkleTemplates = {};
    function createSparkleTemplates() {
        [
            { key: 'sm', r: 2.5, streak: 9  },
            { key: 'md', r: 4.0, streak: 15 },
        ].forEach(({ key, r, streak }) => {
            const size  = (streak + r + 4) * 2;
            const half  = size / 2;
            const off   = document.createElement('canvas');
            off.width   = size;
            off.height  = size;
            const oc    = off.getContext('2d');

            // Soft radial glow core
            const glow = oc.createRadialGradient(half, half, 0, half, half, r * 3);
            glow.addColorStop(0,   'rgba(210, 245, 255, 0.95)');
            glow.addColorStop(0.4, 'rgba(100, 210, 255, 0.55)');
            glow.addColorStop(1,   'rgba(0,0,0,0)');
            oc.fillStyle = glow;
            oc.beginPath();
            oc.arc(half, half, r * 3, 0, Math.PI * 2);
            oc.fill();

            // 4-point cross streaks
            oc.strokeStyle = 'rgba(180, 235, 255, 0.70)';
            oc.lineWidth   = 1.2;
            oc.lineCap     = 'round';
            oc.beginPath();
            oc.moveTo(half - streak, half); oc.lineTo(half + streak, half);
            oc.moveTo(half, half - streak); oc.lineTo(half, half + streak);
            oc.stroke();

            // Diagonal softer streaks (×-shape)
            const d = streak * 0.55;
            oc.strokeStyle = 'rgba(150, 220, 255, 0.35)';
            oc.lineWidth   = 0.8;
            oc.beginPath();
            oc.moveTo(half - d, half - d); oc.lineTo(half + d, half + d);
            oc.moveTo(half + d, half - d); oc.lineTo(half - d, half + d);
            oc.stroke();

            sparkleTemplates[key] = { canvas: off, half };
        });
    }
    createSparkleTemplates();

    // ── Wave definitions — two overlapping PS5-style sine bands ──
    // Particles collect onto these bands after falling from the top.
    const WAVES = [
        { yRatio: 0.54, amp: 58, freq: 0.00130, speed:  1.00, phase: 0.00         },
        { yRatio: 0.62, amp: 42, freq: 0.00190, speed: -0.70, phase: Math.PI * 0.7 },
    ];

    function getWaveY(wIdx, x, t) {
        const w = WAVES[wIdx];
        const base = referenceHeight * w.yRatio;
        return base
            + Math.sin(x * w.freq + t * w.speed + w.phase) * w.amp
            + Math.cos(x * w.freq * 1.65 - t * w.speed * 0.45 + w.phase) * (w.amp * 0.28);
    }

    // ── AmbientParticle class ─────────────────────────────────────
    class AmbientParticle {
        constructor(isInit = false) {
            this.waveIdx = Math.floor(Math.random() * WAVES.length);
            this.x = Math.random() * referenceWidth;

            if (isInit) {
                // Pre-populate: mix of wave-riders and mid-fall particles
                if (Math.random() < 0.65) {
                    this.state = 'wave';
                    this.y = getWaveY(this.waveIdx, this.x, wavePhase)
                           + (Math.random() - 0.5) * 38;
                    this.opacity = Math.random() * 0.55 + 0.05;
                } else {
                    this.state = 'falling';
                    this.y = Math.random() * referenceHeight * 0.55;
                    this.opacity = 0;
                }
            } else {
                // Respawn from the top edge
                this.y = -8 - Math.random() * 50;
                this.state = 'falling';
                this.opacity = 0;
            }

            // Particle type
            const roll = Math.random();
            if (roll < 0.07) {
                // Sparkle — twinkling star
                this.type        = 'sparkle';
                this.size        = 1.8 + Math.random() * 2.0;
                this.sparklePeriod = 90  + Math.random() * 140;
                this.sparkTimer  = Math.random() * this.sparklePeriod;
                this.sparkBright = 0;
            } else if (roll < 0.55) {
                // Wave-rider glow dot
                this.type = 'wave';
                this.size = 1.0 + Math.random() * 2.2;
            } else {
                // Falling rain particle
                this.type = 'rain';
                this.size = 0.5 + Math.random() * 1.4;
            }

            // Fall speed (downward)
            this.fallSpeed = 0.35 + Math.random() * 0.85;

            // Slow horizontal drift along the wave after landing
            this.driftX = (0.08 + Math.random() * 0.22) * (Math.random() < 0.5 ? 1 : -1);

            // Vertical spread offset around the wave centre
            this.offsetY = (Math.random() - 0.5) * 32;

            // Opacity
            let maxOp = this.type === 'sparkle' ? (0.08 + Math.random() * 0.20)
                      : this.type === 'wave'    ? (0.18 + Math.random() * 0.55)
                                                : (0.12 + Math.random() * 0.40);
            this.maxOpacity   = maxOp;
            this.renderOpacity = this.opacity;

            // Breathing pulse
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.008 + Math.random() * 0.016;
        }

        update() {
            const targetY = getWaveY(this.waveIdx, this.x, wavePhase) + this.offsetY;

            if (this.state === 'falling') {
                this.y += this.fallSpeed;
                this.opacity = Math.min(this.maxOpacity * 0.75, this.opacity + 0.004);
                if (this.y >= targetY - 4) this.state = 'wave';
            } else {
                // Smoothly ride the wave
                this.y += (targetY - this.y) * 0.06;
                this.x += this.driftX;
                this.opacity = Math.min(this.maxOpacity, this.opacity + 0.006);
            }

            // Sparkle flicker
            if (this.type === 'sparkle') {
                this.sparkTimer = (this.sparkTimer + 1) % this.sparklePeriod;
                this.sparkBright = Math.max(0, Math.sin((this.sparkTimer / this.sparklePeriod) * Math.PI));
            }

            // Breathing pulse
            this.pulsePhase += this.pulseSpeed;
            const pulse = Math.sin(this.pulsePhase)
                        * (this.type === 'sparkle' ? 0.06 : 0.10);
            this.renderOpacity = Math.max(0, this.opacity + pulse);

            // Recycle when particle exits viewport
            if (this.x > referenceWidth + 40 || this.x < -40 || this.y > referenceHeight + 40) {
                const idx = ambientParticles.indexOf(this);
                if (idx > -1) ambientParticles[idx] = new AmbientParticle(false);
            }
        }

        draw() {
            // Edge fading — left, right, top
            let ef = 1.0;
            const fd = 90;
            if (this.x < fd)                    ef *= Math.max(0, this.x / fd);
            if (this.x > referenceWidth - fd)   ef *= Math.max(0, (referenceWidth - this.x) / fd);
            if (this.y < fd)                    ef *= Math.max(0, this.y / fd);

            const alpha = this.renderOpacity * ef;
            if (alpha <= 0.005) return;

            if (this.type === 'sparkle') {
                const bright = this.sparkBright;
                if (bright > 0.08) {
                    const tpl = sparkleTemplates[this.size > 2.8 ? 'md' : 'sm'];
                    if (tpl) {
                        actx.save();
                        actx.globalAlpha = bright * ef * 0.92;
                        actx.drawImage(tpl.canvas, this.x - tpl.half, this.y - tpl.half);
                        actx.restore();
                    }
                } else {
                    // Dim: tiny dot between flashes
                    actx.fillStyle = `rgba(160, 230, 255, ${alpha * 0.35})`;
                    actx.beginPath();
                    actx.arc(this.x, this.y, this.size * 0.55, 0, Math.PI * 2);
                    actx.fill();
                }
            } else if (this.type === 'wave') {
                // Glowing wave-rider: teal core + soft halo
                const r = this.size * 2.8;
                const g = actx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
                g.addColorStop(0,    `rgba(190, 240, 255, ${alpha})`);
                g.addColorStop(0.30, `rgba(80,  195, 240, ${alpha * 0.70})`);
                g.addColorStop(0.70, `rgba(40,  140, 200, ${alpha * 0.25})`);
                g.addColorStop(1,    'rgba(0,0,0,0)');
                actx.fillStyle = g;
                actx.beginPath();
                actx.arc(this.x, this.y, r, 0, Math.PI * 2);
                actx.fill();
            } else {
                // Falling rain: crisp small cyan dot
                actx.fillStyle = `rgba(130, 210, 255, ${alpha * 0.80})`;
                actx.beginPath();
                actx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                actx.fill();
            }
        }
    }

    // ── Underwater caustic light shafts from the top ──────────────
    // Simulates sunlight refracting through ocean surface ripples.
    function drawUnderwaterLight(ctx, width, height, t) {
        ctx.save();

        // Surface shimmer band at the very top
        ctx.filter = 'blur(55px)';
        const surfShimmer = 0.08 + Math.sin(t * 0.55) * 0.015;
        const surf = ctx.createLinearGradient(0, 0, 0, height * 0.28);
        surf.addColorStop(0,   `rgba(50, 140, 210, ${surfShimmer})`);
        surf.addColorStop(0.5, `rgba(20,  90, 170, ${surfShimmer * 0.4})`);
        surf.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = surf;
        ctx.fillRect(0, 0, width, height * 0.28);

        // 5 animated narrow caustic shafts
        ctx.filter = 'blur(28px)';
        const shaftCount = 5;
        for (let i = 0; i < shaftCount; i++) {
            const ti     = t * (0.28 + i * 0.055);
            const centX  = width * (0.08 + (i / (shaftCount - 1)) * 0.84)
                         + Math.sin(ti + i * 1.3) * width * 0.055;
            const lean   = Math.sin(ti * 0.65 + i * 0.9) * 0.08; // subtle diagonal
            const endX   = centX + lean * height;
            const bright = 0.028 + Math.sin(ti * 1.5 + i * 0.7) * 0.010;
            const hw     = width * (0.028 + Math.sin(ti * 0.4 + i) * 0.008);

            const sg = ctx.createLinearGradient(centX, 0, endX, height * 0.75);
            sg.addColorStop(0,    `rgba(90,  180, 240, ${bright * 4.5})`);
            sg.addColorStop(0.25, `rgba(50,  140, 210, ${bright * 2.5})`);
            sg.addColorStop(0.60, `rgba(20,   90, 175, ${bright * 0.9})`);
            sg.addColorStop(1,    'rgba(0,0,0,0)');

            ctx.fillStyle = sg;
            ctx.beginPath();
            ctx.moveTo(centX - hw,        0);
            ctx.lineTo(centX + hw,        0);
            ctx.lineTo(endX  + hw * 2.6,  height * 0.75);
            ctx.lineTo(endX  - hw * 2.6,  height * 0.75);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    // ── Wave glow ribbons (PS5-style background bands) ────────────
    // Soft glowing ribbon drawn along each wave path so the wave
    // itself is faintly visible even between particles.
    function drawWaveRibbons(ctx, width, height, t) {
        WAVES.forEach((w, idx) => {
            ctx.save();
            ctx.filter = 'blur(22px)';
            ctx.beginPath();
            const op = 0.022 + idx * 0.006;
            ctx.strokeStyle = `rgba(60, 170, 225, ${op})`;
            ctx.lineWidth   = 70 - idx * 12;
            ctx.lineCap     = 'round';
            ctx.lineJoin    = 'round';
            for (let x = 0; x <= width; x += 20) {
                const y = getWaveY(idx, x, t);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
        });
    }

    // ── Canvas resize — HiDPI aware, scroll-safe ──────────────────
    function resizeAmbientCanvas() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ambientCanvas.width  = Math.round(w * dpr);
        ambientCanvas.height = Math.round(h * dpr);
        actx.setTransform(dpr, 0, 0, dpr, 0, 0); // re-apply DPR scale after resize
        // Only shift the reference dimensions on actual orientation changes (>100px width diff)
        // so that mobile address-bar toggling doesn't jolt the wave positions.
        if (Math.abs(w - referenceWidth) > 100) {
            referenceWidth  = w;
            referenceHeight = h;
        }
    }
    window.addEventListener('resize', resizeAmbientCanvas);
    resizeAmbientCanvas();

    // Populate initial particles
    for (let i = 0; i < maxAmbientParticles; i++) {
        ambientParticles.push(new AmbientParticle(true));
    }

    // ── Main animation loop ───────────────────────────────────────
    function animateAmbientSpores() {
        // Clear at logical (pre-DPR) size — transform handles the rest
        actx.clearRect(0, 0, referenceWidth, referenceHeight);

        // ① Deep ocean background fill
        const bgGrad = actx.createLinearGradient(0, 0, 0, referenceHeight);
        bgGrad.addColorStop(0,    'rgba(2,  10, 26, 0.97)');
        bgGrad.addColorStop(0.45, 'rgba(4,  14, 34, 0.97)');
        bgGrad.addColorStop(1,    'rgba(1,   6, 16, 0.98)');
        actx.fillStyle = bgGrad;
        actx.fillRect(0, 0, referenceWidth, referenceHeight);

        // Advance global time — slow and meditative
        wavePhase += 0.0011;

        // ② Underwater caustic light shafts
        drawUnderwaterLight(actx, referenceWidth, referenceHeight, wavePhase);

        // ③ Faint wave-glow ribbons (PS5 wave band backing)
        drawWaveRibbons(actx, referenceWidth, referenceHeight, wavePhase);

        // ④ Particles (fall → wave → drift)
        for (let i = 0; i < ambientParticles.length; i++) {
            ambientParticles[i].update();
            ambientParticles[i].draw();
        }

        requestAnimationFrame(animateAmbientSpores);
    }
    animateAmbientSpores();

    // Remove stale mouse-tracking references (no longer needed for ambient layer)
    let mouseX = null, mouseY = null;




    // --- Cursor Grid Trace Effect ---
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '100000'; // Elevated to sit cleanly over layout layers but below popup modals
    canvas.style.transform = 'translate3d(0, 0, 0)'; // Force GPU compositing layer to prevent scroll paint lag
    canvas.style.willChange = 'transform';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let spores = [];  // Drifting Firefly spore particles
    let isAnimating = false;

    // Track previous mouse coordinates to enable path interpolation
    let prevMouse = { x: null, y: null };

    // Trail objects for shooting star simulation
    const mouseTrail = {
        leadX: null,
        leadY: null,
        targetX: null,
        targetY: null,
        points: [],
        isMoving: false
    };

    const activeTouchTrails = {};

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (!isAnimating) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function spawnSpore(x, y) {
        spores.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.2 - 0.9, // Upward drifting bias
            size: Math.random() * 1.5 + 0.8, // Delicate size: 0.8px to 2.3px
            life: 1.0,
            decay: Math.random() * 0.025 + 0.015 // Faster decay for minimal footprint
        });

        if (!isAnimating) {
            isAnimating = true;
            requestAnimationFrame(animatePixels);
        }
    }

    // Mouse Tracking Event Listeners
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;

        mouseTrail.targetX = x;
        mouseTrail.targetY = y;
        mouseTrail.isMoving = true;

        if (mouseTrail.leadX === null || mouseTrail.leadY === null) {
            mouseTrail.leadX = x;
            mouseTrail.leadY = y;
        }

        if (prevMouse.x !== null && prevMouse.y !== null) {
            const dx = x - prevMouse.x;
            const dy = y - prevMouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 1.5) {
                // Interpolate along the mouse movement path to guarantee continuous spore generation without gaps
                const steps = Math.max(1, Math.floor(dist / 14)); // Sparse spawn spacing
                for (let j = 0; j <= steps; j++) {
                    const ratio = j / steps;
                    const interpX = prevMouse.x + dx * ratio;
                    const interpY = prevMouse.y + dy * ratio;
                    if (Math.random() > 0.82) { // Keep spores sparse and minimal
                        spawnSpore(interpX, interpY);
                    }
                }
            }
        } else {
            if (Math.random() > 0.82) {
                spawnSpore(x, y);
            }
        }

        prevMouse.x = x;
        prevMouse.y = y;

        if (!isAnimating) {
            isAnimating = true;
            requestAnimationFrame(animatePixels);
        }
    });

    window.addEventListener('mouseout', () => {
        prevMouse.x = null;
        prevMouse.y = null;
        mouseTrail.targetX = null;
        mouseTrail.targetY = null;
        mouseTrail.isMoving = false;
    });

    // Multi-Touch Event Listeners supporting multiple fingers concurrently
    const handleTouchStart = (e) => {
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const id = touch.identifier;
            
            activeTouchTrails[id] = {
                leadX: touch.clientX,
                leadY: touch.clientY,
                targetX: touch.clientX,
                targetY: touch.clientY,
                points: [],
                isMoving: true
            };

            if (Math.random() > 0.82) {
                spawnSpore(touch.clientX, touch.clientY);
            }
        }
    };

    const handleTouchMove = (e) => {
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const id = touch.identifier;
            const x = touch.clientX;
            const y = touch.clientY;

            let trail = activeTouchTrails[id];
            if (!trail) {
                trail = activeTouchTrails[id] = {
                    leadX: x,
                    leadY: y,
                    targetX: x,
                    targetY: y,
                    points: [],
                    isMoving: true
                };
            }

            const prevX = trail.targetX;
            const prevY = trail.targetY;

            trail.targetX = x;
            trail.targetY = y;
            trail.isMoving = true;

            // Spore spawning with interpolation
            if (prevX !== null && prevY !== null) {
                const dx = x - prevX;
                const dy = y - prevY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 1.5) {
                    const steps = Math.max(1, Math.floor(dist / 14));
                    for (let j = 0; j <= steps; j++) {
                        const ratio = j / steps;
                        const interpX = prevX + dx * ratio;
                        const interpY = prevY + dy * ratio;
                        if (Math.random() > 0.82) {
                            spawnSpore(interpX, interpY);
                        }
                    }
                }
            } else {
                if (Math.random() > 0.82) {
                    spawnSpore(x, y);
                }
            }
        }

        if (!isAnimating) {
            isAnimating = true;
            requestAnimationFrame(animatePixels);
        }
    };

    const handleTouchEnd = (e) => {
        const activeIds = Array.from(e.touches).map(t => t.identifier);
        for (const id in activeTouchTrails) {
            if (!activeIds.includes(parseInt(id))) {
                activeTouchTrails[id].isMoving = false;
                activeTouchTrails[id].targetX = null;
                activeTouchTrails[id].targetY = null;
            }
        }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Break the trail completely on scroll to prevent streaks, and don't shift particles abruptly
    window.addEventListener('scroll', () => {
        // Reset mouse trail tracking so it doesn't draw a line from pre-scroll to post-scroll positions
        mouseTrail.isMoving = false;
        mouseTrail.targetX = null;
        mouseTrail.targetY = null;
        
        // Reset touch trails tracking
        for (const id in activeTouchTrails) {
            activeTouchTrails[id].isMoving = false;
            activeTouchTrails[id].targetX = null;
            activeTouchTrails[id].targetY = null;
        }
    }, { passive: true });

    function drawShootingStarTrail(points) {
        if (points.length < 2) return;

        const maxAge = 9; // Shorter, punchier, highly kinetic shooting star trail
        const maxOpacity = 0.85;

        // Pad the points array to ensure Catmull-Rom spline can interpolate all segments
        const p = [];
        p.push(points[0]); // Duplicate head for tangent
        for (let i = 0; i < points.length; i++) {
            p.push(points[i]);
        }
        p.push(points[points.length - 1]); // Duplicate tail for tangent

        // We will generate a list of interpolated curve points
        const curvePoints = [];
        
        // High-performance subdivision limit (steps = 3 is perfect)
        const steps = 3;
        const pLength = p.length;
        
        for (let i = 1; i < pLength - 2; i++) {
            const p0 = p[i - 1];
            const p1 = p[i];
            const p2 = p[i + 1];
            const p3 = p[i + 2];

            for (let j = 0; j < steps; j++) {
                const t = j / steps;
                const t2 = t * t;
                const t3 = t2 * t;

                // Optimized Catmull-Rom evaluation
                const x = 0.5 * (
                    (2 * p1.x) +
                    (-p0.x + p2.x) * t +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
                );
                const y = 0.5 * (
                    (2 * p1.y) +
                    (-p0.y + p2.y) * t +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
                );

                const segmentIndex = i - 1;
                const globalIndex = segmentIndex + t;
                const ratio = globalIndex / (points.length - 1);

                const age = p1.age * (1 - t) + p2.age * t;
                const lifeRatio = 1 - (age / maxAge);

                if (lifeRatio > 0) {
                    curvePoints.push({ x, y, ratio, lifeRatio });
                }
            }
        }

        // Add the tail point
        const lastPt = points[points.length - 1];
        const lastLife = 1 - (lastPt.age / maxAge);
        if (lastLife > 0) {
            curvePoints.push({
                x: lastPt.x,
                y: lastPt.y,
                ratio: 1.0,
                lifeRatio: lastLife
            });
        }

        const curveLength = curvePoints.length;
        if (curveLength < 2) return;

        // Hoist global canvas properties to avoid state-setting overhead inside loops
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // PASS 1: Draw all glowing backing strokes
        for (let i = 1; i < curveLength; i++) {
            const c1 = curvePoints[i - 1];
            const c2 = curvePoints[i];

            const avgLife = (c1.lifeRatio + c2.lifeRatio) * 0.5;
            if (avgLife <= 0) continue;

            const ratio1 = c1.ratio;
            const w1 = 3.6 * (1 - ratio1) + 0.4 * ratio1;
            const w2 = 3.6 * (1 - c2.ratio) + 0.4 * c2.ratio;
            const avgWidth = ((w1 + w2) * 0.5) * avgLife;

            const coreOpacity = maxOpacity * avgLife * (1 - ratio1 * 0.7);
            const glowOpacity = coreOpacity * 0.18;

            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.lineWidth = avgWidth * 5.0;
            ctx.strokeStyle = `rgba(207, 171, 58, ${glowOpacity})`;
            ctx.stroke();
        }

        // PASS 2: Draw all high-intensity core filaments
        for (let i = 1; i < curveLength; i++) {
            const c1 = curvePoints[i - 1];
            const c2 = curvePoints[i];

            const avgLife = (c1.lifeRatio + c2.lifeRatio) * 0.5;
            if (avgLife <= 0) continue;

            const ratio1 = c1.ratio;
            const w1 = 3.6 * (1 - ratio1) + 0.4 * ratio1;
            const w2 = 3.6 * (1 - c2.ratio) + 0.4 * c2.ratio;
            const avgWidth = ((w1 + w2) * 0.5) * avgLife;

            const coreOpacity = maxOpacity * avgLife * (1 - ratio1 * 0.7);

            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.lineWidth = avgWidth;
            ctx.strokeStyle = `rgba(207, 171, 58, ${coreOpacity})`;
            ctx.stroke();
        }
    }

    function animatePixels() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let hasActiveTrails = false;

        // Process mouse trail if active or has remaining points
        if (mouseTrail.points.length > 0 || mouseTrail.isMoving) {
            hasActiveTrails = true;

            if (mouseTrail.isMoving && mouseTrail.targetX !== null && mouseTrail.targetY !== null) {
                // High-performance spring catchup easing
                mouseTrail.leadX += (mouseTrail.targetX - mouseTrail.leadX) * 0.45;
                mouseTrail.leadY += (mouseTrail.targetY - mouseTrail.leadY) * 0.45;

                // Only spawn points during active cursor movement (shooting star stream)
                mouseTrail.points.unshift({ x: mouseTrail.leadX, y: mouseTrail.leadY, age: 0 });
            }

            // Age existing points
            for (let p of mouseTrail.points) {
                p.age++;
            }
            mouseTrail.points = mouseTrail.points.filter(p => p.age < 9); // Matches maxAge of 9 for optimal performance

            // Reset motion state for next frame calculation
            mouseTrail.isMoving = false;

            // Draw shooting star
            drawShootingStarTrail(mouseTrail.points);
        }

        // Process touch trails
        for (const id in activeTouchTrails) {
            const trail = activeTouchTrails[id];
            
            if (trail.points.length > 0 || trail.isMoving) {
                hasActiveTrails = true;

                if (trail.isMoving && trail.targetX !== null && trail.targetY !== null) {
                    trail.leadX += (trail.targetX - trail.leadX) * 0.45;
                    trail.leadY += (trail.targetY - trail.leadY) * 0.45;

                    trail.points.unshift({ x: trail.leadX, y: trail.leadY, age: 0 });
                }

                for (let p of trail.points) {
                    p.age++;
                }
                trail.points = trail.points.filter(p => p.age < 9); // Matches maxAge of 9

                trail.isMoving = false;

                drawShootingStarTrail(trail.points);
            } else {
                // Clean up fully decayed trail
                delete activeTouchTrails[id];
            }
        }

        // Update and draw active firefly spores
        for (let i = spores.length - 1; i >= 0; i--) {
            const s = spores[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= s.decay;

            if (s.life <= 0) {
                spores.splice(i, 1);
                continue;
            }

            // Central glowing spore circle - fuzzed and minimal
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(207, 171, 58, ${s.life * 0.48})`;
            ctx.fill();

            // Soft atmospheric spore glow
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(207, 171, 58, ${s.life * 0.08})`;
            ctx.fill();
        }

        const hasSpores = spores.length > 0;

        if (hasActiveTrails || hasSpores) {
            requestAnimationFrame(animatePixels);
        } else {
            isAnimating = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Final clear
        }
    }

    animatePixels();

    // Contact Form Validation and Submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        const nameInput = document.getElementById('contactName');
        const emailInput = document.getElementById('contactEmail');
        const msgInput = document.getElementById('contactMsg');
        const submitBtn = document.getElementById('submitBtn');
        const formMessage = document.getElementById('formMessage');

        const nameError = document.getElementById('nameError');
        const emailError = document.getElementById('emailError');
        const msgError = document.getElementById('msgError');

        let isEmailAPIValidated = false;

        function updateButtonState() {
            const name = nameInput.value.trim();
            const message = msgInput.value.trim();

            const isValid = name.length > 0 && message.length > 0 && isEmailAPIValidated;

            if (isValid) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            } else {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
            return isValid;
        }

        async function validateField(input, errorSpan, isEmail) {
            const val = input.value.trim();
            if (val.length === 0) {
                errorSpan.style.display = 'block';
                input.style.borderColor = '#fca5a5';
                if (isEmail) isEmailAPIValidated = false;
            } else if (isEmail) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(val)) {
                    errorSpan.textContent = 'Enter correct email';
                    errorSpan.style.color = '#fca5a5';
                    errorSpan.style.display = 'block';
                    input.style.borderColor = '#fca5a5';
                    isEmailAPIValidated = false;
                } else {
                    // Start API Validation
                    errorSpan.textContent = 'Verifying active email...';
                    errorSpan.style.color = '#94a3b8';
                    errorSpan.style.display = 'block';
                    input.style.borderColor = '#94a3b8';
                    isEmailAPIValidated = false;
                    updateButtonState();

                    try {
                        // Check domain mx records
                        const response = await fetch(`https://api.mailcheck.ai/email/${val}`);
                        const data = await response.json();
                        
                        // If API is successful (200), strictly check MX and Disposable status
                        if (response.status === 200) {
                            if (data.mx === false || data.disposable === true) {
                                errorSpan.textContent = 'This email does not appear to be active.';
                                errorSpan.style.color = '#fca5a5';
                                errorSpan.style.display = 'block';
                                input.style.borderColor = '#fca5a5';
                                isEmailAPIValidated = false;
                            } else {
                                errorSpan.style.display = 'none';
                                input.style.borderColor = 'var(--primary)';
                                isEmailAPIValidated = true;
                            }
                        } else if (response.status === 400) {
                            // 400 means completely impossible domain format (e.g. .asdfg)
                            errorSpan.textContent = 'This email domain format is invalid.';
                            errorSpan.style.color = '#fca5a5';
                            errorSpan.style.display = 'block';
                            input.style.borderColor = '#fca5a5';
                            isEmailAPIValidated = false;
                        } else {
                            // 429 Rate Limit or 500 Server Error: Fail Open! 
                            // Do NOT block valid users just because the free API is overwhelmed.
                            errorSpan.style.display = 'none';
                            input.style.borderColor = 'var(--primary)';
                            isEmailAPIValidated = true;
                        }
                    } catch (err) {
                        console.error("Email API failed, falling back to regex", err);
                        errorSpan.style.display = 'none';
                        input.style.borderColor = 'var(--primary)';
                        isEmailAPIValidated = true;
                    }
                }
            } else {
                errorSpan.style.display = 'none';
                input.style.borderColor = 'var(--primary)';
            }
            updateButtonState();
        }

        // Live validation on input
        nameInput.addEventListener('input', () => {
            nameError.style.display = 'none';
            nameInput.style.borderColor = 'var(--glass-border)';
            updateButtonState();
        });
        emailInput.addEventListener('input', () => {
            emailError.style.display = 'none';
            emailInput.style.borderColor = 'var(--glass-border)';
            isEmailAPIValidated = false; // Reset until they blur and we check again
            updateButtonState();
        });
        msgInput.addEventListener('input', () => {
            msgError.style.display = 'none';
            msgInput.style.borderColor = 'var(--glass-border)';
            updateButtonState();
        });

        // Show errors on blur
        nameInput.addEventListener('blur', () => validateField(nameInput, nameError, false));
        emailInput.addEventListener('blur', () => validateField(emailInput, emailError, true));
        msgInput.addEventListener('blur', () => validateField(msgInput, msgError, false));

        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (!updateButtonState()) return;

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const message = msgInput.value.trim();

            // Clear previous message
            formMessage.style.display = 'none';
            formMessage.className = '';

            // Show loading state
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';

            try {
                // Form validation endpoint
                const web3formsAccessKey = atob('ZmJhYWQ0ZjEtNjlmNC00MDY1LTg2ZDQtN2FkNDJiZjEyYzVi'); 

                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        access_key: web3formsAccessKey,
                        name: name,
                        email: email,
                        message: message,
                        subject: 'New Portfolio Contact from ' + name
                    })
                });

                const result = await response.json();

                if (response.status === 200) {
                    showFormMessage('Message sent successfully!', 'success');
                    contactForm.reset();
                } else {
                    console.error(result);
                    showFormMessage('Oops! Make sure your Web3Forms Access Key is set.', 'error');
                }
            } catch (error) {
                console.error('Submission error:', error);
                showFormMessage('Network error. Please try again later.', 'error');
            }

            submitBtn.textContent = 'Send Message';
            updateButtonState(); // Reset button
        });

        function showFormMessage(text, type) {
            formMessage.textContent = text;
            formMessage.style.display = 'block';
            if (type === 'error') {
                formMessage.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                formMessage.style.color = '#fca5a5';
                formMessage.style.border = '1px solid #ef4444';
            } else {
                formMessage.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                formMessage.style.color = '#6ee7b7';
                formMessage.style.border = '1px solid #10b981';
            }
        }
    }

    // Scroll Progress Indicator Logic (GPU-Accelerated scaleX)
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        window.addEventListener('scroll', () => {
            const scrollPx = window.scrollY || document.documentElement.scrollTop;
            const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollLen = winHeightPx > 0 ? (scrollPx / winHeightPx) : 0;
            scrollProgress.style.transform = `scaleX(${scrollLen})`;
        }, { passive: true });
    }

    // Project Filtering Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.projects-grid .project-card');

    if (filterBtns.length > 0 && projectCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state on buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                // Filter cards
                projectCards.forEach(card => {
                    if (filterValue === 'all') {
                        card.classList.remove('hide');
                    } else {
                        if (card.getAttribute('data-category') === filterValue) {
                            card.classList.remove('hide');
                        } else {
                            card.classList.add('hide');
                        }
                    }
                });
            });
        });
    } // end if (filterBtns.length > 0 && projectCards.length > 0)

    // Retro Terminal Logging Simulation
    const terminalFeed = document.getElementById('terminalFeed');
    if (terminalFeed) {
        const logTemplates = [
            "[SPARK_ENG] Running Z-Ordering on catalog.sales_reconciliation... SUCCESS",
            "[SPARK_ENG] Broadcast join optimized for williams_sonoma.store_inventory [shaved 40m]",
            "[SNOWFLAKE] Running SCD Type 2 merge into core.dim_customer... SUCCESS",
            "[SNOWFLAKE] Offloaded stored procedure execution to warehouse 'XS_AUTO_SUSPEND'",
            "[KAFKA] Consumer group 'order_ingest_v2' offsets synchronized. Lag: 0.",
            "[AIRFLOW] DAG 'netsuite_to_delta' task 'aggregate_reconciliation' status: SUCCESS",
            "[VECTOR_DB] Upserted 1,240 documents into JobMatch AI pgvector collection.",
            "[VECTOR_DB] Querying semantic matching index for 'data platform architect'... 140ms",
            "[QLoRA] Epoch 3/5 complete. Loss: 0.142. Validation accuracy: 94.2%",
            "[SYS_MONITOR] Pipeline health: 100% | SLA Target: OPTIMAL | Throughput: 14.8 MB/s",
            "[SURVIVOR] QZ Perimeter check complete. Infection vectors: 0% | Status: UNINFECTED",
            "[SYS_SYNC] Syncing local survival repository nodes with Remote Git... SUCCESS",
            "[SNOWFLAKE] Extracted NetSuite billing streams. Transferred 42,000 records. Integrity checks OK."
        ];
        
        let logIndex = 0;
        
        function appendTerminalLine() {
            const prompt = terminalFeed.querySelector('.term-prompt');
            
            // Create new line element
            const newLine = document.createElement('div');
            newLine.className = 'term-line';
            newLine.textContent = logTemplates[logIndex];
            
            // Insert line before the prompt
            if (prompt) {
                terminalFeed.insertBefore(newLine, prompt);
            } else {
                terminalFeed.appendChild(newLine);
            }
            
            // Scroll to bottom
            terminalFeed.scrollTop = terminalFeed.scrollHeight;
            
            // Advance index
            logIndex = (logIndex + 1) % logTemplates.length;
            
            // Schedule next log line at random intervals between 2s and 4.5s
            const delay = 2000 + Math.random() * 2500;
            setTimeout(appendTerminalLine, delay);
        }
        
        // Start the loop after a 3s initial delay
        setTimeout(appendTerminalLine, 3000);
    } // End of retro terminal

    // ----------------------------------------------------
    // Phase 9: Professional TLOU Enhancements
    // ----------------------------------------------------

    // 1. Interactive "Flashlight" Hover on Cards
    const glassCards = document.querySelectorAll('.glass-card');
    glassCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            // Calculate mouse position relative to the card, as a percentage
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        }, { passive: true });
    });

    // 2. (FEDRA Boot Sequence Removed per user request)

    // 3. Spore Burst Micro-Interaction on Buttons
    const primaryBtns = document.querySelectorAll('.btn-primary');
    primaryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Ensure spawnSpore is available (it should be since we are in the same scope)
            if (typeof spawnSpore === 'function' && typeof requestAnimationFrame === 'function') {
                const burstCount = 12;
                for (let i = 0; i < burstCount; i++) {
                    // Slight randomization around the click coordinate
                    const offsetX = (Math.random() - 0.5) * 20;
                    const offsetY = (Math.random() - 0.5) * 20;
                    spawnSpore(e.clientX + offsetX, e.clientY + offsetY);
                }
                
                // Wake up animation loop if it was asleep
                if (typeof isAnimating !== 'undefined' && !isAnimating) {
                    isAnimating = true;
                    requestAnimationFrame(animatePixels); // Requires animatePixels to be in scope
                }
            }
        });
    });

});
