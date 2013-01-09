var Handlebars = require('./handlebars');
var UBB = require('./ubb');
/*Handlebars.registerHelper('link', function(text, url) {
  text = Handlebars.Utils.escapeExpression(text);
  url  = Handlebars.Utils.escapeExpression(url);

  var result = '<a href="' + url + '">' + text + '</a>';

  return new Handlebars.SafeString(result);
});*/
var template = new UBB('<html><head><title>[link=http://www.freebok.net]Freebok[/link]</title></head><body><h1>[email=abbey@khrome.net]mailzes[/email]</h1><p>sjdnjsnd</p></body></html>');
console.log('parsed', template.parsedTemplate);
template.render(function(rendered){
    console.log('woo', rendered, '!');
});
/*var template = new Handlebars('<html><head><title>{{#with info}}{{title}}{{/with}}</title></head><body><h1>fdsdf</h1><p>sjdnjsnd</p></body></html>');
console.log('parsed', template.parsedTemplate);
template.render({info:{
    title : 'wewt'
}}, function(rendered){
    console.log('woo', rendered, '!');
});*/
