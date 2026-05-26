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
    ambientCanvas.style.transform = 'translate3d(0, 0, 0)'; // Force GPU compositing layer to prevent scroll repaint lag
    ambientCanvas.style.willChange = 'transform';
    document.body.appendChild(ambientCanvas);

    const actx = ambientCanvas.getContext('2d');
    let ambientParticles = [];
    const maxAmbientParticles = 850; // Massively raised density so particles alone form the wave
    let wavePhase = 0; // Wave timing index for ambient auroral ribbons and god rays

    // Stable viewport dimensions to prevent layout jumping on mobile scroll (e.g. from address bar hiding/showing)
    let referenceWidth = window.innerWidth;
    let referenceHeight = window.innerHeight;

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
                { name: 'large', radius: 24, blur: 18 },
                { name: 'medium', radius: 12, blur: 10 },
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

    // High-performance offscreen templates for standard spores (removes 850+ radial gradient creations per frame)
    const sporeTemplates = {};
    function createSporeTemplates() {
        const colors = [
            { name: 'gold', r: 207, g: 171, b: 58, baseAlpha: 1.0 },
            { name: 'green', r: 115, g: 140, b: 102, baseAlpha: 0.65 }
        ];
        
        colors.forEach(c => {
            // Pre-render small, medium, and large spore gradients
            const sizes = [
                { name: 'large', sizeFactor: 4.5 },
                { name: 'medium', sizeFactor: 3.0 },
                { name: 'small', sizeFactor: 1.5 }
            ];
            
            sizes.forEach(s => {
                const radius = s.sizeFactor * 2.5; // Matches this.size * 2.5
                const pad = radius * 2 + 4;
                const half = pad / 2;
                
                const offscreen = document.createElement('canvas');
                offscreen.width = pad;
                offscreen.height = pad;
                const octx = offscreen.getContext('2d');
                
                const gradient = octx.createRadialGradient(half, half, 0, half, half, radius);
                gradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${c.baseAlpha})`);
                gradient.addColorStop(0.35, `rgba(${c.r}, ${c.g}, ${c.b}, ${c.baseAlpha})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                octx.fillStyle = gradient;
                octx.beginPath();
                octx.arc(half, half, radius, 0, Math.PI * 2);
                octx.fill();
                
                sporeTemplates[`${c.name}_${s.name}`] = {
                    canvas: offscreen,
                    halfSize: half
                };
            });
        });
    }
    createSporeTemplates();

    class AmbientParticle {
        constructor(isInit = false) {
            // Distribute across the sweeping wave
            this.x = isInit 
                ? Math.random() * referenceWidth 
                : -40 - Math.random() * 100; // Spawn slightly off-screen left when recycled
                
            this.z = Math.random() * 0.84 + 0.16; // 3D Depth Layer factor
            
            // Choose ribbon assignment based on depth (z) to match color rendering
            this.ribbonType = this.z > 0.55 ? 1 : 2; 

            // Calculate base curve position based on ribbon assignment (exact PS5 homescreen overlapping shape)
            let curveBaseY = 0;
            if (this.ribbonType === 1) {
                curveBaseY = (referenceHeight * 0.73) + Math.sin(this.x * 0.0015 + wavePhase) * 100 + Math.cos(this.x * 0.003 - wavePhase * 0.5) * 30;
            } else {
                curveBaseY = (referenceHeight * 0.80) + Math.sin(this.x * 0.0015 + wavePhase + Math.PI) * 80 + Math.cos(this.x * 0.003 - (wavePhase + Math.PI) * 0.5) * 24;
            }
            
            // Create a dense cluster around the curve with Gaussian-like spread
            const spreadFactor = (Math.random() + Math.random() + Math.random() - 1.5); 
            const spreadAmplitude = referenceHeight * 0.12; // Tightened cluster so particles form the visible wave
            this.offsetY = spreadFactor * spreadAmplitude;
            this.y = curveBaseY + this.offsetY;
            
            // Build three highly focused depth-of-field layers for the wave
            if (this.z < 0.38) {
                // Background Spores: Small, slow, distant spores
                this.isBokeh = Math.random() > 0.5; // 50% are beautiful soft background bokeh
                this.isFilament = false;
                this.size = (Math.random() * 4.0 + 2.0) * this.z; // Distant background particles
                this.baseSpeedX = (Math.random() * 0.06 + 0.02); // Drift right lazily
            } else if (this.z > 0.76) {
                // Foreground Embers: Tiny, bright, sharp specs of gold
                this.isBokeh = false;
                this.isFilament = false;
                this.isShiny = Math.random() > 0.3; // 70% of foreground are intensely shiny
                this.size = (Math.random() * 1.5 + 0.8) * this.z;
                this.baseSpeedX = (Math.random() * 0.3 + 0.15); // Faster foreground sweep
            } else {
                // Midground: Classic spores, rotating curved filaments, and floating out-of-focus bokeh orbs
                this.isBokeh = Math.random() < 0.20; // 20% are gorgeous out-of-focus bokeh orbs
                this.isFilament = !this.isBokeh && Math.random() < 0.08;
                this.size = this.isBokeh 
                    ? (Math.random() * 14.0 + 8.0) * this.z // Larger size for premium large bokeh orbs
                    : (Math.random() * 5.0 + 2.0) * this.z;
                this.baseSpeedX = (Math.random() * 0.15 + 0.08); // Steady midground sweep
            }

            this.speedX = this.baseSpeedX * this.z;
            this.speedY = (Math.random() - 0.5) * 0.04; 
            
            this.angle = Math.random() * Math.PI * 2;
            this.angleSpeed = Math.random() * 0.008 + 0.003;
            
            // Gentle slow vertical bobbing to simulate deep ocean drag
            this.bobPhase = Math.random() * Math.PI * 2;
            this.bobSpeed = Math.random() * 0.003 + 0.001; // Extremely slow and hypnotic
            this.bobAmplitude = (Math.random() * 12.0 + 4.0) * this.z; // Significant vertical bobbing for ocean feel

            // Curved filaments rotation
            this.rot = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.012;

            this.baseOpacity = (Math.random() * 0.25 + 0.12) * this.z;
            this.opacity = 0; // Fade in gently
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 0.006 + 0.002; 
        }

        update() {
            // Calculate continuous organic fluid turbulence currents
            const time = wavePhase * 5; // Slower time scaling for deep fluid feel
            const noiseX = Math.sin(this.y * 0.004 + time * 0.15) * Math.cos(this.x * 0.003 - time * 0.08) * 0.45;
            const noiseY = Math.cos(this.x * 0.003 + time * 0.12) * Math.sin(this.y * 0.002 - time * 0.05) * 0.65;

            // Apply turbulence + sweeping vector
            this.x += this.speedX + noiseX;
            
            // Ride their assigned ribbon wave with deep ocean swell physics
            let curveBaseY = 0;
            // Slope so the wave starts very low (offscreen bottom-left) and rises into the lower-right quadrant
            const slopeRise = (this.x / referenceWidth) * (referenceHeight * 0.45); 
            
            if (this.ribbonType === 1) {
                // Starts at 125% height (off bottom edge) on left, rises to ~80% on right
                curveBaseY = (referenceHeight * 1.25) - slopeRise + Math.sin(this.x * 0.0012 + wavePhase) * 120 + Math.cos(this.x * 0.0015 - wavePhase * 0.5) * 60;
            } else {
                curveBaseY = (referenceHeight * 1.35) - slopeRise + Math.sin(this.x * 0.001 + wavePhase + Math.PI) * 100 + Math.cos(this.x * 0.0015 - (wavePhase + Math.PI) * 0.5) * 45;
            }
            
            this.bobPhase += this.bobSpeed;
            // Add vertical bobbing AND fluid noiseY swirl to break the rigid wave path
            this.y = curveBaseY + this.offsetY + Math.sin(this.bobPhase) * this.bobAmplitude + noiseY * 4.0;

            // Slowly rotate filaments
            if (this.isFilament) {
                this.rot += this.rotSpeed;
            }

            // Muted organic breathing pulse + firefly shimmering twinkles
            this.pulsePhase += this.pulseSpeed;
            let pulseFactor = (Math.sin(this.pulsePhase) + 1) / 2; // 0 to 1
            let shimmer = Math.sin(this.pulsePhase * 3.6) * 0.18; // Twitch sparkle
            
            if (this.isShiny) {
                // Intense chaotic twinkling for shiny PS5 particles
                pulseFactor = (Math.sin(this.pulsePhase * 8.0) + 1) / 2;
                shimmer = Math.sin(this.pulsePhase * 15.0) * 0.5;
            }
            
            this.opacity = Math.max(0, this.baseOpacity * (0.65 + pulseFactor * 0.35) + shimmer);

            // Recycle if particle drifts far outside bounds (off right side, or too far up/down)
            if (this.x > referenceWidth + 120 || this.y < -100 || this.y > referenceHeight + 100) {
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
            } else if (this.y > referenceHeight - bottomFadeDist) {
                edgeFade *= Math.max(0, (referenceHeight - this.y) / bottomFadeDist);
            }

            if (this.x < sideFadeDist) {
                edgeFade *= Math.max(0, this.x / sideFadeDist);
            } else if (this.x > referenceWidth - sideFadeDist) {
                edgeFade *= Math.max(0, (referenceWidth - this.x) / sideFadeDist);
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
                // Use pre-rendered offscreen templates instead of expensive per-frame radial gradients
                const colorType = this.z > 0.55 ? 'gold' : 'green';
                let sizeType = 'small';
                if (this.size > 3.5) sizeType = 'large';
                else if (this.size > 2.0) sizeType = 'medium';
                
                const template = sporeTemplates[`${colorType}_${sizeType}`];
                if (template) {
                    actx.save();
                    // Draw the template scaled to the exact particle size
                    actx.globalAlpha = renderOpacity;
                    
                    // We dynamically scale the template to match the exact mathematical size
                    // Since templates are pre-rendered at standard sizes, we use drawImage with scaling
                    const targetRadius = this.size * 2.5;
                    actx.translate(this.x, this.y);
                    actx.drawImage(
                        template.canvas, 
                        -targetRadius, 
                        -targetRadius, 
                        targetRadius * 2, 
                        targetRadius * 2
                    );
                    actx.restore();
                }
                
                // Pure white hot core for shiny particles
                if (this.isShiny) {
                    actx.fillStyle = `rgba(255, 255, 255, ${renderOpacity * 1.5})`;
                    actx.beginPath();
                    actx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
                    actx.fill();
                }

                // AAA Premium Menu Detail: Render soft golden cross-hair lens flares on the brightest foreground specifications when they peak
                if ((this.isShiny || this.z > 0.8) && renderOpacity > 0.5) {
                    actx.beginPath();
                    actx.strokeStyle = `rgba(255, 255, 255, ${(renderOpacity - 0.5) * 1.5})`;
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
        
        // Only trigger viewport reference shifts if width changes by >100px (e.g. orientation changes)
        // This prevents particles from jumping during mobile scroll events when the URL address bar toggles.
        if (Math.abs(window.innerWidth - referenceWidth) > 100) {
            referenceWidth = window.innerWidth;
            referenceHeight = window.innerHeight;
        }
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


    // Helper: Draw volumetric spotlight beam fanning from top-left diagonally down-right (Underwater Sun Rays)
    function drawVolumetricLight(ctx, width, height, phase) {
        ctx.save();
        
        // Base angle for the sunlight piercing directly from extreme top-left
        const baseAngle = 0.78; // roughly 45 degrees downward
        const beamLen = Math.max(width, height) * 1.8; 
        
        // High fidelity sharp rays (much lower blur for realism)
        ctx.filter = 'blur(12px)'; 
        
        // Draw 8 distinct, highly detailed overlapping rays
        const numRays = 8;
        for (let i = 0; i < numRays; i++) {
            // Offset phase for each ray so they sway and pulse independently
            const rayPhase = phase + (i * 2.1);
            
            // Individual ray properties
            const angleOffset = Math.sin(rayPhase * 0.15) * 0.05 + (i - numRays/2) * 0.06;
            const beamAngle = baseAngle + angleOffset;
            
            const endX = Math.cos(beamAngle) * beamLen;
            const endY = Math.sin(beamAngle) * beamLen;
            
            // Sharp, distinct widths for the rays
            const spread = width * (0.02 + Math.abs(Math.sin(rayPhase * 0.3)) * 0.06);
            
            const gradient = ctx.createLinearGradient(0, 0, endX, endY);
            
            // Individual pulsing opacity, peaking slightly higher for high-fidelity look
            const rayOpacity = 0.08 + Math.sin(rayPhase * 0.4) * 0.06;
            
            // Add gradient stops with a tiny bit of white-hot core at the origin
            gradient.addColorStop(0, `rgba(255, 230, 150, ${rayOpacity * 4.0})`); // Hot core
            gradient.addColorStop(0.15, `rgba(207, 171, 58, ${rayOpacity * 2.5})`);
            gradient.addColorStop(0.4, `rgba(207, 171, 58, ${rayOpacity * 0.8})`);
            gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            
            // Draw the ray cone
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const p1x = endX - spread * Math.sin(beamAngle);
            const p1y = endY + spread * Math.cos(beamAngle);
            const p2x = endX + spread * Math.sin(beamAngle);
            const p2y = endY - spread * Math.cos(beamAngle);
            
            ctx.lineTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.closePath();
            ctx.fill();
        }
        
        // Draw one massive, incredibly soft ambient glow to simulate light scattering in water
        ctx.filter = 'blur(120px)';
        const bgAngle = baseAngle + Math.sin(phase * 0.08) * 0.02;
        const bgEndX = Math.cos(bgAngle) * beamLen;
        const bgEndY = Math.sin(bgAngle) * beamLen;
        const bgSpread = width * 0.95;
        
        const bgGradient = ctx.createLinearGradient(0, 0, bgEndX, bgEndY);
        const bgOpacity = 0.12 + Math.sin(phase * 0.2) * 0.02;
        bgGradient.addColorStop(0, `rgba(207, 171, 58, ${bgOpacity * 2.2})`);
        bgGradient.addColorStop(0.4, `rgba(207, 171, 58, ${bgOpacity * 0.6})`);
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = bgGradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(bgEndX - bgSpread * Math.sin(bgAngle), bgEndY + bgSpread * Math.cos(bgAngle));
        ctx.lineTo(bgEndX + bgSpread * Math.sin(bgAngle), bgEndY - bgSpread * Math.cos(bgAngle));
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    function animateAmbientSpores() {
        actx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);

        // Increment wave phase for slow particle flow
        wavePhase += 0.0015;

        // Render Volumetric Light Shaft (Breathing top-left spotlight beam cone overlay)
        drawVolumetricLight(actx, referenceWidth, referenceHeight, wavePhase);

        for (let i = 0; i < ambientParticles.length; i++) {
            const p = ambientParticles[i];
            
            // Completely unaffected by the cursor, as requested, to maintain a pure PS5 home screen atmosphere
            p.update();
            p.draw();
        }

        requestAnimationFrame(animateAmbientSpores);
    }
    animateAmbientSpores();
