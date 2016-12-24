tag-template.js
==============

[![NPM version](https://img.shields.io/npm/v/tag-template.svg)]()
[![npm](https://img.shields.io/npm/dt/tag-template.svg)]()
[![Travis](https://img.shields.io/travis/khrome/tag-template.svg)]()

An NPM for template parsing and rendering supporting Smarty(the syntax, not all of php), Handlebars and UBB. Easy to extend to make your own tag parser.

Usage as a Base Class
---------------------
First include the module:

    var TagTemplate = require('tag-template');

then, extend the object using Classy (this will likely switch to prime in the future):

    var AwesomeTemplate = new Class({
        Extends : TagTemplate,
        strict : true,
        initialize: function(template){
            this.parent(template, {
                environments : []
            });
        },
        renderNode : function(node){
            //handle an individual node
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

In order to actually parse things, though you'll have to describe the tags in your document, which was done above with this line:

    this.parent(template, {
        environments : []
    });
    
The actual tag descriptions are simply objects, so lets's assume we want to parse some macros that look like:

    (tagName one two three)

    (tagName one="1" two="2" three="3")
    
Then we would configure the tags like:

    {
        name : 'parenthetical-tag',
        sentinels : [['(', ')']],
        onParse : function(tag, parser){
            //do stuff here
        }
    }
    
and the incoming parse would look something like:

    {
        name : 'tagName',
        text : 'tagName one two three',
        parts : ['one', 'two', 'three'],
        attributes : {}
    }
    
    {
        name : 'tagName',
        text : 'tagName one="1" two="2" three="3"',
        parts : ['one="1"', 'two="2"', 'three="3"'],
        attributes : {
            one : '1',
            two : '2',
            three : '3'
        }
    }
    
Then you just need to extend renderNode in order to output the results from a given node. check the existing implementations for further detail.
    
UBB
---
UBB Codes are an ancient mapping to allow basic markup in posts but restrict users usage of HTML, particularly popular on Forums. Check out some [UBB Code](http://www.freebok.net/help/ubbcode.html) docs for information.

Include it:

    var UBB = require('tag-template/ubb');
    
Then use it:

    var template = new UBB(
        '<html>\
            <head>\
                <title>[link=http://www.com.net]Awesome[/link]</title>\
            </head>\
            <body>\
                <h1>[email=man@about.town]mailzes[/email]</h1>\
            </body>\
        </html>'
    );
    template.render(function(rendered){
        //do stuff
    });

Smarty
------

This provides basic support for Smarty template parsing without any of the standard function libraries smarty usually depends on. Through careful management of macro usage, templates may be shared... but it is unlikely an existing template will drop in without modification or extending the internal macros.
        
1. **value**
    Any value can be be output in the form:
        
        {$var}
        
    or
        
        {$var.subvalue}
        
2. **if**
    the if construct allows you to conditionally execute logic, for example:
            
        {if $bobMckenzieIsDirecting}
            <!--Act!-->
        {/if}
            
    it also supports else clauses:
            
        {if $myList.length > 0}
            <!--iterate over list-->
        {else}
            <!--show 'no data' state-->
        {/if}
3. **foreach**
    You can iterate across a collection using the foreach macro which supports 3 attributes
    1. from : the object or array we are iterating over
    2. item : the variable name we store the current iteration's value in
    3. key : the variable name we store the current iteration's key in
    
    as an example:

        {foreach from="$thing" item="item" key="key"}
            <li>{$key}:{$item}</li>
        {/foreach}
4. **literal**
    An encapsulation to prevent '{}' from attempting to parse as macros, useful for wrapping inline js or css.

Include it:

    var Smarty = require('tag-template/smarty');

To actually parse a template:

    var template = new Smarty(
        '<h2>{$test}</h2>\
        <ul>\
        {foreach from="$list" item="value" key="name"}\
            <li><a>{$name}</a><b>{$value}</b></li>\
        {/foreach}\
        </ul>'
    );
    template.render(data, function(rendered){
        //do stuff!
    });
    
And to add a macro:

    Smarty.registerMacro(<name>, function(node, template){
        //stuff
    });
    
Handlebars
----------
Given that this implementation currently has an incomplete set of macros, I'll hold off on documenting this just now. The main impetus is just not using generated code in a language where you define macros with functions, and also as another test for the tag parser base.
    

Testing
-------

Run the tests at the project root with:

    mocha

Enjoy,

-Abbey Hawk Sparrow