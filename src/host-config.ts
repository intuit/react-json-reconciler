import { HostConfig } from "react-reconciler";
import { ProxyNode, ValueNodeItems } from ".";
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
export function validateNesting(parent: JsonNode, child: JsonNode): void {
  if (child.type === "proxy") {
    child.items.forEach((proxyItem) => {
      validateNesting(parent, proxyItem);
    });

    return;
  }

  if (parent.type === "array") {
    if (child.type === "property") {
      throw new Error("A Property cannot appear as a child to an arry");
    }

    return;
  }

  if (parent.type === "object") {
    if (child.type !== "property") {
      throw new Error(
        `Objects can only contain property children. Found: ${child.type}`
      );
    }

    return;
  }

  if (parent.type === "value") {
    if (child.type !== "value") {
      throw new Error(
        `Values can only contain other values. Found: ${child.type}`
      );
    }
  }
}

/** Append a child to a parent node */
function appendChild(parent: JsonNode, child: JsonNode) {
  child.parent = parent;

  validateNesting(parent, child);

  switch (parent.type) {
    case "array":
      parent.items.push(child);
      break;
    case "object":
      parent.children.push(child as any);
      break;
    case "property":
      if (parent.valueNode) {
        parent.valueNode = appendChild(parent.valueNode, child);
      } else {
        parent.valueNode = child;
      }

      break;
    case "value":
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
      throw new Error(`Cannot create instance of type: ${type}`);
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
