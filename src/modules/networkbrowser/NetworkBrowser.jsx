import React from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { addTab } from '../layout/uilayout-actions';
import { setSidePanel } from '../layout/uilayout-actions';

class NetworkBrowser extends React.Component{
    static icon = "sitemap";
    static label = "Network Browser";
    
    constructor(props){
        super(props);
        
        this.showNetworkTree = this.showNetworkTree.bind(this)
    }
    
    launchEntityTab = (options) => (e) => { 
        e.preventDefault();
        
        let tabId = options.entity + "Tab";
        this.props.dispatch(addTab(tabId, 'ElementBrowser', {
            entity: options.entity,
            title: options.title,
            endpoint: '/api/network/live/' + options.endpoit
        }));
    }
    
    showNetworkTree(){
        this.props.dispatch(setSidePanel('NetworkTree'));
    }
    
    render(){
        return (
                
        <div>
			<fieldset className="col-md-12 fieldset">    	
				<legend className="legend"><FontAwesomeIcon icon={NetworkBrowser.icon}/> Network Browser</legend>
                    <a href="#" className="launch-network-tree" onClick={this.showNetworkTree}><FontAwesomeIcon icon="arrow-right"/> View network tree</a>        
			</fieldset>
        </div>
        );
    }
}

export default connect()(NetworkBrowser)