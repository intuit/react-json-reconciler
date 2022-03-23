import { validateNesting } from "..";
import {
  ArrayNode,
  ObjectNode,
  PropertyNode,
  ProxyNode,
  ValueNode,
} from "../json";

test("validates parent -> child relations", () => {
  expect(() => {
    validateNesting(new ArrayNode(), new PropertyNode(new ValueNode("key")));
  }).toThrowError();

  expect(() => {
    validateNesting(new ObjectNode(), new ValueNode("value"));
  }).toThrowError();

  expect(() => {
    validateNesting(new ValueNode("value 1"), new ArrayNode());
  }).toThrowError();
});

test("works for proxied nodes", () => {
  expect(() =>
    validateNesting(
      new ArrayNode(),
      new ProxyNode([new PropertyNode(new ValueNode("key"))])
    )
  ).toThrowError();
});
