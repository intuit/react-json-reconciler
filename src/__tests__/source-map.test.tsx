import React from "react";
import { SourceMapConsumer } from "source-map-js";
import { render } from "..";

test("generates source maps from original code", async () => {
  const createSourceProps = (lineNumber: number, columnNumber: number): any => {
    return {
      __source: {
        fileName: "this/file.tsx",
        lineNumber,
        columnNumber,
      },
    };
  };

  const result = await render(
    <obj {...createSourceProps(2, 2)}>
      <property name="foo" {...createSourceProps(2, 4)}>
        <value>bar</value>
      </property>
      <property name="bar">
        <array>
          <value {...createSourceProps(7, 2)}>one</value>
          <value>two</value>
          <value>three</value>
        </array>
      </property>
    </obj>
  );

  const consumer = new SourceMapConsumer(JSON.parse(result.sourceMap));

  [
    [
      [1, 1],
      [2, 2],
    ],
    [
      [2, 10],
      [2, 4],
    ],
    [
      [4, 5],
      [7, 2],
    ],
  ].forEach(([generated, original]) => {
    expect(
      consumer.originalPositionFor({
        line: generated[0],
        column: generated[1],
      })
    ).toStrictEqual({
      line: original[0],
      column: original[1],
      name: null,
      source: "this/file.tsx",
    });
  });
});
