/**
 * Test injectors
 */

import { memoryHistory } from 'react-router-dom';
import { createLogic } from 'redux-logic';
import configureStore from '../../configureStore';
import getInjectors, {
  injectLogicFactory,
} from '../logicInjectors';


const testLogic = createLogic({
  type: 'TRIGGER_TEST',
  process() { // return action to dispatch
    return { type: 'TEST', payload: 'yup' };
  },
});

const logic = [
  testLogic,
];

describe('injectors', () => {
  let store;
  let injectLogic;

  describe('getInjectors', () => {
    beforeEach(() => {
      store = configureStore({}, memoryHistory);
    });

    it('should return injectors', () => {
      expect(getInjectors(store)).toEqual(expect.objectContaining({
        injectLogic: expect.any(Function),
      }));
    });

    it('should throw if passed invalid store shape', () => {
      Reflect.deleteProperty(store, 'dispatch');

      expect(() => getInjectors(store)).toThrow();
    });
  });

  describe('injectLogic helper', () => {
    beforeEach(() => {
      store = configureStore({}, memoryHistory);
      injectLogic = injectLogicFactory(store, true);
    });

    it('should check a store if the second argument is falsy', () => {
      const inject = injectLogicFactory({});

      expect(() => inject('test', testLogic)).toThrow();
    });

    it('it should not check a store if the second argument is true', () => {
      Reflect.deleteProperty(store, 'dispatch');

      expect(() => injectLogic('test', { logic })).not.toThrow();
    });

    it('should validate logic\'s key', () => {
      expect(() => injectLogic('', { logic })).toThrow();
      expect(() => injectLogic(1, { logic })).toThrow();
    });

    it('should validate logic\'s descriptor', () => {
      expect(() => injectLogic('test')).toThrow();
      expect(() => injectLogic('test', { logic: 1 })).toThrow();
      expect(() => injectLogic('test', { logic: testLogic })).toThrow();
      expect(() => injectLogic('test', { logic })).not.toThrow();
    });

    it('should call logicMiddleware.mergeNewLogic', () => {
      store.logicMiddleware = {};
      store.logicMiddleware.mergeNewLogic = jest.fn();
      injectLogic('test', { logic });
      expect(store.logicMiddleware.mergeNewLogic).toHaveBeenCalledWith(logic);
    });

    it('should inject logic only once', () => {
      store.logicMiddleware = {};
      store.logicMiddleware.mergeNewLogic = jest.fn();

      injectLogic('test1', { logic });
      injectLogic('test1', { logic });

      expect(store.logicMiddleware.mergeNewLogic).toHaveBeenCalledTimes(1);
    });

    it('should save an entire descriptor in the logic registry', () => {
      injectLogic('test', { logic, foo: 'bar' });
      expect(store.injectedLogics.test.foo).toBe('bar');
    });
  });
});
