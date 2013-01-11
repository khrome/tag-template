var Class = require('Classy');
var ext = require('prime-ext');
var prime = ext(require('prime'));
var type = require('prime/util/type');
var array = ext(require('prime/es5/array'));
var Registry = require('prime-ext/registry');
var fn = require('prime/es5/function');

var TagParser = require('tag-parser');

var Template = require('./template');
var Environment = require('./data');

var globalTagRegistry = new Registry();
var TagTemplate = new Class({
    Extends : Template,
    parsedTemplate : null,
    tagRegistry : null,
    initialize: function(text, options){
        if(!options) options = {};
        this.tagRegistry = options.registry || globalTagRegistry;
        this.parent();
        // todo: hash 
        //if(!(this.parser = this.tagRegistry.require(options.name))){
            this.parser = new TagParser(options.environments || [], options.onComplete);
            this.tagRegistry.register(options.name, this.parser);
        //}
        this.parser.on('parse', fn.bind(function(node){
            var tag = this.parser.parseTag(node.text);
            array.forEach(prime.keys(tag), function(key){
                node[key] = tag[key];
            });
        }, this));
        this.parsedTemplate = this.parser.parse(text);
    },
    renderNode : function(node){
        return this.profileNode();
    },
    getRootNodes : function(node){
        return this.parsedTemplate[0].children || [];
    }
    
});
module.exports = TagTemplate;