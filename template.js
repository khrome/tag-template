var ext = require('prime-ext');
var prime = ext(require('prime'));
var Class = require('Classy');
var type = require('prime/util/type');
var string = ext(require('prime/es5/string'));
var array = ext(require('prime/es5/array'));
var Emitter = require('prime/util/emitter');
var Options = require('prime-ext/options');
var InternalWorker = require('prime-ext/internal-worker');
var Environment = require('./data');
var fn = require('prime/es5/function');

var Template = new Class({ //abstract implementation
    Implements : [InternalWorker],
    progenitor : false,
    initialize: function(options){
        this.environment = new Environment();
        var ob = this;
        Object.defineProperty(this, 'root', {
            get : function(){
                if(!ob.progenitor) return this;
                else return ob.progenitor.root;
            }, set : function(){
                throw('cannot set root');
            }
        });
    },
    renderNode : function(node){
        return this.profileNode();
    },
    getRootNodes : function(node){
        return [];
    },
    profileNode : function(node){
        return JSON.stringify(node);
    },
    get : function(key, root){
        return this.environment.get(key, root);
    },
    set : function(key, value){
        return this.environment.set(key, value);
    },
    async : function(){
        this.addJob();
        return '{{{{'+this.postProcessReturnCount+'}}}}';
    },
    'return' : function(id, text){
        if(id && text) this.rendered = this.rendered.replace(id, text);
        this.removeJob();
    },
    renderChildren : function(node, callback){
        var rendered = '';
        var nodes = node.children;
        array.forEach(nodes, fn.bind(function(node){
            rendered += this.renderNode(node);
        }, this));
        if(callback) callback(rendered);
        return rendered;
    },
    render : function(data, callback){
        this.environment.setData(data);
        this.rendered = '';
        var nodes = this.getRootNodes();
        array.forEach(nodes, fn.bind(function(node){
            this.rendered += this.renderNode(node);
        }, this));
        this.whenReady(fn.bind(function(){
            callback(this.rendered);
        }, this));
    }
    
});
module.exports = Template;