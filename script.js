//#region Main JS
document.addEventListener('DOMContentLoaded', async () => {
    const nav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        document.getElementById('scroll-top').classList.toggle('show', window.scrollY > 400);
        let current = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 200) current = s.id;
        });
        navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
    });

    const overlay = document.getElementById('mobile-overlay');
    document.getElementById('mobile-toggle').onclick = () => overlay.classList.add('open');
    document.getElementById('mobile-close').onclick = () => overlay.classList.remove('open');
    overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', () => overlay.classList.remove('open')));

    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const t = document.querySelector(a.getAttribute('href'));
            if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    document.getElementById('scroll-top').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById('copy-btn').onclick = () => {
        navigator.clipboard.writeText(document.getElementById('email-address').textContent)
            .then(() => showToast('Email copied!'))
            .catch(() => showToast('Failed to copy.'));
    };

    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    reveals.forEach(el => observer.observe(el));

    initProgressBar();
    initTypewriter();
    await Promise.all([fetchGitHub(), loadScreenshots()]);
    initTilt();
    initFeedback();
});

function initProgressBar() {
    const progressBar = document.createElement('div');
    Object.assign(progressBar.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        height: '3px',
        background: 'linear-gradient(90deg, var(--accent), var(--accent2), var(--accent3))',
        zIndex: '9999',
        width: '0%',
        transition: 'width 0.1s ease'
    });
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (scrollTop / scrollHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

function initTypewriter() {
    const heroText = document.querySelector('.hero-sub');
    if (!heroText) return;
    const originalText = heroText.textContent;
    heroText.textContent = '';
    let charIndex = 0;

    function type() {
        if (charIndex < originalText.length) {
            heroText.textContent += originalText.charAt(charIndex);
            charIndex++;
            setTimeout(type, 40);
        }
    }
    setTimeout(type, 800);
}

function initTilt() {
    const cards = document.querySelectorAll('.project-card, .repo-card, .about-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
        });
    });
}

async function loadScreenshots() {
    const wrap = document.getElementById('wip-screenshots');
    if (!wrap) return;
    let shots = [];
    try {
        const res = await fetch('screenshots.json');
        if (!res.ok) throw new Error();
        const data = await res.json();
        shots = Object.values(data).flat().filter(Boolean);
    } catch {
        wrap.innerHTML = '<p style="color:var(--muted);font-size:0.8rem;">Could not load screenshots.json</p>';
        return;
    }
    if (!shots.length) { wrap.style.display = 'none'; return; }
    buildSlider(wrap, shots);
}

function buildSlider(wrap, shots) {
    if (shots.length === 1) {
        wrap.innerHTML = `<div class="screenshot-track"><div class="parallax-container"><img class="parallax-image" src="${shots[0]}" alt="Screenshot"/></div></div>`;
        return;
    }

    let current = 0;
    const dotsHtml = shots.map((_, i) => `<button class="screenshot-dot${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="Screenshot ${i+1}"></button>`).join('');

    wrap.innerHTML = `
        <div class="screenshot-slider">
            <div class="screenshot-track">
                <button class="screenshot-arrow prev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>
                <div class="parallax-container" style="position:relative;">
                    ${shots.map((src, i) => `
                        <img src="${src}" alt="Screenshot ${i+1}" 
                             style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;
                                    opacity:${i === 0 ? '1' : '0'};
                                    transition:opacity 0.5s ease;
                                    pointer-events:${i === 0 ? 'auto' : 'none'};"/>
                    `).join('')}
                    <img src="${shots[0]}" style="width:100%;height:100%;object-fit:cover;opacity:0;visibility:hidden;" aria-hidden="true"/>
                </div>
                <button class="screenshot-arrow next" aria-label="Next"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="screenshot-dots">${dotsHtml}</div>
        </div>`;

    const imgs = wrap.querySelectorAll('.parallax-container img:not([aria-hidden])');
    const dots = wrap.querySelectorAll('.screenshot-dot');
    const prev = wrap.querySelector('.screenshot-arrow.prev');
    const next = wrap.querySelector('.screenshot-arrow.next');

    function goTo(idx) {
        imgs[current].style.opacity = '0';
        imgs[current].style.pointerEvents = 'none';
        dots[current].classList.remove('active');
        current = (idx + shots.length) % shots.length;
        imgs[current].style.opacity = '1';
        imgs[current].style.pointerEvents = 'auto';
        dots[current].classList.add('active');
    }

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.i)));
}

async function fetchGitHub() {
    const grid = document.getElementById('github-grid');
    try {
        const res = await fetch('https://api.github.com/users/DraynTM/repos?sort=updated&per_page=6');
        if (!res.ok) throw new Error(res.statusText);
        const repos = await res.json();
        if (!repos.length) {
            grid.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No public repositories found.</p>';
            return;
        }
        grid.innerHTML = repos.map(r => `
            <a class="repo-card" href="${r.html_url}" target="_blank" rel="noopener">
                <div class="repo-name">${r.name}</div>
                <div class="repo-desc">${r.description || 'No description provided.'}</div>
                <div class="repo-meta">
                    ${r.language ? `<span class="repo-tag lang">${r.language}</span>` : ''}
                    ${r.stargazers_count > 0 ? `<span class="repo-tag stars">⭐ ${r.stargazers_count}</span>` : ''}
                </div>
            </a>
        `).join('');
    } catch (e) {
        grid.innerHTML = `<p style="color:var(--muted);font-size:0.85rem;">Could not load repositories. (${e.message})</p>`;
    }
}

function initFeedback() {
    const WORKER_URL = 'https://discord.com/api/webhooks/1480166822669189212/mKEQVYS2SXqybFdm1ml1yctArvo2ZmZ8cL5Nvr9iRN5Sh7obRbOQi7Ff6Grzofhx8vEk';
    const tabs = document.querySelectorAll('.feedback-tab');
    const bugFields = document.getElementById('bug-fields');
    const msgLabel = document.getElementById('message-label');
    const form = document.getElementById('feedback-form');
    const success = document.getElementById('feedback-success');
    const resetBtn = document.getElementById('feedback-reset');

    const labels = { suggestion: 'Your suggestion', bug: 'What went wrong?', feedback: 'Your feedback', question: 'Your question' };
    let activeTab = tabs[0];

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeTab = tab;
            bugFields.style.display = tab.dataset.type === 'bug' ? 'block' : 'none';
            msgLabel.textContent = labels[tab.dataset.type];
        });
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const message = document.getElementById('feedback-message').value.trim();
        if (!message) return;

        const name = document.getElementById('feedback-name').value.trim() || 'Anonymous';
        const type = activeTab.dataset.type;
        const fields = [{ name: 'Message', value: message }];
        const fileInput = document.getElementById('bug-screenshot');
        const file = fileInput ? fileInput.files[0] : null;

        if (type === 'bug') {
            const loc = document.getElementById('bug-location').value.trim();
            const steps = document.getElementById('bug-steps').value.trim();
            if (loc) fields.unshift({ name: 'Where', value: loc, inline: true });
            if (steps) fields.push({ name: 'Steps', value: steps });
        }

        const btn = document.getElementById('feedback-submit');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
        btn.disabled = true;

        const formData = new FormData();
        const payload = {
            username: "Drayn's Workshop",
            embeds: [{
                title: `${activeTab.dataset.emoji} New ${type}`,
                color: parseInt(activeTab.dataset.color),
                fields: fields,
                footer: { text: `From: ${name}` },
                timestamp: new Date().toISOString()
            }]
        };

        if (file && type === 'bug') {
            payload.embeds[0].image = { url: 'attachment://screenshot.png' };
            formData.append('file', file, 'screenshot.png');
        }

        formData.append('payload_json', JSON.stringify(payload));

        try {
            const res = await fetch(WORKER_URL, {
                method: 'POST',
                body: formData
            });
            if (res.ok || res.status === 204) {
                form.classList.add('hide');
                success.classList.add('show');
            } else {
                throw new Error();
            }
        } catch {
            showToast('Error sending feedback.');
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
            btn.disabled = false;
        }
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        form.classList.remove('hide');
        success.classList.remove('show');
        document.getElementById('feedback-submit').innerHTML = '<i class="fas fa-paper-plane"></i> Send';
        document.getElementById('feedback-submit').disabled = false;
    });
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}
//#endregion
