import React from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';

import getInjectors from './logicInjectors';

/**
 * Dynamically injects a logic, passes component's props as logic arguments
 *
 * @param {string} key A key of the logic
 * @param {function} logic A root logic that will be injected
 *
 */
export default ({ key, logic, mode }) => (WrappedComponent) => {
  class InjectLogic extends React.Component {
    static WrappedComponent = WrappedComponent;
    static contextTypes = {
      store: PropTypes.object.isRequired,
    };
    static displayName = `withLogic(${(WrappedComponent.displayName || WrappedComponent.name || 'Component')})`;

    componentWillMount() {
      const { injectLogic } = this.injectors;

      injectLogic(key, { logic, mode }, this.props);
    }

    componentWillUnmount() {
      const { ejectLogic } = this.injectors;

      ejectLogic(key);
    }

    injectors = getInjectors(this.context.store);

    render() {
      return <WrappedComponent {...this.props} />;
    }
  }

  return hoistNonReactStatics(InjectLogic, WrappedComponent);
};
