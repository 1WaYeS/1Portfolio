/**
 * ARCHIVE // 001 — CINEMATIC INTERACTIVE ENGINE
 * Orchestrates selective color masks, 3D mouse parallax, hand pickup choreography,
 * seamless POV transition, dynamic box illumination reflections, and atmospheric mist.
 */

class CinematicExperience {
  constructor() {
    this.state = 'SELECTING'; // 'SELECTING' | 'EXTRACTING' | 'POV' | 'ILLUMINATING' | 'ATMOSPHERE'
    this.activeHotspot = null;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.particleEngine = null;

    // DOM Elements
    this.stageContainer = document.getElementById('stageContainer');
    this.sceneProduct = document.getElementById('sceneProduct');
    this.boxRig = document.getElementById('boxRig');
    this.boxColorLayer = document.getElementById('boxColorLayer');
    this.boxReflectionLayer = document.getElementById('boxReflectionLayer');
    this.hotspots = document.querySelectorAll('.cig-hotspot');
    this.pickupHandRig = document.getElementById('pickupHandRig');
    this.pickupShadow = document.getElementById('pickupShadow');
    this.pickupHandImg = document.getElementById('pickupHandImg');
    
    // POV Elements
    this.scenePOV = document.getElementById('scenePOV');
    this.povRig = document.getElementById('povRig');
    this.povUnlitImg = document.getElementById('povUnlitImg');
    this.povLitImg = document.getElementById('povLitImg');
    this.emberCore = document.getElementById('emberCore');
    this.warmLightSource = document.getElementById('warmLightSource');
    this.ambientGlow = document.getElementById('ambientGlow');

    // UI Elements
    this.customCursor = document.getElementById('customCursor');
    this.hudCoords = document.getElementById('hudCoords');
    this.hudLabel = document.getElementById('hudLabel');
    this.infoTitle = document.getElementById('infoTitle');
    this.infoDesc = document.getElementById('infoDesc');
    this.actionPrompt = document.getElementById('actionPrompt');
    this.audioToggle = document.getElementById('audioToggle');
    this.audioLabel = document.getElementById('audioLabel');
    this.btnReplay = document.getElementById('btnReplay');
    this.steps = [
      document.getElementById('step1'),
      document.getElementById('step2'),
      document.getElementById('step3'),
      document.getElementById('step4')
    ];

    this.init();
  }

  init() {
    // 1. Initialize Particle Engine
    this.particleEngine = new ParticleEngine('particleCanvas');
    this.particleEngine.start();

    // 2. Setup Event Listeners
    this.setupEventListeners();

    // 3. Start Parallax & Render Loop
    this.startRenderLoop();

    // 4. Initial UI State
    this.setTimelineStep(1);
  }

  setupEventListeners() {
    // Mouse Move for Parallax & Cursor
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // Hotspot Hover & Click Events
    this.hotspots.forEach((hotspot) => {
      hotspot.addEventListener('mouseenter', () => this.onHotspotEnter(hotspot));
      hotspot.addEventListener('mouseleave', () => this.onHotspotLeave(hotspot));
      hotspot.addEventListener('click', (e) => this.onHotspotClick(hotspot, e));
    });

    // Audio Controller Toggle
    this.audioToggle.addEventListener('click', () => this.toggleAudio());

    // Replay Button
    this.btnReplay.addEventListener('click', () => this.resetExperience());

    // First user gesture to initialize Web Audio API
    window.addEventListener('click', () => {
      if (window.soundEngine && !window.soundEngine.isInitialized) {
        window.soundEngine.init();
        this.audioToggle.classList.add('playing');
      }
    }, { once: true });
  }

  onMouseMove(e) {
    const normX = (e.clientX / window.innerWidth) * 2 - 1;
    const normY = (e.clientY / window.innerHeight) * 2 - 1;

    this.mouse.targetX = normX;
    this.mouse.targetY = normY;

    // Update Custom Cursor Position
    if (this.customCursor) {
      this.customCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      if (this.hudCoords) {
        this.hudCoords.textContent = `X:${Math.round(e.clientX)} Y:${Math.round(e.clientY)}`;
      }
    }
  }

  startRenderLoop() {
    const loop = () => {
      // Smooth Damped Parallax Interpolation (Lerp)
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

      if (this.state === 'SELECTING' && this.boxRig) {
        const rotY = this.mouse.x * 12;
        const rotX = -this.mouse.y * 10;
        this.boxRig.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) translateZ(10px)`;
      } else if (this.state === 'ATMOSPHERE' && this.povRig) {
        const rotY = this.mouse.x * 8;
        const rotX = -this.mouse.y * 6;
        this.povRig.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) translateZ(20px)`;
      }

      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ==========================================================================
     STAGE 1: SELECTIVE COLOR HOVER
     ========================================================================== */

  onHotspotEnter(hotspot) {
    if (this.state !== 'SELECTING') return;

    this.activeHotspot = hotspot;
    const cigType = hotspot.dataset.cig;
    const title = hotspot.dataset.title;
    const desc = hotspot.dataset.desc;

    // 1. Play Sound
    if (window.soundEngine) window.soundEngine.playHover();

    // 2. Adjust Selective Color Mask Position dynamically
    let maskCenter = '68% 28%';
    let maskRadius = '18%';
    let outerFade = '32%';

    switch (cigType) {
      case 'tall':
        maskCenter = '68% 22%';
        maskRadius = '16%';
        outerFade = '30%';
        break;
      case 'med':
        maskCenter = '63% 28%';
        maskRadius = '14%';
        outerFade = '26%';
        break;
      case 'row1':
        maskCenter = '48% 34%';
        maskRadius = '12%';
        outerFade = '22%';
        break;
      case 'row2':
        maskCenter = '55% 34%';
        maskRadius = '12%';
        outerFade = '22%';
        break;
    }

    const maskGradient = `radial-gradient(circle at ${maskCenter}, black 0%, black ${maskRadius}, transparent ${outerFade})`;
    this.boxColorLayer.style.maskImage = maskGradient;
    this.boxColorLayer.style.webkitMaskImage = maskGradient;
    this.boxColorLayer.classList.add('active');

    // 3. Update Cursor & UI Info
    this.customCursor.classList.add('hovering');
    if (this.hudLabel) this.hudLabel.textContent = 'RETRIEVE OBJECT';
    if (this.infoTitle) this.infoTitle.textContent = title;
    if (this.infoDesc) this.infoDesc.textContent = desc;
  }

  onHotspotLeave(hotspot) {
    if (this.state !== 'SELECTING') return;
    if (this.activeHotspot === hotspot) {
      this.activeHotspot = null;
      this.boxColorLayer.classList.remove('active');
      this.customCursor.classList.remove('hovering');
      if (this.hudLabel) this.hudLabel.textContent = 'EXPLORE OBJECT';
      if (this.infoTitle) this.infoTitle.textContent = 'SELECT AN OBJECT';
      if (this.infoDesc) this.infoDesc.textContent = 'Hover over any cigarette inside the box to reveal its authentic color profile. Click to initiate extraction.';
    }
  }

  /* ==========================================================================
     STAGE 2: CLICK INTERACTION & HAND PICKUP CHOREOGRAPHY
     ========================================================================== */

  onHotspotClick(hotspot, e) {
    if (this.state !== 'SELECTING') return;
    this.state = 'EXTRACTING';
    this.setTimelineStep(2);

    hotspot.classList.add('selected');
    this.customCursor.classList.remove('hovering');

    if (this.infoTitle) this.infoTitle.textContent = 'RETRIEVING OBJECT';
    if (this.infoDesc) this.infoDesc.textContent = 'A human hand smoothly enters the frame, reaching toward the selected object to pull it from the monochrome box.';
    if (this.actionPrompt) this.actionPrompt.style.opacity = '0';

    // Play slide audio
    if (window.soundEngine) {
      window.soundEngine.init();
      window.soundEngine.playSlide();
    }

    // GSAP Hand Entrance and Pickup Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        this.triggerPOVTransition();
      }
    });

    // 1. Hand sweeps in from bottom-right towards the target cigarette
    tl.to(this.pickupHandRig, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: "power3.out"
    })
    .to(this.pickupShadow, {
      opacity: 0.8,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.8")
    // 2. Hand grips and lifts cigarette upwards out of box
    .to(this.pickupHandRig, {
      y: -70,
      x: 30,
      rotation: 5,
      duration: 1.0,
      ease: "power2.inOut"
    })
    .to(this.boxColorLayer, {
      opacity: 0.3,
      duration: 0.6,
      ease: "power1.out"
    }, "-=0.8")
    // 3. Hand exits screen right/top
    .to(this.pickupHandRig, {
      x: 350,
      y: -150,
      opacity: 0,
      duration: 0.8,
      ease: "power3.in"
    });
  }

  /* ==========================================================================
     STAGE 3: SEAMLESS POV TRANSITION & FOCUS PULLING
     ========================================================================== */

  triggerPOVTransition() {
    this.state = 'POV';
    this.setTimelineStep(3);

    if (this.infoTitle) this.infoTitle.textContent = 'FIRST-PERSON PERSPECTIVE';
    if (this.infoDesc) this.infoDesc.textContent = 'Seamless transition to first-person POV shot. The selected object is held close in sharp focus against the blurred studio background.';

    const tl = gsap.timeline({
      onComplete: () => {
        this.triggerWarmIllumination();
      }
    });

    // 1. Zoom and blur the monochrome product box into bokeh background
    tl.to(this.sceneProduct, {
      scale: 1.4,
      opacity: 0.35,
      filter: "blur(14px) brightness(0.5)",
      duration: 1.4,
      ease: "power3.inOut"
    })
    // 2. Swoop in POV Hand in sharp foreground focus
    .to(this.scenePOV, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 1.3,
      ease: "power3.out"
    }, "-=1.0");
  }

  /* ==========================================================================
     STAGE 4: WARM ILLUMINATION & DYNAMIC BOX REFLECTION
     ========================================================================== */

  triggerWarmIllumination() {
    this.state = 'ILLUMINATING';

    if (this.infoTitle) this.infoTitle.textContent = 'WARM ILLUMINATION';
    if (this.infoDesc) this.infoDesc.textContent = 'An abstract glowing light source ignites the tip. Warm golden light radiates across the fingers and reflects onto the monochrome product box.';

    // Play ignition sounds & ember crackle
    if (window.soundEngine) {
      window.soundEngine.playIgnite();
    }

    const tl = gsap.timeline({
      onComplete: () => {
        this.triggerAtmosphericMist();
      }
    });

    // 1. Warm flare strikes & Ember lights up
    tl.to(this.warmLightSource, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    })
    .to(this.emberCore, {
      opacity: 1,
      duration: 0.3,
      ease: "power1.out"
    }, "-=0.2")
    // 2. Crossfade to lit POV hand image (illuminated skin & ember)
    .to(this.povLitImg, {
      opacity: 1,
      duration: 0.8,
      ease: "power2.inOut"
    }, "-=0.2")
    // 3. Cast ambient warm glow across entire scene
    .to(this.ambientGlow, {
      opacity: 0.85,
      duration: 1.0,
      ease: "power2.out"
    }, "-=0.7")
    // 4. Cast dynamic warm light reflection onto the blurred monochrome box in background!
    .to(this.boxReflectionLayer, {
      opacity: 0.9,
      duration: 1.2,
      ease: "power2.out"
    }, "-=0.9")
    // 5. Start emitting smoke particles from ember tip
    .add(() => {
      const rect = this.emberCore.getBoundingClientRect();
      this.particleEngine.setEmitter(rect.left + rect.width / 2, rect.top + rect.height / 2, true, true);
    })
    // 6. Settle the flare down into a rich glowing ember
    .to(this.warmLightSource, {
      opacity: 0.4,
      scale: 0.85,
      duration: 1.5,
      ease: "power2.inOut"
    });
  }

  /* ==========================================================================
     STAGE 5: ATMOSPHERIC MIST & TRANSITION COMPLETION
     ========================================================================== */

  triggerAtmosphericMist() {
    this.state = 'ATMOSPHERE';
    this.setTimelineStep(4);

    if (this.infoTitle) this.infoTitle.textContent = 'ATMOSPHERIC VEIL';
    if (this.infoDesc) this.infoDesc.textContent = 'Volumetric mist and curling smoke roll forward towards the lens, completing the cinematic shot and unlocking interactive 3D inspection.';
    if (this.actionPrompt) {
      this.actionPrompt.innerHTML = '<div class="prompt-pulse"></div><span class="prompt-text">MOVE MOUSE FOR 3D PARALLAX &bull; REPLAY ANYTIME</span>';
      this.actionPrompt.style.opacity = '1';
    }

    // Play mist whisper sound
    if (window.soundEngine) {
      window.soundEngine.playMistWhisper();
    }

    // Trigger volumetric mist field
    if (this.particleEngine) {
      this.particleEngine.triggerMistPhase();
    }

    // Subtle breathing animation on POV rig
    gsap.to(this.povRig, {
      y: "+=8",
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }

  /* ==========================================================================
     HELPERS & CONTROLS
     ========================================================================== */

  setTimelineStep(stepNumber) {
    this.steps.forEach((step, idx) => {
      if (idx + 1 === stepNumber) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
  }

  toggleAudio() {
    if (!window.soundEngine) return;
    if (!window.soundEngine.isInitialized) {
      window.soundEngine.init();
    }
    const isMuted = window.soundEngine.toggleMute();
    if (isMuted) {
      this.audioToggle.classList.remove('playing');
      if (this.audioLabel) this.audioLabel.textContent = 'SPATIAL AUDIO // MUTED';
    } else {
      this.audioToggle.classList.add('playing');
      if (this.audioLabel) this.audioLabel.textContent = 'SPATIAL AUDIO // ON';
    }
  }

  resetExperience() {
    this.state = 'SELECTING';
    this.setTimelineStep(1);

    // Reset particles
    if (this.particleEngine) {
      this.particleEngine.reset();
    }

    // Reset Hotspots
    this.hotspots.forEach(h => h.classList.remove('selected'));
    this.activeHotspot = null;

    // Reset GSAP animations
    gsap.killTweensOf([
      this.sceneProduct,
      this.scenePOV,
      this.pickupHandRig,
      this.pickupShadow,
      this.boxColorLayer,
      this.boxReflectionLayer,
      this.warmLightSource,
      this.emberCore,
      this.povLitImg,
      this.ambientGlow,
      this.povRig
    ]);

    // Reset Styles & Transforms
    gsap.set(this.sceneProduct, {
      scale: 1,
      opacity: 1,
      filter: "none"
    });

    gsap.set(this.scenePOV, {
      opacity: 0,
      scale: 1.18,
      y: 60
    });

    gsap.set(this.pickupHandRig, {
      opacity: 0,
      x: 250,
      y: 300,
      scale: 0.9,
      rotation: 0
    });

    gsap.set(this.pickupShadow, { opacity: 0 });
    gsap.set(this.boxColorLayer, { opacity: 0 });
    gsap.set(this.boxReflectionLayer, { opacity: 0 });
    gsap.set(this.warmLightSource, { opacity: 0, scale: 1 });
    gsap.set(this.emberCore, { opacity: 0 });
    gsap.set(this.povLitImg, { opacity: 0 });
    gsap.set(this.ambientGlow, { opacity: 0 });

    this.boxColorLayer.classList.remove('active');
    this.customCursor.classList.remove('hovering');

    if (this.infoTitle) this.infoTitle.textContent = 'SELECT AN OBJECT';
    if (this.infoDesc) this.infoDesc.textContent = 'Hover over any cigarette inside the box to reveal its authentic color profile. Click to initiate extraction.';
    if (this.actionPrompt) {
      this.actionPrompt.innerHTML = '<div class="prompt-pulse"></div><span class="prompt-text">HOVER TO REVEAL &bull; CLICK TO RETRIEVE</span>';
      this.actionPrompt.style.opacity = '1';
    }
  }
}

// Instantiate on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  window.cinematicExp = new CinematicExperience();
});
