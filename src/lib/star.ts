export class Star {
  x: number;
  y: number;
  radius: number;
  color: string;
  glowRadius: number;

  constructor(x: number, y: number, radius: number, color: string, glowRadius = 8) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.glowRadius = glowRadius;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Create radial gradient for the fire glow effect
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.glowRadius);

    // Add gradient stops for the fire-like glowing effect
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.4, this.color + "CC"); // 80% opacity
    gradient.addColorStop(0.7, this.color + "66"); // 40% opacity
    gradient.addColorStop(1, "transparent");

    // Draw the glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.glowRadius, 0, Math.PI * 2, false);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();

    // Draw the bright core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  update(ctx: CanvasRenderingContext2D, delta: number) {
    // No pulsing animation, just draw the static glow
    this.draw(ctx);
  }
}
