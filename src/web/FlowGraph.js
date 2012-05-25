    // Variables
    var
            choiceXAxis,
            choiceYAxis,
            choicesFiles,
            choicesKeywords,
            comboFileName,
            comboKeywordName,
            comboReplicate,
            filesFilter = [],
            maskGraph,
            panelGraph,
            panelKeywords,
            rootPath,
            storeReplicate,
            width,
            webPartDiv
            ;

    function setWebPartDiv( inputToSetTo ){
        webPartDiv = inputToSetTo;
    };

    // create tools using built in Ext tool ids
    var closeTool = [{
        id:'close',
        handler: function(e, target, panel){
            panel.ownerCt.remove(panel, true);
        }
    }];

    Ext.onReady( function() {


        $('#date').datepicker();

        $(function() {
            $( '#sortable' ).sortable({
                cursor: 'crosshair',
                forceHelperSize: true,
                forcePlaceholderSize: true,
                helper: 'clone',
                opacity: 0.4,
                placeholder: 'ui-state-highlight',
                revert: true,
                tolerance: 'pointer'
            });
            $( '#sortable' ).disableSelection();

            $( '#comboKeywordName ul > .x-superboxselect-input').addClass('ui-state-disabled');
            $( '#comboKeywordName ul' ).sortable({
                cursor: 'crosshair',
                forceHelperSize: true,
                forcePlaceholderSize: true,
                helper: 'clone',
                items: "li:not(.ui-state-disabled)",
                opacity: 0.4,
                placeholder: 'ui-state-highlight',
                revert: true,
                tolerance: 'pointer'
            });
            $( '#comboKeywordName ul' ).disableSelection();
        });


        //Panels
        panelKeywords = new Ext.Panel({
            border: true,
            contentEl: 'sortable',
//            layout: {
//                type: 'column'
//            },
            listeners: {
                resize: function(){
                    comboFileName.width = this.width;
                    comboKeywordName.width = this.width;
                }
            },
            renderTo: 'tableKeywords',
            title: 'Selected keywords:<br />(drag and drop to change the grouping order)'
        });

//        panelGraph = new Ext.Panel({
//            border: true,
//            contentEl: 'Graph',
////            layout: {
////                type: 'column'
////            },
//            listeners: {
////                render: function(){
////                    alert("done");
////                },
////                afterlayout: function(){
////                    alert("done");
////                }
//            },
//            renderTo: 'graphWebPartContainer',
//            title: 'Plots:'
//        });


        // Arrays
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

        var dataYAxis = dataXAxis.slice(0);
        dataYAxis.shift();
        // dataYAxis.unshift( ['[histrogram]'] );

        LABKEY.Query.selectRows({
            columns: ['RootPath'],
            failure: onFailure,
            queryName: 'RootPath',
            schemaName: 'flow',
            success: onSuccess
        });
        function onFailure(errorInfo, options, responseObj){
            if (errorInfo && errorInfo.exception)
                alert('Failure: ' + errorInfo.exception);
            else
                alert('Failure: ' + responseObj.statusText);
        };
        function onSuccess(data){
            rootPath = data.rows[data.rowCount-1].RootPath;
        };



//        store.filter([{
//            fn: function(record) {
//                return record.get('price') >= values[0] && record.get('price') <= values[1];
//            }
//        }]);
//
//        store.sort('name', 'ASC');

        // Stores
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

        var storeAxisChoices = new LABKEY.ext.Store({
            autoLoad: true,
            filterArray: [
                LABKEY.Filter.create('KeywordName', '$P', LABKEY.Filter.Types.STARTS_WITH),
                LABKEY.Filter.create('KeywordName', 'N', LABKEY.Filter.Types.CONTAINS)
            ],
            queryName: 'Keyword',
            schemaName: 'flow'
        });

        var storeFileName = new LABKEY.ext.Store({
            autoLoad: true,
            listeners: {
                load: function(){
                    comboFileName.selectAll();
                    document.getElementById('filesLabel').innerHTML = comboFileName.getCheckedArray().length + ' files are currently selected'
                }
            },
            queryName: 'FileName',
            schemaName: 'flow'
        });

        var storeKeywordName = new LABKEY.ext.Store({
            autoLoad: true,
            filterArray: [
                LABKEY.Filter.create('KeywordName', 'DISPLAY', LABKEY.Filter.Types.DOES_NOT_CONTAIN),
                LABKEY.Filter.create('KeywordName', '$', LABKEY.Filter.Types.DOES_NOT_START_WITH)
            ],
            queryName: 'Keyword',
//            remoteFilter: false,
            remoteSort: false,
            schemaName: 'flow',
            sort: 'KeywordName'
        });


        // ComboBoxes
        comboFileName = new Ext.ux.form.LovCombo({
            addSelectAllItem: false,
            allowBlank: true,
            displayField: 'FileName',
            emptyText: 'Select...',
            forceSelection: true,
//            listeners: {
//                blur: function(){
//                    this.selectAll();
//                }
//            },
            minChars: 0,
            mode: 'local',
            renderTo: 'comboFileName',
            store: storeFileName,
            triggerAction: 'all',
            typeAhead: true,
            valueDelimeter: ',',
            valueField: 'FileName',
            width: panelKeywords.getWidth()
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
            valueField: 'YAxisDim'
        });

        storeReplicate = new LABKEY.ext.Store({
            autoLoad: true,
            schemaName: 'flow',
            sql: 'SELECT DISTINCT FCSFiles.Keyword."Replicate" AS Replicate' +
                 ' FROM FCSFiles WHERE FCSFiles.Keyword."Replicate" != \'\' ORDER BY Replicate'
        });

        comboReplicate = new Ext.ux.ResizableLovCombo({
            allowBlank: true,
            displayField: 'Replicate',
            emptyText: 'Select...',
            forceSelection: true,
            listeners: {
                select: function(){
                    filesFilter = this.getCheckedArray();
                    storeFileName.setUserFilters([
                            LABKEY.Filter.create('Replicate', filesFilter.join(';'), LABKEY.Filter.Types.IN)
                    ]);
                    storeFileName.load();
                    comboFileName.selectAll();
                }
            },
            minChars: 0,
            mode: 'local',
            renderTo: 'comboBoxStim',
            store: storeReplicate,
            triggerAction: 'all',
            typeAhead: true,
            valueField: 'Replicate'
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
            valueField: 'KeywordName',
            width: panelKeywords.getWidth()
        });


        // Web parts
        var graphWebPartConfig = {
            filesNames:choicesFiles,
            imageWidth:width,
            keywords:choicesKeywords,
            path:rootPath,
            xAxis:choiceXAxis,
            yAxis:choiceYAxis,
            // Default opts below
//            showSection: 'Graph.png', // comment out to show debug output
            reportId:'module:FlowGraph/FlowGraph.r',
            title:'Graphs'
        };

        var graphWebPart = new LABKEY.WebPart({
            frame: 'none',
            partConfig: graphWebPartConfig,
            partName: 'Report',
            renderTo: 'Graph',
            success: function(){
                enableGraphing(true);
            }
        });

        var ncdfWebPartConfig = {
            path:rootPath,
            reportId:'module:FlowGraph/FlowNetCDF.r',
            title:'HiddenDiv'
        };

        var ncdfWebPart = new LABKEY.WebPart({
            frame: 'none',
            partConfig: ncdfWebPartConfig,
            partName: 'Report',
            renderTo: 'HiddenDiv'
        });

        maskGraph = new Ext.LoadMask('Graph', {
            msg: "Generating the graphics, please, wait..."
        });

        // Buttons
        var btnGraph = new Ext4.Button({
            handler: plotFiles,
            renderTo: 'buttonGraph',
            text: 'Graph'
        });

        new Ext4.Button({
            handler: function() {
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

        // Functions
        function enableGraphing(flag) {
            btnGraph.setDisabled(!flag);
            ( flag === true ) ? maskGraph.hide() : maskGraph.show();
        };

        function plotFiles() {
            enableGraphing(false);

            graphWebPartConfig.xAxis = comboXAxis.getValue();
            graphWebPartConfig.yAxis = comboYAxis.getValue();
            if ( graphWebPartConfig.xAxis == '' & graphWebPartConfig.yAxis == '' ){
                alert('Both axis choices cannot be blank!');
                enableGraphing(true);
                return;
            }
            if ( graphWebPartConfig.yAxis != '' & graphWebPartConfig.xAxis == '' ){
                alert('If you provided the y-axis choice, ' +
                        'then you must provide an x-axis choice as well');
                enableGraphing(true);
                return;
            }
            if ( graphWebPartConfig.xAxis == 'Time' & graphWebPartConfig.yAxis == '' ){
                alert('If you selected "Time" for the x-axis,' +
                        ' you must provide a y-axis choice as well');
                enableGraphing(true);
                return;
            }
            graphWebPartConfig.filesNames = comboFileName.getValue();
            if ( graphWebPartConfig.filesNames == '' ){
                alert('No files are selected to be plotted!');
                enableGraphing(true);
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
                            enableGraphing(true);
                            return;
                        }
                    }
                });
            }
            graphWebPartConfig.imageWidth = panelKeywords.getWidth();
            graphWebPartConfig.keywords = comboKeywordName.getValue();
            graphWebPartConfig.path = rootPath;
            graphWebPart.render();
        };

        function setKeywords() {

            // Grab the choices array
            var arrayKeywords = comboKeywordName.getValuesAsArray();

            // Elliminate all of the previous choices
            panelKeywords.removeAll();
            $('#sortable').empty();

            var i, len, curElemOrig, curElemMod, tempBox, tempCombo, tempStore, tempSQL;

            len = arrayKeywords.length;
            for ( i = 0; i < len; i ++ ){
                curElemOrig = arrayKeywords[i];
                curElemMod = curElemOrig.replace(/ /g, '_');

                $('#sortable').append(
                        '<li class="ui-state-default">' +
                            '<div class="x-panel-header draggable">' + curElemOrig + '</div>' +
                            '<div id="id' + curElemMod +'"></div>' +
                        '</li>');

                // Generate the query
                tempSQL = 'SELECT DISTINCT FCSFiles.Keyword."' + curElemOrig + '" AS ' + curElemMod +
                        ' FROM FCSFiles WHERE FCSFiles.Keyword."' + curElemOrig + '" != \'\' ORDER BY ' + curElemMod;

                tempStore = new LABKEY.ext.Store({
                    autoLoad: true,
                    schemaName: 'flow',
                    sql: tempSQL
                });

                tempCombo = new Ext.ux.ResizableLovCombo({
                    allowBlank: true,
                    cls: '',
                    displayField: curElemMod,
                    emptyText: 'Select...',
                    forceSelection: true,
                    id: 'combo' + curElemMod,
                    minChars: 0,
                    mode: 'local',
                    renderTo: 'id' + curElemMod,
                    store: tempStore,
                    triggerAction: 'all',
                    typeAhead: true,
                    valueField: curElemMod
                });

//                tempBox = new Ext.Panel({
//                    border: true,
////                    layout: {
////                        align: 'left',
////                        pack: 'left',
////                        type: 'auto'
////                    },
//                    id: 'panel' + curElemMod,
//                    style: 'padding:5px',
//                    title: curElemOrig//,
////                    tools: closeTool
//                });

//                tempBox.ownerCt = panelKeywords;
//                tempBox.add(tempCombo);
//                panelKeywords.items.add(tempBox);
            } // end of loop

//            panelKeywords.doLayout();
        };

        function resizeElems() {
            var panelWidth = panelKeywords.getWidth();
            comboFileName.setWidth( panelWidth );
            comboKeywordName.setWidth( panelWidth );
        };

        Ext.EventManager.onWindowResize(resizeElems, this);

    }); // Ext.onReady()