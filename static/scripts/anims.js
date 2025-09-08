gsap.registerPlugin(SplitText) 
let split, animation;

function initAnimations() {
    $('.split').each(function() {
        const split = new SplitText(this, {
            type: "lines",
            ignore: ".no-split"
        });

        gsap.from(split.lines, {
            rotationX: -100,
            transformOrigin: "50% 50% -160px",
            opacity: 0,
            duration: 0.8, 
            ease: "power3",
            stagger: 0.25
        });

        $(this).find('.split-child').each(function() {
            const splitChild = new SplitText(this, {
                type: "lines",
                ignore: ".no-split"
            });

            gsap.from(splitChild.lines, {
                y: 50,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out",
                stagger: 0.1,
                delay: 0.3
            });
        });
    });
}

window.initAnimations = initAnimations;
$(document).ready(initAnimations);