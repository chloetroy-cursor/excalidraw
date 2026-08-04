import type {
  ExcalidrawDiamondElement,
  ExcalidrawEllipseElement,
  ExcalidrawRectangleElement,
} from "./types";

type StarFillElement =
  | ExcalidrawRectangleElement
  | ExcalidrawDiamondElement
  | ExcalidrawEllipseElement;

export type StarFillPoint = readonly [number, number];

export type StarFillPath = {
  points: readonly StarFillPoint[];
  path: string;
};

const STAR_SPACING = 18;
const STAR_OUTER_RADIUS = 5;
const STAR_INNER_RADIUS = 2.2;

const getStarPoints = (centerX: number, centerY: number) =>
  Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? STAR_OUTER_RADIUS : STAR_INNER_RADIUS;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    return [
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius,
    ] as const;
  });

export const isPointInStarFillElement = (
  element: Pick<StarFillElement, "type" | "width" | "height">,
  [x, y]: StarFillPoint,
) => {
  if (element.width <= 0 || element.height <= 0) {
    return false;
  }

  if (element.type === "rectangle") {
    return x >= 0 && x <= element.width && y >= 0 && y <= element.height;
  }

  const normalizedX = (x - element.width / 2) / (element.width / 2);
  const normalizedY = (y - element.height / 2) / (element.height / 2);

  return element.type === "diamond"
    ? Math.abs(normalizedX) + Math.abs(normalizedY) <= 1
    : normalizedX ** 2 + normalizedY ** 2 <= 1;
};

export const getStarFillPaths = (
  element: Pick<StarFillElement, "type" | "width" | "height">,
): readonly StarFillPath[] => {
  const paths: StarFillPath[] = [];

  for (
    let centerY = STAR_SPACING / 2;
    centerY <= element.height - STAR_SPACING / 2;
    centerY += STAR_SPACING
  ) {
    for (
      let centerX = STAR_SPACING / 2;
      centerX <= element.width - STAR_SPACING / 2;
      centerX += STAR_SPACING
    ) {
      const points = getStarPoints(centerX, centerY);
      if (
        points.every((point) => isPointInStarFillElement(element, point))
      ) {
        paths.push({
          points,
          path: `${points
            .map(
              ([x, y], index) =>
                `${index === 0 ? "M" : "L"} ${x.toFixed(3)} ${y.toFixed(3)}`,
            )
            .join(" ")} Z`,
        });
      }
    }
  }

  return paths;
};
