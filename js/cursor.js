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
