Ext.ux.ResizableLovCombo = Ext.extend(Ext.ux.form.LovCombo, {
    initComponent: function(){
        Ext.ux.ResizableLovCombo.superclass.initComponent.call(this);
        this.on('render', this.resizeToFitContent, this);
    },
    resizeToFitContent: function(){
        if (!this.elMetrics){
            this.elMetrics = Ext.util.TextMetrics.createInstance(this.getEl());
        }
        var m = this.elMetrics, width = 0, el = this.el, s = this.getSize();
        this.store.each(function (r) {
            var text = r.get(this.displayField);
            width = Math.max(width, m.getWidth(text));
        }, this);
        if (el) {
            width += el.getBorderWidth('lr');
            width += el.getPadding('lr');
        }
        if (this.trigger) {
            width += this.trigger.getWidth();
        }
        s.width = width;
        this.listWidth = width + 3*scrollbarWidth();
//        this.minListWidth = width + 3*scrollbarWidth();
//        this.setSize(s);
        this.store.on({
            'datachange': this.resizeToFitContent,
            'add': this.resizeToFitContent,
            'remove': this.resizeToFitContent,
            'load': this.resizeToFitContent,
            'update': this.resizeToFitContent,
            buffer: 10,
            scope: this
        });
    }
});
Ext.reg('resizable-lov-combo', Ext.ux.ResizableLovCombo);

function scrollbarWidth() {
    // Scrollbalken im Body ausschalten
    document.body.style.overflow = 'hidden';
    var width = document.body.clientWidth;

    // Scrollbalken
    document.body.style.overflow = 'scroll';

    width -= document.body.clientWidth;

    // Der IE im Standardmode
    if(!width) width = document.body.offsetWidth-document.body.clientWidth;

    // ursprüngliche Einstellungen wiederherstellen
    document.body.style.overflow = '';

    return width;
};





//LABKEY.ext.ComboPlugin = function () {
//    var combo = null;
//
//    return {
//        init : function (combo) {
//            this.combo = combo;
//            if (this.combo.store)
//            {
//                this.combo.mon(this.combo.store, {
//                    load: this.resizeList,
//                    // fired when the store is filtered or sorted
//                    //datachanged: this.resizeList,
//                    add: this.resizeList,
//                    remove: this.resizeList,
//                    update: this.resizeList,
//                    buffer: 100,
//                    scope: this
//                });
//            }
//
//            if (Ext.isObject(this.combo.store) && this.combo.store.events)
//            {
//                this.combo.initialValue = this.combo.value;
//                if (this.combo.store.getCount())
//                {
//                    this.initialLoad();
//                    this.resizeList();
//                }
//                else
//                {
//                    this.combo.mon(this.combo.store, 'load', this.initialLoad, this, {single: true});
//                }
//            }
//        },
//
//        initialLoad : function()
//        {
//            if (this.combo.initialValue)
//            {
//                this.combo.setValue(this.combo.initialValue);
//            }
//        },
//
//        resizeList : function ()
//        {
//            // bail early if ComboBox was set to an explicit width
//            if (Ext.isDefined(this.combo.listWidth))
//                return;
//
//            // CONSIDER: set maxListWidth or listWidth instead of calling .doResize(w) below?
//            var w = this.measureList();
//
//            // NOTE: same as Ext.form.ComboBox.onResize except doesn't call super.
//            if(!isNaN(w) && this.combo.isVisible() && this.combo.list){
//                this.combo.doResize(w);
//            }else{
//                this.combo.bufferSize = w;
//            }
//        },
//
//        measureList : function ()
//        {
//            if (!this.tm)
//            {
//                // XXX: should we share a TextMetrics instance across ComboBoxen using a hidden span?
//                var el = this.combo.el ? this.combo.el : Ext.DomHelper.append(document.body, {tag:'span', style:{display:'none'}});
//                this.tm = Ext.util.TextMetrics.createInstance(el);
//            }
//
//            var w = this.combo.el ? this.combo.el.getWidth(true) : 0;
//            var tpl = null;
//            if (this.combo.rendered)
//            {
//                if (this.combo.view && this.combo.view.tpl instanceof Ext.Template)
//                    tpl = this.combo.view.tpl;
//                else if (this.combo.tpl instanceof Ext.Template)
//                    tpl = this.combo.tpl;
//            }
//
//            this.combo.store.each(function (r) {
//                var html;
//                if (tpl)
//                    html = tpl.apply(r.data);
//                else
//                    html = r.get(this.combo.displayField);
//                w = Math.max(w, Math.ceil(this.tm.getWidth(html)));
//            }, this);
//
//            if (this.combo.list)
//                w += this.combo.list.getFrameWidth('lr');
//
//            // for vertical scrollbar
//            w += 20;
//
//            return w;
//        }
//    }
//};
//Ext.preg('labkey-combo', LABKEY.ext.ComboPlugin);

//LABKEY.ext.ComboBox = Ext.extend(Ext.form.ComboBox, {
//    constructor: function (config) {
//        config.plugins = config.plugins || [];
//        config.plugins.push(LABKEY.ext.ComboPlugin);
//        LABKEY.ext.ComboBox.superclass.constructor.call(this, config);
//    }
//});