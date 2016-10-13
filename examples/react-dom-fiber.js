 /**
  * ReactDOMFiber v16.0.0-alpha
  */

;(function(f) {
  // CommonJS
  if (typeof exports === "object" && typeof module !== "undefined") {
    f(require('react'));

  // RequireJS
  } else if (typeof define === "function" && define.amd) {
    require(['react'], f);

  // <script>
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      // works providing we're not in "use strict";
      // needed for Java 8 Nashorn
      // see https://github.com/facebook/react/issues/3037
      g = this;
    }
    f(g.React)
  }
})(function(React) {
  (function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ReactDOMFiber = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactChildFiber
 * 
 */

'use strict';

var REACT_ELEMENT_TYPE = _dereq_(4);

var _require = _dereq_(2);

var REACT_COROUTINE_TYPE = _require.REACT_COROUTINE_TYPE;
var REACT_YIELD_TYPE = _require.REACT_YIELD_TYPE;


var ReactFiber = _dereq_(5);
var ReactReifiedYield = _dereq_(15);

var cloneFiber = ReactFiber.cloneFiber;
var createFiberFromElement = ReactFiber.createFiberFromElement;
var createFiberFromCoroutine = ReactFiber.createFiberFromCoroutine;
var createFiberFromYield = ReactFiber.createFiberFromYield;
var createReifiedYield = ReactReifiedYield.createReifiedYield;


var isArray = Array.isArray;

function ChildReconciler(shouldClone) {

  function createSubsequentChild(returnFiber, existingChild, previousSibling, newChildren, priority) {
    if (typeof newChildren !== 'object' || newChildren === null) {
      return previousSibling;
    }

    switch (newChildren.$$typeof) {
      case REACT_ELEMENT_TYPE:
        {
          var element = newChildren;
          if (existingChild && element.type === existingChild.type && element.key === existingChild.key) {
            // TODO: This is not sufficient since previous siblings could be new.
            // Will fix reconciliation properly later.
            var clone = shouldClone ? cloneFiber(existingChild, priority) : existingChild;
            if (!shouldClone) {
              // TODO: This might be lowering the priority of nested unfinished work.
              clone.pendingWorkPriority = priority;
            }
            clone.pendingProps = element.props;
            clone.sibling = null;
            clone['return'] = returnFiber;
            previousSibling.sibling = clone;
            return clone;
          }
          var child = createFiberFromElement(element, priority);
          previousSibling.sibling = child;
          child['return'] = returnFiber;
          return child;
        }

      case REACT_COROUTINE_TYPE:
        {
          var coroutine = newChildren;
          var _child = createFiberFromCoroutine(coroutine, priority);
          previousSibling.sibling = _child;
          _child['return'] = returnFiber;
          return _child;
        }

      case REACT_YIELD_TYPE:
        {
          var yieldNode = newChildren;
          var reifiedYield = createReifiedYield(yieldNode);
          var _child2 = createFiberFromYield(yieldNode, priority);
          _child2.output = reifiedYield;
          previousSibling.sibling = _child2;
          _child2['return'] = returnFiber;
          return _child2;
        }
    }

    if (isArray(newChildren)) {
      var prev = previousSibling;
      var existing = existingChild;
      for (var i = 0; i < newChildren.length; i++) {
        var nextExisting = existing && existing.sibling;
        prev = createSubsequentChild(returnFiber, existing, prev, newChildren[i], priority);
        if (prev && existing) {
          // TODO: This is not correct because there could've been more
          // than one sibling consumed but I don't want to return a tuple.
          existing = nextExisting;
        }
      }
      return prev;
    } else {
      // TODO: Throw for unknown children.
      return previousSibling;
    }
  }

  function createFirstChild(returnFiber, existingChild, newChildren, priority) {
    if (typeof newChildren !== 'object' || newChildren === null) {
      return null;
    }

    switch (newChildren.$$typeof) {
      case REACT_ELEMENT_TYPE:
        {
          /* $FlowFixMe(>=0.31.0): This is an unsafe cast. Consider adding a type
           *                       annotation to the `newChildren` param of this
           *                       function.
           */
          var element = newChildren;
          if (existingChild && element.type === existingChild.type && element.key === existingChild.key) {
            // Get the clone of the existing fiber.
            var clone = shouldClone ? cloneFiber(existingChild, priority) : existingChild;
            if (!shouldClone) {
              // TODO: This might be lowering the priority of nested unfinished work.
              clone.pendingWorkPriority = priority;
            }
            clone.pendingProps = element.props;
            clone.sibling = null;
            clone['return'] = returnFiber;
            return clone;
          }
          var child = createFiberFromElement(element, priority);
          child['return'] = returnFiber;
          return child;
        }

      case REACT_COROUTINE_TYPE:
        {
          /* $FlowFixMe(>=0.31.0): No 'handler' property found in object type
           */
          var coroutine = newChildren;
          var _child3 = createFiberFromCoroutine(coroutine, priority);
          _child3['return'] = returnFiber;
          return _child3;
        }

      case REACT_YIELD_TYPE:
        {
          // A yield results in a fragment fiber whose output is the continuation.
          // TODO: When there is only a single child, we can optimize this to avoid
          // the fragment.
          /* $FlowFixMe(>=0.31.0): No 'continuation' property found in object
           * type
           */
          var yieldNode = newChildren;
          var reifiedYield = createReifiedYield(yieldNode);
          var _child4 = createFiberFromYield(yieldNode, priority);
          _child4.output = reifiedYield;
          _child4['return'] = returnFiber;
          return _child4;
        }
    }

    if (isArray(newChildren)) {
      var first = null;
      var prev = null;
      var existing = existingChild;
      /* $FlowIssue(>=0.31.0) #12747709
       *
       * `Array.isArray` is matched syntactically for now until predicate
       * support is complete.
       */
      for (var i = 0; i < newChildren.length; i++) {
        var nextExisting = existing && existing.sibling;
        if (prev == null) {
          prev = createFirstChild(returnFiber, existing, newChildren[i], priority);
          first = prev;
        } else {
          prev = createSubsequentChild(returnFiber, existing, prev, newChildren[i], priority);
        }
        if (prev && existing) {
          // TODO: This is not correct because there could've been more
          // than one sibling consumed but I don't want to return a tuple.
          existing = nextExisting;
        }
      }
      return first;
    } else {
      // TODO: Throw for unknown children.
      return null;
    }
  }

  // TODO: This API won't work because we'll need to transfer the side-effects of
  // unmounting children to the returnFiber.
  function reconcileChildFibers(returnFiber, currentFirstChild, newChildren, priority) {
    return createFirstChild(returnFiber, currentFirstChild, newChildren, priority);
  }

  return reconcileChildFibers;
}

exports.reconcileChildFibers = ChildReconciler(true);

exports.reconcileChildFibersInPlace = ChildReconciler(false);

function cloneSiblings(current, workInProgress, returnFiber) {
  workInProgress['return'] = returnFiber;
  while (current.sibling) {
    current = current.sibling;
    workInProgress = workInProgress.sibling = cloneFiber(current, current.pendingWorkPriority);
    workInProgress['return'] = returnFiber;
  }
  workInProgress.sibling = null;
}

exports.cloneChildFibers = function (current, workInProgress) {
  if (!workInProgress.child) {
    return;
  }
  if (current && workInProgress.child === current.child) {
    // We use workInProgress.child since that lets Flow know that it can't be
    // null since we validated that already. However, as the line above suggests
    // they're actually the same thing.
    var currentChild = workInProgress.child;
    // TODO: This used to reset the pending priority. Not sure if that is needed.
    // workInProgress.pendingWorkPriority = current.pendingWorkPriority;
    // TODO: The below priority used to be set to NoWork which would've
    // dropped work. This is currently unobservable but will become
    // observable when the first sibling has lower priority work remaining
    // than the next sibling. At that point we should add tests that catches
    // this.
    var newChild = cloneFiber(currentChild, currentChild.pendingWorkPriority);
    workInProgress.child = newChild;
    cloneSiblings(currentChild, newChild, workInProgress);
  }

  // If there is no alternate, then we don't need to clone the children.
  // If the children of the alternate fiber is a different set, then we don't
  // need to clone. We need to reset the return fiber though since we'll
  // traverse down into them.
  var child = workInProgress.child;
  while (child) {
    child['return'] = workInProgress;
    child = child.sibling;
  }
};
},{"15":15,"2":2,"4":4,"5":5}],2:[function(_dereq_,module,exports){
/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCoroutine
 * 
 */

'use strict';

// The Symbol used to tag the special React types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var REACT_COROUTINE_TYPE = typeof Symbol === 'function' && Symbol['for'] && Symbol['for']('react.coroutine') || 0xeac8;

var REACT_YIELD_TYPE = typeof Symbol === 'function' && Symbol['for'] && Symbol['for']('react.yield') || 0xeac9;

exports.createCoroutine = function (children, handler, props) {
  var key = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

  var coroutine = {
    // This tag allow us to uniquely identify this as a React Coroutine
    $$typeof: REACT_COROUTINE_TYPE,
    key: key == null ? null : '' + key,
    children: children,
    handler: handler,
    props: props
  };

  if ("development" !== 'production') {
    // TODO: Add _store property for marking this as validated.
    if (Object.freeze) {
      Object.freeze(coroutine.props);
      Object.freeze(coroutine);
    }
  }

  return coroutine;
};

exports.createYield = function (props, continuation) {
  var key = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var yieldNode = {
    // This tag allow us to uniquely identify this as a React Yield
    $$typeof: REACT_YIELD_TYPE,
    key: key == null ? null : '' + key,
    props: props,
    continuation: continuation
  };

  if ("development" !== 'production') {
    // TODO: Add _store property for marking this as validated.
    if (Object.freeze) {
      Object.freeze(yieldNode.props);
      Object.freeze(yieldNode);
    }
  }

  return yieldNode;
};

/**
 * Verifies the object is a coroutine object.
 */
exports.isCoroutine = function (object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_COROUTINE_TYPE;
};

/**
 * Verifies the object is a yield object.
 */
exports.isYield = function (object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_YIELD_TYPE;
};

exports.REACT_YIELD_TYPE = REACT_YIELD_TYPE;
exports.REACT_COROUTINE_TYPE = REACT_COROUTINE_TYPE;
},{}],3:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMFiber
 * 
 */

'use strict';

var ReactFiberReconciler = _dereq_(9);

var warning = _dereq_(18);

function recursivelyAppendChildren(parent, child) {
  if (!child) {
    return;
  }
  /* $FlowFixMe: Element should have this property. */
  if (child.nodeType === 1) {
    /* $FlowFixMe: Refinement issue. I don't know how to express different. */
    parent.appendChild(child);
  } else {
    /* As a result of the refinement issue this type isn't known. */
    var node = child;
    do {
      recursivelyAppendChildren(parent, node.output);
    } while (node = node.sibling);
  }
}

var DOMRenderer = ReactFiberReconciler({
  updateContainer: function (container, children) {
    container.innerHTML = '';
    recursivelyAppendChildren(container, children);
  },
  createInstance: function (type, props, children) {
    var domElement = document.createElement(type);
    recursivelyAppendChildren(domElement, children);
    if (typeof props.children === 'string') {
      domElement.textContent = props.children;
    }
    return domElement;
  },
  prepareUpdate: function (domElement, oldProps, newProps, children) {
    return true;
  },
  commitUpdate: function (domElement, oldProps, newProps, children) {
    domElement.innerHTML = '';
    recursivelyAppendChildren(domElement, children);
    if (typeof newProps.children === 'string') {
      domElement.textContent = newProps.children;
    }
  },
  deleteInstance: function (instance) {
    // Noop
  },


  scheduleAnimationCallback: window.requestAnimationFrame,

  scheduleDeferredCallback: window.requestIdleCallback

});

var warned = false;

function warnAboutUnstableUse() {
  "development" !== 'production' ? warning(warned, 'You are using React DOM Fiber which is an experimental renderer. ' + 'It is likely to have bugs, breaking changes and is unsupported.') : void 0;
  warned = true;
}

var ReactDOM = {
  render: function (element, container) {
    warnAboutUnstableUse();
    if (!container._reactRootContainer) {
      container._reactRootContainer = DOMRenderer.mountContainer(element, container);
    } else {
      DOMRenderer.updateContainer(element, container._reactRootContainer);
    }
  },
  unmountComponentAtNode: function (container) {
    warnAboutUnstableUse();
    var root = container._reactRootContainer;
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this
      // unmount could be deferred?
      container._reactRootContainer = null;
      DOMRenderer.unmountContainer(root);
    }
  }
};

module.exports = ReactDOM;
},{"18":18,"9":9}],4:[function(_dereq_,module,exports){
/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactElementSymbol
 * 
 */

'use strict';

// The Symbol used to tag the ReactElement type. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.

var REACT_ELEMENT_TYPE = typeof Symbol === 'function' && Symbol['for'] && Symbol['for']('react.element') || 0xeac7;

module.exports = REACT_ELEMENT_TYPE;
},{}],5:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiber
 * 
 */

'use strict';

var ReactTypeOfWork = _dereq_(16);
var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent;
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;
var CoroutineComponent = ReactTypeOfWork.CoroutineComponent;
var YieldComponent = ReactTypeOfWork.YieldComponent;

var _require = _dereq_(14);

var NoWork = _require.NoWork;

// An Instance is shared between all versions of a component. We can easily
// break this out into a separate object to avoid copying so much to the
// alternate versions of the tree. We put this on a single object for now to
// minimize the number of objects created during the initial render.


// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.

// This is a constructor of a POJO instead of a constructor function for a few
// reasons:
// 1) Nobody should add any instance methods on this. Instance methods can be
//    more difficult to predict when they get optimized and they are almost
//    never inlined properly in static compilers.
// 2) Nobody should rely on `instanceof Fiber` for type testing. We should
//    always know when it is a fiber.
// 3) We can easily go from a createFiber call to calling a constructor if that
//    is faster. The opposite is not true.
// 4) We might want to experiment with using numeric keys since they are easier
//    to optimize in a non-JIT environment.
// 5) It should be easy to port this to a C struct and keep a C implementation
//    compatible.
var createFiber = function (tag, key) {
  return {

    // Instance

    tag: tag,

    key: key,

    type: null,

    stateNode: null,

    // Fiber

    'return': null,

    child: null,
    sibling: null,

    ref: null,

    pendingProps: null,
    memoizedProps: null,
    updateQueue: null,
    memoizedState: null,
    callbackList: null,
    output: null,

    nextEffect: null,
    firstEffect: null,
    lastEffect: null,

    pendingWorkPriority: NoWork,
    progressedPriority: NoWork,
    progressedChild: null,

    alternate: null

  };
};

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

// This is used to create an alternate fiber to do work on.
// TODO: Rename to createWorkInProgressFiber or something like that.
exports.cloneFiber = function (fiber, priorityLevel) {
  // We clone to get a work in progress. That means that this fiber is the
  // current. To make it safe to reuse that fiber later on as work in progress
  // we need to reset its work in progress flag now. We don't have an
  // opportunity to do this earlier since we don't traverse the tree when
  // the work in progress tree becomes the current tree.
  // fiber.progressedPriority = NoWork;
  // fiber.progressedChild = null;

  // We use a double buffering pooling technique because we know that we'll only
  // ever need at most two versions of a tree. We pool the "other" unused node
  // that we're free to reuse. This is lazily created to avoid allocating extra
  // objects for things that are never updated. It also allow us to reclaim the
  // extra memory if needed.
  var alt = fiber.alternate;
  if (alt) {
    // Whenever we clone, we do so to get a new work in progress.
    // This ensures that we've reset these in the new tree.
    alt.nextEffect = null;
    alt.firstEffect = null;
    alt.lastEffect = null;
  } else {
    // This should not have an alternate already
    alt = createFiber(fiber.tag, fiber.key);
    alt.type = fiber.type;

    alt.progressedChild = fiber.progressedChild;
    alt.progressedPriority = fiber.progressedPriority;

    alt.alternate = fiber;
    fiber.alternate = alt;
  }

  alt.stateNode = fiber.stateNode;
  alt.child = fiber.child;
  alt.sibling = fiber.sibling; // This should always be overridden. TODO: null
  alt.ref = fiber.ref;
  // pendingProps is here for symmetry but is unnecessary in practice for now.
  // TODO: Pass in the new pendingProps as an argument maybe?
  alt.pendingProps = fiber.pendingProps;
  alt.updateQueue = fiber.updateQueue;
  alt.callbackList = fiber.callbackList;
  alt.pendingWorkPriority = priorityLevel;

  alt.memoizedProps = fiber.memoizedProps;
  alt.output = fiber.output;

  return alt;
};

exports.createHostContainerFiber = function () {
  var fiber = createFiber(HostContainer, null);
  return fiber;
};

exports.createFiberFromElement = function (element, priorityLevel) {
  // $FlowFixMe: ReactElement.key is currently defined as ?string but should be defined as null | string in Flow.
  var fiber = createFiberFromElementType(element.type, element.key);
  fiber.pendingProps = element.props;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

function createFiberFromElementType(type, key) {
  var fiber = void 0;
  if (typeof type === 'function') {
    fiber = shouldConstruct(type) ? createFiber(ClassComponent, key) : createFiber(IndeterminateComponent, key);
    fiber.type = type;
  } else if (typeof type === 'string') {
    fiber = createFiber(HostComponent, key);
    fiber.type = type;
  } else if (typeof type === 'object' && type !== null) {
    // Currently assumed to be a continuation and therefore is a fiber already.
    fiber = type;
  } else {
    throw new Error('Unknown component type: ' + typeof type);
  }
  return fiber;
}

exports.createFiberFromElementType = createFiberFromElementType;

exports.createFiberFromCoroutine = function (coroutine, priorityLevel) {
  var fiber = createFiber(CoroutineComponent, coroutine.key);
  fiber.type = coroutine.handler;
  fiber.pendingProps = coroutine;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromYield = function (yieldNode, priorityLevel) {
  var fiber = createFiber(YieldComponent, yieldNode.key);
  fiber.pendingProps = {};
  return fiber;
};
},{"14":14,"16":16}],6:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberBeginWork
 * 
 */

'use strict';

var _require = _dereq_(1);

var reconcileChildFibers = _require.reconcileChildFibers;
var reconcileChildFibersInPlace = _require.reconcileChildFibersInPlace;
var cloneChildFibers = _require.cloneChildFibers;

var _require2 = _dereq_(14);

var LowPriority = _require2.LowPriority;

var ReactTypeOfWork = _dereq_(16);
var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent;
var FunctionalComponent = ReactTypeOfWork.FunctionalComponent;
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;
var CoroutineComponent = ReactTypeOfWork.CoroutineComponent;
var CoroutineHandlerPhase = ReactTypeOfWork.CoroutineHandlerPhase;
var YieldComponent = ReactTypeOfWork.YieldComponent;

var _require3 = _dereq_(14);

var NoWork = _require3.NoWork;
var OffscreenPriority = _require3.OffscreenPriority;

var _require4 = _dereq_(12);

var createUpdateQueue = _require4.createUpdateQueue;
var addToQueue = _require4.addToQueue;
var addCallbackToQueue = _require4.addCallbackToQueue;
var mergeUpdateQueue = _require4.mergeUpdateQueue;

var ReactInstanceMap = _dereq_(13);

module.exports = function (config, getScheduler) {

  function markChildAsProgressed(current, workInProgress, priorityLevel) {
    // We now have clones. Let's store them as the currently progressed work.
    workInProgress.progressedChild = workInProgress.child;
    workInProgress.progressedPriority = priorityLevel;
    if (current) {
      // We also store it on the current. When the alternate swaps in we can
      // continue from this point.
      current.progressedChild = workInProgress.progressedChild;
      current.progressedPriority = workInProgress.progressedPriority;
    }
  }

  function reconcileChildren(current, workInProgress, nextChildren) {
    var priorityLevel = workInProgress.pendingWorkPriority;
    reconcileChildrenAtPriority(current, workInProgress, nextChildren, priorityLevel);
  }

  function reconcileChildrenAtPriority(current, workInProgress, nextChildren, priorityLevel) {
    // At this point any memoization is no longer valid since we'll have changed
    // the children.
    workInProgress.memoizedProps = null;
    if (current && current.child === workInProgress.child) {
      // If the current child is the same as the work in progress, it means that
      // we haven't yet started any work on these children. Therefore, we use
      // the clone algorithm to create a copy of all the current children.
      workInProgress.child = reconcileChildFibers(workInProgress, workInProgress.child, nextChildren, priorityLevel);
    } else {
      // If, on the other hand, we don't have a current fiber or if it is
      // already using a clone, that means we've already begun some work on this
      // tree and we can continue where we left off by reconciling against the
      // existing children.
      workInProgress.child = reconcileChildFibersInPlace(workInProgress, workInProgress.child, nextChildren, priorityLevel);
    }
    markChildAsProgressed(current, workInProgress, priorityLevel);
  }

  function updateFunctionalComponent(current, workInProgress) {
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;

    // TODO: Disable this before release, since it is not part of the public API
    // I use this for testing to compare the relative overhead of classes.
    if (typeof fn.shouldComponentUpdate === 'function') {
      if (workInProgress.memoizedProps !== null) {
        if (!fn.shouldComponentUpdate(workInProgress.memoizedProps, props)) {
          return bailoutOnAlreadyFinishedWork(current, workInProgress);
        }
      }
    }

    var nextChildren = fn(props);
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
  }

  function scheduleUpdate(fiber, updateQueue, priorityLevel) {
    var _getScheduler = getScheduler();

    var scheduleDeferredWork = _getScheduler.scheduleDeferredWork;

    fiber.updateQueue = updateQueue;
    // Schedule update on the alternate as well, since we don't know which tree
    // is current.
    if (fiber.alternate) {
      fiber.alternate.updateQueue = updateQueue;
    }
    while (true) {
      if (fiber.pendingWorkPriority === NoWork || fiber.pendingWorkPriority >= priorityLevel) {
        fiber.pendingWorkPriority = priorityLevel;
      }
      if (fiber.alternate) {
        if (fiber.alternate.pendingWorkPriority === NoWork || fiber.alternate.pendingWorkPriority >= priorityLevel) {
          fiber.alternate.pendingWorkPriority = priorityLevel;
        }
      }
      // Duck type root
      if (fiber.stateNode && fiber.stateNode.containerInfo) {
        var root = fiber.stateNode;
        scheduleDeferredWork(root, priorityLevel);
        return;
      }
      if (!fiber['return']) {
        throw new Error('No root!');
      }
      fiber = fiber['return'];
    }
  }

  // Class component state updater
  var updater = {
    enqueueSetState: function (instance, partialState) {
      var fiber = ReactInstanceMap.get(instance);
      var updateQueue = fiber.updateQueue ? addToQueue(fiber.updateQueue, partialState) : createUpdateQueue(partialState);
      scheduleUpdate(fiber, updateQueue, LowPriority);
    },
    enqueueReplaceState: function (instance, state) {
      var fiber = ReactInstanceMap.get(instance);
      var updateQueue = createUpdateQueue(state);
      updateQueue.isReplace = true;
      scheduleUpdate(fiber, updateQueue, LowPriority);
    },
    enqueueForceUpdate: function (instance) {
      var fiber = ReactInstanceMap.get(instance);
      var updateQueue = fiber.updateQueue || createUpdateQueue(null);
      updateQueue.isForced = true;
      scheduleUpdate(fiber, updateQueue, LowPriority);
    },
    enqueueCallback: function (instance, callback) {
      var fiber = ReactInstanceMap.get(instance);
      var updateQueue = fiber.updateQueue ? fiber.updateQueue : createUpdateQueue(null);
      addCallbackToQueue(updateQueue, callback);
      fiber.updateQueue = updateQueue;
      if (fiber.alternate) {
        fiber.alternate.updateQueue = updateQueue;
      }
    }
  };

  function updateClassComponent(current, workInProgress) {
    // A class component update is the result of either new props or new state.
    // Account for the possibly of missing pending props by falling back to the
    // memoized props.
    var props = workInProgress.pendingProps;
    if (!props && current) {
      props = current.memoizedProps;
    }
    // Compute the state using the memoized state and the update queue.
    var updateQueue = workInProgress.updateQueue;
    var previousState = current ? current.memoizedState : null;
    var state = updateQueue ? mergeUpdateQueue(updateQueue, previousState, props) : previousState;

    var instance = workInProgress.stateNode;
    if (!instance) {
      var ctor = workInProgress.type;
      workInProgress.stateNode = instance = new ctor(props);
      state = instance.state || null;
      // The initial state must be added to the update queue in case
      // setState is called before the initial render.
      if (state !== null) {
        workInProgress.updateQueue = createUpdateQueue(state);
      }
      // The instance needs access to the fiber so that it can schedule updates
      ReactInstanceMap.set(instance, workInProgress);
      instance.updater = updater;
    } else if (typeof instance.shouldComponentUpdate === 'function' && !(updateQueue && updateQueue.isForced)) {
      if (workInProgress.memoizedProps !== null) {
        // Reset the props, in case this is a ping-pong case rather than a
        // completed update case. For the completed update case, the instance
        // props will already be the memoizedProps.
        instance.props = workInProgress.memoizedProps;
        instance.state = workInProgress.memoizedState;
        if (!instance.shouldComponentUpdate(props, state)) {
          return bailoutOnAlreadyFinishedWork(current, workInProgress);
        }
      }
    }

    instance.props = props;
    instance.state = state;
    var nextChildren = instance.render();
    reconcileChildren(current, workInProgress, nextChildren);

    return workInProgress.child;
  }

  function updateHostComponent(current, workInProgress) {
    var nextChildren = workInProgress.pendingProps.children;
    if (workInProgress.pendingProps.hidden && workInProgress.pendingWorkPriority !== OffscreenPriority) {
      // If this host component is hidden, we can bail out on the children.
      // We'll rerender the children later at the lower priority.

      // It is unfortunate that we have to do the reconciliation of these
      // children already since that will add them to the tree even though
      // they are not actually done yet. If this is a large set it is also
      // confusing that this takes time to do right now instead of later.

      if (workInProgress.progressedPriority === OffscreenPriority) {
        // If we already made some progress on the offscreen priority before,
        // then we should continue from where we left off.
        workInProgress.child = workInProgress.progressedChild;
      }

      // Reconcile the children and stash them for later work.
      reconcileChildrenAtPriority(current, workInProgress, nextChildren, OffscreenPriority);
      workInProgress.child = current ? current.child : null;
      // Abort and don't process children yet.
      return null;
    } else {
      reconcileChildren(current, workInProgress, nextChildren);
      return workInProgress.child;
    }
  }

  function mountIndeterminateComponent(current, workInProgress) {
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    var value = fn(props);
    if (typeof value === 'object' && value && typeof value.render === 'function') {
      // Proceed under the assumption that this is a class instance
      workInProgress.tag = ClassComponent;
      if (current) {
        current.tag = ClassComponent;
      }
      value = value.render();
    } else {
      // Proceed under the assumption that this is a functional component
      workInProgress.tag = FunctionalComponent;
      if (current) {
        current.tag = FunctionalComponent;
      }
    }
    reconcileChildren(current, workInProgress, value);
    return workInProgress.child;
  }

  function updateCoroutineComponent(current, workInProgress) {
    var coroutine = workInProgress.pendingProps;
    if (!coroutine) {
      throw new Error('Should be resolved by now');
    }
    reconcileChildren(current, workInProgress, coroutine.children);
  }

  /*
  function reuseChildrenEffects(returnFiber : Fiber, firstChild : Fiber) {
    let child = firstChild;
    do {
      // Ensure that the first and last effect of the parent corresponds
      // to the children's first and last effect.
      if (!returnFiber.firstEffect) {
        returnFiber.firstEffect = child.firstEffect;
      }
      if (child.lastEffect) {
        if (returnFiber.lastEffect) {
          returnFiber.lastEffect.nextEffect = child.firstEffect;
        }
        returnFiber.lastEffect = child.lastEffect;
      }
    } while (child = child.sibling);
  }
  */

  function bailoutOnAlreadyFinishedWork(current, workInProgress) {
    var priorityLevel = workInProgress.pendingWorkPriority;

    // TODO: We should ideally be able to bail out early if the children have no
    // more work to do. However, since we don't have a separation of this
    // Fiber's priority and its children yet - we don't know without doing lots
    // of the same work we do anyway. Once we have that separation we can just
    // bail out here if the children has no more work at this priority level.
    // if (workInProgress.priorityOfChildren <= priorityLevel) {
    //   // If there are side-effects in these children that have not yet been
    //   // committed we need to ensure that they get properly transferred up.
    //   if (current && current.child !== workInProgress.child) {
    //     reuseChildrenEffects(workInProgress, child);
    //   }
    //   return null;
    // }

    cloneChildFibers(current, workInProgress);
    markChildAsProgressed(current, workInProgress, priorityLevel);
    return workInProgress.child;
  }

  function bailoutOnLowPriority(current, workInProgress) {
    if (current) {
      workInProgress.child = current.child;
      workInProgress.memoizedProps = current.memoizedProps;
      workInProgress.output = current.output;
    }
    return null;
  }

  function beginWork(current, workInProgress, priorityLevel) {
    if (workInProgress.pendingWorkPriority === NoWork || workInProgress.pendingWorkPriority > priorityLevel) {
      return bailoutOnLowPriority(current, workInProgress);
    }

    if (workInProgress.progressedPriority === priorityLevel) {
      // If we have progressed work on this priority level already, we can
      // proceed this that as the child.
      workInProgress.child = workInProgress.progressedChild;
    }

    if ((workInProgress.pendingProps === null || workInProgress.memoizedProps !== null && workInProgress.pendingProps === workInProgress.memoizedProps) && workInProgress.updateQueue === null) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    switch (workInProgress.tag) {
      case IndeterminateComponent:
        return mountIndeterminateComponent(current, workInProgress);
      case FunctionalComponent:
        return updateFunctionalComponent(current, workInProgress);
      case ClassComponent:
        return updateClassComponent(current, workInProgress);
      case HostContainer:
        reconcileChildren(current, workInProgress, workInProgress.pendingProps);
        // A yield component is just a placeholder, we can just run through the
        // next one immediately.
        if (workInProgress.child) {
          return beginWork(workInProgress.child.alternate, workInProgress.child, priorityLevel);
        }
        return null;
      case HostComponent:
        if (workInProgress.stateNode && config.beginUpdate) {
          config.beginUpdate(workInProgress.stateNode);
        }
        return updateHostComponent(current, workInProgress);
      case CoroutineHandlerPhase:
        // This is a restart. Reset the tag to the initial phase.
        workInProgress.tag = CoroutineComponent;
      // Intentionally fall through since this is now the same.
      case CoroutineComponent:
        updateCoroutineComponent(current, workInProgress);
        // This doesn't take arbitrary time so we could synchronously just begin
        // eagerly do the work of workInProgress.child as an optimization.
        if (workInProgress.child) {
          return beginWork(workInProgress.child.alternate, workInProgress.child, priorityLevel);
        }
        return workInProgress.child;
      case YieldComponent:
        // A yield component is just a placeholder, we can just run through the
        // next one immediately.
        if (workInProgress.sibling) {
          return beginWork(workInProgress.sibling.alternate, workInProgress.sibling, priorityLevel);
        }
        return null;
      default:
        throw new Error('Unknown unit of work tag');
    }
  }

  return {
    beginWork: beginWork
  };
};
},{"1":1,"12":12,"13":13,"14":14,"16":16}],7:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberCommitWork
 * 
 */

'use strict';

var ReactTypeOfWork = _dereq_(16);
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;

var _require = _dereq_(12);

var callCallbacks = _require.callCallbacks;


module.exports = function (config) {

  var updateContainer = config.updateContainer;
  var commitUpdate = config.commitUpdate;

  function commitWork(current, finishedWork) {
    switch (finishedWork.tag) {
      case ClassComponent:
        {
          // Clear updates from current fiber. This must go before the callbacks
          // are reset, in case an update is triggered from inside a callback. Is
          // this safe? Relies on the assumption that work is only committed if
          // the update queue is empty.
          if (finishedWork.alternate) {
            finishedWork.alternate.updateQueue = null;
          }
          if (finishedWork.callbackList) {
            var callbackList = finishedWork.callbackList;

            finishedWork.callbackList = null;
            callCallbacks(callbackList, finishedWork.stateNode);
          }
          // TODO: Fire componentDidMount/componentDidUpdate, update refs
          return;
        }
      case HostContainer:
        {
          // TODO: Attach children to root container.
          var children = finishedWork.output;
          var root = finishedWork.stateNode;
          var containerInfo = root.containerInfo;
          updateContainer(containerInfo, children);
          return;
        }
      case HostComponent:
        {
          if (finishedWork.stateNode == null || !current) {
            throw new Error('This should only be done during updates.');
          }
          // Commit the work prepared earlier.
          var child = finishedWork.child;
          var _children = child && !child.sibling ? child.output : child;
          var newProps = finishedWork.memoizedProps;
          var oldProps = current.memoizedProps;
          var instance = finishedWork.stateNode;
          commitUpdate(instance, oldProps, newProps, _children);
          return;
        }
      default:
        throw new Error('This unit of work tag should not have side-effects.');
    }
  }

  return {
    commitWork: commitWork
  };
};
},{"12":12,"16":16}],8:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberCompleteWork
 * 
 */

'use strict';

var _require = _dereq_(1);

var reconcileChildFibers = _require.reconcileChildFibers;

var ReactTypeOfWork = _dereq_(16);
var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent;
var FunctionalComponent = ReactTypeOfWork.FunctionalComponent;
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;
var CoroutineComponent = ReactTypeOfWork.CoroutineComponent;
var CoroutineHandlerPhase = ReactTypeOfWork.CoroutineHandlerPhase;
var YieldComponent = ReactTypeOfWork.YieldComponent;


module.exports = function (config) {

  var createInstance = config.createInstance;
  var prepareUpdate = config.prepareUpdate;

  function markForPreEffect(workInProgress) {
    // Schedule a side-effect on this fiber, BEFORE the children's side-effects.
    if (workInProgress.firstEffect) {
      workInProgress.nextEffect = workInProgress.firstEffect;
      workInProgress.firstEffect = workInProgress;
    } else {
      workInProgress.firstEffect = workInProgress;
      workInProgress.lastEffect = workInProgress;
    }
  }

  // TODO: It's possible this will create layout thrash issues because mutations
  // of the DOM and life-cycles are interleaved. E.g. if a componentDidMount
  // of a sibling reads, then the next sibling updates and reads etc.
  function markForPostEffect(workInProgress) {
    // Schedule a side-effect on this fiber, AFTER the children's side-effects.
    if (workInProgress.lastEffect) {
      workInProgress.lastEffect.nextEffect = workInProgress;
    } else {
      workInProgress.firstEffect = workInProgress;
    }
    workInProgress.lastEffect = workInProgress;
  }

  function transferOutput(child, returnFiber) {
    // If we have a single result, we just pass that through as the output to
    // avoid unnecessary traversal. When we have multiple output, we just pass
    // the linked list of fibers that has the individual output values.
    returnFiber.output = child && !child.sibling ? child.output : child;
    returnFiber.memoizedProps = returnFiber.pendingProps;
  }

  function recursivelyFillYields(yields, output) {
    if (!output) {
      // Ignore nulls etc.
    } else if (output.tag !== undefined) {
      // TODO: Fix this fragile duck test.
      // Detect if this is a fiber, if so it is a fragment result.
      // $FlowFixMe: Refinement issue.
      var item = output;
      do {
        recursivelyFillYields(yields, item.output);
        item = item.sibling;
      } while (item);
    } else {
      // $FlowFixMe: Refinement issue. If it is not a Fiber or null, it is a yield
      yields.push(output);
    }
  }

  function moveCoroutineToHandlerPhase(current, workInProgress) {
    var coroutine = workInProgress.pendingProps;
    if (!coroutine) {
      throw new Error('Should be resolved by now');
    }

    // First step of the coroutine has completed. Now we need to do the second.
    // TODO: It would be nice to have a multi stage coroutine represented by a
    // single component, or at least tail call optimize nested ones. Currently
    // that requires additional fields that we don't want to add to the fiber.
    // So this requires nested handlers.
    // Note: This doesn't mutate the alternate node. I don't think it needs to
    // since this stage is reset for every pass.
    workInProgress.tag = CoroutineHandlerPhase;

    // Build up the yields.
    // TODO: Compare this to a generator or opaque helpers like Children.
    var yields = [];
    var child = workInProgress.child;
    while (child) {
      recursivelyFillYields(yields, child.output);
      child = child.sibling;
    }
    var fn = coroutine.handler;
    var props = coroutine.props;
    var nextChildren = fn(props, yields);

    var currentFirstChild = current ? current.stateNode : null;
    // Inherit the priority of the returnFiber.
    var priority = workInProgress.pendingWorkPriority;
    workInProgress.stateNode = reconcileChildFibers(workInProgress, currentFirstChild, nextChildren, priority);
    return workInProgress.stateNode;
  }

  function completeWork(current, workInProgress) {
    switch (workInProgress.tag) {
      case FunctionalComponent:
        transferOutput(workInProgress.child, workInProgress);
        return null;
      case ClassComponent:
        transferOutput(workInProgress.child, workInProgress);
        // Don't use the state queue to compute the memoized state. We already
        // merged it and assigned it to the instance. Transfer it from there.
        // Also need to transfer the props, because pendingProps will be null
        // in the case of an update
        var _workInProgress$state = workInProgress.stateNode;
        var state = _workInProgress$state.state;
        var props = _workInProgress$state.props;

        workInProgress.memoizedState = state;
        workInProgress.memoizedProps = props;
        // Transfer update queue to callbackList field so callbacks can be
        // called during commit phase.
        workInProgress.callbackList = workInProgress.updateQueue;
        markForPostEffect(workInProgress);
        return null;
      case HostContainer:
        transferOutput(workInProgress.child, workInProgress);
        // We don't know if a container has updated any children so we always
        // need to update it right now. We schedule this side-effect before
        // all the other side-effects in the subtree. We need to schedule it
        // before so that the entire tree is up-to-date before the life-cycles
        // are invoked.
        markForPreEffect(workInProgress);
        return null;
      case HostComponent:
        var newProps = workInProgress.pendingProps;
        var child = workInProgress.child;
        var children = child && !child.sibling ? child.output : child;
        if (current && workInProgress.stateNode != null) {
          // If we have an alternate, that means this is an update and we need to
          // schedule a side-effect to do the updates.
          var oldProps = current.memoizedProps;
          // If we get updated because one of our children updated, we don't
          // have newProps so we'll have to reuse them.
          // TODO: Split the update API as separate for the props vs. children.
          // Even better would be if children weren't special cased at all tho.
          if (!newProps) {
            newProps = oldProps;
          }
          var instance = workInProgress.stateNode;
          if (prepareUpdate(instance, oldProps, newProps, children)) {
            // This returns true if there was something to update.
            markForPreEffect(workInProgress);
          }
          // TODO: Is this actually ever going to change? Why set it every time?
          workInProgress.output = instance;
        } else {
          if (!newProps) {
            if (workInProgress.stateNode === null) {
              throw new Error('We must have new props for new mounts.');
            } else {
              // This can happen when we abort work.
              return null;
            }
          }
          var _instance = createInstance(workInProgress.type, newProps, children);
          // TODO: This seems like unnecessary duplication.
          workInProgress.stateNode = _instance;
          workInProgress.output = _instance;
        }
        workInProgress.memoizedProps = newProps;
        return null;
      case CoroutineComponent:
        return moveCoroutineToHandlerPhase(current, workInProgress);
      case CoroutineHandlerPhase:
        transferOutput(workInProgress.stateNode, workInProgress);
        // Reset the tag to now be a first phase coroutine.
        workInProgress.tag = CoroutineComponent;
        return null;
      case YieldComponent:
        // Does nothing.
        return null;

      // Error cases
      case IndeterminateComponent:
        throw new Error('An indeterminate component should have become determinate before completing.');
      default:
        throw new Error('Unknown unit of work tag');
    }
  }

  return {
    completeWork: completeWork
  };
};
},{"1":1,"16":16}],9:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberReconciler
 * 
 */

'use strict';

var _require = _dereq_(10);

var createFiberRoot = _require.createFiberRoot;

var ReactFiberScheduler = _dereq_(11);

module.exports = function (config) {
  var _ReactFiberScheduler = ReactFiberScheduler(config);

  var scheduleWork = _ReactFiberScheduler.scheduleWork;
  var performWithPriority = _ReactFiberScheduler.performWithPriority;


  return {
    mountContainer: function (element, containerInfo) {
      var root = createFiberRoot(containerInfo);
      var container = root.current;
      // TODO: Use pending work/state instead of props.
      // TODO: This should not override the pendingWorkPriority if there is
      // higher priority work in the subtree.
      container.pendingProps = element;

      scheduleWork(root);

      // It may seem strange that we don't return the root here, but that will
      // allow us to have containers that are in the middle of the tree instead
      // of being roots.
      return container;
    },
    updateContainer: function (element, container) {
      // TODO: If this is a nested container, this won't be the root.
      var root = container.stateNode;
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = element;

      scheduleWork(root);
    },
    unmountContainer: function (container) {
      // TODO: If this is a nested container, this won't be the root.
      var root = container.stateNode;
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = [];

      scheduleWork(root);
    },


    performWithPriority: performWithPriority,

    getPublicRootInstance: function (container) {
      return null;
    }
  };
};
},{"10":10,"11":11}],10:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberRoot
 * 
 */

'use strict';

var _require = _dereq_(5);

var createHostContainerFiber = _require.createHostContainerFiber;


exports.createFiberRoot = function (containerInfo) {
  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  var uninitializedFiber = createHostContainerFiber();
  var root = {
    current: uninitializedFiber,
    containerInfo: containerInfo,
    isScheduled: false,
    nextScheduledRoot: null
  };
  uninitializedFiber.stateNode = root;
  return root;
};
},{"5":5}],11:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberScheduler
 * 
 */

'use strict';

var ReactFiberBeginWork = _dereq_(6);
var ReactFiberCompleteWork = _dereq_(8);
var ReactFiberCommitWork = _dereq_(7);

var _require = _dereq_(5);

var cloneFiber = _require.cloneFiber;

var _require2 = _dereq_(14);

var NoWork = _require2.NoWork;
var LowPriority = _require2.LowPriority;
var AnimationPriority = _require2.AnimationPriority;
var SynchronousPriority = _require2.SynchronousPriority;


var timeHeuristicForUnitOfWork = 1;

module.exports = function (config) {
  // Use a closure to circumvent the circular dependency between the scheduler
  // and ReactFiberBeginWork. Don't know if there's a better way to do this.
  var scheduler = void 0;
  function getScheduler() {
    return scheduler;
  }

  var _ReactFiberBeginWork = ReactFiberBeginWork(config, getScheduler);

  var beginWork = _ReactFiberBeginWork.beginWork;

  var _ReactFiberCompleteWo = ReactFiberCompleteWork(config);

  var completeWork = _ReactFiberCompleteWo.completeWork;

  var _ReactFiberCommitWork = ReactFiberCommitWork(config);

  var commitWork = _ReactFiberCommitWork.commitWork;


  var scheduleAnimationCallback = config.scheduleAnimationCallback;
  var scheduleDeferredCallback = config.scheduleDeferredCallback;

  // The default priority to use for updates.
  var defaultPriority = LowPriority;

  // The next work in progress fiber that we're currently working on.
  var nextUnitOfWork = null;
  var nextPriorityLevel = NoWork;

  // Linked list of roots with scheduled work on them.
  var nextScheduledRoot = null;
  var lastScheduledRoot = null;

  function findNextUnitOfWork() {
    // Clear out roots with no more work on them.
    while (nextScheduledRoot && nextScheduledRoot.current.pendingWorkPriority === NoWork) {
      nextScheduledRoot.isScheduled = false;
      if (nextScheduledRoot === lastScheduledRoot) {
        nextScheduledRoot = null;
        lastScheduledRoot = null;
        nextPriorityLevel = NoWork;
        return null;
      }
      nextScheduledRoot = nextScheduledRoot.nextScheduledRoot;
    }
    // TODO: This is scanning one root at a time. It should be scanning all
    // roots for high priority work before moving on to lower priorities.
    var root = nextScheduledRoot;
    var highestPriorityRoot = null;
    var highestPriorityLevel = NoWork;
    while (root) {
      if (highestPriorityLevel === NoWork || highestPriorityLevel > root.current.pendingWorkPriority) {
        highestPriorityLevel = root.current.pendingWorkPriority;
        highestPriorityRoot = root;
      }
      // We didn't find anything to do in this root, so let's try the next one.
      root = root.nextScheduledRoot;
    }
    if (highestPriorityRoot) {
      nextPriorityLevel = highestPriorityLevel;
      return cloneFiber(highestPriorityRoot.current, highestPriorityLevel);
    }

    nextPriorityLevel = NoWork;
    return null;
  }

  function commitAllWork(finishedWork) {
    // Commit all the side-effects within a tree.
    // TODO: Error handling.
    var effectfulFiber = finishedWork.firstEffect;
    while (effectfulFiber) {
      var current = effectfulFiber.alternate;
      commitWork(current, effectfulFiber);
      var next = effectfulFiber.nextEffect;
      // Ensure that we clean these up so that we don't accidentally keep them.
      // I'm not actually sure this matters because we can't reset firstEffect
      // and lastEffect since they're on every node, not just the effectful
      // ones. So we have to clean everything as we reuse nodes anyway.
      effectfulFiber.nextEffect = null;
      effectfulFiber = next;
    }
  }

  function resetWorkPriority(workInProgress) {
    var newPriority = NoWork;
    // progressedChild is going to be the child set with the highest priority.
    // Either it is the same as child, or it just bailed out because it choose
    // not to do the work.
    var child = workInProgress.progressedChild;
    while (child) {
      // Ensure that remaining work priority bubbles up.
      if (child.pendingWorkPriority !== NoWork && (newPriority === NoWork || newPriority > child.pendingWorkPriority)) {
        newPriority = child.pendingWorkPriority;
      }
      child = child.sibling;
    }
    workInProgress.pendingWorkPriority = newPriority;
  }

  function completeUnitOfWork(workInProgress) {
    while (true) {
      // The current, flushed, state of this fiber is the alternate.
      // Ideally nothing should rely on this, but relying on it here
      // means that we don't need an additional field on the work in
      // progress.
      var current = workInProgress.alternate;
      var next = completeWork(current, workInProgress);

      resetWorkPriority(workInProgress);

      // The work is now done. We don't need this anymore. This flags
      // to the system not to redo any work here.
      workInProgress.pendingProps = null;
      workInProgress.updateQueue = null;

      var returnFiber = workInProgress['return'];

      if (returnFiber) {
        // Ensure that the first and last effect of the parent corresponds
        // to the children's first and last effect. This probably relies on
        // children completing in order.
        if (!returnFiber.firstEffect) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }
        if (workInProgress.lastEffect) {
          if (returnFiber.lastEffect) {
            returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
          }
          returnFiber.lastEffect = workInProgress.lastEffect;
        }
      }

      if (next) {
        // If completing this work spawned new work, do that next.
        return next;
      } else if (workInProgress.sibling) {
        // If there is more work to do in this returnFiber, do that next.
        return workInProgress.sibling;
      } else if (returnFiber) {
        // If there's no more work in this returnFiber. Complete the returnFiber.
        workInProgress = returnFiber;
        continue;
      } else {
        // If we're at the root, there's no more work to do. We can flush it.
        var _root = workInProgress.stateNode;
        if (_root.current === workInProgress) {
          throw new Error('Cannot commit the same tree as before. This is probably a bug ' + 'related to the return field.');
        }
        _root.current = workInProgress;
        // TODO: We can be smarter here and only look for more work in the
        // "next" scheduled work since we've already scanned passed. That
        // also ensures that work scheduled during reconciliation gets deferred.
        // const hasMoreWork = workInProgress.pendingWorkPriority !== NoWork;
        commitAllWork(workInProgress);
        var nextWork = findNextUnitOfWork();
        // if (!nextWork && hasMoreWork) {
        // TODO: This can happen when some deep work completes and we don't
        // know if this was the last one. We should be able to keep track of
        // the highest priority still in the tree for one pass. But if we
        // terminate an update we don't know.
        // throw new Error('FiberRoots should not have flagged more work if there is none.');
        // }
        return nextWork;
      }
    }
  }

  function performUnitOfWork(workInProgress) {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    var current = workInProgress.alternate;
    var next = beginWork(current, workInProgress, nextPriorityLevel);

    if (next) {
      // If this spawns new work, do that next.
      return next;
    } else {
      // Otherwise, complete the current work.
      return completeUnitOfWork(workInProgress);
    }
  }

  function performDeferredWork(deadline) {
    if (!nextUnitOfWork) {
      nextUnitOfWork = findNextUnitOfWork();
    }
    while (nextUnitOfWork) {
      if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        if (!nextUnitOfWork) {
          // Find more work. We might have time to complete some more.
          nextUnitOfWork = findNextUnitOfWork();
        }
      } else {
        scheduleDeferredCallback(performDeferredWork);
        return;
      }
    }
  }

  function scheduleDeferredWork(root, priority) {
    // We must reset the current unit of work pointer so that we restart the
    // search from the root during the next tick, in case there is now higher
    // priority work somewhere earlier than before.
    if (priority <= nextPriorityLevel) {
      nextUnitOfWork = null;
    }

    // Set the priority on the root, without deprioritizing
    if (root.current.pendingWorkPriority === NoWork || priority <= root.current.pendingWorkPriority) {
      root.current.pendingWorkPriority = priority;
    }

    if (root.isScheduled) {
      // If we're already scheduled, we can bail out.
      return;
    }
    root.isScheduled = true;
    if (lastScheduledRoot) {
      // Schedule ourselves to the end.
      lastScheduledRoot.nextScheduledRoot = root;
      lastScheduledRoot = root;
    } else {
      // We're the only work scheduled.
      nextScheduledRoot = root;
      lastScheduledRoot = root;
      scheduleDeferredCallback(performDeferredWork);
    }
  }

  function performAnimationWork() {
    // Always start from the root
    nextUnitOfWork = findNextUnitOfWork();
    while (nextUnitOfWork && nextPriorityLevel !== NoWork) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      if (!nextUnitOfWork) {
        // Keep searching for animation work until there's no more left
        nextUnitOfWork = findNextUnitOfWork();
      }
      // Stop if the next unit of work is low priority
      if (nextPriorityLevel > AnimationPriority) {
        scheduleDeferredCallback(performDeferredWork);
        return;
      }
    }
  }

  function scheduleAnimationWork(root, priorityLevel) {
    // Set the priority on the root, without deprioritizing
    if (root.current.pendingWorkPriority === NoWork || priorityLevel <= root.current.pendingWorkPriority) {
      root.current.pendingWorkPriority = priorityLevel;
    }

    if (root.isScheduled) {
      // If we're already scheduled, we can bail out.
      return;
    }
    root.isScheduled = true;
    if (lastScheduledRoot) {
      // Schedule ourselves to the end.
      lastScheduledRoot.nextScheduledRoot = root;
      lastScheduledRoot = root;
    } else {
      // We're the only work scheduled.
      nextScheduledRoot = root;
      lastScheduledRoot = root;
      scheduleAnimationCallback(performAnimationWork);
    }
  }

  function scheduleWork(root) {
    if (defaultPriority === SynchronousPriority) {
      throw new Error('Not implemented yet');
    }

    if (defaultPriority === NoWork) {
      return;
    }
    if (defaultPriority > AnimationPriority) {
      scheduleDeferredWork(root, defaultPriority);
      return;
    }
    scheduleAnimationWork(root, defaultPriority);
  }

  function performWithPriority(priorityLevel, fn) {
    var previousDefaultPriority = defaultPriority;
    defaultPriority = priorityLevel;
    try {
      fn();
    } finally {
      defaultPriority = previousDefaultPriority;
    }
  }

  scheduler = {
    scheduleWork: scheduleWork,
    scheduleDeferredWork: scheduleDeferredWork,
    performWithPriority: performWithPriority
  };
  return scheduler;
};
},{"14":14,"5":5,"6":6,"7":7,"8":8}],12:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberUpdateQueue
 * 
 */

'use strict';

var _assign = _dereq_(19);

exports.createUpdateQueue = function (partialState) {
  var queue = {
    partialState: partialState,
    callback: null,
    callbackWasCalled: false,
    next: null,
    isReplace: false,
    isForced: false,
    tail: null
  };
  queue.tail = queue;
  return queue;
};

exports.addToQueue = function (queue, partialState) {
  var node = {
    partialState: partialState,
    callback: null,
    callbackWasCalled: false,
    next: null
  };
  queue.tail.next = node;
  queue.tail = node;
  return queue;
};

exports.addCallbackToQueue = function (queue, callback) {
  if (queue.tail.callback) {
    // If the tail already as a callback, add an empty node to queue
    exports.addToQueue(queue, null);
  }
  queue.tail.callback = callback;
  return queue;
};

exports.callCallbacks = function (queue, context) {
  var node = queue;
  while (node) {
    if (node.callback && !node.callbackWasCalled) {
      node.callbackWasCalled = true;
      node.callback.call(context);
    }
    node = node.next;
  }
};

exports.mergeUpdateQueue = function (queue, prevState, props) {
  var node = queue;
  var state = queue.isReplace ? null : _assign({}, prevState);
  while (node) {
    var _partialState = void 0;
    if (typeof node.partialState === 'function') {
      var updateFn = node.partialState;
      _partialState = updateFn(state, props);
    } else {
      _partialState = node.partialState;
    }
    state = _assign(state || {}, _partialState);
    node = node.next;
  }
  return state;
};
},{"19":19}],13:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactInstanceMap
 */

'use strict';

/**
 * `ReactInstanceMap` maintains a mapping from a public facing stateful
 * instance (key) and the internal representation (value). This allows public
 * methods to accept the user facing instance as an argument and map them back
 * to internal methods.
 */

// TODO: Replace this with ES6: var ReactInstanceMap = new Map();

var ReactInstanceMap = {

  /**
   * This API should be called `delete` but we'd have to make sure to always
   * transform these to strings for IE support. When this transform is fully
   * supported we can rename it.
   */
  remove: function (key) {
    key._reactInternalInstance = undefined;
  },

  get: function (key) {
    return key._reactInternalInstance;
  },

  has: function (key) {
    return key._reactInternalInstance !== undefined;
  },

  set: function (key, value) {
    key._reactInternalInstance = value;
  }

};

module.exports = ReactInstanceMap;
},{}],14:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPriorityLevel
 * 
 */

'use strict';

module.exports = {
  NoWork: 0, // No work is pending.
  SynchronousPriority: 1, // For controlled text inputs. Synchronous side-effects.
  AnimationPriority: 2, // Needs to complete before the next frame.
  HighPriority: 3, // Interaction that needs to complete pretty soon to feel responsive.
  LowPriority: 4, // Data fetching, or result from updating stores.
  OffscreenPriority: 5 };
},{}],15:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactReifiedYield
 * 
 */

'use strict';

var _require = _dereq_(5);

var createFiberFromElementType = _require.createFiberFromElementType;


exports.createReifiedYield = function (yieldNode) {
  var fiber = createFiberFromElementType(yieldNode.continuation, yieldNode.key);
  return {
    continuation: fiber,
    props: yieldNode.props
  };
};

exports.createUpdatedReifiedYield = function (previousYield, yieldNode) {
  return {
    continuation: previousYield.continuation,
    props: yieldNode.props
  };
};
},{"5":5}],16:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTypeOfWork
 * 
 */

'use strict';

module.exports = {
  IndeterminateComponent: 0, // Before we know whether it is functional or class
  FunctionalComponent: 1,
  ClassComponent: 2,
  HostContainer: 3, // Root of a host tree. Could be nested inside another node.
  HostComponent: 4,
  CoroutineComponent: 5,
  CoroutineHandlerPhase: 6,
  YieldComponent: 7
};
},{}],17:[function(_dereq_,module,exports){
"use strict";

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

function makeEmptyFunction(arg) {
  return function () {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
var emptyFunction = function emptyFunction() {};

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function () {
  return this;
};
emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

module.exports = emptyFunction;
},{}],18:[function(_dereq_,module,exports){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

var emptyFunction = _dereq_(17);

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if ("development" !== 'production') {
  (function () {
    var printWarning = function printWarning(format) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var argIndex = 0;
      var message = 'Warning: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      });
      if (typeof console !== 'undefined') {
        console.error(message);
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch (x) {}
    };

    warning = function warning(condition, format) {
      if (format === undefined) {
        throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
      }

      if (format.indexOf('Failed Composite propType: ') === 0) {
        return; // Ignore CompositeComponent proptype check.
      }

      if (!condition) {
        for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
          args[_key2 - 2] = arguments[_key2];
        }

        printWarning.apply(undefined, [format].concat(args));
      }
    };
  })();
}

module.exports = warning;
},{"17":17}],19:[function(_dereq_,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}]},{},[3])(3)
});
});
