## commands

### install
`npm install`

### dev
`npm run dev`

### deploy
`DEPLOY_ENV=${env} npm run build-for-deploy`

The env variable means which file to be used as env config. For example, if `env` is `production`, the process will load `etc/config.production.yaml` as the env config.

## develop

write your code to the model files in `src/model`, and the api will be `/api/${model}/${method}`

add `httpApi` annotation to any method you want to expose as an http interface.