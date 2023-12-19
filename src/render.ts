import * as React from "react";
import reconciler from "react-reconciler";
import { SourceMapGenerator } from "source-map-js";
import { Pointer, PropPointer, stringify } from "json-source-map";
import { JsonNode, ProxyNode } from ".";
import { hostConfig } from "./host-config";
import { JsonType, SourceLocation, toJSON } from "./json";

const renderer = reconciler(hostConfig);

/** Create a portal to render a JSON tree within a different subtree */
export const createPortal = (
  children: React.ReactNode,
  container: JsonNode
) => {
  return renderer.createPortal(children, container, undefined, undefined);
};

/** Create a source map */
const createSourceMap = (
  pointers: Record<string, Pointer | PropPointer>,
  rootNode: ProxyNode
): string => {
  const sourceMap = new SourceMapGenerator();
  // Go through the node and map them to pointers

  const sourceNodePointers: Record<string, SourceLocation> = {};

  /** populate the tree */
  const visit = (node: JsonNode, currentPath: string[]) => {
    if (node.source) {
      sourceNodePointers[currentPath.join("/")] = node.source;
    }

    if (node.type === "array") {
      node.items.forEach((childVal, index) => {
        visit(childVal, [...currentPath, String(index)]);
      });
    } else if (node.type === "object") {
      node.properties.forEach((childVal) => {
        if (childVal.keyNode?.value) {
          visit(childVal, [...currentPath, childVal.keyNode.value]);
        }
      });
    } else if ("children" in node) {
      node.children.forEach((c) => {
        visit(c, currentPath);
      });
    }
  };

  visit(rootNode, [""]);

  Object.keys(sourceNodePointers).forEach((key) => {
    const sourcePosition = sourceNodePointers[key];
    const genPosition = pointers[key];

    if (sourcePosition && genPosition) {
      sourceMap.addMapping({
        original: {
          line: sourcePosition.lineNumber,
          column: sourcePosition.columnNumber ?? 1,
        },
        generated: {
          line: genPosition.value.line + 1,
          column: genPosition.value.column + 1,
        },
        source: sourcePosition.fileName,
      });
    }
  });

  return sourceMap.toString();
};

/** Render the React tree into a JSON object. */
export const render = async (
  root: React.ReactNode,
  options?: {
    /** Try to get source map info for the render */
    collectSourceMap?: boolean;
  }
): Promise<{
  /** The JSON object value of the node */
  jsonValue: JsonType;
  /** The raw AST node for the render */
  jsonNode: JsonNode;

  /** The pretty-printed version of the json value */
  stringValue: string;

  /** The source-map for the string-value */
  sourceMap?: string;
}> => {
  const container = new ProxyNode();
  (container as any).root = true;
  const reactContainer = renderer.createContainer(
    container,
    0,
    null,
    false,
    null,
    "player",
    (recoverableError: Error) => {},
    null
  );
  renderer.updateContainer(root, reactContainer, null, () => {});

  renderer.flushPassiveEffects();
  renderer.flushSync();

  const jsonValue = toJSON(container) as JsonType;
  const stringValue = stringify(jsonValue, null, 2);

  return {
    jsonValue,
    sourceMap:
      jsonValue === null || options?.collectSourceMap !== true
        ? undefined
        : createSourceMap(stringValue.pointers, container),
    stringValue: stringValue?.json ?? "null",
    jsonNode: container,
  };
};
