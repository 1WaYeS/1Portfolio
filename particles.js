/**
 * Volumetric Smoke, Spark & Atmospheric Mist Simulation Engine
 * High-performance 2D Canvas fluid particle physics with depth-scaling and curl turbulence.
 */
class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.sparks = [];
    this.mistClouds = [];
    this.isRunning = false;
    this.emitter = { x: 0, y: 0, active: false, intensity: 1.0, isIgnited: false };
    this.mistPhase = false;
    this.mistAlpha = 0;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  setEmitter(x, y, active = true, isIgnited = false) {
    this.emitter.x = x;
    this.emitter.y = y;
    this.emitter.active = active;
    this.emitter.isIgnited = isIgnited;
  }

  triggerMistPhase() {
    this.mistPhase = true;
    this.mistAlpha = 0;
    // Spawn initial rolling mist field
    for (let i = 0; i < 45; i++) {
      this.spawnMistCloud(true);
    }
  }

  spawnMistCloud(randomY = false) {
    const depth = 0.3 + Math.random() * 0.7; // Z-depth (0.3 background, 1.0 foreground)
    const baseRadius = 80 + Math.random() * 160;
    this.mistClouds.push({
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : this.height + baseRadius,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.3 + Math.random() * 0.8) * depth,
      radius: baseRadius * depth,
      maxRadius: baseRadius * 1.8 * depth,
      growth: 0.15 * depth,
      alpha: 0,
      maxAlpha: 0.08 + Math.random() * 0.14,
      life: 0,
      maxLife: 300 + Math.random() * 400,
      depth: depth,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.003
    });
  }

  spawnSmokeParticle() {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    const speed = 0.8 + Math.random() * 1.5;
    this.particles.push({
      x: this.emitter.x + (Math.random() - 0.5) * 6,
      y: this.emitter.y + (Math.random() - 0.5) * 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      curlSpeed: (Math.random() - 0.5) * 0.04,
      curlPhase: Math.random() * Math.PI * 2,
      radius: 4 + Math.random() * 6,
      growth: 0.25 + Math.random() * 0.35,
      maxRadius: 40 + Math.random() * 50,
      alpha: 0.75,
      decay: 0.004 + Math.random() * 0.004,
      isIgnited: this.emitter.isIgnited,
      warmHue: this.emitter.isIgnited ? 25 + Math.random() * 15 : 0, // warm amber or pure white
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02
    });
  }

  spawnSparks() {
    for (let i = 0; i < 4; i++) {
      const speed = 2 + Math.random() * 5;
      const angle = Math.random() * Math.PI * 2;
      this.sparks.push({
        x: this.emitter.x,
        y: this.emitter.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: 1 + Math.random() * 2,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        color: Math.random() > 0.3 ? '#ffaa22' : '#ffffff'
      });
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  loop() {
    if (!this.isRunning) return;
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  update() {
    // Emitter particle generation
    if (this.emitter.active) {
      this.spawnSmokeParticle();
      this.spawnSmokeParticle();
      if (this.emitter.isIgnited && Math.random() > 0.6) {
        this.spawnSparks();
      }
    }

    // Update Smoke Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.curlPhase += p.curlSpeed;
      p.vx += Math.sin(p.curlPhase) * 0.08;
      p.vy -= 0.03; // buoyancy

      p.x += p.vx;
      p.y += p.vy;
      p.radius += p.growth;
      p.alpha -= p.decay;
      p.rotation += p.rotSpeed;

      if (p.alpha <= 0 || p.radius >= p.maxRadius) {
        this.particles.splice(i, 1);
      }
    }

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.08; // gravity
      s.vx *= 0.96;
      s.alpha -= s.decay;

      if (s.alpha <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    // Update Atmospheric Mist
    if (this.mistPhase) {
      if (this.mistAlpha < 1) this.mistAlpha += 0.005;
      if (this.mistClouds.length < 50 && Math.random() > 0.4) {
        this.spawnMistCloud(false);
      }

      for (let i = this.mistClouds.length - 1; i >= 0; i--) {
        const m = this.mistClouds[i];
        m.life++;
        m.x += m.vx;
        m.y += m.vy;
        m.radius += m.growth;
        m.rotation += m.rotSpeed;

        // Smooth alpha envelope
        const progress = m.life / m.maxLife;
        if (progress < 0.25) {
          m.alpha = (progress / 0.25) * m.maxAlpha;
        } else if (progress > 0.7) {
          m.alpha = ((1 - progress) / 0.3) * m.maxAlpha;
        } else {
          m.alpha = m.maxAlpha;
        }

        if (m.life >= m.maxLife || m.y < -m.radius) {
          this.mistClouds.splice(i, 1);
        }
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render Atmospheric Mist Clouds (Backdrop to foreground)
    if (this.mistPhase && this.mistClouds.length > 0) {
      this.ctx.save();
      for (const m of this.mistClouds) {
        const grad = this.ctx.createRadialGradient(
          m.x, m.y, 0,
          m.x, m.y, m.radius
        );
        // Soft cinematic silver-blue/warm glow
        grad.addColorStop(0, `rgba(230, 235, 245, ${m.alpha * this.mistAlpha})`);
        grad.addColorStop(0.5, `rgba(180, 190, 205, ${m.alpha * 0.6 * this.mistAlpha})`);
        grad.addColorStop(1, 'rgba(10, 12, 16, 0)');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // Render Smoke Particles
    if (this.particles.length > 0) {
      this.ctx.save();
      for (const p of this.particles) {
        const grad = this.ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.radius
        );

        if (p.isIgnited) {
          // Warm illuminated core blending to smoke
          grad.addColorStop(0, `rgba(255, 180, 70, ${p.alpha * 0.9})`);
          grad.addColorStop(0.3, `rgba(230, 140, 50, ${p.alpha * 0.5})`);
          grad.addColorStop(0.7, `rgba(160, 160, 170, ${p.alpha * 0.25})`);
          grad.addColorStop(1, 'rgba(20, 20, 25, 0)');
        } else {
          grad.addColorStop(0, `rgba(240, 240, 245, ${p.alpha * 0.6})`);
          grad.addColorStop(0.5, `rgba(190, 190, 200, ${p.alpha * 0.3})`);
          grad.addColorStop(1, 'rgba(20, 20, 25, 0)');
        }

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // Render Sparks
    if (this.sparks.length > 0) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';
      for (const s of this.sparks) {
        this.ctx.fillStyle = s.color;
        this.ctx.globalAlpha = s.alpha;
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Spark trail / glow
        this.ctx.fillStyle = 'rgba(255, 160, 40, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, s.radius * 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }

  reset() {
    this.particles = [];
    this.sparks = [];
    this.mistClouds = [];
    this.mistPhase = false;
    this.mistAlpha = 0;
    this.emitter.active = false;
    this.emitter.isIgnited = false;
  }
}

window.ParticleEngine = ParticleEngine;
