import React from "react";
import reconciler from "react-reconciler";
import { hostConfig } from "./host-config";
import { ArrayNode, JsonType, toJSON } from "./json";

/** Render the React tree into a JSON object. */
export const render = async (root: React.ReactNode): Promise<JsonType> => {
  const renderer = reconciler(hostConfig);
  const container = new ArrayNode();
  (container as any).root = true;
  const reactContainer = renderer.createContainer(container, 0, false, null);
  renderer.updateContainer(root, reactContainer, null, () => {});

  renderer.flushPassiveEffects();
  renderer.flushDiscreteUpdates();

  return toJSON(container.items[0]);
};
