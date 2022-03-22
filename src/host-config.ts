import { HostConfig } from "react-reconciler";
import { JsonNodeWithoutProxy, ProxyNode, ValueNodeItems } from ".";
import {
  ArrayNode,
  JsonNode,
  ObjectNode,
  PropertyNode,
  ValueNode,
} from "./json";
import { JsonElements } from "./types";

// https://github.com/facebook/react/blob/master/packages/react-dom/src/client/ReactDOMHostConfig.js#L400
/** Throw an error in the next tick */
function handleErrorInNextTick(error: Error) {
  setTimeout(() => {
    throw error;
  });
}

/** Validate that the given child can appear in the parent */
function validateNesting(parent: JsonNode, child: JsonNode): void {}

/** Append a child to a parent node */
function appendChild(parent: JsonNode, child: JsonNode) {
  child.parent = parent;

  validateNesting(parent, child);

  switch (parent.type) {
    case "array":
      // if (realChild.type === "property") {
      //   throw new Error("Property cannot be a child of an array");
      // }

      parent.items.push(child);
      break;
    case "object":
      // if (realChild.type !== "property") {
      //   throw new Error("Objects can only have property children");
      // }

      parent.children.push(child as any);
      break;
    case "property":
      // if (realChild.type === "property") {
      //   throw new Error("Property cannot be a child of a property");
      // }

      if (parent.valueNode) {
        parent.valueNode = appendChild(parent.valueNode, child);
      } else {
        parent.valueNode = child;
      }

      break;
    case "value":
      // if (realChild.type !== "value") {
      //   throw new Error("Unable to append child to value");
      // }

      // Concat the things together as strings
      parent.items.push(child as any);
      break;
    case "proxy":
      parent.items.push(child);
      break;
    default:
      throw new Error("Unknown type");
  }

  return parent;
}

/** Create an instance of the given element type */
function createInstance<T extends keyof JsonElements>(
  type: T,
  props: JsonElements[T]
): JsonNode {
  switch (type) {
    case "array":
      return new ArrayNode();
    case "obj":
    case "object":
      return new ObjectNode();
    case "property":
      return new PropertyNode(
        new ValueNode((props as JsonElements["property"]).name)
      );
    case "value":
      return new ValueNode((props as JsonElements["value"]).value);
    case "proxy":
      return new ProxyNode();
    default:
      throw new Error("idk what to do");
  }
}

/** remove a child from the node */
function removeChild(parent: JsonNode, child: JsonNode) {
  switch (parent.type) {
    case "proxy":
    case "array":
      parent.items = parent.items.filter((c) => c !== child);
      break;

    case "object":
      parent.properties = parent.properties.filter((c) => c !== child);
      break;

    case "property":
      if (parent.valueNode === child) {
        parent.valueNode = undefined;
      }

      break;
    case "value":
      parent.items = parent.items.filter((c) => c !== child) as ValueNodeItems;
      break;
    default:
      throw new Error("Unknown type");
  }
}

export const hostConfig: HostConfig<
  keyof JsonElements,
  any,
  ProxyNode,
  JsonNode,
  ValueNode,
  never,
  never,
  JsonNode,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
> = {
  supportsMutation: true,
  supportsPersistence: false,

  createInstance,
  appendChild,
  appendInitialChild: (parent: JsonNode, child: JsonNode) => {
    appendChild(parent, child);
  },
  appendChildToContainer: appendChild,

  createTextInstance: (text: string) => {
    return new ValueNode(text);
  },

  commitTextUpdate: (node: ValueNode, oldText: string, newText: string) => {
    node.setLocalValue(newText);
  },

  clearContainer: (parent: JsonNode) => {
    switch (parent.type) {
      case "array":
        parent.items = [];
        break;
      case "object":
        parent.properties = [];
        break;
      case "property":
        parent.valueNode = undefined;
        break;
      default:
        break;
    }
  },
  removeChildFromContainer: removeChild,
  removeChild,
  finalizeInitialChildren: () => false,
  prepareUpdate: () => null,
  shouldSetTextContent: () => false,
  getRootHostContext: () => null,
  finalizeContainerChildren: () => false,
  getChildHostContext: (parentHostConfig: any) => parentHostConfig,
  getPublicInstance: (instance: any) => instance,
  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  preparePortalMount: () => {},
  now: () => Date.now(),
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  queueMicrotask: (callback) =>
    Promise.resolve(null).then(callback).catch(handleErrorInNextTick),
  isPrimaryRenderer: true,
  supportsHydration: false,
};
