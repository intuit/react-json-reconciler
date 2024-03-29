export type NodeType = "object" | "array" | "property" | "value" | "proxy";
export type ValueType = number | boolean | null | string;

export type JsonNodeWithoutProxy =
  | ValueNode
  | ArrayNode
  | PropertyNode
  | ObjectNode;
export type JsonNode = JsonNodeWithoutProxy | ProxyNode;

export type JsonType =
  | ValueType
  | Array<JsonType>
  | { [key: string]: JsonType };

export interface SourceLocation {
  /** The filename for the original location of this node */
  fileName: string;
  /** The original line number in the file */
  lineNumber: number;
  /** The column number for the start of this node */
  columnNumber: number;
}

interface BaseJsonNode<T extends NodeType> {
  /** The node type */
  readonly type: T;

  /** The parent of this node */
  parent?: JsonNode;

  /** Any children of this node */
  children?: Array<JsonNode>;

  /** The location of the original source */
  source?: SourceLocation;
}

export type ValueNodeItems<T = ValueType> = [
  {
    /** The value of the node */
    value: T | undefined;
  },
  ...ValueNode[]
];

/** A node that represents a primitive value */
export class ValueNode<T extends ValueType = ValueType>
  implements BaseJsonNode<"value">
{
  public readonly type = "value" as const;
  public items: ValueNodeItems<T>;
  public source?: SourceLocation;

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

    return this.items
      .map((i) => i.value)
      .filter((i) => i !== undefined)
      .join("");
  }
}

/** An array node */
export class ArrayNode implements BaseJsonNode<"array"> {
  public readonly type = "array" as const;
  public parent?: JsonNode;
  public items: JsonNode[] = [];
  public source?: SourceLocation;

  public get children() {
    return this.items;
  }
}

/** An object node */
export class ObjectNode implements BaseJsonNode<"object"> {
  public readonly type = "object" as const;
  public parent?: JsonNode;
  public source?: SourceLocation;

  public properties: PropertyNode[] = [];

  public get children() {
    return this.properties;
  }
}

/** A property of an object */
export class PropertyNode implements BaseJsonNode<"property"> {
  public readonly type = "property" as const;

  public source?: SourceLocation;
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

/** A noop that just acts as a marker */
export class ProxyNode implements BaseJsonNode<"proxy"> {
  public readonly type = "proxy" as const;
  public items: JsonNode[] = [];
  public parent?: JsonNode;
  public source?: SourceLocation;

  constructor(items: JsonNode[] = []) {
    this.items = items;
  }

  public get children() {
    return this.items;
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

/** Remove any ProxyNodes from the array */
export function flattenNodes(nodes: JsonNode[]): JsonNode[] {
  return nodes.flatMap((n) => {
    if (n.type === "proxy") {
      return flattenNodes(n.items);
    }

    return n;
  });
}

/** Convert an AST structure into a JSON object */
export function toJSON(node: JsonNode): JsonType | undefined {
  switch (node.type) {
    case "array":
      return flattenNodes(node.children).reduce<JsonType[]>((a, n) => {
        if (n !== undefined) {
          const next = toJSON(n);
          if (next !== undefined) {
            return [...a, next];
          }
        }

        return a;
      }, []);
    case "value":
      return node.value;
    case "object": {
      return (flattenNodes(node.properties) as PropertyNode[]).reduce<
        Record<string, any>
      >((obj, prop) => {
        if (prop.valueNode) {
          const key = prop.keyNode.value;

          if (key !== undefined) {
            obj[key] = toJSON(prop.valueNode);
          }
        }

        return obj;
      }, {});
    }

    case "proxy":
      if (node.children.length === 0) {
        return;
      }

      if (node.children.length === 1) {
        return toJSON(node.children[0]);
      }

      throw new Error("Cannot convert proxy node to value");
    case "property":
      throw new Error("Unexpected property");
    default:
      throw new Error(
        `Unexpected node type: ${(node as BaseJsonNode<any>).type}`
      );
  }
}
