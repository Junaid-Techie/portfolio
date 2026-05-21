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

    // --- Cursor Grid Trace Effect ---
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    // Custom SVG Cursor: Iconic Fireflies Emblem from The Last of Us, styled and colored in gold (#cfab3a) with a soft backing glow
    const cursorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <!-- Glow Backing -->
        <line x1="16" y1="6" x2="16" y2="26" stroke="rgba(207, 171, 58, 0.25)" stroke-width="3.5" stroke-linecap="round"></line>
        <path d="M16,10 C23,5 29,9 28,15 C27,18 22,19 16,16" stroke="rgba(207, 171, 58, 0.25)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="M16,10 C9,5 3,9 4,15 C5,18 10,19 16,16" stroke="rgba(207, 171, 58, 0.25)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
        
        <!-- Sharp Foreground lines -->
        <line x1="16" y1="6" x2="16" y2="26" stroke="%23cfab3a" stroke-width="1.8" stroke-linecap="round"></line>
        <!-- Antennae -->
        <path d="M16,6 C14.5,3.5 13,3 13,2" stroke="%23cfab3a" stroke-width="1.2" stroke-linecap="round"></path>
        <path d="M16,6 C17.5,3.5 19,3 19,2" stroke="%23cfab3a" stroke-width="1.2" stroke-linecap="round"></path>
        <!-- Upper Wings -->
        <path d="M16,10 C22,6 27,9 26,14 C25,16.5 21,17.5 16,15.5" stroke="%23cfab3a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="M16,10 C10,6 5,9 6,14 C7,16.5 11,17.5 16,15.5" stroke="%23cfab3a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
        <!-- Lower Wings -->
        <path d="M16,16.5 C20.5,18 24,19.5 24,22 C24,24 20,23.5 16,21.5" stroke="%23cfab3a" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="M16,16.5 C11.5,18 8,19.5 8,22 C8,24 12,23.5 16,21.5" stroke="%23cfab3a" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`;
    const cursorUrl = `url("data:image/svg+xml,${cursorSvg.replace(/\n\s*/g, '')}") 16 2, crosshair`;

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

    window.addEventListener('mousemove', (e) => {
        updateTargetPosition(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
            updateTargetPosition(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    // Reset target positions when mouse leaves viewport
    window.addEventListener('mouseout', () => {
        targetX = null;
        targetY = null;
        hasNewPosition = false;
    });

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

        // Draw a dense, continuous stream of tiny square pixels along the cursor movement path
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Interpolate at very small steps (e.g. 2px to 3px) to ensure no gaps (breaking) in the trail
            // A small step size ensures perfect continuity regardless of mouse swipe speed
            const stepSize = 2.5;
            const steps = Math.max(1, Math.ceil(dist / stepSize));

            for (let j = 0; j <= steps; j++) {
                const t = j / steps;
                const x = p1.x + dx * t;
                const y = p1.y + dy * t;

                // Relative position in the points array (0 = tail, 1 = head)
                const relativePos = (i - 1 + t) / (points.length - 1);
                // Compute combined life/age factor
                const age = relativePos * ((p1.life + p2.life) / 2);

                if (age <= 0.02) continue;

                // Taper pixel size: 4px at the head down to 1.2px at the tail
                const size = 1.2 + age * 2.8;

                // 1. Soft atmospheric gold glow around the pixels
                ctx.fillStyle = `rgba(207, 171, 58, ${age * 0.1})`;
                ctx.fillRect(x - size, y - size, size * 2, size * 2);

                // 2. Continuous golden pixel core (distinct small pixel blocks)
                ctx.fillStyle = `rgba(207, 171, 58, ${age * 0.8})`;
                ctx.fillRect(x - size / 2, y - size / 2, size, size);

                // 3. Ultra-bright hot core inside the pixel at the front (head) of the trail
                if (age > 0.6) {
                    const coreSize = size * 0.45;
                    ctx.fillStyle = `rgba(255, 255, 255, ${age * 0.95})`;
                    ctx.fillRect(x - coreSize / 2, y - coreSize / 2, coreSize, coreSize);
                }
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
    }
});
