import { fromJSON, JsonNode, toJSON } from "../json";

test("converts back and forth", () => {
  const testObj = {
    foo: [true, "bar", { key: "val" }],
    bar: null,
    other: 2,
  };

  expect(toJSON(fromJSON(testObj) as JsonNode)).toStrictEqual(testObj);
});

describe("fromJSON", () => {
  test("ignores undefined props", () => {
    expect(
      fromJSON({
        foo: "bar",
        bar: undefined,
        baz: {
          key: undefined,
        },
      })
    ).toMatchInlineSnapshot(`
      ObjectNode {
        "properties": Array [
          PropertyNode {
            "keyNode": ValueNode {
              "items": Array [
                Object {
                  "value": "foo",
                },
              ],
              "local": Object {
                "value": "foo",
              },
              "type": "value",
            },
            "type": "property",
            "valueNode": ValueNode {
              "items": Array [
                Object {
                  "value": "bar",
                },
              ],
              "local": Object {
                "value": "bar",
              },
              "type": "value",
            },
          },
          PropertyNode {
            "keyNode": ValueNode {
              "items": Array [
                Object {
                  "value": "baz",
                },
              ],
              "local": Object {
                "value": "baz",
              },
              "type": "value",
            },
            "type": "property",
            "valueNode": ObjectNode {
              "properties": Array [],
              "type": "object",
            },
          },
        ],
        "type": "object",
      }
    `);
  });
});
