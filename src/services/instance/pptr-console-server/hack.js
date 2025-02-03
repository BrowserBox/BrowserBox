// even if we freeze the context we can still create these globals
let vagina = 12;
console.log({vagina});
this.vagina = 12;
// both fail 
// process fails because it's not in the context
//process.exit();
// the below fails because we use Object.create(null) for our context
//this.constructor.constructor("return process")().exit();
