const { parentPort, workerData } = require("worker_threads");

// Access data passed from the main thread
const value = workerData.value;
console.log(value);

// Perform CPU-intensive task
for (let i = 0; i < 9999999999; i++) {}

// Send the result back to the main thread
parentPort.postMessage(`Has finsihed execution`);
