node-gawr
=========

CLI for Google AdWords reporting using [AWQL](https://developers.google.com/adwords/api/docs/guides/awql).

###Installation
One-line install

    $ sudo npm install gawr -g

Upon first run you would be asked for your credentials.

The app is using [OAuth 2.0](https://developers.google.com/accounts/docs/OAuth2) to access
the Google AdWords API. Go to
[OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
to get an access token. In step 1 enter

    $ https://adwords.google.com/api/adwords

as the scope.

In step 2 clicks the button labeled "Exchange authorization code for tokens". You can
now see an access token. Step 3 is not nessesary.

###Usage

####Getting report
To get a report just type the following in a terminal

    $ gawr "SELECT Id, Name, Clicks FROM CAMPAIGN_PERFORMANCE_REPORT DURING 20131010,20131012"

To specify the output format type

    $ gawr --format TSV "SELECT Id, Name, Clicks FROM CAMPAIGN_PERFORMANCE_REPORT DURING 20131010,20131012"

To read from standard input use

    $ gawr -

To specify another client customer id than the one in the config file

    $ gawr --customerId "123-456-7890" "SELECT Id, Name, Clicks FROM CAMPAIGN_PERFORMANCE_REPORT DURING 20131010,20131012"

###License

MIT

