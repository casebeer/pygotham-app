
/**
 * Block loading of records from an unsuccessful proxy read in Store.load
 *
 * Loading records from an unsuccessful proxy read results in invalid references to proprties
 * of the null records object. The records object is null since an unsuccessful load most likely
 * does not necessarily have valid data to offer.
 */
Ext.override(Ext.data.Store, {
    /**
     * @private
     * Called internally when a Proxy has completed a load request
     */
    onProxyLoad: function(operation) {
        var records = operation.getRecords();
        
        if (operation.wasSuccessful()) {
            this.loadRecords(records, operation.addRecords);
        }
        this.loading = false;
        this.fireEvent('load', this, records, operation.wasSuccessful());
        
        //TODO: deprecate this event, it should always have been 'load' instead. 'load' is now documented, 'read' is not.
        //People are definitely using this so can't deprecate safely until 2.x
        this.fireEvent('read', this, records, operation.wasSuccessful());
        
        //this is a callback that would have been passed to the 'read' function and is optional
        var callback = operation.callback;
        
        if (typeof callback === 'function') {
            callback.call(operation.scope || this, records, operation, operation.wasSuccessful());
        }
    }

});
