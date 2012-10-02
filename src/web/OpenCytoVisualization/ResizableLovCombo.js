Ext.ux.ResizableLovCombo = Ext.extend(Ext.ux.form.LovCombo, {
    initComponent: function(){
        Ext.ux.ResizableLovCombo.superclass.initComponent.call(this);
        this.on('afterrender', this.resizeToFitContent, this);
        this.store.on({
            'datachanged':   this.resizeToFitContent,
            'add':          this.resizeToFitContent,
            'remove':       this.resizeToFitContent,
            'load':         this.resizeToFitContent,
            'update':       this.resizeToFitContent,
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
            width = Math.max(width, m.getWidth( Ext.util.Format.htmlEncode(text) ));
        }, this);
        if (el) {
            width += el.getBorderWidth('lr');
            width += el.getPadding('lr');
        }
        if (this.trigger) {
            width += this.trigger.getWidth();
        }
        s.width = width;
        width += 3*Ext.getScrollBarWidth() + 20;
        this.listWidth = width;
        this.minListWidth = width;
        if ( this.list != undefined ){
            this.list.setSize(width);
        }
        if ( this.innerList != undefined ){
            this.innerList.setSize(width);
        }
    }
});
Ext.reg('resizable-lov-combo', Ext.ux.ResizableLovCombo);
