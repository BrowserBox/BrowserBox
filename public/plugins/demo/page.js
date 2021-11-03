export function pluginsDemoPage({body:body = ''} = {}) {
  return `
    <head>
      <title>Demo</title>
      <link rel=stylesheet href=/plugins/demo/styles/styletidyup.css>
      <!--
      <link rel=stylesheet href=styles/basic.css>
      <link rel=stylesheet href=styles/dark.css>
      <link rel=stylesheet href=styles/light.css>
      <link rel=stylesheet href=styles/darkmode.css>
      -->
    </head>
    <body>
      ${body}
      <script src=/plugins/demo/listen.js></script>
      <script src=/plugins/demo/doingit.js></script>
      <script src=/plugins/demo/stripe.js></script>
    </body>
  `;
}
