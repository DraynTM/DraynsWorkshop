class InteractiveBackground {
    constructor() {
        this.body = document.body;

        this.mouseX = 0;
        this.mouseY = 0;
        this.scrollY = 0;

        this.currentX = 0;
        this.currentY = 0;

        this.smoothFactor = 0.02;
        this.mouseInfluence = 0.01;
        this.scrollInfluence = 0.01;

        this.noiseOffset = Math.random() * 1000;

        this.init();
    }

    init() {
        this.animate();

        document.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX - window.innerWidth * 0.5) * this.mouseInfluence;
            this.mouseY = (e.clientY - window.innerHeight * 0.5) * this.mouseInfluence;
        });

        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY * this.scrollInfluence;
        });
    }

    animate() {
        this.currentX += (this.mouseX + this.scrollY - this.currentX) * this.smoothFactor;
        this.currentY += (this.mouseY - this.currentY) * this.smoothFactor;

        const noiseX = Math.sin(this.noiseOffset + Date.now() * 0.001) * 0.3;
        const noiseY = Math.cos(this.noiseOffset * 0.7 + Date.now() * 0.0007) * 0.2;

        this.body.style.setProperty('--bg-x', `${this.currentX + noiseX}px`);
        this.body.style.setProperty('--bg-y', `${this.currentY + noiseY}px`);

        this.noiseOffset += 0.001;

        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new InteractiveBackground();
});