import { parseDelimitedTable, renderTable } from "./tables";

describe("CSV tables", () => {
  describe("parseDelimitedTable", () => {
    it("parses comma-separated values", () => {
      expect(
        parseDelimitedTable(
          "Name,Role,Location\nAda,Engineer,London\nLin,Designer,Taipei",
        ),
      ).toEqual([
        ["Name", "Role", "Location"],
        ["Ada", "Engineer", "London"],
        ["Lin", "Designer", "Taipei"],
      ]);
    });

    it("parses quoted values containing delimiters and line breaks", () => {
      expect(
        parseDelimitedTable(
          'Name,Notes\nAda,"Writes code, tests, and docs"\nLin,"First line\nSecond line"',
        ),
      ).toEqual([
        ["Name", "Notes"],
        ["Ada", "Writes code, tests, and docs"],
        ["Lin", "First line\nSecond line"],
      ]);
    });

    it("parses tab-separated spreadsheet cells", () => {
      expect(parseDelimitedTable("Name\tRole\nAda\tEngineer")).toEqual([
        ["Name", "Role"],
        ["Ada", "Engineer"],
      ]);
    });

    it("does not interpret ordinary multiline text as a table", () => {
      expect(parseDelimitedTable("First line\nSecond line")).toBeNull();
    });
  });

  describe("renderTable", () => {
    it("renders grouped cells with bound text and a styled header", () => {
      const elements = renderTable([
        ["Name", "Role"],
        ["Ada", "Engineer"],
      ]);
      const cells = elements.filter((element) => element.type === "rectangle");
      const labels = elements.filter((element) => element.type === "text");

      expect(cells).toHaveLength(4);
      expect(labels).toHaveLength(4);
      expect(cells[0].backgroundColor).not.toBe(cells[2].backgroundColor);
      expect(new Set(cells.flatMap((cell) => cell.groupIds))).toHaveLength(1);
      expect(
        labels.every((label) =>
          cells.some(
            (cell) =>
              cell.id === label.containerId &&
              cell.boundElements?.some(
                (boundElement) => boundElement.id === label.id,
              ),
          ),
        ),
      ).toBe(true);
    });
  });
});
