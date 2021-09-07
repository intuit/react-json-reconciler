import React from "react";
import { render } from "..";
import {
  ArrayNode,
  JsonType,
  ObjectNode,
  PropertyNode,
  ValueNode,
} from "../json";

const TEST_CASES: Array<
  [name: string, element: React.ReactNode, expectedValue: JsonType]
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
  async (name: string, element: React.ReactNode, expectedJson: JsonType) => {
    expect(await render(element)).toStrictEqual(expectedJson);
  }
);

describe("refs", () => {
  it("attaches the refs to an object", async () => {
    const CustomNode = () => {
      const objRef = React.useRef<ObjectNode>(null);

      React.useEffect(() => {
        expect(objRef.current?.type).toBe("object");
      }, []);

      return <obj ref={objRef} />;
    };

    const element = <CustomNode />;

    expect.assertions(2);
    expect(await render(element)).toStrictEqual({});
  });

  it("attaches the refs to a property", async () => {
    const CustomNode = () => {
      const propRef = React.useRef<PropertyNode>(null);

      React.useEffect(() => {
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
    expect(await render(element)).toStrictEqual({ "Test Key": "Test Prop" });
  });

  it("attaches the refs to an array", async () => {
    const CustomNode = () => {
      const arrRef = React.useRef<ArrayNode>(null);

      React.useEffect(() => {
        expect(arrRef.current?.type).toBe("array");
      }, []);

      return <array ref={arrRef} />;
    };

    const element = <CustomNode />;

    expect.assertions(2);
    expect(await render(element)).toStrictEqual([]);
  });

  it("attaches the refs to a value", async () => {
    const CustomNode = () => {
      const valRef = React.useRef<ValueNode>(null);

      React.useEffect(() => {
        expect(valRef.current?.type).toBe("value");
      }, []);

      return <value ref={valRef}>Foo</value>;
    };

    const element = <CustomNode />;

    expect.assertions(2);
    expect(await render(element)).toStrictEqual("Foo");
  });
});
