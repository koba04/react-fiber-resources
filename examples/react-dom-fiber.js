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
 * 
 */

'use strict';

var REACT_ELEMENT_TYPE = _dereq_(5);

var _require = _dereq_(2);

var REACT_COROUTINE_TYPE = _require.REACT_COROUTINE_TYPE;
var REACT_YIELD_TYPE = _require.REACT_YIELD_TYPE;


var ReactFiber = _dereq_(6);
var ReactPriorityLevel = _dereq_(16);
var ReactReifiedYield = _dereq_(17);
var ReactTypeOfSideEffect = _dereq_(18);
var ReactTypeOfWork = _dereq_(19);

var getIteratorFn = _dereq_(20);

var cloneFiber = ReactFiber.cloneFiber;
var createFiberFromElement = ReactFiber.createFiberFromElement;
var createFiberFromFragment = ReactFiber.createFiberFromFragment;
var createFiberFromText = ReactFiber.createFiberFromText;
var createFiberFromCoroutine = ReactFiber.createFiberFromCoroutine;
var createFiberFromYield = ReactFiber.createFiberFromYield;
var createReifiedYield = ReactReifiedYield.createReifiedYield;
var createUpdatedReifiedYield = ReactReifiedYield.createUpdatedReifiedYield;


var isArray = Array.isArray;

var HostText = ReactTypeOfWork.HostText;
var CoroutineComponent = ReactTypeOfWork.CoroutineComponent;
var YieldComponent = ReactTypeOfWork.YieldComponent;
var Fragment = ReactTypeOfWork.Fragment;
var NoWork = ReactPriorityLevel.NoWork;
var Placement = ReactTypeOfSideEffect.Placement;
var Deletion = ReactTypeOfSideEffect.Deletion;

// This wrapper function exists because I expect to clone the code in each path
// to be able to optimize each path individually by branching early. This needs
// a compiler or we can do it manually. Helpers that don't need this branching
// live outside of this function.

function ChildReconciler(shouldClone, shouldTrackSideEffects) {

  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) {
      // Noop.
      return;
    }
    if (!shouldClone) {
      // When we're reconciling in place we have a work in progress copy. We
      // actually want the current copy. If there is no current copy, then we
      // don't need to track deletion side-effects.
      if (!childToDelete.alternate) {
        return;
      }
      childToDelete = childToDelete.alternate;
    }
    // Deletions are added in reversed order so we add it to the front.
    var last = returnFiber.progressedLastDeletion;
    if (last) {
      last.nextEffect = childToDelete;
      returnFiber.progressedLastDeletion = childToDelete;
    } else {
      returnFiber.progressedFirstDeletion = returnFiber.progressedLastDeletion = childToDelete;
    }
    childToDelete.nextEffect = null;
    childToDelete.effectTag = Deletion;
  }

  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) {
      // Noop.
      return null;
    }

    // TODO: For the shouldClone case, this could be micro-optimized a bit by
    // assuming that after the first child we've already added everything.
    var childToDelete = currentFirstChild;
    while (childToDelete) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }

  function mapRemainingChildren(returnFiber, currentFirstChild) {
    // Add the remaining children to a temporary map so that we can find them by
    // keys quickly. Implicit (null) keys get added to this set with their index
    var existingChildren = new Map();

    var existingChild = currentFirstChild;
    while (existingChild) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  function useFiber(fiber, priority) {
    // We currently set sibling to null and index to 0 here because it is easy
    // to forget to do before returning it. E.g. for the single child case.
    if (shouldClone) {
      var clone = cloneFiber(fiber, priority);
      clone.index = 0;
      clone.sibling = null;
      return clone;
    } else {
      // We override the pending priority even if it is higher, because if
      // we're reconciling at a lower priority that means that this was
      // down-prioritized.
      fiber.pendingWorkPriority = priority;
      fiber.effectTag = NoWork;
      fiber.index = 0;
      fiber.sibling = null;
      return fiber;
    }
  }

  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) {
      // Noop.
      return lastPlacedIndex;
    }
    var current = newFiber.alternate;
    if (current) {
      var oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        // This is a move.
        newFiber.effectTag = Placement;
        return lastPlacedIndex;
      } else {
        // This item can stay in place.
        return oldIndex;
      }
    } else {
      // This is an insertion.
      newFiber.effectTag = Placement;
      return lastPlacedIndex;
    }
  }

  function placeSingleChild(newFiber) {
    // This is simpler for the single child case. We only need to do a
    // placement for inserting new children.
    if (shouldTrackSideEffects && !newFiber.alternate) {
      newFiber.effectTag = Placement;
    }
    return newFiber;
  }

  function updateTextNode(returnFiber, current, textContent, priority) {
    if (current == null || current.tag !== HostText) {
      // Insert
      var created = createFiberFromText(textContent, priority);
      created['return'] = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(current, priority);
      existing.pendingProps = textContent;
      existing['return'] = returnFiber;
      return existing;
    }
  }

  function updateElement(returnFiber, current, element, priority) {
    if (current == null || current.type !== element.type) {
      // Insert
      var created = createFiberFromElement(element, priority);
      created.ref = element.ref;
      created['return'] = returnFiber;
      return created;
    } else {
      // Move based on index
      var existing = useFiber(current, priority);
      existing.ref = element.ref;
      existing.pendingProps = element.props;
      existing['return'] = returnFiber;
      return existing;
    }
  }

  function updateCoroutine(returnFiber, current, coroutine, priority) {
    // TODO: Should this also compare handler to determine whether to reuse?
    if (current == null || current.tag !== CoroutineComponent) {
      // Insert
      var created = createFiberFromCoroutine(coroutine, priority);
      created['return'] = returnFiber;
      return created;
    } else {
      // Move based on index
      var existing = useFiber(current, priority);
      existing.pendingProps = coroutine;
      existing['return'] = returnFiber;
      return existing;
    }
  }

  function updateYield(returnFiber, current, yieldNode, priority) {
    // TODO: Should this also compare continuation to determine whether to reuse?
    if (current == null || current.tag !== YieldComponent) {
      // Insert
      var reifiedYield = createReifiedYield(yieldNode);
      var created = createFiberFromYield(yieldNode, priority);
      created.output = reifiedYield;
      created['return'] = returnFiber;
      return created;
    } else {
      // Move based on index
      var existing = useFiber(current, priority);
      existing.output = createUpdatedReifiedYield(current.output, yieldNode);
      existing['return'] = returnFiber;
      return existing;
    }
  }

  function updateFragment(returnFiber, current, fragment, priority) {
    if (current == null || current.tag !== Fragment) {
      // Insert
      var created = createFiberFromFragment(fragment, priority);
      created['return'] = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(current, priority);
      existing.pendingProps = fragment;
      existing['return'] = returnFiber;
      return existing;
    }
  }

  function createChild(returnFiber, newChild, priority) {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes doesn't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      var created = createFiberFromText('' + newChild, priority);
      created['return'] = returnFiber;
      return created;
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          {
            var _created = createFiberFromElement(newChild, priority);
            _created.ref = newChild.ref;
            _created['return'] = returnFiber;
            return _created;
          }

        case REACT_COROUTINE_TYPE:
          {
            var _created2 = createFiberFromCoroutine(newChild, priority);
            _created2['return'] = returnFiber;
            return _created2;
          }

        case REACT_YIELD_TYPE:
          {
            var reifiedYield = createReifiedYield(newChild);
            var _created3 = createFiberFromYield(newChild, priority);
            _created3.output = reifiedYield;
            _created3['return'] = returnFiber;
            return _created3;
          }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        var _created4 = createFiberFromFragment(newChild, priority);
        _created4['return'] = returnFiber;
        return _created4;
      }
    }

    return null;
  }

  function updateSlot(returnFiber, oldFiber, newChild, priority) {
    // Update the fiber if the keys match, otherwise return null.

    var key = oldFiber ? oldFiber.key : null;

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes doesn't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      if (key !== null) {
        return null;
      }
      return updateTextNode(returnFiber, oldFiber, '' + newChild, priority);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          {
            if (newChild.key === key) {
              return updateElement(returnFiber, oldFiber, newChild, priority);
            } else {
              return null;
            }
          }

        case REACT_COROUTINE_TYPE:
          {
            if (newChild.key === key) {
              return updateCoroutine(returnFiber, oldFiber, newChild, priority);
            } else {
              return null;
            }
          }

        case REACT_YIELD_TYPE:
          {
            if (newChild.key === key) {
              return updateYield(returnFiber, oldFiber, newChild, priority);
            } else {
              return null;
            }
          }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        // Fragments doesn't have keys so if the previous key is implicit we can
        // update it.
        if (key !== null) {
          return null;
        }
        return updateFragment(returnFiber, oldFiber, newChild, priority);
      }
    }

    return null;
  }

  function updateFromMap(existingChildren, returnFiber, newIdx, newChild, priority) {

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes doesn't have keys, so we neither have to check the old nor
      // new node for the key. If both are text nodes, they match.
      var matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild, priority);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          {
            var _matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
            return updateElement(returnFiber, _matchedFiber, newChild, priority);
          }

        case REACT_COROUTINE_TYPE:
          {
            var _matchedFiber2 = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
            return updateCoroutine(returnFiber, _matchedFiber2, newChild, priority);
          }

        case REACT_YIELD_TYPE:
          {
            var _matchedFiber3 = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
            return updateYield(returnFiber, _matchedFiber3, newChild, priority);
          }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        var _matchedFiber4 = existingChildren.get(newIdx) || null;
        return updateFragment(returnFiber, _matchedFiber4, newChild, priority);
      }
    }

    return null;
  }

  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, priority) {

    // This algorithm can't optimize by searching from boths ends since we
    // don't have backpointers on fibers. I'm trying to see how far we can get
    // with that model. If it ends up not being worth the tradeoffs, we can
    // add it later.

    // Even with a two ended optimization, we'd want to optimize for the case
    // where there are few changes and brute force the comparison instead of
    // going for the Map. It'd like to explore hitting that path first in
    // forward-only mode and only go for the Map once we notice that we need
    // lots of look ahead. This doesn't handle reversal as well as two ended
    // search but that's unusual. Besides, for the two ended optimization to
    // work on Iterables, we'd need to copy the whole set.

    // In this first iteration, we'll just live with hitting the bad case
    var resultingFirstChild = null;
    var previousNewFiber = null;

    var oldFiber = currentFirstChild;
    var lastPlacedIndex = 0;
    var newIdx = 0;
    var nextOldFiber = null;
    for (; oldFiber && newIdx < newChildren.length; newIdx++) {
      if (oldFiber) {
        if (oldFiber.index > newIdx) {
          nextOldFiber = oldFiber;
          oldFiber = null;
        } else {
          nextOldFiber = oldFiber.sibling;
        }
      }
      var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], priority);
      if (!newFiber) {
        // TODO: This breaks on empty slots like null children. That's
        // unfortunate because it triggers the slow path all the time. We need
        // a better way to communicate whether this was a miss or null,
        // boolean, undefined, etc.
        break;
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (!previousNewFiber) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber;
      } else {
        // TODO: Defer siblings if we're not at the right index for this slot.
        // I.e. if we had null values before, then we want to defer this
        // for each null value. However, we also don't want to call updateSlot
        // with the previous one.
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIdx === newChildren.length) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (!oldFiber) {
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
      for (; newIdx < newChildren.length; newIdx++) {
        var _newFiber = createChild(returnFiber, newChildren[newIdx], priority);
        if (!_newFiber) {
          continue;
        }
        lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);
        if (!previousNewFiber) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = _newFiber;
        } else {
          previousNewFiber.sibling = _newFiber;
        }
        previousNewFiber = _newFiber;
      }
      return resultingFirstChild;
    }

    // Add all children to a key map for quick lookups.
    var existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    // Keep scanning and use the map to restore deleted items as moves.
    for (; newIdx < newChildren.length; newIdx++) {
      var _newFiber2 = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], priority);
      if (_newFiber2) {
        if (shouldTrackSideEffects) {
          if (_newFiber2.alternate) {
            // The new fiber is a work in progress, but if there exists a
            // current, that means that we reused the fiber. We need to delete
            // it from the child list so that we don't add it to the deletion
            // list.
            existingChildren['delete'](_newFiber2.key === null ? _newFiber2.index : _newFiber2.key);
          }
        }
        lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);
        if (!previousNewFiber) {
          resultingFirstChild = _newFiber2;
        } else {
          previousNewFiber.sibling = _newFiber2;
        }
        previousNewFiber = _newFiber2;
      }
    }

    if (shouldTrackSideEffects) {
      // Any existing children that weren't consumed above were deleted. We need
      // to add them to the deletion list.
      existingChildren.forEach(function (child) {
        return deleteChild(returnFiber, child);
      });
    }

    return resultingFirstChild;
  }

  function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildren, priority) {
    // TODO: Copy everything from reconcileChildrenArray but use the iterator
    // instead.
    return null;
  }

  function reconcileSingleTextNode(returnFiber, currentFirstChild, textContent, priority) {
    // There's no need to check for keys on text nodes since we don't have a
    // way to define them.
    if (currentFirstChild && currentFirstChild.tag === HostText) {
      // We already have an existing node so let's just update it and delete
      // the rest.
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
      var existing = useFiber(currentFirstChild, priority);
      existing.pendingProps = textContent;
      existing['return'] = returnFiber;
      return existing;
    }
    // The existing first child is not a text node so we need to create one
    // and delete the existing ones.
    deleteRemainingChildren(returnFiber, currentFirstChild);
    var created = createFiberFromText(textContent, priority);
    created['return'] = returnFiber;
    return created;
  }

  function reconcileSingleElement(returnFiber, currentFirstChild, element, priority) {
    var key = element.key;
    var child = currentFirstChild;
    while (child) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (child.type === element.type) {
          deleteRemainingChildren(returnFiber, child.sibling);
          var existing = useFiber(child, priority);
          existing.ref = element.ref;
          existing.pendingProps = element.props;
          existing['return'] = returnFiber;
          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    var created = createFiberFromElement(element, priority);
    created.ref = element.ref;
    created['return'] = returnFiber;
    return created;
  }

  function reconcileSingleCoroutine(returnFiber, currentFirstChild, coroutine, priority) {
    var key = coroutine.key;
    var child = currentFirstChild;
    while (child) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (child.tag === CoroutineComponent) {
          deleteRemainingChildren(returnFiber, child.sibling);
          var existing = useFiber(child, priority);
          existing.pendingProps = coroutine;
          existing['return'] = returnFiber;
          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    var created = createFiberFromCoroutine(coroutine, priority);
    created['return'] = returnFiber;
    return created;
  }

  function reconcileSingleYield(returnFiber, currentFirstChild, yieldNode, priority) {
    var key = yieldNode.key;
    var child = currentFirstChild;
    while (child) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (child.tag === YieldComponent) {
          deleteRemainingChildren(returnFiber, child.sibling);
          var existing = useFiber(child, priority);
          existing.output = createUpdatedReifiedYield(child.output, yieldNode);
          existing['return'] = returnFiber;
          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    var reifiedYield = createReifiedYield(yieldNode);
    var created = createFiberFromYield(yieldNode, priority);
    created.output = reifiedYield;
    created['return'] = returnFiber;
    return created;
  }

  // This API will tag the children with the side-effect of the reconciliation
  // itself. They will be added to the side-effect list as we pass through the
  // children and the parent.
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild, priority) {
    // This function is not recursive.
    // If the top level item is an array, we treat it as a set of children,
    // not as a fragment. Nested arrays on the other hand will be treated as
    // fragment nodes. Recursion happens at the normal flow.

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild, priority));
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, priority));

        case REACT_COROUTINE_TYPE:
          return placeSingleChild(reconcileSingleCoroutine(returnFiber, currentFirstChild, newChild, priority));

        case REACT_YIELD_TYPE:
          return placeSingleChild(reconcileSingleYield(returnFiber, currentFirstChild, newChild, priority));
      }

      if (isArray(newChild)) {
        return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, priority);
      }

      var iteratorFn = getIteratorFn(newChild);
      if (iteratorFn) {
        return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, priority);
      }
    }

    // Remaining cases are all treated as empty.
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }

  return reconcileChildFibers;
}

exports.reconcileChildFibers = ChildReconciler(true, true);

exports.reconcileChildFibersInPlace = ChildReconciler(false, true);

exports.mountChildFibersInPlace = ChildReconciler(false, false);

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

    newChild['return'] = workInProgress;
    while (currentChild.sibling) {
      currentChild = currentChild.sibling;
      newChild = newChild.sibling = cloneFiber(currentChild, currentChild.pendingWorkPriority);
      newChild['return'] = workInProgress;
    }
    newChild.sibling = null;
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
},{"16":16,"17":17,"18":18,"19":19,"2":2,"20":20,"5":5,"6":6}],2:[function(_dereq_,module,exports){
/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
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
 */

'use strict';

var ReactDOMFeatureFlags = {
  useCreateElement: true,
  useFiber: false
};

module.exports = ReactDOMFeatureFlags;
},{}],4:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var ReactFiberReconciler = _dereq_(11);
var ReactDOMFeatureFlags = _dereq_(3);

var warning = _dereq_(22);

function recursivelyAppendChildren(parent, child) {
  if (!child) {
    return;
  }
  /* $FlowFixMe: Element and Text should have this property. */
  if (child.nodeType === 1 || child.nodeType === 3) {
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
    // TODO: Containers should update similarly to other parents.
    container.innerHTML = '';
    recursivelyAppendChildren(container, children);
  },
  createInstance: function (type, props, children) {
    var domElement = document.createElement(type);
    recursivelyAppendChildren(domElement, children);
    if (typeof props.className !== 'undefined') {
      domElement.className = props.className;
    }
    if (typeof props.children === 'string') {
      domElement.textContent = props.children;
    } else if (typeof props.children === 'number') {
      domElement.textContent = props.children.toString();
    }
    return domElement;
  },
  prepareUpdate: function (domElement, oldProps, newProps) {
    return true;
  },
  commitUpdate: function (domElement, oldProps, newProps) {
    if (typeof newProps.className !== 'undefined') {
      domElement.className = newProps.className;
    }
    if (typeof newProps.children === 'string') {
      domElement.textContent = newProps.children;
    } else if (typeof newProps.children === 'number') {
      domElement.textContent = newProps.children.toString();
    }
  },
  createTextInstance: function (text) {
    return document.createTextNode(text);
  },
  commitTextUpdate: function (textInstance, oldText, newText) {
    textInstance.nodeValue = newText;
  },
  appendChild: function (parentInstance, child) {
    parentInstance.appendChild(child);
  },
  insertBefore: function (parentInstance, child, beforeChild) {
    parentInstance.insertBefore(child, beforeChild);
  },
  removeChild: function (parentInstance, child) {
    parentInstance.removeChild(child);
  },


  scheduleAnimationCallback: window.requestAnimationFrame,

  scheduleDeferredCallback: window.requestIdleCallback

});

var warned = false;

function warnAboutUnstableUse() {
  // Ignore this warning is the feature flag is turned on. E.g. for tests.
  "development" !== 'production' ? warning(warned || ReactDOMFeatureFlags.useFiber, 'You are using React DOM Fiber which is an experimental renderer. ' + 'It is likely to have bugs, breaking changes and is unsupported.') : void 0;
  warned = true;
}

var ReactDOM = {
  render: function (element, container) {
    warnAboutUnstableUse();
    var root = void 0;
    if (!container._reactRootContainer) {
      root = container._reactRootContainer = DOMRenderer.mountContainer(element, container);
    } else {
      DOMRenderer.updateContainer(element, root = container._reactRootContainer);
    }
    return DOMRenderer.getPublicRootInstance(root);
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
},{"11":11,"22":22,"3":3}],5:[function(_dereq_,module,exports){
/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

// The Symbol used to tag the ReactElement type. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.

var REACT_ELEMENT_TYPE = typeof Symbol === 'function' && Symbol['for'] && Symbol['for']('react.element') || 0xeac7;

module.exports = REACT_ELEMENT_TYPE;
},{}],6:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var ReactTypeOfWork = _dereq_(19);
var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent;
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;
var HostText = ReactTypeOfWork.HostText;
var CoroutineComponent = ReactTypeOfWork.CoroutineComponent;
var YieldComponent = ReactTypeOfWork.YieldComponent;
var Fragment = ReactTypeOfWork.Fragment;

var _require = _dereq_(16);

var NoWork = _require.NoWork;

var _require2 = _dereq_(18);

var NoEffect = _require2.NoEffect;

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
    index: 0,

    ref: null,

    pendingProps: null,
    memoizedProps: null,
    updateQueue: null,
    memoizedState: null,
    callbackList: null,
    output: null,

    effectTag: NoEffect,
    nextEffect: null,
    firstEffect: null,
    lastEffect: null,

    pendingWorkPriority: NoWork,
    progressedPriority: NoWork,
    progressedChild: null,
    progressedFirstDeletion: null,
    progressedLastDeletion: null,

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
    // If we clone, then we do so from the "current" state. The current state
    // can't have any side-effects that are still valid so we reset just to be
    // sure.
    alt.effectTag = NoEffect;
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
  alt.index = fiber.index; // This should always be overridden.
  alt.ref = fiber.ref;
  // pendingProps is here for symmetry but is unnecessary in practice for now.
  // TODO: Pass in the new pendingProps as an argument maybe?
  alt.pendingProps = fiber.pendingProps;
  alt.updateQueue = fiber.updateQueue;
  alt.callbackList = fiber.callbackList;
  alt.pendingWorkPriority = priorityLevel;

  alt.memoizedProps = fiber.memoizedProps;
  alt.memoizedState = fiber.memoizedState;
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

exports.createFiberFromFragment = function (elements, priorityLevel) {
  // TODO: Consider supporting keyed fragments. Technically, we accidentally
  // support that in the existing React.
  var fiber = createFiber(Fragment, null);
  fiber.pendingProps = elements;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromText = function (content, priorityLevel) {
  var fiber = createFiber(HostText, null);
  fiber.pendingProps = content;
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
    // TODO: The yield system is currently broken for updates in some cases.
    // The reified yield stores a fiber, but we don't know which fiber that is;
    // the current or a workInProgress? When the continuation gets rendered here
    // we don't know if we can reuse that fiber or if we need to clone it.
    // There is probably a clever way to restructure this.
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
},{"16":16,"18":18,"19":19}],7:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var _require = _dereq_(1);

var mountChildFibersInPlace = _require.mountChildFibersInPlace;
var reconcileChildFibers = _require.reconcileChildFibers;
var reconcileChildFibersInPlace = _require.reconcileChildFibersInPlace;
var cloneChildFibers = _require.cloneChildFibers;

var ReactTypeOfWork = _dereq_(19);
var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent;
var FunctionalComponent = ReactTypeOfWork.FunctionalComponent;
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;
var HostText = ReactTypeOfWork.HostText;
var CoroutineComponent = ReactTypeOfWork.CoroutineComponent;
var CoroutineHandlerPhase = ReactTypeOfWork.CoroutineHandlerPhase;
var YieldComponent = ReactTypeOfWork.YieldComponent;
var Fragment = ReactTypeOfWork.Fragment;

var _require2 = _dereq_(16);

var NoWork = _require2.NoWork;
var OffscreenPriority = _require2.OffscreenPriority;

var _require3 = _dereq_(18);

var Placement = _require3.Placement;

var ReactFiberClassComponent = _dereq_(8);

module.exports = function (config, scheduleUpdate) {
  var _ReactFiberClassCompo = ReactFiberClassComponent(scheduleUpdate);

  var adoptClassInstance = _ReactFiberClassCompo.adoptClassInstance;
  var constructClassInstance = _ReactFiberClassCompo.constructClassInstance;
  var mountClassInstance = _ReactFiberClassCompo.mountClassInstance;
  var resumeMountClassInstance = _ReactFiberClassCompo.resumeMountClassInstance;
  var updateClassInstance = _ReactFiberClassCompo.updateClassInstance;


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

  function clearDeletions(workInProgress) {
    workInProgress.progressedFirstDeletion = workInProgress.progressedLastDeletion = null;
  }

  function transferDeletions(workInProgress) {
    // Any deletions get added first into the effect list.
    workInProgress.firstEffect = workInProgress.progressedFirstDeletion;
    workInProgress.lastEffect = workInProgress.progressedLastDeletion;
  }

  function reconcileChildren(current, workInProgress, nextChildren) {
    var priorityLevel = workInProgress.pendingWorkPriority;
    reconcileChildrenAtPriority(current, workInProgress, nextChildren, priorityLevel);
  }

  function reconcileChildrenAtPriority(current, workInProgress, nextChildren, priorityLevel) {
    // At this point any memoization is no longer valid since we'll have changed
    // the children.
    workInProgress.memoizedProps = null;
    if (!current) {
      // If this is a fresh new component that hasn't been rendered yet, we
      // won't update its child set by applying minimal side-effects. Instead,
      // we will add them all to the child before it gets rendered. That means
      // we can optimize this reconciliation pass by not tracking side-effects.
      workInProgress.child = mountChildFibersInPlace(workInProgress, workInProgress.child, nextChildren, priorityLevel);
    } else if (current.child === workInProgress.child) {
      // If the current child is the same as the work in progress, it means that
      // we haven't yet started any work on these children. Therefore, we use
      // the clone algorithm to create a copy of all the current children.

      // If we had any progressed work already, that is invalid at this point so
      // let's throw it out.
      clearDeletions(workInProgress);

      workInProgress.child = reconcileChildFibers(workInProgress, workInProgress.child, nextChildren, priorityLevel);

      transferDeletions(workInProgress);
    } else {
      // If, on the other hand, it is already using a clone, that means we've
      // already begun some work on this tree and we can continue where we left
      // off by reconciling against the existing children.
      workInProgress.child = reconcileChildFibersInPlace(workInProgress, workInProgress.child, nextChildren, priorityLevel);

      transferDeletions(workInProgress);
    }
    markChildAsProgressed(current, workInProgress, priorityLevel);
  }

  function updateFragment(current, workInProgress) {
    var nextChildren = workInProgress.pendingProps;
    reconcileChildren(current, workInProgress, nextChildren);
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

  function updateClassComponent(current, workInProgress) {
    var shouldUpdate = void 0;
    if (!current) {
      if (!workInProgress.stateNode) {
        // In the initial pass we might need to construct the instance.
        constructClassInstance(workInProgress);
        mountClassInstance(workInProgress);
        shouldUpdate = true;
      } else {
        // In a resume, we'll already have an instance we can reuse.
        shouldUpdate = resumeMountClassInstance(workInProgress);
      }
    } else {
      shouldUpdate = updateClassInstance(current, workInProgress);
    }
    if (!shouldUpdate) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    // Rerender
    var instance = workInProgress.stateNode;
    var nextChildren = instance.render();
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
  }

  function updateHostComponent(current, workInProgress) {
    var nextChildren = workInProgress.pendingProps.children;
    if (typeof nextChildren === 'string' || typeof nextChildren === 'number') {
      // We special case a direct text child of a host node. This is a common
      // case. We won't handle it as a reified child. We will instead handle
      // this in the host environment that also have access to this prop. That
      // avoids allocating another HostText fiber and traversing it.
      nextChildren = null;
    }
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

      if (!current) {
        // If this doesn't have a current we won't track it for placement
        // effects. However, when we come back around to this we have already
        // inserted the parent which means that we'll infact need to make this a
        // placement.
        // TODO: There has to be a better solution to this problem.
        var child = workInProgress.progressedChild;
        while (child) {
          child.effectTag = Placement;
          child = child.sibling;
        }
      }

      // Abort and don't process children yet.
      return null;
    } else {
      reconcileChildren(current, workInProgress, nextChildren);
      return workInProgress.child;
    }
  }

  function mountIndeterminateComponent(current, workInProgress) {
    if (current) {
      throw new Error('An indeterminate component should never have mounted.');
    }
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    var value = fn(props);
    if (typeof value === 'object' && value && typeof value.render === 'function') {
      // Proceed under the assumption that this is a class instance
      workInProgress.tag = ClassComponent;
      adoptClassInstance(workInProgress, value);
      mountClassInstance(workInProgress);
      value = value.render();
    } else {
      // Proceed under the assumption that this is a functional component
      workInProgress.tag = FunctionalComponent;
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

    if (workInProgress.tag === HostComponent && workInProgress.memoizedProps.hidden && workInProgress.pendingWorkPriority !== OffscreenPriority) {
      // This subtree still has work, but it should be deprioritized so we need
      // to bail out and not do any work yet.
      // TODO: It would be better if this tree got its correct priority set
      // during scheduleUpdate instead because otherwise we'll start a higher
      // priority reconciliation first before we can get down here. However,
      // that is a bit tricky since workInProgress and current can have
      // different "hidden" settings.
      var child = workInProgress.progressedChild;
      while (child) {
        // To ensure that this subtree gets its priority reset, the children
        // need to be reset.
        child.pendingWorkPriority = OffscreenPriority;
        child = child.sibling;
      }
      return null;
    }

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

    if (current && workInProgress.child === current.child) {
      // If we had any progressed work already, that is invalid at this point so
      // let's throw it out.
      clearDeletions(workInProgress);
    }

    cloneChildFibers(current, workInProgress);
    markChildAsProgressed(current, workInProgress, priorityLevel);
    return workInProgress.child;
  }

  function bailoutOnLowPriority(current, workInProgress) {
    // TODO: What if this is currently in progress?
    // How can that happen? How is this not being cloned?
    return null;
  }

  function beginWork(current, workInProgress, priorityLevel) {
    if (workInProgress.pendingWorkPriority === NoWork || workInProgress.pendingWorkPriority > priorityLevel) {
      return bailoutOnLowPriority(current, workInProgress);
    }

    // If we don't bail out, we're going be recomputing our children so we need
    // to drop our effect list.
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

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
        return workInProgress.child;
      case HostComponent:
        if (workInProgress.stateNode && typeof config.beginUpdate === 'function') {
          config.beginUpdate(workInProgress.stateNode);
        }
        return updateHostComponent(current, workInProgress);
      case HostText:
        // Nothing to do here. This is terminal. We'll do the completion step
        // immediately after.
        return null;
      case CoroutineHandlerPhase:
        // This is a restart. Reset the tag to the initial phase.
        workInProgress.tag = CoroutineComponent;
      // Intentionally fall through since this is now the same.
      case CoroutineComponent:
        updateCoroutineComponent(current, workInProgress);
        // This doesn't take arbitrary time so we could synchronously just begin
        // eagerly do the work of workInProgress.child as an optimization.
        return workInProgress.child;
      case YieldComponent:
        // A yield component is just a placeholder, we can just run through the
        // next one immediately.
        return null;
      case Fragment:
        updateFragment(current, workInProgress);
        return workInProgress.child;
      default:
        throw new Error('Unknown unit of work tag');
    }
  }

  return {
    beginWork: beginWork
  };
};
},{"1":1,"16":16,"18":18,"19":19,"8":8}],8:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var _require = _dereq_(16);

var LowPriority = _require.LowPriority;

var _require2 = _dereq_(14);

var createUpdateQueue = _require2.createUpdateQueue;
var addToQueue = _require2.addToQueue;
var addCallbackToQueue = _require2.addCallbackToQueue;
var mergeUpdateQueue = _require2.mergeUpdateQueue;

var ReactInstanceMap = _dereq_(15);

module.exports = function (scheduleUpdate) {

  function scheduleUpdateQueue(fiber, updateQueue, priorityLevel) {
    fiber.updateQueue = updateQueue;
    // Schedule update on the alternate as well, since we don't know which tree
    // is current.
    if (fiber.alternate) {
      fiber.alternate.updateQueue = updateQueue;
    }
    scheduleUpdate(fiber, priorityLevel);
  }

  // Class component state updater
  var updater = {
    enqueueSetState: function (instance, partialState) {
      var fiber = ReactInstanceMap.get(instance);
      var updateQueue = fiber.updateQueue ? addToQueue(fiber.updateQueue, partialState) : createUpdateQueue(partialState);
      scheduleUpdateQueue(fiber, updateQueue, LowPriority);
    },
    enqueueReplaceState: function (instance, state) {
      var fiber = ReactInstanceMap.get(instance);
      var updateQueue = createUpdateQueue(state);
      updateQueue.isReplace = true;
      scheduleUpdateQueue(fiber, updateQueue, LowPriority);
    },
    enqueueForceUpdate: function (instance) {
      var fiber = ReactInstanceMap.get(instance);
      var updateQueue = fiber.updateQueue || createUpdateQueue(null);
      updateQueue.isForced = true;
      scheduleUpdateQueue(fiber, updateQueue, LowPriority);
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

  function adoptClassInstance(workInProgress, instance) {
    instance.updater = updater;
    workInProgress.stateNode = instance;
    // The instance needs access to the fiber so that it can schedule updates
    ReactInstanceMap.set(instance, workInProgress);
  }

  function constructClassInstance(workInProgress) {
    var ctor = workInProgress.type;
    var props = workInProgress.pendingProps;
    var instance = new ctor(props);
    adoptClassInstance(workInProgress, instance);
    return instance;
  }

  // Invokes the mount life-cycles on a previously never rendered instance.
  function mountClassInstance(workInProgress) {
    var instance = workInProgress.stateNode;

    var state = instance.state || null;

    var props = workInProgress.pendingProps;
    if (!props) {
      throw new Error('There must be pending props for an initial mount.');
    }

    instance.props = props;
    instance.state = state;

    if (typeof instance.componentWillMount === 'function') {
      instance.componentWillMount();
      // If we had additional state updates during this life-cycle, let's
      // process them now.
      var updateQueue = workInProgress.updateQueue;
      if (updateQueue) {
        instance.state = mergeUpdateQueue(updateQueue, state, props);
      }
    }
  }

  // Called on a preexisting class instance. Returns false if a resumed render
  // could be reused.
  function resumeMountClassInstance(workInProgress) {
    var instance = workInProgress.stateNode;
    var newState = workInProgress.memoizedState;
    var newProps = workInProgress.pendingProps;
    if (!newProps) {
      // If there isn't any new props, then we'll reuse the memoized props.
      // This could be from already completed work.
      newProps = workInProgress.memoizedProps;
      if (!newProps) {
        throw new Error('There should always be pending or memoized props.');
      }
    }

    // TODO: Should we deal with a setState that happened after the last
    // componentWillMount and before this componentWillMount? Probably
    // unsupported anyway.

    var updateQueue = workInProgress.updateQueue;

    // If this completed, we might be able to just reuse this instance.
    if (typeof instance.shouldComponentUpdate === 'function' && !(updateQueue && updateQueue.isForced) && workInProgress.memoizedProps !== null && !instance.shouldComponentUpdate(newProps, newState)) {
      return false;
    }

    // If we didn't bail out we need to construct a new instance. We don't
    // want to reuse one that failed to fully mount.
    var newInstance = constructClassInstance(workInProgress);
    newInstance.props = newProps;
    newInstance.state = newState = newInstance.state || null;

    if (typeof newInstance.componentWillMount === 'function') {
      newInstance.componentWillMount();
      // If we had additional state updates during this life-cycle, let's
      // process them now.
      var newUpdateQueue = workInProgress.updateQueue;
      if (newUpdateQueue) {
        newInstance.state = mergeUpdateQueue(newUpdateQueue, newState, newProps);
      }
    }
    return true;
  }

  // Invokes the update life-cycles and returns false if it shouldn't rerender.
  function updateClassInstance(current, workInProgress) {
    var instance = workInProgress.stateNode;

    var oldProps = workInProgress.memoizedProps || current.memoizedProps;
    var newProps = workInProgress.pendingProps;
    if (!newProps) {
      // If there aren't any new props, then we'll reuse the memoized props.
      // This could be from already completed work.
      newProps = oldProps;
      if (!newProps) {
        throw new Error('There should always be pending or memoized props.');
      }
    }

    // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.

    if (oldProps !== newProps) {
      if (typeof instance.componentWillReceiveProps === 'function') {
        instance.componentWillReceiveProps(newProps);
      }
    }

    // Compute the next state using the memoized state and the update queue.
    var updateQueue = workInProgress.updateQueue;
    var previousState = workInProgress.memoizedState;
    // TODO: Previous state can be null.
    var newState = void 0;
    if (updateQueue) {
      newState = mergeUpdateQueue(updateQueue, previousState, newProps);
    } else {
      newState = previousState;
    }

    if (typeof instance.shouldComponentUpdate === 'function' && !(updateQueue && updateQueue.isForced) && oldProps !== null && !instance.shouldComponentUpdate(newProps, newState)) {
      // TODO: Should this get the new props/state updated regardless?
      return false;
    }

    if (typeof instance.componentWillUpdate === 'function') {
      instance.componentWillUpdate(newProps, newState);
    }

    instance.props = newProps;
    instance.state = newState;
    return true;
  }

  return {
    adoptClassInstance: adoptClassInstance,
    constructClassInstance: constructClassInstance,
    mountClassInstance: mountClassInstance,
    resumeMountClassInstance: resumeMountClassInstance,
    updateClassInstance: updateClassInstance
  };
};
},{"14":14,"15":15,"16":16}],9:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var ReactTypeOfWork = _dereq_(19);
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;
var HostText = ReactTypeOfWork.HostText;

var _require = _dereq_(14);

var callCallbacks = _require.callCallbacks;

var _require2 = _dereq_(18);

var Placement = _require2.Placement;
var PlacementAndUpdate = _require2.PlacementAndUpdate;


module.exports = function (config) {

  var updateContainer = config.updateContainer;
  var commitUpdate = config.commitUpdate;
  var commitTextUpdate = config.commitTextUpdate;

  var appendChild = config.appendChild;
  var insertBefore = config.insertBefore;
  var removeChild = config.removeChild;

  function detachRef(current) {
    var ref = current.ref;
    if (ref) {
      ref(null);
    }
  }

  function detachRefIfNeeded(current, finishedWork) {
    if (current) {
      var currentRef = current.ref;
      if (currentRef && currentRef !== finishedWork.ref) {
        currentRef(null);
      }
    }
  }

  function attachRef(current, finishedWork, instance) {
    var ref = finishedWork.ref;
    if (ref && (!current || current.ref !== ref)) {
      ref(instance);
    }
  }

  function getHostParent(fiber) {
    var parent = fiber['return'];
    while (parent) {
      switch (parent.tag) {
        case HostComponent:
          return parent.stateNode;
        case HostContainer:
          // TODO: Currently we use the updateContainer feature to update these,
          // but we should be able to handle this case too.
          return null;
      }
      parent = parent['return'];
    }
    return null;
  }

  function getHostSibling(fiber) {
    // We're going to search forward into the tree until we find a sibling host
    // node. Unfortunately, if multiple insertions are done in a row we have to
    // search past them. This leads to exponential search for the next sibling.
    var node = fiber;
    siblings: while (true) {
      // If we didn't find anything, let's try the next sibling.
      while (!node.sibling) {
        if (!node['return'] || node['return'].tag === HostComponent) {
          // If we pop out of the root or hit the parent the fiber we are the
          // last sibling.
          return null;
        }
        node = node['return'];
      }
      node = node.sibling;
      while (node.tag !== HostComponent && node.tag !== HostText) {
        // If it is not host node and, we might have a host node inside it.
        // Try to search down until we find one.
        // TODO: For coroutines, this will have to search the stateNode.
        if (node.effectTag === Placement || node.effectTag === PlacementAndUpdate) {
          // If we don't have a child, try the siblings instead.
          continue siblings;
        }
        if (!node.child) {
          continue siblings;
        } else {
          node = node.child;
        }
      }
      // Check if this host node is stable or about to be placed.
      if (node.effectTag !== Placement && node.effectTag !== PlacementAndUpdate) {
        // Found it!
        return node.stateNode;
      }
    }
  }

  function commitInsertion(finishedWork) {
    // Recursively insert all host nodes into the parent.
    var parent = getHostParent(finishedWork);
    if (!parent) {
      return;
    }
    var before = getHostSibling(finishedWork);
    // We only have the top Fiber that was inserted but we need recurse down its
    // children to find all the terminal nodes.
    var node = finishedWork;
    while (true) {
      if (node.tag === HostComponent || node.tag === HostText) {
        if (before) {
          insertBefore(parent, node.stateNode, before);
        } else {
          appendChild(parent, node.stateNode);
        }
      } else if (node.child) {
        // TODO: Coroutines need to visit the stateNode.
        node = node.child;
        continue;
      }
      if (node === finishedWork) {
        return;
      }
      while (!node.sibling) {
        if (!node['return'] || node['return'] === finishedWork) {
          return;
        }
        node = node['return'];
      }
      node = node.sibling;
    }
  }

  function commitNestedUnmounts(root) {
    // While we're inside a removed host node we don't want to call
    // removeChild on the inner nodes because they're removed by the top
    // call anyway. We also want to call componentWillUnmount on all
    // composites before this host node is removed from the tree. Therefore
    var node = root;
    while (true) {
      commitUnmount(node);
      if (node.child) {
        // TODO: Coroutines need to visit the stateNode.
        node = node.child;
        continue;
      }
      if (node === root) {
        return;
      }
      while (!node.sibling) {
        if (!node['return'] || node['return'] === root) {
          return;
        }
        node = node['return'];
      }
      node = node.sibling;
    }
  }

  function commitDeletion(current) {
    // Recursively delete all host nodes from the parent.
    // TODO: Error handling.
    var parent = getHostParent(current);
    // We only have the top Fiber that was inserted but we need recurse down its
    // children to find all the terminal nodes.
    // TODO: Call componentWillUnmount on all classes as needed. Recurse down
    // removed HostComponents but don't call removeChild on already removed
    // children.
    var node = current;
    while (true) {
      if (node.tag === HostComponent || node.tag === HostText) {
        commitNestedUnmounts(node);
        // After all the children have unmounted, it is now safe to remove the
        // node from the tree.
        if (parent) {
          removeChild(parent, node.stateNode);
        }
      } else {
        commitUnmount(node);
        if (node.child) {
          // TODO: Coroutines need to visit the stateNode.
          node = node.child;
          continue;
        }
      }
      if (node === current) {
        return;
      }
      while (!node.sibling) {
        if (!node['return'] || node['return'] === current) {
          return;
        }
        node = node['return'];
      }
      node = node.sibling;
    }
  }

  function commitUnmount(current) {
    switch (current.tag) {
      case ClassComponent:
        {
          detachRef(current);
          var instance = current.stateNode;
          if (typeof instance.componentWillUnmount === 'function') {
            instance.componentWillUnmount();
          }
          return;
        }
      case HostComponent:
        {
          detachRef(current);
          return;
        }
    }
  }

  function commitWork(current, finishedWork) {
    switch (finishedWork.tag) {
      case ClassComponent:
        {
          detachRefIfNeeded(current, finishedWork);
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
          var instance = finishedWork.stateNode;
          if (instance != null && current) {
            // Commit the work prepared earlier.
            var newProps = finishedWork.memoizedProps;
            var oldProps = current.memoizedProps;
            commitUpdate(instance, oldProps, newProps);
          }
          detachRefIfNeeded(current, finishedWork);
          return;
        }
      case HostText:
        {
          if (finishedWork.stateNode == null || !current) {
            throw new Error('This should only be done during updates.');
          }
          var textInstance = finishedWork.stateNode;
          var newText = finishedWork.memoizedProps;
          var oldText = current.memoizedProps;
          commitTextUpdate(textInstance, oldText, newText);
          return;
        }
      default:
        throw new Error('This unit of work tag should not have side-effects.');
    }
  }

  function commitLifeCycles(current, finishedWork) {
    switch (finishedWork.tag) {
      case ClassComponent:
        {
          var instance = finishedWork.stateNode;
          if (!current) {
            if (typeof instance.componentDidMount === 'function') {
              instance.componentDidMount();
            }
          } else {
            if (typeof instance.componentDidUpdate === 'function') {
              var prevProps = current.memoizedProps;
              var prevState = current.memoizedState;
              instance.componentDidUpdate(prevProps, prevState);
            }
          }
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
            callCallbacks(callbackList, instance);
          }
          attachRef(current, finishedWork, instance);
          return;
        }
      case HostComponent:
        {
          var _instance = finishedWork.stateNode;
          attachRef(current, finishedWork, _instance);
          return;
        }
      case HostText:
        {
          // We have no life-cycles associated with text.
          return;
        }
      default:
        throw new Error('This unit of work tag should not have side-effects.');
    }
  }

  return {
    commitInsertion: commitInsertion,
    commitDeletion: commitDeletion,
    commitWork: commitWork,
    commitLifeCycles: commitLifeCycles
  };
};
},{"14":14,"18":18,"19":19}],10:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var _require = _dereq_(1);

var reconcileChildFibers = _require.reconcileChildFibers;

var ReactTypeOfWork = _dereq_(19);
var ReactTypeOfSideEffect = _dereq_(18);
var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent;
var FunctionalComponent = ReactTypeOfWork.FunctionalComponent;
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;
var HostText = ReactTypeOfWork.HostText;
var CoroutineComponent = ReactTypeOfWork.CoroutineComponent;
var CoroutineHandlerPhase = ReactTypeOfWork.CoroutineHandlerPhase;
var YieldComponent = ReactTypeOfWork.YieldComponent;
var Fragment = ReactTypeOfWork.Fragment;
var Update = ReactTypeOfSideEffect.Update;


module.exports = function (config) {

  var createInstance = config.createInstance;
  var createTextInstance = config.createTextInstance;
  var prepareUpdate = config.prepareUpdate;

  function markUpdate(workInProgress) {
    // Tag the fiber with an update effect. This turns a Placement into
    // an UpdateAndPlacement.
    workInProgress.effectTag |= Update;
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
        markUpdate(workInProgress);
        return null;
      case HostContainer:
        transferOutput(workInProgress.child, workInProgress);
        // We don't know if a container has updated any children so we always
        // need to update it right now. We schedule this side-effect before
        // all the other side-effects in the subtree. We need to schedule it
        // before so that the entire tree is up-to-date before the life-cycles
        // are invoked.
        markUpdate(workInProgress);
        return null;
      case HostComponent:
        var newProps = workInProgress.pendingProps;
        if (current && workInProgress.stateNode != null) {
          // If we have an alternate, that means this is an update and we need to
          // schedule a side-effect to do the updates.
          var oldProps = current.memoizedProps;
          // If we get updated because one of our children updated, we don't
          // have newProps so we'll have to reuse them.
          // TODO: Split the update API as separate for the props vs. children.
          // Even better would be if children weren't special cased at all tho.
          if (!newProps) {
            newProps = workInProgress.memoizedProps || oldProps;
          }
          var instance = workInProgress.stateNode;
          if (prepareUpdate(instance, oldProps, newProps)) {
            // This returns true if there was something to update.
            markUpdate(workInProgress);
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
          var child = workInProgress.child;
          var children = child && !child.sibling ? child.output : child;
          var _instance = createInstance(workInProgress.type, newProps, children);
          // TODO: This seems like unnecessary duplication.
          workInProgress.stateNode = _instance;
          workInProgress.output = _instance;
          if (workInProgress.ref) {
            // If there is a ref on a host node we need to schedule a callback
            markUpdate(workInProgress);
          }
        }
        workInProgress.memoizedProps = newProps;
        return null;
      case HostText:
        var newText = workInProgress.pendingProps;
        if (current && workInProgress.stateNode != null) {
          // If we have an alternate, that means this is an update and we need to
          // schedule a side-effect to do the updates.
          markUpdate(workInProgress);
        } else {
          if (typeof newText !== 'string') {
            if (workInProgress.stateNode === null) {
              throw new Error('We must have new props for new mounts.');
            } else {
              // This can happen when we abort work.
              return null;
            }
          }
          var textInstance = createTextInstance(newText);
          // TODO: This seems like unnecessary duplication.
          workInProgress.stateNode = textInstance;
          workInProgress.output = textInstance;
        }
        workInProgress.memoizedProps = newText;
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
      case Fragment:
        transferOutput(workInProgress.child, workInProgress);
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
},{"1":1,"18":18,"19":19}],11:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var _require = _dereq_(12);

var createFiberRoot = _require.createFiberRoot;

var ReactFiberScheduler = _dereq_(13);

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
      var root = container.stateNode;
      var containerFiber = root.current;
      if (!containerFiber.child) {
        return null;
      }
      return containerFiber.child.stateNode;
    }
  };
};
},{"12":12,"13":13}],12:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var _require = _dereq_(6);

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
},{"6":6}],13:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var ReactFiberBeginWork = _dereq_(7);
var ReactFiberCompleteWork = _dereq_(10);
var ReactFiberCommitWork = _dereq_(9);

var _require = _dereq_(6);

var cloneFiber = _require.cloneFiber;

var _require2 = _dereq_(16);

var NoWork = _require2.NoWork;
var LowPriority = _require2.LowPriority;
var AnimationPriority = _require2.AnimationPriority;
var SynchronousPriority = _require2.SynchronousPriority;

var _require3 = _dereq_(18);

var NoEffect = _require3.NoEffect;
var Placement = _require3.Placement;
var Update = _require3.Update;
var PlacementAndUpdate = _require3.PlacementAndUpdate;
var Deletion = _require3.Deletion;

var _require4 = _dereq_(19);

var HostContainer = _require4.HostContainer;


var timeHeuristicForUnitOfWork = 1;

module.exports = function (config) {
  // Use a closure to circumvent the circular dependency between the scheduler
  // and ReactFiberBeginWork. Don't know if there's a better way to do this.

  var _ReactFiberBeginWork = ReactFiberBeginWork(config, scheduleUpdate);

  var beginWork = _ReactFiberBeginWork.beginWork;

  var _ReactFiberCompleteWo = ReactFiberCompleteWork(config);

  var completeWork = _ReactFiberCompleteWo.completeWork;

  var _ReactFiberCommitWork = ReactFiberCommitWork(config);

  var commitInsertion = _ReactFiberCommitWork.commitInsertion;
  var commitDeletion = _ReactFiberCommitWork.commitDeletion;
  var commitWork = _ReactFiberCommitWork.commitWork;
  var commitLifeCycles = _ReactFiberCommitWork.commitLifeCycles;


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
    var root = nextScheduledRoot;
    var highestPriorityRoot = null;
    var highestPriorityLevel = NoWork;
    while (root) {
      if (root.current.pendingWorkPriority !== NoWork && (highestPriorityLevel === NoWork || highestPriorityLevel > root.current.pendingWorkPriority)) {
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

    // First, we'll perform all the host insertions, updates, deletions and
    // ref unmounts.
    var effectfulFiber = finishedWork.firstEffect;
    while (effectfulFiber) {
      switch (effectfulFiber.effectTag) {
        case Placement:
          {
            commitInsertion(effectfulFiber);
            break;
          }
        case PlacementAndUpdate:
          {
            commitInsertion(effectfulFiber);
            var current = effectfulFiber.alternate;
            commitWork(current, effectfulFiber);
            break;
          }
        case Update:
          {
            var _current = effectfulFiber.alternate;
            commitWork(_current, effectfulFiber);
            break;
          }
        case Deletion:
          {
            commitDeletion(effectfulFiber);
            break;
          }
      }
      effectfulFiber = effectfulFiber.nextEffect;
    }

    // Next, we'll perform all life-cycles and ref callbacks. Life-cycles
    // happens as a separate pass so that all effects in the entire tree have
    // already been invoked.
    effectfulFiber = finishedWork.firstEffect;
    while (effectfulFiber) {
      if (effectfulFiber.effectTag === Update || effectfulFiber.effectTag === PlacementAndUpdate) {
        var _current2 = effectfulFiber.alternate;
        commitLifeCycles(_current2, effectfulFiber);
      }
      var next = effectfulFiber.nextEffect;
      // Ensure that we clean these up so that we don't accidentally keep them.
      // I'm not actually sure this matters because we can't reset firstEffect
      // and lastEffect since they're on every node, not just the effectful
      // ones. So we have to clean everything as we reuse nodes anyway.
      effectfulFiber.nextEffect = null;
      effectfulFiber = next;
    }

    // Finally if the root itself had an effect, we perform that since it is not
    // part of the effect list.
    if (finishedWork.effectTag !== NoEffect) {
      var _current3 = finishedWork.alternate;
      commitWork(_current3, finishedWork);
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
        // Append all the effects of the subtree and this fiber onto the effect
        // list of the parent. The completion order of the children affects the
        // side-effect order.
        if (!returnFiber.firstEffect) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }
        if (workInProgress.lastEffect) {
          if (returnFiber.lastEffect) {
            returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
          }
          returnFiber.lastEffect = workInProgress.lastEffect;
        }

        // If this fiber had side-effects, we append it AFTER the children's
        // side-effects. We can perform certain side-effects earlier if
        // needed, by doing multiple passes over the effect list. We don't want
        // to schedule our own side-effect on our own list because if end up
        // reusing children we'll schedule this effect onto itself since we're
        // at the end.
        if (workInProgress.effectTag !== NoEffect) {
          if (returnFiber.lastEffect) {
            returnFiber.lastEffect.nextEffect = workInProgress;
          } else {
            returnFiber.firstEffect = workInProgress;
          }
          returnFiber.lastEffect = workInProgress;
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
        var root = workInProgress.stateNode;
        if (root.current === workInProgress) {
          throw new Error('Cannot commit the same tree as before. This is probably a bug ' + 'related to the return field.');
        }
        root.current = workInProgress;
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

  function scheduleUpdate(fiber, priorityLevel) {
    while (true) {
      if (fiber.pendingWorkPriority === NoWork || fiber.pendingWorkPriority >= priorityLevel) {
        fiber.pendingWorkPriority = priorityLevel;
      }
      if (fiber.alternate) {
        if (fiber.alternate.pendingWorkPriority === NoWork || fiber.alternate.pendingWorkPriority >= priorityLevel) {
          fiber.alternate.pendingWorkPriority = priorityLevel;
        }
      }
      if (!fiber['return']) {
        if (fiber.tag === HostContainer) {
          var root = fiber.stateNode;
          scheduleDeferredWork(root, priorityLevel);
          return;
        } else {
          throw new Error('Invalid root');
        }
      }
      fiber = fiber['return'];
    }
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

  return {
    scheduleWork: scheduleWork,
    scheduleDeferredWork: scheduleDeferredWork,
    performWithPriority: performWithPriority
  };
};
},{"10":10,"16":16,"18":18,"19":19,"6":6,"7":7,"9":9}],14:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var _assign = _dereq_(23);

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

function addToQueue(queue, partialState) {
  var node = {
    partialState: partialState,
    callback: null,
    callbackWasCalled: false,
    next: null
  };
  queue.tail.next = node;
  queue.tail = node;
  return queue;
}

exports.addToQueue = addToQueue;

exports.addCallbackToQueue = function (queue, callback) {
  if (queue.tail.callback) {
    // If the tail already as a callback, add an empty node to queue
    addToQueue(queue, null);
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
},{"23":23}],15:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
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
},{}],16:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
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
},{}],17:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var _require = _dereq_(6);

var createFiberFromElementType = _require.createFiberFromElementType;


exports.createReifiedYield = function (yieldNode) {
  var fiber = createFiberFromElementType(yieldNode.continuation, yieldNode.key);
  return {
    continuation: fiber,
    props: yieldNode.props
  };
};

exports.createUpdatedReifiedYield = function (previousYield, yieldNode) {
  var fiber = previousYield.continuation;
  if (fiber.type !== yieldNode.continuation) {
    fiber = createFiberFromElementType(yieldNode.continuation, yieldNode.key);
  }
  return {
    continuation: fiber,
    props: yieldNode.props
  };
};
},{"6":6}],18:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

module.exports = {
  NoEffect: 0,
  Placement: 1,
  Update: 2,
  PlacementAndUpdate: 3,
  Deletion: 4
};
},{}],19:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

module.exports = {
  IndeterminateComponent: 0, // Before we know whether it is functional or class
  FunctionalComponent: 1,
  ClassComponent: 2,
  HostContainer: 3, // Root of a host tree. Could be nested inside another node.
  HostComponent: 4,
  HostText: 5,
  CoroutineComponent: 6,
  CoroutineHandlerPhase: 7,
  YieldComponent: 8,
  Fragment: 9
};
},{}],20:[function(_dereq_,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

/* global Symbol */

var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

/**
 * Returns the iterator method function contained on the iterable object.
 *
 * Be sure to invoke the function with the iterable as context:
 *
 *     var iteratorFn = getIteratorFn(myIterable);
 *     if (iteratorFn) {
 *       var iterator = iteratorFn.call(myIterable);
 *       ...
 *     }
 *
 * @param {?object} maybeIterable
 * @return {?function}
 */
function getIteratorFn(maybeIterable) {
  var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
  if (typeof iteratorFn === 'function') {
    return iteratorFn;
  }
}

module.exports = getIteratorFn;
},{}],21:[function(_dereq_,module,exports){
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
},{}],22:[function(_dereq_,module,exports){
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

var emptyFunction = _dereq_(21);

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
},{"21":21}],23:[function(_dereq_,module,exports){
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

},{}]},{},[4])(4)
});
});
