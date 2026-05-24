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
    const maxAmbientParticles = 55; // Elevated count for richer environmental atmosphere

    class AmbientParticle {
        constructor(isInit = false) {
            this.x = Math.random() * ambientCanvas.width;
            // Scatter all over screen on initialize; spawn below viewport otherwise
            this.y = isInit ? Math.random() * ambientCanvas.height : ambientCanvas.height + 25;
            this.z = Math.random() * 0.82 + 0.18; // 3D Depth Layer factor
            this.size = (Math.random() * 4.5 + 1.8) * this.z; // Depth-based sizing
            this.baseSpeedY = (Math.random() * 0.18 + 0.06) * -1; // Slow organic upward float
            this.speedY = this.baseSpeedY * this.z; // Depth-based speed
            this.angle = Math.random() * Math.PI * 2;
            this.angleSpeed = Math.random() * 0.008 + 0.003;
            
            // Physical wind velocity vectors for smooth cursor trailing inertia
            this.vx = 0;
            this.vy = 0;

            // Filaments: Some background elements render as curved drifting threads instead of dots
            this.isFilament = Math.random() < 0.16;
            this.rot = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.012;

            this.baseOpacity = (Math.random() * 0.18 + 0.08) * this.z;
            this.opacity = 0; // Fade in gently
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 0.004 + 0.0015;
        }

        update() {
            // Apply floating vectors + physical cursor wind velocity
            this.y += this.speedY + this.vy;
            this.x += Math.sin(this.angle) * 0.18 + this.vx;

            // Apply friction/drag to cursor wind velocity so particles slow down naturally
            this.vx *= 0.93;
            this.vy *= 0.93;

            // Sinusoidal horizontal sway
            this.angle += this.angleSpeed;

            // Slowly rotate filaments
            if (this.isFilament) {
                this.rot += this.rotSpeed;
            }

            // Muted organic breathing pulse
            this.pulsePhase += this.pulseSpeed;
            const pulseFactor = (Math.sin(this.pulsePhase) + 1) / 2; // 0 to 1
            this.opacity = this.baseOpacity * (0.55 + pulseFactor * 0.45);

            // Recycle if particle drifts far outside bounds
            if (this.y < -30 || this.x < -30 || this.x > ambientCanvas.width + 30) {
                const index = ambientParticles.indexOf(this);
                if (index > -1) {
                    ambientParticles[index] = new AmbientParticle(false);
                }
            }
        }

        draw() {
            // Curated forest-lichen moss green (#738c66) and warm amber fireflies gold (#cfab3a)
            const color = this.z > 0.55
                ? `rgba(207, 171, 58, ${this.opacity})` // Gold spores
                : `rgba(115, 140, 102, ${this.opacity * 0.65})`; // Lichen Green spores

            if (this.isFilament) {
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
    window.addEventListener('mouseout', () => {
        mouseX = null;
        mouseY = null;
    });

    function animateAmbientSpores() {
        actx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);

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

    // Custom SVG Cursor: Iconic Fireflies Emblem from The Last of Us, styled and colored in gold (#cfab3a) with a soft backing glow
    const cursorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 1024 763" fill="none">
        <!-- Glow Backing -->
        <path fill="rgba(207, 171, 58, 0.22)" fill-rule="evenodd" d="M 584.0,259.0 L 582.0,260.0 L 581.0,270.0 L 577.0,284.0 L 571.0,297.0 L 567.0,303.0 L 554.0,316.0 L 548.0,320.0 L 536.0,325.0 L 535.0,752.0 L 537.0,752.0 L 546.0,736.0 L 546.0,734.0 L 554.0,721.0 L 576.0,679.0 L 577.0,402.0 L 583.0,409.0 L 632.0,479.0 L 637.0,485.0 L 639.0,485.0 L 611.0,397.0 L 608.0,391.0 L 589.0,333.0 L 590.0,327.0 L 696.0,403.0 L 698.0,403.0 L 698.0,401.0 Z M 445.0,259.0 L 440.0,264.0 L 332.0,399.0 L 331.0,403.0 L 333.0,403.0 L 433.0,331.0 L 440.0,330.0 L 390.0,482.0 L 390.0,485.0 L 393.0,484.0 L 450.0,403.0 L 453.0,403.0 L 453.0,680.0 L 473.0,716.0 L 473.0,718.0 L 481.0,731.0 L 487.0,744.0 L 489.0,746.0 L 491.0,751.0 L 494.0,752.0 L 493.0,325.0 L 484.0,322.0 L 476.0,317.0 L 461.0,302.0 L 452.0,285.0 L 448.0,272.0 L 447.0,262.0 Z M 533.0,164.0 L 693.0,335.0 L 714.0,335.0 L 832.0,277.0 L 832.0,256.0 L 575.0,155.0 L 575.0,134.0 L 692.0,160.0 L 696.0,162.0 L 709.0,164.0 L 878.0,204.0 L 906.0,205.0 L 1013.0,94.0 L 1014.0,90.0 L 1004.0,66.0 L 565.0,63.0 L 601.0,7.0 L 598.0,6.0 L 533.0,59.0 Z M 496.0,163.0 L 496.0,60.0 L 429.0,5.0 L 428.0,8.0 L 461.0,58.0 L 463.0,65.0 L 25.0,65.0 L 15.0,90.0 L 15.0,93.0 L 123.0,205.0 L 151.0,204.0 L 450.0,134.0 L 454.0,135.0 L 454.0,154.0 L 452.0,156.0 L 196.0,256.0 L 196.0,276.0 L 198.0,278.0 L 315.0,335.0 L 336.0,335.0 Z" />
        <!-- Sharp Foreground -->
        <path fill="%23cfab3a" fill-rule="evenodd" d="M 584.0,259.0 L 582.0,260.0 L 581.0,270.0 L 577.0,284.0 L 571.0,297.0 L 567.0,303.0 L 554.0,316.0 L 548.0,320.0 L 536.0,325.0 L 535.0,752.0 L 537.0,752.0 L 546.0,736.0 L 546.0,734.0 L 554.0,721.0 L 576.0,679.0 L 577.0,402.0 L 583.0,409.0 L 632.0,479.0 L 637.0,485.0 L 639.0,485.0 L 611.0,397.0 L 608.0,391.0 L 589.0,333.0 L 590.0,327.0 L 696.0,403.0 L 698.0,403.0 L 698.0,401.0 Z M 445.0,259.0 L 440.0,264.0 L 332.0,399.0 L 331.0,403.0 L 333.0,403.0 L 433.0,331.0 L 440.0,330.0 L 390.0,482.0 L 390.0,485.0 L 393.0,484.0 L 450.0,403.0 L 453.0,403.0 L 453.0,680.0 L 473.0,716.0 L 473.0,718.0 L 481.0,731.0 L 487.0,744.0 L 489.0,746.0 L 491.0,751.0 L 494.0,752.0 L 493.0,325.0 L 484.0,322.0 L 476.0,317.0 L 461.0,302.0 L 452.0,285.0 L 448.0,272.0 L 447.0,262.0 Z M 533.0,164.0 L 693.0,335.0 L 714.0,335.0 L 832.0,277.0 L 832.0,256.0 L 575.0,155.0 L 575.0,134.0 L 692.0,160.0 L 696.0,162.0 L 709.0,164.0 L 878.0,204.0 L 906.0,205.0 L 1013.0,94.0 L 1014.0,90.0 L 1004.0,66.0 L 565.0,63.0 L 601.0,7.0 L 598.0,6.0 L 533.0,59.0 Z M 496.0,163.0 L 496.0,60.0 L 429.0,5.0 L 428.0,8.0 L 461.0,58.0 L 463.0,65.0 L 25.0,65.0 L 15.0,90.0 L 15.0,93.0 L 123.0,205.0 L 151.0,204.0 L 450.0,134.0 L 454.0,135.0 L 454.0,154.0 L 452.0,156.0 L 196.0,256.0 L 196.0,276.0 L 198.0,278.0 L 315.0,335.0 L 336.0,335.0 Z" />
    </svg>`;
    const cursorUrl = `url("data:image/svg+xml,${cursorSvg.replace(/\n\s*/g, '')}") 16 1, crosshair`;

    const cursorStyle = document.createElement('style');
    cursorStyle.innerHTML = `
        body, html { cursor: ${cursorUrl} !important; }
        a, button, .hamburger, .fab, .fas, a * { cursor: pointer !important; }
    `;
    document.head.appendChild(cursorStyle);

    const ctx = canvas.getContext('2d');
    let points = [];  // Array of { x, y, life }
    let spores = [];  // Drifting Firefly spore particles
    let isAnimating = false;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (!isAnimating) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let targetX = null;
    let targetY = null;
    let hasNewPosition = false;

    function updateTargetPosition(clientX, clientY) {
        targetX = clientX;
        targetY = clientY;
        hasNewPosition = true;

        if (!isAnimating) {
            isAnimating = true;
            requestAnimationFrame(animatePixels);
        }
    }

    const handleMove = (clientX, clientY) => {
        updateTargetPosition(clientX, clientY);
    };

    window.addEventListener('mousemove', (e) => {
        handleMove(e.clientX, e.clientY);
    });

    // Highly reliable multi-target touch capture bound on both window and document
    const handleTouch = (e) => {
        if (e.touches && e.touches.length > 0) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });
    document.addEventListener('touchstart', handleTouch, { passive: true });
    document.addEventListener('touchmove', handleTouch, { passive: true });

    // Instantly reset positions upon touch release or drag lift
    const handleEnd = () => {
        targetX = null;
        targetY = null;
        hasNewPosition = false;
    };
    window.addEventListener('mouseout', handleEnd);
    window.addEventListener('touchend', handleEnd, { passive: true });
    window.addEventListener('touchcancel', handleEnd, { passive: true });
    document.addEventListener('touchend', handleEnd, { passive: true });
    document.addEventListener('touchcancel', handleEnd, { passive: true });

    function processMouseMovement() {
        if (!hasNewPosition || targetX === null || targetY === null) return;

        let shouldAdd = false;
        if (points.length === 0) {
            shouldAdd = true;
        } else {
            let lastPoint = points[points.length - 1];
            let dx = targetX - lastPoint.x;
            let dy = targetY - lastPoint.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            // Append coordinate if the cursor has moved sufficiently
            if (dist > 1.5) {
                // If the coordinate jump is massive (e.g. window re-entry), clear points to prevent visual trail cuts
                if (dist > 250) {
                    points = [];
                }
                shouldAdd = true;
            }
        }

        if (shouldAdd) {
            points.push({ x: targetX, y: targetY, life: 1.0 });

            // Firefly Spore Sparkle: Spawn a floating spore that drifts upwards like warm sparks
            if (Math.random() > 0.55) {
                spores.push({
                    x: targetX,
                    y: targetY,
                    vx: (Math.random() - 0.5) * 1.6,
                    vy: (Math.random() - 0.4) * 1.5 - 0.8, // Upward floating bias
                    size: Math.random() * 2 + 1.2,
                    life: 1.0,
                    decay: Math.random() * 0.02 + 0.015
                });
            }
        }

        hasNewPosition = false;
    }

    function drawTrail() {
        if (points.length < 2) return;

        // Draw seamless continuous flowing filament of glowing fireflies trail
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];

            // Compute combined life/age factor (0 = tail, 1 = head)
            const relativePos = i / (points.length - 1);
            const age = relativePos * ((p1.life + p2.life) / 2);

            if (age <= 0.02) continue;

            // Taper filament width: 4.5px at the head down to 1.0px at the tail
            const size = 1.0 + age * 3.5;

            // 1. Soft atmospheric gold glow (wide, low opacity)
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(207, 171, 58, ${age * 0.18})`;
            ctx.lineWidth = size * 2.8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            // 2. Core golden line (glowing filament)
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(207, 171, 58, ${age * 0.85})`;
            ctx.lineWidth = size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            // 3. Ultra-bright hot center core for the front (head) of the trail
            if (age > 0.55) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${age * 0.95})`;
                ctx.lineWidth = size * 0.4;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            }
        }
    }

    function updatePointsAndSpores() {
        // Decay active path coordinates
        for (let i = 0; i < points.length; i++) {
            points[i].life -= 0.035; 
        }

        // Shift out decayed coordinates from the tail
        while (points.length > 0 && points[0].life <= 0) {
            points.shift();
        }

        // Draw and update active firefly spores
        for (let i = spores.length - 1; i >= 0; i--) {
            const s = spores[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= s.decay;

            if (s.life <= 0) {
                spores.splice(i, 1);
                continue;
            }

            // Central glowing spore circle
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(207, 171, 58, ${s.life * 0.75})`;
            ctx.fill();

            // Soft atmospheric spore glow
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(207, 171, 58, ${s.life * 0.15})`;
            ctx.fill();
        }
    }

    function animatePixels() {
        processMouseMovement();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawTrail();
        updatePointsAndSpores();

        // Keep loop running if points or spores are still active and decaying
        if (points.length > 0 || spores.length > 0) {
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
