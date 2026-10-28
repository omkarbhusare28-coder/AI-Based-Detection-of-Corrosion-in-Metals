/**
 * Generates procedural realistic test images for quick one-click testing of corrosion detection.
 */

export interface SampleImage {
  id: string;
  name: string;
  description: string;
  expected: string;
  dataUrl: string;
}

function createCorrodedSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Base weathered steel
  const bgGrad = ctx.createLinearGradient(0, 0, 480, 360);
  bgGrad.addColorStop(0, '#3a3330');
  bgGrad.addColorStop(0.5, '#4a3f3b');
  bgGrad.addColorStop(1, '#2c2523');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 480, 360);

  // Heavy rust patches (iron oxide colors: #8b3a1d, #a8421c, #d35400, #5c200c)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 480;
    const y = Math.random() * 360;
    const radius = 25 + Math.random() * 70;
    const rustGrad = ctx.createRadialGradient(x, y, 5, x, y, radius);
    const colors = ['#8b3a1d', '#9e3d1b', '#b3471e', '#6e2912', '#451707'];
    const chosen = colors[Math.floor(Math.random() * colors.length)];
    rustGrad.addColorStop(0, chosen);
    rustGrad.addColorStop(0.7, '#6e2912cc');
    rustGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rustGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pitting and granular texture
  for (let i = 0; i < 3000; i++) {
    const px = Math.random() * 480;
    const py = Math.random() * 360;
    const pSize = Math.random() * 3;
    ctx.fillStyle = Math.random() > 0.4 ? '#311105' : '#c85a24';
    ctx.fillRect(px, py, pSize, pSize);
  }

  // Flaking edge and bolt seam
  ctx.strokeStyle = '#230d05';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(80, 0);
  ctx.bezierCurveTo(120, 150, 160, 200, 140, 360);
  ctx.stroke();

  return canvas.toDataURL('image/jpeg', 0.9);
}

function createModerateRustSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Weathered galvanized steel pipe surface
  const grad = ctx.createLinearGradient(0, 0, 0, 360);
  grad.addColorStop(0, '#78818a');
  grad.addColorStop(0.3, '#949ba3');
  grad.addColorStop(0.7, '#616870');
  grad.addColorStop(1, '#50565c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 360);

  // Metal striations / rolling marks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 360; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random() * 2 - 1));
    ctx.lineTo(480, y + (Math.random() * 2 - 1));
    ctx.stroke();
  }

  // Moderate localized rust creeping from center/weld
  const rustGrad = ctx.createRadialGradient(240, 180, 10, 240, 180, 140);
  rustGrad.addColorStop(0, '#9c4115');
  rustGrad.addColorStop(0.4, '#b85420');
  rustGrad.addColorStop(0.8, '#612a1088');
  rustGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = rustGrad;
  ctx.beginPath();
  ctx.arc(240, 180, 140, 0, Math.PI * 2);
  ctx.fill();

  // Rust speckles and pitting
  for (let i = 0; i < 1500; i++) {
    const rx = 140 + Math.random() * 200;
    const ry = 80 + Math.random() * 200;
    ctx.fillStyle = Math.random() > 0.5 ? '#b85420' : '#451b0a';
    ctx.fillRect(rx, ry, Math.random() * 2.5, Math.random() * 2.5);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

function createCleanMetalSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Brushed 316 Stainless Steel
  const grad = ctx.createLinearGradient(0, 0, 480, 360);
  grad.addColorStop(0, '#b0b5bd');
  grad.addColorStop(0.25, '#dbe0e6');
  grad.addColorStop(0.5, '#9fa6af');
  grad.addColorStop(0.75, '#e5e9ed');
  grad.addColorStop(1, '#8c939d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 360);

  // Brushed steel grain (horizontal fine lines)
  for (let y = 0; y < 360; y += 1) {
    const alpha = 0.04 + Math.random() * 0.08;
    const isLight = Math.random() > 0.5;
    ctx.strokeStyle = isLight ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(480, y);
    ctx.stroke();
  }

  // Specular sheen streak across surface
  const sheen = ctx.createLinearGradient(120, 0, 360, 360);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 480, 360);

  return canvas.toDataURL('image/jpeg', 0.9);
}

function createNonMetalSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Wood plank pattern
  const grad = ctx.createLinearGradient(0, 0, 0, 360);
  grad.addColorStop(0, '#8d5b4c');
  grad.addColorStop(0.5, '#6a3b2b');
  grad.addColorStop(1, '#532d20');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 360);

  // Wood rings and grain
  ctx.strokeStyle = '#3e1e14';
  ctx.lineWidth = 2;
  for (let y = 10; y < 360; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(160, y + 25, 320, y - 25, 480, y + 10);
    ctx.stroke();
  }

  // Text label: "Wooden Surface (Non-Metal Test)"
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Natural Hardwood Surface (Non-Metal)', 80, 180);

  return canvas.toDataURL('image/jpeg', 0.9);
}

let cachedSamples: SampleImage[] | null = null;

export function getSampleImages(): SampleImage[] {
  if (cachedSamples) return cachedSamples;

  cachedSamples = [
    {
      id: 'severe-rust',
      name: 'Corroded Steel Plate',
      description: 'Heavy structural iron-oxide rust with flaking and surface pitting',
      expected: 'Corroded (Severe)',
      dataUrl: createCorrodedSample(),
    },
    {
      id: 'moderate-rust',
      name: 'Oxidized Pipe Section',
      description: 'Localized oxidation creeping on weathered galvanized steel',
      expected: 'Corroded (Moderate)',
      dataUrl: createModerateRustSample(),
    },
    {
      id: 'clean-metal',
      name: 'Clean Stainless Steel',
      description: 'Clean brushed mill finish stainless steel alloy with no corrosion',
      expected: 'Non-corroded',
      dataUrl: createCleanMetalSample(),
    },
    {
      id: 'non-metal',
      name: 'Wooden Board (Non-Metal)',
      description: 'Wood timber grain to test non-metal rejection detection',
      expected: 'Rejection Filter',
      dataUrl: createNonMetalSample(),
    },
  ];

  return cachedSamples;
}
