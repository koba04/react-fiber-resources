# React Fiber resources [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md#pull-requests)

This is a repository for resources about React Fiber.

React Fiber is a new React reconciliation algorithm, which started using from v16. React Fiber makes many features like Suspense and Concurrent Mode possible.

Concurrent Mode is still in experimental stage, but React already has the documentation so you can see what Concurrent Mode makes possible at the documentation.

https://reactjs.org/docs/concurrent-mode-intro.html

## React internal algorithm

If you are not familiar with React internals, I recommend you reading the documentations first, which are very helpful resources.

* [Codebase Overview](https://reactjs.org/docs/codebase-overview.html)
* [Implementation Notes](https://reactjs.org/docs/implementation-notes.html)

## React Fiber

* [ReactFiber](https://github.com/facebook/react/tree/master/packages/react-reconciler/src)
* [ReactFiberDOM](https://github.com/facebook/react/blob/master/packages/react-dom/src/client/ReactDOM.js)
* [Fiber Debugger](http://fiber-debugger.surge.sh/)

## Articles & Slides

* [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)
* [Fiber Principles: Contributing To Fiber #7942](https://github.com/facebook/react/issues/7942)
* [How React Fiber Works](https://www.facebook.com/groups/2003630259862046/permalink/2054053404819731/)
* [React Internals](https://zackargyle.github.io/react-internals-slides/)
* [Capability of React Fiber](https://speakerdeck.com/koba04/capability-of-react-fiber)
* [A look inside React Fiber - how work will get done](http://makersden.io/blog/look-inside-fiber/)
* [Build your own React Fiber](https://engineering.hexacta.com/didact-fiber-incremental-reconciliation-b2fe028dcaec)
* [Algorithms in React](https://speakerdeck.com/koba04/algorithms-in-react)

## Videos

* [Dan Abramov: Beyond React 16](https://reactjs.org/blog/2018/03/01/sneak-peek-beyond-react-16.html)
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
--- working asynchronously ---------------------------------------------------------------------------
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

React doesn't depend on any specific environments like DOM and React provides us a way to create own custom renderers based on Fiber reconciliation. ReactDOM and ReactNative are implemented as one of the custom renderers.

I've presented about the custom renderer; here is the link to the slide.

* https://speakerdeck.com/koba04/make-it-declarative-with-react
* https://github.com/koba04/jsconf-jp-presentation

The following is a custom renderer named `react-fs`, which is a renderer for `fs` package

```js
const React = require('react');
const { ReactFS } = require('@koba04/react-fs');

const targetDir = "test-react-fs-project";
ReactFS.render(
  <>
    <file name="README.md">
      # Title
    </file>
    <directory name="src">
      <file name="index.js">
        console.log("Hello");
      </file>
    </directory>
  </>,
  targetDir
);
```

## ReactNoop

ReactNoop is a renderer for React Fiber, which is using for testing and debugging.
It is very useful to understand React Fiber renderer!! :eyes:

* https://github.com/facebook/react/tree/master/packages/react-noop-renderer
