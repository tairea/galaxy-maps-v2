export class Planet {
  x: number;
  y: number;
  startingPos: { x: number; y: number };
  radian: number;
  radius: number;
  color: string;
  velocity: number;
  orbitRadius: number;
  topicId: string;
  orbitStopped: boolean;
  taskName: string;
  taskIndex: number;

  // Animation properties
  savedRadian: number; // Save the radian position when stopping
  targetRadian: number; // Target radian for animation
  animating: boolean; // Whether currently animating
  animationProgress: number; // Animation progress (0 to 1)
  animationDuration: number; // Animation duration in seconds
  animationStartTime: number; // When animation started

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity: number,
    orbitRadius: number,
    topicId: string,
    taskName?: string,
    taskIndex?: number,
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
    this.topicId = topicId;
    this.orbitStopped = false;
    this.taskName = taskName || "";
    this.taskIndex = taskIndex || 0;

    // Animation properties
    this.savedRadian = this.radian;
    this.targetRadian = this.radian;
    this.animating = false;
    this.animationProgress = 0;
    this.animationDuration = 0.5; // 0.5 seconds for smooth animation
    this.animationStartTime = 0;

    this.x = this.startingPos.x + Math.cos(this.radian) * this.orbitRadius;
    // Get the new y based on our new angle and radius
    this.y = this.startingPos.y + Math.sin(this.radian) * this.orbitRadius;
  }

  // Method to stop orbit and animate to bottom (south) of orbit
  stopOrbit() {
    if (this.animating) return; // Don't start new animation if already animating

    this.savedRadian = this.radian; // Save current position

    // Calculate the nearest bottom position (π/2 radians = 90 degrees = south)
    // Find the closest multiple of 2π that gets us to the bottom
    const currentAngle = this.radian;
    const bottomAngle = Math.PI / 2; // 90 degrees = south

    // Calculate how many full rotations we need to add/subtract to get to the nearest bottom
    const fullRotations = Math.round((currentAngle - bottomAngle) / (2 * Math.PI));
    this.targetRadian = bottomAngle + fullRotations * 2 * Math.PI;

    this.animating = true;
    this.animationProgress = 0;
    this.animationStartTime = Date.now();
    this.orbitStopped = true;
  }

  // Method to resume orbit from saved position
  resumeOrbit() {
    if (this.animating) return; // Don't start new animation if already animating

    // Calculate the closest path to the saved position
    const currentAngle = Math.PI / 2; // We're currently at the bottom
    const targetAngle = this.savedRadian;

    // Find the shortest path by calculating the difference
    let angleDiff = targetAngle - currentAngle;

    // Normalize to the shortest path (-π to π)
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Set target to the closest position
    this.targetRadian = currentAngle + angleDiff;

    this.animating = true;
    this.animationProgress = 0;
    this.animationStartTime = Date.now();
    this.orbitStopped = false;
  }

  // Smooth interpolation between two angles
  interpolateAngle(startAngle: number, endAngle: number, progress: number): number {
    // Handle angle wrapping for smooth interpolation
    let diff = endAngle - startAngle;

    // Ensure we take the shortest path
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;

    return startAngle + diff * progress;
  }

  // Update animation
  updateAnimation(delta: number) {
    if (!this.animating) return;

    const currentTime = Date.now();
    const elapsed = (currentTime - this.animationStartTime) / 1000; // Convert to seconds
    this.animationProgress = Math.min(elapsed / this.animationDuration, 1);

    // Use easeInOutQuad for smooth animation
    const easedProgress =
      this.animationProgress < 0.5
        ? 2 * this.animationProgress * this.animationProgress
        : 1 - Math.pow(-2 * this.animationProgress + 2, 2) / 2;

    // Interpolate between current and target radian
    const startRadian = this.orbitStopped ? this.savedRadian : Math.PI / 2;
    this.radian = this.interpolateAngle(startRadian, this.targetRadian, easedProgress);

    // Update position
    this.x = this.startingPos.x + Math.cos(this.radian) * this.orbitRadius;
    this.y = this.startingPos.y + Math.sin(this.radian) * this.orbitRadius;

    // Check if animation is complete
    if (this.animationProgress >= 1) {
      this.animating = false;
      this.radian = this.targetRadian;
      this.x = this.startingPos.x + Math.cos(this.radian) * this.orbitRadius;
      this.y = this.startingPos.y + Math.sin(this.radian) * this.orbitRadius;
    }
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

  drawLabel(ctx: CanvasRenderingContext2D, labelColor: string, visibleTopicId?: string) {
    if (!this.taskName) return;

    // If a specific topicId is provided, only show labels for planets in that topic
    if (visibleTopicId && this.topicId !== visibleTopicId) return;

    // Set text properties
    ctx.font = "12px Arial";
    ctx.fillStyle = labelColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // Position label to the right of the planet
    const labelX = this.x + 15; // 15px offset from planet
    const labelY = this.y;

    // Draw the task name
    ctx.fillText(this.taskName, labelX, labelY);
  }

  update(ctx: CanvasRenderingContext2D, delta: number, strokeColor: string) {
    this.draw(ctx, strokeColor);

    // Update animation if animating
    if (this.animating) {
      this.updateAnimation(delta);
    } else if (!this.orbitStopped) {
      // Only update position if orbit is not stopped and not animating
      this.radian += this.velocity * delta; // increase our angle every animation frame
      // Get the new x based on our new angle and radius
      this.x = this.startingPos.x + Math.cos(this.radian) * this.orbitRadius;
      // Get the new y based on our new angle and radius
      this.y = this.startingPos.y + Math.sin(this.radian) * this.orbitRadius;
    }
  }
}
