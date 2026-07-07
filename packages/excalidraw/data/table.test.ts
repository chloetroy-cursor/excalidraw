import {
  parseDelimitedText,
  tryParseTable,
  tableToExcalidrawSkeletons,
} from "./table";

describe("parseDelimitedText()", () => {
  it("splits simple comma-separated rows", () => {
    expect(parseDelimitedText("a,b,c\n1,2,3", ",")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("honors quoted fields containing the delimiter", () => {
    expect(parseDelimitedText(`name,city\n"Smith, John",NYC`, ",")).toEqual([
      ["name", "city"],
      ["Smith, John", "NYC"],
    ]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    expect(parseDelimitedText(`a\n"say ""hi"""`, ",")).toEqual([
      ["a"],
      [`say "hi"`],
    ]);
  });

  it("normalizes CRLF newlines", () => {
    expect(parseDelimitedText("a,b\r\n1,2\r\n", ",")).toEqual([
      ["a", "b"],
      ["1", "2"],
      [""],
    ]);
  });
});

describe("tryParseTable()", () => {
  it("parses a CSV grid", () => {
    const result = tryParseTable(
      "Name,Role,City\nAlice,Engineer,NYC\nBob,Designer,SF",
    );
    expect(result).toEqual({
      ok: true,
      rows: [
        ["Name", "Role", "City"],
        ["Alice", "Engineer", "NYC"],
        ["Bob", "Designer", "SF"],
      ],
    });
  });

  it("parses a TSV grid and prefers tab over comma", () => {
    const result = tryParseTable("a\tb\n1,x\t2");
    expect(result).toEqual({
      ok: true,
      rows: [
        ["a", "b"],
        ["1,x", "2"],
      ],
    });
  });

  it("parses quoted CSV values with embedded commas", () => {
    const result = tryParseTable(`name,note\n"Doe, Jane","a, b, c"`);
    expect(result).toEqual({
      ok: true,
      rows: [
        ["name", "note"],
        ["Doe, Jane", "a, b, c"],
      ],
    });
  });

  it("rejects plain prose that isn't a grid", () => {
    expect(tryParseTable("Hello, world").ok).toBe(false);
    expect(tryParseTable("just some text\nover two lines").ok).toBe(false);
  });

  it("rejects a single row even if multi-column", () => {
    expect(tryParseTable("a,b,c").ok).toBe(false);
  });

  it("rejects inconsistent column counts", () => {
    expect(tryParseTable("a,b,c\n1,2").ok).toBe(false);
  });

  it("ignores trailing blank lines", () => {
    const result = tryParseTable("a,b\n1,2\n\n");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toEqual([
        ["a", "b"],
        ["1", "2"],
      ]);
    }
  });
});

describe("tableToExcalidrawSkeletons()", () => {
  const rows = [
    ["Name", "Role"],
    ["Alice", "Engineer"],
  ];

  it("creates one rectangle per cell with a bound label", () => {
    const skeletons = tableToExcalidrawSkeletons(rows, { x: 0, y: 0 });
    expect(skeletons).toHaveLength(4);
    for (const skeleton of skeletons) {
      expect(skeleton.type).toBe("rectangle");
      expect((skeleton as any).label?.text).toEqual(expect.any(String));
    }
  });

  it("lays cells out in a grid with matching column x and row y", () => {
    const skeletons = tableToExcalidrawSkeletons(rows, {
      x: 10,
      y: 20,
    }) as any[];

    // first cell starts at the origin
    expect(skeletons[0].x).toBe(10);
    expect(skeletons[0].y).toBe(20);

    // cells in the same column share an x coordinate
    expect(skeletons[0].x).toBe(skeletons[2].x);
    expect(skeletons[1].x).toBe(skeletons[3].x);

    // cells in the same row share a y coordinate
    expect(skeletons[0].y).toBe(skeletons[1].y);
    expect(skeletons[2].y).toBe(skeletons[3].y);

    // the second column begins where the first ends (no gaps/overlap)
    expect(skeletons[1].x).toBe(skeletons[0].x + skeletons[0].width);
  });

  it("applies a header background only to the first row", () => {
    const skeletons = tableToExcalidrawSkeletons(rows, {
      x: 0,
      y: 0,
      headerBackgroundColor: "#f1f3f5",
    }) as any[];

    expect(skeletons[0].backgroundColor).toBe("#f1f3f5");
    expect(skeletons[1].backgroundColor).toBe("#f1f3f5");
    expect(skeletons[2].backgroundColor).toBe("transparent");
    expect(skeletons[3].backgroundColor).toBe("transparent");
  });
});
