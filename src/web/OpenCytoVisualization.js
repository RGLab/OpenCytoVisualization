// vim: sw=4:ts=4:nu:nospell:fdc=4
/*
 *  Copyright 2012 Fred Hutchinson Cancer Research Center
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

Ext.namespace('LABKEY', 'LABKEY.ext');

LABKEY.ext.OpenCytoVisualization = Ext.extend( Ext.Panel, {

    constructor : function(config) {

        ////////////////////////////////////
        //  Generate necessary HTML divs  //
        ////////////////////////////////////
        $('#' + config.webPartDivId).append(
            '<ul id="ulSortable' + config.webPartDivId + '" class="bold-centered-text sortable-list"></ul>'

          + '<ul id="ulOptions1' + config.webPartDivId + '" class="bold-centered-text ulList">'

              + '<li class="liListDefault">'
                  + '<div class="left-text" id="pnlAnalysis' + config.webPartDivId + '"></div>' +
                '</li>'

              + '<li class="liListDefault">'
                  + '<div class="left-text" id="pnlPopulation' + config.webPartDivId + '"></div>' +
                '</li>'

              + '<li class="liListDefault">'
                  + '<div class="left-text" id="pnlProjection' + config.webPartDivId + '"></div>' +
                '</li>'

              +

            '</ul>'

          + '<ul id="ulOptions2' + config.webPartDivId + '" class="bold-centered-text ulList">'

              + '<li class="liListDefault">'
                  + '<div class="left-text" id="pnlXAxis' + config.webPartDivId + '"></div>' +
                '</li>'

              + '<li class="liListDefault">'
                  + '<div class="left-text" id="pnlAxisSwap' + config.webPartDivId + '"></div>' +
                '</li>'

              + '<li class="liListDefault">'
                  + '<div class="left-text" id="pnlYAxis' + config.webPartDivId + '"></div>' +
                '</li>'

              +

            '</ul>'

          + '<div id="wpGraph' + config.webPartDivId + '" class="centered-text">'
              + '<div style="height: 20px"></div>' +
            '</div>'
        );


        /////////////////////////////////////
        //            Variables            //
        /////////////////////////////////////
        var
              reportSessionId   = undefined
            , currentComboId    = undefined
            , selectedStudyVars = undefined
            , selectedAnalysis  = undefined
            , listStudyVars     = []
            , fileNameFilter	=
                LABKEY.Filter.create(
                    'FileName',
                    [],
                    LABKEY.Filter.Types.IN
                )
            , flagGraphLoading  = undefined
            ;


        /////////////////////////////////////
        //             Strings             //
        /////////////////////////////////////
        var strngErrorContactWithLink = ' Please, contact the <a href="mailto:ldashevs@fhcrc.org?Subject=OpenCytoVisualization%20Support">developer</a>, if you have questions.'


        /////////////////////////////////////
        //            Close Tool           //
        /////////////////////////////////////
        var closeTool = [{
            id: 'close',
            handler: function(e, target, pnl){

                var
                    temp = $( '#' + pnl.getId() )[0].parentNode,
                    toRemove = temp.parentNode,
                    mdl = pnlTable.getColumnModel();

                toRemove.parentNode.removeChild( toRemove );

                temp = temp.id.slice(3).replace( config.webPartDivId, '' );

                var colIndex = mdl.findColumnIndex( temp );
                if ( colIndex >=0 ){
                    var tmpConfig = mdl.config;
                    mdl.config = [tmpConfig[colIndex]];
                    tmpConfig.splice(colIndex, 1);
                    mdl.setConfig(tmpConfig);
                }

                cbStudyVarName.setValue( cbStudyVarName.getValuesAsArray().remove( LABKEY.QueryKey.decodePart( temp ) ) );
            }
        }];


        ///////////////////////////////////
        //            Stores             //
        ///////////////////////////////////
        var strngSqlStartTable = 'SELECT DISTINCT FCSFiles.Name AS FileName',
            strngSqlEndTable =
              ' FROM FCSFiles'
            + ' WHERE FCSFiles.Run.FCSFileCount != 0 AND FCSFiles.Run.ProtocolStep = \'Keywords\''
                ;

        var strFilteredTable = new LABKEY.ext.Store({
            listeners: {
                load: function(){
                    cbFileName.selectAll();
                    pnlTable.getSelectionModel().selectAll();

                    onFileNameComboUpdate();

                    var
                        inputArray, innerLen, i, outerLen, j, cb, label
                        , cbsArray = $( '#ulSortable' + config.webPartDivId + ' > .ui-state-default > div:first-child' )
                        ;

                    outerLen = cbsArray.length;
                    for ( i = 0; i < outerLen; i ++ ){
                        label = cbsArray[i].id.slice(3);
                        cb = Ext.getCmp('cb' + label );
                        if ( cb.getId() != currentComboId ){
                            inputArray = strFilteredTable.collect( label.replace( config.webPartDivId, '' ) );

                            loadStoreWithArray( cb.getStore(), inputArray );

                            innerLen = inputArray.length;
                            for ( j = 0; j < innerLen; j ++ ){
                                inputArray[j] = [ inputArray[j] ];
                            }

                            cb.getStore().loadData( inputArray );
                        }
                    }
                }
            },
//        nullRecord: {
//            displayColumn: 'myDisplayColumn',
//            nullCaption: '[other]'
//        },
            remoteSort: false,
            schemaName: 'flow',
            sortInfo: {
                field: 'FileName',
                direction: 'ASC'
            },
            sql: strngSqlStartTable + strngSqlEndTable
        });

        var strGatingSet = new LABKEY.ext.Store({
            autoLoad: true,
            queryName: 'GatingSet',
            schemaName: 'opencyto_preprocessing'
        });

        var strngSqlStartProj = 'SELECT projections.x_axis || \' / \' || projections.y_axis AS projection ' +
                                'FROM projections ',

            strngSqlEndProj = 'ORDER BY projection';

        var strPopulation = new LABKEY.ext.Store({
            autoLoad: true,
            queryName: 'Population',
            schemaName: 'opencyto_preprocessing'
        });

        var strProjection = new LABKEY.ext.Store({
            autoLoad: true,
            listeners: {
                load: function(){
                    var count = this.getCount();

                    if ( count == 1 ){
                        cbProjection.setValue( this.getAt(0).data.projection );

                        setAxes();

                    } else if ( count > 1 ){
                        if ( cbPopulation.getValue() != '' ){
                            cbPopulation.triggerBlur();
                            cbProjection.focus();

                            cbXAxis.clearValue();
                            cbYAxis.clearValue();

                            checkForControls();

                            if ( ! cbProjection.isExpanded() ){
                                cbProjection.expand();
                            }
                        }
                    }
                }
            },
            remoteSort: false,
            schemaName: 'opencyto_preprocessing',
            sort: 'projection',
            sql: strngSqlStartProj + strngSqlEndProj
        });

        var strXAxis = new Ext.data.ArrayStore({
            autoLoad: true,
            data: [],
            fields: ['XChannel', 'XInclMarker']
        });

        var strYAxis = new Ext.data.ArrayStore({
            autoLoad: true,
            data: [],
            fields: ['YChannel', 'YInclMarker']
        });

        var strStudyVarName = new Ext.data.ArrayStore({
            autoLoad: false,
            data: [],
            fields: ['Flag', 'Display', 'Value', 'Analysis'],
            hasMultiSort: true,
            listeners: {
                exception: onFailure
            },
            multiSortInfo: {
                sorters: [
                    {
                        field: 'Flag',
                        direction: 'ASC'
                    },
                    {
                        field: 'Display',
                        direction: 'ASC'
                    }
                ],
                direction: 'ASC'
            }
        });

        //////////////////////////////////////////////////////////////////
        //             Queries and associated functionality             //
        //////////////////////////////////////////////////////////////////
        LABKEY.Query.selectRows({
            columns: [ 'svname', 'analysis' ],
            queryName: 'StudyVars',
            schemaName: 'opencyto_preprocessing',
            success:
                function(data){
                    var len = data.rowCount, i, toAdd;
                    for ( i = 0; i < len; i ++ ){
                        toAdd = data.rows[i].svname;
                        if ( toAdd.slice(0,1) == 'R' ){
                            toAdd = toAdd.slice(14);
                            listStudyVars.push( [ 'K', toAdd + ' (Keyword)', 'RowId/Keyword/' + toAdd, data.rows[i].analysis ] );
                        } else if ( toAdd.slice(0,1) == 'S' ){
                            toAdd = toAdd.slice(7);
                            listStudyVars.push( [ 'E', toAdd + ' (External)', 'Sample/' + toAdd, data.rows[i].analysis ] );
                        } else {
                            i = len;
                            onFailure({
                                exception: 'there was an error while executing this command: data format mismatch.'
                            });
                        }
                    }

                    strStudyVarName.loadData( listStudyVars );
                },
            failure: onFailure
        });

        LABKEY.Query.selectRows({
            columns: ['Name'],
            failure: onFailure,
            filterArray: [
                LABKEY.Filter.create('Name', '$P', LABKEY.Filter.Types.STARTS_WITH),
                LABKEY.Filter.create('Name', 'N;S', LABKEY.Filter.Types.CONTAINS_ONE_OF)
            ],
            queryName: 'Keyword',
            schemaName: 'flow',
            success: onAxisChoicesSuccessPartI
        });

        function onAxisChoicesSuccessPartI(data){
            var len = data.rowCount;
            if ( len > 0 ){
                var strngAxisChoices = 'SELECT DISTINCT ', i;
                for ( i = 0; i < len-1; i ++ ){
                    strngAxisChoices += 'FCSFiles.Keyword."' + data.rows[i].Name + '", ';
                }
                strngAxisChoices += 'FCSFiles.Keyword."' + data.rows[i].Name + '" FROM FCSFiles';
                strngAxisChoices += ' WHERE FCSFiles.Run.FCSFileCount != 0 AND FCSFiles.Run.ProtocolStep = \'Keywords\'';

                LABKEY.Query.executeSql({
                    failure: onFailure,
                    sql: strngAxisChoices,
                    schemaName: 'flow',
                    success: onAxisChoicesSuccessPartII
                });
            } else {
                // disable all
                pnlOptions.setDisabled(true);
                pnlVisualize.setDisabled(true);
                cbAnalysis.setDisabled(true);
                pnlTabs.getEl().mask('Cannot retrieve the keyword names containing the axes choices: most likely you have not imported any FCS files, click <a href="' + LABKEY.ActionURL.buildURL('pipeline', 'browse') + '">here</a> to do so.' + strngErrorContactWithLink, 'infoMask');
            }
        };

        function onAxisChoicesSuccessPartII(data){
            if ( data.rowCount > 0 ){

                var i, count = data.rowCount;
                var tempObj, tempArray;
                var arrayToBuild = [], arrayToBuildCh = [], arrayToBuildMr = [];
                var j, len, N, S, tmpCh, tmpMr, tmp = '<';
                var FSC = []; var SSC = [];

                for ( i = 0; i < count; i ++ ){
                    tempObj = data.rows[i];
                    tempArray = Object.keys(tempObj);

                    len = tempArray.length;

                    for ( j = 0; j < len; j ++ ){
                        N = tempArray[ j ];
                        tmpCh = tempObj[ N ];
                        if ( tmpCh != null ){
                            if ( N.search('N') >= 0 && tmpCh != 'Time' ){

                                if ( tmpCh.search('FSC') >= 0 ){
                                    if ( $.inArray( tmpCh, FSC ) < 0 ){
                                        FSC.unshift(tmpCh);
                                    }
                                } else if ( tmpCh.search('SSC') >= 0 ){
                                    if ( $.inArray( tmpCh, SSC ) < 0 ){
                                        SSC.unshift(tmpCh);
                                    }
                                } else {
                                    if ( tmpCh.search('FSC') >= 0 ){
                                        if ( $.inArray( tmpCh, FSC ) < 0 ){
                                            FSC.unshift(tmpCh);
                                        }
                                    } else {
                                        S = N.replace('N', 'S');
                                        tmpMr = tempObj[ S ];
                                        if ( ( tmpMr != null ) & ( tmpMr != undefined ) ) {
                                            tmpMr = tmpMr.replace( tmpCh, '');
                                            tmpCh = tmp.concat( tmpCh, '>' );
                                            tmpMr = tmpMr.concat( ' ', tmpCh );

                                            if ( ( $.inArray( tmpCh, arrayToBuildCh ) < 0 )
                                                    | ( $.inArray( tmpMr, arrayToBuildMr ) < 0 ) ) {
                                                arrayToBuildCh.push( tmpCh );
                                                arrayToBuildMr.push( tmpMr );
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                len = SSC.length;
                for ( j = 0; j < len; j ++ ){
                    arrayToBuildCh.unshift( SSC[j] );
                    arrayToBuildMr.unshift( SSC[j] );
                }

                len = FSC.length;
                for ( j = 0; j < len; j ++ ){
                    arrayToBuildCh.unshift( FSC[j] );
                    arrayToBuildMr.unshift( FSC[j] );
                }

                arrayToBuildCh.unshift( 'Time' );
                arrayToBuildMr.unshift( 'Time' );

                if ( arrayToBuildCh.length != arrayToBuildMr.length ){
                    // disable all
                    pnlOptions.setDisabled(true);
                    pnlVisualize.setDisabled(true);
                    cbAnalysis.setDisabled(true);
                    pnlTabs.getEl().mask('There was an error in forming the axes choices: marker/channel lengths mismatch.' + strngErrorContactWithLink, 'infoMask');
                } else {
                    len = arrayToBuildCh.length;
                    for ( j = 0; j < len; j ++ ){
                        arrayToBuild.push( [ arrayToBuildCh[j], arrayToBuildMr[j] ] );
                    }

                    strXAxis.loadData( arrayToBuild );

                    arrayToBuild.shift();

                    strYAxis.loadData( arrayToBuild );
                    // dataYAxis.unshift( ['[histrogram]'] );
                }
            } else {
                // disable all
                pnlOptions.setDisabled(true);
                pnlVisualize.setDisabled(true);
                cbAnalysis.setDisabled(true);
                pnlTabs.getEl().mask('Cannot retrieve the axes choices, since they are empty: most likely you have not imported any FCS files, click <a href="' + LABKEY.ActionURL.buildURL('pipeline', 'browse') + '">here</a> to do so.' + strngErrorContactWithLink, 'infoMask');
            }
        };


        /////////////////////////////////////
        //      Session instanciation      //
        /////////////////////////////////////
        LABKEY.Report.createSession({
            failure: onFailure,
            success: function(data){
                reportSessionId = data.reportSessionId;
            }
        });


        /////////////////////////////////////
        //              Slider             //
        /////////////////////////////////////
        var tip = new Ext.slider.Tip({
            getText: function(thumb){
                return String.format('<b>xbin parameter: {0}</b>', Math.pow(2, thumb.value + 5 ) );
            }
        });

        var sldrBin = new Ext.Slider({
            flex: 1,
            increment: 1,
            margins: { top: 0, right: 5, bottom: 0, left: 5 },
            minValue: 1,
            maxValue: 4,
            plugins: tip,
            value: 2
        });


        /////////////////////////////////////
        //          ComboBoxes             //
        /////////////////////////////////////
        var cbAnalysis = new Ext.form.ClearableComboBox({
            allowBlank: true,
            autoSelect: false,
            displayField: 'Name',
            emptyText: 'Select...',
            forceSelection: true,
            listeners: {
                change: function(){
                    if ( this.getValue() != '' ){
//                        if ( cbStudyVarName.disabled ){         // hack needed so that .setDisabled(false) is not called twice, once
                                                                // select is fired as it prevent the SuperBoxCombo from expanding

//                        }
                    } else {
                        cbStudyVarName.setDisabled(true);
                        cbPopulation.setDisabled(true);
                    }

                    checkBtnGraph();
                },
                cleared: function(){
                    cbStudyVarName.setDisabled(true);
                    cbPopulation.setDisabled(true);

                    cbStudyVarName.clearValue();

                    checkBtnGraph();
                },
                select: function(){
                    cbStudyVarName.setDisabled(false);
                    cbPopulation.setDisabled(false);

                    this.triggerBlur();

                    callLoading();
                }
            },
            minChars: 0,
            mode: 'local',
            resizable: true,
            store: strGatingSet,
            tpl: '<tpl for="."><div ext:qtip="{Tooltip:htmlEncode}" class="x-combo-list-item">{Name:htmlEncode}</div></tpl>',
            triggerAction: 'all',
            typeAhead: true,
            valueField: 'Id',
            width: 200
        });

        var cbStudyVarName = new Ext.ux.form.SuperBoxSelect({
            allowBlank: true,
            autoSelect: false,
            disabled: true,
            displayField: 'Display',
            emptyText: 'Select...',
            forceSelection: true,
            lazyInit: false,
            listeners: {
                additem: function(){
                },
                beforequery: function(qe){
                    qe.combo.onLoad();
                    return false;
                },
                clear: function(){
                },
                /*focus: function (){ // display the dropdown on focus
//                    this.doQuery('',true);
                    this.expand();
                },*/
                removeitem: function(){
                }
            },
            minChars: 0,
            mode: 'local',
            resizable: true,
            store: strStudyVarName,
            triggerAction: 'all',
            typeAhead: true,
            valueField: 'Value'
        });

        var cbPopulation = new Ext.form.ClearableComboBox({
            allowBlank: true,
            autoSelect: false,
            disabled: true,
            displayField: 'path',
            emptyText: 'Select...',
            forceSelection: true,
            listeners: {
                change: function(){
                    if ( this.getValue() == '' ){
                        cbProjection.clearValue();
                        cbProjection.setDisabled( true );
                    } else {
                        cbProjection.setDisabled( false );
                    }

                    // IMPORTANT NOT TO INCLUDE filterProjections(...) HERE
                },
                select: function(){
                    if ( this.getValue() == '' ){
                        cbProjection.clearValue();
                        cbProjection.setDisabled( true );
                    } else {
                        cbProjection.setDisabled( false );
                    }

                    filterProjections();
                }
            },
            minChars: 0,
            mode: 'local',
            resizable: true,
            store: strPopulation,
            tpl: '<tpl for="."><div class="x-combo-list-item">{path:htmlEncode}</div></tpl>',
            triggerAction: 'all',
            typeAhead: true,
            valueField: 'name',
            width: 200
        });

        var cbProjection = new Ext.form.ClearableComboBox({
            allowBlank: true,
            autoSelect: false,
            disabled: true,
            displayField: 'projection',
            emptyText: 'Select...',
            forceSelection: true,
            lazyInit: false,
            listeners: {
                change: setAxes,
                select: setAxes
            },
            minChars: 0,
            mode: 'local',
            resizable: true,
            store: strProjection,
            tpl: '<tpl for="."><div class="x-combo-list-item">{projection:htmlEncode}</div></tpl>',
            triggerAction: 'all',
            typeAhead: false,
            valueField: 'projection',
            width: 245
        });

        var cbXAxis = new Ext.form.ClearableComboBox({
            allowBlank: true,
            autoSelect: false,
            displayField: 'XInclMarker',
            emptyText: 'Select...',
            forceSelection: true,
            listeners:{
                change:     xAxisHandler,
                cleared:    xAxisHandler,
                select:     xAxisHandler
            },
            minChars: 0,
            mode: 'local',
            store: strXAxis,
            tpl: '<tpl for="."><div class="x-combo-list-item">{XInclMarker:htmlEncode}</div></tpl>',
            triggerAction: 'all',
            typeAhead: true,
            valueField: 'XChannel',
            width: 200
        });

        var cbYAxis = new Ext.form.ClearableComboBox({
            allowBlank: true,
            autoSelect: false,
            displayField: 'YInclMarker',
            emptyText: 'Select...',
            forceSelection: true,
            listeners:{
                change: yAxisHandler,
                select: yAxisHandler
            },
            minChars: 0,
            mode: 'local',
            store: strYAxis,
            tpl: '<tpl for="."><div class="x-combo-list-item">{YInclMarker:htmlEncode}</div></tpl>',
            triggerAction: 'all',
            typeAhead: true,
            valueField: 'YChannel',
            width: 200
        });

        var cbFileName = new Ext.ux.ExtendedLovCombo({
//            addSelectAllItem: false,
            allowBlank: true,
            autoSelect: false,
            displayField: 'FileName',
            emptyText: 'Select...',
            forceSelection: true,
            hidden: true,
            listeners: {
                afterrender: function(combo) {
                    new Ext.ToolTip({
                        target: combo.getEl(),
                        html: combo.getValue(),
                        listeners: {
                            beforeshow: function(tip) {
                                var msg = combo.getRawValue();
                                tip.update(msg);
                                return (msg.length > 0);
                            },
                            scope: this
                        },
                        renderTo: document.body
                    });
                },
                change:     onFileNameComboUpdate,
                cleared:    onFileNameComboUpdate,
                select:     onFileNameComboUpdate
            },
            minChars: 0,
            mode: 'local',
            resizable: true,
            selectOnFocus: true,
            store: strFilteredTable,
            triggerAction: 'all',
            typeAhead: true,
            valueDelimeter: ',',
            valueField: 'FileName',
            width: 200
        });


        /////////////////////////////////////
        //             Buttons             //
        /////////////////////////////////////
        var btnClearFilters = new Ext.Button({
            handler: function(){
                strFilteredTable.setUserFilters( [ fileNameFilter ] );
                strFilteredTable.load();

                currentComboId = undefined;

                cbStudyVarName.selectAll();

                setStudyVars();

                var
                    i, len,
                    cbsArray = $( '#ulSortable' + config.webPartDivId + ' > .ui-state-default > div:first-child' );

                len = cbsArray.length;
                for ( i = 0; i < len; i ++ ){
                    Ext.getCmp('cb' + cbsArray[i].id.slice(3)).clearValue();
                }
            },
            text: 'Reset'
        });

        var btnGraph = new Ext.Button({
            disabled: true,
            handler: plotFiles,
            text: 'Graph'
        });

        /////////////////////////////////////
        //             Web parts           //
        /////////////////////////////////////
        var cnfLoad = {
            failure: function( errorInfo, options, responseObj ){
                maskLoad.hide();
                cbAnalysis.setDisabled(false);
                flagGraphLoading = false;
                tlbrGraph.setDisabled(false);
                maskGraph.hide();

                onFailure(errorInfo, options, responseObj);
            },
            reportId: 'module:OpenCytoVisualization/Load.r',
            success: function( result ){
                maskLoad.hide();
                cbAnalysis.setDisabled(false);
                flagGraphLoading = false;
                tlbrGraph.setDisabled(false);
                maskGraph.hide();

                var errors = result.errors;

                if (errors && errors.length > 0) {
                    /*
                     msg : errors[0].replace(/\n/g, '<P>'),
                     */

                    onFailure({
                        exception: errors[0].replace(/Execution halted\n/, 'Execution halted')
                    });
                } else {
                    selectedAnalysis = cbAnalysis.getSelectedField( 'Path' );
                }
            }
        };

        // Mask for the loading
        var maskLoad = undefined;

        var wpGraphConfig = {
            reportId: 'module:OpenCytoVisualization/Plot.r',
//                showSection: 'Graph.png', // comment out to show debug output
            title: 'Graph'
        };

        var resizableImage;

        var wpGraph = new LABKEY.WebPart({
            failure: function( errorInfo, options, responseObj ){
                tlbrGraph.setDisabled(false);
                maskGraph.hide();

                onFailure(errorInfo, options, responseObj);
            },
            frame: 'none',
            partConfig: wpGraphConfig,
            partName: 'Report',
            renderTo: 'wpGraph' + config.webPartDivId,
            success: function(){
                tlbrGraph.setDisabled(false);
                maskGraph.hide();

                var img = $('#wpGraph' + config.webPartDivId + ' img');
                if ( img.length > 0 ){
                    img[1].id += config.webPartDivId;
                }

                if ( $('#wpGraph' + config.webPartDivId + ' .labkey-error').length > 0 ){
                    removeById( 'resultImage' + config.webPartDivId );

                    var inputArray = $('#wpGraph' + config.webPartDivId + ' pre')[0].innerHTML;
                    if ( inputArray.search('The report session is invalid') < 0 ){
                        if ( inputArray.search('java.lang.RuntimeException') < 0 ){
                            if ( inputArray.search('javax.script.ScriptException') < 0 ){
                                onFailure({
                                    exception: inputArray
                                });
                            } else {
                                onFailure({
                                    exception: inputArray.replace(/Execution halted\n/, 'Execution halted')
                                });
                            }
                        } else {
                            onFailure({
                                exception: inputArray
                            });
                        }

                        pnlGraph.getEl().frame("ff0000");
                    } else {
                        LABKEY.Report.createSession({
                            failure: onFailure,
                            success: function(data){
                                reportSessionId = data.reportSessionId;

                                tlbrGraph.setDisabled(true);
                                maskGraph.show();

                                wpGraphConfig.reportSessionId = reportSessionId;
                                wpGraph.render();
                            }
                        });
                    }

                } else {

                    var height = 2/3*pnlStudyVars.getWidth();

                    resizableImage = new Ext.Resizable( 'resultImage' + config.webPartDivId, {
                        disableTrackOver: true,
                        dynamic: true,
                        handles: 's',
                        height: height,
                        listeners: {
                            resize: function(){
                                var widthToSet = pnlStudyVars.getWidth(), img = this.getEl().dom;
                                var width = img.offsetWidth, height = img.offsetHeight;
                                if ( width > widthToSet | height > widthToSet ){
                                    resizableImage.resizeTo( widthToSet );//, widthToSet );
                                }
                            }
                        },
                        minHeight: 50,
                        minWidth:50,
                        width: height,
                        pinned: true,
                        preserveRatio: true,
                        wrap: true
                    });

//                        maxHeight: pnlStudyVars.getWidth(),
//                        maxWidth: pnlStudyVars.getWidth(),
//                        $( '#resultImage' + config.webPartDivId )[0].src; // the address of the image!

                }
            }
        });

        // Mask for the plot
        var maskGraph = new Ext.LoadMask('wpGraph' + config.webPartDivId, {
            msg: 'Generating the graphics...',
            msgCls: 'x-mask-loading-custom'
        });


        /////////////////////////////////////
        //          CheckBoxes             //
        /////////////////////////////////////
        var chBinning = new Ext.form.Checkbox({
            boxLabel: 'Enable binning',
            checked: true,
            ctCls: 'bold-text',
            handler: function(a,b) { sldrBin.setDisabled(!b); },
            margins: { top: 0, right: 0, bottom: 0, left: 4 },
            width: 136
        });

        var chEnableGrouping = new Ext.form.Checkbox({
            boxLabel: 'Enable grouping',
            checked: true,
            hidden: true
        });

        var chAppendFileName = new Ext.form.Checkbox({
            boxLabel: 'Append file name',
            hidden: true
        });


        /////////////////////////////////////
        //  Panels, Containers, Components //
        /////////////////////////////////////
        var pnlOptions = new Ext.Panel({
            defaults: {
                style: 'padding-bottom: 4px; padding-right: 4px; padding-left: 4px;'
            },
            forceLayout: true,
            items: [
                {
                    items: [ chBinning ],
//                    layout: 'fit',
                    padding: 5,
                    title: 'Plot options:'
                },
                {
                    hidden: true,
                    items: [ cbStudyVarName ],
                    layout: 'fit',
                    title: 'Select the study variables that are of interest:'
                }
            ],
            monitorResize: true,
            title: 'Options'
        });

/////////////////////////////////////

        new Ext.Panel({
            border: false,
            headerCssClass: 'simple-panel-header',
            headerStyle: 'padding-top: 0px;',
            items: [ cbAnalysis ],
            layout: 'fit',
            listeners: {
                afterrender: function() {
                    maskLoad = new Ext.LoadMask( this.getEl(), {
                        msg: 'Reading and loading the data...',
                        msgCls: 'x-mask-loading-custom'
                    });
                }
            },
            renderTo: 'pnlAnalysis' + config.webPartDivId,
            title: 'Analysis'
        });

        new Ext.Panel({
            border: false,
            headerCssClass: 'simple-panel-header',
            headerStyle: 'padding-top: 0px;',
            items: [ cbPopulation ],
            layout: 'fit',
            renderTo: 'pnlPopulation' + config.webPartDivId,
            title: 'Parent population'
        });

        new Ext.Panel({
            border: false,
            headerCssClass: 'simple-panel-header',
            headerStyle: 'padding-top: 0px;',
            items: [ cbProjection ],
            layout: 'fit',
            renderTo: 'pnlProjection' + config.webPartDivId,
            title: 'Projection'
        });

        new Ext.Panel({
            border: false,
            headerCssClass: 'simple-panel-header',
            headerStyle: 'padding-top: 0px;',
            items: [ cbXAxis ],
            layout: 'fit',
            renderTo: 'pnlXAxis' + config.webPartDivId,
            title: 'X-Axis'
        });

        new Ext.Panel({
            border: false,
            headerCssClass: 'simple-panel-header',
            headerStyle: 'padding-top: 0px;',
            items: [
                new Ext.Button({
                    handler: function(){
                        var temp = cbXAxis.getValue();
                        cbXAxis.setValue( cbYAxis.getValue() );
                        cbYAxis.setValue( temp );
                    },
                    text: '< >'
                })
            ],
            layout: 'fit',
            renderTo: 'pnlAxisSwap' + config.webPartDivId,
            title: '&nbsp'
        });

        new Ext.Panel({
            border: false,
            headerCssClass: 'simple-panel-header',
            headerStyle: 'padding-top: 0px;',
            items: [ cbYAxis ],
            layout: 'fit',
            renderTo: 'pnlYAxis' + config.webPartDivId,
            title: 'Y-Axis'
        });

        var pnlPlotOpts = new Ext.Panel({
            border: true,
            collapsible: true,
            items: [
                {
                    border: false,
                    contentEl: 'ulOptions1' + config.webPartDivId
                },
                {
                    border: false,
                    contentEl: 'ulOptions2' + config.webPartDivId
                }
            ],
            listeners: {
                afterrender: function(){
                    new Ext.LoadMask( this.getEl(),
                        {
                            msgCls: 'x-mask-loading-custom'
                            , msg: 'Loading the projections data...'
                            , store: strProjection
                        }
                    );
                }
            },
            title: 'Select analysis and gates'
        });


        var smCheckBox = new Ext.grid.CheckboxSelectionModel({
            checkOnly: true,
            listeners: {
                selectionchange: onFileNameComboUpdate
            },
            sortable: true
        });

        var rowNumberer = new Ext.grid.RowNumberer();

        var pnlTable = new Ext.grid.GridPanel({
            autoScroll: true,
//            collapsed: true,
//            collapsible: true,
            columnLines: true,
            columns: [],
            height: 200,
            loadMask: { msg: 'Loading data...', msgCls: 'x-mask-loading-custom' },
            plugins: ['autosizecolumns'],
            selModel: smCheckBox,
            store: strFilteredTable,
            stripeRows: true,
            viewConfig:
            {
                emptyText: 'No rows to display',
                splitHandleWidth: 10
            }
        });

        var cmpTableStatus = new Ext.Component({
            cls: 'bold-text',
            html: '',
            style: { paddingLeft: '10px' }
        });

        var pnlStudyVars = new Ext.Panel({
            bbar: new Ext.Toolbar({
                items: [ btnClearFilters, cmpTableStatus, '->', cbFileName ]
            }),
            border: true,
            collapsible: true,
            items: [
                {
                    border: false,
                    contentEl: 'ulSortable' + config.webPartDivId,
                    layout: 'fit'
                },
                pnlTable
            ],
            listeners: {
                afterrender: function(){
                    new Ext.LoadMask( this.getEl(),
                        {
                            msgCls: 'x-mask-loading-custom'
                            , msg: 'Loading the study variables data...'
                            , store: strFilteredTable
                        }
                    );
                },
                render: function(){
                    Ext.QuickTips.register({
                        target: this.header,
                        text: 'drag and drop study variables\' names to change the grouping order',
                        width: 350
                    });
                }
            },
            title: 'Sub-select, filter and re-order study variables:'
        });

        var tlbrGraph = new Ext.Toolbar({
            items: [
                btnGraph,
                '','','',
                chEnableGrouping,
                '','','',
                chAppendFileName
            ]
        });

        var pnlGraph = new Ext.Panel({
            border: true,
            collapsible: true,
            contentEl: 'wpGraph' + config.webPartDivId,
            tbar: tlbrGraph,
            title: 'Plot'
        });

        var pnlVisualize = new Ext.Panel({
            defaults: {
                style: 'padding-bottom: 4px; padding-right: 4px; padding-left: 4px;'
            },
            items: [
                pnlPlotOpts,
                pnlStudyVars,
                pnlGraph
            ],
            title: 'Visualize'
        });

        var pnlTabs = new Ext.TabPanel({
            activeTab: 0,
            autoHeight: true,
            defaults: {
                autoHeight: true,
                hideMode: 'offsets'
            },
            deferredRender: false,
            items: [ pnlVisualize, pnlOptions ],
            layoutOnTabChange: true,
            listeners: {
                tabchange: function(tabPanel, tab){
                    if ( tab.title == 'Visualize' ){
                        setStudyVars();
                    }
                }
            },
            minTabWidth: 100,
            resizeTabs: true,
            width: '100%'
        });


        /////////////////////////////////////
        //             Functions           //
        /////////////////////////////////////
        function callLoading(){
            var analysisPath = cbAnalysis.getSelectedField( 'Path' );

            if ( analysisPath != selectedAnalysis ){

                strStudyVarName.clearFilter();
                cbStudyVarName.clearValue();

                strStudyVarName.filterBy(
                    function(record){
                        return record.get('Analysis') == cbAnalysis.getRawValue();
                    }
                );

                cbStudyVarName.selectAll();

                setStudyVars();

                strPopulation.filterBy(
                    function(record){
                        return record.get('Analysis') == cbAnalysis.getRawValue();
                    }
                );

                checkBtnGraph();

                if ( analysisPath == '' ){
                    Ext.Msg.alert('Error', 'No analysis is selected, cannot proceed');
                    return;
                } else {
                    LABKEY.Query.selectRows({
                        columns: ['filename, gsid'],
                        failure: onFailure,
                        filterArray: [
                            LABKEY.Filter.create('gsid', cbAnalysis.getValue(), LABKEY.Filter.Types.EQUALS)
                        ],
                        queryName: 'AnalysisFiles',
                        schemaName: 'opencyto_preprocessing',
                        success:
                            function(data){
                                var len = data.rowCount, tempArray = [];
                                if ( len > 0 ) {
                                    Ext.each( data.rows, function(r){ tempArray.push( r.filename ); } );
                                }
                                fileNameFilter =
                                    LABKEY.Filter.create(
                                        'FileName',
                                        tempArray.join(';'),
                                        LABKEY.Filter.Types.IN
                                    );

                                strFilteredTable.setUserFilters( [ fileNameFilter ] );
                                strFilteredTable.load();
                            }
                    });

                    maskLoad.show();
                    cbAnalysis.setDisabled(true);
                    flagGraphLoading = true;
                    tlbrGraph.setDisabled(true);
                    maskGraph.msg = 'Reading and loading the data...';
                    maskGraph.show();
                    maskGraph.msg = 'Generating the graphics...';

                    cnfLoad.reportSessionId = reportSessionId;
                    cnfLoad.inputParams = {
                        gsPath: Ext.util.Format.undef( analysisPath )
                        , showSection: 'textOutput' // comment out to show debug output
                    };

                    LABKEY.Report.execute( cnfLoad );
                }
            }
        };

        function checkBtnGraph(){
            if ( cbAnalysis.getValue() != '' && cbXAxis.getValue() != '' && ! flagGraphLoading ){
                btnGraph.setDisabled(false);
            } else {
                btnGraph.setDisabled(true);
            }
        };

        function xAxisHandler(){
            checkForControls();

            cbProjection.clearValue();

            checkBtnGraph();

            strYAxis.filterBy(
                function(record){
                    return record.get('YChannel') != cbXAxis.getValue();
                }
            );
        };

        function yAxisHandler(){
            checkForControls();

            cbProjection.clearValue();

            strXAxis.filterBy([
                function(record){
                    return record.get('XChannel') != cbYAxis.getValue();
                }
            ]);
        };

        function checkForControls(){
            if ( cbYAxis.getValue() != '' && cbXAxis.getValue() != '' && cbXAxis.getValue() != 'Time' ){
                chAppendFileName.show();
                chEnableGrouping.show();
            } else {
                chAppendFileName.hide();
                chEnableGrouping.hide();
            }
        };

        function onFileNameComboUpdate(){
            var selectedCount = pnlTable.getSelectionModel().getCount();

            if ( selectedCount == 1 ){
                cmpTableStatus.update( selectedCount + ' file is currently selected' );
            } else {
                cmpTableStatus.update( selectedCount + ' files are currently selected' );
            }
        };

        function setAxes(){
            cbXAxis.clearValue();
            cbYAxis.clearValue();

            var axes = cbProjection.getValue().split(' / ');

            cbXAxis.setValue(
                cbXAxis.findRecord(
                    cbXAxis.displayField
                  , axes[0]
                ).get( cbXAxis.valueField )
            );

            checkBtnGraph();

            cbYAxis.setValue(
                cbYAxis.findRecord(
                    cbYAxis.displayField
                  , axes[1]
                ).get( cbYAxis.valueField )
            );

            checkForControls();
        };

        function filterProjections(){
            var tempSQL =
                strngSqlStartProj +
                'WHERE projections.gsid.gsname = \'' + cbAnalysis.getRawValue() + '\' AND projections.name = \'' + cbPopulation.getValue() + '\' ' +
                strngSqlEndProj;

            cbProjection.clearValue();

            strProjection.setSql( tempSQL );
            strProjection.load();
        };

        function filterFiles(cb){
            var filterArrayToApply = strFilteredTable.getUserFilters();

            // Interacting with the same combo box as just before
            if ( cb.getId() == currentComboId ){
                filterArrayToApply.pop();
            }

            currentComboId = cb.getId();

            var filesFilter = cb.getCheckedArray();

            if ( filesFilter.length > 0 ){
                filterArrayToApply.push(
                    LABKEY.Filter.create(
                        LABKEY.QueryKey.encodePart( cb.getId().slice(2).replace( config.webPartDivId, '') ),
                        filesFilter.join(';'),
                        LABKEY.Filter.Types.IN
                    )
                );
            }/* else { WHAT TO DO IF NOTHING IS SELECTED!
             filterArrayToApply = [];
             }*/

            strFilteredTable.setUserFilters( filterArrayToApply );

            strFilteredTable.load();
        };

        function plotFiles() {

            wpGraphConfig.xAxis = cbXAxis.getValue();
            wpGraphConfig.yAxis = cbYAxis.getValue();
            wpGraphConfig.xLab = cbXAxis.getRawValue();
            wpGraphConfig.yLab = cbYAxis.getRawValue();

            if ( wpGraphConfig.xAxis == '' & wpGraphConfig.yAxis == '' ){
                Ext.Msg.alert('Error', 'Both axis choices cannot be blank!');
                tlbrGraph.setDisabled(false);
                return;
            }
            if ( wpGraphConfig.yAxis != '' & wpGraphConfig.xAxis == '' ){
                Ext.Msg.alert('Error', 'If you provided the y-axis choice, ' +
                        'then you must provide an x-axis choice as well');
                tlbrGraph.setDisabled(false);
                return;
            }
            if ( wpGraphConfig.xAxis == 'Time' & wpGraphConfig.yAxis == '' ){
                Ext.Msg.alert('Error', 'If you selected "Time" for the x-axis,' +
                        ' you must provide a y-axis choice as well');
                tlbrGraph.setDisabled(false);
                return;
            }

            var records = pnlTable.getSelectionModel().getSelections(), filesNames = [];
            Ext.each( records, function( record ){
                filesNames.push( record.data.FileName );
            } );

            wpGraphConfig.filesNames = filesNames.join();
            if ( wpGraphConfig.filesNames == '' ){
                Ext.Msg.alert('Error', 'No files are selected to be plotted!');
                tlbrGraph.setDisabled(false);
                return;
            }

            wpGraphConfig.gsPath = cbAnalysis.getSelectedField( 'Path' );
            if ( wpGraphConfig.gsPath == undefined ){
                Ext.Msg.alert('Error', 'No analysis is selected, cannot proceed');
                tlbrGraph.setDisabled(false);
                return;
            }

            if ( filesNames.length > 30 ){
                Ext.Msg.show({
                    title:'Proceed?',
                    closable: false,
                    msg:'You chose ' + filesNames.length + ' files to plot.<br />' +
                            'This may take longer than you expect.<br />' +
                            'Would you still like to proceed?',
                    buttons: Ext.Msg.YESNO,
                    icon: Ext.Msg.WARNING,
                    fn: function(btn){
                        if (btn === 'no'){
                            tlbrGraph.setDisabled(false);
                            return;
                        } else {
                            renderPlot();
                        }
                    }
                });
            }  else {
                renderPlot();
            }
        }; // end of plotFiles()

        function renderPlot(){
            var i, len, curCombo, curString, count, prod = 1, groupArray = [],
                    cbsArray = $( '#ulSortable' + config.webPartDivId + ' > .ui-state-default > div:first-child');

            len = cbsArray.length;
            for ( i = 0; i < len; i ++ ){
                curString = cbsArray[i].id.slice(3);
                curCombo = Ext.getCmp('cb' + curString );
                curString = LABKEY.QueryKey.decodePart( curString.replace( config.webPartDivId, '' ) );
                if ( curCombo.getId() == currentComboId ){
                    count = curCombo.getCheckedArray().length;
                    if ( count > 0 ){
                        prod *= curCombo.getCheckedArray().length;
                        groupArray.unshift(curString);
                    } else {
                        prod *= curCombo.getStore().getCount();
                        groupArray.unshift(curString);
                    }
                } else {
                    count = curCombo.getStore().getCount();
//                    count = curCombo.getCheckedArray().length;
                    if ( count > 0 ){
                        groupArray.unshift(curString);
                        prod *= count;
                    }
                }
            }

            // Set/pass the parameters of the webpart
            if ( ! chEnableGrouping.getValue() ){
                wpGraphConfig.flagEnableGrouping = 'NO';

                prod = cbFileName.getCheckedArray().length;
            } else {
                wpGraphConfig.flagEnableGrouping = 'YES';

                if ( cbFileName.getCheckedArray().length == 1 ){
                    prod = 1;
                }

                if ( len == 0 ){
                    prod = cbFileName.getCheckedArray().length;
                }
            }

            if ( chAppendFileName.getValue() ){
                wpGraphConfig.flagAppendFileName = 'YES';

                if ( chEnableGrouping.getValue() ){
                    prod *= cbFileName.getCheckedArray().length;
                }
            } else {
                wpGraphConfig.flagAppendFileName = 'NO';
            }
            wpGraphConfig.dimension = prod;
            wpGraphConfig.studyVars = groupArray.join(';');
            wpGraphConfig.population = cbPopulation.getValue();
            if ( chBinning.getValue() ){
                wpGraphConfig.xbin = Math.pow(2, sldrBin.getValue() + 5 );
            } else {
                wpGraphConfig.xbin = 0;
            }
            wpGraphConfig.imageWidth = 900; // pnlStudyVars.getWidth();

            tlbrGraph.setDisabled(true);
            maskGraph.show();

            wpGraphConfig.reportSessionId = reportSessionId;
            wpGraph.render();
        };

        function setStudyVars() {
            var temp = cbStudyVarName.getValue();
            if ( temp != selectedStudyVars ){
                selectedStudyVars = temp;

                var i, len, c, curLabel, curValue, curFlag, tempSQL, newColumns, tempStrng;

                // Grab the choices array
                var arrayStudyVars = cbStudyVarName.getValueEx();

                // Elliminate all of the previous choices
                $('#ulSortable' + config.webPartDivId).empty();
                newColumns =
                    [
                        rowNumberer,
                        smCheckBox,
                        {
                            dataIndex: 'FileName',
                            dragable: false,
                            header: 'File Name'
                        }
                    ];
                tempSQL = strngSqlStartTable;
                currentComboId = undefined;

                len = arrayStudyVars.length;

                for ( i = 0; i < len; i ++ ){
                    c = arrayStudyVars[i];
                    curLabel = c.Display; curValue = LABKEY.QueryKey.encodePart( c.Value ); curFlag = curLabel.slice(-2,-1);

                    if ( curFlag == 'l' ){ // External study variable
                        curLabel = curLabel.slice(0, -11);
                        tempSQL += ', FCSFiles.Sample."' + curLabel + '" AS "' + curValue + '"';
                        curLabel += ' (External)';
                    } else if ( curFlag == 'd' ){ // Keyword study variable
                        curLabel = curLabel.slice(0, -10);
                        tempSQL += ', FCSFiles.Keyword."' + curLabel + '" AS "' + curValue + '"';
                        curLabel += ' (Keyword)';
                    } else {
                        i = len;
                        onFailure({
                            exception: 'there was an error while executing this command: data format mismatch.'
                        });
                    }

                    newColumns.push({
                        dataIndex: curValue,
                        header: curLabel
                    });

                    $('#ulSortable' + config.webPartDivId).append(
                        '<li class="ui-state-default">' +
                            '<div id="pnl' + curValue + config.webPartDivId + '"></div>' +
                        '</li>'
                    );

                    new Ext.Panel({
                        border: true,
                        headerCssClass: 'draggableHandle',
                        headerStyle: 'text-align: center',
                        items: [
                            new Ext.ux.ExtendedLovCombo({
                                allowBlank: true,
                                autoSelect: false,
                                displayField: 'value',
                                emptyText: 'Select...',
                                forceSelection: true,
                                id: 'cb' + curValue + config.webPartDivId,
                                listeners: {
                                    afterrender: function(combo) {
                                        new Ext.ToolTip({
                                            target: combo.getEl(),
                                            html: combo.getValue(),
                                            listeners: {
                                                beforeshow: function(tip) {
                                                    var msg = combo.getRawValue();
                                                    tip.update(msg);
                                                    return (msg.length > 0);
                                                },
                                                scope: this
                                            },
                                            renderTo: document.body
                                        });
                                    },
                                    change: function(){
                                        filterFiles(this);
                                    },
                                    cleared: function(){
                                        filterFiles(this);
                                    },
                                    expand: function(){
                                        this.setValue( this.getValue() );
                                    },
                                    select: function(){
                                        filterFiles(this);
                                    }
                                },
                                minChars: 0,
                                mode: 'local',
                                resizable: true,
                                store:
                                        new Ext.data.ArrayStore({
                                            data: [],
                                            fields: [{ name: 'value', type: 'string' }],
                                            sortInfo: {
                                                field: 'value',
                                                direction: 'ASC'
                                            }
                                        }),
                                /*                        tpl:'<tpl for=".">' +
                                 '<div class="x-combo-list-item">{[values["' +
                                 this.keyColumn + '"]!==null ? values["' + this.displayColumn + '"] : "' +
                                 (Ext.isDefined(this.lookupNullCaption) ? this.lookupNullCaption : '[other]') +'"]}' +
                                 '</div>' +
                                 '</tpl>',*/
                                triggerAction: 'all',
                                typeAhead: true,
                                valueField: 'value'
                            })
                        ],
                        layout: 'fit',
                        renderTo: 'pnl' + curValue + config.webPartDivId,
                        title: curLabel,
                        tools: closeTool
                    });

                } // end of for ( i = 0; i < len; i ++ ) loop

                pnlTable.reconfigure(
                    strFilteredTable,
                    new Ext.grid.ColumnModel({
                        columns: newColumns,
                        defaults: {
                            hideable: false,
                            resizable: true,
                            sortable: true,
                            tooltip: 'double click the separator between two column headers to fit the column width to its contents'
                        }
                    })
                );

                tempSQL += strngSqlEndTable;

                strFilteredTable.setSql( tempSQL );
                strFilteredTable.setUserFilters( [ fileNameFilter ] );

                strFilteredTable.load();
            }
        }; // end of setStudyVars()


        // jQuery-related

        $( '#ulSortable' + config.webPartDivId ).sortable({
            cancel: '.x-tool-close',
            forceHelperSize: true,
            forcePlaceholderSize: true,
            handle: '.draggableHandle',
            helper: 'clone',
            opacity: 0.4,
            placeholder: 'ui-state-highlight',
            revert: true,
            tolerance: 'pointer'
        }).disableSelection().empty();

//        $( '#resultImage-link' ).fancybox(); //  + config.webPartDivId

        this.border = false;
        this.boxMinWidth = 370;
        this.frame = false;
        this.items = [ pnlTabs ];
        this.layout = 'fit';
        this.renderTo = config.webPartDivId;
        this.webPartDivId = config.webPartDivId;
        this.width = document.getElementById(config.webPartDivId).offsetWidth;

        this.pnlTable = pnlTable;
//                this.pnlStudyVars = pnlStudyVars;
//                this.resizableImage = resizableImage;

        LABKEY.ext.OpenCytoVisualization.superclass.constructor.apply(this, arguments);

    }, // end constructor

    resize : function(){
        this.pnlTable.getView().refresh();

//        this.doLayout();
//                 if ( typeof resizableImage != 'undefined' ){
//                 if ( $( '#resultImage' + config.webPartDivId ).width() > 2/3*pnlStudyVars.getWidth() ){
//                 resizableImage.resizeTo( 2/3*pnlStudyVars.getWidth(), 2/3*pnlStudyVars.getWidth() );
//                 }
//                 }
    }
}); // end OpenCytoVisualization Panel class
