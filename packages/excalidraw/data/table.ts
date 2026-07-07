import {
  BOUND_TEXT_PADDING,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  TEXT_ALIGN,
  VERTICAL_ALIGN,
  getFontString,
  getLineHeight,
} from "@excalidraw/common";

import { measureText, wrapText } from "@excalidraw/element";

import type { ExcalidrawElementSkeleton } from "@excalidraw/element";

import type { FontFamilyValues } from "@excalidraw/element/types";

export type TableParseResult =
  | { ok: true; rows: string[][] }
  | { ok: false; reason: string };

type TableDelimiter = "\t" | "," | ";";

const TABLE_DELIMITERS: readonly TableDelimiter[] = ["\t", ",", ";"];

/**
 * Parses a single delimited document into a grid of string cells, honoring
 * RFC-4180 style quoting so that delimiters and newlines inside double quotes
 * are treated as literal content (e.g. `"Smith, John"`).
 *
 * @private exported for testing
 */
export const parseDelimitedText = (
  text: string,
  delimiter: TableDelimiter,
): string[][] => {
  const normalized = text.replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        // Two consecutive quotes inside a quoted field are an escaped quote.
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  rows.push(row);

  return rows;
};

const isBlankRow = (row: string[]) =>
  row.every((cell) => cell.trim().length === 0);

/**
 * Attempts to interpret arbitrary pasted text as a tabular grid (CSV / TSV /
 * semicolon-separated). Succeeds only when the text forms a consistent grid of
 * at least two rows and two columns, which avoids misinterpreting ordinary
 * prose that happens to contain a comma.
 */
export const tryParseTable = (text: string): TableParseResult => {
  if (!text || !text.trim()) {
    return { ok: false, reason: "No content" };
  }

  const candidates = TABLE_DELIMITERS.map((delimiter) => {
    const rows = parseDelimitedText(text, delimiter).filter(
      (row) => !isBlankRow(row),
    );
    const numCols = rows[0]?.length ?? 0;
    const isConsistent =
      rows.length > 0 && rows.every((row) => row.length === numCols);
    return { delimiter, rows, numCols, isConsistent };
  });

  // Prefer a delimiter that yields a consistent multi-column grid. Ties are
  // broken by the array order (tab > comma > semicolon).
  const best = candidates.find((c) => c.isConsistent && c.numCols > 1);

  if (!best) {
    return { ok: false, reason: "Not a consistent multi-column grid" };
  }

  if (best.rows.length < 2) {
    return { ok: false, reason: "Fewer than two rows" };
  }

  return {
    ok: true,
    rows: best.rows.map((row) => row.map((cell) => cell.trim())),
  };
};

export type TableSkeletonOptions = {
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: FontFamilyValues;
  strokeColor?: string;
  /** Background color applied to the first (header) row. */
  headerBackgroundColor?: string;
};

const MIN_CELL_WIDTH = 48;
const MAX_CELL_WIDTH = 300;
// Horizontal / vertical breathing room added around a cell's text content.
const CELL_H_PADDING = 12;
const CELL_V_PADDING = 8;

/**
 * Converts a parsed table grid into a set of Excalidraw element skeletons: one
 * rectangle per cell with a bound text label. Column widths and row heights are
 * derived from the measured (and wrapped) content so the resulting table stays
 * aligned as a grid. The returned skeletons are meant to be passed to
 * `convertToExcalidrawElements`.
 */
export const tableToExcalidrawSkeletons = (
  rows: string[][],
  opts: TableSkeletonOptions,
): ExcalidrawElementSkeleton[] => {
  const fontSize = opts.fontSize ?? DEFAULT_FONT_SIZE;
  const fontFamily = opts.fontFamily ?? DEFAULT_FONT_FAMILY;
  const fontString = getFontString({ fontSize, fontFamily });
  const lineHeight = getLineHeight(fontFamily);

  const numCols = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => {
    const filled = row.slice();
    while (filled.length < numCols) {
      filled.push("");
    }
    return filled;
  });

  // Column widths: fit the widest unwrapped cell content, clamped to a range.
  const colWidths: number[] = [];
  for (let col = 0; col < numCols; col++) {
    let contentWidth = 0;
    for (const row of normalizedRows) {
      const { width } = measureText(row[col] || " ", fontString, lineHeight);
      contentWidth = Math.max(contentWidth, width);
    }
    colWidths.push(
      Math.max(
        MIN_CELL_WIDTH,
        Math.min(MAX_CELL_WIDTH, Math.ceil(contentWidth) + CELL_H_PADDING * 2),
      ),
    );
  }

  // Row heights: fit the tallest (wrapped) cell content in each row.
  const rowHeights: number[] = normalizedRows.map((row) => {
    let contentHeight = 0;
    row.forEach((cell, col) => {
      const maxTextWidth = colWidths[col] - BOUND_TEXT_PADDING * 2;
      const wrapped = wrapText(cell || " ", fontString, maxTextWidth);
      const { height } = measureText(wrapped, fontString, lineHeight);
      contentHeight = Math.max(contentHeight, height);
    });
    return Math.ceil(contentHeight) + CELL_V_PADDING * 2;
  });

  const skeletons: ExcalidrawElementSkeleton[] = [];

  let cellY = opts.y;
  for (let rowIdx = 0; rowIdx < normalizedRows.length; rowIdx++) {
    let cellX = opts.x;
    for (let colIdx = 0; colIdx < numCols; colIdx++) {
      const text = normalizedRows[rowIdx][colIdx];
      const isHeader = rowIdx === 0;

      skeletons.push({
        type: "rectangle",
        x: cellX,
        y: cellY,
        width: colWidths[colIdx],
        height: rowHeights[rowIdx],
        strokeColor: opts.strokeColor,
        backgroundColor:
          isHeader && opts.headerBackgroundColor
            ? opts.headerBackgroundColor
            : "transparent",
        fillStyle: "solid",
        roundness: null,
        label: {
          text,
          fontSize,
          fontFamily,
          strokeColor: opts.strokeColor,
          textAlign: TEXT_ALIGN.LEFT,
          verticalAlign: VERTICAL_ALIGN.MIDDLE,
        },
      });

      cellX += colWidths[colIdx];
    }
    cellY += rowHeights[rowIdx];
  }

  return skeletons;
};
