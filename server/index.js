const express = require("express");
const etag = require("etag");
const cors = require("cors");
const app = express();
const port = 3000;
let initalEtag = "";
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

function getRandomNumber(max) {
  return Math.floor(Math.random() * max) + 1;
}
const requestCounts = {};
function rateLimit(limit, windowMs) {
  return (req, res, next) => {
    const ip = req.ip; // Or use a user identifier if available
    const now = Date.now();

    if (!requestCounts[ip]) {
      requestCounts[ip] = {
        count: 0,
        lastReset: now,
      };
    }

    const requestData = requestCounts[ip];

    if (now - requestData.lastReset > windowMs) {
      // Reset the counter if the time window has passed
      requestData.count = 0;
      requestData.lastReset = now;
    }

    requestData.count++;

    if (requestData.count > limit) {
      res.status(429).send("Too Many Requests"); // 429: Too Many Requests
    } else {
      next();
    }
  };
}

const rateLimiter = rateLimit(5, 5 * 1000); // max 5 requests in 5 secs window

app.use(
  cors({
    // exposedHeaders: ["Etag"],
    origin: "*",
    //allowedHeaders: ["If-Modified-Since", "If-None-Match"],
  })
);

// caching
app.get("/cache-data/:id", (req, res) => {
  const id = req.params.id;

  // Set Cache-Control header to control browser caching
  //res.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
  res.set("Cache-Control", "no-store"); // Cache
  // res.set('Access-Control-Allow-Origin', 'http://localhost:3001');
  // last modified causes issues with different timezone.So it's better to use e-tag
  const ifModifiedSince = req.headers["if-modified-since"];
  const ifNoneMatch = req.headers["if-none-match"];
  console.log("initalEtag", initalEtag);
  console.log("ifNoneMatch", ifNoneMatch);
  console.log("ifModifiedSince", ifModifiedSince);
  if (initalEtag === ifNoneMatch) {
    res.status(304).end();
  } else {
    const randomNumber = getRandomNumber(Number.MAX_SAFE_INTEGER);
    const value = (parseInt(id) * randomNumber).toString();
    const etagValue = etag(value);
    initalEtag = etagValue;
    // Update lastModified if data has changed
    lastModified = new Date().toUTCString();
    const data = { id, value: `Data for ${id}` };

    res.set("etag", etagValue);
    res.set("Last-Modified", lastModified);
    res.json(data);
  }

  // Simulate fetching data from a database or external API
});

let count = 0;
// getting batches of request from front end.
app.get("/batch-data", (req, res) => {
  const delay = Math.floor(Math.random() * 200);
  count++;
  res.json(`Data send ${count} times`);
});

// applying rate limiter .
app.post("/rate-limit", rateLimiter, (req, res) => {
  res.json(`Data send from rate limit api`);
});

// This is for clustering
// if (cluster.isMaster) {
//   console.log(`Master ${process.pid} is running`);

//   // Fork workers.
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`);
//     cluster.fork(); // Replace dead workers.
//   });
// } else {
//   const expApp = express();
//   expApp.use(
//     cors({
//       origin: "*",
//     })
//   );
//   // Workers can share any TCP connection
//   expApp.get("/clustering", (req, res) => {
//     console.log(`api hit in ${process.pid}`);
//     const delay = Math.floor(Math.random() * 200);
//     count++;
//     for (let i = 0; i < 9999999999999; i++) {}
//     res.json(`Data send ${count} times`);
//   });

//   expApp.listen(port, () => {
//     // console.log(`Server listening on port ${port}`);
//   });

//   // console.log(`Worker ${process.pid} started`);
// }

if (isMainThread) {
  // Code running in the main thread

  app.get("/threads-data", (req, res) => {
    count++;
    const worker = new Worker("./worker.js", {
      workerData: { value: `New woker thread ${count} created`, count: count },
    });

    worker.on("message", (result) => {
      console.log(`Result from worker ${count}: ${result}`);
    });

    worker.on("error", (err) => {
      console.error(`Worker ${count} error : ${err}`);
    });

    worker.on("exit", (code) => {
      console.log(`Worker ${count} exited with code: ${code}`);
      res.json(`Data send ${count} times`);
    });
  });

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
