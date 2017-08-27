import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import invariant from 'invariant';
import conformsTo from 'lodash/conformsTo';

import checkStore from './checkStore';
import {
  DAEMON,
  ONCE_TILL_UNMOUNT,
  RESTART_ON_REMOUNT,
} from './constants';

const allowedModes = [RESTART_ON_REMOUNT, DAEMON, ONCE_TILL_UNMOUNT];

const checkKey = (key) => invariant(
  isString(key) && !isEmpty(key),
  '(app/utils...) injectLogic: Expected `key` to be a non empty string'
);

const checkDescriptor = (descriptor) => {
  const shape = {
    logic: isFunction,
    mode: (mode) => isString(mode) && allowedModes.includes(mode),
  };
  invariant(
    conformsTo(descriptor, shape),
    '(app/utils...) injectLogic: Expected a valid saga descriptor'
  );
};

export function injectLogicFactory(store, isValid) {
  return function injectLogic(key, descriptor = {}, args) {
    if (!isValid) checkStore(store);

    const newDescriptor = { ...descriptor, mode: descriptor.mode || RESTART_ON_REMOUNT };
    const { logic, mode } = newDescriptor;

    checkKey(key);
    checkDescriptor(newDescriptor);

    let hasLogic = Reflect.has(store.injectedLogics, key);

    if (process.env.NODE_ENV !== 'production') {
      const oldDescriptor = store.injectedLogics[key];
      // enable hot reloading of daemon and once-till-unmount sagas
      if (hasLogic && oldDescriptor.logic !== logic) {
        oldDescriptor.task.cancel();
        hasLogic = false;
      }
    }

    if (!hasLogic || (hasLogic && mode !== DAEMON && mode !== ONCE_TILL_UNMOUNT)) {
      store.injectedLogics[key] = { ...newDescriptor, task: store.runSaga(logic, args) }; // eslint-disable-line no-param-reassign
    }
  };
}

export function ejectLogicFactory(store, isValid) {
  return function ejectLogic(key) {
    if (!isValid) checkStore(store);

    checkKey(key);

    if (Reflect.has(store.injectedLogics, key)) {
      const descriptor = store.injectedLogics[key];
      if (descriptor.mode !== DAEMON) {
        descriptor.task.cancel();
        // Clean up in production; in development we need `descriptor.saga` for hot reloading
        if (process.env.NODE_ENV === 'production') {
          // Need some value to be able to detect `ONCE_TILL_UNMOUNT` sagas in `injectLogic`
          store.injectedLogics[key] = 'done'; // eslint-disable-line no-param-reassign
        }
      }
    }
  };
}

export default function getInjectors(store) {
  checkStore(store);

  return {
    injectLogic: injectLogicFactory(store, true),
    ejectLogic: ejectLogicFactory(store, true),
  };
}
