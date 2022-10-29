import Head from 'next/head'
import React from 'react'
import Link from 'next/Link'
import { useEffect, useState } from 'react'
import ContentEditable from "react-contenteditable";
import { Socket } from 'net';


// I need to replicate this hash table over other nodes.
// The get/set API's won't change. All I need is to say now replicate
// Or keep the replication transparent, how ?
// This client will become a temporary node in a cluster replicate and leave
// Very similar to git commit and git push except that the push is implicit

class ReplicatedHashTable {
  
  constructor() {
    this.table = new Array(127);
    this.size = 0
    this.serverMap = new Map();
    this.serverMap[75] = "ws://localhost:8000";
    this.serverMap.set(75, "ws://localhost:8000");
  }

  getPartitionId(parentServer) {

  }

  /**
   * The hash this value returns can be an index into a server_id. 
   * We can look up that server id in another map to find out 
   * the actual server IP/domain and push the data packet to that machine. 
   * 
   * @param {key to insert} key 
   * @returns the hash index of the array or the server id.
   */
  _hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash += key.charCodeAt(i);
    }
    console.log(hash);
    return hash % this.table.length;
  }

  set(key, value) {
    const index = this._hash(key);
    console.log("The set index is ", index);
    const server_url = this.serverMap.get(index);
    let socket = new WebSocket(server_url);
    console.log("Server URL: ", server_url);
    this.table[index] = [key, value];
    this.size++;

    // replicate to another server 
    socket.onopen = function () {
      socket.send(JSON.stringify({
        key: key,
        value: value,
        partition_id: 1}));
    }
    socket.onmessage = function (s) {
      console.log("Got reply ", s);
    }
  }

  get(key) {
    const index = this._hash(key); 
    console.log("The get index is ", index);
    return this.table[index][1];
  }

  remove(key) {
    const index = this._hash(key);
    if (this.table[index] && this.table[index].length) {
      this.table[index] = [];
      this.size--;
      return true;
    } else {
      return false;
    }
  }
}

export default function Home() {
  const [localData, setLocalData] = useState("");
  const [localRawData, setLocalRawData] = useState("");
  const contentEditable = React.createRef();
  // Temporary hack for testing a feature
  const localMap = new ReplicatedHashTable();
  
  const handleTextChange = (event) => {
    //setLocalData(event.target.value)
    //console.log('Local data', localData);
    
    localMap.set("key", event.target.value);
    console.log("Retrieval from map", localMap.get("key"));
  }

  function transform(data) {
    const test = `${data}`;
    return test;
  }

  return (
    <div className="container">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          Read <Link href = "/posts/first-post"> This page</Link>
        </h1>

        <p className="description">
          Get started by editing <code>pages/index.js</code>
        </p>

        <div className="grid">
          <p className="card">
            <h3>Documentation &rarr;</h3>
            <ContentEditable onChange = {handleTextChange}
              innerRef={contentEditable}
              html = {transform(localRawData)} 
            />
          </p>

          <a href="https://nextjs.org/learn" className="card">
            <h3>Learn &rarr;</h3>
            <p>Learn about Next.js in an interactive course with quizzes!</p>
          </a>

          <a
            href="https://github.com/vercel/next.js/tree/master/examples"
            className="card"
          >
            <h3>Examples &rarr;</h3>
            <p>Discover and deploy boilerplate example Next.js projects.</p>
          </a>

          <a
            href="https://vercel.com/import?filter=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className="card"
          >
            <h3>Deploy &rarr;</h3>
            <p>
              Instantly deploy your Next.js site to a public URL with Vercel.
            </p>
          </a>
        </div>
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel" className="logo" />
        </a>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;

          max-width: 800px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          flex-basis: 45%;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card:hover,
        .card:focus,
        .card:active {
          color: #0070f3;
          border-color: #0070f3;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .logo {
          height: 1em;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}
