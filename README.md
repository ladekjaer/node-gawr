node-gawr
=========

CLI for Google AdWords reporting using [AWQL](https://developers.google.com/adwords/api/docs/guides/awql).

###Installation
One-line install

    $ sudo npm install gawr -g

Upon first run you would be asked for your credentials.

See [SOAP Primer](https://developers.google.com/adwords/api/docs/guides/soap) for
information on how to obtain auth token.

###Usage

####Getting report
To get a report just type the following in a terminal

    $ gawr "SELECT Id, Name, Clicks FROM CAMPAIGN_PERFORMANCE_REPORT DURING 20131010,20131012"

To specify the output format type

    $ gawr --format TSV "SELECT Id, Name, Clicks FROM CAMPAIGN_PERFORMANCE_REPORT DURING 20131010,20131012"

To read from standard input use

    $ gawr -

###License

MIT

