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

    const ctx = canvas.getContext('2d');
    let pixelsArray = [];
    const gridSize = 50; // Matches CSS .bg-grid background-size

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function handleInteraction(event) {
        let currentX, currentY;
        if (event.touches) {
            currentX = event.touches[0].clientX;
            currentY = event.touches[0].clientY;
        } else {
            currentX = event.clientX;
            currentY = event.clientY;
        }
        
        // Calculate grid cell coordinate
        let gridX = Math.floor(currentX / gridSize) * gridSize;
        let gridY = Math.floor(currentY / gridSize) * gridSize;
        
        // Add pixel under cursor
        addPixel(gridX, gridY);
        
        // Add random scattered adjacent pixels for a "digital" trail effect
        for (let i = 0; i < 2; i++) {
            if (Math.random() > 0.5) {
                let offsetX = (Math.floor(Math.random() * 3) - 1) * gridSize;
                let offsetY = (Math.floor(Math.random() * 3) - 1) * gridSize;
                addPixel(gridX + offsetX, gridY + offsetY);
            }
        }
    }

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
            
            // Theme colors matching the gradient text
            const colors = ['rgba(59, 130, 246, 0.4)', 'rgba(139, 92, 246, 0.4)', 'rgba(16, 185, 129, 0.3)'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.life = 100;
        }
        update() {
            this.life -= 1.5; // Fade speed
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = Math.max(0, this.life / 100);
            // Draw pixel perfectly aligned inside the background grid lines (+1px offset)
            ctx.fillRect(this.x + 1, this.y + 1, this.size - 1, this.size - 1);
            ctx.globalAlpha = 1;
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
});
