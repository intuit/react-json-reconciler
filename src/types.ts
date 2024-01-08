import type { ReactNode, Attributes, RefAttributes, ReactPortal } from "react";
import { ProxyNode } from ".";
import {
  ArrayNode,
  ObjectNode,
  PropertyNode,
  ValueNode,
  ValueType,
} from "./json";

export type WithChildrenAndRefAttributes<T> = {
  /** React children of this node */
  children?: ReactNode | ReactNode[];
} & Attributes &
  RefAttributes<T>;

export interface JsonElements {
  /** primitive for a prop of an object */
  property: {
    /** the name of the property in the object */
    name: string;
  } & WithChildrenAndRefAttributes<PropertyNode>;

  /** An array primitive */
  array: WithChildrenAndRefAttributes<ArrayNode>;

  /** An object primitive */
  obj: WithChildrenAndRefAttributes<ObjectNode>;

  /** An object primitive */
  object: WithChildrenAndRefAttributes<ObjectNode>;

  /** A primitive JSON value */
  value: {
    /** The value of the node */
    value?: ValueType;
  } & WithChildrenAndRefAttributes<ValueNode>;

  /** A node that shadows another */
  proxy: WithChildrenAndRefAttributes<ProxyNode>;
}

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace JSX {
    // type Element<T = any> = PlayerElement<T>;

    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface IntrinsicElements extends JsonElements {}
  }
}
