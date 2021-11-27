#!/bin/sh

# turn on bash's job control
set -m

# run the node app
node ./app/main.js &

# run the proxy
./grpcwebproxy --backend_addr=:9945 --allow_all_origins --run_tls_server=false &
  
# now we bring the primary process back into the foreground
# and leave it there
fg %1