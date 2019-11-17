export function page(...content) {
  return `
    <!DOCTYPE html>
    <meta charset=utf-8>
    <meta name=viewport content="width=device-width,initial-scale=1.0,user-scalable=no">
    <title>Dosy Browser</title>
    ${content.join('')}
  `;
}
