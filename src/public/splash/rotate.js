let rotation = 0;

function animateGradient() {
  const ring = document.getElementById('ring');
  rotation = (rotation + 1) % 360;
  ring.style.rotate = `${-rotation}deg`;
  requestAnimationFrame(animateGradient);
}
// Initialize the animation
animateGradient();

