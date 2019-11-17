const MAX_LEN = 22;
const CHAR = /^[a-zA-Z0-9\.\:\-\@]{3,}$/;

export function safe(...S) {
  const result = S.map(s => {
    const noValue = s === undefined || s === null;
    if ( noValue ) return s;
    s = s + '';
    const validChars = CHAR.test(s);
    const validLength = s.length <= MAX_LEN;
    if ( validChars && validLength ) return s;
    else throw new TypeError(`Invalid characters in input.`);
  });
  if ( result.length == 1 ) return result[0];
  else return result;
}
