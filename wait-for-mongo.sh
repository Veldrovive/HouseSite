#!/bin/sh

>&2 echo "Waiting for Mongo..."

until [ "$(/mongo-bin/mongo --host localhost --port 27017 --eval "db.stats().ok" | grep -E 'session')" ]; do
  >&2 echo "Attempting connection..."
  sleep 1
done
>&2 echo "Connected!"

>&2 echo "Initialising replicaset..."
>&2 echo $(/mongo-bin/mongo --host localhost --port 27017 --eval "rs.initiate({ _id: 'replicaset', members: [{ _id: 0, host: 'localhost:27017' }] })")

cmd="$@"
>&2 echo "Running command \"$cmd\"..."
exec $cmd