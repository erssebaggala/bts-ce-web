import React from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setSidePanel } from '../layout/uilayout-actions';

class NetworkAudit extends React.Component{
    static icon = "wrench";
    static label = "Network Audit";
    
    constructor(props){
        super(props)
        
        this.setSidePanel = this.setSidePanel.bind(this);
    }
    
    setSidePanel(){
        this.props.dispatch(setSidePanel('AuditRuleTree'));
    }
    
    render(){
        return (
                
        <div>
			<fieldset className="col-md-12 fieldset">    	
				<legend className="legend"><FontAwesomeIcon icon={NetworkAudit.icon}/> Network Audit</legend>
                    <a href="#" className="launch-network-tree" onClick={this.setSidePanel}><FontAwesomeIcon icon="arrow-right"/> View audit rules</a>        
			</fieldset>
		</div>
        );
    }
}

export default connect()(NetworkAudit);