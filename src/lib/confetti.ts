/**
 * Confetti Animation Utility
 * Creates a celebratory confetti burst effect
 */

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: {
    x?: number;
    y?: number;
  };
  colors?: string[];
}

const defaultColors = [
  "#10b981", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
];

function createConfettiParticle(color: string): HTMLDivElement {
  const particle = document.createElement("div");
  particle.style.cssText = `
    position: fixed;
    width: 10px;
    height: 10px;
    background: ${color};
    border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
    pointer-events: none;
    z-index: 9999;
  `;
  return particle;
}

function animateParticle(
  particle: HTMLDivElement,
  startX: number,
  startY: number,
  velocityX: number,
  velocityY: number,
  rotation: number
): void {
  let x = startX;
  let y = startY;
  let vx = velocityX;
  let vy = velocityY;
  let r = rotation;
  const gravity = 0.3;
  const drag = 0.98;
  const rotationSpeed = (Math.random() - 0.5) * 20;

  function update() {
    vx *= drag;
    vy += gravity;
    vy *= drag;
    x += vx;
    y += vy;
    r += rotationSpeed;

    particle.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
    particle.style.opacity = Math.max(0, 1 - y / 800).toString();

    if (y < window.innerHeight + 100 && parseFloat(particle.style.opacity) > 0) {
      requestAnimationFrame(update);
    } else {
      particle.remove();
    }
  }

  requestAnimationFrame(update);
}

export function confetti(options: ConfettiOptions = {}): void {
  const {
    particleCount = 150,
    spread = 70,
    origin = { x: 0.5, y: 0.5 },
    colors = defaultColors,
  } = options;

  const startX = (origin.x ?? 0.5) * window.innerWidth;
  const startY = (origin.y ?? 0.5) * window.innerHeight;

  for (let i = 0; i < particleCount; i++) {
    setTimeout(() => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const particle = createConfettiParticle(color);
      document.body.appendChild(particle);

      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * spread * 0.5 + spread * 0.5;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - Math.random() * 10;
      const rotation = Math.random() * 360;

      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;

      animateParticle(particle, 0, 0, vx, vy, rotation);
    }, i * 5);
  }
}

/**
 * Fire confetti from sides of screen
 */
export function confettiSideBurst(): void {
  // Left side
  confetti({
    particleCount: 80,
    spread: 55,
    origin: { x: 0.1, y: 0.7 },
  });

  // Right side
  confetti({
    particleCount: 80,
    spread: 55,
    origin: { x: 0.9, y: 0.7 },
  });
}

/**
 * Multiple confetti bursts for extra celebration
 */
export function celebrationBurst(): void {
  confetti({ particleCount: 100, spread: 70, origin: { x: 0.5, y: 0.6 } });

  setTimeout(() => {
    confetti({ particleCount: 60, spread: 60, origin: { x: 0.3, y: 0.5 } });
    confetti({ particleCount: 60, spread: 60, origin: { x: 0.7, y: 0.5 } });
  }, 200);

  setTimeout(() => {
    confetti({ particleCount: 40, spread: 50, origin: { x: 0.2, y: 0.4 } });
    confetti({ particleCount: 40, spread: 50, origin: { x: 0.8, y: 0.4 } });
  }, 400);
}