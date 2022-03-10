const cron = require('node-cron');
const shell = require('shelljs');

export function refresh_finess() {
    shell.exec('docker login --username easemedic2022 --password petitchaton');
    if (
        shell.exec('docker pull easemedic2022/dockerhub:myfirstimagepush')
            .code !== 0
    ) {
        console.log('ECHEC pull Docker image FINESS');
    } else console.log('SUCESS pull Docker image FINESS');

    if (
        shell.exec(
            'docker run --name eip -d easemedic2022/dockerhub:myfirstimagepush'
        ).code !== 0
    ) {
        console.log('ECHEC execute Docker FINESS');
    } else console.log('SUCESS execute docker FINESS');

    // run every week
    cron.schedule('0 0 * * 0', function () {
        console.log('---------------------');
        console.log('Running Cron FINESS');
        if (shell.exec('docker start eip').code !== 0) {
            shell.echo('ECHEC Cron FINESS');
        } else {
            shell.echo('SUCESS Cron FINESS');
        }
        if (
            shell.exec('docker cp eip:/Project/finess_base.json ./src/finess')
                .code !== 0
        ) {
            shell.echo('ECHEC copy file FINESS');
        } else {
            shell.echo('SUCESS copy file FINESS');
        }
    });
}
