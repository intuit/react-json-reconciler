import { fromJSON, toJSON } from "../json";

test("converts back and forth", () => {
  const testObj = {
    foo: [true, "bar", { key: "val" }],
    bar: null,
    other: 2,
  };

  expect(toJSON(fromJSON(testObj))).toStrictEqual(testObj);
});
