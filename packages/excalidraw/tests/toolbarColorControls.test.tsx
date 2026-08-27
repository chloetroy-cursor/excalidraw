import React from "react";

import { Excalidraw } from "../index";
import { UI } from "../tests/helpers/ui";
import {
  render,
  waitFor,
  withExcalidrawDimensions,
} from "../tests/test-utils";

describe("desktop toolbar color keys", () => {
  beforeEach(async () => {
    await render(<Excalidraw handleKeyboardGlobally={true} />);
  });

  it("renders compact wrapped toolbar color keys without panel chrome", async () => {
    await withExcalidrawDimensions({ width: 1440, height: 900 }, async () => {
      UI.clickTool("rectangle");

      const toolbarColors = await waitFor(() => {
        const node = document.querySelector(
          '[data-testid="toolbar-color-controls"]',
        );
        expect(node).not.toBeNull();
        return node as HTMLElement;
      });

      expect(toolbarColors.querySelector("h3")).toBeNull();
      expect(
        toolbarColors.querySelector(".color-picker__top-picks"),
      ).toBeNull();
      expect(
        toolbarColors.querySelectorAll(".color-picker__button.active-color")
          .length,
      ).toBe(2);

      const toolbar = document.querySelector(".App-toolbar") as HTMLElement;
      expect(toolbar).not.toBeNull();
      expect(
        toolbar.querySelector('[data-testid="toolbar-hand"]'),
      ).not.toBeNull();
      expect(
        toolbar.querySelector(".App-toolbar__extra-tools-trigger"),
      ).not.toBeNull();
    });
  });
});
