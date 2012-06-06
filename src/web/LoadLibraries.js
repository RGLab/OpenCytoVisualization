var webPartDivId;

function passParam( inputToSetTo ){
    webPartDivId = inputToSetTo;
};

LABKEY.requiresCss('FlowGraph.css');
LABKEY.requiresCss('jQuery/css/base/jquery-ui.css');
LABKEY.requiresCss('Ext.ux.form.LovCombo.css');
LABKEY.requiresCss('SuperBoxSelect/superboxselect.css');
LABKEY.requiresCss('PanelHeaderButtons/Ext.ux.plugins.HeaderButtons.css');
//LABKEY.requiresCss('SearchBox/Ext.ux.form.SearchBox.css');
//LABKEY.requiresCss('ExtendedComboBox/Ext.ux.form.ExtendedComboBox.css');

LABKEY.requiresScript(
        [
            'Ext.ux.form.LovCombo.js',
//            'LovComboSelectAll.js',
            'ResizableLovCombo.js',
            'SuperBoxSelect/SuperBoxSelect.js',
            'PanelHeaderButtons/Ext.ux.plugins.HeaderButtons.js',
            'ColumnModelChromePatch.js',
            'jQuery/js/jquery-1.7.2.min.js',            // jQuery
            'jQuery/js/jquery-ui-1.8.20.custom.min.js', // jQuery UI
            'FlowGraph.js'
        ],
        true,
        function ()
        {
            setWebPartDiv( webPartDivId )
        },
        this,
        true
);

//    'SearchBox/Ext.ux.form.SearchBox.js',
//    'ExtendedComboBox/Ext.ux.form.ExtendedComboBox.js'
