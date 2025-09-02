window.addEventListener('load', () => {
    import('/static/scripts/waveSvg.js').then(({ svgString }) => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let width, height;

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
        const paths = svgDoc.querySelectorAll("path");

        const lines = [];
        
        const pointer = { x: -999, y: -999 };
        let mouseTimeout;
        
        let autoWaveTime = 0;
        let autoWaveSpeed = 0.7;
        let autoWaveAmplitude = 2;
        let autoWaveWidth = 770;
        
        let animationId = null;
        let isVisible = true;
        let lastTime = 0;
        const targetFPS = 120;
        const frameInterval = 1000 / targetFPS;
        
        function isCanvasVisible() {
            const rect = canvas.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        }
        
        function recalculateSvgPoints(topOffset = 0) {
            lines.length = 0;
            
            paths.forEach(path => {
                const total = path.getTotalLength();
                const points = [];
                const segments = 50;

                for (let i = 0; i <= segments; i++) {
                    const pt = path.getPointAtLength((i / segments) * total);
                    const scaledX = (pt.x / 2160) * width;

                    const adjustedY = pt.y + topOffset;
                    points.push({ x: scaledX, y: adjustedY, origY: adjustedY });
                }

                lines.push(points);
            });
        }
        
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = Math.round(width * 0.25);
            const topOffset = 70;
            
            recalculateSvgPoints(topOffset);
        }
        
        function draw(currentTime = 0) {
            if (currentTime - lastTime < frameInterval) {
                animationId = requestAnimationFrame(draw);
                return;
            }
            lastTime = currentTime;
            
            autoWaveTime += autoWaveSpeed;
            
            autoWaveTime = autoWaveTime % (width + autoWaveWidth);
            
            ctx.clearRect(0, 0, width, height);
            lines.forEach(points => {
                points.forEach(p => {
                    const dx = p.x - pointer.x;
                    const dy = p.origY - pointer.y;
                    const dist = Math.hypot(dx, dy);
                    const maxDist = 120;
                    
                    if (dist < maxDist) {
                        const force = ((maxDist - dist) / maxDist) * 200;
                        const angle = Math.atan2(dy, dx);
                        const targetY = p.origY + Math.sin(angle) * force;
                        p.y += (targetY - p.y) * 0.05;
                    } else {
                        const waveX = (p.x + autoWaveTime) % (width + autoWaveWidth);
                        const wavePhase = (p.x + autoWaveTime) * 0.02;
                        const waveForce = Math.sin(wavePhase) * autoWaveAmplitude;
                        
                        const diagonalPhase = (p.x + autoWaveTime) * 0.015;
                        const diagonalOffset = Math.sin(diagonalPhase) * 20;
                        
                        const targetY = p.origY + waveForce + diagonalOffset;
                        p.y += (targetY - p.y) * 0.06;
                    }
                    
                    p.y = Math.max(0, Math.min(height, p.y));
                });
                
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    const cx = (p1.x + p2.x) / 2;
                    const cy = (p1.y + p2.y) / 2;
                    ctx.quadraticCurveTo(p1.x, p1.y, cx, cy);
                }
                ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
                ctx.strokeStyle = "#5F00FF";
                ctx.lineWidth = 2;
                ctx.stroke();
            });
            animationId = requestAnimationFrame(draw);
        }
        
        document.addEventListener('mousemove', e => {
            if (mouseTimeout) return;
            mouseTimeout = setTimeout(() => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                if (mouseX >= rect.left && mouseX <= rect.right && 
                    mouseY >= rect.top && mouseY <= rect.bottom) {
                    
                    pointer.x = mouseX - rect.left;
                    pointer.y = mouseY - rect.top;
                    
                    if (!animationId && isCanvasVisible()) {
                        draw();
                    }
                } else {
                    pointer.x = -999;
                    pointer.y = -999;
                }
                
                mouseTimeout = null;
            }, 16);
        });
        
        document.addEventListener('mouseleave', () => {
            pointer.x = -999;
            pointer.y = -999;
        });
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    isVisible = true;
                    if (!animationId) {
                        draw();
                    }
                } else {
                    isVisible = false;
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                }
            });
        }, {
            threshold: 0.1
        });
        observer.observe(canvas);
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const visible = isCanvasVisible();
                if (visible !== isVisible) {
                    isVisible = visible;
                    if (isVisible && !animationId) {
                        draw();
                    }
                }
            }, 100);
        });
        
        recalculateSvgPoints();
        draw();
        resize();
        window.addEventListener('resize', resize);
    });
});