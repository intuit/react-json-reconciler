import { test, expect, describe, it } from "vitest";
import React, {
  ReactNode,
  PropsWithChildren,
  useEffect,
  useRef,
  useLayoutEffect,
  useState,
  useMemo,
} from "react";
import { createPortal, ProxyNode, render } from "..";
import {
  ArrayNode,
  JsonType,
  ObjectNode,
  PropertyNode,
  ValueNode,
} from "../json";

const TEST_CASES: Array<
  [name: string, element: ReactNode, expectedValue: JsonType]
> = [
  [
    "simple object",
    <obj key="obj">
      <property name="name">Adam</property>
    </obj>,
    {
      name: "Adam",
    },
  ],

  [
    "simple array",
    <array key="array">
      <obj />
      <value>Test Value</value>
      <value value={1} />
      <value value={null} />
    </array>,
    [{}, "Test Value", 1, null],
  ],
];

test.each(TEST_CASES)(
  "%s",
  async (name: string, element: ReactNode, expectedJson: JsonType) => {
    expect((await render(element)).jsonValue).toStrictEqual(expectedJson);
  }
);

describe("refs", () => {
  it("attaches the refs to an object", async () => {
    const CustomNode = () => {
      const objRef = useRef<ObjectNode>(null);

      useEffect(() => {
        expect(objRef.current?.type).toBe("object");
      }, []);

      return <obj ref={objRef} />;
    };

    const element = <CustomNode />;

    expect.assertions(2);
    expect((await render(element)).jsonValue).toStrictEqual({});
  });

  it("attaches the refs to a property", async () => {
    const CustomNode = () => {
      const propRef = useRef<PropertyNode>(null);

      useEffect(() => {
        expect(propRef.current?.type).toBe("property");
      }, []);

      return (
        <obj>
          <property ref={propRef} name="Test Key">
            Test Prop
          </property>
        </obj>
      );
    };

    const element = <CustomNode />;

    expect.assertions(2);
    expect((await render(element)).jsonValue).toStrictEqual({
      "Test Key": "Test Prop",
    });
  });

  it("attaches the refs to an array", async () => {
    const CustomNode = () => {
      const arrRef = useRef<ArrayNode>(null);

      useEffect(() => {
        expect(arrRef.current?.type).toBe("array");
      }, []);

      return <array ref={arrRef} />;
    };

    const element = <CustomNode />;

    expect.assertions(2);
    expect((await render(element)).jsonValue).toStrictEqual([]);
  });

  it("attaches the refs to a value", async () => {
    const CustomNode = () => {
      const valRef = useRef<ValueNode>(null);

      useEffect(() => {
        expect(valRef.current?.type).toBe("value");
      }, []);

      return <value ref={valRef}>Foo</value>;
    };

    const element = <CustomNode />;

    expect.assertions(2);
    expect((await render(element)).jsonValue).toStrictEqual("Foo");
  });

  it("removes items from a container", async () => {
    const Custom = () => {
      const [show, setShow] = useState(false);

      useEffect(() => {
        setShow(true);
      }, [show]);

      return (
        <array>
          <value>1</value>
          {show && <value>2</value>}
        </array>
      );
    };

    const element = <Custom />;

    expect((await render(element)).jsonValue).toStrictEqual(["1", "2"]);
  });
});

describe("proxy", () => {
  it("ignores any proxy objects", async () => {
    const result = await render(
      <object>
        <property name="foo">
          <proxy>
            <value>bar</value>
          </proxy>
        </property>
      </object>
    );

    expect(result.jsonValue).toStrictEqual({
      foo: "bar",
    });
  });

  it("works for multiple children", async () => {
    const result = await render(
      <array>
        <proxy>
          <value>foo</value>
          <value>bar</value>
        </proxy>
        <object>
          <proxy>
            <property name="foo">
              <value>bar</value>
            </property>
            <property name="baz">
              <value>bar</value>
            </property>
          </proxy>
        </object>
      </array>
    );

    expect(result.jsonValue).toStrictEqual([
      "foo",
      "bar",
      { foo: "bar", baz: "bar" },
    ]);
  });
});

describe("complex mutations", () => {
  const TreeParentMoving = (props: PropsWithChildren<unknown>) => {
    const container = useMemo(() => new ProxyNode(), []);
    const portal = createPortal(props.children, container);
    const proxyRef = useRef<ProxyNode>(null);
    useLayoutEffect(() => {
      if (!proxyRef.current) {
        return;
      }

      if (proxyRef.current.parent?.parent?.parent?.type === "object") {
        proxyRef.current.parent.parent.parent.properties.push(
          container.children[0] as any
        );
      }
    }, [container, proxyRef]);

    return <proxy ref={proxyRef}>{portal as unknown as ReactNode}</proxy>;
  };

  const DelayedUpdate = () => {
    const [value, setValue] = useState(0);
    const propRef = useRef<PropertyNode>(null);

    useLayoutEffect(() => {
      setValue(propRef.current?.children.length ?? 0);
    }, [propRef.current?.children.length]);

    return (
      <property ref={propRef} name="count">
        <value value={value} />
      </property>
    );
  };

  it("works with nested components", async () => {
    const content = await render(
      <object>
        <property name="root">
          <object>
            <TreeParentMoving>
              <property name="nested">
                <value value="property" />
              </property>
            </TreeParentMoving>
          </object>
        </property>
      </object>
    );

    expect(content.jsonValue).toStrictEqual({
      root: {},
      nested: "property",
    });
  });

  it("works with dynamic properties", async () => {
    const content = await render(
      <object>
        <property name="root">
          <object>
            <DelayedUpdate />
            <TreeParentMoving>
              <property name="nested">
                <value value="property" />
              </property>
            </TreeParentMoving>
          </object>
        </property>
      </object>
    );

    expect(content.jsonValue).toStrictEqual({
      root: {
        count: 0,
      },
      nested: "property",
    });
  });
});
