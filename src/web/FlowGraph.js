    function setWebPartDiv( inputToSetTo ){
        webPartDiv = inputToSetTo;
    };

    // Variables
    var
            choiceXAxis,
            choiceYAxis,
            choicesFiles,
            choicesKeywords,
            comboKeywordName,
            panelKeywords,
            rootPath,
            webPartDiv
            ;

    Ext.onReady( function() {

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
                LABKEY.Filter.create('KeywordName', 'N', LABKEY.Filter.Types.CONTAINS)],
            queryName: 'Keyword',
            schemaName: 'flow'
        });

        var storeFileName = new LABKEY.ext.Store({
            autoLoad: true,
            queryName: 'FileName',
            schemaName: 'flow'
        });

        var storeKeywordName = new LABKEY.ext.Store({
            autoLoad: true,
            filterArray: [
                LABKEY.Filter.create('KeywordName', 'DISPLAY', LABKEY.Filter.Types.DOES_NOT_CONTAIN),
                LABKEY.Filter.create('KeywordName', '$', LABKEY.Filter.Types.DOES_NOT_START_WITH)],
            queryName: 'Keyword',
            schemaName: 'flow'
        });


        // ComboBoxes
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
//            pageSize: 5,
            minListWidth: 220,
//            resizable: true,
            minChars: 0,
            mode: 'local',
            renderTo: 'comboBoxYAxis',
            store: storeYAxis,
            triggerAction: 'all',
            typeAhead: true,
            valueField: 'YAxisDim'
        });

        var comboFileName = new Ext.ux.form.SuperBoxSelect({
            allowBlank: true,
            displayField: 'FileName',
            emptyText: 'Select...',
            forceSelection: true,
            minChars: 0,
            mode: 'local',
            renderTo: 'comboFileName',
            store: storeFileName,
            triggerAction: 'all',
            typeAhead: true,
            valueField: 'FileName',
            width: 720
        });

        comboKeywordName = new Ext.ux.form.SuperBoxSelect({
            allowBlank: true,
            displayField: 'KeywordName',
            emptyText: 'Select...',
            forceSelection: true,
            listeners: {
                select: {
                    element: 'el1',
                    fn: function(){ alert('select'); }
                },
                click: {
                    element: 'el2',
                    fn: function(){ alert('click'); }
                }
            },
            minChars: 0,
            mode: 'local',
            renderTo: 'comboKeywordName',
            store: storeKeywordName,
            triggerAction: 'all',
            typeAhead: true,
            valueField: 'KeywordName',
            width: 720
        });


        // Web parts
        var graphWebPartConfig = {
            reportId:'module:FlowGraph/FlowGraph.r',
//            showSection: 'Graph.png', // comment out to show debug output
            title:'Graphs',
            xAxis:choiceXAxis,
            yAxis:choiceYAxis,
            filesNames:choicesFiles,
            path:rootPath
        };

        var graphWebPart = new LABKEY.WebPart({
//            frame: 'none',
            partConfig: graphWebPartConfig,
            partName: 'Report',
            renderTo: 'Graph'
        });

        var ncdfWebPartConfig = {
            reportId:'module:FlowGraph/FlowNetCDF.r',
            // showSection:
            title:'HiddenDiv',
            path:rootPath
        };

        var ncdfWebPart = new LABKEY.WebPart({
            frame: 'none',
            partConfig: ncdfWebPartConfig,
            partName: 'Report',
            renderTo: 'HiddenDiv'
        });


        //Panels
        panelKeywords = new Ext.Panel({
            border: true,
            layout: {
                align: 'middle',
                pack: 'center',
                type: 'column'
            },
//            listeners: { render: initializeDropTarget },
            renderTo: 'tableKeywords',
            title: 'Selected keywords:'
        });

        Ext4.create('Ext.panel.Panel', {
            border: true,
            html: 'test2',
//            items: [
//                graphWebPart
//            ],
            renderTo: 'graphWebPartContainer'
        })


        // Buttons
        new Ext4.Button({
            handler: function() {
                var divGraph = document.getElementById('Graph');
                if( divGraph ) { divGraph.innerHTML = 'Loading, please, wait...'; }

                graphWebPartConfig.xAxis = comboXAxis.getValue();
                graphWebPartConfig.yAxis = comboYAxis.getValue();
                graphWebPartConfig.filesNames = comboFileName.getValue();
                graphWebPartConfig.path = rootPath;

                graphWebPart.render();
            },
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

    }); // Ext.onReady()

    function setKeywords() {

        // Grab the choices string and parse it into an array
        choicesKeywords = comboKeywordName.getValue();
        if ( choicesKeywords == '' ){
            arrayKeywords = [];
        } else {
            arrayKeywords = choicesKeywords.split(',');
        }

        // Elliminate all of the previous choices
        panelKeywords.removeAll();

        var len, curElemOrig, curElemMod, tempBox, tempCombo, tempStore, tempSQL;

        len = arrayKeywords.length;
        for ( i = 0; i < len; i ++ ){
            curElemOrig = arrayKeywords[i];
            curElemMod = curElemOrig.replace(/ /g, '_');

            tempSQL = 'SELECT DISTINCT FCSFiles.Keyword."' + curElemOrig + '" AS ' + curElemMod + ' FROM FCSFiles ORDER BY ' + curElemMod;

            tempStore = new LABKEY.ext.Store({
                autoLoad: true,
                schemaName: 'flow',
                sql: tempSQL
            });

            tempCombo = new Ext.ux.form.LovCombo({
                allowBlank: true,
                displayField: curElemMod,
                emptyText: 'Select...',
                forceSelection: true,
                minChars: 0,
                mode: 'local',
                store: tempStore,
                triggerAction: 'all',
                typeAhead: true,
                valueField: curElemMod
            });

            tempBox = new Ext.Panel({
                border: true,
                draggable: {
                    //      Config option of Ext.Panel.DD class.
                    //      It's a floating Panel, so do not show a placeholder proxy in the original position.
                    insertProxy: false,

                    //      Called for each mousemove event while dragging the DD object.
                    onDrag : function(e){
                        //          Record the x,y position of the drag proxy so that we can
                        //          position the Panel at end of drag.
                        var pel = this.proxy.getEl();
                        this.x = pel.getLeft(true);
                        this.y = pel.getTop(true);

                        //          Keep the Shadow aligned if there is one.
                        var s = this.panel.getEl().shadow;
                        if (s) {
                            s.realign(this.x, this.y, pel.getWidth(), pel.getHeight());
                        }
                    },

                    //      Called on the mouseup event.
                    endDrag : function(e){
//                                this.panel.setPosition(this.x, this.y);
                    }
                },
//                        layout: {
//                            align: 'middle',
//                            pack: 'center',
//                            type: 'auto'
//                        },
                style: 'padding:5px',
                title: curElemOrig
            });

            tempBox.add(tempCombo);

            panelKeywords.add(tempBox);
        } // end of loop

        panelKeywords.doLayout();

    };