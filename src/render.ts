import React from "react";
import reconciler from "react-reconciler";
import { JsonNode, ProxyNode } from ".";
import { hostConfig } from "./host-config";
import { JsonType, toJSON } from "./json";

const renderer = reconciler(hostConfig);

/** Create a portal to render a JSON tree within a different subtree */
export const createPortal = (
  children: React.ReactNode,
  container: JsonNode
) => {
  return renderer.createPortal(children, container, undefined, undefined);
};

/** Render the React tree into a JSON object. */
export const render = async (root: React.ReactNode): Promise<JsonType> => {
  const container = new ProxyNode();
  (container as any).root = true;
  const reactContainer = renderer.createContainer(container, 0, false, null);
  renderer.updateContainer(root, reactContainer, null, () => {});

  renderer.flushPassiveEffects();
  renderer.flushDiscreteUpdates();

  return toJSON(container) as JsonType;
};
