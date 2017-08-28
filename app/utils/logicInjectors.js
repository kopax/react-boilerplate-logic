import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import invariant from 'invariant';
import conformsTo from 'lodash/conformsTo';

import checkStore from './checkStore';

const checkKey = (key) => invariant(
  isString(key) && !isEmpty(key),
  '(app/utils...) injectLogic: Expected `key` to be a non empty string'
);

const checkDescriptor = (descriptor) => {
  const shape = {
    logic: isArray,
  };
  invariant(
    conformsTo(descriptor, shape),
    '(app/utils...) injectLogic: Expected a valid logic descriptor'
  );
};

export function injectLogicFactory(store, isValid) {
  return function injectLogic(key, descriptor = {}) {
    if (!isValid) checkStore(store);

    const { logic } = descriptor;

    checkKey(key);
    checkDescriptor(descriptor);
    const hasLogic = Reflect.has(store.injectedLogics, key);
    if (!hasLogic) {
      console.log(store.logicMiddleware.mergeNewLogic(logic));
      store.injectedLogics[key] = { ...descriptor, task: store.logicMiddleware.mergeNewLogic(logic) }; // eslint-disable-line no-param-reassign
    }
  };
}

export default function getInjectors(store) {
  checkStore(store);

  return {
    injectLogic: injectLogicFactory(store, true),
  };
}
