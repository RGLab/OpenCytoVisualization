function removeById(elId) {
    $("#"+elId).remove();
};

function removeByClass(className) {
    $("."+className).remove();
};

Ext.namespace('LABKEY', 'LABKEY.ext');

LABKEY.ext.OpenCytoVisualization = Ext.extend( Ext.Panel, {

            constructor : function(config) {

////////////////////////////////////
//  Generate necessary HTML divs  //
////////////////////////////////////
                $('#' + config.webPartDivId).append(
                                '<ul id="ulSortable' + config.webPartDivId +'" class="bold-centered-text sortable-list">' +
                                '</ul>' +

                                '<div id="divList' + config.webPartDivId + '" class="bold-centered-text">' +
                                '<ul class="bold-centered-text ulList">' +
                                    '<li class="liListDefault">' +
                                        '<div id="divPops' + config.webPartDivId + '"></div>' +
                                    '</li>' +
                                    '<li class="liListDefault">' +
                                        '<div id="divProjs' + config.webPartDivId + '"></div>' +
                                    '</li>' +
                                '</ul>' +
                                '<ul class="bold-centered-text ulList">' +
                                    '<li class="liListDefault">' +
                                        '<div id="divXAxis' + config.webPartDivId + '"></div>' +
                                    '</li>' +
                                    '<li class="liListDefault">' +
                                        '<div id="divYAxis' + config.webPartDivId + '"></div>' +
                                    '</li>' +
                                '</ul>' +

                                '<div id="divGraph' + config.webPartDivId + '" class="centered-text">' +
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
                var strngErrorContact = '. Please, contact ldashevs@fhcrc.org for support.';
                var strngErrorContactWithLink = '. Please, contact the <a href="mailto:ldashevs@fhcrc.org?Subject=OpenCytoVisualization%20Support">developer</a>.'


/////////////////////////////////////
//            Close Tool           //
/////////////////////////////////////
                var closeTool = [{
                    id: 'close',
                    handler: function(e, target, panel){
                        var toRemove = document.getElementById( panel.getId() ).parentNode.parentNode;
                        toRemove.parentNode.removeChild( toRemove );

                        var mdl = panelTable.colModel;
                        var colIndex = mdl.findColumnIndex( toRemove.innerText.replace(/\s/, '').replace(/ /g, '_') );
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
//    .bindStore(newStore);

                var strngSqlStartTable = 'SELECT DISTINCT FCSFiles.Name AS FileName';
                var strngSqlEndTable =
                        ' FROM FCSFiles' +
                        ' WHERE FCSFiles.Run."Analysis Folder"."Flow Experiment Runs" = true' +
                        ' ORDER BY FileName';

                var strFilteredTable = new LABKEY.ext.Store({
                    autoLoad: true,
                    listeners: {
                        load: function(){
                            cbFileName.selectAll();

                            var inputArray, innerLen, i, outerLen, j, cb, label;

                            var cbsArray = $('.ui-state-default > div:first-child');

                            outerLen = cbsArray.length;
                            for ( i = 0; i < outerLen; i ++ ){
                                cb = Ext.getCmp('cb' + cbsArray[i].id.replace(/pnl/g, '') );
                                if ( cb.getId() != currentComboId ){
                                    label = cb.valueField;
                                    inputArray = strFilteredTable.collect(label);
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

                var strPopulations = new LABKEY.ext.Store({
                    autoLoad: true,
                    queryName: 'Population',
                    schemaName: 'opencyto_preprocessing'
                });


                var strngSqlStartProj = 'SELECT projections.x_axis || \' / \' || projections.y_axis AS projection FROM projections ';
                var strngSqlEndProj = 'ORDER BY projection';

                var strProjections = new LABKEY.ext.Store({
                    autoLoad: false,
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
                    autoLoad: true,
                    data: [],
                    fields: ['Flag', 'Name']
                });


//////////////////////////////////////////////////////////////////
//             Queries and associated functionality             //
//////////////////////////////////////////////////////////////////
                function fetchKeywords(){
//                    LABKEY.Query.selectRows({
//                        columns: ['Name'],
//                        filterArray: [
//                            LABKEY.Filter.create('Name', 'DISPLAY;BS;MS', LABKEY.Filter.Types.CONTAINS_NONE_OF),
//                            LABKEY.Filter.create('Name', ['$','LASER','EXPORT'], LABKEY.Filter.Types.DOES_NOT_START_WITH)
//                        ],
//                        queryName: 'Keyword',
//                        schemaName: 'flow',
//                        success:
//                                function(data){
//                                    var len = data.rowCount, i;
//                                    for ( i = 0; i < len; i ++ ){
//                                        listStudyVars.push( ['Keyword', data.rows[i].Name ]);
//                                    }
//
                                    strStudyVarName.loadData( listStudyVars );
//                                },
//                        failure: onFailure
//                    });
                }

                LABKEY.Query.getQueries({
                    schemaName: 'Samples',
                    success: function( queriesInfo ){
                        var queries = queriesInfo.queries, count = queries.length, j;
                        for ( j = 0; j < count; j ++ ){
                            if ( queries[j].name == 'Samples' ){
                                j = count;
                            }
                        }

                        if ( j == count + 1 ){
                            LABKEY.Domain.get( function( DomainDesign ) {
                                        var array, len, i;
                                        array = DomainDesign.fields;
                                        len = array.length;
                                        for ( i = 0; i < len; i ++ ){
                                            listStudyVars.push( [array[i].name, array[i].name] );
//                                            listStudyVars.push( ['Sample', array[i].name] );
                                        }

                                        fetchKeywords();
                                    },
                                    fetchKeywords, "Samples", "Samples"
                            );
                        }
                    },
                    failure: fetchKeywords
                });


                LABKEY.Query.selectRows({
                    columns: ['RootPath'],
                    failure: onFailure,
                    queryName: 'RootPath',
                    schemaName: 'flow',
                    success: onRootPathSuccess
                });

                function onRootPathSuccess(data){
                    if ( data.rowCount == 1 ){
                        rootPath = data.rows[0].RootPath;
                    } else{
                        // disable all
                        panelSettings.disable();
                        panelPlotting.disable();
                        panelPlotting.getEl().mask('Cannot retrieve the path for the data files: it is either non-unique or empty' + strngErrorContactWithLink, 'infoMask')
                    }
                };


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

                        LABKEY.Query.executeSql({
                            failure: onFailure,
                            sql: strngAxisChoices,
                            schemaName: 'flow',
                            success: onAxisChoicesSuccessPartII
                        });
                    } else{
                        // disable all
                        panelSettings.disable();
                        panelPlotting.disable();
                        panelPlotting.getEl().mask('Cannot retrieve the keyword names containing the axes choices' + strngErrorContactWithLink, 'infoMask');
                    }
                };

// IE 7 compatibility
                Object.keys = Object.keys || (function () {
                    var hasOwnProperty = Object.prototype.hasOwnProperty,
                            hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
                            DontEnums = [
                                'toString',
                                'toLocaleString',
                                'valueOf',
                                'hasOwnProperty',
                                'isPrototypeOf',
                                'propertyIsEnumerable',
                                'constructor'
                            ],
                            DontEnumsLength = DontEnums.length;

                    return function (o) {
                        if (typeof o != "object" && typeof o != "function" || o === null)
                            throw new TypeError("Object.keys called on a non-object");

                        var result = [];
                        for (var name in o) {
                            if (hasOwnProperty.call(o, name))
                                result.push(name);
                        }

                        if (hasDontEnumBug) {
                            for (var i = 0; i < DontEnumsLength; i++) {
                                if (hasOwnProperty.call(o, DontEnums[i]))
                                    result.push(DontEnums[i]);
                            }
                        }

                        return result;
                    };
                })();

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
                            panelSettings.disable();
                            panelPlotting.disable();
                            panelPlotting.getEl().mask('There was an error in forming the axes choices: marker/channel lengths mismatch' + strngErrorContactWithLink, 'infoMask');
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
                        panelSettings.disable();
                        panelPlotting.disable();
                        panelPlotting.getEl().mask('Cannot retrieve the axes choices: they are empty' + strngErrorContactWithLink, 'infoMask');
                    }
                };


/////////////////////////////////////
//          ComboBoxes             //
/////////////////////////////////////
                var cbFileName = new Ext.ux.ResizableLovCombo({
                    addSelectAllItem: false,
                    allowBlank: true,
                    autoSelect: false,
                    displayField: 'FileName',
                    emptyText: 'Select...',
                    forceSelection: true,
                    listeners: {
                        select: setTablePanelTitle
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

                var cbStudyVarName = new Ext.ux.form.SuperBoxSelect({
                    allowBlank: true,
                    autoSelect: false,
                    displayField: 'Name',
                    emptyText: 'Select...',
                    forceSelection: true,
                    lazyInit: false,
                    listeners: {
                        additem: function(){
                            btnSetStudyVars.setDisabled(false);
                            btnSetStudyVars.setText('Set study variables');
                        },
                        clear: function(){
                            btnSetStudyVars.setDisabled(false);
                            btnSetStudyVars.setText('Set study variables');
                        },
//                        focus: function (){ // display the dropdown on focus
//                            this.doQuery('',true);
//                        },
                        removeitem: function(){
                            btnSetStudyVars.setDisabled(false);
                            btnSetStudyVars.setText('Set study variables');
                        }
                    },
                    minChars: 0,
                    mode: 'local',
                    resizable: true,
                    store: strStudyVarName,
                    triggerAction: 'all',
                    typeAhead: true,
                    valueDelimiter: ';',
                    valueField: 'Flag'
                });

                var cbPops = new Ext.ux.ResizableCombo({
                    allowBlank: true,
                    autoSelect: false,
                    displayField: 'path',
                    emptyText: 'Select...',
                    forceSelection: true,
                    listeners: {
                        change: function(){
                            if ( this.getValue() == '' ){
                                cbProjs.clearValue();
                                cbProjs.setDisabled( true );
                            } else {
                                cbProjs.setDisabled( false );
                            }
                        },
                        select: function(){
                            if ( this.getValue() == '' ){
                                cbProjs.clearValue();
                                cbProjs.setDisabled( true );
                            } else {
                                cbProjs.setDisabled( false );
                            }

                            filterProjections();
                        }
                    },
                    minChars: 0,
                    mode: 'local',
                    resizable: true,
                    store: strPopulations,
                    tpl: '<tpl for="."><div class="x-combo-list-item">{path:htmlEncode}</div></tpl>',
                    triggerAction: 'all',
                    typeAhead: true,
                    valueField: 'name'
                });

                var cbProjs = new Ext.ux.ResizableCombo({
                    allowBlank: true,
                    autoSelect: false,
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
                    store: strProjections,
                    tpl: '<tpl for="."><div class="x-combo-list-item">{projection:htmlEncode}</div></tpl>',
                    triggerAction: 'all',
                    typeAhead: false,
                    valueField: 'projection'
                });

                strProjections.on({
                    'load': function(){
                        var count = this.getCount();

                        if ( count == 1 ){
                            cbProjs.setValue( this.getAt(0).data.projection );

                            setAxes();

                        } else if ( count > 1 ){
                            if ( cbPops.getValue() != '' ){
                                cbPops.triggerBlur();
                                cbProjs.focus();

                                cbXAxis.clearValue();
                                cbYAxis.clearValue();

                                if ( ! cbProjs.isExpanded() ){
                                    cbProjs.expand();
                                }
                            }
                        }
                    }
                });

                var cbXAxis = new Ext.ux.ResizableCombo({
                    allowBlank: true,
                    autoSelect: false,
                    displayField: 'XInclMarker',
                    emptyText: 'Select...',
                    forceSelection: true,
                    listeners:{
                        change: function(){
//                if ( this.getValue() != 'Time' && this.getValue() != '' && cbYAxis.getValue() != '' ){
//                    chAppendFileName.show();
//                    chEnableGrouping.show();
//                } else{
//                    chAppendFileName.hide();
//                    chEnableGrouping.hide();
//                }
                            cbYAxis.clearValue();

                            cbProjs.clearValue();
                        },
                        select: function(){
//                if ( this.getValue() != 'Time' && cbYAxis.getValue() != '' ){
//                    chAppendFileName.show();
//                    chEnableGrouping.show();
//                } else{
//                    chAppendFileName.hide();
//                    chEnableGrouping.hide();
//                }
                            cbYAxis.clearValue();

                            cbProjs.clearValue();
                        }
                    },
                    minChars: 0,
                    mode: 'local',
                    store: strXAxis,
                    tpl: '<tpl for="."><div class="x-combo-list-item">{XInclMarker:htmlEncode}</div></tpl>',
                    triggerAction: 'all',
                    typeAhead: true,
                    valueField: 'XChannel'
                });

                var cbYAxis = new Ext.ux.ResizableCombo({
                    allowBlank: true,
                    autoSelect: false,
                    displayField: 'YInclMarker',
                    emptyText: 'Select...',
                    forceSelection: true,
                    listeners:{
                        change: function(){
                            checkForControls();
                            cbProjs.clearValue();
                        },
                        select: function(){
                            checkForControls();
                            cbProjs.clearValue();
                        }
                    },
                    minChars: 0,
                    mode: 'local',
                    store: strYAxis,
                    tpl: '<tpl for="."><div class="x-combo-list-item">{YInclMarker:htmlEncode}</div></tpl>',
                    triggerAction: 'all',
                    typeAhead: true,
                    valueField: 'YChannel'
                });


/////////////////////////////////////
//             Buttons             //
/////////////////////////////////////
                var btnGraph = new Ext.Button({
                    cls: 'x-btn-over',
                    handler: plotFiles,
                    listeners: {
                        mouseout: function(){
                            this.el.addClass('x-btn-over');
                        }
                    },
                    text: 'Graph'
                });

                var btnClearFilters = new Ext.Button({
                    cls: 'x-btn-over',
                    handler: function(){
                        strFilteredTable.setUserFilters([]);
                        strFilteredTable.load();

                        currentComboId = undefined;

                        var i, len, curCombo, curString;
                        var cbsArray = $('.ui-state-default > div:first-child');

                        len = cbsArray.length;
                        for ( i = 0; i < len; i ++ ){
                            curString = cbsArray[i].id.replace(/pnl/g, '')
                            curCombo = Ext.getCmp('cb' + curString );
                            curCombo.clearValue();
                        }
                    },
                    listeners: {
                        mouseout: function(){
                            this.el.addClass('x-btn-over');
                        }
                    },
                    text: 'Clear all'
                });

                var btnSetStudyVars = new Ext.Button({
                    handler: setStudyVars,
                    text: 'Set study variables'
                });


/////////////////////////////////////
//             Web parts           //
/////////////////////////////////////
                var graphWebPartConfig = {
                    reportId:'module:OpenCytoVisualization/Plot.r',
//                showSection: 'Graph.png', // comment out to show debug output
                    title:'Graphs'
                };

                var resizableImage;

                var graphWebPart = new LABKEY.WebPart({
                    failure: onFailure,
                    frame: 'none',
                    partConfig: graphWebPartConfig,
                    partName: 'Report',
                    renderTo: 'divGraph' + config.webPartDivId,
                    success: function(){
                        tlbrGraph.setDisabled(false);
                        maskGraph.hide();

                        if ( $('.labkey-error').length > 0 ){
                            removeById('resultImage');
                            alert('Failure: there was an error while executing this command' + strngErrorContact);
                            panelGraph.getEl().frame("ff0000");
                        } else {

                            resizableImage = new Ext.Resizable('resultImage', {
                                wrap:true,
                                pinned:true,
                                maxHeight: panelStudyVars.getWidth(),
                                maxWidth: panelStudyVars.getWidth(),
                                minHeight: 50,
                                minWidth:50,
                                width: 2/3*panelStudyVars.getWidth(),
                                height: 2/3*panelStudyVars.getWidth(),
                                preserveRatio: true,
                                dynamic:true,
                                handles: 's'
                            });

//                            $( '#resultImage' )[0].src; // the address of the image!

                        }
                    }
                });

// Mask for the plot
                var maskGraph = new Ext.LoadMask('divGraph' + config.webPartDivId, {
                    msg: "Generating the graphics, please, wait..."
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


/////////////////////////////////////
//  Panels, Containers, Components //
/////////////////////////////////////
                var cmpStudyVars = new Ext.Component({
                    cls: 'bold-centered-text',
                    html: 'Please, select the study variables that are of interest:'
                });

                var panelSettings = new Ext.Panel({
                    autoHeight: true,
                    defaults: {
                        style: 'padding-bottom: 4px; padding-right: 4px; padding-left: 4px;'
                    },
//        forceLayout: true,
                    items: [
                        cmpStudyVars,
                        new Ext.Panel({
                            border: false,
                            items: [ cbStudyVarName ],
                            layout: 'fit'
                        }),
                        btnSetStudyVars
                    ],
//        monitorResize: true,
                    title: 'Settings'
                });

/////////////////////////////////////

                new Ext.Container({
                    height: 40,
                    html: 'Population',
                    items: [cbPops],
                    layout: 'vbox',
                    renderTo: 'divPops' + config.webPartDivId
                });

                new Ext.Container({
                    height: 40,
                    html: 'Projection',
                    items: [cbProjs],
                    layout: 'vbox',
                    renderTo: 'divProjs' + config.webPartDivId
                });

                new Ext.Container({
                    height: 40,
                    html: 'X-Axis',
                    items: [cbXAxis],
                    layout: 'vbox',
                    renderTo: 'divXAxis' + config.webPartDivId
                });

                new Ext.Container({
                    height: 40,
                    html: 'Y-Axis',
                    items: [cbYAxis],
                    layout: 'vbox',
                    renderTo: 'divYAxis' + config.webPartDivId
                });

                var panelOptions = new Ext.Panel(
                        {
                            border: true,
                            collapsible: true,
                            contentEl: 'divList' + config.webPartDivId,
                            title: 'Plotting options'
                        }
                );

                var panelTable = new Ext.grid.GridPanel({
                    autoScroll: true,
                    bbar: new Ext.Toolbar({
                        items: [ cbFileName ]
                    }),
                    collapsed: true,
                    collapsible: true,
                    columns: [
                        {
                            dataIndex: 'FileName',
                            header: 'File Name',
                            resizable: true,
                            sortable: true
                        }
                    ],
                    headerCssClass: 'right-text',
                    height: 200,
                    plugins: ['autosizecolumns'],
                    store: strFilteredTable,
                    stripeRows: true,
                    title:'Table of the files',
                    viewConfig:
                    {
                        emptyText: 'No rows to display',
//            forceFit: true,
                        splitHandleWidth: 10
                    }
                });

                strFilteredTable.on({
                    'load': setTablePanelTitle
                });

                var panelStudyVars = new Ext.Panel({
                    bbar: new Ext.Toolbar({
                        items: [ btnClearFilters ]
                    }),
                    border: true,
                    collapsible: true,
                    items: [
                        {
                            border: false,
                            contentEl: 'ulSortable' + config.webPartDivId,
                            layout: 'fit'
                        },
                        panelTable
                    ],
                    title: 'Selected study variables: (drag and drop the study variable\'s name to change the grouping order)'
                });

                var tlbrGraph = new Ext.Toolbar({
                    items: [ btnGraph, chEnableGrouping, chAppendFileName ]
                });

                var panelGraph = new Ext.Panel({
                    border: true,
                    collapsible: true,
                    contentEl: 'divGraph' + config.webPartDivId,
                    tbar: tlbrGraph,
                    title: 'Plot'
                });

                var panelPlotting = new Ext.Panel({
                    autoHeight: true,
                    defaults: {
                        style: 'padding-top: 4px; padding-bottom: 4px; padding-right: 4px; padding-left: 4px;'
                    },
                    hideMode: 'offsets',
                    items: [
                        panelOptions,
                        panelStudyVars,
                        panelGraph
                    ],
                    title: 'Explore'
                });


                var panelTabs = new Ext.TabPanel({
                    activeTab: 1,
                    autoHeight: true,
                    deferredRender: false,
                    items: [ panelSettings, panelPlotting ],
                    width: '100%'
                });


/////////////////////////////////////
//             Functions           //
/////////////////////////////////////
                function checkForControls(){
                    if ( cbYAxis.getValue() != '' && cbXAxis.getValue() != '' && cbXAxis.getValue() != 'Time' ){
                        chAppendFileName.show();
                        chEnableGrouping.show();
                    } else{
                        chAppendFileName.hide();
                        chEnableGrouping.hide();
                    }
                }

                function setTablePanelTitle(){
                    var num = cbFileName.getCheckedArray().length;
                    if ( num == 1 ){
                        panelTable.setTitle( '1 file is currently selected&nbsp' );
                    } else {
                        panelTable.setTitle( num + ' files are currently selected&nbsp' );
                    }
                };

                function setAxes(){
                    cbXAxis.clearValue();
                    cbYAxis.clearValue();

                    var axes = cbProjs.getValue().split(' / ');

                    cbXAxis.setValue( axes[0] );
                    cbYAxis.setValue( axes[1] );

                    checkForControls();
                };

                function filterProjections(){
                    var tempSQL = strngSqlStartProj + 'WHERE name = \'' + cbPops.getValue() + '\' ' + strngSqlEndProj;

                    cbProjs.clearValue();

                    strProjections.setSql( tempSQL );
                    strProjections.load();
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
                        filterArrayToApply.push( LABKEY.Filter.create(cb.valueField, filesFilter.join(';'), LABKEY.Filter.Types.IN) );
                    }/* else { WHAT TO DO IF NOTHING IS SELECTED!
                     filterArrayToApply = [];
                     }*/

                    strFilteredTable.setUserFilters(filterArrayToApply);
                    strFilteredTable.load();
                };

                function renderPlot(){
                    var i, len, curCombo, curString, count, prod = 1;
                    var cbsArray = $('.ui-state-default > div:first-child');
                    var groupArray = [];

                    len = cbsArray.length;
                    if ( len == 0 ){ prod = cbFileName.getCheckedArray().length; }
                    for ( i = 0; i < len; i ++ ){
                        curString = cbsArray[i].id.replace(/pnl/g, '')
                        curCombo = Ext.getCmp('cb' + curString );
                        curString = curString.replace( config.webPartDivId, '' );
                        curString = curString.replace(/_/g, ' ');
                        if ( curCombo.getId() == currentComboId ){
                            prod *= curCombo.getCheckedArray().length;
                            groupArray.unshift(curString);
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
                        graphWebPartConfig.flagEnableGrouping = 'NO';

                        prod = cbFileName.getCheckedArray().length;
                    } else{
                        graphWebPartConfig.flagEnableGrouping = 'YES';

                        if ( cbFileName.getCheckedArray().length == 1 ){
                            prod = 1;
                        }
                    }

                    if ( chAppendFileName.getValue() ){
                        graphWebPartConfig.flagAppendFileName = 'YES';

                        if ( chEnableGrouping.getValue() ){
                            prod *= cbFileName.getCheckedArray().length;
                        }
                    } else{
                        graphWebPartConfig.flagAppendFileName = 'NO';
                    }
                    graphWebPartConfig.dimension = prod;
                    graphWebPartConfig.studyVars = groupArray.join(';');
                    graphWebPartConfig.population = cbPops.getValue();
                    graphWebPartConfig.path = rootPath;
                    graphWebPartConfig.imageWidth = 900; // panelStudyVars.getWidth();

                    maskGraph.show();
                    graphWebPart.render();
                }

                function plotFiles() {
                    tlbrGraph.setDisabled(true);

                    graphWebPartConfig.xAxis = cbXAxis.getValue();
                    graphWebPartConfig.yAxis = cbYAxis.getValue();
                    graphWebPartConfig.xLab = cbXAxis.getRawValue();
                    graphWebPartConfig.yLab = cbYAxis.getRawValue();

                    if ( graphWebPartConfig.xAxis == '' & graphWebPartConfig.yAxis == '' ){
                        alert('Both axis choices cannot be blank!');
                        tlbrGraph.setDisabled(false);
                        return;
                    }
                    if ( graphWebPartConfig.yAxis != '' & graphWebPartConfig.xAxis == '' ){
                        alert('If you provided the y-axis choice, ' +
                                'then you must provide an x-axis choice as well');
                        tlbrGraph.setDisabled(false);
                        return;
                    }
                    if ( graphWebPartConfig.xAxis == 'Time' & graphWebPartConfig.yAxis == '' ){
                        alert('If you selected "Time" for the x-axis,' +
                                ' you must provide a y-axis choice as well');
                        tlbrGraph.setDisabled(false);
                        return;
                    }
                    graphWebPartConfig.filesNames = cbFileName.getValue();
                    if ( graphWebPartConfig.filesNames == '' ){
                        alert('No files are selected to be plotted!');
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
                    var i, j, inputArray, innerLen, len, curElemOrig, curElemMod, tempSQL, newColumns;

                    // Grab the choices array
                    var arrayStudyVars = cbStudyVarName.getValueEx();

                    // Elliminate all of the previous choices
                    $('#ulSortable' + config.webPartDivId).empty();
                    newColumns =
                            [
                                {
                                    dataIndex: 'FileName',
                                    header: 'File Name',
//                        id: 'FileName',
                                    resizable: true,
                                    sortable: true
                                }
                            ];
                    tempSQL = strngSqlStartTable;
                    currentComboId = undefined;
                    strFilteredTable.setUserFilters([]);

                    len = arrayStudyVars.length;

                    for ( i = 0; i < len; i ++ ){
                        curElemOrig = arrayStudyVars[i].Name;
                        curElemMod = curElemOrig.replace(/ /g, '_');

                        tempSQL += ', FCSFiles.Sample."' + curElemOrig + '" AS ' + curElemMod;
//                        tempSQL += ', FCSFiles.' + arrayStudyVars[i].Flag + '."' + curElemOrig + '" AS ' + curElemMod;

                        $('#ulSortable' + config.webPartDivId).append(
                                '<li class="ui-state-default">' +
                                        '<div id="pnl' + curElemMod + config.webPartDivId + '"></div>' +
                                '</li>'
                        );

                        new Ext.Panel({
                            border: true,
                            headerCssClass: 'draggableHandle',
                            items: [
                                temp = new Ext.ux.ResizableLovCombo({
                                    allowBlank: true,
                                    autoSelect: false,
                                    displayField: curElemMod,
                                    emptyText: 'Select...',
                                    forceSelection: true,
                                    id: 'cb' + curElemMod + config.webPartDivId,
                                    listeners: {
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
                                                fields: [{ name: curElemMod, type: 'string' }],
						sortInfo: {
                                                    field: curElemMod,
                                                    direction: 'ASC'
                                                }
                                            })
                                    ,
//                        tpl:'<tpl for=".">' +
//                                '<div class="x-combo-list-item">{[values["' +
//                                this.keyColumn + '"]!==null ? values["' + this.displayColumn + '"] : "' +
//                                (Ext.isDefined(this.lookupNullCaption) ? this.lookupNullCaption : '[other]') +'"]}' +
//                                '</div>' +
//                            '</tpl>',
                                    triggerAction: 'all',
                                    typeAhead: true,
                                    valueField: curElemMod
                                })
                            ],
                            layout: 'fit',
                            renderTo: 'pnl' + curElemMod + config.webPartDivId,
                            title: curElemOrig,
                            tools: closeTool
                        });

                        newColumns.push(
                                {
                                    dataIndex: curElemMod,
                                    header: curElemOrig,
                                    resizable: true,
                                    sortable: true
                                }
                        );

                    } // end of for ( i = 0; i < len; i ++ ) loop

                    tempSQL += strngSqlEndTable;

                    strFilteredTable.setSql( tempSQL );
                    strFilteredTable.load();

                    panelTable.reconfigure( panelTable.getStore(), new Ext.grid.ColumnModel(newColumns) );

                    btnSetStudyVars.getEl().frame();
                    btnSetStudyVars.setDisabled(true);
                    btnSetStudyVars.setText('Study variables set');
                }; // end of setStudyVars()

// jQuery-related initializations

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

                function onFailure(errorInfo, options, responseObj){
                    if (errorInfo && errorInfo.exception)
                        alert('Failure: ' + errorInfo.exception + strngErrorContact);
                    else{
                        if ( responseObj != undefined ){
                            alert('Failure: ' + responseObj.statusText + strngErrorContact);
                        } else {
                            alert('Failure: ' + strngErrorContact);
                        }
                    }
                };

                function captureEvents(observable) {
                    Ext.util.Observable.capture(
                            observable,
                            function(eventName) {
                                console.info(eventName);
                            },
                            this
                    );
                };

//                captureEvents( panelTable.getBottomToolbar() );

                this.border = false;
                this.boxMinWidth = 370;
                this.frame = false;
                this.items = [ panelTabs ];
                this.layout = 'fit';
                this.renderTo = config.webPartDivId;
                this.webPartDivId = config.wePartDivId;

                this.panelTable = panelTable;
                this.panelStudyVars = panelStudyVars;
                this.resizableImage = resizableImage;


                LABKEY.ext.OpenCytoVisualization.superclass.constructor.apply(this, arguments);

            }, // end constructor

            resize: function(){
                this.panelTable.getView().refresh();

                webPartContentWidth = document.getElementById(this.webPartDivId).offsetWidth; // ?

                // none of the below works :(

//                LABKEY.Utils.resizeToViewport( this, webPartContentWidth, -1 ); //, 40, 50 );
/*
                this.panelTable.bbar.setWidth("auto");
                this.panelTable.bbar.setSize("auto");
                this.panelTable.bbar.setWidth( this.panelTable.getWidth() );
                this.panelTable.bbar.setSize( this.panelTable.getWidth() );
                this.panelTable.getBottomToolbar().doLayout( false, true );
*/

//                 if ( typeof resizableImage != 'undefined' ){
//                 if ( $('#resultImage').width() > 2/3*panelStudyVars.getWidth() ){
//                 resizableImage.resizeTo( 2/3*panelStudyVars.getWidth(), 2/3*panelStudyVars.getWidth() );
//                 }
//                 }
            }
        }
); // end OpenCytoVisualization Panel class
