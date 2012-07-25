
Ext.namespace('FlowGraph');

var webPartDiv;

//FlowGraph.setWebPartDivId =
function setWebPartDiv( inputToSetTo ){
    webPartDiv = inputToSetTo;
};

function removeById(elId) {
    $("#"+elId).remove();
};

function removeByClass(className) {
    $("."+className).remove();
};


Ext.onReady( function() {

    /////////////////////////////////////
    //            Variables            //
    /////////////////////////////////////
    var currentComboId;
    var webPartContentWidth = document.getElementById(webPartDivId).offsetWidth;

    /////////////////////////////////////
    //             Strings             //
    /////////////////////////////////////
    var strngErrorContact = '. Please, contact ldashevs@fhcrc.org for support.';
    var strngErrorContactWithLink = '. Please, contact the <a href="mailto:ldashevs@fhcrc.org?Subject=FlowGraph%20Support">developer</a>.'

    var strngSqlStart = 'SELECT DISTINCT FCSFiles.Name AS FileName';
    var strngSqlEnd =
            ' FROM FCSFiles' +
            ' WHERE FCSFiles.Run."Analysis Folder"."Flow Experiment Runs" = true' +
            ' ORDER BY FileName';


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


    /////////////////////////////////////
    //            Stores I             //
    /////////////////////////////////////
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

    //////////////////////////////////////////////////////////////////
    //             Queries and associated functionality             //
    //////////////////////////////////////////////////////////////////
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
            panelSetup.disable();
            panelPlotting.disable();
            panelSetup.getEl().mask('Cannot retrieve the path for the data files: it is either non-unique or empty' + strngErrorContactWithLink, 'infoMask')
        }
    };


    LABKEY.Query.selectRows({
        columns: ['KeywordName'],
        failure: onFailure,
        filterArray: [
            LABKEY.Filter.create('KeywordName', '$P', LABKEY.Filter.Types.STARTS_WITH),
            LABKEY.Filter.create('KeywordName', 'N;S', LABKEY.Filter.Types.CONTAINS_ONE_OF)
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
                strngAxisChoices += 'FCSFiles.Keyword."' + data.rows[i].KeywordName + '", ';
            }
            strngAxisChoices += 'FCSFiles.Keyword."' + data.rows[i].KeywordName + '" FROM FCSFiles';

            LABKEY.Query.executeSql({
                failure: onFailure,
                sql: strngAxisChoices,
                schemaName: 'flow',
                success: onAxisChoicesSuccessPartII
            });
        } else{
            // disable all
            panelSetup.disable();
            panelPlotting.disable();
            panelSetup.getEl().mask('Cannot retrieve the keyword names containing the axes choices' + strngErrorContactWithLink, 'infoMask');
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
        if ( data.rowCount == 1 ){

            var tempObj = data.rows[0], tempArray = Object.keys(tempObj), arrayToBuild = [];
            var j, len, N, S, tmpCh, tmpMr, FSC, SSC;

            len = tempArray.length;

            for ( j = 0; j < len; j ++ ){
                N = tempArray[ j ];
                tmpCh = tempObj[ N ];
                if ( N.search('N') >= 0 && tmpCh != 'Time' ){

                    if ( tmpCh.search('FSC') >= 0 ){
                        FSC = tmpCh;
                    } else if ( tmpCh.search('SSC') >= 0 ){
                        SSC = tmpCh;
                    } else {
                        if ( tmpCh.search('FSC') >= 0 ){
                            FSC = tmpCh;
                        } else{
                            S = N.replace('N', 'S');
                            tmpMr = tempObj[ S ];
                            if ( tmpMr != undefined ){
                                tmpMr = tmpMr.replace( tmpCh, '').concat( ' <', tmpCh, '>' );
                            }

                            arrayToBuild.push( [ tmpCh, tmpMr ] );
                        }
                    }
                }
            }

            arrayToBuild.unshift( [SSC,SSC] );
            arrayToBuild.unshift( [FSC,FSC] );
            arrayToBuild.unshift( ['Time','Time'] );

            strXAxis.loadData( arrayToBuild );

            arrayToBuild.shift();

            strYAxis.loadData( arrayToBuild );
            // dataYAxis.unshift( ['[histrogram]'] );

        } else{
            // disable all
            panelSetup.disable();
            panelPlotting.disable();
            panelSetup.getEl().mask('Cannot retrieve the axes choices: they are either empty or non-unique' + strngErrorContactWithLink, 'infoMask');
//            console.log('Error, cannot retrieve the axes choices: they are either empty or non-unique' + strngErrorContact);
        }
    };


    /////////////////////////////////////
    //            Stores II            //
    /////////////////////////////////////
    //    .bindStore(newStore);
    var strFilteredTable = new LABKEY.ext.Store({
        autoLoad: false,
        listeners: {
            load: function(){
                cbFileName.selectAll();

                document.getElementById('filesLabel').innerHTML =
                        cbFileName.getCheckedArray().length + ' files are currently selected';

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
        sql: strngSqlStart + strngSqlEnd
    });

    var strStudyVarName = new LABKEY.ext.Store({
        autoLoad: true,
        filterArray: [
            LABKEY.Filter.create('KeywordName', 'DISPLAY;BS;MS', LABKEY.Filter.Types.CONTAINS_NONE_OF),
            LABKEY.Filter.create('KeywordName', ['$','LASER','EXPORT'], LABKEY.Filter.Types.DOES_NOT_START_WITH)
        ],
        queryName: 'Keyword',
        remoteSort: false,
        schemaName: 'flow',
        sort: 'KeywordName'
    });


    /////////////////////////////////////
    //          ComboBoxes I           //
    /////////////////////////////////////
    var cbFileName = new Ext.ux.ResizableLovCombo({
        addSelectAllItem: false,
        allowBlank: true,
        displayField: 'FileName',
        emptyText: 'Select...',
        fieldLabel: 'Files',
        forceSelection: true,
        listeners: {
            select: function(){
                document.getElementById('filesLabel').innerHTML =
                        cbFileName.getCheckedArray().length + ' files are currently selected';
            }
        },
        minChars: 0,
        mode: 'local',
        resizable: true,
        selectOnFocus: true,
        store: strFilteredTable,
        triggerAction: 'all',
        typeAhead: true,
        valueDelimeter: ',',
        valueField: 'FileName'
    });

    var cbStudyVarName = new Ext.ux.form.SuperBoxSelect({
        allowBlank: true,
        displayField: 'KeywordName',
        emptyText: 'Select...',
        forceSelection: true,
        listeners: {
            additem: function(){
                btnSetStudyVars.setDisabled(false);
                btnSetStudyVars.setText('Set study variables');
            },
            clear: function(){
                btnSetStudyVars.setDisabled(false);
                btnSetStudyVars.setText('Set study variables');
            },
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
        valueField: 'KeywordName'
    });


    /////////////////////////////////////
    //             Buttons             //
    /////////////////////////////////////
    var btnGraph = new Ext4.Button({
        handler: plotFiles,
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
        text: 'Clear all of the applied filters'
    });

    var btnNcdf = new Ext.Button({
        handler: function() {
            this.setDisabled(true);
            var divHidden = document.getElementById(cmpNcdf.contentEl);
            if( divHidden ) { divHidden.innerHTML = 'Processing FCS files, if needed, please, wait...'; }

            ncdfWebPartConfig.path = rootPath;

            ncdfWebPart.render();
        },
        text: 'Generate NetCDF file'
    });

    var btnSetStudyVars = new Ext.Button({
        handler: setStudyVars,
        text: 'Set study variables'
    });


    /////////////////////////////////////
    //             Web parts           //
    /////////////////////////////////////
    var graphWebPartConfig = {
        reportId:'module:FlowGraph/FlowGraph.r',
//        showSection: 'Graph.png', // comment out to show debug output
        title:'Graphs'
    };

    var resizableImage;

    var graphWebPart = new LABKEY.WebPart({
        failure: onFailure,
        frame: 'none',
        partConfig: graphWebPartConfig,
        partName: 'Report',
        renderTo: 'divGraph',
        success: function(){
            btnGraph.setDisabled(false);
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

                $( '#resultImage' )[0].src;
                console.log( $( '#resultImage' ) );

            }
        }
    });

    var ncdfWebPartConfig = {
        reportId:'module:FlowGraph/FlowNcdf.r',
        showSection: 'textOutput', // comment out to show debug output
        title:'HiddenDiv'
    };

    var ncdfWebPart = new LABKEY.WebPart({
        frame: 'none',
        partConfig: ncdfWebPartConfig,
        partName: 'Report',
        renderTo: 'divNcdf',
        success: function(){
//            btnNcdf.setDisabled(false);
        }
    });

    // Mask for the plot
    var maskGraph = new Ext.LoadMask('divGraph', {
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
    //              Slider             //
    /////////////////////////////////////
    var sldrBin = new Ext.Slider({
        value: 256,
        increment: 10,
        minValue: 0,
        maxValue: 100
    });


    /////////////////////////////////////
    //  Panels, Containers, Components //
    /////////////////////////////////////
    var cmpNcdf = new Ext.Component({
        contentEl: 'divNcdf'
    });

    var cmpStudyVars = new Ext.Component({
        html: '<div class="bold-centered-text">Please, select the study variables that are of interest:</div>'
    });

    var panelSetup = new Ext.Panel({
        autoHeight: true,
        defaults: {
            style: 'padding-bottom: 4px; padding-right: 4px; padding-left: 4px;'
        },
//        forceLayout: true,
        items: [
            btnNcdf,
            cmpNcdf,
            cmpStudyVars,
            new Ext.Panel({
                border: false,
                items: [ cbStudyVarName ],
                layout: 'fit'
            }),
            btnSetStudyVars
        ],
//        monitorResize: true,
        title: 'Setup'
    });


    var panelStudyVars = new Ext.Panel({
        bbar: new Ext.Toolbar({
            buttonAlign: 'center',
            items: [ btnClearFilters ]
        }),
        border: true,
        collapsible: true,
        contentEl: 'ulSortable',
        title: '<center>' +
               'Selected study variables:<br />(drag and drop the study variable\'s name to change the grouping order)' +
               '</center>'
    });

    var tlbrGraph = new Ext.Toolbar({
        buttonAlign: 'center',
        items: [ btnGraph, chEnableGrouping, chAppendFileName ]
    });

    var panelGraph = new Ext.Panel({
        border: true,
        collapsible: true,
        contentEl: 'divGraph',
        tbar: tlbrGraph,
        title: '<center>Plot</center>'
    });

    var panelTable = new Ext.grid.GridPanel({
        autoScroll: true,
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
        height: 200,
        plugins: ['autosizecolumns'],
        store: strFilteredTable,
        stripeRows: true,
        title:'<center>Files Table</center>',
        viewConfig:
        {
            emptyText: 'No rows to display',
//            forceFit: true,
            splitHandleWidth: 10
        }
    });

    var cmpDimensions = new Ext.Component({
        html:   '<table class="centered-table">' +
                    '<tr>' +
                        '<th>X-Axis</th>' +
                        '<th>Y-Axis</th>' +
                    '</tr>' +
                    '<tr>' +
                        '<td><div id="cbBoxXAxis"></div></td>' +
                        '<td><div id="cbBoxYAxis"></div></td>' +
                    '</tr>' +
                '</table>'
    });

    var panelPlotting = new Ext.Panel({
        autoHeight: true,
        defaults: {
            style: 'padding-bottom: 4px; padding-right: 4px; padding-left: 4px;'
        },
        hideMode: 'offsets',
        items: [
            panelStudyVars,
            cmpDimensions,
            new Ext.Component({ html: '<div id="filesLabel" class="bold-centered-text">Files</div>' }),
            new Ext.Panel({
                border: false,
                items: [ cbFileName ],
                layout: 'fit'
            }),
            panelGraph,
            panelTable
        ],
        title: 'Explore'
    });

    var panelTabs = new Ext.TabPanel({
        activeTab: 0,
        autoHeight: true,
        deferredRender: false,
        items: [ panelSetup, panelPlotting ],
        width: '100%'
    });

    var panelContainer = new Ext.Panel({
        border: false,
        boxMinWidth: 370,
        frame: false,
        items: [ panelTabs ],
        layout: 'fit',
        renderTo: 'divTabs'
    });


    /////////////////////////////////////
    //          ComboBoxes II          //
    /////////////////////////////////////
/*
    var cbPops = new Ext.form.ComboBox({
        allowBlank: true,
        displayField: 'YAxisDim',
        emptyText: 'Select...',
        forceSelection: true,
        minChars: 0,
        mode: 'local',
        renderTo: 'cbBoxPops',
        store: [],
        triggerAction: 'all',
        typeAhead: true,
        valueField: 'YAxisDim'
    });
*/

    var cbXAxis = new Ext.ux.ResizableCombo({
        allowBlank: true,
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
            }
        },
        minChars: 0,
        mode: 'local',
        renderTo: 'cbBoxXAxis',
        store: strXAxis,
        tpl: '<tpl for="."><div class="x-combo-list-item">{XInclMarker:htmlEncode}</div></tpl>',
        triggerAction: 'all',
        typeAhead: true,
        valueField: 'XChannel'
    });

    var cbYAxis = new Ext.ux.ResizableCombo({
        allowBlank: true,
        displayField: 'YInclMarker',
        emptyText: 'Select...',
        forceSelection: true,
        listeners:{
            change: function(){
                if ( this.getValue() != '' && cbXAxis.getValue() != '' && cbXAxis.getValue() != 'Time' ){
                    chAppendFileName.show();
                    chEnableGrouping.show();
                } else{
                    chAppendFileName.hide();
                    chEnableGrouping.hide();
                }
            },
            select: function(){
                if ( cbXAxis.getValue() != '' && cbXAxis.getValue() != 'Time' ){
                    chAppendFileName.show();
                    chEnableGrouping.show();
                } else{
                    chAppendFileName.hide();
                    chEnableGrouping.hide();
                }
            }
        },
        minChars: 0,
        mode: 'local',
        renderTo: 'cbBoxYAxis',
        store: strYAxis,
        tpl: '<tpl for="."><div class="x-combo-list-item">{YInclMarker:htmlEncode}</div></tpl>',
        triggerAction: 'all',
        typeAhead: true,
        valueField: 'YChannel'
    });


    /////////////////////////////////////
    //             Functions           //
    /////////////////////////////////////
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

    function plotFiles() {
        btnGraph.setDisabled(true);
        tlbrGraph.setDisabled(true);

        graphWebPartConfig.xAxis = cbXAxis.getValue();
        graphWebPartConfig.yAxis = cbYAxis.getValue();
        graphWebPartConfig.xLab = cbXAxis.getRawValue();
        graphWebPartConfig.yLab = cbYAxis.getRawValue();
        
        if ( graphWebPartConfig.xAxis == '' & graphWebPartConfig.yAxis == '' ){
            alert('Both axis choices cannot be blank!');
            btnGraph.setDisabled(false);
            tlbrGraph.setDisabled(false);
            return;
        }
        if ( graphWebPartConfig.yAxis != '' & graphWebPartConfig.xAxis == '' ){
            alert('If you provided the y-axis choice, ' +
                    'then you must provide an x-axis choice as well');
            btnGraph.setDisabled(false);
            tlbrGraph.setDisabled(false);
            return;
        }
        if ( graphWebPartConfig.xAxis == 'Time' & graphWebPartConfig.yAxis == '' ){
            alert('If you selected "Time" for the x-axis,' +
                    ' you must provide a y-axis choice as well');
            btnGraph.setDisabled(false);
            tlbrGraph.setDisabled(false);
            return;
        }
        graphWebPartConfig.filesNames = cbFileName.getValue();
        if ( graphWebPartConfig.filesNames == '' ){
            alert('No files are selected to be plotted!');
            btnGraph.setDisabled(false);
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
                        btnGraph.setDisabled(false);
                        tlbrGraph.setDisabled(false);
                        return;
                    } else {
                        graphWebPartConfig.imageWidth = panelStudyVars.getWidth();
                        graphWebPartConfig.path = rootPath;
                        alert('currently disabled');
//                        maskGraph.show();
//                        graphWebPart.render();
                    }
                }
            });
        }  else {

            var i, len, curCombo, curString, count, prod = 1;
            var cbsArray = $('.ui-state-default > div:first-child');
            var groupArray = [];

            len = cbsArray.length;
            for ( i = 0; i < len; i ++ ){
                curString = cbsArray[i].id.replace(/pnl/g, '')
                curCombo = Ext.getCmp('cb' + curString );
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
            graphWebPartConfig.path = rootPath;
            graphWebPartConfig.imageWidth = 900; // panelStudyVars.getWidth();

            maskGraph.show();
            graphWebPart.render();
        }
    }; // end of plotFiles()

    function setStudyVars() {
        var i, j, inputArray, innerLen, len, curElemOrig, curElemMod, tempSQL, newColumns;

        // Grab the choices array
        var arrayStudyVars = cbStudyVarName.getValuesAsArray();

        // Elliminate all of the previous choices
        $('#ulSortable').empty();
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
        tempSQL = strngSqlStart;
        currentComboId = undefined;
        strFilteredTable.setUserFilters([]);

        len = arrayStudyVars.length;

        for ( i = 0; i < len; i ++ ){
            curElemOrig = arrayStudyVars[i];
            curElemMod = curElemOrig.replace(/ /g, '_');

            tempSQL += ', FCSFiles.Keyword."' + curElemOrig + '" AS ' + curElemMod;

            $('#ulSortable').append(
                '<li class="ui-state-default">' +
                    '<div id="pnl' + curElemMod + '"></div>' +
                '</li>'
            );

            new Ext.Panel({
                border: true,
                headerCssClass: 'draggableHandle',
                items: [
                    new Ext.ux.ResizableLovCombo({
                        allowBlank: true,
                        displayField: curElemMod,
                        emptyText: 'Select...',
                        forceSelection: true,
                        id: 'cb' + curElemMod,
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
                                    autoLoad: true,
                                    data: [],
                                    fields: [curElemMod],
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
                renderTo: 'pnl' + curElemMod,
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

        tempSQL += strngSqlEnd;

        strFilteredTable.sql = tempSQL;
        strFilteredTable.setBaseParam('sql', tempSQL);
        strFilteredTable.load();

        panelTable.reconfigure( panelTable.getStore(), new Ext.grid.ColumnModel(newColumns) );

        btnSetStudyVars.getEl().frame();
        btnSetStudyVars.setDisabled(true);
        btnSetStudyVars.setText('Study variables set');
    }; // end of setStudyVars()

    var resizeModule = function(w, h) {

        var extraWidth = 0;

//            extraWidth = Ext.getScrollBarWidth();

        LABKEY.Utils.resizeToViewport( panelContainer, w-255-extraWidth, -1, 40, 50 );

        panelTable.getView().refresh();

        if ( typeof resizableImage != 'undefined' ){
            if ( $('#resultImage').width() > 2/3*panelStudyVars.getWidth() ){
                resizableImage.resizeTo( 2/3*panelStudyVars.getWidth(), 2/3*panelStudyVars.getWidth() );
            }
        }
    };

    Ext.EventManager.onWindowResize( resizeModule );
    Ext.EventManager.fireWindowResize();

    // jQuery-related initializations

    $( '#ulSortable' ).sortable({
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

//    $( '#resultImage-link' ).fancybox();


    function onFailure(errorInfo, options, responseObj){
        if (errorInfo && errorInfo.exception)
            alert('Failure: ' + errorInfo.exception + strngErrorContact);
        else
            alert('Failure: ' + responseObj.statusText + strngErrorContact);
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

}); // Ext.onReady()
