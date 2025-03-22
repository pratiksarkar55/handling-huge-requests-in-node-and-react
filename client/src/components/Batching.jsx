import React, { useEffect, useState } from "react";

const Batching = () => {
  const [requestsSent, setRequestsSent] = useState(0);
  const [text, setText] = useState(0);
  const [requestsFailed, setRequestsFailed] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [concurrency, setConcurrency] = useState(10); // Number of concurrent requests
  const [totalRequests, setTotalRequests] = useState(100);

  const sendRequest = async () => {
    try {
      await fetch("http://localhost:3000/threads-data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // await fetch("http://localhost:3000/rate-limit", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: {
        //     ip: "127.0.0.1",
        //   },
      });
      setRequestsSent((prev) => prev + 1);
    } catch (error) {
      console.error("Request failed:", error);
      setRequestsFailed((prev) => prev + 1);
    }
  };

  const startTest = async () => {
    setIsTesting(true);
    setRequestsSent(0);
    setRequestsFailed(0);
    const promises = [];
    console.time();
    for (let i = 0; i < totalRequests; i++) {
      promises.push(sendRequest());
      if (promises.length >= concurrency) {
        const data = await Promise.all(promises);
      }
    }
    await Promise.all(promises); //ensure last batch completes.
    console.timeEnd();
    setIsTesting(false);
  };

  return (
    <div>
      <h1>Stress Test</h1>
      <div>
        <label>Concurrency: </label>
        <input
          type="number"
          value={concurrency}
          onChange={(e) => setConcurrency(parseInt(e.target.value))}
        />
      </div>
      <div>
        <label>Total Requests: </label>
        <input
          type="number"
          value={totalRequests}
          onChange={(e) => setTotalRequests(parseInt(e.target.value))}
        />
      </div>
      <button onClick={startTest} disabled={isTesting}>
        {isTesting ? "Testing..." : "Start Test"}
      </button>
      <button
        onClick={() => {
          setText(text + 1);
        }}
      >
        Display
      </button>
      <p>Requests Sent: {requestsSent}</p>
      <p>Requests Failed: {requestsFailed}</p>
      <p>Hello world {text}</p>
    </div>
  );
};

export default Batching;
