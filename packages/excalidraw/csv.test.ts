import { isTextElement } from "@excalidraw/element";
import { convertToExcalidrawElements } from "@excalidraw/element";

import { createTableElements, parseCSV } from "./csv";

describe("CSV", () => {
  describe("parseCSV", () => {
    it("parses comma-separated rows", () => {
      expect(parseCSV("Name,Role\nAda,Engineer\nGrace,Admiral")).toEqual([
        ["Name", "Role"],
        ["Ada", "Engineer"],
        ["Grace", "Admiral"],
      ]);
    });

    it("parses quoted commas, newlines, and escaped quotes", () => {
      expect(
        parseCSV(
          'Name,Notes\r\nAda,"First programmer, mathematician"\r\nGrace,"Said ""debugging""\nwith style"',
        ),
      ).toEqual([
        ["Name", "Notes"],
        ["Ada", "First programmer, mathematician"],
        ["Grace", 'Said "debugging"\nwith style'],
      ]);
    });

    it.each([["plain text"], ["a,b"], ["a,b\nc"], ['a,b\n"unclosed,c']])(
      "rejects non-tabular input: %s",
      (text) => {
        expect(parseCSV(text)).toBeNull();
      },
    );
  });

  describe("createTableElements", () => {
    it("creates aligned bound-text cells in one group", () => {
      const elements = convertToExcalidrawElements(
        createTableElements([
          ["Name", "Role"],
          ["Ada", "Engineer"],
        ]),
      );
      const rectangles = elements.filter(
        (element) => element.type === "rectangle",
      );
      const labels = elements.filter(isTextElement);

      expect(rectangles).toHaveLength(4);
      expect(labels).toHaveLength(4);
      expect(
        new Set(rectangles.flatMap((element) => element.groupIds)),
      ).toEqual(new Set([rectangles[0].groupIds[0]]));
      expect(rectangles.map(({ x, y }) => ({ x, y }))).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 48 },
        { x: 100, y: 48 },
      ]);
      expect(labels.map((element) => element.text)).toEqual([
        "Name",
        "Role",
        "Ada",
        "Engineer",
      ]);
      expect(labels.every((element) => element.containerId)).toBe(true);
    });
  });
});
