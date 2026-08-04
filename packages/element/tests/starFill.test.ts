import { getStarFillPaths, isPointInStarFillElement } from "../src/starFill";

describe("star fill geometry", () => {
  const shapes = [
    { type: "rectangle", width: 120, height: 90 },
    { type: "diamond", width: 120, height: 90 },
    { type: "ellipse", width: 120, height: 90 },
  ] as const;

  it("generates genuine deterministic star paths", () => {
    const first = getStarFillPaths(shapes[0]);
    const second = getStarFillPaths(shapes[0]);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
    expect(first[0].points).toHaveLength(10);
    expect(first[0].path).toMatch(/^M .+ L .+ Z$/);
  });

  it.each(shapes)("keeps every star vertex inside $type", (shape) => {
    const stars = getStarFillPaths(shape);

    expect(stars.length).toBeGreaterThan(0);
    expect(
      stars.every((star) =>
        star.points.every((point) => isPointInStarFillElement(shape, point)),
      ),
    ).toBe(true);
  });
});
