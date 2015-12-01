# node-file-stream

Launches an express web server capable of streaming large files. This enables clients to pause and resume downloads or open urls directly in compatible media players, e.g. VLC. Also provides an optional barebones directory listing. 

## SSL Certificate

The server needs an SSL certificate to run. On windows you can do the following:

- Download openssl binaries and place them into the `openssl` subfolder: https://indy.fulgan.com/SSL/ 
- Execute `openssl/GenerateCertificate.bat` and move the generated files `key.pem` and `cert.pem` to the parent folder.

## Installation

- Execute `npm install`
- Modify `config.js` as needed
- Add users using `node addUser.js username password`
- Start with `npm start`

## ololo protocol handler

This is for windows only.  

- Modify paths in `protocol/register.reg` as needed
- Execute `register.reg`
- Modify `protocol/config.json` as needed
- (To remove it again execute `unregister.reg`)
