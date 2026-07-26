import React from "react";

import { Excalidraw } from "../index";
import { API } from "../tests/helpers/api";
import { render } from "../tests/test-utils";

import { actionSelectAllElementsOfSameType } from "./actionSelectAllElementsOfSameType";

const { h } = window;

describe("actionSelectAllElementsOfSameType", () => {
  beforeEach(async () => {
    await render(<Excalidraw handleKeyboardGlobally={true} />);
  });

  it("selects all elements matching a single selected type", () => {
    const rect1 = API.createElement({ type: "rectangle", x: 0, y: 0 });
    const rect2 = API.createElement({ type: "rectangle", x: 100, y: 0 });
    const rect3 = API.createElement({ type: "rectangle", x: 200, y: 0 });
    const ellipse = API.createElement({ type: "ellipse", x: 0, y: 100 });
    API.setElements([rect1, rect2, rect3, ellipse]);
    API.setSelectedElements([rect1]);

    API.executeAction(actionSelectAllElementsOfSameType);

    expect(Object.keys(h.state.selectedElementIds).sort()).toEqual(
      [rect1.id, rect2.id, rect3.id].sort(),
    );
  });

  it("selects all elements matching any type in a multi-type selection", () => {
    const rect1 = API.createElement({ type: "rectangle", x: 0, y: 0 });
    const rect2 = API.createElement({ type: "rectangle", x: 100, y: 0 });
    const rect3 = API.createElement({ type: "rectangle", x: 200, y: 0 });
    const ellipse = API.createElement({ type: "ellipse", x: 0, y: 100 });
    API.setElements([rect1, rect2, rect3, ellipse]);
    API.setSelectedElements([rect1, ellipse]);

    API.executeAction(actionSelectAllElementsOfSameType);

    expect(Object.keys(h.state.selectedElementIds).sort()).toEqual(
      [rect1.id, rect2.id, rect3.id, ellipse.id].sort(),
    );
  });

  it("does not select locked elements or bound text", () => {
    const rect1 = API.createElement({ type: "rectangle", x: 0, y: 0 });
    const rect2 = API.createElement({
      type: "rectangle",
      x: 100,
      y: 0,
      locked: true,
    });
    const text = API.createElement({
      type: "text",
      x: 0,
      y: 100,
      text: "hello",
    });
    const boundText = API.createElement({
      type: "text",
      x: 10,
      y: 10,
      text: "bound",
      containerId: rect1.id,
    });
    API.setElements([rect1, rect2, text, boundText]);
    API.setSelectedElements([text]);

    API.executeAction(actionSelectAllElementsOfSameType);

    expect(Object.keys(h.state.selectedElementIds)).toEqual([text.id]);
  });
});
