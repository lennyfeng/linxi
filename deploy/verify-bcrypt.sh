#!/bin/bash
# Use the API container's node to verify bcrypt
docker exec internal-platform-api node -e "
const bcrypt = require('bcryptjs');
const hash = '\$2a\$10\$rKN3RPCyJnOXaKCZrwRB2uXlHzQbqEsLDcK5EKj7rJ7y4PJoHFxBG';
bcrypt.compare('admin123', hash).then(r => {
  console.log('admin123 match:', r);
  // Generate a new hash for admin123
  return bcrypt.hash('admin123', 10);
}).then(newHash => {
  console.log('new hash:', newHash);
});
"
