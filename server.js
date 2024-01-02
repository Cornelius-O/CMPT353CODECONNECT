const express = require('express');
const bodyParser = require("body-parser");
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');


require('dotenv').config(); // environment variables


const PORT = 8080;
const app = express();

// Admin credentials (hardcoded for demonstration)
const adminUser = {
    username: 'admin',
    password: 'adminPassword' 
  };

app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Set up multer storage for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage })

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pass123'
});

connection.connect((err) => {
    if (err) {
        console.error(`MySQL Error: ${err}`);
        return;
    }
    console.log("Connected to MySQL");
});

app.get('/', (req, res) => {
    res.send('Welcome to my application!');
});

app.get('/init', (req, res) => {
    connection.query(`CREATE DATABASE IF NOT EXISTS postdb`, function (error, result) {
        if (error) {
            console.error('Error creating database:', error);
            return res.status(500).send('Error creating database');
        }
        console.log("Database created or already exists");

        connection.changeUser({ database: 'postdb' }, function (err) {
            if (err) {
                console.error('Error switching to database:', err);
                return res.status(500).send('Error switching to database');
            }

            const tableCreationQueries = [
                `CREATE TABLE IF NOT EXISTS users (
                    user_id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(255) NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    profile_pic_url VARCHAR(255)
                )`,
                `CREATE TABLE IF NOT EXISTS channels (
                    channel_id INT PRIMARY KEY AUTO_INCREMENT,
                    channel_name VARCHAR(255) NOT NULL,
                    creator_name VARCHAR(255),
                    creator_id INT,
                    FOREIGN KEY (creator_id) REFERENCES users(user_id)
                )`,
                `CREATE TABLE IF NOT EXISTS messages (
                    message_id INT PRIMARY KEY AUTO_INCREMENT,
                    channel_id INT,
                    user_id INT,
                    content TEXT,
                    username VARCHAR(255), -- Add username column
                    image_path VARCHAR(255),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id),
                    FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
                )`,
                `CREATE TABLE IF NOT EXISTS replies (
                    reply_id INT PRIMARY KEY AUTO_INCREMENT,
                    message_id INT,
                    user_id INT,
                    reply_image_path VARCHAR(255),
                    content TEXT,
                    username VARCHAR(255), -- Add username column,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    parent_reply_id INT NULL, -- Add parent_reply_id column,
                    FOREIGN KEY (message_id) REFERENCES messages(message_id),
                    FOREIGN KEY (user_id) REFERENCES users(user_id),
                    FOREIGN KEY (parent_reply_id) REFERENCES replies(reply_id) -- Add foreign key constraint
                )`,
                // `ALTER TABLE replies
                // ADD COLUMN username VARCHAR(255);` 
            ];

        //     const addParentReplyColumnQuery = `
        //     ALTER TABLE replies
        //     ADD COLUMN parent_reply_id INT NULL,
        //     ADD FOREIGN KEY (parent_reply_id) REFERENCES replies(reply_id)
        // `
            
        // tableCreationQueries.push(addParentReplyColumnQuery);

            

            tableCreationQueries.forEach((query, index) => {
                connection.query(query, function (error, result) {
                    if (error) {
                        console.error('Error creating table:', error);
                    } else {
                        console.log(`Table ${index + 1} created or already exists`);
                    }

                    if (index === tableCreationQueries.length - 1) {
                        res.send("Database and tables initialized.");
                    }
                });
            });
        });
    });
});

// When retrieving user profile data
app.get('/profile', (req, res) => {
    const userId = req.userId;
    connection.query('SELECT * FROM users WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.length > 0) {
            const user = results[0];
            res.status(200).json({
                userId: user.user_id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin, // Include the isAdmin field
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});

// Admin login endpoint
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === adminUser.username && password === adminUser.password) {
        const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({
            message: 'Admin logged in successfully',
            token: token
        });
    } else {
        res.status(401).send('Invalid admin credentials');
    }
});

// Define middleware for JWT authorization check
function authorizeAdmin(req, res, next) {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token is invalid' });
        }

        if (!decoded.admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // Proceed to the next middleware or route handler
        next();
    });
}

// Admin delete user endpoint with authorization check
app.delete('/admin/deleteUser/:userId', authorizeAdmin, (req, res) => {
    // Authorization check passed
    const userId = req.params.userId;
    const query = `DELETE FROM users WHERE user_id = ?`;
    connection.query(query, [userId], function (error, result) {
        if (error) {
            console.log(error);
            res.status(500).send('Error deleting user');
        } else {
            res.status(200).send('User deleted successfully');
        }
    });
});

// Admin delete channel endpoint with authorization check
app.delete('/admin/deleteChannel/:channelId', authorizeAdmin, (req, res) => {
    // Authorization check passed
    const channelId = req.params.channelId;
    const query = `DELETE FROM channels WHERE channel_id = ?`;
    connection.query(query, [channelId], function (error, result) {
        if (error) {
            console.log(error);
            res.status(500).send('Error deleting channel');
        } else {
            res.status(200).send('Channel deleted successfully');
        }
    });
});

// Admin delete post endpoint with authorization check
app.delete('/admin/deletePost/:postId', authorizeAdmin, (req, res) => {
    // Authorization check passed
    const postId = req.params.postId;
    const query = `DELETE FROM messages WHERE message_id = ?`;
    connection.query(query, [postId], function (error, result) {
        if (error) {
            console.log(error);
            res.status(500).send('Error deleting post');
        } else {
            res.status(200).send('Post deleted successfully');
        }
    });
});

// Admin delete reply endpoint with authorization check
app.delete('/admin/deleteReply/:replyId', authorizeAdmin, (req, res) => {
    // Authorization check passed
    const replyId = req.params.replyId;
    const query = `DELETE FROM replies WHERE reply_id = ?`;
    connection.query(query, [replyId], function (error, result) {
        if (error) {
            console.log(error);
            res.status(500).send('Error deleting reply');
        } else {
            res.status(200).send('Reply deleted successfully');
        }
    });
});

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password, email, profile_pic_url } = req.body;

  // Basic input validation
  if (!username || !password || !email) {
      return res.status(400).json({ message: 'Username, password, and email are required' });
  }

  // Validate email format (simple regex for example purposes)
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
  }

  // Further validations can be added here (e.g., password strength)

  try {
      // Check if username or email already exists
      const checkUserQuery = `SELECT * FROM users WHERE username = ? OR email = ?`;
      connection.query(checkUserQuery, [username, email], async (error, results) => {
          if (error) {
              console.log(error);
              return res.status(500).json({ message: 'Error checking user existence' });
          }
          if (results.length > 0) {
              return res.status(400).json({ message: 'Username or Email already exists' });
          }

          // Proceed with registration
          const hashedPassword = await bcrypt.hash(password, 10);
          const insertQuery = `INSERT INTO users (username, password, email, profile_pic_url) VALUES (?, ?, ?, ?)`;
          connection.query(insertQuery, [username, hashedPassword, email, profile_pic_url], (insertError, result) => {
              if (insertError) {
                  console.log(insertError);
                  return res.status(500).json({ message: 'Error registering new user' });
              }
              res.status(200).json({ message: 'User registered successfully' });
          });
      });
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Server error' });
  }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    connection.query(`SELECT * FROM users WHERE email = ?`, [email], async function (error, results) {
        if (error) {
            console.log(error);
            res.status(500).send('Error logging in');
        } else if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
                // Include email and username in the response
                const isAdmin = user.username === 'admin'; // Check if the user is an admin
                res.status(200).json({
                    message: 'User logged in successfully',
                    userId: user.user_id,
                    email: user.email,
                    username: user.username,
                    isAdmin: isAdmin, // Include isAdmin status
                    token: token,
                });
            } else {
                res.status(401).send('Invalid credentials');
            }
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

app.post('/logout', (req, res) => {
    // Instruct the client to clear the token from storage
    res.status(200).json({ message: 'Logged out successfully' });
});

app.get('/channels', (req, res) => {
    const query = `SELECT * FROM channels`; // Replace with your SQL query to fetch channels
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching channels:', error);
            return res.status(500).send('Error fetching channels');
        }
        res.status(200).json(results);
    });
});

app.get('/getChannels', (req, res) => {
    const query = `SELECT * FROM channels`;
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching channels:', error);
            return res.status(500).send('Error fetching channels');
        }
        res.status(200).json(results);
    });
});

app.post('/createChannel', (req, res) => {
    const { name, userId } = req.body;

    if (!name || !userId) {
        return res.status(400).json({ error: 'Channel name and user ID are required' });
    }

    // Fetch the creator's username based on userId
    const getUsernameQuery = `SELECT username FROM users WHERE user_id = ?`;
    connection.query(getUsernameQuery, [userId], function (usernameError, usernameResult) {
        if (usernameError || usernameResult.length === 0) {
            console.error('Error fetching username:', usernameError);
            return res.status(500).json({ error: 'Error creating channel' });
        } else {
            const creatorUsername = usernameResult[0].username;

            const insertChannelQuery = `INSERT INTO channels (channel_name, creator_id, creator_name) VALUES (?, ?, ?)`;
            connection.query(insertChannelQuery, [name, userId, creatorUsername], function (error, result) {
                if (error) {
                    console.error('Error creating channel:', error);
                    return res.status(500).json({ error: 'Error creating channel' });
                } else {
                    res.status(200).json({
                        message: 'Channel created successfully',
                        creatorUsername: creatorUsername,
                    });
                }
            });
        }
    });
});
app.post('/postMessage', upload.single('image'), (req, res) => {
    const { channelId, content, userId } = req.body;
    const imagePath = req.file ? req.file.path : null;

    if (!channelId || !content || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const getUsernameQuery = `SELECT username FROM users WHERE user_id = ?`;
    connection.query(getUsernameQuery, [userId], function (error, usernameResult) {
        if (error) {
            console.error('Error fetching username:', error);
            return res.status(500).json({ error: 'Error posting message' });
        }

        const username = usernameResult[0].username;

        const insertMessageQuery = `INSERT INTO messages (channel_id, content, username, image_path) VALUES (?, ?, ?, ?)`;
        connection.query(insertMessageQuery, [channelId, content, username, imagePath], function (insertError, result) {
            if (insertError) {
                console.error('Error posting message:', insertError);
                return res.status(500).json({ error: 'Error posting message' });
            }

            console.log('Message posted successfully');
            res.status(200).send('Message posted successfully');
        });
    });
});




app.get('/getChannelMessages/:channelId', (req, res) => {
    const channelId = req.params.channelId;
    const query = `SELECT * FROM messages WHERE channel_id = ?`;
    connection.query(query, [channelId], function (error, results) {
        if (error) {
            console.log(error);
            res.status(500).send('Error fetching messages');
        } else {
            res.status(200).json(results);
        }
    });
});

app.post('/postReply', upload.single('image'), (req, res) => {
    const { messageId, userId, content, parentReplyId } = req.body;
    const replyImagePath = req.file ? req.file.path : null;

    if (!messageId || !userId || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch the username based on userId
    const getUserDataQuery = `SELECT username FROM users WHERE user_id = ?`;
    connection.query(getUserDataQuery, [userId], function (userDataError, userDataResult) {
        if (userDataError) {
            console.error('Error fetching user data:', userDataError);
            return res.status(500).json({ error: 'Error posting reply' });
        }

        if (userDataResult.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const username = userDataResult[0].username;

        // Insert the reply with the retrieved username
        const insertReplyQuery = `INSERT INTO replies (message_id, user_id, content, username, reply_image_path, parent_reply_id) VALUES (?, ?, ?, ?, ?, ?)`;
        connection.query(insertReplyQuery, [messageId, userId, content, username, replyImagePath, parentReplyId], function (insertError, result) {
            if (insertError) {
                console.error('Error posting reply:', insertError);
                return res.status(500).json({ error: 'Error posting reply' });
            }

            console.log('Reply posted successfully');
            res.status(200).send('Reply posted successfully');
        });
    });
});


app.get('/getReplies/:messageId', (req, res) => {
    const messageId = req.params.messageId;
    const query = `
        SELECT r.*, u.username
        FROM replies r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.message_id = ?`;
        
    connection.query(query, [messageId], function (error, results) {
        if (error) {
            console.log(error);
            res.status(500).send('Error fetching replies');
        } else {
            res.status(200).json(results);
        }
    });
});



app.put('/editMessage', (req, res) => {
    const { messageId, newContent } = req.body;
    const query = `UPDATE messages SET content = ? WHERE message_id = ?`;
    connection.query(query, [newContent, messageId], function (error, result) {
        if (error) {
            console.log(error);
            res.status(500).send('Error editing message');
        } else {
            res.status(200).send('Message updated successfully');
        }
    });
});

app.delete('/deleteMessage/:messageId', (req, res) => {
    const messageId = req.params.messageId;
    const query = `DELETE FROM messages WHERE message_id = ?`;
    connection.query(query, [messageId], function (error, result) {
        if (error) {
            console.log(error);
            res.status(500).send('Error deleting message');
        } else {
            res.status(200).send('Message deleted successfully');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
