console.log("Process environment keys:");
Object.keys(process.env).sort().forEach(key => {
  console.log(key);
});
