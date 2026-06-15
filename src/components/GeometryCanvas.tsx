/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Geometry, Star } from '../types';

interface GeometryCanvasProps {
  centerAngle: number;
  stage: number;
  selectedAngle: number;
  isAnimating: boolean;
  animProgress: number;
  animType: 'fire' | 'collect' | 'none';
  stars: Star[];
  globalTime: number;
}

export function getGeometry(centerDeg: number, stage: number, width: number, height: number): Geometry {
  const cx = width * 0.5;
  const cy = height * 0.44; // Shift slightly upwards to reserve safe space for bottom central angle labels
  const r = Math.min(width, height) * 0.31; // Compass-scaled radius to prevent labels from clipping off boundaries

  let pAngle = Math.PI; // Default P on the left
  let aAngle = 0, bAngle = 0;

  const centerRad = (centerDeg * Math.PI) / 180;

  if (stage === 1) {
    pAngle = Math.PI * 0.95;
    bAngle = pAngle - Math.PI; // PB is diameter
    aAngle = bAngle - centerRad;
  } else if (stage === 2) {
    // Stage 2 is Inside (O is inside the angle)
    pAngle = Math.PI * 0.12;
    aAngle = pAngle + Math.PI * 0.85;
    bAngle = aAngle + centerRad;
  } else {
    // Stage 3 is Outside (O is outside the angle)
    // Symmetrical layout with P at 180 (left) and A/B in the bottom half centered around 90 (down)
    pAngle = Math.PI;
    aAngle = Math.PI * 0.5 + centerRad / 2;
    bAngle = Math.PI * 0.5 - centerRad / 2;
  }

  // Normalize arc bounds for star generation
  let arcStart = stage === 3 ? bAngle : aAngle;
  let arcEnd = stage === 3 ? aAngle : bAngle;
  if (arcStart > arcEnd) {
    arcEnd += Math.PI * 2;
  }

  return {
    cx,
    cy,
    r,
    pAngle,
    aAngle,
    bAngle,
    arcStart,
    arcEnd,
    px: cx + r * Math.cos(pAngle),
    py: cy + r * Math.sin(pAngle),
    ax: cx + r * Math.cos(aAngle),
    ay: cy + r * Math.sin(aAngle),
    bx: cx + r * Math.cos(bAngle),
    by: cy + r * Math.sin(bAngle),
    dx: cx + r * Math.cos(pAngle + Math.PI),
    dy: cy + r * Math.sin(pAngle + Math.PI),
  };
}

function normalizeAngle(ang: number) {
  while (ang > Math.PI) ang -= Math.PI * 2;
  while (ang < -Math.PI) ang += Math.PI * 2;
  return ang;
}

export function GeometryCanvas({
  centerAngle,
  stage,
  selectedAngle,
  isAnimating,
  animProgress,
  animType,
  stars,
  globalTime,
}: GeometryCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 450, height: 450 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: width || 450, height: height || 450 });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and Redraw
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const g = getGeometry(centerAngle, stage, dimensions.width, dimensions.height);

    // Helpers
    const fillTriangle = (
      c: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x3: number,
      y3: number,
      fillStyle: string
    ) => {
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.lineTo(x3, y3);
      c.closePath();
      c.fillStyle = fillStyle;
      c.fill();
    };

    const drawSegment = (
      c: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      isDash = false,
      width = 2
    ) => {
      c.save();
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.strokeStyle = color;
      c.lineWidth = width;
      if (isDash) c.setLineDash([5, 5]);
      c.stroke();
      c.restore();
    };

    const drawCircleMark = (c: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
      c.save();
      c.beginPath();
      c.arc(x, y, radius, 0, Math.PI * 2);
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.stroke();
      c.restore();
    };

    const drawCrossMark = (c: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
      c.save();
      c.beginPath();
      c.moveTo(x - radius, y - radius);
      c.lineTo(x + radius, y + radius);
      c.moveTo(x + radius, y - radius);
      c.lineTo(x - radius, y + radius);
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.stroke();
      c.restore();
    };

    const angleMarkAt = (
      c: CanvasRenderingContext2D,
      originX: number,
      originY: number,
      startAng: number,
      endAng: number,
      radius: number,
      isCircle: boolean,
      color: string
    ) => {
      let diff = normalizeAngle(endAng - startAng);
      
      // Strict mathematical guard: ensure the arc mark is always the smaller interior angle (<180 degrees)
      if (Math.abs(diff) > Math.PI) {
        diff = diff > 0 ? diff - Math.PI * 2 : diff + Math.PI * 2;
      }

      c.save();
      c.beginPath();
      c.arc(originX, originY, radius, startAng, startAng + diff, diff < 0);
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      c.stroke();

      const mid = startAng + diff * 0.5;
      const mx = originX + (radius + 15) * Math.cos(mid);
      const my = originY + (radius + 15) * Math.sin(mid);

      if (isCircle) drawCircleMark(c, mx, my, 4, color);
      else drawCrossMark(c, mx, my, 4, color);
      c.restore();
    };

    const centralMarkAt = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      startAng: number,
      endAng: number,
      radius: number,
      isCircle: boolean,
      color: string,
      angleVal?: number
    ) => {
      let diff = normalizeAngle(endAng - startAng);
      if (Math.abs(diff) > Math.PI) {
        diff = diff > 0 ? diff - Math.PI * 2 : diff + Math.PI * 2;
      }

      c.save();
      // Double arc representing central angle is twice the inscribed angle
      c.beginPath();
      c.arc(cx, cy, radius, startAng, startAng + diff, diff < 0);
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      c.stroke();

      c.beginPath();
      c.arc(cx, cy, radius + 4, startAng, startAng + diff, diff < 0);
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      c.stroke();

      const mid = startAng + diff * 0.5;
      const mx = cx + (radius + 18) * Math.cos(mid);
      const my = cy + (radius + 18) * Math.sin(mid);

      // Compute perpendicular tangent direction to align double marks perfectly along the concentric arc
      const tangentX = -Math.sin(mid);
      const tangentY = Math.cos(mid);
      const m1x = mx - tangentX * 6;
      const m1y = my - tangentY * 6;
      const m2x = mx + tangentX * 6;
      const m2y = my + tangentY * 6;

      if (isCircle) {
        drawCircleMark(c, m1x, m1y, 3.5, color);
        drawCircleMark(c, m2x, m2y, 3.5, color);
      } else {
        drawCrossMark(c, m1x, m1y, 3.5, color);
        drawCrossMark(c, m2x, m2y, 3.5, color);
      }

      if (angleVal !== undefined && angleVal !== null) {
        const tx = cx + (radius + 35) * Math.cos(mid);
        const ty = cy + (radius + 35) * Math.sin(mid);
        c.fillStyle = '#ffeb3b';
        c.font = 'bold 16px Jua, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.shadowColor = '#000000';
        c.shadowBlur = 6;
        c.fillText(`${angleVal}°`, tx, ty);
      }
      c.restore();
    };

    const drawRadiusTick = (c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => {
      const mx = (x1 + x2) * 0.5;
      const my = (y1 + y2) * 0.5;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const nx = -dy / len;
      const ny = dx / len;

      c.save();
      c.beginPath();
      c.moveTo(mx + nx * 6, my + ny * 6);
      c.lineTo(mx - nx * 6, my - ny * 6);
      c.strokeStyle = color;
      c.lineWidth = 2.5;
      c.stroke();
      c.restore();
    };

    const drawCat = (c: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
      c.save();
      c.translate(x, y);

      // The head and face remain strictly upright (0 rotation) to matches authentic handbook layout.
      // We obtain "facing inward" toward O purely by mapping gazing direction and custom-posed puppy-dog pupils.
      const inwardAngle = Math.atan2(g.cy - y, g.cx - x);
      const rCat = 16;

      // Ears pointing perfectly upright/skyward, but offset elegantly on the head
      c.fillStyle = '#eed2ff';
      c.strokeStyle = '#3a0066';
      c.lineWidth = 2.5;

      c.beginPath();
      c.moveTo(-12, -8);
      c.lineTo(-15, -28);
      c.lineTo(-2, -14);
      c.closePath();
      c.fill();
      c.stroke();

      c.beginPath();
      c.moveTo(12, -8);
      c.lineTo(15, -28);
      c.lineTo(2, -14);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = '#ffb3d9';
      c.beginPath();
      c.moveTo(-10, -9);
      c.lineTo(-13, -24);
      c.lineTo(-4, -13);
      c.closePath();
      c.fill();

      c.beginPath();
      c.moveTo(10, -9);
      c.lineTo(13, -24);
      c.lineTo(4, -13);
      c.closePath();
      c.fill();

      // Sitting body structure anchoring on the circumference line, leaning toward O
      c.save();
      c.fillStyle = '#cb8fff';
      c.strokeStyle = '#3a0066';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 11, 13, 0, Math.PI, false);
      c.fill();
      c.stroke();

      // Paws reaching inward pointing toward O
      const p1x = 7 * Math.cos(inwardAngle - 0.2);
      const p1y = 7 * Math.sin(inwardAngle - 0.2) + 6;
      const p2x = 7 * Math.cos(inwardAngle + 0.2);
      const p2y = 7 * Math.sin(inwardAngle + 0.2) + 6;

      c.fillStyle = '#eed2ff';
      c.beginPath();
      c.arc(p1x, p1y, 4.5, 0, Math.PI * 2);
      c.arc(p2x, p2y, 4.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();

      // Face
      c.fillStyle = '#dfb0ff';
      c.strokeStyle = '#3a0066';
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(0, 0, rCat, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Gazing pupil directions (gaze offsets towards O)
      const gazeDist = 2.4;
      const gx = gazeDist * Math.cos(inwardAngle);
      const gy = gazeDist * Math.sin(inwardAngle) - 2; // -2 base offset for eye vertical centers

      // Large adorable starry eyes
      c.fillStyle = '#220044';
      c.beginPath();
      c.arc(-5, -2, 3, 0, Math.PI * 2);
      c.arc(5, -2, 3, 0, Math.PI * 2);
      c.fill();

      // Shiny catchlight reflection dots pointing directly at center O!
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(-5 + gx, -2 + gy, 1.3, 0, Math.PI * 2);
      c.arc(5 + gx, -2 + gy, 1.3, 0, Math.PI * 2);
      c.fill();

      // Nose
      c.fillStyle = '#ff88cc';
      c.beginPath();
      c.moveTo(-2, 2);
      c.lineTo(2, 2);
      c.lineTo(0, 4);
      c.closePath();
      c.fill();

      // Whiskers
      c.strokeStyle = '#220044';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-12, 2);
      c.lineTo(-22, 1);
      c.moveTo(-12, 5);
      c.lineTo(-23, 5);
      c.moveTo(12, 2);
      c.lineTo(22, 1);
      c.moveTo(12, 5);
      c.lineTo(23, 5);
      c.stroke();

      // Cheeks
      c.fillStyle = 'rgba(255, 136, 204, 0.6)';
      c.beginPath();
      c.arc(-9, 3, 3, 0, Math.PI * 2);
      c.arc(9, 3, 3, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    const drawStarFace = (c: CanvasRenderingContext2D, x: number, y: number, sSize: number, color: string, rotateAngle = 0) => {
      c.save();
      c.translate(x, y);
      c.rotate(rotateAngle);
      c.beginPath();
      for (let i = 0; i < 5; i++) {
        c.lineTo(
          Math.cos(((18 + i * 72) * Math.PI) / 180) * sSize,
          Math.sin(((18 + i * 72) * Math.PI) / 180) * sSize
        );
        c.lineTo(
          Math.cos(((54 + i * 72) * Math.PI) / 180) * (sSize * 0.4),
          Math.sin(((54 + i * 72) * Math.PI) / 180) * (sSize * 0.4)
        );
      }
      c.closePath();
      c.fillStyle = color;
      c.shadowColor = '#ffd700';
      c.shadowBlur = 8;
      c.fill();
      c.shadowBlur = 0;

      // Eyes
      c.fillStyle = '#220044';
      c.beginPath();
      c.arc(-2, -1, 1.2, 0, Math.PI * 2);
      c.arc(2, -1, 1.2, 0, Math.PI * 2);
      c.fill();

      // Cheeks
      c.fillStyle = '#ffb3d9';
      c.beginPath();
      c.arc(-3, 1, 1.2, 0, Math.PI * 2);
      c.arc(3, 1, 1.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // Draw main circle boundary
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(150, 80, 240, 0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Fill segment/arc area beautifully
    if (centerAngle === 252) {
      // Draw 7 adjacent sectors of 36 degrees each
      const deltaRad = (36 * Math.PI) / 180;
      for (let i = 0; i < 7; i++) {
        const startRad = g.arcStart + i * deltaRad;
        const endRad = g.arcStart + (i + 1) * deltaRad;

        ctx.beginPath();
        ctx.moveTo(g.cx, g.cy);
        ctx.arc(g.cx, g.cy, g.r, startRad, endRad);
        ctx.closePath();
        // alternating subtle colors for aesthetic clarity
        ctx.fillStyle = i % 2 === 0 ? 'rgba(253, 224, 71, 0.16)' : 'rgba(249, 115, 22, 0.08)';
        ctx.fill();

        // Draw the slice boundary line (except outer borders OA and OB, which are drawn later)
        if (i < 6) {
          ctx.beginPath();
          ctx.moveTo(g.cx, g.cy);
          ctx.lineTo(g.cx + g.r * Math.cos(endRad), g.cy + g.r * Math.sin(endRad));
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(g.cx, g.cy);
      ctx.arc(g.cx, g.cy, g.r, g.arcStart, g.arcEnd);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
      ctx.fill();
    }

    // Draw main structural lines
    drawSegment(ctx, g.cx, g.cy, g.ax, g.ay, '#ffd700', false, 2.5); // OA
    drawSegment(ctx, g.cx, g.cy, g.bx, g.by, '#ffd700', false, 2.5); // OB
    drawSegment(ctx, g.px, g.py, g.ax, g.ay, '#ffffff', true, 1.5); // PA
    drawSegment(ctx, g.px, g.py, g.bx, g.by, '#ffffff', true, 1.5); // PB

    // Aux direct supplementary line D-P-O across stages
    drawSegment(ctx, g.px, g.py, g.dx, g.dy, '#44eebb', true, 1.5); // PD (auxiliary diameter)

    // Render isosceles triangle markings and equal angles
    const pink = '#ff88cc';
    const mint = '#44eebb';

    const angPA = Math.atan2(g.ay - g.py, g.ax - g.px);
    const angPO = Math.atan2(g.cy - g.py, g.cx - g.px);
    const angPB = Math.atan2(g.by - g.py, g.bx - g.px);
    const angPD = Math.atan2(g.dy - g.py, g.dx - g.px);

    const angOA = Math.atan2(g.ay - g.cy, g.ax - g.cx);
    const angOB = Math.atan2(g.by - g.cy, g.bx - g.cx);
    const angOD = Math.atan2(g.dy - g.cy, g.dx - g.cx);

    if (stage === 1) {
      fillTriangle(ctx, g.px, g.py, g.ax, g.ay, g.cx, g.cy, 'rgba(255, 136, 204, 0.12)');

      angleMarkAt(ctx, g.px, g.py, angPO, angPA, 32, true, pink);
      angleMarkAt(ctx, g.ax, g.ay, Math.atan2(g.cy - g.ay, g.cx - g.ax), Math.atan2(g.py - g.ay, g.px - g.ax), 32, true, pink);
      // Main central angle AOB in bright yellow-gold
      centralMarkAt(ctx, g.cx, g.cy, angOA, angOB, 26, true, '#ffd700', centerAngle);

      drawRadiusTick(ctx, g.cx, g.cy, g.ax, g.ay, pink);
      drawRadiusTick(ctx, g.cx, g.cy, g.px, g.py, pink);
    } else if (stage === 2) {
      // Stage 2: Inside (previously Stage 3 logic)
      fillTriangle(ctx, g.px, g.py, g.ax, g.ay, g.cx, g.cy, 'rgba(255, 136, 204, 0.08)');
      fillTriangle(ctx, g.px, g.py, g.bx, g.by, g.cx, g.cy, 'rgba(68, 238, 188, 0.08)');

      angleMarkAt(ctx, g.px, g.py, angPD, angPA, 30, true, pink);
      angleMarkAt(ctx, g.px, g.py, angPB, angPD, 36, false, mint);

      angleMarkAt(ctx, g.ax, g.ay, Math.atan2(g.cy - g.ay, g.cx - g.ax), Math.atan2(g.py - g.ay, g.px - g.ax), 26, true, pink);
      angleMarkAt(ctx, g.bx, g.by, Math.atan2(g.py - g.by, g.px - g.bx), Math.atan2(g.cy - g.by, g.cx - g.bx), 26, false, mint);

      centralMarkAt(ctx, g.cx, g.cy, angOA, angOD, 25, true, pink);
      centralMarkAt(ctx, g.cx, g.cy, angOD, angOB, 29, false, mint);
      // Always show full central angle AOB and key value
      centralMarkAt(ctx, g.cx, g.cy, angOA, angOB, 18, true, '#ffd700', centerAngle);

      drawRadiusTick(ctx, g.cx, g.cy, g.ax, g.ay, pink);
      drawRadiusTick(ctx, g.cx, g.cy, g.bx, g.by, mint);
      drawRadiusTick(ctx, g.cx, g.cy, g.px, g.py, '#ffffff');
    } else if (stage === 3) {
      // Stage 3: Outside (previously Stage 2 logic)
      fillTriangle(ctx, g.px, g.py, g.ax, g.ay, g.cx, g.cy, 'rgba(255, 136, 204, 0.08)');
      fillTriangle(ctx, g.px, g.py, g.bx, g.by, g.cx, g.cy, 'rgba(68, 238, 188, 0.1)');

      angleMarkAt(ctx, g.px, g.py, angPD, angPA, 36, true, pink);
      angleMarkAt(ctx, g.px, g.py, angPD, angPB, 23, false, mint);

      angleMarkAt(ctx, g.ax, g.ay, Math.atan2(g.cy - g.ay, g.cx - g.ax), Math.atan2(g.py - g.ay, g.px - g.ax), 26, true, pink);
      angleMarkAt(ctx, g.bx, g.by, Math.atan2(g.py - g.by, g.px - g.bx), Math.atan2(g.cy - g.by, g.cx - g.bx), 26, false, mint);

      centralMarkAt(ctx, g.cx, g.cy, angOD, angOA, 32, true, pink);
      centralMarkAt(ctx, g.cx, g.cy, angOD, angOB, 24, false, mint);
      // Always show full central angle AOB and key value (drawn from B to A for Stage 3)
      centralMarkAt(ctx, g.cx, g.cy, angOB, angOA, 18, true, '#ffd700', centerAngle);

      drawRadiusTick(ctx, g.cx, g.cy, g.ax, g.ay, pink);
      drawRadiusTick(ctx, g.cx, g.cy, g.bx, g.by, mint);
      drawRadiusTick(ctx, g.cx, g.cy, g.px, g.py, '#ffffff');
    }

    // Live preview of custom selected angle if not fired/fired target
    if (!isAnimating || animType !== 'fire') {
      const userRad = (selectedAngle * Math.PI) / 180;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(g.px, g.py);

      const baseAng = stage === 3
        ? Math.atan2(g.by - g.py, g.bx - g.px)
        : Math.atan2(g.ay - g.py, g.ax - g.px);
      const targetAng = baseAng + userRad;

      ctx.lineTo(g.px + g.r * 1.8 * Math.cos(targetAng), g.py + g.r * 1.8 * Math.sin(targetAng));
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    // Fire expansion visual animation (curved triangular net filling the arc area)
    if (isAnimating && animType === 'fire') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(g.px, g.py);
      const t = animProgress;

      let start = g.arcStart;
      let end = g.arcEnd;
      if (end < start) end += Math.PI * 2;

      const numPoints = 30;
      for (let i = 0; i <= numPoints; i++) {
        const ratio = i / numPoints;
        const theta = start + (end - start) * ratio;
        const targetX = g.cx + g.r * Math.cos(theta);
        const targetY = g.cy + g.r * Math.sin(theta);

        const netX = g.px + t * (targetX - g.px);
        const netY = g.py + t * (targetY - g.py);
        ctx.lineTo(netX, netY);
      }

      ctx.closePath();
      ctx.fillStyle = 'rgba(68, 238, 188, 0.32)';
      ctx.fill();
      ctx.strokeStyle = '#44eebb';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // Draw Kitty sniper P
    drawCat(ctx, g.px, g.py, g.pAngle + Math.PI);

    // Draw text labels with offset protection for beautiful layout
    ctx.save();
    ctx.font = 'bold 17px Noto Sans KR, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;

    ctx.fillText('P', g.px - 22, g.py + 6);
    ctx.fillText('A', g.ax + 12, g.ay - 5);
    ctx.fillText('B', g.bx + 12, g.by + 16);
    ctx.fillText('O', g.cx - 22, g.cy - 12);
    ctx.fillText('D', g.dx + 12, g.dy + 6);
    ctx.restore();

    // Central Moon O rendering with live animations and lovely blush
    const bounce = Math.sin(globalTime * 0.05) * 1.5;
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.beginPath();
    ctx.arc(0, 0, 18 + bounce, 0, Math.PI * 2);
    ctx.fillStyle = '#ffee7a';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#3a2b00';
    const isBlinking = Math.floor(globalTime * 0.008) % 5 === 0;
    if (isBlinking) {
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#3a2b00';
      ctx.beginPath();
      ctx.arc(-5, -2, 3, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(5, -2, 3, Math.PI, 0);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffa2a2';
    ctx.beginPath();
    ctx.arc(-10, 3, 3.5, 0, Math.PI * 2);
    ctx.arc(10, 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw active star targets on the arc
    stars.forEach((s) => {
      // Pin star dynamically on the circle arc using current responsive dimensions
      const sX = g.cx + g.r * Math.cos(s.angle);
      const sY = g.cy + g.r * Math.sin(s.angle);

      if (animType !== 'collect' && s.visible) {
        drawStarFace(ctx, sX, sY, 13, '#ffd700', Math.sin(globalTime * 0.07 + s.angle) * 0.12);
      } else if (animType === 'collect') {
        const t = animProgress;
        const cpX = (sX + g.px) * 0.5 + Math.sin(s.angle) * 70;
        const cpY = (sY + g.py) * 0.5 + Math.cos(s.angle) * 70;

        // Quadratic Bezier interpolation for satisfying gravity gathering motion paths
        const currX = (1 - t) * (1 - t) * sX + 2 * (1 - t) * t * cpX + t * t * g.px;
        const currY = (1 - t) * (1 - t) * sY + 2 * (1 - t) * t * cpY + t * t * g.py;

        drawStarFace(ctx, currX, currY, 12 * (1 - t * 0.6), '#ffd700');
      }
    });
  }, [dimensions, centerAngle, stage, selectedAngle, isAnimating, animProgress, animType, stars, globalTime]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[320px] max-h-[550px] relative">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full block"
      />
    </div>
  );
}
