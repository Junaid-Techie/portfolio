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

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
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

    // --- Cursor Pixel & Particle Effect ---
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

    const ctx = canvas.getContext('2d');
    let particlesArray = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const mouse = {
        x: undefined,
        y: undefined,
    }

    let isMoving = false;
    let timeout;

    function handleInteraction(event) {
        if (event.touches) {
            mouse.x = event.touches[0].clientX;
            mouse.y = event.touches[0].clientY;
        } else {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        }
        
        isMoving = true;
        
        // Spawn more particles for a denser trail
        for (let i = 0; i < 4; i++) {
            particlesArray.push(new Particle());
        }

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            isMoving = false;
        }, 100);
    }

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchmove', handleInteraction);

    class Particle {
        constructor() {
            this.x = mouse.x + (Math.random() * 14 - 7);
            this.y = mouse.y + (Math.random() * 14 - 7);
            this.size = Math.random() * 5 + 2; // Made particles larger
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            
            // Theme colors: primary, secondary, accent, white
            const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#ffffff'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.life = 100;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life -= 1.5; // Slower fade
            if (this.size > 0.1) this.size -= 0.03; // Slower shrink
        }
        draw() {
            ctx.fillStyle = this.color;
            // Add glowing effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.globalAlpha = Math.max(0, this.life / 100);
            
            // Draw pixel (square)
            ctx.fillRect(this.x, this.y, this.size, this.size);
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0; // Reset shadow
        }
    }

    function handleParticles() {
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
            
            if (particlesArray[i].life <= 0 || particlesArray[i].size <= 0.1) {
                particlesArray.splice(i, 1);
                i--;
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        handleParticles();
        requestAnimationFrame(animateParticles);
    }

    animateParticles();
});
