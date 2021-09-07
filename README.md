<h1 align="center">
  <img width="400" alt="react-json-reconciler" src="./logo.png"/>
</h1>

This project leverages the `react-reconciler` to allow users to serialize JSX trees into JSON objects.

---

<div align="center">
<!-- <a href="https://circleci.com/gh/intuit/react-jcon-reconciler"><img src="https://img.shields.io/circleci/project/github/intuit/react-jcon-reconciler/main.svg?style=flat-square&logo=circleci" alt="CircleCI" /></a> 
-->
<a href="https://www.npmjs.com/package/react-json-reconciler"><img src="https://img.shields.io/npm/v/react-json-reconciler.svg?style=flat-square&logo=npm" alt="npm" /></a> 
<a href="https://codecov.io/gh/intuit/react-json-reconciler">
  <img src="https://codecov.io/gh/intuit/react-json-reconciler/branch/main/graph/badge.svg?token=U4V5ZF55CO"/>
</a>
<a href="#contributors"><img src="https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square&logo=github" alt="All Contributors" /></a> 
<a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square&logo=producthunt" alt="code style: prettier" /></a></div>

<br />

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

## License

`react-json-reconciler` is provided under the [MIT](./LICENSE) license.

## Contributors ✨

Feel free to open an issue or a pull request!

Make sure to read our [code of conduct](./CODE_OF_CONDUCT.md).

We actively welcome pull requests. Learn how to [contribute](./CONTRIBUTING.md).

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/adierkens"><img src="https://avatars.githubusercontent.com/u/13004162?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Adam Dierkens</b></sub></a><br /><a href="https://github.com/intuit/react-json-reconciler/commits?author=adierkens" title="Code">💻</a> <a href="https://github.com/intuit/react-json-reconciler/commits?author=adierkens" title="Documentation">📖</a> <a href="#example-adierkens" title="Examples">💡</a> <a href="#infra-adierkens" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-adierkens" title="Maintenance">🚧</a> <a href="#platform-adierkens" title="Packaging/porting to new platform">📦</a> <a href="https://github.com/intuit/react-json-reconciler/commits?author=adierkens" title="Tests">⚠️</a> <a href="#tool-adierkens" title="Tools">🔧</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
