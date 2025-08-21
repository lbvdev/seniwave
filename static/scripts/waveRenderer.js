window.addEventListener('load', () => {
    import('/static/scripts/waveSvg.js').then(({ svgString }) => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let width, height;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = 540;
        }
        resize();
        window.addEventListener('resize', resize);

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
        const paths = svgDoc.querySelectorAll("path");

        const lines = [];

        paths.forEach(path => {
            const total = path.getTotalLength();
            const points = [];
            const segments = 50;

            for (let i = 0; i <= segments; i++) {
                const pt = path.getPointAtLength((i / segments) * total);
                points.push({ x: pt.x, y: pt.y, origY: pt.y });
            }

            lines.push(points);
        });

        const pointer = { x: -999, y: -999 };
        let mouseTimeout;
        canvas.addEventListener('mousemove', e => {
            if (mouseTimeout) return;
            mouseTimeout = setTimeout(() => {
                const rect = canvas.getBoundingClientRect();
                pointer.x = e.clientX - rect.left;
                pointer.y = e.clientY - rect.top;
                if (!animationId && isCanvasVisible()) {
                    draw();
                }
                mouseTimeout = null;
            }, 16);
        });
        canvas.addEventListener('mouseleave', () => {
            pointer.x = -999;
            pointer.y = -999;
        });
        let animationId = null;
        let isVisible = true;
        let lastTime = 0;
        const targetFPS = 120;
        const frameInterval = 1000 / targetFPS;
        function isCanvasVisible() {
            const rect = canvas.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        }
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
        function draw(currentTime = 0) {
            if (!isCanvasVisible()) {
                isVisible = false;
                animationId = null;
                return;
            }
            if (currentTime - lastTime < frameInterval) {
                animationId = requestAnimationFrame(draw);
                return;
            }
            lastTime = currentTime;
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
                        p.y += (p.origY - p.y) * 0.2;
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
        if (isCanvasVisible()) {
            draw();
        }
    });
});