Ext.grid.ColumnModel.override({
  getTotalWidth: function(includeHidden) {
      var off = 0;
      if(!Ext.isDefined(Ext.isChrome19)){
        Ext.isChrome19 = /\bchrome\/19\b/.test(navigator.userAgent.toLowerCase());
      };
      if (Ext.isChrome19){
          off = 2;
      };
    if (!this.totalWidth) {
      this.totalWidth = 0;
      for (var i = 0, len = this.config.length; i < len; i++) {
        if (includeHidden || !this.isHidden(i)) {
          this.totalWidth += this.getColumnWidth(i)+off;
        };
      };
    };
    return this.totalWidth;
  }
});

