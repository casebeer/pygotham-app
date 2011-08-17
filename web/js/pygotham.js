/*global Ext */
/*global window */
/*global console */
(function (){
	'use strict';
	var Viewport, 
		TalkListPanel,
		TalkPanel;

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

	TalkPanel = Ext.extend(Ext.Panel, {
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
									PyGotham.viewport.setActiveItem(PyGotham.viewport.query('#alltalks')[0]);
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
					store: new Ext.data.Store({
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
		fullscreen: true,
		layout: 'card', 
		itemId: 'viewport', 
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
			this.viewport = new Viewport({
				fullscreen: true
			});
		}
	});
})();
