(function (){
	// ISO8601 parser from http://dansnetwork.com/javascript-iso8601rfc3339-date-parser/
	Date.prototype.setISO8601 = function (dString) {
		var regexp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T| )(\d\d)(:)?(\d\d)(:)?(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:)?(\d\d))/,
			d,
			offset;

		if (dString.toString().match(new RegExp(regexp))) {
			d = dString.match(new RegExp(regexp));
			offset = 0;

			this.setUTCDate(1);
			this.setUTCFullYear(parseInt(d[1],10));
			this.setUTCMonth(parseInt(d[3],10) - 1);
			this.setUTCDate(parseInt(d[5],10));
			this.setUTCHours(parseInt(d[7],10));
			this.setUTCMinutes(parseInt(d[9],10));
			this.setUTCSeconds(parseInt(d[11],10));
			if (d[12]) {
				this.setUTCMilliseconds(parseFloat(d[12]) * 1000);
			} else {
				this.setUTCMilliseconds(0);
			}
			if (d[13] != 'Z') {
				offset = (d[15] * 60) + parseInt(d[17],10);
				offset *= ((d[14] == '-') ? -1 : 1);
				this.setTime(this.getTime() - offset * 60 * 1000);
			}
		} else {
			this.setTime(Date.parse(dString));
		}
		return this;
	};
}());
/*global Ext */
/*global window */
/*global console */
(function (){
	'use strict';
	var Viewport, 
		TalkListPanel,
		TalkPanel, 
		RelayStore, 
		InfoPanel,
		format_date;
	
	format_date = function (d) {
		var days = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
			day,
			hours,
			pm,
			minutesString;

		if (!d) {
			return "";
		}

		day = days[d.getDay()];
		hours = (d.getHours() < 1 || d.getHours() > 12) ?
			d.getHours() % 12 || 12 :
			d.getHours();
		pm =  d.getHours() >= 12;
		minutesString = (d.getMinutes() < 10 ? '0' : '') + String(d.getMinutes());
		return day + ' ' + String(hours) + ':' + minutesString + (pm ? 'pm' : 'am');
	}

	Ext.regModel('Talk', {
		fields: [
			{ name: 'id', type: 'int' },
			{ name: 'title', type: 'string' },
			{ name: 'full_name', type: 'string' },
			{ name: 'speaker', type: 'string', mapping: 'full_name' },
			{ name: 'desc', type: 'string' },
			{ name: 'description', type: 'string', mapping: 'desc' },
			{ name: 'outline', type: 'string' },
			{ name: 'talk_day_time', type: 'string' }, 
			{ 
				name: 'start_time', 
				type: 'date', 
				mapping: 'talk_day_time', 
				convert: function (v) { var d = new Date(); return d.setISO8601(v + '-04:00'); }
			},
			{ name: 'talk_end_time', type: 'string' }, 
			{ 
				name: 'end_time', 
				type: 'date', 
				mapping: 'talk_end_time', 
				convert: function (v) { var d = new Date(); return d.setISO8601(v + '-04:00'); }
			},
			{ name: 'levels', type: 'array' },
			{ name: 'room_number', type: 'string' },
			{ name: 'talktype', type: 'string' }
		],
		proxy: {
			type: 'memory'
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

					console.log(this.ajaxStore);

					if (!this.localStore) { 
						this.localStore = new Ext.data.Store({
							model: this.model,
							proxy: {
								type: 'localstorage', 
								id: 'PyGotham-schedule-cache'
							}
						});
					}

					this.ajaxStore.load({
						callback: function (records, operation, success) {
							console.log('Back from Ajax call, success: ' + success);
							if (success) {
								window.setTimeout(function () {
									me.localStore.load();
									me.localStore.remove(me.localStore.getRange());
									me.localStore.sync();
									me.localStore.insert(0, records);
									me.localStore.sync();
									console.log('Synchronized store to LocalStorage');
									console.log(me);
								}, 500);

								me.remove(me.getRange());
								me.insert(0, records);

								me.fresh = true;
								// todo: store in localstorage
								me.lastLoaded = new Date();
							} else {
								if (me.getCount() == 0) {
									console.log('No records in store, loading from localstorage');
									me.localStore.load({
										callback: function (records, operation, success) {
											me.remove(me.getRange());
											//me.sync();
											me.insert(0, records);
										}
									});
								}
								me.fresh = false;
							}
						}
					});
				}
			});
			if (!this.ajaxStore) {
				this.ajaxStore = new Ext.data.Store({ 
					model: this.model,
					proxy: this.ajaxProxy
				});
			}
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
			'<div class="speaker">{speaker}</div>',
			'<div class="speaker">',
			'{[ this.format_date(values.start_time)]}',
			' · Room {room_number}',
			' · {[ (typeof values.levels === "string") ? values.levels : values.levels.join("&nbsp;/&nbsp;") ]}',
			'</div>',
			'<p>',
			'{description}',
			'</p>',
			'</div>',
			'</tpl>',
			{
				format_date: format_date
			}
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
	
	InfoPanel = Ext.extend(Ext.Panel, {
		layout: {
			type: 'vbox', 
			align: 'stretch'
		},
		styleHtmlContent: true,
		listeners: {
			deactivate: function () {
				this.destroy();
				console.log('Destroyed info panel.');
			}
		},
		initComponent: function () {
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
			this.contentPanel = new Ext.Panel({
				tpl: new Ext.XTemplate(
					'<dl>',
					'<dt>Version</dt>',
					'<dd>{VERSION}</dd>',
					'<dt>Total Local Objects</dt>',
					'<dd>{localStorageSize}</dd>',
					'</dl>',
					{
					}
				)
			});
			this.items = [
				this.contentPanel,
				{ xtype: 'spacer' },
				{
					html: '<p>App by <a href="http://chc.name/" ' +
							'target="_blank">Christopher Casebeer</a>. ' +
							'Source code ' +
							'<a href="https://github.com/casebeer/pygotham-app" ' +
							'target="_blank">available on Github</a>.' +
							'</p><p>&nbsp;</p>'
							
				},
				{ 
					xtype: 'button', 
					text: 'Reset', 
					listeners: {
						tap: function () {
							window.localStorage.clear();
							window.location = window.location;
						}
					}
				}
			];
			this.on({
				render: function () {
					this.contentPanel.update({
						VERSION: window.VERSION,
						localStorageSize: window.localStorage.length
					});
				}
			});
			InfoPanel.superclass.initComponent.call(this);
		}
	});
	Ext.reg('infopanel', InfoPanel);

	TalkListPanel = Ext.extend(Ext.Panel, {
		layout: 'fit', 
		style: {
			background: '#ffffff'
		},
		initComponent: function () {
			this.dockedItems = [
				{
					xtype: 'toolbar', 
					title: 'PyGotham',
					items: [
						{ xtype: 'spacer' },
						{ 
							iconCls: 'info', 
							iconMask: true, 
							ui: 'round', 
							itemId: 'about',
							listeners: {
								tap: function () {
									var infoPanel = new InfoPanel();
									PyGotham.viewport.setActiveItem(infoPanel);
								}
							}
						}
					]
				}
			];
			this.items = [
				{
					xtype: 'list', 
					flex: 1,
					itemTpl: new Ext.XTemplate(
						'<h4>{title}</h4>',
						'<div class="speaker">{speaker} · {[ this.format_date(values.start_time) ]} · Room {room_number}</div>',
						'</div>',
						//'<div class="summary">{summary}</div>',
						{
							format_date: format_date
						}
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
					grouped: true,
					store: new RelayStore({
						model: 'Talk',
						ajaxProxy: {
							type: 'scripttag', 
							//url: 'data/schedule.json'
							url: 'http://pipes.yahoo.com/pipes/pipe.run?u=https%3A%2F%2Fpygotham.org%2Ftalkvote%2Fjson_schedule&_id=332d9216d8910ba39e6c2577fd321a6a&_render=json',
							callbackParam: '_callback',
							timeout: 10000,
							reader: {
								type: 'json',
								root: 'value.items[0].json'
							}
						},
						autoLoad: true, 
						getGroupString: function (record) {
							return format_date(record.get('start_time'));
						}
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
