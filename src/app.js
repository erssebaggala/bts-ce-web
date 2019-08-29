import React from 'react';
import { connect } from 'react-redux';
import configureStore from './configure-store';
import LoginForm from './modules/session/LoginForm';
import UILayoutContainer from './modules/layout/UILayoutContainer';
import ErrorBoundary from './modules/layout/ErrorBoundary';

class App extends React.Component {
  constructor(props){
      super(props)
  }
  
  render() {
      
        if (this.props.authenticated === false) {
            return (
				<ErrorBoundary>
					<LoginForm/>
				</ErrorBoundary>
				);
        }
        
        return (
			<ErrorBoundary>
				<UILayoutContainer/>
			</ErrorBoundary>
		);
  }
}

function mapStateToProps(state) {
  return {
    authenticated: state.session.authenticated
  }
}

export default connect(mapStateToProps)(App);