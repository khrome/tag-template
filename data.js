var prime = require('prime');
var Data = prime({
    data : {},
    set: function(key, value){
        var accessor = 'this.data';
        var parts = key.split('.')
        var current = this.data;
        var part;
        while(parts.length > 0){
            part = parts.pop();
            accessor += '[\''+part+'\']';
            try{
                eval('if(!'+accessor+'){ '+accessor+' = {};}');
            }catch(error){}
        }
        eval(accessor+' = value;');
        current;
    },
    get : function(key, root){
        var parts = key.split('.');
        var current = root || this.data;
        while(parts.length > 0){
            if(current === undefined) return;
            current = current[parts.shift()];
        }
        return current;
    },
    getData : function(){
        return this.data;
    },
    setData : function(data){
        this.data = data;
    }
});
module.exports = Data;