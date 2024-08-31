import { useEffect, useState } from 'react';
import StarRating from './StarRating.js';

const KEY = 'a9b58381';

const average = (arr) =>
   arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
   const [query, setQuery] = useState('');
   const [watched, setWatched] = useState(getWatchedFromStorage);
   const [movies, setMovies] = useState([]);
   const [selectedMovieId, setSelectedMovieId] = useState('');

   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState('');

   function getWatchedFromStorage() {
      const storedValue = localStorage.getItem('watched');
      return JSON.parse(storedValue);
   }

   function handleMovieSelected(id) {
      setSelectedMovieId((selectedMovieId) =>
         id === selectedMovieId ? null : id
      );
   }

   function handleCloseSelected() {
      setSelectedMovieId(null);
   }

   function handleWatched(movie) {
      setWatched((watched) => [...watched, movie]);
   }

   function handleDeleteWatched(movie) {
      setWatched((watched) => watched.filter((w) => w.imdbID !== movie.imdbID));
   }

   useEffect(() => {
      localStorage.setItem('watched', JSON.stringify(watched));
   }, [watched]);

   useEffect(() => {
      const controller = new AbortController();

      async function fetchMovies() {
         try {
            setError('');
            setIsLoading(true);

            const res = await fetch(
               `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
               { signal: controller.signal }
            );

            if (!res.ok) throw new Error('Network response was not ok');

            const data = await res.json();

            if (data.Response === 'False') throw new Error('Movie not found');

            setMovies(data.Search);
         } catch (error) {
            // If the error is a network-related error (e.g., server not reachable, lost connection), set a specific error message indicating a network issue.

            // Otherwise, set the error message to the message from the caught error, which could be a custom error message or one from the server.
            setError(
               error.name === 'AbortError'
                  ? ''
                  : error.name === 'TypeError'
                  ? 'Something went wrong with fetching movies.'
                  : error.message
            );
         } finally {
            setIsLoading(false);
         }
      }

      if (query.length < 3) {
         setMovies([]);
         setError('');
         return;
      }

      handleCloseSelected();
      fetchMovies();

      return () => controller.abort();
   }, [query]);

   return (
      <>
         <NavBar>
            <Search query={query} setQuery={setQuery} />
            <NumResualts movies={movies} />
         </NavBar>

         <Main>
            <Box>
               {isLoading && <Loader />}
               {error && <ErrorMessage message={error} />}
               {!isLoading && !error && (
                  <MoviesList
                     movies={movies}
                     onMovieSelected={handleMovieSelected}
                  />
               )}
            </Box>

            <Box>
               {selectedMovieId ? (
                  <MovieDetailes
                     selectedMovieId={selectedMovieId}
                     onCloseSelected={handleCloseSelected}
                     onWatched={handleWatched}
                     watched={watched}
                  />
               ) : (
                  <>
                     <WatchedSummary watched={watched} />
                     <WatchedMoviesList
                        watched={watched}
                        onDeleteWatched={handleDeleteWatched}
                     />
                  </>
               )}
            </Box>
         </Main>
      </>
   );
}

function NavBar({ children }) {
   return (
      <nav className='nav-bar'>
         <Logo />
         {children}
      </nav>
   );
}

function Logo() {
   return (
      <div className='logo'>
         <span role='img'>🍿</span>
         <h1>usePopcorn</h1>
      </div>
   );
}

function Search({ query, setQuery }) {
   return (
      <input
         className='search'
         type='text'
         placeholder='Search movies...'
         value={query}
         onChange={(e) => setQuery(e.target.value)}
      />
   );
}

function NumResualts({ movies }) {
   return (
      <p className='num-results'>
         Found <strong>{movies.length}</strong> results
      </p>
   );
}

function Main({ children }) {
   return <main className='main'>{children}</main>;
}

function Box({ children }) {
   const [isOpen, setIsOpen] = useState(true);

   return (
      <div className='box'>
         <button
            className='btn-toggle'
            onClick={() => setIsOpen((open) => !open)}
         >
            {isOpen ? '–' : '+'}
         </button>
         {isOpen && children}
      </div>
   );
}

function MoviesList({ movies, onMovieSelected }) {
   return (
      <ul className='list list-movies'>
         {movies?.map((movie) => (
            <Movie
               movie={movie}
               onMovieSelected={onMovieSelected}
               key={movie.imdbID}
            />
         ))}
      </ul>
   );
}

function Movie({ movie, onMovieSelected }) {
   return (
      <li onClick={() => onMovieSelected(movie.imdbID)}>
         <img src={movie.Poster} alt={`${movie.Title} poster`} />
         <h3>{movie.Title}</h3>
         <div>
            <p>
               <span>🗓</span>
               <span>{movie.Year}</span>
            </p>
         </div>
      </li>
   );
}

function WatchedSummary({ watched }) {
   const avgImdbRating = average(watched.map((movie) => movie.imdbRating));

   const avgUserRating = average(watched.map((movie) => movie.userRating));

   const avgRuntime = average(watched.map((movie) => movie.runtime));

   return (
      <div className='summary'>
         <h2>Movies you watched</h2>
         <div>
            <p>
               <span>#️⃣</span>
               <span>{watched.length} movies</span>
            </p>
            <p>
               <span>⭐️</span>
               <span>{avgImdbRating.toFixed(2)}</span>
            </p>
            <p>
               <span>🌟</span>
               <span>{avgUserRating.toFixed(2)}</span>
            </p>
            <p>
               <span>⏳</span>
               <span>{avgRuntime} min</span>
            </p>
         </div>
      </div>
   );
}

function WatchedMoviesList({ watched, onDeleteWatched }) {
   return (
      <ul className='list'>
         {watched.map((movie) => (
            <WatchedMovie
               movie={movie}
               onDeleteWatched={onDeleteWatched}
               key={movie.imdbID}
            />
         ))}
      </ul>
   );
}

function WatchedMovie({ movie, onDeleteWatched }) {
   return (
      <li>
         <img src={movie.poster} alt={`${movie.title} poster`} />
         <h3>{movie.Title}</h3>
         <div>
            <p>
               <span>⭐️</span>
               <span>{movie.imdbRating}</span>
            </p>
            <p>
               <span>🌟</span>
               <span>{movie.userRating}</span>
            </p>
            <p>
               <span>⏳</span>
               <span>{movie.runtime} min</span>
            </p>

            <button
               className='btn-delete'
               onClick={() => onDeleteWatched(movie)}
            >
               X
            </button>
         </div>
      </li>
   );
}

function MovieDetailes({
   selectedMovieId,
   onCloseSelected,
   onWatched,
   watched,
}) {
   const [movieDetails, setMovieDetails] = useState({});
   const [isLoading, setIsLoading] = useState(false);
   const [userRating, setUserRating] = useState('');

   // const isWatched = watched.map((w) => w.imdbID).includes(selectedMovieId);
   const isWatched = watched.some((w) => w.imdbID === selectedMovieId);

   const {
      Actors: actors,
      Genre: genre,
      Plot: plot,
      Poster: poster,
      Released: released,
      Runtime: runtime,
      Title: title,
      Director: director,
      imdbRating,
   } = movieDetails;

   function handleAdd() {
      const movie = {
         title,
         poster,
         imdbRating: +imdbRating,
         runtime: +runtime.split(' ').at(0),
         userRating: +userRating,
         imdbID: selectedMovieId,
      };

      onWatched(movie);
      onCloseSelected();
   }

   useEffect(() => {
      function callBack(e) {
         if (e.code === 'Escape') onCloseSelected();
      }

      document.addEventListener('keydown', callBack);

      return () => document.removeEventListener('keydown', callBack);
   }, [onCloseSelected]);

   useEffect(() => {
      async function FetchDetails() {
         try {
            setIsLoading(true);
            const res = await fetch(
               `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedMovieId}`
            );

            if (!res.ok) throw new Error('Network response was not ok');

            const data = await res.json();

            if (data.Response === 'False') throw new Error('Movie not found');

            setMovieDetails(data);
         } catch (error) {
            //  error.name === 'TypeError'
            //     ? setError('Something went wrong with fetching movies.')
            //     : setError(error.message);
         } finally {
            setIsLoading(false);
         }
      }
      FetchDetails();
   }, [selectedMovieId]);

   useEffect(() => {
      if (!title) return;
      document.title = `Movie | ${title}`;
   }, [title]);

   return (
      <div className='details'>
         {isLoading ? (
            <Loader />
         ) : (
            <>
               <header>
                  <button className='btn-back' onClick={onCloseSelected}>
                     &larr;
                  </button>
                  <img src={poster} alt={`Poster of ${title} movie`} />
                  <div className='details-overview'>
                     <h2>{title}</h2>
                     <p>
                        {released} &bull; {runtime}
                     </p>
                     <p>{genre}</p>
                     <p>
                        <span>⭐</span>
                        {imdbRating} IMDb rating
                     </p>
                  </div>
               </header>
               <section>
                  <div className='rating'>
                     {isWatched ? (
                        <p>You rated with movie</p>
                     ) : (
                        <>
                           <StarRating
                              size={24}
                              maxRating={10}
                              onSetRating={setUserRating}
                           />
                           <button className='btn-add' onClick={handleAdd}>
                              + Add to list
                           </button>
                        </>
                     )}
                  </div>
                  <p>
                     <em>{plot}</em>
                  </p>
                  <p>Starring: {actors}</p>
                  <p>Directed by {director}</p>
               </section>
            </>
         )}
      </div>
   );
}

function Loader() {
   return <p className='loader'>Loading...</p>;
}

function ErrorMessage({ message }) {
   return (
      <p className='error'>
         <span>⛔</span> {message}
      </p>
   );
}
