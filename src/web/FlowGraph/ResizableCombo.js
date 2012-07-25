Ext.ux.ResizableCombo = Ext.extend(Ext.form.ComboBox, {
    initComponent: function(){
        Ext.ux.ResizableCombo.superclass.initComponent.call(this);
        this.on('render', this.resizeToFitContent, this);
        this.store.on({
            'datachange': this.resizeToFitContent,
            'add': this.resizeToFitContent,
            'remove': this.resizeToFitContent,
            'load': this.resizeToFitContent,
            'update': this.resizeToFitContent,
            buffer: 10,
            scope: this
        });
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
        this.listWidth = width + 3*Ext.getScrollBarWidth() + 50;
        this.minListWidth = width + 3*Ext.getScrollBarWidth() + 50;
//        this.setSize(s);
    }
});
Ext.reg('resizable-combo', Ext.ux.ResizableCombo);