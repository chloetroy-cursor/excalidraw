import { isTransparent } from "@excalidraw/common";

import { getDiamondPoints } from "./bounds";
import { getCornerRadius } from "./utils";

import type { NonDeletedExcalidrawElement } from "./types";

const drawStar = (
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
) => {
  context.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    const outerX = cx + outerRadius * Math.cos(outerAngle);
    const outerY = cy + outerRadius * Math.sin(outerAngle);
    const innerX = cx + innerRadius * Math.cos(innerAngle);
    const innerY = cy + innerRadius * Math.sin(innerAngle);

    if (i === 0) {
      context.moveTo(outerX, outerY);
    } else {
      context.lineTo(outerX, outerY);
    }
    context.lineTo(innerX, innerY);
  }
  context.closePath();
  context.fill();
};

export const drawStarFillPattern = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  strokeWidth: number,
) => {
  const gap = Math.max(strokeWidth * 5, 8);
  const outerRadius = Math.max(strokeWidth * 1.2, 2);
  const innerRadius = outerRadius * 0.4;

  context.fillStyle = color;

  for (let y = gap / 2; y < height; y += gap) {
    for (let x = gap / 2; x < width; x += gap) {
      drawStar(context, x, y, outerRadius, innerRadius);
    }
  }
};

const clipElementForStarFill = (
  context: CanvasRenderingContext2D,
  element: NonDeletedExcalidrawElement,
) => {
  switch (element.type) {
    case "rectangle":
    case "iframe":
    case "embeddable": {
      context.beginPath();
      if (element.roundness && context.roundRect) {
        context.roundRect(
          0,
          0,
          element.width,
          element.height,
          getCornerRadius(Math.min(element.width, element.height), element),
        );
      } else {
        context.rect(0, 0, element.width, element.height);
      }
      context.clip();
      break;
    }
    case "diamond": {
      const [topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY] =
        getDiamondPoints(element);
      context.beginPath();
      context.moveTo(topX, topY);
      context.lineTo(rightX, rightY);
      context.lineTo(bottomX, bottomY);
      context.lineTo(leftX, leftY);
      context.closePath();
      context.clip();
      break;
    }
    case "ellipse": {
      context.beginPath();
      context.ellipse(
        element.width / 2,
        element.height / 2,
        element.width / 2,
        element.height / 2,
        0,
        0,
        2 * Math.PI,
      );
      context.clip();
      break;
    }
  }
};

export const maybeDrawStarFill = (
  element: NonDeletedExcalidrawElement,
  context: CanvasRenderingContext2D,
  color: string,
) => {
  if (element.fillStyle !== "star" || isTransparent(element.backgroundColor)) {
    return;
  }

  context.save();
  clipElementForStarFill(context, element);
  drawStarFillPattern(
    context,
    element.width,
    element.height,
    color,
    element.strokeWidth,
  );
  context.restore();
};
