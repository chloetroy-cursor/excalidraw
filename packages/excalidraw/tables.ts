import { COLOR_PALETTE, randomId } from "@excalidraw/common";
import {
  convertToExcalidrawElements,
  type ExcalidrawElementSkeleton,
} from "@excalidraw/element";

const DELIMITERS = ["\t", ",", ";"] as const;
const MAX_TABLE_CELLS = 1000;
const MIN_COLUMN_WIDTH = 100;
const MAX_COLUMN_WIDTH = 320;
const CELL_HORIZONTAL_PADDING = 24;
const CELL_VERTICAL_PADDING = 16;
const CELL_FONT_SIZE = 16;
const APPROXIMATE_CHARACTER_WIDTH = CELL_FONT_SIZE * 0.55;
const APPROXIMATE_LINE_HEIGHT = CELL_FONT_SIZE * 1.25;

const parseRows = (text: string, delimiter: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let insideQuotes = false;
  let fieldStarted = false;

  const pushValue = () => {
    row.push(value.trim());
    value = "";
    fieldStarted = false;
  };

  const pushRow = () => {
    pushValue();
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
    row = [];
  };

  for (let index = 0; index < text.length; index++) {
    const character = text[index];

    if (character === '"') {
      if (insideQuotes && text[index + 1] === '"') {
        value += '"';
        index++;
      } else if (insideQuotes) {
        insideQuotes = false;
      } else if (!fieldStarted) {
        insideQuotes = true;
        fieldStarted = true;
      } else {
        value += character;
      }
      continue;
    }

    if (!insideQuotes && character === delimiter) {
      pushValue();
      continue;
    }

    if (!insideQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && text[index + 1] === "\n") {
        index++;
      }
      pushRow();
      continue;
    }

    value += character;
    fieldStarted = true;
  }

  if (insideQuotes) {
    return null;
  }

  if (value.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows;
};

export const parseDelimitedTable = (text: string): string[][] | null => {
  const candidates = DELIMITERS.map((delimiter) => {
    const rows = parseRows(text, delimiter);
    const columnCount = rows?.[0]?.length ?? 0;
    const isConsistent =
      !!rows?.length &&
      rows.length > 1 &&
      columnCount > 1 &&
      rows.every((row) => row.length === columnCount);

    return { rows, columnCount, isConsistent };
  });

  const bestCandidate = candidates
    .filter((candidate) => candidate.isConsistent)
    .sort((a, b) => b.columnCount - a.columnCount)[0];

  if (
    !bestCandidate?.rows ||
    bestCandidate.rows.length * bestCandidate.columnCount > MAX_TABLE_CELLS
  ) {
    return null;
  }

  return bestCandidate.rows;
};

const getColumnWidths = (rows: string[][]) =>
  rows[0].map((_, columnIndex) => {
    const longestLineLength = Math.max(
      ...rows.flatMap((row) =>
        row[columnIndex].split("\n").map((line) => line.length),
      ),
    );

    return Math.min(
      MAX_COLUMN_WIDTH,
      Math.max(
        MIN_COLUMN_WIDTH,
        longestLineLength * APPROXIMATE_CHARACTER_WIDTH +
          CELL_HORIZONTAL_PADDING,
      ),
    );
  });

const getRowHeights = (rows: string[][], columnWidths: number[]) =>
  rows.map((row) => {
    const lineCount = Math.max(
      ...row.map((cell, columnIndex) =>
        cell
          .split("\n")
          .reduce(
            (lines, line) =>
              lines +
              Math.max(
                1,
                Math.ceil(
                  (line.length * APPROXIMATE_CHARACTER_WIDTH) /
                    (columnWidths[columnIndex] - CELL_HORIZONTAL_PADDING),
                ),
              ),
            0,
          ),
      ),
    );

    return lineCount * APPROXIMATE_LINE_HEIGHT + CELL_VERTICAL_PADDING;
  });

export const renderTable = (rows: string[][]) => {
  const groupId = randomId();
  const columnWidths = getColumnWidths(rows);
  const rowHeights = getRowHeights(rows, columnWidths);
  const elements: ExcalidrawElementSkeleton[] = [];
  let y = 0;

  rows.forEach((row, rowIndex) => {
    let x = 0;

    row.forEach((cell, columnIndex) => {
      const groupIds = [groupId];
      elements.push({
        type: "rectangle",
        x,
        y,
        width: columnWidths[columnIndex],
        height: rowHeights[rowIndex],
        backgroundColor:
          rowIndex === 0 ? COLOR_PALETTE.gray[1] : COLOR_PALETTE.white,
        fillStyle: "solid",
        roughness: 0,
        roundness: null,
        strokeColor: COLOR_PALETTE.black,
        strokeStyle: "solid",
        strokeWidth: 1,
        groupIds,
        label: cell
          ? {
              text: cell,
              fontSize: CELL_FONT_SIZE,
              groupIds,
            }
          : undefined,
      });
      x += columnWidths[columnIndex];
    });

    y += rowHeights[rowIndex];
  });

  return convertToExcalidrawElements(elements);
};
