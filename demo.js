var Handlebars = require('./handlebars');
var UBB = require('./ubb');
var Smarty = require('./smarty');
/*Handlebars.registerHelper('link', function(text, url) {
  text = Handlebars.Utils.escapeExpression(text);
  url  = Handlebars.Utils.escapeExpression(url);

  var result = '<a href="' + url + '">' + text + '</a>';

  return new Handlebars.SafeString(result);
});*/
/*var template = new UBB('<html><head><title>[link=http://www.freebok.net]Freebok[/link]</title></head><body><h1>[email=abbey@khrome.net]mailzes[/email]</h1><p>sjdnjsnd</p></body></html>');
console.log('parsed', template.parsedTemplate);
template.render(function(rendered){
    console.log('woo', rendered, '!');
}); //*/
/*var template = new Handlebars('<html><head><title>{{#with info}}{{title}}{{/with}}</title></head><body><h1>fdsdf</h1><p>sjdnjsnd</p></body></html>');
console.log('parsed', template.parsedTemplate);
template.render({info:{
    title : 'wewt'
}}, function(rendered){
    console.log('woo', rendered, '!');
});*/

var template = new Smarty(
'{thing wrapper="testWrapper"}\
<h2>{$test}</h2>\
<h2>{$test}</h2>\
<h2>{$test}</h2>\
<h2>{$test}</h2>\
{foreach from="$list" item="value" key="name"}\
    <li><a>{$name}</a><b>{$value}</b></li>\
{/foreach}'
);
template.render({
    test : 'hoooot',
    list : {
        foo:'bar',
        fooz:'baz',
        fo:'sho'
    }
}, function(rendered){
    console.log('??', rendered);
    //console.log(rendered);
    //rendered.indexOf('<h2>hoooot</h2>').should.not.equal(-1);
    //rendered.indexOf('<a>foo</a><b>bar</b>').should.not.equal(-1);
    //rendered.indexOf('<a>fooz</a><b>baz</b>').should.not.equal(-1);
    //rendered.indexOf('<a>fo</a><b>sho</b>').should.not.equal(-1);
    //done();
});
