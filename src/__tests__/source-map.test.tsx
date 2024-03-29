import { test, expect } from "vitest";
import * as React from "react";
import { SourceMapConsumer } from "source-map-js";
import { render } from "..";

test("generates source maps from original code", async () => {
  const createSourceProps = (
    lineNumber: number,
    columnNumber?: number
  ): any => {
    return {
      __source: {
        fileName: "this/file.tsx",
        lineNumber,
        columnNumber,
      },
    };
  };

  const result = await render(
    <obj {...createSourceProps(2)}>
      <property name="foo" {...createSourceProps(2, 2)}>
        <value>bar</value>
      </property>
      <property name="bar">
        <array>
          <value {...createSourceProps(7)}>one</value>
          <value>two</value>
          <value>three</value>
        </array>
      </property>
    </obj>,
    {
      collectSourceMap: true,
    }
  );

  const consumer = new SourceMapConsumer(JSON.parse(result.sourceMap ?? "{}"));

  [
    [
      [1, 1],
      [2, 1],
    ],
    [
      [2, 10],
      [2, 2],
    ],
    [
      [4, 5],
      [7, 1],
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
