const pinch = require('touch-pinch');

const canvas = <HTMLCanvasElement> document.getElementById('main');

const scaleSlider = <HTMLInputElement> document.getElementById('scale');
const oxSlider = <HTMLInputElement> document.getElementById('ox');
const oySlider = <HTMLInputElement> document.getElementById('oy');
const modeInput = <HTMLInputElement> document.getElementById('mode');

interface Point {
  x: number,
  y: number
}

interface DrawHistory {
  paths: Array<Array<Point>>,
  activePath: Array<Point>
}

interface BoardParams {
  ox: number,
  oy: number,
  scale: number
}

enum Mode {
  DRAW,
  SCROLL
}

let boardParams: BoardParams = {
  ox: 0,
  oy: 0,
  scale: 1,
};

let drawHistory: DrawHistory = {
  paths: [],
  activePath: [],
};

let isDrawing: boolean = false;
let isScrolling: boolean = false;
let scrollStart: Point = {x: 0, y: 0};
let pinchCenter: Point = {x: 0, y: 0};
let pinchCenterBoard: Point = {x: 0, y: 0};
let pinchStartScale: number = 1;
let mode: Mode = Mode.DRAW;

if (canvas.getContext) {
  var ctx = canvas.getContext('2d');
  // draw(ctx);
} else {
  // canvas-unsupported code here
}

function toBoardCoordinates(p: Point): Point {
  return {x: (p.x - boardParams.ox)/boardParams.scale, y: (p.y - boardParams.oy)/boardParams.scale};
}

function toCanvasCoordinates(p: Point): Point {
  return {x: p.x*boardParams.scale + boardParams.ox, y: p.y*boardParams.scale + boardParams.oy};
}

function scalePoint(p: Point, scale: number): Point {
  return {x: p.x * scale, y: p.y * scale};
}

scaleSlider.addEventListener("change", refreshBoardParams);
oxSlider.addEventListener("change", refreshBoardParams);
oySlider.addEventListener("change", refreshBoardParams);

modeInput.addEventListener("change", e => {
  if (modeInput.value === "draw") {
    mode = Mode.DRAW;
  } else {
    mode = Mode.SCROLL;
  }
});

function refreshBoardParams(_: any) {
  console.log('scale: ' + scaleSlider.value, ', ox: ' + oxSlider.value + ', oy: ' + oySlider.value);
  boardParams.scale = +scaleSlider.value;
  boardParams.ox = +oxSlider.value;
  boardParams.oy = +oySlider.value;
  render();
}

function mouseDown(point: Point): void {
  if (mode === Mode.DRAW) {
    isDrawing = true;
    drawHistory.activePath = [toBoardCoordinates({x: point.x, y: point.y})];
  } else if (mode === Mode.SCROLL) {
    isScrolling = true;
    scrollStart = {x: point.x, y: point.y};
  }
}

function mouseUp(): void {
  if (mode === Mode.DRAW) {
    isDrawing = false;
    drawHistory.paths.push(drawHistory.activePath);
    drawHistory.activePath = [];
    render();
  } else if (mode === Mode.SCROLL) {
    isScrolling = false;
  }
}

function mouseMove(point: Point): void {
  if (mode === Mode.DRAW) {
    if (isDrawing) {
      drawHistory.activePath.push(toBoardCoordinates({x: point.x, y: point.y}));
      render();
    }
  } else if (mode === Mode.SCROLL) {
    if (isScrolling) {
      const dx = (point.x - scrollStart.x);
      const dy = (point.y - scrollStart.y);
      scrollStart = {x: point.x, y: point.y};
      boardParams.ox += dx;
      boardParams.oy += dy;
      render();
    }
  }
}

canvas.addEventListener('mousedown', e => mouseDown({x: e.offsetX, y: e.offsetY}));
canvas.addEventListener('mouseup', e => mouseUp());
canvas.addEventListener('mousemove', e => mouseMove({x: e.offsetX, y: e.offsetY}));

function clamp(val: number, min: number, max: number): number {
  return Math.max(Math.min(val, max), min);
}

let pinchHandler = pinch(canvas);

pinchHandler.on('change', (dist: number, prevDist: number) => {
  const delta = dist - prevDist;
  boardParams.scale = Math.exp(clamp(Math.log(boardParams.scale) + delta/100, Math.log(0.25), Math.log(8)));
  boardParams.ox = pinchCenter.x - pinchCenterBoard.x * boardParams.scale;
  boardParams.oy = pinchCenter.y - pinchCenterBoard.y * boardParams.scale;
  render();
})
pinchHandler.on('start', (_: any) => {
  const fingerA = pinchHandler.fingers[0].position;
  const fingerB = pinchHandler.fingers[1].position;
  pinchCenter = {x: Math.floor((fingerA[0] + fingerB[0])/2), y: Math.floor((fingerA[1] + fingerB[1])/2)};
  pinchCenterBoard = toBoardCoordinates(pinchCenter);
  pinchStartScale = boardParams.scale;
})

canvas.addEventListener('touchstart', e => {
  if (e.targetTouches.length > 1) {
    return;
  }
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  mouseDown({x: e.targetTouches[0].clientX - r.x, y: e.targetTouches[0].clientY - r.y});
});

canvas.addEventListener('touchmove', e => {
  if (e.targetTouches.length > 1) {
    mouseUp();
  }
  const r = canvas.getBoundingClientRect();
  mouseMove({x: e.targetTouches[0].clientX - r.x, y: e.targetTouches[0].clientY - r.y});
});

canvas.addEventListener('touchend', e => mouseUp());

function render(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawHistory.paths.forEach(path => {
    ctx.stroke(createDrawablePath(path));
  });
  ctx.stroke(createDrawablePath(drawHistory.activePath));
}

function createDrawablePath(points: Array<Point>): Path2D {
  let path = new Path2D();
  points = points.map(p => toCanvasCoordinates(p));
  for (let i = 0; i < points.length-2; i++) {
    const m1x = Math.floor((points[i].x + points[i+1].x)/2);
    const m1y = Math.floor((points[i].y + points[i+1].y)/2);

    const m2x = Math.floor((points[i+1].x + points[i+2].x)/2);
    const m2y = Math.floor((points[i+1].y + points[i+2].y)/2);

    path.moveTo(m1x, m1y);
    path.quadraticCurveTo(points[i+1].x, points[i+1].y, m2x, m2y);
  }

  return path;
}

function setBoardParams(scale: number, originX: number, originY: number): void {
  boardParams.scale = scale;
  boardParams.ox = originX;
  boardParams.oy = originY;
  render();
}

export {
  setBoardParams,
}
