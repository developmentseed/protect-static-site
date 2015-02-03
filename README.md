# Password Protected Static Site

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

If the repo is private you also need to add the username and password of a github account that has access to the repo:

```
GITHUB_USER=username
GITHUB_PASS=password
```

#### User Limt

To limit access to specific set of github users, add usernames separated by comma to as environemt variables:

```
USER_LIST=user1,user2,user3
```

#### Development

Add above configurations to `.env` file.

## Launch

    $ node index.js
