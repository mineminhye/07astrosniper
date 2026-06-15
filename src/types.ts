/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: number;
  stage: number;
  centerAngle: number;
  story: string;
  quest: string;
}

export interface Geometry {
  cx: number;
  cy: number;
  r: number;
  pAngle: number;
  aAngle: number;
  bAngle: number;
  arcStart: number;
  arcEnd: number;
  px: number;
  py: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  dx: number;
  dy: number;
}

export interface Star {
  angle: number;
  visible: boolean;
  x: number;
  y: number;
}

export interface BgStar {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
}

export interface StageInfo {
  title: string;
  body: string;
}
