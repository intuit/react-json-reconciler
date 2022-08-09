/* eslint-disable no-underscore-dangle */
import { Fiber, HostConfig } from "react-reconciler";
import { ProxyNode, ValueNodeItems } from ".";
import {
  ArrayNode,
  JsonNode,
  ObjectNode,
  PropertyNode,
  SourceLocation,
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
  const locationDebugInfo = [
    child.source &&
      `\t↳ Child(${parent.type}) ${child.source.fileName}:${child.source.lineNumber}`,
    parent.source &&
      `\t↳ Parent(${child.type}) ${parent.source.fileName}:${parent.source.lineNumber}`,
  ]
    .filter(Boolean)
    .join("\n");

  /** Create an error message with contextual source node info */
  const createMessage = (msg: string) => {
    if (locationDebugInfo) {
      return `${msg}\n${locationDebugInfo}`;
    }

    return msg;
  };

  if (child.type === "proxy") {
    child.items.forEach((proxyItem) => {
      validateNesting(parent, proxyItem);
    });

    return;
  }

  if (parent.type === "array") {
    if (child.type === "property") {
      throw new Error(
        createMessage("A Property cannot appear as a child to an array")
      );
    }

    return;
  }

  if (parent.type === "object") {
    if (child.type !== "property") {
      throw new Error(
        createMessage(
          `Objects can only contain property children. Found: ${child.type}`
        )
      );
    }

    return;
  }

  if (parent.type === "value") {
    if (child.type !== "value") {
      throw new Error(
        createMessage(
          `Values can only contain other values. Found: ${child.type}`
        )
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

/** Get the source from react (when using development build of @babel/preset-react) */
function getSourceLocation(f: Fiber): SourceLocation | undefined {
  if (f._debugSource) {
    return {
      columnNumber: 1,
      ...f._debugSource,
    };
  }

  if (f._debugOwner) {
    return getSourceLocation(f._debugOwner);
  }
}

/** Create an instance of the given element type */
function createInstance<T extends keyof JsonElements>(
  type: T,
  props: JsonElements[T],
  rootContainer: ProxyNode,
  hostContext: unknown,
  handle: Fiber
): JsonNode {
  const source = getSourceLocation(handle);

  let node: JsonNode;

  switch (type) {
    case "array":
      node = new ArrayNode();
      break;
    case "obj":
    case "object":
      node = new ObjectNode();
      break;
    case "property":
      node = new PropertyNode(
        new ValueNode((props as JsonElements["property"]).name)
      );
      break;
    case "value":
      node = new ValueNode((props as JsonElements["value"]).value);
      break;
    case "proxy":
      node = new ProxyNode();
      break;
    default:
      throw new Error(`Cannot create instance of type: ${type}`);
  }

  node.source = source;
  return node;
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
