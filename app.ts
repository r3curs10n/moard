const canvas = <HTMLCanvasElement> document.getElementById('main');

interface Point {
  x: number,
  y: number
}

let isDrawing: boolean = false;
let points: Array<Point> = [];
let ox = 0;
let oy = 0;
let scale = 1;

if (canvas.getContext) {
  var ctx = canvas.getContext('2d');
  // draw(ctx);
} else {
  // canvas-unsupported code here
}

canvas.addEventListener('mousedown', e => {
  isDrawing = true;
  points = [{x: e.offsetX, y: e.offsetY}];
});

canvas.addEventListener('mouseup', e => {
  isDrawing = false;
});

canvas.addEventListener('mousemove', e => {
  if (isDrawing === true) {
    points.push({x: e.offsetX, y: e.offsetY});
    draw(ctx, points);
  }
});

function draw(ctx: CanvasRenderingContext2D, points: Array<Point>): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgb(200,0,0)';
  ctx.fillRect(10,10,50,50);

  let pts = points.map(p => {
    return {x: p.x * scale, y: p.y*scale};
  })

  ctx.beginPath();
  for (let i = 0; i < pts.length-2; i++) {
    const m1x = Math.floor((pts[i].x + pts[i+1].x)/2);
    const m1y = Math.floor((pts[i].y + pts[i+1].y)/2);

    const m2x = Math.floor((pts[i+1].x + pts[i+2].x)/2);
    const m2y = Math.floor((pts[i+1].y + pts[i+2].y)/2);
    
    ctx.moveTo(ox + m1x, oy + m1y);
    ctx.quadraticCurveTo(ox + pts[i+1].x, oy + pts[i+1].y, ox + m2x, oy + m2y);
  }
  ctx.stroke();
}

function redraw(): void {
  draw(ctx, points);
}

function setScale(s: number) {
  scale = s;
}

export = {
  setScale,
  redraw
}
