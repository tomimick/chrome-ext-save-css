#!/usr/bin/ruby
# -*- coding: utf-8 -*-

# server.rb: receive CSS and JS files from Chrome extension
#   and save files locally
#
# Author: Tomi.Mickelsson@iki.fi
#   04.02.2012 - Created

require 'webrick'
include WEBrick

class MyServlet < HTTPServlet::AbstractServlet

  def do_POST(req, res)
    url   = req.header['x-origurl']
    fpath = req.header['x-filepath']
    bodylen = req.header['content-length']
    raw = req.body
    fpath = fpath.join("")

    print url, " -> ", fpath, " ", bodylen, "\n"

    reply = "OK"

    # save file
    begin
        f = File.open(fpath, "wb")
        f.syswrite(raw)
        f.close
    rescue => e
        puts "EXCEP " + e.message
        reply = e.message
    end

    res.status = "200"
    res.body = reply
  end

end

# start server
server = HTTPServer.new(:BindAddress => "localhost",:Port => 8080)
server.mount('/', MyServlet)

trap 'INT' do server.shutdown end

puts "Server running in port 8080..."
server.start

