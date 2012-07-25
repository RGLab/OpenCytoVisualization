var webPartDivId;

function passParam( inputToSetTo ){
    webPartDivId = inputToSetTo;
};


LABKEY.requiresCss('FlowGraph/jQuery/css/base/jquery-ui.css');

LABKEY.requiresCss('Ext.ux.form.LovCombo.css');
LABKEY.requiresCss('FlowGraph/SuperBoxSelect/superboxselect-gray-extend.css');
LABKEY.requiresCss('FlowGraph.css');

//LABKEY.requiresCss('SearchBox/Ext.ux.form.SearchBox.css');
//LABKEY.requiresCss('ExtendedComboBox/Ext.ux.form.ExtendedComboBox.css');

LABKEY.requiresScript(
        [
            'FlowGraph/ResizableCombo.js',
            'Ext.ux.form.LovCombo.js',
            'FlowGraph/ResizableLovCombo.js',
            'FlowGraph/SuperBoxSelect/SuperBoxSelect.js',
            'FlowGraph/GridPanelHeaderResize.js',
            'FlowGraph/ColumnModelChromePatch.js',
            'FlowGraph.js'
        ],
        true,
        function ()
        {
            setWebPartDiv( webPartDivId );
        },
        this,
        true
);

//    'SearchBox/Ext.ux.form.SearchBox.js',
//    'ExtendedComboBox/Ext.ux.form.ExtendedComboBox.js'


