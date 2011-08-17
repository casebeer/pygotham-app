/*global Ext */
/*global window */
/*global console */
(function (){
	'use strict';
	var Viewport, 
		TalkListPanel,
		TalkPanel, 
		RelayStore;

	Ext.regModel('Talk', {
		fields: [
			{ name: 'title', type: 'string' },
			{ name: 'speaker', type: 'string' },
			{ name: 'description', type: 'string' }
		],
		proxy: {
			type: 'ajax', 
			url: 'data/talks.json'
		}
	});

	RelayStore = Ext.extend(Ext.data.Store, {
		constructor: function () {
			RelayStore.superclass.constructor.apply(this, arguments);
			this.on({
				beforeload: function () {
					var me = this;
					// load data from ajax, if possible, first
					console.log('Attempting to load data from Ajax');
					if (!this.ajaxStore) {
						this.ajaxStore = new Ext.data.Store({ model: this.model });
					}

					if (!this.localStore) { 
						this.localStore = new Ext.data.Store({
							model: this.model,
							proxy: {
								type: 'localstorage', 
								id: 'PyGotham-talkcache'
							}
						});
					}

					this.ajaxStore.load({
						callback: function (records, operation, success) {
							console.log('Back from Ajax call, success: ' + success);
							if (success) {
								me.localStore.remove(me.localStore.getRange());
								me.localStore.sync();
								me.localStore.insert(0, records);
								me.localStore.sync();

								me.remove(me.getRange());
								me.insert(0, records);

								console.log('Synchronized store to LocalStorage');
								console.log(me);
								me.fresh = true;
								// todo: store in localstorage
								me.lastLoaded = new Date();
							} else {
								me.localStore.load({
									callback: function (records, operation, success) {
										me.remove(me.getRange());
										me.insert(0, records);
									}
								});
								me.fresh = false;
							}
						}
					});
				}
			});
		},
		proxy: {
			type: 'memory'
		}
	});

	TalkPanel = Ext.extend(Ext.Panel, {
		layout: 'fit', 
		scroll: 'vertical',
		style: {
			background: '#ffffff'
		},
		tpl: new Ext.XTemplate(
			'<tpl for=".">',
			'<div class="talk-display">',
			'<h2>{title}</h2>',
			'{speaker}',
			'<p>',
			'{description}',
			'</p>',
			'</div>',
			'</tpl>'
		),
		styleHtmlContent: true,
		listeners: {
			deactivate: function () {
				this.destroy();
			}
		},
		initComponent: function () {
			var me = this;
			this.dockedItems = [
				{
					xtype: 'toolbar', 
					title: 'PyGotham',
					items: [
						{ 
							text: 'Back', 
							itemId: 'back', 
							ui: 'back',
							listeners: {
								tap: function () {
									PyGotham.viewport.setActiveItem(
										PyGotham.viewport.query('#alltalks')[0],
										{ type: 'slide', reverse: 'true' }
									);
								}
							}
						}
					]
				}
			];
			this.items = [
			];
			TalkPanel.superclass.initComponent.call(this);
		} 
	});
	Ext.reg('talkpanel', TalkPanel);

	TalkListPanel = Ext.extend(Ext.Panel, {
		layout: 'fit', 
		style: {
			background: '#ffffff'
		},
		initComponent: function () {
			this.dockedItems = [
				{
					xtype: 'toolbar', 
					title: 'PyGotham'
				}
			];
			this.items = [
				{
					xtype: 'list', 
					itemTpl: new Ext.XTemplate(
						'<h4>{title}</h4>',
						'{speaker}'
					),
					listeners: {
						itemtap: function (list, index, item, evt) {
							var talk = new TalkPanel();
							talk.update(list.store.getAt(index).data);
							PyGotham.viewport.setActiveItem(talk);
							window.setTimeout(function () { list.deselect(index); }, 50);
						}
					},
					plugins: [
						new Ext.plugins.PullRefreshPlugin({
							refreshFn: function (callback, plugin) {
								console.log(plugin);
								// manually implement the refresh/complete calls for later override
								plugin.list.getStore().load();
								plugin.onLoadComplete.call(plugin);
							}
						})
					],
					store: new RelayStore({
						model: 'Talk',
						autoLoad: true
					})
				}
			];
			TalkListPanel.superclass.initComponent.call(this);
		}
	});
	Ext.reg('talklistpanel', TalkListPanel);

	Viewport = Ext.extend(Ext.Panel, {
		itemId: 'viewport', 
		fullscreen: true,
		layout: 'card', 
		cardSwitchAnimation: 'slide',
		initComponent: function () {
			this.items = [
				{
					xtype: 'talklistpanel', 
					itemId: 'alltalks'
				}
			];
			Viewport.superclass.initComponent.call(this);
		}
	});
	Ext.reg('viewport', Viewport);

	Ext.regApplication('PyGotham', {
		launch: function() {
			this.viewport = new Viewport();
		}
	});
})();
