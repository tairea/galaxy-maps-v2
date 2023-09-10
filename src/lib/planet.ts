export class Planet {
  x: number;
  y: number;
  startingPos: { x: number; y: number };
  radian: number;
  radius: number;
  color: string;
  velocity: number;
  orbitRadius: number;

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity: number,
    orbitRadius: number,
  ) {
    // this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.startingPos = {
      x,
      y,
    };
    this.radian = Math.random() * 6.28;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.orbitRadius = orbitRadius;

    this.x = this.startingPos.x + Math.cos(this.radian) * this.orbitRadius;
    // Get the new y based on our new angle and radius
    this.y = this.startingPos.y + Math.sin(this.radian) * this.orbitRadius;
  }

  draw(ctx: CanvasRenderingContext2D, strokeColor: string) {
    // Planet Path
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.arc(this.startingPos.x, this.startingPos.y, this.orbitRadius, 0, Math.PI * 2, false);
    // ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
    ctx.closePath();

    // Planet
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  update(ctx: CanvasRenderingContext2D, delta: number, strokeColor: string) {
    this.draw(ctx, strokeColor);

    this.radian += this.velocity * delta; // increase our angle every animation frame
    // Get the new x based on our new angle and radius
    this.x = this.startingPos.x + Math.cos(this.radian) * this.orbitRadius;
    // Get the new y based on our new angle and radius
    this.y = this.startingPos.y + Math.sin(this.radian) * this.orbitRadius;
  }
}
