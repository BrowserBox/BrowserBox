
// misc
  export function newName() {
    return `person${Math.round(((Math.random()+Date.now())*1e14%1e14)).toString(31)}`;
  }
