import React from "react";

import { CODES, STROKE_WIDTH } from "@excalidraw/common";

import { copiedStyles } from "../actions/actionStyles";
import { Excalidraw } from "../index";
import { API } from "../tests/helpers/api";
import { Keyboard, Pointer, UI } from "../tests/helpers/ui";
import {
  act,
  fireEvent,
  render,
  screen,
  togglePopover,
  waitFor,
  withExcalidrawDimensions,
  unmountComponent,
} from "../tests/test-utils";

const { h } = window;

const mouse = new Pointer("mouse");

const clickToolbarColorPicker = (
  type: "elementStroke" | "elementBackground",
) => {
  const container = document.querySelector(
    '[data-testid="toolbar-color-controls"]',
  );
  const trigger = container?.querySelector(`[data-openpopup="${type}"]`);
  if (!trigger) {
    throw new Error(`No toolbar color picker trigger found for ${type}`);
  }
  fireEvent.click(trigger);
};

describe("actionStyles", () => {
  beforeEach(async () => {
    await render(<Excalidraw handleKeyboardGlobally={true} />);
  });

  afterEach(async () => {
    // https://github.com/floating-ui/floating-ui/issues/1908#issuecomment-1301553793
    // affects node v16+
    await act(async () => {});
  });

  it("should copy & paste styles via keyboard", async () => {
    UI.clickTool("rectangle");
    mouse.down(10, 10);
    mouse.up(20, 20);

    UI.clickTool("rectangle");
    mouse.down(10, 10);
    mouse.up(20, 20);

    // Change some styles of second rectangle
    togglePopover("Stroke");
    UI.clickOnTestId("color-red");
    togglePopover("Background");
    UI.clickOnTestId("color-blue");
    // Fill style
    fireEvent.click(screen.getByTitle("Cross-hatch"));
    // Stroke width
    fireEvent.click(screen.getByTitle("Bold"));
    // Stroke style
    fireEvent.click(screen.getByTitle("Dotted"));
    // Roughness
    fireEvent.click(screen.getByTitle("Cartoonist"));
    // Opacity
    fireEvent.change(screen.getByTestId("opacity"), {
      target: { value: "60" },
    });

    mouse.reset();

    API.setSelectedElements([h.elements[1]]);

    Keyboard.withModifierKeys({ ctrl: true, alt: true }, () => {
      Keyboard.codeDown(CODES.C);
    });
    const secondRect = JSON.parse(copiedStyles)[0];
    expect(secondRect.id).toBe(h.elements[1].id);

    mouse.reset();
    // Paste styles to first rectangle
    API.setSelectedElements([h.elements[0]]);
    Keyboard.withModifierKeys({ ctrl: true, alt: true }, () => {
      Keyboard.codeDown(CODES.V);
    });

    const firstRect = API.getSelectedElement();
    expect(firstRect.id).toBe(h.elements[0].id);
    expect(firstRect.strokeColor).toBe("#e03131");
    expect(firstRect.backgroundColor).toBe("#a5d8ff");
    expect(firstRect.fillStyle).toBe("cross-hatch");
    expect(firstRect.strokeWidth).toBe(STROKE_WIDTH.bold);
    expect(firstRect.strokeStyle).toBe("dotted");
    expect(firstRect.roughness).toBe(2); // Cartoonist: 2
    expect(firstRect.opacity).toBe(60);
  });

  it("exposes accessible aria-labels on the toolbar stroke and fill pickers", async () => {
    await withExcalidrawDimensions(
      { width: 1440, height: 900 },
      async () => {
        UI.clickTool("rectangle");

        const container = await waitFor(() => {
          const el = document.querySelector(
            '[data-testid="toolbar-color-controls"]',
          );
          expect(el).not.toBeNull();
          return el as HTMLElement;
        });

        const strokePicker = container.querySelector(
          '[aria-label="Stroke color picker"]',
        );
        const fillPicker = container.querySelector(
          '[aria-label="Fill color picker"]',
        );

        expect(strokePicker).not.toBeNull();
        expect(strokePicker).toHaveAttribute("title", "Stroke color picker");

        expect(fillPicker).not.toBeNull();
        expect(fillPicker).toHaveAttribute("title", "Fill color picker");
      },
    );
  });

  it("applies colors from desktop toolbar color pickers", async () => {
    await withExcalidrawDimensions(
      { width: 1440, height: 900 },
      async () => {
        UI.clickTool("rectangle");

        await waitFor(() => {
          expect(
            document.querySelector('[data-testid="toolbar-color-controls"]'),
          ).not.toBeNull();
        });

        mouse.down(10, 10);
        mouse.up(20, 20);

        clickToolbarColorPicker("elementBackground");
        UI.clickOnTestId("color-red");

        clickToolbarColorPicker("elementStroke");
        UI.clickOnTestId("color-blue");

        expect(API.getSelectedElement().backgroundColor).toBe("#ffc9c9");
        expect(API.getSelectedElement().strokeColor).toBe("#1971c2");
      },
    );
  });
});

describe("mobile toolbar color controls", () => {
  beforeEach(async () => {
    unmountComponent();
    await render(<Excalidraw handleKeyboardGlobally={true} />);
  });

  afterEach(async () => {
    await act(async () => {});
  });

  it("applies colors from mobile toolbar color pickers", async () => {
    await withExcalidrawDimensions({ width: 800, height: 400 }, async () => {
      await waitFor(() => {
        expect(h.app.editorInterface.formFactor).toBe("phone");
        expect(document.querySelector(".mobile-toolbar")).not.toBeNull();
      });

      const rectangleTool = document.querySelector(
        '.mobile-toolbar [data-testid="toolbar-rectangle"]',
      );
      if (!rectangleTool) {
        throw new Error("Mobile rectangle tool not found");
      }
      fireEvent.pointerDown(rectangleTool);

      await waitFor(() => {
        expect(h.state.activeTool.type).toBe("rectangle");
        expect(
          document.querySelector(
            '.mobile-toolbar [data-testid="toolbar-color-controls"]',
          ),
        ).not.toBeNull();
      });

      mouse.down(10, 10);
      mouse.up(20, 20);

      clickToolbarColorPicker("elementBackground");
      UI.clickOnTestId("color-red");

      clickToolbarColorPicker("elementStroke");
      UI.clickOnTestId("color-blue");

      expect(API.getSelectedElement().backgroundColor).toBe("#ffc9c9");
      expect(API.getSelectedElement().strokeColor).toBe("#1971c2");
    });
  });
});
