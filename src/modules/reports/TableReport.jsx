import React from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getReportFields, downloadReport, checkDownloadStatus,
         clearReportDownloadStatus, deleteReport, clearReportCreateState,
         getReportInfo, } from './reports-actions';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css'; 

import { getQueryForAGGridSortAndFilter } from '../../utils/aggrid-to-jqdt-queries';
import axios from '../../api/config';
import { ProgressBar, Intent, ButtonGroup, Button, Classes, Toaster, Alert } from "@blueprintjs/core"; 
import classNames from 'classnames';
import { addTab, closeTab } from '../layout/uilayout-actions';
import LoadingCellRenderer from './LoadingCellRenderer'

//Maximum number of times to check if the file is being generated 
//for download
const MAX_STATUS_CHECKS = 3;

class TableReport extends React.Component{
    static icon = "table";
    static label = "";
    constructor(props){
        super(props);
        
        this.columnDefs = []
        
        this.toaster = new Toaster();
        
        this.downloadInterval = null;
        this.progressToastInterval = null;
        this.progressToastKey = null;
        this.progressToastCount = 0;
         
        this.onDownloadClick = this.onDownloadClick.bind(this);
        this.handleProgressToast = this.handleProgressToast.bind(this);
        this.renderDownloadProgress = this.renderDownloadProgress.bind(this);
        this.checkReportDownloadStatus = this.checkReportDownloadStatus.bind(this);
        this.handleErrorOpen = this.handleErrorOpen.bind(this);
        this.handleErrorClose = this.handleErrorClose.bind(this);
        this.refreshData = this.refreshData.bind(this);
        this.clearDownloadProgress = this.clearDownloadProgress.bind(this)
        this.handleAlertClose = this.handleAlertClose.bind(this)
        
        this.state = {
            columnDefs: [],
            rowData: [
            ],
//            components: {
//                loadingRenderer: function(params) {
//                  if (params.value !== undefined) {
//                    return params.data.action;
//                  } else {
//                    return '<img src="https://raw.githubusercontent.com/ag-grid/ag-grid-docs/master/src/images/loading.gif">';
//                  }
//                }
//              },
            rowBuffer: 0,
            rowSelection: "multiple",
            rowModelType: "infinite",
            paginationPageSize: 100,
            cacheOverflowSize: 2,
            maxConcurrentDatasourceRequests: 2,
            infiniteInitialRowCount: 1,
            maxBlocksInCache: 2,
            frameworkComponents: {customloadingCellRenderer: LoadingCellRenderer},
            loadingCellRenderer: "customloadingCellRenderer",
            loadingCellRendererParams: { loadingMessage: "One moment please..." },
            overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Please wait while your rows are loading</span>',
            overlayNoRowsTemplate: "<span style=\"padding: 10px; border: 2px solid #444; background: lightgoldenrodyellow;\">This is a custom 'no rows' overlay</span>",

            //Download Alert state
            canEscapeKeyCancel: false,
            canOutsideClickCancel: false,
            isOpen: false,
            isOpenError: false,
            isAlertOpen: false
            
            
        };
        
        //This is filled when a download is triggered
        this.downloadUrl = "";
        this.downloadFilename="";
        
        this.agTblReload = 1; //used to reload the aggrid table
    }
    
    refreshData = () => {
        this.props.dispatch(getReportFields(this.props.options.reportId));
        
        this.toaster.show({
                icon: "info-sign",
                intent: Intent.INFO,
                message: "Refreshing report...",
        });
        
        this.agTblReload += 1;
    }
    
    handleErrorOpen = () => this.setState({ isOpenError: true });
    
    handleErrorClose = () => { 
        this.setState({ isOpenError: false,  });
        this.props.dispatch(clearReportDownloadStatus(this.props.options.reportId));
    } 
    
    /**
     * Hides the download details alert. 
     * 
     * It is called when the download alert is closed
     * 
     * @returns {undefined}
     */
    handleAlertClose = () => {
       this.setState({isAlertOpen: false}) 
    }
    
    /**
     * Dismiss the download progress toast
     * 
     * @returns {undefined}
     */
    clearDownloadProgress(){
        clearTimeout(this.downloadInterval);
        clearInterval(this.progressToastInterval);

        this.downloadUrl = null;
        this.downloadFilename = null;
        
        this.progressToastCount = 101;
        //this.toaster.dismiss();
 
    }
    
    /**
     * Check the status of the download job
     * 
     * @returns {undefined}
     */
    checkReportDownloadStatus(){
        if(this.props.download !== null ){   
            
            //Stop check if the number of status checks is above MAX_STATUS_CHECKS count
            if(this.props.download.statusChecks > MAX_STATUS_CHECKS 
                && this.props.download.status === 'PENDING'){

                this.clearDownloadProgress();
                this.toaster.dismiss(this.progressToastKey)
        
                this.toaster.show({
                        icon: "warning-sign",
                        intent: Intent.DANGER,
                        message: "Download failed. Try again!",
                });
                return;
            }
            
            //If the download status is completed, clear the progress toast and 
            //show the download details alert
            if (this.props.download.status.toUpperCase() === 'FINISHED'){

//                clearInterval(this.downloadInterval);
                clearTimeout(this.downloadInterval);
                clearInterval(this.progressToastInterval);  
                
                this.downloadUrl = this.props.download.download_url;
                this.downloadFilename = this.props.download.log;

                if(this.progressToastCount > 0 && this.toaster !== null ){
                    this.progressToastCount = 101;
                    this.toaster.show(this.renderDownloadProgress(this.progressToastCount), this.progressToastKey);
                    this.progressToastCount = 0;
                }
                
                this.setState({isAlertOpen: true})
            }else if(this.props.download.status.toUpperCase() === 'FAILED'){
                this.props.dispatch(clearReportDownloadStatus(this.props.options.reportId))
                
//                clearInterval(this.downloadInterval);
                clearTimeout(this.downloadInterval);
                clearInterval(this.progressToastInterval);
                
                if(this.progressToastCount > 0 && this.toaster !== null ){
                    this.progressToastCount = 101;
                    this.toaster.show(this.renderDownloadProgress(this.progressToastCount), this.progressToastKey);
                    this.progressToastCount = 0;
                }
                
                this.handleErrorOpen();
                
                //@TODO: Investigate setting the donwload status to 'COMPLETED'
                //so that this can act as a cache should the user want to download the 
                //same files again...but then agian is there any benefit to this?
            }else{
                
                const reportId = this.props.options.reportId;
                const statusUrl= this.props.download.status_url;

                this.props.dispatch(checkDownloadStatus(reportId, statusUrl));
                //this.downloadInterval = setInterval(this.checkReportDownloadStatus, 5000);
                this.downloadInterval = setTimeout(this.checkReportDownloadStatus, 5000);
            }
        }
        

    }
    
    componentDidMount() {
        if(this.props.fields.length === 0 ){
            this.props.dispatch(getReportFields(this.props.options.reportId));
        }
        
        //this.downloadInterval = setInterval(this.checkReportDownloadStatus, 5000);
        this.downloadInterval = setTimeout(this.checkReportDownloadStatus, 5000);
        
    }
    
    /**
     * Trigger the download 
     * 
     * @returns {undefined}
     */
    onDownloadClick(){
        this.props.dispatch(downloadReport(this.props.options.reportId));
        
        //check if there is an on going download
        if (this.props.download === null){
            this.handleProgressToast();
        }else if(this.props.download.status !== 'RUNNING'){
            this.handleProgressToast();
        }
        
        //Check download after 3 seconds
        setTimeout(this.checkReportDownloadStatus, 3000);
    }
    
    /*
     * launch download progress toast
     */
    renderDownloadProgress(amount) {
        return {
//            className: this.props.data.themeName,
            icon: "cloud-download",
            message: (<div>
                <span>Downloading...</span>
                <ProgressBar
                    className={classNames("docs-toast-progress", { [Classes.PROGRESS_NO_STRIPES]: amount >= 100 })}
                    intent={amount < 100 ? Intent.PRIMARY : Intent.SUCCESS}
                    value={amount / 100}
                    /></div>
            ),
            timeout: amount < 100 ? 0 : 2000,
        };
    }
    
    /**
     * Set up and start download progress toast
     * 
     * @returns {undefined}
     */
    handleProgressToast = () => {
        this.progressToastCount = 0;
        this.progressToastKey = this.toaster.show(this.renderDownloadProgress(0));
        this.progressToastInterval = setInterval(() => {
            if(this.props.download !== null ){ 
                if(this.props.download.status.toUpperCase() === 'FINISHED' ||
                   this.props.download.status.toUpperCase() === 'FAILED'
                    ){
                    clearInterval(this.progressToastInterval);
                    return;
                }
            }
            
            if (this.toaster === null || this.progressToastCount > 100) {
                clearInterval(this.progressToastInterval);
            } else {
                //Don't reach 100
                if(this.progressToastCount + 20 < 100) { 
                    this.progressToastCount += Math.random() * 20;
                    this.toaster.show(this.renderDownloadProgress(this.progressToastCount), this.progressToastKey);
                }
                
            }
        }, 1000);
    }

    
    /**
     * Update the column definitions for the aggrid table
     * 
     * @returns {undefined}
     */
    updateColumnDefs(){
        this.columnDef = [];
        if( typeof this.props.fields === 'undefined'  ) return;
        
        for(var key in this.props.fields){
            let columnName = this.props.fields[key]
            this.columnDef.push(
                {headerName: columnName, field: columnName,  
                 filter: "agTextColumnFilter"},);
        }
    }

    /**
     * 
     * 
     * @param {type} params
     * @returns {undefined}
     */
    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        let _columnApi =  params.columnApi;
        let token = this.props.token;
        let _fields = this.props.fields;
        let _dispatch = this.props.dispatch;
        let reportId = this.props.options.reportId;
        
        let dataSource = {  
            rowCount: null,
            getRows: function(params) {
                let page = params.startRow;
                let length= params.endRow - params.startRow;
                let apiEndPoint = "/api/reports/dt/" + reportId + "?start="+  page + "&length=" + length;
                
                let query = getQueryForAGGridSortAndFilter( _fields, 
                        params.sortModel, params.filterModel, _columnApi.getAllColumns());
                
                apiEndPoint += "&" + query;
                
                axios.get(apiEndPoint,{
                    headers: { "Authorization": token }
                })
                .then(response => {
                    var lastRow = response.data.recordsFiltered;
                    params.successCallback(response.data.data, lastRow);
                })
                .catch(function(error){
                    //_dispatch(notifyNodesRequestFailure(entity, "Failed to fetch data"));
                });
            }
        };
        this.gridApi.setDatasource(dataSource);
    }
    
    /**
     * Create toask reference
     */
    refHandlers = {
        toaster: (ref) => (this.toaster = ref),
    };
    
//    handleEscapeKeyChange = handleBooleanChange(canEscapeKeyCancel => this.setState({ canEscapeKeyCancel }));
//    handleOutsideClickChange = handleBooleanChange(click => this.setState({ canOutsideClickCancel: click }));
    
    render(){
        this.updateColumnDefs();
        
        //Download alert
        const { isOpen, isOpenError, ...alertProps } = this.state;

        return (
            <div>
    
            <h3><FontAwesomeIcon icon={TableReport.icon}/> {this.props.options.title}</h3>        
                <div className="card">
                    <div className="card-body p-2">
                        <div className="mb-1">
                        <ButtonGroup minimal={true}>
                            <Button icon="refresh" onClick={this.refreshData}></Button>
                            <Button icon="download" onClick={this.onDownloadClick} ></Button>
                            <Toaster {...this.state} ref={this.refHandlers.toaster} />
                            <Button icon="info-sign"></Button>
                        </ButtonGroup>

                        </div>
                        <div className="ag-theme-balham" style={{width: '100%', height: "100%", boxSizing: "border-box"}}>
                            <AgGridReact
                                key={"create-table-key-" + this.agTblReload}
                                pagination={true}
                                gridAutoHeight={true}
                                columnDefs={this.columnDef}
                                enableColResize={true}
                                rowBuffer={this.state.rowBuffer}
                                rowSelection={this.state.rowSelection}
                                rowDeselection={true}
                                rowModelType={this.state.rowModelType}
                                paginationPageSize={this.state.paginationPageSize}
                                cacheOverflowSize={this.state.cacheOverflowSize}
                                maxConcurrentDatasourceRequests={this.state.maxConcurrentDatasourceRequests}
                                infiniteInitialRowCount={this.state.infiniteInitialRowCount}
                                maxBlocksInCache={this.state.maxBlocksInCache}
                                enableServerSideSorting={true}
                                enableServerSideFilter={true}
                                onGridReady={this.onGridReady.bind(this)}

                                >
                            </AgGridReact>

                        </div>


                    </div>
                </div>
                
                <Alert
                    {...alertProps}
                    confirmButtonText="Okay"
                    isOpen={this.state.isAlertOpen}
                    onClose={this.handleAlertClose}>
                    <p>
                        Download file: <a target='_blank' href={'//'+window.location.hostname + ':8181' + this.downloadUrl} download>{this.downloadFilename}</a> <br />
                        Or pick it from the reports folder.
                    </p>
                </Alert>
                
            </div>
        );
    }
}

function mapStateToProps(state, ownProps){
    
    if ( typeof state.reports.reportsdata[ownProps.options.reportId] === 'undefined'){
        return {
            requesting: false,
            requestError:  null,
            token: state.session.userDetails.token,
            fields: [],
            download: null
        };
    }
    
    return {
            requesting: state.reports.reportsdata[ownProps.options.reportId].requesting,
            requestError:  state.reports.reportsdata[ownProps.options.reportId].requestError,
            token: state.session.userDetails.token,
            fields: state.reports.reportsdata[ownProps.options.reportId].fields,
            download: state.reports.reportsdata[ownProps.options.reportId].download
    };
}

export default connect(mapStateToProps)(TableReport);