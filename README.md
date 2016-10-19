# ReactFiber resources [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md#pull-requests)

This is for resources for ReactFiber.

ReactFiber is a new React reconciler algorithm, which is in progress.


## React internal algorithm

If you are not familiar with React internals, I recommend you to read the documentations, which are very helpful.

* [Codebase Overview](https://facebook.github.io/react/contributing/codebase-overview.html)
* [Implementation Notes](https://facebook.github.io/react/contributing/implementation-notes.html)


## React Fiber

* [ReactFiber](https://github.com/facebook/react/tree/master/src/renderers/shared/fiber)
* [ReactFiberDOM](https://github.com/facebook/react/tree/master/src/renderers/dom/fiber)
* [Example](https://github.com/facebook/react/tree/master/examples/fiber)


## PRs

| No | Title | Author | Status |
| --- | ----- | ------ | ------ |
| [#8012](https://github.com/facebook/react/issues/8012) | Formalize States | [@sebmarkbage](https://github.com/sebmarkbage) | |
| [#8010](https://github.com/facebook/react/pull/8010) | Some setState related issues | [@sebmarkbage](https://github.com/sebmarkbage) | |
| [#8009](https://github.com/facebook/react/pull/8009) | [NFC] Logging protips | [@sebmarkbage](https://github.com/sebmarkbage) | |
| [#8001](https://github.com/facebook/react/pull/8001) | Add a unit test for ReactTopLevelText | [@koba04](https://github.com/koba04) | :rocket: |
| [#7993](https://github.com/facebook/react/pull/7993) | Initial error boundaries | [@gaearon](https://github.com/gaearon) | |
| [#7992](https://github.com/facebook/react/pull/7992) | Set DOM attributes | [@gaearon](https://github.com/gaearon) | :heavy_check_mark: |
| [#7972](https://github.com/facebook/react/pull/7972) | Support to render number as children | [@koba04](https://github.com/koba04) | :heavy_check_mark: |
| [#7941](https://github.com/facebook/react/pull/7941) | State Updates | [@sebmarkbage](https://github.com/sebmarkbage) | :rocket: |
| [#7707](https://github.com/facebook/react/pull/7707) | Child Reconciliation, Refs and Life-Cycles | [@sebmarkbage](https://github.com/sebmarkbage) | :rocket: |
| [#7636](https://github.com/facebook/react/pull/7636) | Refactor Pending Work Phase and Progressed Work | [@sebmarkbage](https://github.com/sebmarkbage) | :rocket: |
| [#7466](https://github.com/facebook/react/pull/7466) | Animation priority work | [@acdlite](https://github.com/acdlite) | :rocket: |
| [#7457](https://github.com/facebook/react/pull/7457) | Separate priority field for pending updates | [@acdlite](https://github.com/acdlite) | |
| [#7448](https://github.com/facebook/react/pull/7448) | Fix initial mount starvation problems | [@sebmarkbage](https://github.com/sebmarkbage) | :heavy_check_mark: |
| [#7344](https://github.com/facebook/react/pull/7344) | setState | [@acdlite](https://github.com/acdlite) | :rocket: |
| [#7248](https://github.com/facebook/react/pull/7248) | Various minor tweaks and a few big ones | [@sebmarkbage](https://github.com/sebmarkbage) | :rocket: |
| [#7180](https://github.com/facebook/react/pull/7180) | [Not for commit] Sierpinski Triangle Demo | [@sebmarkbage](https://github.com/sebmarkbage) | |
| [#7154](https://github.com/facebook/react/pull/7154) | Host Side Effects | [@sebmarkbage](https://github.com/sebmarkbage) | :rocket: |
| [#7034](https://github.com/facebook/react/pull/7034) | Host Container Fiber and Priority Levels | [@sebmarkbage](https://github.com/sebmarkbage) | :rocket: |
| [#6988](https://github.com/facebook/react/pull/6988) | Minimize abuse of .alternate | [@sebmarkbage](https://github.com/sebmarkbage) | :rocket: |
| [#6981](https://github.com/facebook/react/pull/6981) | Add support for simple updates and fiber pooling | [@sebmarkbage](https://github.com/sebmarkbage) | :rocket: |
| [#6903](https://github.com/facebook/react/pull/6903) | Transfer everything from Element onto the Fiber and use Tag instead of Stage | [@sebmarkbage](https://github.com/sebmarkbage) | :rocket: |
| [#6859](https://github.com/facebook/react/pull/6859) | Child Reconciler + New Coroutines Primitive | [@sebmarkbage](https://github.com/sebmarkbage) | :rocket: |

:rocket: is a merged PR.
:heavy_check_mark: is a closed PR or Issue.

## Issues

| No | Title | Author | Status |
| --- | ----- | ------ | ------ |
| [#7942](https://github.com/facebook/react/issues/7942) | Fiber Principles: Contributing To Fiber | [@sebmarkbage](https://github.com/sebmarkbage) | |
| [#7925](https://github.com/facebook/react/issues/7925) | Umbrella for remaining features / bugs | [@sebmarkbage](https://github.com/sebmarkbage) | |
| [#7906](https://github.com/facebook/react/issues/7906) | Spill-over from child reconciliation | [@sebmarkbage](https://github.com/sebmarkbage) | |

:heavy_check_mark: is a closed PR or Issue.


## Entries

* [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)
* [How React Fiber Works](https://www.facebook.com/groups/2003630259862046/permalink/2054053404819731/)


## Videos

* [Andrew Clark: What's Next for React — ReactNext 2016](https://www.youtube.com/watch?v=aV1271hd9ew)


## Related Words

* [Fiber](https://en.wikipedia.org/wiki/Fiber_(computer_science))
* [Call Stack](https://en.wikipedia.org/wiki/Call_stack)
* [Coroutine](https://en.wikipedia.org/wiki/Coroutine)
* [Continuation](https://en.wikipedia.org/wiki/Continuation)

## Examples

* https://koba04.github.io/react-fiber-resources/examples/
