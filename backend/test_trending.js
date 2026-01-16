const mongoose = require('mongoose');
const Movie = require('./models/Movie');
require('dotenv').config();

const run = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const movie = await Movie.findOne();
        if (!movie) {
            console.log("No movies found.");
            process.exit(0);
        }

        console.log(`Found movie: ${movie.movie_name}, Trending: ${movie.trending}`);

        const newStatus = !movie.trending;
        console.log(`Updating trending to: ${newStatus}`);

        movie.trending = newStatus;
        await movie.save();
        console.log("Saved.");

        const updatedMovie = await Movie.findById(movie._id);
        console.log(`Refetched movie: ${updatedMovie.movie_name}, Trending: ${updatedMovie.trending}`);

        if (updatedMovie.trending === newStatus) {
            console.log("SUCCESS: Trending field persisted correctly.");
        } else {
            console.log("FAILURE: Trending field DID NOT persist.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
