var Class = require('Classy');
var ext = require('prime-ext');
var prime = ext(require('prime'));
var array = ext(require('prime/es5/array'));
var fn = require('prime/es5/function');
var type = require('prime/util/type');

var TagTemplate = require('./tag-template');
var TagParser = require('tag-parser');

var sanitize = require('validator').sanitize;

function pushChild(parent, child){
    if(!parent.children) parent.children = [];
    parent.children.push(child);
}

var HandlebarsTemplate = new Class({
    Extends : TagTemplate,
    targets : {},
    strict : true,
    initialize: function(template){
        this.parent(template, {
            environments : [
                {
                    name : 'literal',
                    sentinels : [['{{{', '}}}']],
                    onParse : fn.bind(function(tag, parser){
                        Object.defineProperty(tag, 'value', {
                            get: fn.bind(function(){
                                return sanitize(this.get(tag.name)).entityDecode();
                            }, this)
                        });
                        pushChild(parser.tagStack[parser.tagStack.length-1], tag);
                    }, this)
                },
                {
                    name : 'tag',
                    sentinels : [['{{', '}}']],
                    onParse : fn.bind(function(tag, parser){
                        if(parser.text != ''){
                            pushChild(this.parser.tagStack[this.parser.tagStack.length-1], parser.text);
                            parser.text = ''
                        }
                        if(tag.name && tag.name[0] == '/'){
                            tag.name = tag.name.substring(1);
                            var matched = this.parser.tagStack.pop();
                            if(matched.name.toLowerCase() !== tag.name.toLowerCase()) throw('strict parse error!');
                            matched.macro = true;
                            pushChild(this.parser.tagStack[this.parser.tagStack.length-1], matched);
                        }else{
                            if(tag.name && tag.name[0] == '#'){
                                tag.name = tag.name.substring(1);
                                if(!HandlebarsTemplate.helpers[tag.name]) throw('unknown helper macro: '+tag);
                                this.parser.tagStack.push(tag);
                                var helper = HandlebarsTemplate.helpers[tag.name];
                                var helperWrap;
                                var executeChildrenWithScope = fn.bind(function(children, scope){
                                    var a = {rendered:''};
                                    array.forEach(children , fn.bind(function(node){
                                        node.scope = scope;
                                        a.rendered += this.renderNode(node);
                                    }, this));
                                    return a.rendered;
                                    //return this.renderNode(tag);
                                }, this);
                                var scope = this.environment.data;
                                var scopeAccess = function(newScope){
                                    scope = newScope;
                                };
                                if(prime.keys(tag.attributes).length > 0){
                                    helperWrap = fn.bind(function(){
                                        var options = tag.attributes;
                                        options.scope = scopeAccess;
                                        options.fn = function(){
                                            executeChildrenWithScope(tag.children, scope);
                                        }
                                        tag.scope = scope;
                                        return helper.apply(this, [options]);
                                    }, this);
                                }else{
                                    helperWrap = fn.bind(function(){
                                        var options = {};
                                        var args = [];
                                        array.forEach(tag.parts, fn.bind(function(part){
                                            args.push(this.get(part));
                                        }, this));
                                        args.push(options);
                                        options.scope = scopeAccess;
                                        options.fn = function(){
                                            return executeChildrenWithScope(tag.children, scope);
                                        };
                                        tag.scope = scope;
                                        return helper.apply(this, args);
                                    }, this);
                                }
                                Object.defineProperty(tag, 'value', {
                                    get: fn.bind(function(){
                                        return helperWrap();
                                    }, this)
                                });
                            }else{ //reference
                                Object.defineProperty(tag, 'value', {
                                    get: fn.bind(function(){
                                        return this.get(tag.name, tag.scope);
                                    }, this)
                                });
                                pushChild(this.parser.tagStack[this.parser.tagStack.length-1], tag);
                            }
                        }
                    }, this)
                }
            ]
        });
    },
    renderNode : function(node){
        if(type(node) === 'string') return node;
        else return node.value;
    },
    render : function(data, callback){
        this.parent(data, fn.bind(function(rendered){
            if(this.parser.text != ''){
                rendered += this.parser.text;
                this.parser.text = ''
            }
            callback(rendered);
        }, this));
    }
});
HandlebarsTemplate.helpers = {};
HandlebarsTemplate.registerHelper = function(name, fn){
    HandlebarsTemplate.helpers[name] = fn;
};

HandlebarsTemplate.registerHelper('with', function(scope, options){
    options.scope(scope);
    return options.fn();
})
module.exports = HandlebarsTemplate;