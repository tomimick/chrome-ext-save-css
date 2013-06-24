#!/usr/bin/python
# -*- coding: utf-8 -*-

# server.py: receive CSS and JS files from Chrome extension
#   and save files locally
#
# Author: Tomi.Mickelsson@iki.fi
#   30.10.2011 - Created

try:
    # python 2.x
    from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler
except:
    # python 3.x
    from http.server import HTTPServer, BaseHTTPRequestHandler

class MyServer(BaseHTTPRequestHandler):

    def do_POST(self):
        hd = self.headers

        # chrome sent data:
        url   = hd.get("X-origurl")
        fpath = hd.get("X-filepath")
        bodylen = int(hd['content-length'])
        body    = self.rfile.read(bodylen)
        print (url, " ->", fpath, len(body))

        reply = "OK"

        # optional security: check that path is under given folder
        ROOT = ""
        if ROOT and not fpath.startswith(ROOT):
            reply = "access denied: " + fpath
        else:
            # save file
            try:
                f = open(fpath, "wb")
                f.write(body)
                f.close()
            except Exception as e:
                print (e)
                reply = "Server couldn't save "+fpath

        # return reply
        self.send_response(200)
        self.end_headers()
        self.wfile.write(reply.encode('utf-8'))


# optional security: chroot this script to a folder, run with
#   "sudo python server.py"
# (remember to adjust your url mappings in the extension too)
# import os
# os.chroot("/Users/myusername/")

# start http server
server = HTTPServer(('localhost', 8080), MyServer)
print ("Server running in port 8080...")
server.serve_forever()

