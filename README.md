# React Fiber resources [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md#pull-requests)

This is for resources for React Fiber.

React Fiber is a new React reconciler algorithm, which is in progress.

## Current Status?

* [Is Fiber Ready Yet?](http://isfiberreadyyet.com/)
* :eyes: [Umbrella for remaining features / bugs #7925](https://github.com/facebook/react/issues/7925)

## Try React Fiber asynchronous rendering!

You can try React Fiber asynchronous rendering by the following ways.

### 1. Use `ReactDOM.unstable_deferredUpdates`

Inside a `ReactDOM.unstable_deferredUpdates` callback, the updates are treated as Low Priority.

```js
ReactDOM.unstable_deferredUpdates(() => {
    ReactDOM.render(<App />. container);
    // or
    instance.setState(() => newState);
});
```

### 2. Use `React.unstable_AsyncComponent`

`React.unstable_AsyncComponent` makes updates in child components asynchronous, which means the updates are treated as Low Priority.

You can use `React.unstable_AsyncComponent` as just a component or as a base class like PureComponent.

```js
const AsyncComponent = React.unstable_AsyncComponent;

<AsyncComponent>
  <App /> // Low Priority by default
</AsyncComponent>

// Low Priority by default
const App extends AsyncComponent {
    render() {
        return <Child />
    }
}
```

If you'd like to use synchronous updates inside the component, you can use `ReactDOM.flushSync(cb)`.
In side a `ReactDOM.flushSync` callback, the updates are treated as Sync Priority, which is the default priority of v15.

```js
ReactDOM.flushSync(() => {
    // Sync Priority for use input or an animation etc
});
```

### 3. Modify a feature flag (`ReactDOMFeatureFlags.fiberAsyncScheduling`)

If you are enable `ReactDOMFeatureFlags.fiberAsyncScheduling`, updates are treated as Low Priority by default.

```
npm i -S react@next react-dom@next
sed -i -e 's/fiberAsyncScheduling: false/fiberAsyncScheduling: true/' node_modules/react-dom/cjs/react-dom.development.js
```

If you'd like to use synchronous updates, you can use `ReactDOM.flushSync(cb)`.
In side a `ReactDOM.flushSync` callback, the updates are treated as Sync Priority, which is the default priority of v15.

```js
ReactDOM.flushSync(() => {
    // Sync Priority for use input or an animation etc
});
```

## Examples

If you can't get any diferrence between Async mode and Sync mode, you should use CPU throttling on Chrome :smile:

* https://koba04.github.io/react-fiber-resources/examples/

## How to contribute React Fiber

* https://github.com/facebook/react/issues/7925#issuecomment-259258900

## React internal algorithm

If you are not familiar with React internals, I recommend you to read the documentations, which are very helpful.

* [Codebase Overview](https://facebook.github.io/react/contributing/codebase-overview.html)
* [Implementation Notes](https://facebook.github.io/react/contributing/implementation-notes.html)

## React Fiber

* [ReactFiber](https://github.com/facebook/react/tree/master/src/renderers/shared/fiber)
* [ReactFiberDOM](https://github.com/facebook/react/tree/master/src/renderers/dom/fiber)
* [Example](https://github.com/facebook/react/tree/master/examples/fiber)

## Articles & Slides

* [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)
* [Fiber Principles: Contributing To Fiber #7942](https://github.com/facebook/react/issues/7942)
* [How React Fiber Works](https://www.facebook.com/groups/2003630259862046/permalink/2054053404819731/)
* [React Internals](https://zackargyle.github.io/react-internals-slides/)
* [Capability of React Fiber](https://speakerdeck.com/koba04/capability-of-react-fiber)
* [A look inside React Fiber - how work will get done](http://makersden.io/blog/look-inside-fiber/)

## Videos

* [Andrew Clark: Roadmap for React Fiber and Beyond](https://www.youtube.com/watch?v=QW5TE4vrklU)
* [The Evolution of React and GraphQL at Facebook and Beyond](https://developers.facebook.com/videos/f8-2017/the-evolution-of-react-and-graphql-at-facebook-and-beyond/)
* [Lin Clark - A Cartoon Intro to Fiber - React Conf 2017](https://www.youtube.com/watch?v=ZCuYPiUIONs)
* [Sebastian Markbåge - React Performance End to End (React Fiber)](https://www.youtube.com/watch?v=bvFpe5j9-zQ)
* [Andrew Clark: What's Next for React — ReactNext 2016](https://www.youtube.com/watch?v=aV1271hd9ew)
* [Why, What, and How of React Fiber with Dan Abramov and Andrew Clark](https://www.youtube.com/watch?v=crM1iRVGpGQ)
* [A tiny Fiber renderer](https://www.youtube.com/watch?v=U9zFfIww3Go)

## React Fiber function call stacks

**[Note]** React Fiber now behaves as synchronous by default. See [#8127](https://github.com/facebook/react/pull/8127).
This call stacks are results in the time when it behaved as asynchronous.

### ReactDOMFiber

![React Fiber function call stack](./images/ReactDOMFiber.png)

### ReactDOM

![ReactDOM function call stack](./images/ReactDOM.png)

### ReactDOMFiber with 10000 items (Async Scheduling)

![React Fiber function call stack with 10000 items (async)](./images/ReactDOMFiber-10000-items-async.png)

```
--- working asynchronously using requestIdleCallback -------------------------------------------------
| ------- Fiber ---------------    ------- Fiber ---------------    ------ Fiber ---------------     |
| | beginWork -> completeWork | -> | beginWork -> completeWork | -> |beginWork -> completeWork | ... |
| -----------------------------   ------------------------------    ----------------------------     |
------------------------------------------------------------------------------------------------------
                      ↓↓↓
-----------------------------------------------------------------------
| commitAllWork(flush side effects computed in the above to the host) |
-----------------------------------------------------------------------
```

### ReactDOMFiber with 10000 items (Sync Scheduling)

![React Fiber function call stack with 10000 items (sync)](./images/ReactDOMFiber-10000-items-sync.png)

### ReactDOM with 10000 items

![ReactDOMFiber function call stack with 10000 items](./images/ReactDOM-10000-items.png)

## React Fiber call tree

![ReactDOMFiber call tree](./images/ReactDOMFiber-call-tree.png)

## Related Words

* [Fiber](https://en.wikipedia.org/wiki/Fiber_(computer_science))
* [Call Stack](https://en.wikipedia.org/wiki/Call_stack)
* [Coroutine](https://en.wikipedia.org/wiki/Coroutine)
* [Continuation](https://en.wikipedia.org/wiki/Continuation)
* Algebraic Effects
  * [One-shot Delimited Continuations with Effect Handlers](https://esdiscuss.org/topic/one-shot-delimited-continuations-with-effect-handlers)
  * [Effective Concurrency with Algebraic Effects](http://kcsrk.info/ocaml/multicore/2015/05/20/effects-multicore/)
  * [Concurrent & Multicore OCaml: A deep dive](http://kcsrk.info/slides/multicore_fb16.pdf)

## Custom Renderer Interface

You should implement the following interface when create a custom fiber renderer.

* https://github.com/facebook/react/blob/master/src/renderers/shared/fiber/ReactFiberReconciler.js

```js
export type HostConfig<T, P, I, TI, PI, C, CX, PL> = {
  getRootHostContext(rootContainerInstance: C): CX {
    // e.g. namespace of DOM
  },
  getChildHostContext(parentHostContext: CX, type: T, instance: C): CX {
    // e.g. namespace of DOM
  },
  getPublicInstance(instance: I | TI): PI {
    // e.g. DOM Element
  },
  createInstance(
    type: T,
    props: P,
    rootContainerInstance: C,
    hostContext: CX,
    internalInstanceHandle: OpaqueHandle,
  ): I {
    // e.g. DOM Element
  },
  appendInitialChild(parentInstance: I, child: I | TI): void {
    // append child into parentInstance
  },
  finalizeInitialChildren(
    parentInstance: I,
    type: T,
    props: P,
    rootContainerInstance: C,
  ): boolean {
    // set props
    // ReactDOMFiber returns a flag whether a DOM should be focused or not.
  },
  prepareUpdate(
    instance: I,
    type: T,
    oldProps: P,
    newProps: P,
    rootContainerInstance: C,
    hostContext: CX,
  ): null | PL {
    // calculate the diff between oldProps and newProps
  },
  commitUpdate(
    instance: I,
    updatePayload: PL,
    type: T,
    oldProps: P,
    newProps: P,
    internalInstanceHandle: OpaqueHandle,
  ): void,
  commitMount(
    instance: I,
    type: T,
    newProps: P,
    internalInstanceHandle: OpaqueHandle,
  ): void {
     // If finalizeInitialChildren returns true, this method is called
  },
  shouldSetTextContent(type: T, props: P): boolean {
    // whether having text content(e.g. children, dangerouslySetInnerHTML)
  },
  resetTextContent(instance: I): void {
    // reset instance's text content
  },
  shouldDeprioritizeSubtree(type: T, props: P): boolean {
    // ReactDOMFiber
    // return !!props.hidden;
  },
  createTextInstance(
    text: string,
    rootContainerInstance: C,
    hostContext: CX,
    internalInstanceHandle: OpaqueHandle,
  ): TI {
    // create a text instance
    // ReactDOMFiber returns textNode
  },
  commitTextUpdate(textInstance: TI, oldText: string, newText: string): void {
    // Update the textInstance
    // ReactFiberFiber updates nodeValue of the textInstance
  },
  appendChild(parentInstance: I | C, child: I | TI): void {
    // appendChild
  },
  appendChildToContainer(container: C, child: I | TI): void {
    // appendChild to container
    // container means HostContainer or HostRoot or HostPortal
  },
  insertBefore(parentInstance: I | C, child: I | TI, beforeChild: I | TI): void {
   // insert child before beforeChild
  },
  insertInContainerBefore(
    container: C,
    child: I | TI,
    beforeChild: I | TI,
  ): void {
   // insert child into container before beforeChild
  },
  removeChild(parentInstance: I | C, child: I | TI): void {
    // remove child
  },
  removeChildFromContainer(container: C, child: I | TI): void {
    // remove child from container
  },
  scheduleDeferredCallback(
    callback: (deadline: Deadline) => void,
  ): number | void {
    // requestIdleCallback
  },
  prepareForCommit(): void {
    // called before commit side effects
    // disabled event listener temporary
  },
  resetAfterCommit(): void {
    // called after commit
    // restore event listener setting
  },
  // Optional hydration
  canHydrateInstance?: (instance: I | TI, type: T, props: P) => boolean {
    // Can instance be hydrated?
    // ReactDOMFiber
    // return instance.nodeType === 1 && type === instance.nodeName.toLowerCase();
  },
  canHydrateTextInstance?: (instance: I | TI) => boolean {
   // Can text instance be hydrated?
   // ReactDOMFiber
   // return instance.nodeType === 3;
  },
  getNextHydratableSibling?: (instance: I | TI) => null | I | TI {
    // return a next sibling node
  },
  getFirstHydratableChild?: (parentInstance: C | I) => null | I | TI {
    // return a first child node
  },
  hydrateInstance?: (
    instance: I,
    type: T,
    props: P,
    rootContainerInstance: C,
    internalInstanceHandle: OpaqueHandle,
  ) => null | PL {
    // hydrate instance
    },
  hydrateTextInstance?: (
    textInstance: TI,
    text: string,
    internalInstanceHandle: OpaqueHandle,
  ) => boolean {
    // hydrate text instance
  },
  useSyncScheduling?: boolean, // sync by default?
};
```

### Toy custom renderers

* Console Renderer

https://gist.github.com/koba04/963c9b3d16b372d6420f397ae97c55a5

```js
    ReactConsole.render(
      <div>
        <red>Hello</red>
        <yellow>World</yellow>
        <cyan>React</cyan>
        <rainbow>Custom Renderer!</rainbow>
      </div>,
      () => console.log(colors.inverse('##### Update ######'))
    );
    ReactConsole.render(
      <div>
        <green>Hello</green>
        <yellow>World2</yellow>
        <cyan>React</cyan>
      </div>
    );
```

* Voice Renderer

https://gist.github.com/koba04/19e896afc276a2eac7d9e0660026f16d

```js
    ReactVoice.render([
      <alex key={1}>Hello</alex>,
      <victoria key={2}>React Fiber</victoria>,
    ]);
```

## ReactNoop

ReactNoop is a renderer for React Fiber, which is using for testing and debugging.
It is very useful to understand React Fiber renderer!! :eyes:

* https://github.com/facebook/react/blob/master/src/renderers/noop/ReactNoop.js

Bonus: You should watch `ReactIncremental-test`, which helps to understand what React Fiber makes it possible

* https://github.com/facebook/react/blob/master/src/renderers/shared/fiber/__tests__/ReactIncremental-test.js
