// A* pathfinding with binary heap priority queue
class BinaryHeap {
  constructor(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
  }

  push(element) {
    this.content.push(element);
    this._sinkDown(this.content.length - 1);
  }

  pop() {
    const result = this.content[0];
    const end = this.content.pop();
    if (this.content.length > 0) {
      this.content[0] = end;
      this._bubbleUp(0);
    }
    return result;
  }

  get size() { return this.content.length; }

  _sinkDown(n) {
    const element = this.content[n];
    const score = this.scoreFunction(element);
    while (n > 0) {
      const parentN = ((n + 1) >> 1) - 1;
      const parent = this.content[parentN];
      if (score < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        n = parentN;
      } else break;
    }
  }

  _bubbleUp(n) {
    const length = this.content.length;
    const element = this.content[n];
    const score = this.scoreFunction(element);

    while (true) {
      const child2N = (n + 1) << 1;
      const child1N = child2N - 1;
      let swap = null;
      let child1Score;
      if (child1N < length) {
        child1Score = this.scoreFunction(this.content[child1N]);
        if (child1Score < score) swap = child1N;
      }
      if (child2N < length) {
        const child2Score = this.scoreFunction(this.content[child2N]);
        if (child2Score < (swap === null ? score : child1Score)) swap = child2N;
      }
      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      } else break;
    }
  }
}

class Pathfinder {
  constructor(map) {
    this.map = map;
  }

  findPath(startX, startY, endX, endY, unitType = 'vehicle', maxIterations = 2000) {
    const sx = Math.round(startX);
    const sy = Math.round(startY);
    const ex = Math.round(endX);
    const ey = Math.round(endY);

    if (sx === ex && sy === ey) return [{ x: ex, y: ey }];
    if (!this._isPassable(ex, ey, unitType)) {
      // Find nearest passable tile to target
      const nearest = this._findNearestPassable(ex, ey, unitType);
      if (!nearest) return null;
      return this.findPath(startX, startY, nearest.x, nearest.y, unitType, maxIterations);
    }

    const open = new BinaryHeap(n => n.f);
    const closed = new Set();
    const startNode = { x: sx, y: sy, g: 0, h: this._heuristic(sx, sy, ex, ey), f: 0, parent: null };
    startNode.f = startNode.g + startNode.h;
    open.push(startNode);

    let iterations = 0;
    const dirs = [
      { dx: -1, dy: 0, cost: 1 }, { dx: 1, dy: 0, cost: 1 },
      { dx: 0, dy: -1, cost: 1 }, { dx: 0, dy: 1, cost: 1 },
      { dx: -1, dy: -1, cost: 1.41 }, { dx: 1, dy: -1, cost: 1.41 },
      { dx: -1, dy: 1, cost: 1.41 }, { dx: 1, dy: 1, cost: 1.41 },
    ];

    while (open.size > 0 && iterations < maxIterations) {
      iterations++;
      const current = open.pop();
      const key = current.x + current.y * this.map.width;

      if (current.x === ex && current.y === ey) {
        return this._reconstructPath(current);
      }

      if (closed.has(key)) continue;
      closed.add(key);

      for (const dir of dirs) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const nKey = nx + ny * this.map.width;

        if (closed.has(nKey)) continue;
        if (!this._isPassable(nx, ny, unitType)) continue;

        // Prevent diagonal movement through walls
        if (dir.dx !== 0 && dir.dy !== 0) {
          if (!this._isPassable(current.x + dir.dx, current.y, unitType) ||
              !this._isPassable(current.x, current.y + dir.dy, unitType)) {
            continue;
          }
        }

        const g = current.g + dir.cost;
        const h = this._heuristic(nx, ny, ex, ey);
        open.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
      }
    }

    return null; // No path found
  }

  _isPassable(x, y, unitType) {
    if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) return false;
    const tile = this.map.tiles[y][x];
    if (unitType === 'naval') return tile === TERRAIN.WATER;
    if (unitType === 'air') return true;
    if (unitType === 'amphibious') return tile !== TERRAIN.ROCK && tile !== TERRAIN.CLIFF;
    return TERRAIN_WALKABLE[tile] !== false;
  }

  _heuristic(ax, ay, bx, by) {
    // Octile distance
    const dx = Math.abs(ax - bx);
    const dy = Math.abs(ay - by);
    return Math.max(dx, dy) + 0.41 * Math.min(dx, dy);
  }

  _findNearestPassable(x, y, unitType) {
    for (let r = 1; r < 10; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) {
            if (this._isPassable(x + dx, y + dy, unitType)) {
              return { x: x + dx, y: y + dy };
            }
          }
        }
      }
    }
    return null;
  }

  _reconstructPath(node) {
    const path = [];
    let current = node;
    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }
    // Smooth the path
    return this._smoothPath(path);
  }

  _smoothPath(path) {
    if (path.length <= 2) return path;
    const smoothed = [path[0]];
    let i = 0;
    while (i < path.length - 1) {
      let furthest = i + 1;
      for (let j = path.length - 1; j > i + 1; j--) {
        if (this._hasLineOfSight(path[i].x, path[i].y, path[j].x, path[j].y)) {
          furthest = j;
          break;
        }
      }
      smoothed.push(path[furthest]);
      i = furthest;
    }
    return smoothed;
  }

  _hasLineOfSight(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let cx = x0, cy = y0;

    while (cx !== x1 || cy !== y1) {
      if (!this._isPassable(cx, cy, 'vehicle')) return false;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx) { err += dx; cy += sy; }
    }
    return true;
  }
}
