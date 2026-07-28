import {
  COLOR_PALETTE,
  FONT_FAMILY,
  TEXT_ALIGN,
  VERTICAL_ALIGN,
  randomId,
} from "@excalidraw/common";
import type { ExcalidrawElementSkeleton } from "@excalidraw/element";

const CELL_HEIGHT = 48;
const MIN_COLUMN_WIDTH = 100;
const MAX_COLUMN_WIDTH = 240;
const CHARACTER_WIDTH = 9;
const HORIZONTAL_PADDING = 32;

export const parseCSV = (text: string): string[][] | null => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const addRow = () => {
    row.push(cell);
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
    row = [];
    cell = "";
  };

  for (let index = 0; index < text.length; index++) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && cell.length === 0) {
      inQuotes = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") {
        index++;
      }
      addRow();
    } else {
      cell += character;
    }
  }

  if (inQuotes) {
    return null;
  }

  addRow();

  const columnCount = rows[0]?.length ?? 0;
  if (
    rows.length < 2 ||
    columnCount < 2 ||
    rows.some((currentRow) => currentRow.length !== columnCount)
  ) {
    return null;
  }

  return rows;
};

export const createTableElements = (
  rows: string[][],
): ExcalidrawElementSkeleton[] => {
  const groupId = randomId();
  const columnWidths = rows[0].map((_, columnIndex) => {
    const longestLineLength = Math.max(
      ...rows.flatMap((row) =>
        row[columnIndex].split("\n").map((line) => line.length),
      ),
    );
    return Math.min(
      MAX_COLUMN_WIDTH,
      Math.max(
        MIN_COLUMN_WIDTH,
        longestLineLength * CHARACTER_WIDTH + HORIZONTAL_PADDING,
      ),
    );
  });

  return rows.flatMap((row, rowIndex) => {
    let x = 0;
    return row.map((text, columnIndex) => {
      const width = columnWidths[columnIndex];
      const element: ExcalidrawElementSkeleton = {
        type: "rectangle",
        x,
        y: rowIndex * CELL_HEIGHT,
        width,
        height: CELL_HEIGHT,
        groupIds: [groupId],
        roughness: 0,
        strokeWidth: 1,
        fillStyle: "solid",
        backgroundColor:
          rowIndex === 0 ? COLOR_PALETTE.gray[0] : COLOR_PALETTE.white,
        label: {
          text,
          fontFamily: FONT_FAMILY.Helvetica,
          fontSize: 16,
          textAlign: TEXT_ALIGN.LEFT,
          verticalAlign: VERTICAL_ALIGN.MIDDLE,
        },
      };
      x += width;
      return element;
    });
  });
};
