import React from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setSidePanel } from '../layout/uilayout-actions';

class MOBrowser extends React.Component{
    static icon = "puzzle-piece";
    static label = "MO Browser";
    
    constructor(props){
        super(props)
        this.setSidePanel = this.setSidePanel.bind(this);

    }
    
    setSidePanel(){
        this.props.dispatch(setSidePanel('MOBrowserPanel'));
    }
    
    render(){
        return (
                
        <div>
			<fieldset className="col-md-12 fieldset">    	
				<legend className="legend"><FontAwesomeIcon icon={MOBrowser.icon}/> MO Browser</legend>
                    <a href="#" className="launch-network-tree" onClick={this.setSidePanel}><FontAwesomeIcon icon="arrow-right"/> Launch MO Browser</a>        
			</fieldset>
        </div>
        );
    }
    
}

function mapStateToProps(state){
    return {
        vendors: state.mobrowser.vendors,
        technologies: state.mobrowser.technologies,
        filter: state.mobrowser.filter,
        mos: state.mobrowser.mos
    };
}

export default connect(mapStateToProps)(MOBrowser);
   