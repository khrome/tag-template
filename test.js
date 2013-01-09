var should = require("should");
var request = require("request");
var type = require('prime/util/type');
var Handlebars = require('./handlebars');
var UBB = require('./ubb');
var Smarty = require('./smarty');

describe('TagTemplate', function(){
    
    describe('extended by Handlebars', function(){
        
        //*
        it('parses a simple expression', function(done){
            var template = new Handlebars('<html><head><title>{{#with info}}{{title}}{{/with}}</title></head><body><h1>fdsdf</h1><p>sjdnjsnd</p></body></html>');
            template.render({info:{
                title : 'wewt'
            }}, function(rendered){
                rendered.indexOf('<title>wewt</title>').should.not.equal(-1);
                done();
            });
        });//*/
    
    });
    
    describe('extended by UBB', function(){
        
        it('parses a simple expression', function(done){
            var template = new UBB('<html><head><title>[link=http://www.freebok.net]Freebok[/link]</title></head><body><h1>[email=abbey@khrome.net]mailzes[/email]</h1><p>sjdnjsnd</p></body></html>');
            template.render(function(rendered){
                rendered.indexOf('<a href="http://www.freebok.net">Freebok</a>').should.not.equal(-1);
                rendered.indexOf('<a href="mailto:abbey@khrome.net">mailzes</a>').should.not.equal(-1);
                done();
            });
        });
    
    });
    
    describe('extended by Smarty', function(){
        
        it('parses a simple expression', function(done){
            var template = new Smarty(
'<h2>{$test}</h2>\
<ul>\
{foreach from="$list" item="value" key="name"}\
    <li><a>{$name}</a><b>{$value}</b></li>\
{/foreach}\
</ul>'
            );
            template.render({
                test : 'hoooot',
                list : {
                    foo:'bar',
                    fooz:'baz',
                    fo:'sho'
                }
            }, function(rendered){
                rendered.indexOf('<h2>hoooot</h2>').should.not.equal(-1);
                rendered.indexOf('<a>foo</a><b>bar</b>').should.not.equal(-1);
                rendered.indexOf('<a>fooz</a><b>baz</b>').should.not.equal(-1);
                rendered.indexOf('<a>fo</a><b>sho</b>').should.not.equal(-1);
                done();
            });
        });
    
    });
});