import { getNonDeletedElements } from "@excalidraw/element";
import { LinearElementEditor } from "@excalidraw/element";
import { isLinearElement, isTextElement } from "@excalidraw/element";

import { arrayToMap } from "@excalidraw/common";

import { selectGroupsForSelectedElements } from "@excalidraw/element";

import { CaptureUpdateAction } from "@excalidraw/element";

import type { ExcalidrawElement } from "@excalidraw/element/types";

import { register } from "./register";

export const actionSelectAllElementsOfSameType = register({
  name: "selectAllElementsOfSameType",
  label: "labels.selectAllElementsOfSameType",
  trackEvent: { category: "canvas" },
  viewMode: false,
  perform: (elements, appState, _value, app) => {
    if (appState.selectedLinearElement?.isEditing) {
      return false;
    }

    const selectedElements = app.scene.getSelectedElements(appState);
    if (selectedElements.length === 0) {
      return false;
    }

    const selectedTypes = new Set(
      selectedElements.map((element) => element.type),
    );

    const selectedElementIds = elements
      .filter(
        (element) =>
          !element.isDeleted &&
          !(isTextElement(element) && element.containerId) &&
          !element.locked &&
          selectedTypes.has(element.type),
      )
      .reduce((map: Record<ExcalidrawElement["id"], true>, element) => {
        map[element.id] = true;
        return map;
      }, {});

    const selectedIds = Object.keys(selectedElementIds);
    const singleSelectedElement =
      selectedIds.length === 1
        ? elements.find((element) => selectedElementIds[element.id])
        : undefined;

    return {
      appState: {
        ...appState,
        ...selectGroupsForSelectedElements(
          {
            editingGroupId: null,
            selectedElementIds,
          },
          getNonDeletedElements(elements),
          appState,
          app,
        ),
        selectedLinearElement:
          singleSelectedElement && isLinearElement(singleSelectedElement)
            ? new LinearElementEditor(
                singleSelectedElement,
                arrayToMap(elements),
              )
            : null,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  predicate: (_elements, appState, _appProps, app) =>
    app.scene.getSelectedElements(appState).length > 0,
});
