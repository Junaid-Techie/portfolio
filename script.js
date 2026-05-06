document.addEventListener('DOMContentLoaded', () => {
    // Navigation Scroll Effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

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

    // Custom SVG Cursor matching primary color (#3b82f6)
    const cursorSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="4" x2="12" y2="20"></line><line x1="4" y1="12" x2="20" y2="12"></line></svg>';
    const cursorUrl = `url("data:image/svg+xml,${encodeURIComponent(cursorSvg)}") 12 12, crosshair`;

    const cursorStyle = document.createElement('style');
    cursorStyle.innerHTML = `
        body, html { cursor: ${cursorUrl} !important; }
        a, button, .hamburger, .fab, .fas, a * { cursor: pointer !important; }
    `;
    document.head.appendChild(cursorStyle);

    const ctx = canvas.getContext('2d');
    let pixelsArray = [];
    const gridSize = 25; // Increased pixel size to 25px (exactly 4 fit in the 50px background grid)

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let lastX = null;
    let lastY = null;

    function handleInteraction(event) {
        let currentX, currentY;
        if (event.touches) {
            currentX = event.touches[0].clientX;
            currentY = event.touches[0].clientY;
        } else {
            currentX = event.clientX;
            currentY = event.clientY;
        }

        if (lastX === null || lastY === null) {
            lastX = currentX;
            lastY = currentY;
        }

        // Calculate distance and densely interpolate to prevent skipping pixels
        let dx = currentX - lastX;
        let dy = currentY - lastY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        // Sample at 1/4th the grid size to ensure we hit every single grid cell along the path
        let steps = Math.max(1, Math.ceil(distance / (gridSize / 4)));

        for (let i = 0; i <= steps; i++) {
            let x = lastX + (dx * i) / steps;
            let y = lastY + (dy * i) / steps;

            let gridX = Math.floor(x / gridSize) * gridSize;
            let gridY = Math.floor(y / gridSize) * gridSize;

            // Add pixel under calculated position
            addPixel(gridX, gridY);

            // Add random scattered adjacent pixels for a "digital" trail effect
            if (Math.random() > 0.7) { // slightly less scattering since pixels are bigger now
                let offsetX = (Math.floor(Math.random() * 3) - 1) * gridSize;
                let offsetY = (Math.floor(Math.random() * 3) - 1) * gridSize;
                addPixel(gridX + offsetX, gridY + offsetY);
            }
        }

        lastX = currentX;
        lastY = currentY;
    }

    // Reset last position when mouse leaves
    window.addEventListener('mouseout', () => {
        lastX = null;
        lastY = null;
    });

    function addPixel(x, y) {
        let existingPixel = pixelsArray.find(p => p.x === x && p.y === y);
        if (existingPixel) {
            existingPixel.life = 100; // Reset life if already active
        } else {
            pixelsArray.push(new GridPixel(x, y));
        }
    }

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchmove', handleInteraction);

    class GridPixel {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = gridSize;

            // Only using the dark blue color (primary)
            this.color = 'rgba(59, 130, 246, 0.4)';
            this.life = 100;
        }
        update() {
            this.life -= 1.5; // Fade speed
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = Math.max(0, this.life / 100);

            // Add glowing effect
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#3b82f6';

            // Draw pixel perfectly aligned inside the background grid lines (+1px offset)
            ctx.fillRect(this.x + 1, this.y + 1, this.size - 1, this.size - 1);

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0; // Reset shadow
        }
    }

    function handlePixels() {
        for (let i = 0; i < pixelsArray.length; i++) {
            pixelsArray[i].update();
            pixelsArray[i].draw();

            if (pixelsArray[i].life <= 0) {
                pixelsArray.splice(i, 1);
                i--;
            }
        }
    }

    function animatePixels() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        handlePixels();
        requestAnimationFrame(animatePixels);
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
                        // Using Mailcheck.ai - A completely free, unlimited API that requires NO API keys!
                        // It checks if the domain actually has active mail servers (MX records).
                        const response = await fetch(`https://api.mailcheck.ai/email/${val}`);
                        const data = await response.json();
                        
                        // If the domain doesn't have an MX record, it physically cannot receive email.
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
                // NOTE: Go to https://web3forms.com/ and enter your email to get your free Access Key.
                const web3formsAccessKey = 'fbaad4f1-69f4-4065-86d4-7ad42bf12c5b'; 

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
});
