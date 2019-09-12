var ggc = false;
odoo.define('dhx_gantt.GanttController', function (require) {
    "use strict";
var AbstractController = require('web.AbstractController');
var core = require('web.core');
var dialogs = require('web.view_dialogs');
// var BasicController = require('web.BasicController');
var GanttController = AbstractController.extend({
    custom_events: _.extend({}, AbstractController.prototype.custom_events, {
        // gantt_data_updated: '_onGanttUpdated',
        gantt_create_dp: '_onGanttCreateDataProcessor',
        gantt_config: '_onGanttConfig',
        gantt_show_critical_path: '_onShowCriticalPath',
    }),
    date_object: new Date(),
    init: function (parent, model, renderer, params) {
        console.log('controller init');
        ggc = this;
        this._super.apply(this, arguments);
    },
    _onGanttCreateDataProcessor: function(event){
        var self = this;
        var dp = gantt.createDataProcessor(function(entity, action, data, id){
            console.log('createDataProcessor');
            console.log('entity');
            console.log({entity});
            console.log({action});
            console.log({data});
            console.log({id});
            // const services = {
            //     "task": this.taskService,
            //     "link": this.linkService
            // };
            // const service = services[entity];
            switch (action) {
                case "update":
                    // return self.trigger_up('gantt_data_updated', {entity, data});
                    switch(entity){
                        case "task":
                            return self.model.updateTask(data);
                    }
                    // return service.update(data);
                case "create":
                    switch(entity){
                        case "link":
                            return self.model.createLink(data);
                    }
                case "delete":
                    self.trigger_up('gantt_data_deleted', {entity, data});
                    // return service.remove(id);
            }
        });
        dp.attachEvent("onAfterUpdate", function(id, action, tid, response){
            if(action == "error"){
                console.log('nice "an error occured :)"');
            }else{
                // self.loadGantt();
                return true;
            }
        });
        dp.attachEvent("onBeforeUpdate", function(id, state, data){
            console.log('BeforeUpdate. YAY!');
            data.csrf_token = core.csrf_token;
            data.model_name = self.modelName;
            data.timezone_offset = (-self.date_object.getTimezoneOffset());
            data.map_text = self.map_text;
            data.map_text = self.map_text;
            data.map_id_field = self.map_id_field;
            data.map_date_start = self.map_date_start;
            data.map_duration = self.map_duration;
            data.map_open = self.map_open;
            data.map_progress = self.map_progress;
            data.link_model = self.link_model;
            console.log('data are ');
            console.log(data);
            return true;
        });
    },
    // _onGanttUpdated: function(event){
    //     event.stopPropagation();
    //     console.log('_onGanttUpdated');
    //     console.log(event.data.entity);
    //     console.log(event.data.data);
    //     switch(event.data.entity){
    //         case "task":
    //             return this.model.updateTask(event.data.data);
    //         case "link":
    //     }
    // }
    _onGanttConfig: function(){
        var self = this;
        gantt.attachEvent('onBeforeLightbox', function(id) {
            console.log('onBeforeLightbox');
            var task = gantt.getTask(id);
            var title = task.text;
            if(self.form_dialog && !self.form_dialog.isDestroyed()){
                return false;
            }
            self.form_dialog = new dialogs.FormViewDialog(self, {
                res_model: self.model.modelName,
                res_id: parseInt(id, 10).toString() === id ? parseInt(id, 10) : id,
                context: self.getSession().user_context,
                title: title,
                // view_id: Number(this.open_popup_action),
                on_saved: function(record, isChanged){
                    self.write_completed(record, isChanged);
                }
            }).open();
            return false;//return false to prevent showing the default form
        });
    },
    write_completed: function (record, isChanged) {
        console.log('write_completed');
        console.log(this.renderer.domain);
        if(isChanged){
            var params = {
                context: this.context,
            };

            // this.update(params, options);
            this.update(params);
        }
    },
    _onShowCriticalPath: function(){
        event.stopPropagation();
        var self = this;
        var def;

        if(this.criticalRendered){
            this.criticalRendered = false;
            self.renderer.undoRenderCriticalTasks();
            return;
        }
        else{
            this.criticalRendered = true;
        }

        this._disableAllButtons();
        def = self.model.getCriticalPath().then(function (result) {
            console.log('critical path result');
            console.log(result);
            self.renderer.renderCriticalTasks(result);
        });
        def.always(this._enableAllButtons.bind(this));
    },
    _disableAllButtons: function () {
        this.renderer.disableAllButtons();
    },
    _enableAllButtons: function () {
        this.renderer.enableAllButtons();
    },
});
return GanttController;

});