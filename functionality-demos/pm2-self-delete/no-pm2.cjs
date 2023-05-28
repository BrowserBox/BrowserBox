// no-pm2.mjs
var import_child_process = require("child_process");
console.log(`Hello`);
setTimeout(() => console.log("GOodbye"), 1e4);
console.log("name", process.env.name);
setTimeout(() => {
  if (process.env.PM2_USAGE && process.env?._?.endsWith?.("pm2")) {
    console.info(`Running with pm2. Deleting...`);
    console.log(process.title, process.argv, process.env);
    (0, import_child_process.exec)(`pm2 delete ${process.env.name}`);
  }
}, 5e3);
