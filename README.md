# Password Protected Mkdocs

This node app build and serve a mkdocs website on heroku with Github Authentication

## Setup

1. Add a webhook to the repo that includes the mkdocs. The webhook address is `http://example.com/github/callback`
2. [Register](http://docs.codenvy.com/register-a-github-application/) an application with Github to use the Github OAuth service.

## Config

#### Heroku

On Heroku set the following paramaters using `heroku config:set VARIABLE=VALUE`

```bash
GITHUB_CLIENT_ID=client_id
GITHUB_CLIENT_SECRET=client_secret
SITE_URL=https://example.com
DIST_FOLDER=site
REPO=developmentseed/example
```

#### Development

Add above configurations to `.env` file.

## Launch

    $ node index.js
