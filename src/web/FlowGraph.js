//combobox.bindStore(newStore);

Ext.namespace('FlowGraph');

//FlowGraph.setWebPartDivId =
function setWebPartDiv( inputToSetTo ){
    webPartDiv = inputToSetTo;
};

function removeById(elId) {
    $("#"+elId).remove();
}

function removeByClass(className) {
    $("."+className).remove();
}

Ext.onReady( function() {

    /////////////////////////////////////
    //             Variables           //
    /////////////////////////////////////
    var
            choiceXAxis,
            choiceYAxis,
            choicesFiles,
            choicesKeywords,
            comboFileName,
            comboKeywordName,
            currentComboId,
            filterArray,
            maskGraph,
            panelGraph,
            panelKeywords,
            rootPath,
            storeFilteredTable,
            storeKeywordName,
            width,
            webPartDiv
            ;


    /////////////////////////////////////
    //             Strings             //
    /////////////////////////////////////
    var stringErrorContact = '. Please, contact ldashevs@fhcrc.org for support.';

    var stringSqlStart = 'SELECT DISTINCT FCSFiles.Name AS FileName';
    var stringSqlEnd =
            ' FROM FCSFiles' +
            ' WHERE FCSFiles.Run."Analysis Folder"."Flow Experiment Runs" = true' +
            ' ORDER BY FileName';


    /////////////////////////////////////
    //              Arrays             //
    /////////////////////////////////////
    var dataXAxis = [
        ['Time'],
        ['FSC-A'],
        ['FSC-H'],
        ['FITC-A CD4'],
        ['SSC-A'],
        ['Pacific Blue-A ViViD'],
        ['Alexa 680-A TNFa'],
        ['APC-A IL4'],
        ['PE Cy7-A IFNg'],
        ['PE Cy55-A CD8'],
        ['PE Tx RD-A CD3'],
        ['PE Green laser-A IL2']
    ];

    var
            combosArray = [],
            filesFilter = []
            ;


    var dataYAxis = dataXAxis.slice(0);
    dataYAxis.shift();
    // dataYAxis.unshift( ['[histrogram]'] );

    LABKEY.Query.selectRows({
        columns: ['RootPath'],
        failure: onFailure,
        queryName: 'RootPath',
        schemaName: 'flow',
        success: onRootPathSuccess
    });
    function onRootPathSuccess(data){
        rootPath = data.rows[data.rowCount-1].RootPath;
    };


    /////////////////////////////////////
    //              Stores             //
    /////////////////////////////////////
    var storeXAxis = new Ext4.data.ArrayStore({
        autoLoad: true,
        data: dataXAxis,
        fields: ['XAxisDim']
    });

    var storeYAxis = new Ext4.data.ArrayStore({
        autoLoad: true,
        data: dataYAxis,
        fields: ['YAxisDim']
    });

//        var storeAxisChoices = new LABKEY.ext.Store({
//            autoLoad: true,
//            filterArray: [
//                LABKEY.Filter.create('KeywordName', '$P', LABKEY.Filter.Types.STARTS_WITH),
//                LABKEY.Filter.create('KeywordName', 'N', LABKEY.Filter.Types.CONTAINS)
//            ],
//            queryName: 'Keyword',
//            schemaName: 'flow'
//        });

    var storeUnfilteredTable = new LABKEY.ext.Store({
        autoLoad: false,
        listeners: {
            load: function(){
                comboFileName.selectAll();
                document.getElementById('filesLabel').innerHTML =
                        comboFileName.getCheckedArray().length + ' files are currently selected';

                var inputArray, innerLen, i, outerLen, j, label, combo;

                outerLen = myArray.length;
                for ( j = 0; j < outerLen; j++ ){
                    combo = combosArray[j];
                    if ( combo.getId() != currentComboId ){
                        label = combo.valueField;
                        inputArray = storeUnfilteredTable.collect(label);
                        innerLen = inputArray.length;
                        for ( i = 0; i < innerLen; i ++ ){
                            inputArray[i] = [ inputArray[i] ];
                        }

                        combo.getStore().loadData( inputArray );
                    }
                }

            }
        },
        schemaName: 'flow',
        sql: stringSqlStart + stringSqlEnd
    });

    storeFilteredTable = new LABKEY.ext.Store({
        autoLoad: true,
        listeners: {
            load: function(){
                comboFileName.selectAll();
                document.getElementById('filesLabel').innerHTML =
                        comboFileName.getCheckedArray().length + ' files are currently selected';

                var inputArray, innerLen, i, outerLen, j, combo, label;

                outerLen = combosArray.length;
                for ( j = 0; j < outerLen; j ++ ){
                    combo = combosArray[j];
                    if ( combo.getId() != currentComboId ){
                        label = combo.valueField;
                        inputArray = storeFilteredTable.collect(label);
                        innerLen = inputArray.length;
                        for ( i = 0; i < innerLen; i ++ ){
                            inputArray[i] = [ inputArray[i] ];
                        }

                        combo.getStore().loadData( inputArray );
                    }
                }
            }
        },
        schemaName: 'flow',
        sql: stringSqlStart + stringSqlEnd
    });

    storeKeywordName = new LABKEY.ext.Store({
        autoLoad: true,
        filterArray: [
            LABKEY.Filter.create('KeywordName', 'DISPLAY', LABKEY.Filter.Types.DOES_NOT_CONTAIN),
            LABKEY.Filter.create('KeywordName', '$', LABKEY.Filter.Types.DOES_NOT_START_WITH)
        ],
        queryName: 'Keyword',
        remoteSort: false,
        schemaName: 'flow',
        sort: 'KeywordName'
    });


    /////////////////////////////////////
    //            ComboBoxes           //
    /////////////////////////////////////
    comboFileName = new Ext.ux.form.LovCombo({
        addSelectAllItem: false,
        allowBlank: true,
        displayField: 'FileName',
        emptyText: 'Select...',
        forceSelection: true,
        listeners: {
            change: function(){
                document.getElementById('filesLabel').innerHTML =
                        comboFileName.getCheckedArray().length + ' files are currently selected';
            }
        },
        minChars: 0,
        mode: 'local',
        renderTo: 'comboFileName',
        selectOnFocus: true,
        store: storeFilteredTable,
        triggerAction: 'all',
        typeAhead: true,
        valueDelimeter: ',',
        valueField: 'FileName'
    });

    var comboXAxis = new Ext.form.ComboBox({
        allowBlank: true,
        displayField: 'XAxisDim',
        emptyText: 'Select...',
        forceSelection: true,
        minChars: 0,
        mode: 'local',
        renderTo: 'comboBoxXAxis',
        store: storeXAxis,
        triggerAction: 'all',
        typeAhead: true,
        value: 'FSC-A',
        valueField: 'XAxisDim'
    });

    var comboYAxis = new Ext.form.ComboBox({
        allowBlank: true,
        displayField: 'YAxisDim',
        emptyText: 'Select...',
        forceSelection: true,
        minChars: 0,
        mode: 'local',
        renderTo: 'comboBoxYAxis',
        store: storeYAxis,
        triggerAction: 'all',
        typeAhead: true,
        value: 'SSC-A',
        valueField: 'YAxisDim'
    });

    comboKeywordName = new Ext.ux.form.SuperBoxSelect({
        allowBlank: true,
        displayField: 'KeywordName',
        emptyText: 'Select...',
        forceSelection: true,
        listeners: {
        },
        minChars: 0,
        mode: 'local',
        renderTo: 'comboKeywordName',
        store: storeKeywordName,
        triggerAction: 'all',
        typeAhead: true,
        valueDelimiter: ';',
        valueField: 'KeywordName'
    });

    /////////////////////////////////////
    //             Web parts           //
    /////////////////////////////////////
    var graphWebPartConfig = {
        filesNames:choicesFiles,
        imageWidth:width,
        keywords:choicesKeywords,
        path:rootPath,
        xAxis:choiceXAxis,
        yAxis:choiceYAxis,
        // Default opts below
        reportId:'module:FlowGraph/FlowGraph.r',
        showSection: 'Graph.png', // comment out to show debug output
        title:'Graphs'
    };

    graphWebPart = new LABKEY.WebPart({
        failure: onFailure,
        frame: 'none',
        partConfig: graphWebPartConfig,
        partName: 'Report',
        renderTo: 'Graph',
        success: function(){
            btnGraph.setDisabled(false);
            maskGraph.hide();

            if ( $('.labkey-error').length > 0 ){
                alert('Failure: there was an error while executing this command' + stringErrorContact);
                $('#resultImage').remove();
            } else {
                var custom = new Ext.Resizable('resultImage', {
                    wrap:true,
                    pinned:true,
                    minWidth:50,
                    minHeight: 50,
                    width: panelKeywords.getWidth(),
                    height: panelKeywords.getWidth(),
                    preserveRatio: true,
                    dynamic:true,
                    handles: 's'
                });
            }
        }
    });

    var ncdfWebPartConfig = {
        path:rootPath,
        // Default opts below
        reportId:'module:FlowGraph/FlowNetCDF.r',
        showSection: 'textOutput', // comment out to show debug output
        title:'HiddenDiv'
    };

    var ncdfWebPart = new LABKEY.WebPart({
        frame: 'none',
        partConfig: ncdfWebPartConfig,
        partName: 'Report',
        renderTo: 'HiddenDiv',
        success: function(){
//            btnNetCDF.setDisabled(false);
        }
    });

    maskGraph = new Ext.LoadMask('Graph', {
        msg: "Generating the graphics, please, wait..."
    });

    /////////////////////////////////////
    //             Panels              //
    /////////////////////////////////////
    panelKeywords = new Ext.Panel({
        border: true,
        contentEl: 'sortable',
        listeners: {
            resize: function(){
                comboFileName.setWidth( this.getWidth() );
                comboKeywordName.setWidth( this.getWidth() );
                grid.setWidth( this.getWidth() );
            }
        },
        renderTo: 'tableKeywords',
        title: 'Selected keywords:<br />(drag and drop to change the grouping order)'
    });

    comboFileName.setWidth(panelKeywords.getWidth());
    comboKeywordName.setWidth(panelKeywords.getWidth());

    panelGraph = new Ext.Panel({
        border: true,
        contentEl: 'Graph',
        renderTo: 'graphWebPartContainer',
        title: 'Plot'
    });

    var grid = new Ext.grid.GridPanel({
//        autoExpandColumn: 'FileName',
        collapsible: true,
        columns: [
            {
                dataIndex: 'FileName',
                header: 'File Name',
//            id: 'FileName',
                resizable: true,
                sortable: true
            }
        ],
        height: 200,
        renderTo: 'gridTable',
        store: storeFilteredTable,
        stripeRows: true,
        title:'Files Table',
        viewConfig:
        {
            emptyText: 'No rows to display'
//                forceFit: true
        },
        width: panelKeywords.getWidth()
    });

    grid.collapse();

    /////////////////////////////////////
    //              Buttons            //
    /////////////////////////////////////
    var btnGraph = new Ext4.Button({
        handler: plotFiles,
        renderTo: 'buttonGraph',
        text: 'Graph'
    });

    var btnNetCDF = new Ext4.Button({
        handler: function() {
            this.setDisabled(true);
            var divHidden = document.getElementById('HiddenDiv');
            if( divHidden ) { divHidden.innerHTML = 'Processing FCS files, if needed, please, wait...'; }

            ncdfWebPartConfig.path = rootPath;

            ncdfWebPart.render();
        },
        renderTo: 'buttonCreateNcdf',
        text: 'Generate NetCDF file'
    });

    new Ext4.Button({
        handler: setKeywords,
        renderTo: 'buttonSetKeywords',
        text: 'Set keywords'
    });

    /////////////////////////////////////
    //             Functions           //
    /////////////////////////////////////
    function filterFiles(combo){
        if ( combo.getId == currentComboId ){

        }
        currentComboId = combo.getId();
        filesFilter = combo.getCheckedArray();
        filterArray = storeFilteredTable.getUserFilters();
        if ( filesFilter.length > 0 ){
            filterArray.push( LABKEY.Filter.create(combo.valueField, filesFilter.join(';'), LABKEY.Filter.Types.IN) );
        }/* else {
            filterArray = [];
        }*/

        storeFilteredTable.setUserFilters(filterArray);
        storeFilteredTable.load();
    };

    function plotFiles() {
        btnGraph.setDisabled(true);

        graphWebPartConfig.xAxis = comboXAxis.getValue();
        graphWebPartConfig.yAxis = comboYAxis.getValue();
        if ( graphWebPartConfig.xAxis == '' & graphWebPartConfig.yAxis == '' ){
            alert('Both axis choices cannot be blank!');
            btnGraph.setDisabled(false);
            return;
        }
        if ( graphWebPartConfig.yAxis != '' & graphWebPartConfig.xAxis == '' ){
            alert('If you provided the y-axis choice, ' +
                    'then you must provide an x-axis choice as well');
            btnGraph.setDisabled(false);
            return;
        }
        if ( graphWebPartConfig.xAxis == 'Time' & graphWebPartConfig.yAxis == '' ){
            alert('If you selected "Time" for the x-axis,' +
                    ' you must provide a y-axis choice as well');
            btnGraph.setDisabled(false);
            return;
        }
        graphWebPartConfig.filesNames = comboFileName.getValue();
        if ( graphWebPartConfig.filesNames == '' ){
            alert('No files are selected to be plotted!');
            btnGraph.setDisabled(false);
            return;
        }

        var filesArray = comboFileName.getCheckedArray();

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
                        return;
                    } else {
                        graphWebPartConfig.imageWidth = panelKeywords.getWidth();
//                        graphWebPartConfig.keywords = comboKeywordName.getValue();
                        graphWebPartConfig.path = rootPath;
                        maskGraph.show();
                        graphWebPart.render();
                    }
                }
            });
        }  else {
            graphWebPartConfig.imageWidth = panelKeywords.getWidth();
            var i, len, curCombo, totalCount = 0, count, prod = 1; //storeFilteredTable.getCount();
            var columnsArray = comboKeywordName.getValuesAsArray();

            len = combosArray.length;
            for ( i = 0; i < len; i ++ ){
                curCombo = combosArray[i];
                if ( curCombo.getId() == currentComboId ){
                    prod *= curCombo.getCheckedArray().length;
                } else{
                    count = curCombo.getStore().getCount();
                    if ( count == 0 ){
                        columnsArray.splice(i-totalCount, 1);
                        totalCount ++ ;
                    } else{
                        prod *= count;
                    }
                }
            }
            graphWebPartConfig.keywords = columnsArray.join(';');

            graphWebPartConfig.dimension = prod;
            graphWebPartConfig.path = rootPath;
            maskGraph.show();
            graphWebPart.render();
        }
    };

    function setKeywords() {
        var i, j, inputArray, innerLen, len, curElemOrig, curElemMod, tempSQL, newColumns;

        // Grab the choices array
        var arrayKeywords = comboKeywordName.getValuesAsArray();

        // Elliminate all of the previous choices
        $('#sortable').empty();
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
        combosArray = [];
        tempSQL = stringSqlStart;
        currentComboId = undefined;
        storeFilteredTable.setUserFilters([]);

        len = arrayKeywords.length;

        for ( i = 0; i < len; i ++ ){
            curElemOrig = arrayKeywords[i];
            curElemMod = curElemOrig.replace(/ /g, '_');

            tempSQL += ', FCSFiles.Keyword."' + curElemOrig + '" AS ' + curElemMod;

            $('#sortable').append(
                    '<li class="ui-state-default">' +
                            '<div class="x-panel-header draggableHandle">' + curElemOrig + '</div>' +
                            '<div id="id' + curElemMod +'"></div>' +
                    '</li>'
            );

            combosArray.push(
                    new Ext.ux.ResizableLovCombo({
                        allowBlank: true,
                        displayField: curElemMod,
                        emptyText: 'Select...',
                        forceSelection: true,
                        id: 'combo' + curElemMod,
                        listeners: {
                            select: function(){
                                filterFiles(this);
                            }
                        },
                        minChars: 0,
                        mode: 'local',
                        renderTo: 'id' + curElemMod,
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
                        triggerAction: 'all',
                        typeAhead: true,
                        valueField: curElemMod
                    })
            )

            newColumns.push(
                    {
                        dataIndex: curElemMod,
                        header: curElemOrig,
                        resizable: true,
                        sortable: true
                    }
            );

        } // end of for ( i = 0; i < len; i ++ ) loop

        tempSQL += stringSqlEnd;

//        storeFilteredTable.sql = tempSQL;
        storeFilteredTable.setBaseParam('sql', tempSQL);
        storeFilteredTable.load();

        grid.reconfigure( grid.getStore(), new Ext.grid.ColumnModel(newColumns) );
    };

    $( '#sortable' ).sortable({
        forceHelperSize: true,
        forcePlaceholderSize: true,
        handle: '.draggableHandle',
        helper: 'clone',
        opacity: 0.4,
        placeholder: 'ui-state-highlight',
        revert: true,
        tolerance: 'pointer'
    });
    $( '#sortable' ).disableSelection();

    function resizeElems() {
        var panelWidth = panelKeywords.getWidth();
        comboFileName.setWidth( panelWidth );
        comboKeywordName.setWidth( panelWidth );
        grid.setWidth( panelWidth );
    };

//    Ext.EventManager.onWindowResize(resizeElems, this);

    function onFailure(errorInfo, options, responseObj){
        if (errorInfo && errorInfo.exception)
            alert('Failure: ' + errorInfo.exception + stringErrorContact);
        else
            alert('Failure: ' + responseObj.statusText + stringErrorContact);
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