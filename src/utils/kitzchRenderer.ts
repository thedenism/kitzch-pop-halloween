import { AmbientBat, AmbientCloud, AmbientFirefly, FloatingPopText, ItemCategory, KitzchItem, KitzchParticle, PlayerSkinId } from '../types/game';

const TAU = Math.PI * 2;

export class KitzchRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private dpr: number;
  private bgCanvas: HTMLCanvasElement | null = null;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number = 1) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.generateBackground();
  }

  public resize(width: number, height: number, dpr: number = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.generateBackground();
  }

  // Recursive fractal tree generator
  private drawTree(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    len: number,
    angle: number,
    width: number,
    depth: number
  ) {
    if (depth < 0) return;
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(x, y);
    const nx = x + Math.cos(angle) * len;
    const ny = y + Math.sin(angle) * len;
    g.lineTo(nx, ny);
    g.stroke();

    this.drawTree(g, nx, ny, len * 0.76, angle - 0.35 - Math.random() * 0.35, width * 0.68, depth - 1);
    this.drawTree(g, nx, ny, len * 0.76, angle + 0.35 + Math.random() * 0.35, width * 0.68, depth - 1);
  }

  // High-fidelity Gothic Background
  private generateBackground() {
    const W = this.width;
    const H = this.height;
    if (W <= 0 || H <= 0) return;

    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = W * this.dpr;
    this.bgCanvas.height = H * this.dpr;
    const g = this.bgCanvas.getContext('2d');
    if (!g) return;

    g.scale(this.dpr, this.dpr);

    // 1. Teal & Deep Cyan Sky Gradient
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050b0d');
    sky.addColorStop(0.55, '#102a2e');
    sky.addColorStop(1, '#1d4141');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    // 2. Twinkling Stars
    for (let i = 0; i < 48; i++) {
      g.fillStyle = `rgba(250, 206, 145, ${0.2 + Math.random() * 0.5})`;
      g.beginPath();
      g.arc(Math.random() * W, Math.random() * H * 0.55, Math.random() * 1.3 + 0.3, 0, TAU);
      g.fill();
    }

    // 3. Harvest Moon
    const mx = W * 0.7;
    const my = H * 0.17;
    const mr = W * 0.11;

    // Glowing Halo
    const halo = g.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3.2);
    halo.addColorStop(0, 'rgba(250, 206, 145, 0.45)');
    halo.addColorStop(1, 'rgba(250, 206, 145, 0)');
    g.fillStyle = halo;
    g.fillRect(0, 0, W, H * 0.6);

    // Moon disc
    g.fillStyle = '#f6e3bd';
    g.beginPath();
    g.arc(mx, my, mr, 0, TAU);
    g.fill();

    // Craters
    g.fillStyle = 'rgba(180, 150, 100, 0.35)';
    [
      [-0.3, -0.25, 0.2],
      [0.25, 0.2, 0.28],
      [0.3, -0.4, 0.12],
    ].forEach((c) => {
      g.beginPath();
      g.arc(mx + c[0] * mr, my + c[1] * mr, c[2] * mr, 0, TAU);
      g.fill();
    });

    // 4. Gothic Castle Silhouette
    const s = W / 400;
    const x0 = W * 0.1;
    const gy = H * 0.9;

    g.fillStyle = '#050c0e';
    g.beginPath();
    const castlePoints: [number, number][] = [
      [0, 0],
      [0, -70],
      [14, -70],
      [14, -110],
      [26, -150],
      [38, -110],
      [38, -70],
      [70, -70],
      [70, -130],
      [80, -190],
      [90, -130],
      [90, -70],
      [130, -70],
      [130, -100],
      [142, -124],
      [154, -100],
      [154, 0],
    ];

    castlePoints.forEach((p, idx) => {
      const px = x0 + p[0] * s;
      const py = gy + p[1] * s;
      if (idx === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    });
    g.fill();

    // Glowing Castle Windows
    g.fillStyle = 'rgba(250, 206, 145, 0.85)';
    [
      [20, -45],
      [46, -45],
      [76, -100],
      [100, -45],
      [136, -60],
      [76, -60],
    ].forEach((p) => {
      g.fillRect(x0 + p[0] * s, gy + p[1] * s, 7 * s, 13 * s);
    });

    // 5. Spooky bare trees
    g.strokeStyle = '#050c0e';
    g.lineCap = 'round';
    this.drawTree(g, W * 0.04, H * 0.94, H * 0.1, -Math.PI / 2 - 0.1, H * 0.012, 6);
    this.drawTree(g, W * 0.96, H * 0.94, H * 0.12, -Math.PI / 2 + 0.12, H * 0.014, 6);

    // Glowing Lantern on Tree branch
    const lx = W * 0.12;
    const ly = H * 0.86;
    g.strokeStyle = 'rgba(250, 206, 145, 0.5)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(lx, ly - 18);
    g.lineTo(lx, ly);
    g.stroke();

    // Lantern Glow
    const lGrad = g.createRadialGradient(lx, ly + 6, 2, lx, ly + 6, 22);
    lGrad.addColorStop(0, '#ffe4a0');
    lGrad.addColorStop(0.5, 'rgba(248, 105, 3, 0.6)');
    lGrad.addColorStop(1, 'rgba(248, 105, 3, 0)');
    g.fillStyle = lGrad;
    g.beginPath();
    g.arc(lx, ly + 6, 22, 0, TAU);
    g.fill();

    g.fillStyle = '#050c0e';
    g.fillRect(lx - 5, ly, 10, 12);
    g.fillStyle = '#ffe9b8';
    g.fillRect(lx - 3, ly + 2, 6, 8);

    // 6. Ground & Cyan Mist
    const f = (40 * s) / (H - gy + 40 * s);
    const mist = g.createLinearGradient(0, gy - 40 * s, 0, H);
    mist.addColorStop(0, 'rgba(94, 234, 212, 0)');
    mist.addColorStop(f * 0.8, 'rgba(94, 234, 212, 0.13)');
    mist.addColorStop(f, '#050c0e');
    mist.addColorStop(1, '#030809');
    g.fillStyle = mist;
    g.fillRect(0, gy - 40 * s, W, H - gy + 40 * s);

    // 7. Cemetery Tombstones
    g.fillStyle = '#07100f';
    [
      [0.56, 0.05, 26],
      [0.66, 0.04, 20],
      [0.82, 0.05, 30],
    ].forEach((o) => {
      const tx = W * o[0];
      const tw = W * o[1];
      const th = o[2] * s;
      g.fillRect(tx, gy - th, tw, th + 4);
      g.beginPath();
      g.arc(tx + tw / 2, gy - th, tw / 2, Math.PI, 0);
      g.fill();
    });
  }

  public drawBackground() {
    if (this.bgCanvas) {
      this.ctx.drawImage(this.bgCanvas, 0, 0, this.width, this.height);
    }
  }

  // Draw floating translucent moonlit clouds
  public drawClouds(clouds: AmbientCloud[]) {
    const ctx = this.ctx;
    clouds.forEach((c) => {
      ctx.save();
      ctx.fillStyle = `rgba(246, 227, 189, ${c.alpha})`;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.width / 2, c.height / 2, 0, 0, TAU);
      ctx.ellipse(c.x - c.width * 0.25, c.y - c.height * 0.1, c.width * 0.35, c.height * 0.45, 0, 0, TAU);
      ctx.ellipse(c.x + c.width * 0.25, c.y - c.height * 0.1, c.width * 0.35, c.height * 0.45, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    });
  }

  // Draw will-o'-the-wisp fireflies
  public drawFireflies(fireflies: AmbientFirefly[]) {
    const ctx = this.ctx;
    fireflies.forEach((ff) => {
      ctx.save();
      const flicker = 0.5 + Math.sin(Date.now() * 0.005 + ff.phase) * 0.5;
      ctx.fillStyle = ff.color;
      ctx.shadowColor = ff.color;
      ctx.shadowBlur = 8 * flicker;
      ctx.globalAlpha = flicker * 0.8;
      ctx.beginPath();
      ctx.arc(ff.x, ff.y, ff.size, 0, TAU);
      ctx.fill();
      ctx.restore();
    });
  }

  // Draw ambient flapping bats
  public drawBats(bats: AmbientBat[]) {
    const ctx = this.ctx;
    ctx.fillStyle = '#050c0e';
    bats.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      const flap = Math.sin(Date.now() * 0.01 + b.phase);
      const s = b.size;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-s * 0.8, -s * (0.6 + flap * 0.5), -s * 1.4, -s * (0.2 + flap * 0.4));
      ctx.quadraticCurveTo(-s * 0.8, s * 0.2, 0, s * 0.4);
      ctx.quadraticCurveTo(s * 0.8, s * 0.2, s * 1.4, -s * (0.2 + flap * 0.4));
      ctx.quadraticCurveTo(s * 0.8, -s * (0.6 + flap * 0.5), 0, 0);
      ctx.fill();
      ctx.restore();
    });
  }

  // Draw Player Basket according to unlocked Skin
  public drawPlayer(
    px: number,
    py: number,
    bw: number,
    squash: number,
    hasShield: boolean,
    hasMagnet: boolean,
    hasRush: boolean,
    skinId: PlayerSkinId = 'classic',
    expression: 'normal' | 'excited' | 'hurt' | 'rush' = 'normal'
  ) {
    const ctx = this.ctx;
    const bh = bw * 0.62;

    ctx.save();
    ctx.translate(px, py);

    // Squash & Stretch
    const scaleX = 1 + squash * 0.22;
    const scaleY = 1 - squash * 0.22;
    ctx.scale(scaleX, scaleY);

    // Powerup: Shield Bubble
    if (hasShield) {
      ctx.save();
      const p = Math.sin(Date.now() * 0.006) * 3;
      ctx.strokeStyle = '#5eead4';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#5eead4';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, bw * 0.65 + p, bh * 0.85 + p, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(94, 234, 212, 0.12)';
      ctx.fill();
      ctx.restore();
    }

    // Powerup: Moon Magnet Waves
    if (hasMagnet) {
      ctx.save();
      const ring = (Date.now() * 0.04) % 25;
      ctx.strokeStyle = `rgba(196, 176, 255, ${1 - ring / 25})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -bh * 0.2, bw * 0.55 + ring, Math.PI, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Powerup: Sugar Rush Glow
    if (hasRush) {
      ctx.save();
      ctx.shadowColor = '#F86903';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = 'rgba(255, 179, 71, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-bw * 0.52, -bh * 0.52, bw * 1.04, bh * 1.04);
      ctx.restore();
    }

    // Skin rendering router
    switch (skinId) {
      case 'cauldron':
        this.renderCauldron(ctx, bw, bh, expression);
        break;
      case 'ghost':
        this.renderGhost(ctx, bw, bh, expression);
        break;
      case 'cat':
        this.renderCat(ctx, bw, bh, expression);
        break;
      case 'vampire':
        this.renderVampire(ctx, bw, bh, expression);
        break;
      case 'classic':
      default:
        this.renderClassicPumpkin(ctx, bw, bh, expression);
        break;
    }

    ctx.restore();
  }

  private renderClassicPumpkin(
    ctx: CanvasRenderingContext2D,
    bw: number,
    bh: number,
    expression: string
  ) {
    const grad = ctx.createRadialGradient(-bw * 0.15, -bh * 0.15, 4, 0, 0, bw * 0.5);
    grad.addColorStop(0, '#ffa95c');
    grad.addColorStop(0.55, '#F86903');
    grad.addColorStop(1, '#CE3D01');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, bw * 0.5, bh * 0.5, 0, 0, TAU);
    ctx.fill();

    // Rib grooves
    ctx.strokeStyle = '#932800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-bw * 0.25, 0, bw * 0.22, bh * 0.48, 0, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(bw * 0.25, 0, bw * 0.22, bh * 0.48, 0, 0, TAU);
    ctx.stroke();

    // Stem
    ctx.fillStyle = '#5f8a3a';
    ctx.fillRect(-bw * 0.04, -bh * 0.65, bw * 0.08, bh * 0.2);

    // Glowing eyes
    ctx.fillStyle = expression === 'hurt' ? '#ff3b2e' : '#ffe9b8';
    ctx.shadowColor = '#F86903';
    ctx.shadowBlur = 8;

    if (expression === 'hurt') {
      // Crossed eyes `> <`
      ctx.strokeStyle = '#ff3b2e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-bw * 0.24, -bh * 0.2);
      ctx.lineTo(-bw * 0.12, -bh * 0.08);
      ctx.moveTo(-bw * 0.12, -bh * 0.2);
      ctx.lineTo(-bw * 0.24, -bh * 0.08);
      ctx.moveTo(bw * 0.12, -bh * 0.2);
      ctx.lineTo(bw * 0.24, -bh * 0.08);
      ctx.moveTo(bw * 0.24, -bh * 0.2);
      ctx.lineTo(bw * 0.12, -bh * 0.08);
      ctx.stroke();
    } else {
      // Normal / Excited triangle eyes
      const eyeH = expression === 'excited' ? 0.32 : 0.26;
      ctx.beginPath();
      ctx.moveTo(-bw * 0.22, -bh * 0.12);
      ctx.lineTo(-bw * 0.1, -bh * 0.12);
      ctx.lineTo(-bw * 0.16, -bh * eyeH);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(bw * 0.1, -bh * 0.12);
      ctx.lineTo(bw * 0.22, -bh * 0.12);
      ctx.lineTo(bw * 0.16, -bh * eyeH);
      ctx.closePath();
      ctx.fill();
    }

    // Carved mouth
    ctx.beginPath();
    ctx.moveTo(-bw * 0.26, bh * 0.1);
    ctx.quadraticCurveTo(0, bh * 0.45, bw * 0.26, bh * 0.1);
    ctx.lineTo(bw * 0.18, bh * 0.18);
    ctx.lineTo(bw * 0.1, bh * 0.08);
    ctx.lineTo(0, bh * 0.22);
    ctx.lineTo(-bw * 0.1, bh * 0.08);
    ctx.lineTo(-bw * 0.18, bh * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  private renderCauldron(
    ctx: CanvasRenderingContext2D,
    bw: number,
    bh: number,
    _expression: string
  ) {
    // Cast iron pot
    ctx.fillStyle = '#1c242b';
    ctx.beginPath();
    ctx.ellipse(0, 2, bw * 0.48, bh * 0.46, 0, 0, TAU);
    ctx.fill();

    // Metal lip
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.ellipse(0, -bh * 0.35, bw * 0.46, bh * 0.22, 0, 0, TAU);
    ctx.fill();

    // Bubbling neon slime
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, -bh * 0.35, bw * 0.4, bh * 0.16, 0, 0, TAU);
    ctx.fill();

    // Floating bubbles
    const t = Date.now() * 0.005;
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(-bw * 0.15, -bh * 0.45 + Math.sin(t) * 3, 3.5, 0, TAU);
    ctx.arc(bw * 0.12, -bh * 0.5 + Math.cos(t) * 4, 4, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private renderGhost(
    ctx: CanvasRenderingContext2D,
    bw: number,
    bh: number,
    _expression: string
  ) {
    const t = Date.now() * 0.004;
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#5eead4';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(0, -bh * 0.1, bw * 0.42, Math.PI, 0);
    ctx.lineTo(bw * 0.42, bh * 0.4);
    ctx.quadraticCurveTo(bw * 0.2, bh * 0.6 + Math.sin(t) * 3, 0, bh * 0.4);
    ctx.quadraticCurveTo(-bw * 0.2, bh * 0.6 - Math.sin(t) * 3, -bw * 0.42, bh * 0.4);
    ctx.closePath();
    ctx.fill();

    // Glowing cute eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-bw * 0.16, -bh * 0.1, 4.5, 7, 0, 0, TAU);
    ctx.ellipse(bw * 0.16, -bh * 0.1, 4.5, 7, 0, 0, TAU);
    ctx.fill();

    // Star blush
    ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
    ctx.beginPath();
    ctx.arc(-bw * 0.25, 0, 4, 0, TAU);
    ctx.arc(bw * 0.25, 0, 4, 0, TAU);
    ctx.fill();
  }

  private renderCat(
    ctx: CanvasRenderingContext2D,
    bw: number,
    bh: number,
    _expression: string
  ) {
    // Black cat body
    ctx.fillStyle = '#0a1215';
    ctx.beginPath();
    ctx.ellipse(0, 2, bw * 0.46, bh * 0.46, 0, 0, TAU);
    ctx.fill();

    // Cat ears
    ctx.beginPath();
    ctx.moveTo(-bw * 0.35, -bh * 0.2);
    ctx.lineTo(-bw * 0.22, -bh * 0.7);
    ctx.lineTo(-bw * 0.08, -bh * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bw * 0.08, -bh * 0.3);
    ctx.lineTo(bw * 0.22, -bh * 0.7);
    ctx.lineTo(bw * 0.35, -bh * 0.2);
    ctx.closePath();
    ctx.fill();

    // Inner pink ears
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(-bw * 0.3, -bh * 0.25);
    ctx.lineTo(-bw * 0.22, -bh * 0.6);
    ctx.lineTo(-bw * 0.12, -bh * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bw * 0.12, -bh * 0.3);
    ctx.lineTo(bw * 0.22, -bh * 0.6);
    ctx.lineTo(bw * 0.3, -bh * 0.25);
    ctx.closePath();
    ctx.fill();

    // Golden cat eyes
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(-bw * 0.16, -bh * 0.08, 5.5, 8.5, -0.15, 0, TAU);
    ctx.ellipse(bw * 0.16, -bh * 0.08, 5.5, 8.5, 0.15, 0, TAU);
    ctx.fill();

    // Slit pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(-bw * 0.16, -bh * 0.08, 2, 7.5, 0, 0, TAU);
    ctx.ellipse(bw * 0.16, -bh * 0.08, 2, 7.5, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private renderVampire(
    ctx: CanvasRenderingContext2D,
    bw: number,
    bh: number,
    _expression: string
  ) {
    // Cape wings
    ctx.fillStyle = '#4c0519';
    ctx.beginPath();
    ctx.moveTo(-bw * 0.5, 0);
    ctx.lineTo(-bw * 0.68, -bh * 0.4);
    ctx.lineTo(-bw * 0.4, -bh * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bw * 0.5, 0);
    ctx.lineTo(bw * 0.68, -bh * 0.4);
    ctx.lineTo(bw * 0.4, -bh * 0.2);
    ctx.closePath();
    ctx.fill();

    // Pumpkin body
    this.renderClassicPumpkin(ctx, bw, bh, _expression);

    // Vampire fangs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-bw * 0.12, bh * 0.18);
    ctx.lineTo(-bw * 0.08, bh * 0.18);
    ctx.lineTo(-bw * 0.1, bh * 0.32);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bw * 0.08, bh * 0.18);
    ctx.lineTo(bw * 0.12, bh * 0.18);
    ctx.lineTo(bw * 0.1, bh * 0.32);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Items (Gum, Pop, Wrap, Star, Apple, Moon, Bolt, Ring, Curse, Pinata)
  public drawItem(item: KitzchItem) {
    const ctx = this.ctx;
    const r = item.r;

    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rot);

    switch (item.type) {
      case 'pinata': {
        // Floating Rainbow Ghost Candy Pinata
        ctx.save();
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 18;

        // Striped ghost pinata
        const rainbow = ctx.createLinearGradient(0, -r, 0, r);
        rainbow.addColorStop(0, '#f472b6');
        rainbow.addColorStop(0.33, '#fbbf24');
        rainbow.addColorStop(0.66, '#5eead4');
        rainbow.addColorStop(1, '#c084fc');

        ctx.fillStyle = rainbow;
        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r * 0.8, Math.PI, 0);
        ctx.lineTo(r * 0.8, r * 0.7);
        ctx.lineTo(r * 0.4, r * 0.4);
        ctx.lineTo(0, r * 0.7);
        ctx.lineTo(-r * 0.4, r * 0.4);
        ctx.lineTo(-r * 0.8, r * 0.7);
        ctx.closePath();
        ctx.fill();

        // Pinata blindfold & star eyes
        ctx.fillStyle = '#ffe9b8';
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.2, 3, 0, TAU);
        ctx.arc(r * 0.25, -r * 0.2, 3, 0, TAU);
        ctx.fill();
        ctx.restore();
        break;
      }

      case 'gum': {
        // Gummy sweet
        ctx.fillStyle = item.color;
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.75, 0, TAU);
        ctx.fill();

        // Gloss highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.25, -r * 0.25, r * 0.25, r * 0.15, -Math.PI / 4, 0, TAU);
        ctx.fill();
        break;
      }

      case 'pop': {
        // Lollipop swirl
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-r * 0.1, 0, r * 0.2, r * 1.2);

        ctx.fillStyle = item.color;
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r * 0.75, 0, TAU);
        ctx.fill();

        // Inner spiral
        ctx.strokeStyle = '#FACE91';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r * 0.4, 0, Math.PI * 1.5);
        ctx.stroke();
        break;
      }

      case 'wrap': {
        // Wrapped candy
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.65, r * 0.45, 0, 0, TAU);
        ctx.fill();

        // Wrapper ends
        ctx.fillStyle = '#f4ead2';
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, 0);
        ctx.lineTo(-r * 1.0, -r * 0.35);
        ctx.lineTo(-r * 1.0, r * 0.35);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(r * 0.5, 0);
        ctx.lineTo(r * 1.0, -r * 0.35);
        ctx.lineTo(r * 1.0, r * 0.35);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'star': {
        // Golden Star
        ctx.fillStyle = '#ffe08a';
        ctx.shadowColor = '#ffd36b';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * TAU) / 5 - Math.PI / 2;
          const outerX = Math.cos(a) * r * 0.9;
          const outerY = Math.sin(a) * r * 0.9;
          if (i === 0) ctx.moveTo(outerX, outerY);
          else ctx.lineTo(outerX, outerY);

          const innerA = a + Math.PI / 5;
          ctx.lineTo(Math.cos(innerA) * r * 0.42, Math.sin(innerA) * r * 0.42);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'apple': {
        // Caramel Apple (+50 pts, Speed Boost)
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-r * 0.08, -r * 1.1, r * 0.16, r * 0.7);

        // Apple body
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.7, 0, TAU);
        ctx.fill();

        // Caramel dip
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(0, r * 0.1, r * 0.72, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.quadraticCurveTo(r * 0.3, -r * 0.1, 0, r * 0.05);
        ctx.quadraticCurveTo(-r * 0.3, -r * 0.1, -r * 0.65, r * 0.25);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'moon': {
        // Moon magnet powerup
        ctx.fillStyle = '#c4b0ff';
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.75, 0.5, Math.PI * 1.5, false);
        ctx.arc(r * 0.25, 0, r * 0.55, Math.PI * 1.5, 0.5, true);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'bolt': {
        // Lightning bolt powerup
        ctx.fillStyle = '#ffb347';
        ctx.shadowColor = '#F86903';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(r * 0.2, -r * 0.85);
        ctx.lineTo(-r * 0.45, -r * 0.05);
        ctx.lineTo(-r * 0.05, 0);
        ctx.lineTo(-r * 0.35, r * 0.85);
        ctx.lineTo(r * 0.5, 0);
        ctx.lineTo(r * 0.1, -r * 0.05);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'ring': {
        // Shield ring powerup
        ctx.strokeStyle = '#5eead4';
        ctx.shadowColor = '#5eead4';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.65, 0, TAU);
        ctx.stroke();

        ctx.fillStyle = 'rgba(94, 234, 212, 0.25)';
        ctx.fill();
        break;
      }

      case 'curse': {
        // Cursed Orb (Hazard)
        ctx.fillStyle = '#1c0704';
        ctx.shadowColor = '#ff3b2e';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.8, 0, TAU);
        ctx.fill();

        // Cursed red iris
        ctx.fillStyle = '#ff3b2e';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.4, 0, TAU);
        ctx.fill();

        // Pupil slit
        ctx.fillStyle = '#050c0e';
        ctx.fillRect(-r * 0.08, -r * 0.35, r * 0.16, r * 0.7);
        break;
      }
    }

    ctx.restore();
  }

  // Draw particle bursts
  public drawParticles(parts: KitzchParticle[]) {
    const ctx = this.ctx;
    parts.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      if (p.shape === 'star') {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * TAU) / 5 - Math.PI / 2;
          const ox = p.x + Math.cos(a) * p.size;
          const oy = p.y + Math.sin(a) * p.size;
          if (i === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.isSpark) {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // Draw floating popup text
  public drawTexts(txts: FloatingPopText[]) {
    const ctx = this.ctx;
    txts.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.life);
      const scale = t.scale || 1;
      ctx.font = `700 ${Math.round(18 * scale)}px 'Space Grotesk', sans-serif`;
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = 'rgba(5, 12, 14, 0.95)';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, t.x, t.y);

      // Text fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  }
}
