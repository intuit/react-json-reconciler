<h1 align="center">
  <img width="400" alt="react-json-reconciler" src="./logo.png"/>
</h1>

This project leverages the `react-reconciler` to allow users to serialize JSX trees into JSON objects.

## Install

```
yarn add react-json-reconciler
npm i --save react-json-reconciler
```

## Usage

There are 4 primitive JSX elements, that can be used to construct a _normal_ JSX tree. All the things you'd expect to have access to in `React` (`state`, `hooks` `props`) all work as they normally would. To serialize the elements into JSON, call `render` and await the response. This will wait for all `useEffect` and `setState` updates to settle before returning the result.

```tsx
import React from "react";
import { render } from "react-json-reconciler";

const element = (
  <obj>
    <property key="Prop 1">
      <array>
        <value>Value 1</value>
      </array>
    </property>
    <property key="Prop 2">Value 2</property>
  </obj>
);

const jsonValue = await render(element);
```

The above will generate

```json
{
  "Prop 1": ["Value 1"],
  "Prop 2": "Value 2"
}
```

### Refs

For each of the primitive types, any `ref` will return a respective JSON AST node. This allows users to introspect and manipulate the tree before rendering when coupled with a `useEffect()` or `useLayoutEffect()`.

Example:

```tsx
import React from "react";

const CustomComponent = (props) => {
  const objRef = React.useRef(null);

  React.useEffect(() => {
    // A chance to introspect the JSON AST node before being serialized
  }, [objRef]);

  return <obj ref={objRef}>{props.children}</obj>;
};
```

## Contributing

Feel free to open an issue or a pull request!

Make sure to read our [code of conduct](./CODE_OF_CONDUCT.md).

We actively welcome pull requests. Learn how to [contribute](./CONTRIBUTING.md).

## License

`react-json-reconciler` is provided under the [MIT](./LICENSE) license.
