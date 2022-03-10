import { app } from './app';
import sequelize from './database';
import { scheduleFinessRefresh } from './finess';

const PORT = process.env.PORT || 8080;

sequelize
    .sync()
    .then(value => {
        console.log(value.models, 'are synchronized');

        app.listen(PORT, () => {
            console.log(`Server is running on localhost:${PORT}`);
        });

        if (process.env.NODE_ENV == 'prod' || process.argv[2] === '--finess') {
            scheduleFinessRefresh();
        }
    })
    .catch(err => {
        console.error(err);
        console.error('Failed to sync all defined models to the DB.');
        console.error(
            'Maybe you forgot to launch the docker container of the database ?'
        );
        console.error('Read the README before sending me a complaint message');
    });
