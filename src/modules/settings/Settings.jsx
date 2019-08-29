import React from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setSidePanel } from '../layout/uilayout-actions';

class Settings extends React.Component{
    static icon = "cog";
    static label = "Settings";
    constructor(props){
        super(props);
        
        this.showCMLeftPanel = this.showCMLeftPanel.bind(this);
    }
    
    showCMLeftPanel(){
         this.props.dispatch(setSidePanel('CMSettingsOptions'));
    }
    
    render(){
        return (
            <div>
                <fieldset className="col-md-12 fieldset">    	
                    <legend className="legend"><FontAwesomeIcon icon="cog"/> Settings</legend>
					<a href="#" className="launch-cm-menu"><FontAwesomeIcon icon="arrow-right"/><span> Configuration management</span></a>
				</fieldset>

            </div>
        );
    }
}

export default connect()(Settings);