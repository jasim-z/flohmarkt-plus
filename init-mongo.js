// Initialize the replica set
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongodb-primary:27017' },
    { _id: 1, host: 'mongodb-secondary:27017' },
    { _id: 2, host: 'mongodb-arbiter:27017', arbiterOnly: true },
  ],
});

// Wait for the replica set to be ready
while (!rs.isMaster().ismaster) {
  sleep(1000);
}

print('Replica set initialized successfully'); 