const GameState = {
  NONE_SELECTED: "none_selected",
  ONE_SELECTED: "one_selected",
  TWO_SELECTED: "two_selected",
}

var curPlayer = 0
var pieces = []
var pawns = []
var canvasPos = []

const cSize = 15
let colors = ['#9e34eb', '#522202', '#f0008c', '#fcba03', '#008080', '#0000ff', '#ff5f1f']
var canvas, scoreboard, ctx, sCtx, centerX, centerY

function distance(x1, x2, y1, y2) {
  var a = x1 - x2;
  var b = y1 - y2;
  return Math.sqrt(a * a + b * b);
}
const Point = (x, y) => ({
  x,
  y
});
const Ray = (p1, p2) => ({
  p1,
  p2
});
const Circle = (p, radius) => ({
  x: p.x,
  y: p.y,
  radius
});


function rayInterceptsCircle(ray, circle) {
  const dx = ray.p2.x - ray.p1.x;
  const dy = ray.p2.y - ray.p1.y;
  const u = Math.min(1, Math.max(0, ((circle.x - ray.p1.x) * dx + (circle.y - ray.p1.y) * dy) / (dy * dy + dx * dx)));
  const nx = ray.p1.x + dx * u - circle.x;
  const ny = ray.p1.y + dy * u - circle.y;
  return nx * nx + ny * ny < circle.radius * circle.radius;
}

function rayDist2Circle(ray, circle) {
  const dx = ray.p2.x - ray.p1.x;
  const dy = ray.p2.y - ray.p1.y;
  const vcx = ray.p1.x - circle.x;
  const vcy = ray.p1.y - circle.y;
  var v = (vcx * dx + vcy * dy) * (-2 / Math.hypot(dx, dy));
  const dd = v * v - 4 * (vcx * vcx + vcy * vcy - circle.radius * circle.radius);
  if (dd <= 0) {
    return Infinity;
  }
  return (v - Math.sqrt(dd)) / 2;
}

function calculateClosest() {
  pieces.forEach(p => {
    let minDist = 10000
    let closest = undefined
    pawns.forEach(pw => {
      d = distance(p.x, pw.x, p.y, pw.y)
      if (d < minDist) {
        minDist = d
        closest = pw
      }
    })
    p.cl = closest
  })
}

function renderPiece(p, selected) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, cSize, 0, 2 * Math.PI, false);
  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "gray"
  if (p.cl != undefined && p.cl.player == 0) {
    ctx.strokeStyle = "black"
  }
  if (p.cl != undefined && p.cl.player == 1) {
    ctx.strokeStyle = "white"
  }

  if (p.type == "pawn") {
    ctx.fillStyle = 'black'
    if (p.player == 1) {
      ctx.fillStyle = "white"
    }
    ctx.fill()
    ctx.stroke()

    ctx.font = "bold 22px verdana, sans-serif";
    ctx.fillStyle = "white";
    if (p.player == 1) {
      ctx.fillStyle = "black"
    }

    ctx.fillText('P', p.x - cSize / 2, p.y + cSize / 2);
  }
  if (p.selected == true) {
    ctx.lineWidth = 5;
    ctx.strokeStyle = invertColor(p.color);
  }
  ctx.stroke();
  // reset ctx
  ctx.lineWidth = 2;
  ctx.strokeStyle = "black"
  if ((p.hovered && selected.length == 0)) {
    renderConnections(p)
  }
}

function render() {
  selected = getSelected()
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, 2 * Math.PI, false);
  ctx.stroke()
  Array.prototype.concat(pieces, pawns).forEach(p => {
    renderPiece(p, selected)
  })
  if (selected.length == 1) {
    renderConnections(selected[0])
  }
  if (selected.length == 2) {
    renderConnection(selected[0], selected[1])
    renderNearestPawn(selected)
  }
  renderScoreboard()
  requestAnimationFrame(render)
}

function renderScoreboard() {
  if (pawns.length == 0) {
    return
  }
  let p0 = []
  let p1 = []
  pieces.forEach(p => {
    if (p.cl != undefined && p.cl.player == 0) {
      p0.push(p)
    } else {
      p1.push(p)
    }
  })
  if (p0.length + p1.length == 0) {
    return
  }

  let p0x = 20
  let p0y = 0
  sCtx.clearRect(0, 0, scoreboard.width, scoreboard.height)
  let prevColor = undefined
  p0.forEach(p => {
    if (p.color != prevColor) {
      p0y += 30
      p0x = 20
    }
    prevColor = p.color
    sCtx.beginPath()
    sCtx.arc(p0x, p0y, cSize, 0, 2 * Math.PI, false);
    sCtx.fillStyle = p.color;
    sCtx.fill();
    sCtx.lineWidth = 2;
    sCtx.strokeStyle = "gray"

    sCtx.stroke();
    // reset ctx
    sCtx.lineWidth = 2;
    sCtx.strokeStyle = "black"
    p0x += 30
  })

  p0x = 20
  p0y = 250
  prevColor = undefined
  p1.forEach(p => {
    if (p.color != prevColor) {
      p0y += 30
      p0x = 20
    }
    prevColor = p.color
    sCtx.beginPath()
    sCtx.arc(p0x, p0y, cSize, 0, 2 * Math.PI, false);
    sCtx.fillStyle = p.color;
    sCtx.fill();
    sCtx.lineWidth = 2;
    sCtx.strokeStyle = "gray"

    sCtx.stroke();
    // reset ctx
    sCtx.lineWidth = 2;
    sCtx.strokeStyle = "black"
    p0x += 30
  })
}

function nearestPosToMouse(x1, x2, y1, y2) {
  let closest = {}
  let minDist = 10000000
  let xp = x1
  let yp = y1
  const steps = 100
  for (let i = 0; i < 100; i++) {
    if (distance(canvasPos[0], xp, canvasPos[1], yp) < minDist) {
      minDist = distance(canvasPos[0], xp, canvasPos[1], yp)
      closest = {
        x: xp,
        y: yp
      }
    }
    xp += (x2 - x1) / 100
    yp += (y2 - y1) / 100
  }
  if (distance(canvasPos[0], xp, canvasPos[1], yp) < minDist) {
    minDist = distance(canvasPos[0], xp, canvasPos[1], yp)
    closest = {
      x: xp,
      y: yp
    }
  }
  return closest
}

function createNearestPawn(s) {
  let c = nearestPosToMouse(s[0].x, s[1].x, s[0].y, s[1].y)
  if (intersectsExisting(c.x, c.y)) {
    return false
  }
  pawns.push({
    x: c.x,
    y: c.y,
    type: "pawn",
    player: curPlayer,
  })
  calculateClosest()
  return true
}

function renderNearestPawn(s) {
  let c = nearestPosToMouse(s[0].x, s[1].x, s[0].y, s[1].y)

  ctx.beginPath();
  ctx.fillStyle = "black"
  if (curPlayer == 1) {
    ctx.fillStyle = "white"
  }

  ctx.arc(c.x, c.y, cSize, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.stroke()
  ctx.fillStyle = "white"
  if (curPlayer == 1) {
    ctx.fillStyle = "black"
  }
  if (intersectsExisting(c.x, c.y)) {
    ctx.fillStyle = "red"
  }

  ctx.font = "bold 22px verdana, sans-serif";

  ctx.fillText('P', c.x - cSize / 2, c.y + cSize / 2);
  ctx.stroke()
}


function removePiece(p) {
  pieces.splice(pieces.indexOf(p), 1)
}


function renderConnections(p1) {
  for (let j = 0; j < pieces.length; j++) {
    renderConnection(p1, pieces[j])
  }
}

function canConnect(p1, p2) {
  for (let i = 0; i < pieces.length; i++) {
    p3 = pieces[i]
    if ((p3 == p1) || (p3 == p2)) {
      continue
    }
    if (rayInterceptsCircle(Ray(Point(p1.x, p1.y), Point(p2.x, p2.y)), {
        x: p3.x,
        y: p3.y,
        radius: cSize
      })) {
      return false
    }
  }
  return true
}

function renderConnection(p1, p2) {
  if (p1.color != p2.color) {
    return
  }
  if (!canConnect(p1, p2)) {
    return
  }
  isBlocked = false
  // Start a new Path
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  // Draw the Path
  ctx.stroke();
}

function getArc(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
}

function avgPos(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

function intersectsExisting(x, y) {
  let intersects = false
  Array.prototype.concat(pieces, pawns).forEach(p => {
    if (distance(p.x, x, p.y, y) <= 1 + cSize * 2) {
      intersects = true
    }
  })
  return intersects
}

window.onload = function() {
  canvas = document.getElementById("myCanvas")
  scoreboard = document.getElementById("scoreboard")
  ctx = canvas.getContext('2d');
  sCtx = scoreboard.getContext('2d');
  centerX = canvas.width / 2
  centerY = canvas.height / 2
  colors.forEach((color) => {
    console.log(`placing color ${color}`)
    for (let i = 0; i < 7; i++) {
      posX = Math.random() * canvas.width
      posY = Math.random() * canvas.height
      if (distance(posX, centerX, posY, centerY) > (canvas.height / 2) - cSize) {
        i--
        continue
      }
      if (intersectsExisting(posX, posY)) {
        i--
        continue
      }
      pieces.push({
        x: posX,
        y: posY,
        color: color,
      })
    }
  })
  canvas.onmousedown = function(e) {
    let [x, y] = getMousePosition(canvas, e)

    let pieceClicked = false
    let selected = getSelected()
    Array.prototype.concat(pieces, pawns).forEach(p => {
      if (p.type == "pawn") {
        return
      }
      getArc(p.x, p.y, cSize)
      if (ctx.isPointInPath(x, y)) {
        pieceClicked = true
        if (selected.length >= 1) {
          if (selected[0].color != p.color) {
            selected.forEach(s => {
              s.selected = false
            })
            p.selected = true
          } else {
            if (!canConnect(selected[0], p)) {
              selected[0].selected = false
            }
            p.selected = true
          }
        } else {
          p.selected = true
        }
      }
    })
    if (!pieceClicked) {
      if (selected.length == 2) {
        if (createNearestPawn(selected)) {
          removePiece(selected[0])
          removePiece(selected[1])
          curPlayer ^= 1
        }
      } else {
        pieces.forEach(p => {
          p.selected = false
        })
      }
    }
  }
  canvas.onmousemove = function(e) {
    let [x, y] = getMousePosition(canvas, e)
    canvasPos = getMousePosition(canvas, e)
    pieces.forEach(p => {
      if (p.type == "pawn") {
        return
      }
      getArc(p.x, p.y, cSize)
      p.hovered = ctx.isPointInPath(x, y)
    })
  };
  render()
}


function getMousePosition(canvas, e) {
  // important: correct mouse position:
  var rect = canvas.getBoundingClientRect(),
    x = e.clientX - rect.left,
    y = e.clientY - rect.top,
    r;
  return [x, y]
}



function padZero(str, len) {
  len = len || 2;
  var zeros = new Array(len).join('0');
  return (zeros + str).slice(-len);
}

function invertColor(hex, bw) {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  var r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16);
  if (bw) {
    // https://stackoverflow.com/a/3943023/112731
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ?
      '#000000' :
      '#FFFFFF';
  }
  // invert color components
  r = (255 - r).toString(16);
  g = (255 - g).toString(16);
  b = (255 - b).toString(16);
  // pad each with zeros and return
  return "#" + padZero(r) + padZero(g) + padZero(b);
}

function getSelected() {
  let res = []
  pieces.forEach(p => {
    if (p.selected) {
      res.push(p)
    }
  })
  return res
}