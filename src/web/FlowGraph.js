	LABKEY.requiresExt4Sandbox();
	
	LABKEY.requiresCss('Ext.ux.form.LovCombo.css');
	LABKEY.requiresCss('SuperBoxSelect/superboxselect.css');
	
	LABKEY.requiresScript('Ext.ux.form.LovCombo.js');
	LABKEY.requiresScript('SuperBoxSelect/SuperBoxSelect.js');

	// Ext4 components	
	// LABKEY.requiresScript('BoxSelect/BoxSelect.js');
	// LABKEY.requiresCss('BoxSelect/BoxSelect.css');

	var storeXAxis, storeYAxis, storeFCSFilesNames, storeStim;
	var comboXAxis, comboYAxis, comboLovFCSFilesNames, comboLovStim;
	
	var choiceXAxis, choiceYAxis, choicesFCSFiles, choicesStim, rootPath;
	
	Ext.onReady( function() {

		var dataXAxis = [
                        ["Time"],
                        ["FSC-A"],
                        ["FSC-H"],
                        ["FITC-A CD4"],
                        ["SSC-A"],
                        ["Pacific Blue-A ViViD"],
                        ["Alexa 680-A TNFa"],
                        ["APC-A IL4"],
                        ["PE Cy7-A IFNg"],
                        ["PE Cy55-A CD8"],
                        ["PE Tx RD-A CD3"],
                        ["PE Green laser-A IL2"]		
		];

		var dataYAxis = dataXAxis.slice(0);
		dataYAxis.shift(); 
		// dataYAxis.unshift( ['[histrogram]'] );

		storeXAxis = new Ext4.data.ArrayStore({
			autoLoad: true,
			data: dataXAxis,
			fields: ['XAxisDim']
		}); 

		storeYAxis = new Ext.data.ArrayStore({
			autoLoad: true,
			data: dataYAxis,
			fields: ['YAxisDim']
		});
 
		function onFailure(errorInfo, options, responseObj){
		if (errorInfo && errorInfo.exception)
			alert("Failure: " + errorInfo.exception);
		else
			alert("Failure: " + responseObj.statusText);
		}

		function onSuccess(data){
			rootPath = data.rows[data.rowCount-1].RootPath;
		}

		LABKEY.Query.selectRows({
			schemaName: 'flow',
			queryName: 'RootPath',
			columns: ['RootPath'],
			success: onSuccess,
			failure: onFailure
		});

		storeFCSFilesNames = new LABKEY.ext.Store({
			autoLoad: true,
			queryName: 'FCSFilesNames',
			schemaName: 'flow'
		});

		storeStim = new LABKEY.ext.Store({
			autoLoad: true,
			queryName: 'Stim',
			schemaName: 'flow'
		});

		storeSampleOrder = new LABKEY.ext.Store({
			autoLoad: true,
			queryName: 'SampleOrder',
			schemaName: 'flow'
		});

		comboXAxis = new Ext.form.ComboBox({
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
		
		comboYAxis = new Ext.form.ComboBox({
			allowBlank: true,
			displayField: 'YAxisDim',
			emptyText: 'Select...',
			forceSelection: true,
//			pageSize: 5,
//			minListWidth: 220,
//			resizable: true,
			minChars: 0,
			mode: 'local',
			renderTo: 'comboBoxYAxis',
			store: storeYAxis,
			triggerAction: 'all',
			typeAhead: true,
			valueField: 'YAxisDim'
		});

		comboSuperFCSFilesNames = new Ext.ux.form.SuperBoxSelect({
			allowBlank: false,
			displayField: 'FCSFileName',
			emptyText: 'Select...',
			forceSelection: true,
			minChars: 0,
			mode: 'local',
			renderTo: 'comboBoxFCSFilesNames',
			store: storeFCSFilesNames,
			triggerAction: 'all',
			typeAhead: true,
			valueField: 'FCSFileName',
			width: 720
		});

		comboLovStim = new Ext.ux.form.LovCombo({
			allowBlank: true,
			displayField: 'Stim',
			emptyText: 'Select...',
			forceSelection: true,
			minChars: 0,
			mode: 'local',
			renderTo: 'comboBoxStim',
			store: storeStim,
			triggerAction: 'all',
			typeAhead: true,
			valueField: 'Stim'
		});

		comboLovStim = new Ext.ux.form.LovCombo({
			allowBlank: true,
			displayField: 'SampleOrder',
			emptyText: 'Select...',
			forceSelection: true,
			minChars: 0,
			mode: 'local',
			renderTo: 'comboBoxSampleOrder',
			store: storeSampleOrder,
			triggerAction: 'all',
			typeAhead: true,
			valueField: 'SampleOrder'
		});

		var graphWebPartConfig = {
				reportId: 'module:FlowGraph/FlowGraph.r',
				// showSection: 'Graph.png', // uncomment to show only the image from the report without the console output!
				title: 'Graphs',
				xAxis: choiceXAxis,
				yAxis: choiceYAxis,
				stim: choicesStim,
				filesNames: choicesFCSFiles,
				path: rootPath
		}

		var graphWebPart = new LABKEY.WebPart({
			frame: 'none',
			partConfig: graphWebPartConfig,
			partName: 'Report',
			renderTo: 'Graph'
		});

		Ext4.create('Ext.button.Button', {
			handler: function() {
				var divGraph = document.getElementById("Graph");
				if( divGraph ) { divGraph.innerHTML = "Loading, please, wait..."; }

				graphWebPartConfig.xAxis = comboXAxis.getValue(); 
				graphWebPartConfig.yAxis = comboYAxis.getValue(); 
				graphWebPartConfig.stim = comboLovStim.getValue();
				graphWebPartConfig.filesNames = comboSuperFCSFilesNames.getValue(); 
				graphWebPartConfig.path = rootPath;

				graphWebPart.render(); 
			},
			renderTo: 'GraphButton',
			text: 'Graph'
		})

	}); // Ext.onReady()

