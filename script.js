document.addEventListener('DOMContentLoaded', () => {
    // Navigation Scroll Effect
    const navbar = document.querySelector('.navbar');
    let scrolled = false;

    window.addEventListener('scroll', () => {
        const isScrolled = window.scrollY > 50;
        if (isScrolled !== scrolled) {
            scrolled = isScrolled;
            if (scrolled) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    }, { passive: true });

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

    // --- Ambient Spore Canvas Builder (PS5 Home Screen Background Spores in TLOU Theme) ---
    const ambientCanvas = document.createElement('canvas');
    ambientCanvas.id = 'ambient-spore-canvas';
    ambientCanvas.style.position = 'fixed';
    ambientCanvas.style.top = '0';
    ambientCanvas.style.left = '0';
    ambientCanvas.style.width = '100vw';
    ambientCanvas.style.height = '100vh';
    ambientCanvas.style.pointerEvents = 'none';
    ambientCanvas.style.zIndex = '-1'; // Behind everything
    document.body.appendChild(ambientCanvas);

    const actx = ambientCanvas.getContext('2d');
    let ambientParticles = [];
    const maxAmbientParticles = 180; // Raised density for a rich, immersive PS5 home screen atmosphere
    let wavePhase = 0; // Wave timing index for ambient auroral ribbons and god rays

    // High-performance offscreen bokeh templates to avoid heavy canvas blur filtering on every frame
    const bokehTemplates = {};
    function createBokehTemplates() {
        const colors = [
            { name: 'gold', color: 'rgba(207, 171, 58, 0.42)' },
            { name: 'green', color: 'rgba(115, 140, 102, 0.32)' }
        ];
        
        colors.forEach(c => {
            // We'll create small, medium, and large pre-blurred bokeh canvases
            const sizes = [
                { name: 'large', radius: 18, blur: 16 },
                { name: 'medium', radius: 10, blur: 10 },
                { name: 'small', radius: 6, blur: 6 }
            ];
            
            sizes.forEach(s => {
                const offscreen = document.createElement('canvas');
                const pad = (s.radius + s.blur) * 2 + 10;
                offscreen.width = pad;
                offscreen.height = pad;
                const octx = offscreen.getContext('2d');
                
                octx.filter = `blur(${s.blur}px)`;
                octx.fillStyle = c.color;
                octx.beginPath();
                octx.arc(pad / 2, pad / 2, s.radius, 0, Math.PI * 2);
                octx.fill();
                
                bokehTemplates[`${c.name}_${s.name}`] = {
                    canvas: offscreen,
                    halfSize: pad / 2
                };
            });
        });
    }
    createBokehTemplates();

    class AmbientParticle {
        constructor(isInit = false) {
            this.x = Math.random() * ambientCanvas.width;
            
            // Distribute across the entire screen height on initial load; spawn below bottom if recycled
            this.y = isInit 
                ? Math.random() * ambientCanvas.height 
                : ambientCanvas.height + 25;
                
            this.z = Math.random() * 0.84 + 0.16; // 3D Depth Layer factor
            
            // Build three highly focused depth-of-field layers
            if (this.z < 0.38) {
                // Background Lens Bokeh: Large, slow, fuzzy out-of-focus bokeh circles
                this.isBokeh = true;
                this.isFilament = false;
                this.size = Math.random() * 11 + 8.5; // Massive bokeh circles (8.5px to 19.5px!)
                this.baseSpeedY = (Math.random() * 0.012 + 0.005) * -1; // Drift lazily and slowly (weightless!)
            } else if (this.z > 0.76) {
                // Foreground Embers: Tiny, bright, sharp specs of gold specs that float faster and respond instantly to cursor winds
                this.isBokeh = false;
                this.isFilament = false;
                this.size = (Math.random() * 1.5 + 0.8) * this.z;
                this.baseSpeedY = (Math.random() * 0.08 + 0.04) * -1; // Lazy float speed
            } else {
                // Midground: Classic spores and slowly rotating curved filaments
                this.isBokeh = false;
                this.isFilament = Math.random() < 0.16;
                this.size = (Math.random() * 4.0 + 1.8) * this.z;
                this.baseSpeedY = (Math.random() * 0.05 + 0.015) * -1; // Slow suspended float
            }

            this.speedY = this.baseSpeedY * this.z;
            this.angle = Math.random() * Math.PI * 2;
            this.angleSpeed = Math.random() * 0.008 + 0.003;
            
            // Physical wind velocity vectors for smooth cursor trailing inertia
            this.vx = 0;
            this.vy = 0;

            // Curved filaments rotation
            this.rot = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.012;

            this.baseOpacity = (Math.random() * 0.18 + 0.08) * this.z;
            this.opacity = 0; // Fade in gently
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 0.005 + 0.002; // Elevated speed for active shimmer
        }

        update() {
            // Calculate continuous organic fluid turbulence currents (spores drift and swirl together)
            const time = wavePhase * 10;
            const noiseX = Math.sin(this.y * 0.006 + time * 0.15) * Math.cos(this.x * 0.004 - time * 0.08) * 0.35;
            const noiseY = Math.cos(this.x * 0.005 + time * 0.12) * Math.sin(this.y * 0.003 - time * 0.05) * 0.18;

            // Apply turbulence + floating vectors + physical cursor wind velocity
            this.y += this.speedY + noiseY + this.vy;
            this.x += noiseX + this.vx;

            // Apply friction/drag to cursor wind velocity so particles slow down naturally
            this.vx *= 0.93;
            this.vy *= 0.93;

            // Slowly rotate filaments
            if (this.isFilament) {
                this.rot += this.rotSpeed;
            }

            // Muted organic breathing pulse + firefly shimmering twinkles (sparkling flares)
            this.pulsePhase += this.pulseSpeed;
            const pulseFactor = (Math.sin(this.pulsePhase) + 1) / 2; // 0 to 1
            const shimmer = Math.sin(this.pulsePhase * 3.6) * 0.14; // Twitch sparkle offset!
            this.opacity = Math.max(0, this.baseOpacity * (0.55 + pulseFactor * 0.45) + shimmer);

            // Recycle if particle drifts far outside bounds
            if (this.y < -40 || this.x < -40 || this.x > ambientCanvas.width + 40) {
                const index = ambientParticles.indexOf(this);
                if (index > -1) {
                    ambientParticles[index] = new AmbientParticle(false);
                }
            }
        }

        draw() {
            // Soft fading at all borders (top, bottom, left, right) so particles blend seamlessly in the atmosphere
            let edgeFade = 1.0;
            const topFadeDist = 120;
            const bottomFadeDist = 120;
            const sideFadeDist = 80;

            if (this.y < topFadeDist) {
                edgeFade *= Math.max(0, this.y / topFadeDist);
            } else if (this.y > ambientCanvas.height - bottomFadeDist) {
                edgeFade *= Math.max(0, (ambientCanvas.height - this.y) / bottomFadeDist);
            }

            if (this.x < sideFadeDist) {
                edgeFade *= Math.max(0, this.x / sideFadeDist);
            } else if (this.x > ambientCanvas.width - sideFadeDist) {
                edgeFade *= Math.max(0, (ambientCanvas.width - this.x) / sideFadeDist);
            }
            
            const renderOpacity = this.opacity * edgeFade;
            if (renderOpacity <= 0.01) return; // Skip drawing if faded out

            // Curated forest-lichen moss green (#738c66) and warm amber fireflies gold (#cfab3a)
            const color = this.z > 0.55
                ? `rgba(207, 171, 58, ${renderOpacity})` // Gold spores
                : `rgba(115, 140, 102, ${renderOpacity * 0.65})`; // Lichen Green spores

            if (this.isBokeh) {
                // TRUE Photographic Lens Bokeh using high-performance offscreen templates
                const colorType = this.z > 0.28 ? 'gold' : 'green';
                let sizeType = 'small';
                if (this.size > 14) {
                    sizeType = 'large';
                } else if (this.size > 10) {
                    sizeType = 'medium';
                }
                
                const template = bokehTemplates[`${colorType}_${sizeType}`];
                if (template) {
                    actx.save();
                    actx.globalAlpha = renderOpacity;
                    actx.drawImage(
                        template.canvas, 
                        this.x - template.halfSize, 
                        this.y - template.halfSize
                    );
                    actx.restore();
                }
            } else if (this.isFilament) {
                // High-fidelity drifting curved line filaments
                actx.beginPath();
                actx.strokeStyle = color;
                actx.lineWidth = Math.max(0.6, this.size * 0.22);
                actx.lineCap = 'round';
                
                const length = this.size * 2.2;
                const x1 = this.x - length * Math.cos(this.rot);
                const y1 = this.y - length * Math.sin(this.rot);
                const x2 = this.x + length * Math.cos(this.rot);
                const y2 = this.y + length * Math.sin(this.rot);
                const cx = this.x + length * 0.4 * Math.sin(this.rot);
                const cy = this.y - length * 0.4 * Math.cos(this.rot);
                
                actx.moveTo(x1, y1);
                actx.quadraticCurveTo(cx, cy, x2, y2);
                actx.stroke();
            } else {
                // Glowing radial bokeh spore circles
                const gradient = actx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size * 2.5
                );
                gradient.addColorStop(0, color);
                gradient.addColorStop(0.35, color);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                actx.fillStyle = gradient;
                actx.beginPath();
                actx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
                actx.fill();

                // AAA Premium Menu Detail: Render soft golden cross-hair lens flares on the brightest foreground specifications when they peak
                if (this.z > 0.8 && renderOpacity > 0.65) {
                    actx.beginPath();
                    actx.strokeStyle = `rgba(255, 255, 255, ${(renderOpacity - 0.65) * 1.8})`;
                    actx.lineWidth = 0.5;
                    
                    // Horizontal flare line
                    actx.moveTo(this.x - this.size * 2.2, this.y);
                    actx.lineTo(this.x + this.size * 2.2, this.y);
                    
                    // Vertical flare line
                    actx.moveTo(this.x, this.y - this.size * 2.2);
                    actx.lineTo(this.x, this.y + this.size * 2.2);
                    
                    actx.stroke();
                }
            }
        }
    }

    function resizeAmbientCanvas() {
        ambientCanvas.width = window.innerWidth;
        ambientCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeAmbientCanvas);
    resizeAmbientCanvas();

    // Populate starting ambient spores
    for (let i = 0; i < maxAmbientParticles; i++) {
        ambientParticles.push(new AmbientParticle(true));
    }

    // Cursor wind current tracking
    let mouseX = null;
    let mouseY = null;
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        }
    }, { passive: true });
    window.addEventListener('mouseout', () => {
        mouseX = null;
        mouseY = null;
    });
    window.addEventListener('touchend', () => {
        mouseX = null;
        mouseY = null;
    }, { passive: true });

    // Helper: Draw faint, wavy, slow-moving auroral ribbon light bands
    function drawAuroralRibbon(ctx, width, height, phase, color, baseY, amplitude) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 140; // Wide and soft
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let x = 0; x <= width; x += 30) {
            const y = baseY + Math.sin(x * 0.0015 + phase) * amplitude + Math.cos(x * 0.003 - phase * 0.5) * (amplitude * 0.3);
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    // Helper: Draw volumetric spotlight beam fanning from top-left diagonally down-right
    function drawVolumetricLight(ctx, width, height, phase) {
        ctx.save();
        
        // Project diagonal beam originating from (0, 0)
        const beamAngle = Math.sin(phase * 0.15) * 0.025 + 0.62; // Slow, elegant angular sway
        const endX = Math.cos(beamAngle) * width * 1.5;
        const endY = Math.sin(beamAngle) * height * 1.5;
        
        // Apply a massive 85px blur filter specifically to the light cone to make it incredibly soft and volumetric!
        ctx.filter = 'blur(85px)';
        
        const gradient = ctx.createLinearGradient(0, 0, endX, endY);
        
        // Volumetric light gradient stops (gold spotlight beam fading diagonally)
        const baseOpacity = 0.055 + Math.sin(phase * 0.3) * 0.015; // Slow breathing pulse
        gradient.addColorStop(0, `rgba(207, 171, 58, ${baseOpacity * 2.8})`);
        gradient.addColorStop(0.25, `rgba(207, 171, 58, ${baseOpacity * 1.4})`);
        gradient.addColorStop(0.6, `rgba(207, 171, 58, ${baseOpacity * 0.4})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        
        // Volumetric beam cone path fanning outward
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const spread = width * 0.75;
        const p1x = endX - spread * Math.sin(beamAngle);
        const p1y = endY + spread * Math.cos(beamAngle);
        const p2x = endX + spread * Math.sin(beamAngle);
        const p2y = endY - spread * Math.cos(beamAngle);
        
        ctx.lineTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    function animateAmbientSpores() {
        actx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);

        // Increment wave phase for slow auroral ribbon breathing motion
        wavePhase += 0.0018;

        // Render Ribbon 1: Amber Gold (Backing layer)
        drawAuroralRibbon(
            actx,
            ambientCanvas.width,
            ambientCanvas.height,
            wavePhase,
            'rgba(207, 171, 58, 0.012)', // Faint amber aura
            ambientCanvas.height * 0.45,
            65
        );

        // Render Ribbon 2: Lichen Green (Backing layer)
        drawAuroralRibbon(
            actx,
            ambientCanvas.width,
            ambientCanvas.height,
            wavePhase + Math.PI,
            'rgba(115, 140, 102, 0.016)', // Muted lichen green aura
            ambientCanvas.height * 0.55,
            85
        );

        // Render Volumetric Light Shaft (Breathing top-left spotlight beam cone overlay)
        drawVolumetricLight(actx, ambientCanvas.width, ambientCanvas.height, wavePhase);

        for (let i = 0; i < ambientParticles.length; i++) {
            const p = ambientParticles[i];
            
            // Cursor physical wind acceleration (spores accelerate away and slow down organically)
            if (mouseX !== null && mouseY !== null) {
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const pushRadius = 220; // Soft radius of physical influence
                
                if (dist < pushRadius) {
                    const force = (pushRadius - dist) / pushRadius; // 0 to 1
                    const angle = Math.atan2(dy, dx);
                    // Apply physical velocity offsets scaled by 3D depth layer
                    p.vx += Math.cos(angle) * force * 0.45 * p.z;
                    p.vy += Math.sin(angle) * force * 0.25 * p.z;
                }
            }

            p.update();
            p.draw();
        }

        requestAnimationFrame(animateAmbientSpores);
    }
    animateAmbientSpores();

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

    // Scroll coordinate compensation: keeps active trail points and spores locked to scrolling page content
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const dScrollY = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;

        if (dScrollY !== 0) {
            // Shift active spores
            const sporesLength = spores.length;
            for (let i = 0; i < sporesLength; i++) {
                spores[i].y -= dScrollY;
            }

            // Shift active mouse trail points
            const mtPointsLength = mouseTrail.points.length;
            for (let i = 0; i < mtPointsLength; i++) {
                mouseTrail.points[i].y -= dScrollY;
            }
            if (mouseTrail.leadY !== null) mouseTrail.leadY -= dScrollY;
            if (mouseTrail.targetY !== null) mouseTrail.targetY -= dScrollY;

            // Shift active touch trail points
            for (const id in activeTouchTrails) {
                const trail = activeTouchTrails[id];
                const tPointsLength = trail.points.length;
                for (let i = 0; i < tPointsLength; i++) {
                    trail.points[i].y -= dScrollY;
                }
                if (trail.leadY !== null) trail.leadY -= dScrollY;
                if (trail.targetY !== null) trail.targetY -= dScrollY;
            }

            if (!isAnimating) {
                isAnimating = true;
                requestAnimationFrame(animatePixels);
            }
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
    }
});
