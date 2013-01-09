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

var UBBTemplate = new Class({
    Extends : TagTemplate,
    targets : {},
    strict : true,
    initialize: function(template){
        this.parent(template, {
            environments : [
                {
                    name : 'tag',
                    sentinels : [['[', ']']],
                    onParse : fn.bind(function(tag, parser){
                        if(parser.text != ''){
                            pushChild(this.parser.tagStack[this.parser.tagStack.length-1], parser.text);
                            parser.text = ''
                        }
                        if(tag.name && tag.name[0] == '/'){
                            tag.name = tag.name.substring(1);
                            var matched = this.parser.tagStack.pop();
                            if(matched.name.toLowerCase() !== tag.name.toLowerCase()) throw('strict parse error!');
                            pushChild(this.parser.tagStack[this.parser.tagStack.length-1], matched);
                        }else{
                            var args = [];
                            var options = {};
                            if(tag.name.indexOf('=') !== -1){
                                args = [tag.name.substring(tag.name.indexOf('=')+1)];
                                tag.name = tag.name.substring(0, tag.name.indexOf('='));
                            }
                            args.push(options);
                            options.template = this;
                            options.subrender = fn.bind(function(callback){
                                    return this.renderChildren(tag, callback)
                            }, this);
                            if(!UBBTemplate.macros[tag.name]) throw('unknown helper macro: '+tag);
                            var macro = UBBTemplate.macros[tag.name];
                            this.parser.tagStack.push(tag); //todo: distinguish between unary and binary tags
                            Object.defineProperty(tag, 'value', {
                                get: fn.bind(function(){
                                    return macro.apply(this, args);
                                }, this)
                            });
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
    render : function(callback){
        this.parent({}, fn.bind(function(rendered){
            if(this.parser.text != ''){
                this.rendered += this.parser.text;
                this.parser.text = ''
            }
            this.whenReady(fn.bind(function(){ //some elements may be async
                callback(this.rendered);
            }, this));
        }, this));
    }
});
UBBTemplate.macros = {};
UBBTemplate.registerMacro = function(name, fn){
    UBBTemplate.macros[name] = fn;
};

UBBTemplate.registerMacro('link', function(url, options){
    var a = {};
    a.result = '<a href="'+url+'">'+options.subrender()+'</a>';
    return a.result;
});
UBBTemplate.registerMacro('email', function(mail, options){
    if(type(mail) !== 'string'){
        options = mail;
        mail = null;
    }
    var content = options.subrender();
    if(!mail) mail = content;
    return '<a href="mailto:'+mail+'">'+content+'</a>';
});
UBBTemplate.registerMacro('i', function(options){
    return '<i>'+options.subrender()+'</i>';
});
UBBTemplate.registerMacro('b', function(options){
    return '<b>'+options.subrender()+'</b>';
});
UBBTemplate.registerMacro('code', function(options){
    return '<code>'+options.subrender()+'</code>';
});
UBBTemplate.registerMacro('img', function(options){
    var src = options.subrender();
    return '<img src="'+src+'"></img>';
});

module.exports = UBBTemplate;