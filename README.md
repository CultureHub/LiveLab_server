# The Signalling Server for LiveLab

## ChangeLog

### [05.18.2020] Running Locally
To test and modify this web server locally, you need to download the repo, and operate as following: 

#### Update the content and filename for the ```.env-sample```file

The file ```.env-sample```requires you to fill in your 

* ```TWILIO_SID = ``` Twilio Account SID
*  ```TWILIO_AUTH = ```Twilio Auth Token
*  ```PORT = ```a local port as your wish (0 ~ 65535) to run the signaling server

Then you should change the filename from ```.env-sample ```to ```.env```

#### Generate locally-trusted SSL certificates

Secure your local signaling server with locally-trusted SSL certificates by using [mkcert]. 

>_[mkcert] is a simple tool for making locally-trusted development certificates. It requires no configuration.)_

[mkcert]: https://github.com/FiloSottile/mkcert

After installing mkcert, create a new local CA at the local server directory: 

```
$ mkcert -install
```
Request the local CA at your localhost: 
```
$ mkcert localhost
```
Running the commands above generates two certificate files, ```localhost.pem ``` and ```localhost-key.pem```. 

Move the two files to be under the ```certs ```folder and deleted the placeholder files  ```localhost-key.txt``` and ```localhost.txt```

>Warning: the two ```.pem ```files give complete power to intercept secure requests from your machine. Do not share them. 

Then, to run the signaling server locally: 

*if you have specified a port number in ```.env``` file

```npm start``` 

*use the command line to specify a port number (e.g: 1000)

```PORT=1000 npm start```

Now you can access your local server at ```https://localhost:{port you've selected}``` e.g. https://localhost:1000
