if (typeof window.TagPhysics === 'undefined') {
    window.TagPhysics = class TagPhysics {
    constructor(container) {
        this.container = $(container);
        this.tags = this.container.find('span.gravity');
        this.gravity = 0.01;
        this.friction = 0.95;
        this.bounce = 0.9;
        this.collisionFriction = 0.9;
        this.physics = [];
        this.isDragging = false;
        this.dragTag = null;
        this.lastMousePos = { x: 0, y: 0 };
        this.velocityHistory = [];
        
        this.init();
    }
    
    init() {
        const containerRect = this.container[0].getBoundingClientRect();
        
        this.tags.each((i, tag) => {
            const $tag = $(tag);
            const rect = $tag[0].getBoundingClientRect();
            
            this.physics.push({
                element: $tag,
                x: Math.random() * (containerRect.width - rect.width),
                y: containerRect.height - rect.height - Math.random() * 50,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.3,
                width: rect.width,
                height: rect.height,
                isDragging: false
            });
        });
        
        this.setupEvents();
        this.startAnimation();
    }
    
    setupEvents() {
        this.tags.on('mousedown', (e) => {
            this.startDrag(e);
        });
        
        $(document).on('mousemove', (e) => {
            if (this.isDragging) {
                this.updateDrag(e);
            }
        });
        
        $(document).on('mouseup', () => {
            this.endDrag();
        });
    }
    
    startDrag(e) {
        this.isDragging = true;
        const tagIndex = this.tags.index(e.target);
        this.dragTag = this.physics[tagIndex];
        this.dragTag.isDragging = true;
        this.dragTag.vx = 0;
        this.dragTag.vy = 0;
        
        const containerRect = this.container[0].getBoundingClientRect();
        this.lastMousePos = {
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top
        };
        this.velocityHistory = [];
    }
    
    updateDrag(e) {
        if (!this.dragTag) return;
        
        const containerRect = this.container[0].getBoundingClientRect();
        const currentMousePos = {
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top
        };
        
        const mouseVelocity = {
            x: currentMousePos.x - this.lastMousePos.x,
            y: currentMousePos.y - this.lastMousePos.y
        };
        
        this.velocityHistory.push(mouseVelocity);
        if (this.velocityHistory.length > 10) {
            this.velocityHistory.shift();
        }
        
        const newX = Math.max(0, Math.min(currentMousePos.x - this.dragTag.width / 2, containerRect.width - this.dragTag.width));
        const newY = Math.max(0, Math.min(currentMousePos.y - this.dragTag.height / 2, containerRect.height - this.dragTag.height));
        
        this.dragTag.x = newX;
        this.dragTag.y = newY;
        
        this.lastMousePos = currentMousePos;
    }
    
    endDrag() {
        if (this.dragTag && this.velocityHistory.length > 0) {
            const recentVelocities = this.velocityHistory.slice(-5);
            const avgVelocity = recentVelocities.reduce((acc, vel) => ({
                x: acc.x + vel.x,
                y: acc.y + vel.y
            }), { x: 0, y: 0 });
            
            this.dragTag.vx = (avgVelocity.x / recentVelocities.length) * 1.5;
            this.dragTag.vy = (avgVelocity.y / recentVelocities.length) * 1.5;
            this.dragTag.isDragging = false;
            this.dragTag = null;
        }
        this.isDragging = false;
        this.velocityHistory = [];
    }
    
    updatePhysics() {
        const containerRect = this.container[0].getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        this.physics.forEach(physics => {
            if (physics.isDragging) return;
            
            physics.vy += this.gravity;
            physics.x += physics.vx;
            physics.y += physics.vy;
            
            if (physics.x < 0) {
                physics.x = 0;
                physics.vx *= -this.bounce;
                physics.vx *= this.friction;
            }
            if (physics.x + physics.width > containerWidth) {
                physics.x = containerWidth - physics.width;
                physics.vx *= -this.bounce;
                physics.vx *= this.friction;
            }
            if (physics.y < 0) {
                physics.y = 0;
                physics.vy *= -this.bounce;
                physics.vy *= this.friction;
            }
            if (physics.y + physics.height > containerHeight) {
                physics.y = containerHeight - physics.height;
                physics.vy *= -this.bounce;
                physics.vy *= this.friction;
            }
        });
        
        this.checkCollisions();
    }
    
    checkCollisions() {
        for (let i = 0; i < this.physics.length; i++) {
            for (let j = i + 1; j < this.physics.length; j++) {
                const a = this.physics[i];
                const b = this.physics[j];
                
                if (a.isDragging && b.isDragging) continue;
                
                const aLeft = a.x;
                const aRight = a.x + a.width;
                const aTop = a.y;
                const aBottom = a.y + a.height;
                
                const bLeft = b.x;
                const bRight = b.x + b.width;
                const bTop = b.y;
                const bBottom = b.y + b.height;
                
                if (aRight > bLeft && aLeft < bRight && aBottom > bTop && aTop < bBottom) {
                    const overlapX = Math.min(aRight - bLeft, bRight - aLeft);
                    const overlapY = Math.min(aBottom - bTop, bBottom - aTop);
                    
                    if (overlapX < overlapY) {
                        const separationX = overlapX * 0.5;
                        if (a.x < b.x) {
                            if (!a.isDragging) a.x -= separationX;
                            if (!b.isDragging) b.x += separationX;
                        } else {
                            if (!a.isDragging) a.x += separationX;
                            if (!b.isDragging) b.x -= separationX;
                        }
                        
                        if (!a.isDragging) {
                            a.vx *= -0.4;
                            a.vx *= this.collisionFriction;
                        }
                        if (!b.isDragging) {
                            b.vx *= -0.4;
                            b.vx *= this.collisionFriction;
                        }
                    } else {
                        const separationY = overlapY * 0.5;
                        if (a.y < b.y) {
                            if (!a.isDragging) a.y -= separationY;
                            if (!b.isDragging) b.y += separationY;
                        } else {
                            if (!a.isDragging) a.y += separationY;
                            if (!b.isDragging) b.y -= separationY;
                        }
                        
                        if (!a.isDragging) {
                            a.vy *= -0.4;
                            a.vy *= this.collisionFriction;
                        }
                        if (!b.isDragging) {
                            b.vy *= -0.4;
                            b.vy *= this.collisionFriction;
                        }
                    }
                }
            }
        }
    }
    
    render() {
        this.physics.forEach(physics => {
            gsap.set(physics.element, {
                x: physics.x,
                y: physics.y
            });
        });
    }
    
    startAnimation() {
        const animate = () => {
            if (this.destroyed) return;
            this.updatePhysics();
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        this.animationId = requestAnimationFrame(animate);
    }
    
    destroy() {
        this.destroyed = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        $(document).off('mousemove mouseup');
    }
};
}

$(document).ready(() => {
    $('.tag-wrapper').each((i, wrapper) => {
        if (wrapper.tagPhysicsInstance) {
            wrapper.tagPhysicsInstance.destroy();
        }
        wrapper.tagPhysicsInstance = new window.TagPhysics(wrapper);
    });
});