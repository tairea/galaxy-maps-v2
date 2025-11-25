# Predeploy & Deploy cloud functions

## Run (This will automatically run lint + build before deploying)

npx eslint --ext .js,.ts . --fix
cd functions
mise exec node@20 -- npm run deploy:safe
