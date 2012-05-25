Ext.override(Ext.ux.form.LovCombo, {

    //True for use selectAll item 
    addSelectAllItem:true,

    //Value of valueField for selectAll item 
    selectAllValueField: '_all',

    //Value of textField for selectAll item 
    selectAllTextField: 'All',

    //Toggle selectAll item 
    allSelected:true,

    beforeBlur: Ext.emptyFn,

    //Select correct action for selected record 
    onViewClick : function(doFocus){
        var index = this.view.getSelectedIndexes()[0];
        if (this.addSelectAllItem && index == 0) {
            this.toggleAll();
        }else {
            var r = this.store.getAt(index);
            if(r){
                this.onSelect(r, index);
            }
            if(doFocus !== false){
                this.el.focus();
            }
        }
    },

    //Specificaly css class for selactAll item : ux-lovcombo-list-item-all 
    initComponent:function() {

        // template with checkbox 
        if(!this.tpl) {
            this.tpl =
                    '<tpl for=".">'
                            + '<tpl if="' + this.valueField + '==\''+this.selectAllValueField+'\'">'
                            +'<div class="x-combo-list-item ux-lovcombo-list-item-all">'
                            +'<img src="' + Ext.BLANK_IMAGE_URL + '" '
                            +'class="ux-lovcombo-icon ux-lovcombo-icon-'
                            +'{[values.' + this.checkField + '?"checked":"unchecked"' + ']}">'
                            +'<div class="ux-lovcombo-item-text">{' + (this.displayField || 'text' )+ '}</div>'
                            +'</div>'
                            + '</tpl>'
                            + '<tpl if="' + this.valueField + '!=\''+this.selectAllValueField+'\'">'
                            +'<div class="x-combo-list-item">'
                            +'<img src="' + Ext.BLANK_IMAGE_URL + '" '
                            +'class="ux-lovcombo-icon ux-lovcombo-icon-'
                            +'{[values.' + this.checkField + '?"checked":"unchecked"' + ']}">'
                            +'<div class="ux-lovcombo-item-text">{' + (this.displayField || 'text' )+ '}</div>'
                            +'</div>'
                            + '</tpl>'
                            +'</tpl>'
            ;
        }

        // call parent 
        Ext.ux.form.LovCombo.superclass.initComponent.apply(this, arguments);

        // install internal event handlers 
//        this.on({
//            scope:this
//            ,beforequery:this.onBeforeQuery
//            ,blur:this.onRealBlur
//        });

        // remove selection from input field 
        this.onLoad = this.onLoad.createSequence(function() {
            if(this.el) {
                var v = this.el.dom.value;
                this.el.dom.value = '';
                this.el.dom.value = v;
            }
        });

    },

    //Escape selectAll item value if it's here 
    getCheckedValue:function(field) {
        field = field || this.valueField;
        var c = [];

        // store may be filtered so get all records 
        var snapshot = this.store.snapshot || this.store.data;

        snapshot.each(function(r, index) {
            if(((this.addSelectAllItem && index > 0) || !this.addSelectAllItem) && r.get(this.checkField)) {
                c.push(r.get(field));
            }
        }, this);

        return c.join(this.separator);
    },

    //Using allChecked value 
    setValue:function(v) {


        var matchCount = 0;
        this.store.each(function(r){
            var checked = !(!v.match('(^|' + this.separator + '\\s?)' + RegExp.escape(r.get(this.valueField))+'(' + this.separator + '|$)')); // ALL 1 Line
            if(checked) matchCount++;
        },this);
        if(v.length > 0 && matchCount < 1)
        {
            return;
        }


        if(v) {
            v = '' + v;
            if(this.valueField) {
                this.store.clearFilter();
                this.allSelected = true;
                this.store.each(function(r, index) {
                    v = '' + v;
                    var checked = !(!v.match(
                                    '(^|' + this.separator + ')' + RegExp.escape(r.get(this.valueField))
                                            +'(' + this.separator + '|$)'))
                            ;

                    r.set(this.checkField, checked);

                    if (this.addSelectAllItem && index > 0) {
                        this.allSelected = this.allSelected && checked;
                    }
                }, this);

                if (this.addSelectAllItem) {
                    this.store.getAt(0).set(this.checkField, this.allSelected);
                }

                this.value = this.getCheckedValue();

                this.setRawValue(this.getCheckedDisplay());
                if(this.hiddenField) {
                    this.hiddenField.value = this.value;
                }
            }
            else {
                this.value = v;
                this.setRawValue(v);
                if(this.hiddenField) {
                    this.hiddenField.value = v;
                }
            }
            if(this.el) {
                this.el.removeClass(this.emptyClass);
            }
        }
        else {
            this.clearValue();
        }
    },

    // Create a specific record for selectAll item 
    initList : function(){
        if(!this.list){

            //add specific record          
            if(this.store && this.addSelectAllItem){
                var RecordType = Ext.data.Record.create([this.valueField, this.displayField]);
                var data = {};
                data[this.valueField] = this.selectAllValueField;
                data[this.displayField] = this.selectAllTextField;
                this.store.insert(0, [new RecordType(data)]);
            }

            var cls = 'x-combo-list';

            this.list = new Ext.Layer({
                shadow: this.shadow, cls: [cls, this.listClass].join(' '), constrain:false
            });

            var lw = this.listWidth || Math.max(this.wrap.getWidth(), this.minListWidth);
            this.list.setWidth(lw);
            this.list.swallowEvent('mousewheel');
            this.assetHeight = 0;

            if(this.title){
                this.header = this.list.createChild({cls:cls+'-hd', html: this.title});
                this.assetHeight += this.header.getHeight();
            }

            this.innerList = this.list.createChild({cls:cls+'-inner'});
            this.innerList.on('mouseover', this.onViewOver, this);
            this.innerList.on('mousemove', this.onViewMove, this);
            this.innerList.setWidth(lw - this.list.getFrameWidth('lr'));

            if(this.pageSize){
                this.footer = this.list.createChild({cls:cls+'-ft'});
                this.pageTb = new Ext.PagingToolbar({
                    store:this.store,
                    pageSize: this.pageSize,
                    renderTo:this.footer
                });
                this.assetHeight += this.footer.getHeight();
            }

            this.view = new Ext.DataView({
                applyTo: this.innerList,
                tpl: this.tpl,
                singleSelect: true,
                selectedClass: this.selectedClass,
                itemSelector: this.itemSelector || '.' + cls + '-item'
            });

            this.view.on('click', this.onViewClick, this);

            this.bindStore(this.store, true);

            if(this.resizable){
                this.resizer = new Ext.Resizable(this.list,  {
                    pinned:true, handles:'se'
                });
                this.resizer.on('resize', function(r, w, h){
                    this.maxHeight = h-this.handleHeight-this.list.getFrameWidth('tb')-this.assetHeight;
                    this.listWidth = w;
                    this.innerList.setWidth(w - this.list.getFrameWidth('lr'));
                    this.restrictHeight();
                }, this);
                this[this.pageSize?'footer':'innerList'].setStyle('margin-bottom', this.handleHeight+'px');
            }
        }
    },

    //Toggle action for de/selectAll 
    toggleAll:function(){
        if(this.allSelected){
            this.allSelected = false;
            this.deselectAll();
        }else{
            this.allSelected = true;
            this.selectAll();
        }
    }
});
