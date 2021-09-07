export type NodeType = "object" | "array" | "property" | "value";
export type ValueType = number | boolean | null | string;

export type JsonNode = ValueNode | ArrayNode | PropertyNode | ObjectNode;

export type JsonType =
  | ValueType
  | Array<JsonType>
  | { [key: string]: JsonType };

interface BaseJsonNode<T extends NodeType> {
  /** The node type */
  readonly type: T;

  /** The parent of this node */
  parent?: JsonNode;

  /** Any children of this node */
  children?: Array<JsonNode>;
}

/** A node that represents a primitive value */
export class ValueNode<T extends ValueType = ValueType>
  implements BaseJsonNode<"value">
{
  public readonly type: "value" = "value";
  public items: [
    {
      /** The value of the node */
      value: T | undefined;
    },
    ...ValueNode[]
  ];

  public parent?: JsonNode;

  private local: {
    /** The local value of this node */
    value: T | undefined;
  };

  constructor(value: T | undefined) {
    this.local = { value };
    this.items = [this.local];
  }

  public setLocalValue(value: T) {
    this.local.value = value;
  }

  public get value(): T | string | undefined {
    if (this.items.length === 1) {
      return this.items[0].value as T;
    }

    return this.items.map((i) => i.value).join("");
  }
}

/** An array node */
export class ArrayNode implements BaseJsonNode<"array"> {
  public readonly type: "array" = "array";
  public parent?: JsonNode;
  public items: JsonNode[] = [];

  public get children() {
    return this.items;
  }
}

/** An object node */
export class ObjectNode implements BaseJsonNode<"object"> {
  public readonly type: "object" = "object";
  public parent?: JsonNode;

  public properties: PropertyNode[] = [];

  public get children() {
    return this.properties;
  }
}

/** A property of an object */
export class PropertyNode implements BaseJsonNode<"property"> {
  public readonly type: "property" = "property";

  public keyNode: ValueNode<string>;
  public parent?: JsonNode;

  public valueNode?: JsonNode;

  constructor(keyNode: ValueNode<string>, jsonNode?: JsonNode) {
    this.keyNode = keyNode;
    this.valueNode = jsonNode;
  }

  public get children() {
    return this.valueNode ? [this.keyNode, this.valueNode] : [this.keyNode];
  }
}

/** Convert a JSON object into an AST representation */
export function fromJSON(value: JsonType): JsonNode {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return new ValueNode(value);
  }

  if (Array.isArray(value)) {
    const arr = new ArrayNode();
    arr.items = value.map((c) => fromJSON(c));
    return arr;
  }

  if (typeof value === "object") {
    const obj = new ObjectNode();
    obj.properties = Object.entries(value).map(([key, val]) => {
      const prop = new PropertyNode(new ValueNode(key));
      prop.valueNode = fromJSON(val);
      return prop;
    });

    return obj;
  }

  throw new Error(`Unsupported value conversion from type: ${typeof value}`);
}

/** Convert an AST structure into a JSON object */
export function toJSON(node: JsonNode): JsonType {
  switch (node.type) {
    case "array":
      return node.children.map((n) => toJSON(n));
    case "value":
      if (node.value === undefined) {
        throw new Error("Undefined is not a valid JSON value");
      }

      return node.value;
    case "object": {
      const obj: Record<string, any> = {};

      node.properties.forEach((prop) => {
        if (prop.valueNode) {
          const key = prop.keyNode.value;

          if (key === undefined) {
            throw new Error("Unable to construct object with undefined key");
          }

          obj[key] = toJSON(prop.valueNode);
        }
      });

      return obj;
    }

    case "property":
      throw new Error("Unexpected property");
    default:
      throw new Error(`Unexpected node type: ${(node as any).type}`);
  }
}
