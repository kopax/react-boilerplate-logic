/**
 * Test injectors
 */

import { memoryHistory } from 'react-router-dom';
import { shallow } from 'enzyme';
import { createLogic } from 'redux-logic';
import React from 'react';

import configureStore from '../../configureStore';
import injectLogic from '../injectLogic';
import * as logicInjectors from '../logicInjectors';

// Fixtures
const Component = () => null;

const testLogic = createLogic({
  type: 'TRIGGER_TEST',
  process() { // return action to dispatch
    return { type: 'TEST', payload: 'yup' };
  },
});

const logic = [
  testLogic,
];

describe('injectLogic decorator', () => {
  let store;
  let injectors;
  let ComponentWithLogic;

  beforeAll(() => {
    logicInjectors.default = jest.fn().mockImplementation(() => injectors);
  });

  beforeEach(() => {
    store = configureStore({}, memoryHistory);
    injectors = {
      injectLogic: jest.fn(),
      ejectLogic: jest.fn(),
    };
    ComponentWithLogic = injectLogic({ key: 'test', logic })(Component);
    logicInjectors.default.mockClear();
  });

  it('should inject given logic, mode, and props', () => {
    const props = { test: 'test' };
    shallow(<ComponentWithLogic {...props} />, { context: { store } });

    expect(injectors.injectLogic).toHaveBeenCalledTimes(1);
    expect(injectors.injectLogic).toHaveBeenCalledWith('test', { logic }, props);
  });

  it('should set a correct display name', () => {
    expect(ComponentWithLogic.displayName).toBe('withLogic(Component)');
    expect(injectLogic({ key: 'test', logic: testLogic })(() => null).displayName).toBe('withLogic(Component)');
  });

  it('should propagate props', () => {
    const props = { testProp: 'test' };
    const renderedComponent = shallow(<ComponentWithLogic {...props} />, { context: { store } });

    expect(renderedComponent.prop('testProp')).toBe('test');
  });
});
