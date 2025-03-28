// call setup_bbpro --inject /path/to/this/file.js

start();

async function start() {
  await _untilBindingReady;
  const {targetInfos} = await self.bb.ctl("Target.getTargets", {});
  document.addEventListener('click', () => alert(JSON.stringify(targetInfos, null, 2)), {once:true});
  setTimeout(() => alert(JSON.stringify(targetInfos, null, 2)), 1000);
}
