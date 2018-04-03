# Snapmap-Server
Server for Snapmap

## Pre Req
1. [Have Heroku CLI installed](https://devcenter.heroku.com/articles/heroku-cli)
2. Login to Heroku
```bash
heroku Login
```
3. Remote Heroku server is added locally
```bash
heroku git:remote -a <YOUR-HEROKU-SERVER-NAME>
```

## To Deploy to Heroku

1. Make sure to have all changes pushed to master on Github.
2. To deploy to live Heroku servers.
```bash
git push heroku master
```
3. To view in browser.
```bash
heroku open
```
