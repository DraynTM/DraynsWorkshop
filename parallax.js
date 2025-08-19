document.addEventListener('DOMContentLoaded', () => {
    const parallaxImages = document.querySelectorAll('.parallax-image');

    function throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function updateParallax() {
        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;

        parallaxImages.forEach(img => {
            const section = img.closest('.section');
            if (!section) return;

            const rect = section.getBoundingClientRect();
            const elementTop = rect.top + scrollTop;
            const elementHeight = rect.height;

            const isInView = rect.bottom >= 0 && rect.top <= windowHeight;

            if (!isInView) {
                return;
            }

            const scrollProgress = Math.max(0, Math.min(1, (scrollTop - elementTop + windowHeight) / (elementHeight + windowHeight)));

            // smoothness
            const translateY = (scrollProgress - 0.8) * 100;

            // scale while scrolling
            const scale = 1 + (0.05 * (1 - Math.abs(scrollProgress - 0.5) * 8.0));

            img.style.transform = `translateY(${translateY}px) scale(${scale})`;
            img.style.transition = 'transform 0.1s ease-out';
        });
    }


    let ticking = false;
    const optimizedScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    };

    const handleScroll = throttle(optimizedScroll, 16); // ~60fps
    const handleResize = throttle(() => {
        updateParallax();
    }, 100);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    updateParallax();
});