import { gsap } from 'gsap';
import './style.css';

// ==========================================
// REFERENCIAS A ELEMENTOS DEL DOM
// ==========================================
const galaxyVideo = document.getElementById('galaxy-video');
const startBtn = document.getElementById('start-btn');
const fadeOverlay = document.getElementById('fade-overlay');
const finalVideo = document.getElementById('final-video');
const orbitingMessages = document.getElementById('orbiting-messages');
const modal = document.getElementById('message-modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalImg = document.getElementById('modal-img');
const closeModalBtn = document.getElementById('close-modal');

// ==========================================
// BOLITAS FLOTANTES: CLICS Y MODAL
// ==========================================
const messageBalls = document.querySelectorAll('.message-ball');

messageBalls.forEach(ball => {
    ball.addEventListener('click', () => {
        modalTitle.innerText = ball.dataset.title;
        modalText.innerText = ball.dataset.text;
        modalImg.src = ball.dataset.img;
        modal.classList.add('active');
    });
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

// ==========================================
// ANIMACIÓN: INICIAR VIAJE
// ==========================================
startBtn.addEventListener('click', () => {
    // 1. Ocultar botón con fade
    gsap.to(startBtn, { 
        opacity: 0, 
        duration: 0.5, 
        onComplete: () => { startBtn.style.display = 'none'; }
    });

    // 2. Ocultar las bolitas flotantes
    gsap.to(orbitingMessages, { opacity: 0, duration: 0.8 });

    // 3. Saltar el video de la galaxia al segundo 22.37 (zoom a la Tierra)
    galaxyVideo.currentTime = 22.37;

    // 4. Esperar 2 segundos para que se vea el zoom a la Tierra, luego destello blanco
    gsap.to(fadeOverlay, { 
        opacity: 1, 
        duration: 0.6, 
        delay: 2.0, 
        ease: 'power2.in'
    });

    // 5. Tras el destello, cambiar al video de la carta de amor
    gsap.delayedCall(2.8, () => {
        // Ocultar video galaxia
        galaxyVideo.style.opacity = '0';
        galaxyVideo.pause();
        
        // Mostrar y reproducir el video de la carta
        finalVideo.style.opacity = '1';
        finalVideo.play();

        // Variables para el control de partículas
        let particlesStarted = false;
        const letterContainer = document.getElementById('letter-container');

        // Función para crear una partícula (Corazón o Mariposa)
        function createParticle(type) {
            if (!letterContainer) return;
            const p = document.createElement('div');
            p.innerText = type === 'heart' ? '❤️' : '🦋';
            p.className = type === 'heart' ? 'heart-particle' : 'butterfly-particle';
            p.style.left = Math.random() * 95 + 'vw';
            
            if (type === 'butterfly') {
                p.style.setProperty('--dir', Math.random() > 0.5 ? 1 : -1);
                p.style.animationDuration = (Math.random() * 4 + 5) + 's';
                p.style.fontSize = (Math.random() * 20 + 20) + 'px';
            } else {
                p.style.animationDuration = (Math.random() * 3 + 4) + 's';
                p.style.fontSize = (Math.random() * 15 + 15) + 'px';
            }
            
            letterContainer.appendChild(p);
            setTimeout(() => p.remove(), 9000);
        }

        // Escuchar el tiempo del video para mostrar la carta y lanzar partículas
        finalVideo.addEventListener('timeupdate', () => {
            if (finalVideo.currentTime >= 35.47 && !particlesStarted) {
                particlesStarted = true;
                
                if (letterContainer) {
                    letterContainer.style.opacity = '1';
                    letterContainer.style.pointerEvents = 'auto';
                }

                // Lanzar lluvia intensa inicial
                for(let i = 0; i < 30; i++) {
                    setTimeout(() => createParticle(Math.random() > 0.3 ? 'heart' : 'butterfly'), Math.random() * 2000);
                }

                // Continuar lanzando partículas suavemente
                setInterval(() => {
                    createParticle(Math.random() > 0.3 ? 'heart' : 'butterfly');
                }, 300);
            }
        });
    });

    // 6. Desvanecer destello para revelar el video de la carta
    gsap.to(fadeOverlay, { 
        opacity: 0, 
        duration: 2.0, 
        delay: 3.0, 
        ease: 'power2.out' 
    });
});

// ==========================================
// RESIZE HANDLER
// ==========================================
window.addEventListener('resize', () => {
    // Nada complejo necesario ahora, CSS maneja todo con vw/vh
});
