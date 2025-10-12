// Initialize standalone MongoDB (no replica set needed for development)
// Create the flohmarkt database
db = db.getSiblingDB('flohmarkt');

// Create a user for the application
db.createUser({
  user: 'flohmarkt_user',
  pwd: 'flohmarkt_password',
  roles: [
    {
      role: 'readWrite',
      db: 'flohmarkt'
    }
  ]
});

print('Standalone MongoDB initialized successfully'); 