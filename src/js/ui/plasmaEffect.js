/**
 * ═══════════════════════════════════════════════════════════════
 *  High-Performance Electric Plasma & Particle Ring Renderer
 *  Draws dynamic glowing plasma auras and orbital particle sparks
 * ═══════════════════════════════════════════════════════════════
 */

export class PlasmaRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.state = 'ready'; // 'ready' | 'connecting' | 'syncing' | 'connected' | 'error'
    this.particles = [];
    this.animId = null;
    this.time = 0;
    this.stateTime = 0;
    this.bloomScale = 1;

    if (this.canvas && this.ctx) {
      this.initDPR();
      this.createParticles(55);
      this.start();
    }
  }

  initDPR() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const size = rect.width > 0 ? rect.width : 176;
    this.width = size;
    this.height = size;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.ctx.scale(dpr, dpr);
    this.centerX = size / 2;
    this.centerY = size / 2;
    this.baseRadius = (size / 2) * 0.77; // Around 67.8px for 176px box
  }

  createParticles(count = 65) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.016,
        radialOffset: (Math.random() - 0.5) * 12,
        size: 0.6 + Math.random() * 1.3, // Refined micro-particles
        alpha: 0.35 + Math.random() * 0.65,
        pulseSpeed: 0.03 + Math.random() * 0.05,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    this.stateTime = 0;

    if (newState === 'connected') {
      this.bloomScale = 1.32;
    } else if (newState === 'error') {
      this.bloomScale = 1.2;
    }
  }

  start() {
    if (this.animId) return;
    const loop = () => {
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  render() {
    if (!this.ctx) return;
    this.time += 0.016;
    this.stateTime += 0.016;

    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;
    ctx.clearRect(0, 0, this.width, this.height);

    let mainColor, auraColor, sparkColor, speedMultiplier, currentRadius;

    switch (this.state) {
      case 'searching':
      case 'connecting':
      case 'syncing': {
        // Clockwise electric blue plasma vortex at 50% speed
        mainColor = 'rgba(56, 189, 248, ';
        auraColor = 'rgba(14, 165, 233, ';
        sparkColor = '#38bdf8';
        speedMultiplier = 1.6; // Clockwise, smooth 50% speed
        currentRadius = this.baseRadius + Math.sin(this.time * 5) * 1.5;
        break;
      }
      case 'connected': {
        // Green plasma: Clockwise rotation matching syncing + enlargement bloom
        mainColor = 'rgba(34, 197, 94, ';
        auraColor = 'rgba(74, 222, 128, ';
        sparkColor = '#4ade80';
        speedMultiplier = 1.6; // Same clockwise speed
        // Retract bloom smoothly
        this.bloomScale += (1.0 - this.bloomScale) * 0.06;
        currentRadius = this.baseRadius * this.bloomScale;
        break;
      }
      case 'error': {
        // Red double-pulse plasma
        mainColor = 'rgba(239, 68, 68, ';
        auraColor = 'rgba(248, 113, 113, ';
        sparkColor = '#f87171';
        speedMultiplier = 0.8;
        const pulse = (Math.sin(this.stateTime * 12) + 1) * 0.5;
        currentRadius = this.baseRadius * (1 + pulse * 0.15);
        break;
      }
      case 'ready':
      default: {
        // Purple gentle non-rotating plasma ring with floating particle sparks
        mainColor = 'rgba(168, 85, 247, ';
        auraColor = 'rgba(192, 132, 252, ';
        sparkColor = '#c084fc';
        speedMultiplier = 0.5; // Gentle particle drift
        currentRadius = this.baseRadius * (1 + Math.sin(this.time * 2.0) * 0.04);
        break;
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // Additive blending for electric plasma glow

    // ── 1. Diffuse Outer Plasma Aura ─────────────────────────────
    ctx.shadowBlur = 22;
    ctx.shadowColor = auraColor + '0.85)';

    ctx.beginPath();
    ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = mainColor + '0.75)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // ── 2. Intense Core Electric Plasma Beam ─────────────────────
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── 3. Swirling Orbital Plasma Particles & Sparks ───────────
    ctx.shadowBlur = 12;
    ctx.shadowColor = sparkColor;

    for (let p of this.particles) {
      p.angle += p.speed * speedMultiplier;
      const pulse = Math.sin(this.time * 3 + p.pulsePhase);
      const r = currentRadius + p.radialOffset + pulse * 3;
      const px = cx + Math.cos(p.angle) * r;
      const py = cy + Math.sin(p.angle) * r;
      const currentAlpha = Math.max(0.2, Math.min(1, p.alpha + pulse * 0.3));

      ctx.fillStyle = sparkColor;
      ctx.globalAlpha = currentAlpha;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Delicate Particle tail for active rotating states
      if (this.state === 'syncing' || this.state === 'connecting' || this.state === 'connected') {
        ctx.beginPath();
        const tailAngle = p.angle - p.speed * speedMultiplier * 2.0;
        const tx = cx + Math.cos(tailAngle) * r;
        const ty = cy + Math.sin(tailAngle) * r;
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = auraColor + (currentAlpha * 0.6) + ')';
        ctx.lineWidth = p.size * 0.75;
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
