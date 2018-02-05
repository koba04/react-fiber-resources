'use strict';

const Reconciler = require('react-reconciler');
const {spawnSync} = require('child_process');

const sideEffect = (method, text) => spawnSync('say', ['-v', method, text]);

const VoiceRenderer = Reconciler({
  getRootHostContext() {
    return {};
  },

  getChildHostContext() {
    return {};
  },

  getPublicInstance(instance) {
    return null;
  },

  createInstance(type, props) {
    return {};
  },

  appendInitialChild(parentInstance, child) {},

  finalizeInitialChildren(host, type, props) {
    if (typeof props.children === 'string') {
      sideEffect(type, props.children);
    }
    return false;
  },

  prepareUpdate(instance, type, oldProps, newProps) {
    return {};
  },

  shouldSetTextContent(type, props) {},
  shouldDeprioritizeSubtree(type, props) {},

  createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {},

  useSyncScheduling: true,

  scheduleDeferredCallback(cb) {},
  cancelDeferredCallback() {},

  prepareForCommit() {},
  resetAfterCommit() {},

  now() { return Date.now() },

  mutation: {
    commitUpdate(instance, updatePayload, type, oldProps, newProps) {
      if (typeof newProps.children === 'string') {
        if (newProps.children !== oldProps.children) {
          sideEffect(type, newProps.children);
        }
      }
    },
    commitMount(instance, type, newProps) {},
    commitTextUpdate(textInstance, oldText, newText) {},
    resetTextContent(instance) {},
    appendChild(parentInstance, child) {},
    appendChildToContainer(parentInstance, child) {},
    insertBefore(parentInstance, child, beforeChild) {},
    insertInContainerBefore(container, child, beforeChild) {},
    removeChild(parentInstance, child) {},
    removeChildFromContainer(container, child) {},
  },
});

let root;
const ReactVoice = {
  render(element, callback) {
    if (!root) {
      const container = {};
      root = VoiceRenderer.createContainer(container);
    }
    VoiceRenderer.updateContainer(element, root, null, callback);
  },
};

module.exports = ReactVoice;
