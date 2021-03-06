var Class = require('Classy');
var ext = require('prime-ext');
var prime = ext(require('prime'));
var array = ext(require('prime/es5/array'));
var fn = require('prime/es5/function');
var string = ext(require('prime/es5/string'));
var type = require('prime/util/type');

var TagTemplate = require('./tag-template');

function pushChild(parent, child){
    if(!parent.name){
        console.log((new Error()).stack);
        throw('tried to add a child to a string:'+parent);
    }
    if(!parent.children) parent.children = [];
    parent.children.push(child);
}

var SmartyTemplate = new Class({
    Extends : TagTemplate,
    targets : {},
    strict : true,
    initialize: function(template){
        this.parent(template, {
            environments : [
                {
                    name : 'tag',
                    sentinels : [['{', '}']],
                    onParse : fn.bind(function(tag, parser){
                        if(parser.text != ''){
                            this.parser.tagStack.push(parser.text);
                            parser.text = ''
                        }
                        if(tag.name && tag.name[0] == '/'){
                            tag.name = tag.name.substring(1);
                            var matched = this.parser.tagStack.pop();
                            var children = [];
                            if(!matched.name){ //text node?
                                children.unshift(matched);
                                matched = this.parser.tagStack.pop();
                            }
                            while( type(matched) === 'string' || matched.closed || matched.name.toLowerCase() !== tag.name.toLowerCase() ){
                                children.unshift(matched);
                                matched = this.parser.tagStack.pop();
                                if(this.parser.tagStack.length === 0) throw('Unmatched tag:'+tag.name)
                            }
                            matched.closed = true;
                            if(this.parser.tagStack.length == 0) throw('Empty tag stack');
                            this.parser.tagStack.push(matched);
                            array.forEach(children, function(child){
                                pushChild(matched, child);
                            });
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
                            this.parser.tagStack.push(tag); //stack binary tags
                        }
                    }, this)
                }
            ],
            onComplete : function(){
                //make sure all unclosed tags are closed/attached to the root
                //(everything hanging belongs to root)
                var children = [];
                while(this.tagStack.length > 1){
                    children.unshift(this.tagStack.pop());
                }
                array.forEach(children, fn.bind(function(child){
                    pushChild(this.tagStack[0], child);
                }, this));
            }
        });
    },
    getVariable :  function(name){
        return this.get(name);
    },
    getRoot : function(){ //ok, so maybe more than smarty normally supports :P
        if(this.progenitor) return this.progenitor.getRoot();
        else return this;
    },
    renderNode : function(node){
        if(type(node) == 'string'){
            return node;
        }else{
            if(SmartyTemplate.macros[node.name]){
                return SmartyTemplate.macros[node.name](node, this);
            }else if(node.name.substring(0,1) == '$'){
                var raw = this.get(node.name.substring(1));
                return (raw == undefined)?'':raw;
            }else return '';
        }
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
SmartyTemplate.macros = {
    'foreach': function(node, template){
        var res = '';
        if(!node.attributes.from) throw('foreach macro requires \'from\' attribute');
        if(!node.attributes.item) throw('foreach macro requires \'item\' attribute');
        var from = node.attributes.from;
        var item = node.attributes.item;
        var key = node.attributes.key;
        if(!key) key = 'key';
        if(from.substring(0,1) == '$') from = from.substring(1);
        from = template.get(from);
        var func = fn.bind(function(value, index){
            template.set(key, index);
            template.set(item, value);
            array.forEach(node.children, fn.bind(function(child){
                res += template.renderNode(child);
            }, template));
        }, template);
        
        if(type(from) == 'object') prime.each(from, func);
        else array.forEach(from, func);
        return res;
    },
    'if': function(node, template){
        var res = '';
        node.clause = node.text.substring(2).trim();
        var conditionResult = SmartyTemplate.util.evaluateSmartyPHPHybridBooleanExpression(node.clause, template);
        var blocks = {'if':[]};
        array.forEach(node.children, fn.bind(function(child){
            if(blocks['else'] !== undefined){
                blocks['else'].push(child);
            }else{
                if(type(child) == 'object' && child.name == 'else'){
                    blocks['else'] = [];
                    return;
                }
                blocks['if'].push(child);
            }
        }, template));
        if(conditionResult){
            array.forEach(blocks['if'], function(child){
                res += template.renderNode(child);
            }.bind(template));
        }else if(blocks['else']){
            array.forEach(blocks['else'], fn.bind(function(child){
                res += template.renderNode(child);
            }, template));
        }
        return res;
    },
    'literal': function(node, template){
        return node.children.join("\n");
    }
};
SmartyTemplate.util = {
    evaluateSmartyPHPHybridBooleanExpression : function(expression, template){
        //var pattern = /[Ii][Ff] +(\$[A-Za-z][A-Za-z0-9.]*) *$/s;
        var pattern;
        var parts;
        expression = expression.trim();
        if(expression.toLowerCase().substring(0, 2) == 'if'){
            //todo: multilevel
            expression = expression.substring(2).trim();
            var expressions = expression.split('&&');
            var value = true;
            expressions.each(function(exp){
                value = value && this.evaluateSmartyPHPHybridBooleanExpression(exp);
            });
            return value;
        }else{
            pattern = new RegExp('(.*)( eq| ne| gt| lt| ge| le|!=|==|>=|<=|<|>)(.*)', 'm');
            parts = expression.match(pattern);
            if(parts && parts.length > 3){
                var varOne = this.evaluateSmartyPHPHybridVariable(parts[1].trim(), template);
                var varTwo = this.evaluateSmartyPHPHybridVariable(parts[3].trim(), template);
                var res;
                switch(parts[2]){
                    case '==':
                    case 'eq':
                        res = (varOne == varTwo);
                        break;
                    case '!=':
                    case 'ne':
                        res = (varOne != varTwo);
                        break;
                    case '>':
                    case 'gt':
                        res = (varOne > varTwo);
                        break;
                    case '<':
                    case 'lt':
                        res = (varOne < varTwo);
                        break;
                    case '<=':
                    case 'le':
                        res = (varOne <= varTwo);
                        break;
                    case '>=':
                    case 'ge':
                        res = (varOne >= varTwo);
                        break;
                }
                return res;
            }else{
                var res;
                if( (expression - 0) == expression && expression.length > 0){ //isNumeric?
                    res = eval(expression);
                    res = res == 0;
                }else if(expression == 'true' || expression == 'false'){ //boolean
                    res = eval(expression);
                }else{
                    res = this.evaluateSmartyPHPHybridVariable(expression, template);
                    res = (res != null && res != undefined && res != '' && res != false);
                }
                return res;
            }
        }
    },
    evaluateSmartyPHPHybridExpression : function(variableName){ // this decodes a value that may be modified by functions using the '|' separator
        if(variableName === undefined) return null;
        var methods = variableName.splitHonoringQuotes('|', ['#']);
        methods.reverse();
        //console.log(['expression-methods:', methods]);
        var accessor = methods.pop();
        var value = this.evaluateSmartyPHPHybridVariable(accessor);
        //now that we have the value, we must run it through the function stack we found
        var method;
        var params;
        var old = value;
        methods.each(function(item, index){
            params = item.split(':');
            params.reverse();
            //console.log(['expression-item:', item]);
            method = params.pop(); //1st element is
            if(method == 'default'){
                if(!value || value == '') value = this.evaluateSmartyPHPHybridVariable(params[0]);
            }else{
                value = method.apply(this, params.clone().unshift(value));
            }
        });
        return value;
    },
    evaluateSmartyPHPHybridVariable : function(accessor, template, isConf){
        if(isConf == 'undefined' || isConf == null) isConf = false;
        if(!accessor) return '';
        if(string.startsWith(accessor.toLowerCase(), '\'') && string.endsWith(accessor.toLowerCase(), '\'')) return accessor.substr(1, accessor.length-2);
        if(string.startsWith(accessor.toLowerCase(), '"') && string.endsWith(accessor.toLowerCase(), '"')) return accessor.substr(1, accessor.length-2);
        if(string.startsWith(accessor.toLowerCase(), '$smarty.')) return this.get(accessor.substr(8));
        if(string.startsWith(accessor, '$')){
            var acc = accessor.substring(1);
            return template.get(acc);
        }
        if(string.startsWith(accessor, '#') && string.endsWith(accessor, '#')){
            var cnf = accessor.substr(1, accessor.length-2);
            return this.evaluateSmartyPHPHybridVariable( cnf , true);
        }
        return template.get(accessor);
        var parts = accessor.split('.');
        parts.reverse();
        var currentPart = parts.pop();
        var currentValue;
        if(isConf){
            return this.getConf(accessor);
            //currentValue = smartyInstance.config[currentPart];
        }else switch(currentPart){
            case 'smarty':
                currentValue = this.data;
                break;
            default:
                currentValue = this.get(currentPart);
                if(currentValue == 'undefined' ) currentValue = '';
        }
        parts.each(function(item, index){
            if(!currentValue && currentValue !== 0) return;
            if(currentValue[item] == 'undefined'){
                currentValue = null;
            }else{
                currentValue = currentValue[item];
            }
        });
        return currentValue;
    }
}
SmartyTemplate.registerMacro = function(name, fn){
    SmartyTemplate.macros[name] = fn;
};
module.exports = SmartyTemplate;