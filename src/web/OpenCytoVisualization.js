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
            '<ul id="ulSortable' + config.webPartDivId + '" class="bold-centered-text sortable-list"></ul>' +

            '<ul id="ulOptions' + config.webPartDivId + '" class="bold-centered-text ulList">' +

                '<li class="liListDefault">' +
                    '<div class="left-text" id="cntPopulation' + config.webPartDivId + '"></div>' +
                '</li>' +

                '<li class="liListDefault">' +
                    '<div class="left-text" id="cntProjection' + config.webPartDivId + '"></div>' +
                '</li>' +

                '<li class="liListDefault">' +
                    '<div class="left-text" id="cntXAxis' + config.webPartDivId + '"></div>' +
                '</li>' +

                '<li class="liListDefault">' +
                    '<div class="left-text" id="cntYAxis' + config.webPartDivId + '"></div>' +
                '</li>' +

            '</ul>' +

            '<div id="wpGraph' + config.webPartDivId + '" class="centered-text">' +
                '<div style="height: 20px"></div>' +
            '</div>'
        );


        /////////////////////////////////////
        //            Variables            //
        /////////////////////////////////////
        var currentComboId;
        var listStudyVars = [];


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

                var temp = $( '#' + pnl.getId() )[0].parentNode, toRemove = temp.parentNode;
                toRemove.parentNode.removeChild( toRemove );

                var mdl = pnlTable.colModel;

                var colIndex = mdl.findColumnIndex( temp.id.slice(3).replace( config.webPartDivId, '' ) );
                if ( colIndex >=0 ){
                    var tmpConfig = mdl.config;
                    mdl.config = [tmpConfig[colIndex]];
                    tmpConfig.splice(colIndex, 1);
                    mdl.setConfig(tmpConfig);
                }
            }
        }];


        ///////////////////////////////////
        //            Stores             //
        ///////////////////////////////////
        var strngSqlStartTable = 'SELECT DISTINCT FCSFiles.Name AS FileName';
        var strngSqlEndTable =
            ' FROM FCSFiles' +
            ' WHERE FCSFiles.Run.FCSFileCount != 0 AND FCSFiles.Run.ProtocolStep = \'Keywords\'' +
            ' ORDER BY FileName';

        var strFilteredTable = new LABKEY.ext.Store({
            autoLoad: true,
            listeners: {
                load: function(){
                    cbFileName.selectAll();

                    setTablePanelTitle();

                    var inputArray, innerLen, i, outerLen, j, cb, label;

                    var cbsArray = $( '#ulSortable' + config.webPartDivId + ' > .ui-state-default > div:first-child' );

                    outerLen = cbsArray.length;
                    for ( i = 0; i < outerLen; i ++ ){
                        label = cbsArray[i].id.slice(3);
                        cb = Ext.getCmp('cb' + label );
                        if ( cb.getId() != currentComboId ){
                            inputArray = strFilteredTable.collect( label.replace( config.webPartDivId, '' ) );
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
            schemaName: 'flow',
            sql: strngSqlStartTable + strngSqlEndTable
        });

        var strGatingSet = new LABKEY.ext.Store({
            autoLoad: true,
            queryName: 'GatingSet',
            schemaName: 'opencyto_preprocessing'
        });

        var strngSqlStartProj = 'SELECT projections.x_axis || \' / \' || projections.y_axis AS projection ' +
                                'FROM projections ';

        var strngSqlEndProj = 'ORDER BY projection';

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
            sortInfo: {
                field: 'Flag',
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
            } else{
                // disable all
                pnlSettings.disable();
                pnlExplore.disable();
                cbAnalysis.disable();
                btnSetStudyVars.disable();
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
                                    } else{
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
                    pnlSettings.disable();
                    pnlExplore.disable();
                    cbAnalysis.disable();
                    btnSetStudyVars.disable();
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
                pnlSettings.disable();
                pnlExplore.disable();
                cbAnalysis.disable();
                btnSetStudyVars.disable();
                pnlTabs.getEl().mask('Cannot retrieve the axes choices, since they are empty: most likely you have not imported any FCS files, click <a href="' + LABKEY.ActionURL.buildURL('pipeline', 'browse') + '">here</a> to do so.' + strngErrorContactWithLink, 'infoMask');
            }
        };


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
                        if ( cbStudyVarName.disabled ){         // hack needed so that .setDisabled(false) is not called twice, once
                            cbStudyVarName.setDisabled(false);  // select is fired as it prevent the SuperBoxCombo from expanding
                            cbPopulation.setDisabled(false);

                            strStudyVarName.filterBy(
                                    function(record){
                                        return record.get('Analysis') == cbAnalysis.getRawValue();
                                    }
                            );

                            strPopulation.filterBy(
                                    function(record){
                                        return record.get('Analysis') == cbAnalysis.getRawValue();
                                    }
                            );
                        }
                    } else {
                        cbStudyVarName.setDisabled(true);
                        cbPopulation.setDisabled(true);
                    }

                    checkBtnGraph();
                },
                cleared: function(){
                    cbStudyVarName.setDisabled(true);
                    cbPopulation.setDisabled(true);

                    checkBtnGraph();
                },
                select: function(){
                    cbStudyVarName.setDisabled(false);
                    cbPopulation.setDisabled(false);

                    strStudyVarName.filterBy(
                            function(record){
                                return record.get('Analysis') == cbAnalysis.getRawValue();
                            }
                    );

                    strPopulation.filterBy(
                            function(record){
                                return record.get('Analysis') == cbAnalysis.getRawValue();
                            }
                    );

                    checkBtnGraph();
                }
            },
            minChars: 0,
            mode: 'local',
            resizable: true,
            store: strGatingSet,
            tpl: '<tpl for="."><div ext:qtip="{Tooltip:htmlEncode}" class="x-combo-list-item">{Name:htmlEncode}</div></tpl>',
            triggerAction: 'all',
            typeAhead: true,
            valueField: 'Path'
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
                    btnSetStudyVars.setDisabled(false);
                    btnSetStudyVars.setText('Select study variables');
                },
                clear: function(){
                    btnSetStudyVars.setDisabled(false);
                    btnSetStudyVars.setText('Select study variables');
                },
                /*focus: function (){ // display the dropdown on focus
//                    this.doQuery('',true);
                    this.expand();
                },*/
                removeitem: function(){
                    btnSetStudyVars.setDisabled(false);
                    btnSetStudyVars.setText('Select study variables');
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
            valueField: 'name'
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
            valueField: 'projection'
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
            valueField: 'XChannel'
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
            valueField: 'YChannel'
        });

        var cbFileName = new Ext.ux.ExtendedLovCombo({
//                    addSelectAllItem: false,
            allowBlank: true,
            autoSelect: false,
            displayField: 'FileName',
            emptyText: 'Select...',
            forceSelection: true,
            listeners: {
                change:     setTablePanelTitle,
                cleared:    setTablePanelTitle,
                select:     setTablePanelTitle
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
                strFilteredTable.setUserFilters([]);
                strFilteredTable.load();

                currentComboId = undefined;

                var i, len;
                var cbsArray = $( '#ulSortable' + config.webPartDivId + ' > .ui-state-default > div:first-child' );

                len = cbsArray.length;
                for ( i = 0; i < len; i ++ ){
                    Ext.getCmp('cb' + cbsArray[i].id.slice(3)).clearValue();
                }
            },
            text: 'Clear all'
        });

        var btnSetStudyVars = new Ext.Button({
            handler: setStudyVars,
            text: 'Select study variables'
        });

        var btnGraph = new Ext.Button({
            disabled: true,
            handler: plotFiles,
            text: 'Graph'
        });

        /////////////////////////////////////
        //             Web parts           //
        /////////////////////////////////////
        var wpGraphConfig = {
            reportId:'module:OpenCytoVisualization/Plot.r',
//                showSection: 'Graph.png', // comment out to show debug output
            title:'Graphs'
        };

        var resizableImage;

        var wpGraph = new LABKEY.WebPart({
            failure: onFailure,
            frame: 'none',
            partConfig: wpGraphConfig,
            partName: 'Report',
            renderTo: 'wpGraph' + config.webPartDivId,
            success: function(){
                tlbrGraph.setDisabled(false);
                maskGraph.hide();

                if ( $('.labkey-error').length > 0 ){
                    removeById('resultImage');
                    onFailure({
                        exception: 'there was an error while executing this command.'
                    });
                    pnlGraph.getEl().frame("ff0000");
                } else {

                    var height = 2/3*pnlStudyVars.getWidth();

                    Ext.DomQuery.select('#wpGraph' + config.webPartDivId + ' img')[1].id += config.webPartDivId;

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
//                        $( '#resultImage' )[0].src; // the address of the image!

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
        var chEnableGrouping = new Ext.form.Checkbox({
            boxLabel: 'Enable grouping',
            checked: true,
            cls: 'checkBoxWithLeftMargin',
            hidden: true
        });

        var chAppendFileName = new Ext.form.Checkbox({
            boxLabel: 'Append file name',
            cls: 'checkBoxWithLeftMargin',
            hidden: true
        });

        var chBinning = new Ext.form.Checkbox({
            boxLabel: 'Enable binning',
            checked: true,
            cls: 'checkBoxWithLeftMargin',
            handler: function(a,b) { sldrBin.setDisabled(!b); },
            width: 136
        });


        /////////////////////////////////////
        //  Panels, Containers, Components //
        /////////////////////////////////////
        var pnlSettings = new Ext.Panel({
            defaults: {
                style: 'padding-bottom: 4px; padding-right: 4px; padding-left: 4px;'
            },
            forceLayout: true,
            items: [
                {
                    border: false,
                    items: [
                        {
                            autoHeight: true,
                            cls: 'bold-text',
                            defaults: {
                                style: 'padding-right: 4px; padding-left: 4px;'
                            },
                            flex: 1,
                            items: [ chBinning, sldrBin ],
                            layout: 'hbox',
                            margins: { top: 0, right: 2, bottom: 0, left: 0 },
                            title: 'Select the plot\'s resolution:'
                        },
                        {
                            flex: 1,
                            items: [ cbAnalysis ],
                            layout: 'fit',
                            margins: { top: 0, right: 0, bottom: 0, left: 2 },
                            title: 'Select the analysis:'
                        }
                    ],
                    layout: 'hbox'
                },
                {
                    items: [ cbStudyVarName ],
                    layout: 'fit',
                    title: 'Select the study variables that are of interest:'
                },
                btnSetStudyVars
            ],
            monitorResize: true,
            title: 'Settings'
        });

/////////////////////////////////////

        new Ext.Container({
            defaults: {
                style: 'padding-bottom: 1px;'
            },
            height: 39,
            items: [
                {
                    border: false,
                    html: 'Population'
                },
                cbPopulation
            ],
            layout: 'vbox',
            renderTo: 'cntPopulation' + config.webPartDivId
        });

        new Ext.Container({
            defaults: {
                style: 'padding-bottom: 1px;'
            },
            height: 39,
            items: [
                {
                    border: false,
                    html: 'Projection'
                },
                cbProjection
            ],
            layout: 'vbox',
            renderTo: 'cntProjection' + config.webPartDivId
        });

        new Ext.Container({
            defaults: {
                style: 'padding-bottom: 1px;'
            },
            height: 39,
            items: [
                {
                    border: false,
                    html: 'X-Axis'
                },
                cbXAxis
            ],
            layout: 'vbox',
            renderTo: 'cntXAxis' + config.webPartDivId
        });

        new Ext.Container({
            defaults: {
                style: 'padding-bottom: 1px;'
            },
            height: 39,
            items: [
                {
                    border: false,
                    html: 'Y-Axis'
                },
                cbYAxis
            ],
            layout: 'vbox',
            renderTo: 'cntYAxis' + config.webPartDivId
        });

        var pnlTable = new Ext.grid.GridPanel({
            autoScroll: true,
            collapsed: true,
            collapsible: true,
            columns: [
                {
                    dataIndex: 'FileName',
                    header: 'File Name',
                    resizable: true,
                    sortable: true,
                    tooltip: 'double click the separator between two column headers to fit the column width to its contents'
                }
            ],
            headerCssClass: 'right-text',
            height: 200,
            loadMask: { msg: 'Loading data...', msgCls: 'x-mask-loading-custom' },
            plugins: ['autosizecolumns'],
            store: strFilteredTable,
            stripeRows: true,
            title:'Table of the files&nbsp',
            viewConfig:
            {
                emptyText: 'No rows to display',
//            forceFit: true,
                splitHandleWidth: 10
            }
        });

        var pnlStudyVars = new Ext.Panel({
            bbar: new Ext.Toolbar({
                items: [ btnClearFilters, '->', cbFileName ]
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
                render: function(){
                    Ext.QuickTips.register({
                        target: this.header,
                        text: 'drag and drop the study variable\'s name to change the grouping order',
                        width: 350
                    });
                }
            },
            title: 'Selected study variables:'
        });

        var tlbrGraph = new Ext.Toolbar({
            items: [
                btnGraph,
                chEnableGrouping,
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

        var pnlExplore = new Ext.Panel({
            defaults: {
                style: 'padding-bottom: 4px; padding-right: 4px; padding-left: 4px;'
            },
            items: [
                {
                    border: true,
                    collapsible: true,
                    contentEl: 'ulOptions' + config.webPartDivId,
                    title: 'Plotting options'
                },
                pnlStudyVars,
                pnlGraph
            ],
            title: 'Explore'
        });

        /////////////////////////////////////
        //             Functions           //
        /////////////////////////////////////
        function checkBtnGraph(){
            if ( cbAnalysis.getValue() != '' && cbXAxis.getValue() != '' ){
                btnGraph.setDisabled(false);
            } else {
                btnGraph.setDisabled(true);
            }
        };

        function xAxisHandler(){
//                if ( this.getValue() != 'Time' && this.getValue() != '' && cbYAxis.getValue() != '' ){
//                    chAppendFileName.show();
//                    chEnableGrouping.show();
//                } else{
//                    chAppendFileName.hide();
//                    chEnableGrouping.hide();
//                }

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

            strXAxis.filter([
                {
                    fn: function(record){
                        return record.get('XChannel') != cbYAxis.getValue();
                    }
                }
            ]);
        };

        function checkForControls(){
            if ( cbYAxis.getValue() != '' && cbXAxis.getValue() != '' && cbXAxis.getValue() != 'Time' ){
                chAppendFileName.show();
                chEnableGrouping.show();
            } else{
                chAppendFileName.hide();
                chEnableGrouping.hide();
            }
        };

        function setTablePanelTitle(){
            var count = cbFileName.getCheckedArray().length;
            if ( count == 1 ){
                pnlTable.setTitle( count + ' file is currently selected&nbsp' );
            } else {
                pnlTable.setTitle( count + ' files are currently selected&nbsp' );
            }
        };

        function setAxes(){
            cbXAxis.clearValue();
            cbYAxis.clearValue();

            var axes = cbProjection.getValue().split(' / ');

            cbXAxis.setValue( axes[0] );

            checkBtnGraph();

            cbYAxis.setValue( axes[1] );

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
                        cb.getId().slice(2).replace( config.webPartDivId, '' ),
                        filesFilter.join(';'),
                        LABKEY.Filter.Types.IN
                    )
                );
            }/* else { WHAT TO DO IF NOTHING IS SELECTED!
             filterArrayToApply = [];
             }*/

            strFilteredTable.setUserFilters(filterArrayToApply);
            strFilteredTable.load();
        };

        function renderPlot(){
            var i, len, curCombo, curString, count, prod = 1;
            var cbsArray = $( '#ulSortable' + config.webPartDivId + ' > .ui-state-default > div:first-child' );
            var groupArray = [];

            len = cbsArray.length;
            if ( len == 0 ){ prod = cbFileName.getCheckedArray().length; }
            for ( i = 0; i < len; i ++ ){
                curString = cbsArray[i].id.slice(3);
                curCombo = Ext.getCmp('cb' + curString );
                curString = curString.replace( config.webPartDivId, '' );
                if ( curCombo.getId() == currentComboId ){
                    count = curCombo.getCheckedArray().length;
                    if ( count > 0 ){
                        prod *= curCombo.getCheckedArray().length;
                        groupArray.unshift(curString);
                    } else {
                        prod *= curCombo.getStore().getCount();
                        groupArray.unshift(curString);
                    }
                } else{
                    count = curCombo.getStore().getCount();
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
            } else{
                wpGraphConfig.flagEnableGrouping = 'YES';

                if ( cbFileName.getCheckedArray().length == 1 ){
                    prod = 1;
                }
            }

            if ( chAppendFileName.getValue() ){
                wpGraphConfig.flagAppendFileName = 'YES';

                if ( chEnableGrouping.getValue() ){
                    prod *= cbFileName.getCheckedArray().length;
                }
            } else{
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

            maskGraph.show();
            wpGraph.render();
        };

        function plotFiles() {
            tlbrGraph.setDisabled(true);

            wpGraphConfig.xAxis = cbXAxis.getValue();
            wpGraphConfig.yAxis = cbYAxis.getValue();
            wpGraphConfig.xLab = cbXAxis.getRawValue();
            wpGraphConfig.yLab = cbYAxis.getRawValue();

            if ( wpGraphConfig.xAxis == '' & wpGraphConfig.yAxis == '' ){
                alert('Both axis choices cannot be blank!');
                tlbrGraph.setDisabled(false);
                return;
            }
            if ( wpGraphConfig.yAxis != '' & wpGraphConfig.xAxis == '' ){
                alert('If you provided the y-axis choice, ' +
                        'then you must provide an x-axis choice as well');
                tlbrGraph.setDisabled(false);
                return;
            }
            if ( wpGraphConfig.xAxis == 'Time' & wpGraphConfig.yAxis == '' ){
                alert('If you selected "Time" for the x-axis,' +
                        ' you must provide a y-axis choice as well');
                tlbrGraph.setDisabled(false);
                return;
            }
            wpGraphConfig.filesNames = cbFileName.getValue();
            if ( wpGraphConfig.filesNames == '' ){
                alert('No files are selected to be plotted!');
                tlbrGraph.setDisabled(false);
                return;
            }

            wpGraphConfig.gsPath = cbAnalysis.getValue();
            if ( wpGraphConfig.gsPath == '' ){
                alert('No analysis is selected, cannot proceed');
                tlbrGraph.setDisabled(false);
                return;
            }

            var filesArray = cbFileName.getCheckedArray();

            if ( filesArray.length > 20 ){
                Ext.Msg.show({
                    title:'Proceed?',
                    closable: false,
                    msg:'You chose ' + filesArray.length + ' files to plot.<br />' +
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

        function setStudyVars() {
            var i, len, c, curLabel, curValue, curFlag, tempSQL, newColumns, tempStrng;

            // Grab the choices array
            var arrayStudyVars = cbStudyVarName.getValueEx();

            // Elliminate all of the previous choices
            $('#ulSortable' + config.webPartDivId).empty();
            newColumns =
                [
                    {
                        dataIndex: 'FileName',
                        header: 'File Name'
                    }
                ];
            tempSQL = strngSqlStartTable;
            currentComboId = undefined;
            strFilteredTable.setUserFilters([]);

            len = arrayStudyVars.length;

            for ( i = 0; i < len; i ++ ){
                c = arrayStudyVars[i];
                curLabel = c.Display; curValue = c.Value; curFlag = curLabel.slice(-2,-1);

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
                                change: function(){
                                    filterFiles(this);
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

                newColumns.push({
                    dataIndex: curValue,
                    header: curLabel
                });

            } // end of for ( i = 0; i < len; i ++ ) loop

            tempSQL += strngSqlEndTable;

            strFilteredTable.setSql( tempSQL );
            strFilteredTable.load();

            pnlTable.reconfigure(
                strFilteredTable,
                new Ext.grid.ColumnModel({
                    columns: newColumns,
                    defaults: {
                        resizable: true,
                        sortable: true,
                        tooltip: 'double click the separator between two column headers to fit the column width to its contents'
                    }
                })
            );

            btnSetStudyVars.getEl().frame();
            btnSetStudyVars.setDisabled(true);
            btnSetStudyVars.setText('Study variables selected');
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

//        $( '#resultImage-link' ).fancybox();

        var pnlTabs = new Ext.TabPanel({
            activeTab: 0,
            autoHeight: true,
            defaults: {
                autoHeight: true,
                hideMode: 'offsets'
            },
            deferredRender: false,
            items: [ pnlSettings, pnlExplore ],
            layoutOnTabChange: true,
            minTabWidth: 100,
            resizeTabs: true,
            width: '100%'
        });

        this.border = false;
        this.boxMinWidth = 370;
        this.frame = false;
        this.items = [ pnlTabs ];
        this.layout = 'fit';
        this.renderTo = config.webPartDivId;
        this.webPartDivId = config.webPartDivId;

        this.pnlTable = pnlTable;
//                this.pnlStudyVars = pnlStudyVars;
//                this.resizableImage = resizableImage;


        LABKEY.ext.OpenCytoVisualization.superclass.constructor.apply(this, arguments);

    }, // end constructor

    resize : function(){
        this.pnlTable.getView().refresh();

//                webPartContentWidth = document.getElementById(this.webPartDivId).offsetWidth;

//                 if ( typeof resizableImage != 'undefined' ){
//                 if ( $('#resultImage').width() > 2/3*pnlStudyVars.getWidth() ){
//                 resizableImage.resizeTo( 2/3*pnlStudyVars.getWidth(), 2/3*pnlStudyVars.getWidth() );
//                 }
//                 }
    }
}); // end OpenCytoVisualization Panel class
