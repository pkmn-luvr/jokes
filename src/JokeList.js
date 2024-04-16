import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Joke from './Joke';
import './JokeList.css';

/** List of jokes. */

function JokeList({ numJokesToGet = 5 }) {
  const [jokes, setJokes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const seenJokes = useRef(new Set());

  /* at mount, get jokes */
  useEffect(() => {
    const savedJokes = JSON.parse(localStorage.getItem('jokes')) || [];
    if (savedJokes.length > 0) {
      setJokes(savedJokes);
      setIsLoading(false);
    } else {
      getJokes();
    }
  }, []); 

  useEffect(() => {
    localStorage.setItem('jokes', JSON.stringify(jokes));
  }, [jokes]);

  /* retrieve jokes from API */
  async function getJokes() {
    setIsLoading(true);
    let fetchedJokes = [];
    // load jokes one at a time, adding not-yet-seen jokes
    while (fetchedJokes.length < numJokesToGet) {
      let res = await axios.get("https://icanhazdadjoke.com", {
        headers: { Accept: "application/json" }
      });
      let { id, joke } = res.data;

      if (!seenJokes.current.has(id) && !jokes.some(j => j.id === id && j.locked)) {
        seenJokes.current.add(id);
        fetchedJokes.push({ id, joke, votes: 0, locked: false });
      }
    }
   // empty joke list, set to loading state, and then call getJokes
    setJokes(prevJokes => [...prevJokes.filter(joke => joke.locked), ...fetchedJokes]);
    setIsLoading(false);
  }

  function generateNewJokes() {
    seenJokes.current = new Set(); // FURTHER STUDY - Reset seenJokes to avoid duplicates from previous sessions
    getJokes();
  }

  function resetVotes() {
    setJokes(jokes.map(joke => ({ ...joke, votes: 0 })));
    localStorage.removeItem('jokes'); // FURTHER STUDY - Clears local storage
  }
  
  /* change vote for this id by delta (+1 or -1) */
  function vote(id, delta) {
    setJokes(jokes.map(j => j.id === id ? { ...j, votes: j.votes + delta } : j));
  }

  function toggleLock(id) {
    setJokes(jokes.map(j => j.id === id ? { ...j, locked: !j.locked } : j));
  }

  /* render: either loading spinner or list of sorted jokes. */
  return (
    <div className="JokeList">
      {isLoading ? (
        <div className="loading"><i className="fas fa-4x fa-spinner fa-spin" /></div>
      ) : (
        <>
          <button onClick={generateNewJokes}>Get New Jokes</button>
          <button onClick={resetVotes}>Reset Votes</button>
          {jokes.sort((a, b) => b.votes - a.votes).map(joke => (
            <Joke 
              text={joke.joke} 
              key={joke.id} 
              id={joke.id} 
              votes={joke.votes} 
              vote={vote} 
              locked={joke.locked}
              toggleLock={() => toggleLock(joke.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default JokeList;
