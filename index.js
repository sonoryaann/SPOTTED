const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'aX9%2c@z1bXm7wVe&6dJ!q2zDpQ@kL1bF'; // Cambiala con una chiave sicura!


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const fileName = Date.now() + fileExtension;
        cb(null, fileName);
    },
});

const upload = multer({ storage: storage });
const app = express();

app.use(session({
    secret: 'aX9%2c@z1bXm7wVe&6dJ!q2zDpQ@kL1bF',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Imposta a `true` se usi HTTPS
}));
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurazione della connessione al database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'FEderico12082005',
    database: 'spotted_db',
    port: 3306,
});

// Test della connessione al database
db.connect((err) => {
    if (err) {
        console.error('Errore di connessione al database:', err.message);
    } else {
        console.log('Connesso al database MySQL con successo!');
    }
});

// Configurazione per l'invio dell'email tramite Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'spotted.auth@gmail.com',
        pass: 'mxvh evaw yfri vdvz',
    },
});


const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Recupera il token dall'header

    if (!token) {
        return res.status(401).json({ message: 'Token mancante!' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token non valido!' });
        }

        req.user = {
            id: user.id, // Assumi che il token contenga l'ID utente
            email: user.email, // Altri dettagli opzionali
        };
        next(); // Passa al prossimo middleware o endpoint
    });
};


// Funzione per inviare una email di verifica
const sendVerificationEmail = (email, token) => {
    const verificationLink = `http://192.168.1.16:5000/verify-email?token=${token}`;

    const mailOptions = {
        from: 'spotted.auth@gmail.com',
        to: email,
        subject: 'Verifica il tuo indirizzo email',
        html: `<p>Grazie per esserti registrato! Clicca sul link qui sotto per verificare il tuo indirizzo email:</p>
               <a href="${verificationLink}">Verifica Email</a>`,
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            console.error('Errore nell\'invio dell\'email:', err.message);
        }
    });
};

// Endpoint per la registrazione degli utenti
app.post('/register', async (req, res) => {
    const { email, phone_number, password } = req.body;

    if (!email || !phone_number || !password) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori!' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const query = 'INSERT INTO users (email, phone_number, password_hash, verification_token, is_verified) VALUES (?, ?, ?, ?, 0)';
        db.query(query, [email, phone_number, hashedPassword, verificationToken], (err, results) => {
            if (err) {
                console.error('Errore durante l\'inserimento dei dati:', err.message);
                return res.status(500).json({ message: 'Errore del server durante la registrazione.' });
            }

            sendVerificationEmail(email, verificationToken);

            res.status(201).json({ message: 'Registrazione completata con successo!' });
        });
    } catch (error) {
        console.error('Errore durante l\'hashing della password:', error.message);
        res.status(500).json({ message: 'Errore interno del server.' });
    }
});

// Endpoint per il login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e password sono obbligatorie.' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Errore durante il login:', err.message);
            return res.status(500).json({ message: 'Errore del server durante il login.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Utente non trovato.' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenziali non valide.' });
        }

        // Controllo che l'utente abbia verificato l'email
        if (!user.is_verified) {
            return res.status(403).json({ message: 'Email non verificata. Verifica la tua email per continuare.' });
        }

        // Genera un token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email }, // Payload del token
            JWT_SECRET, // Chiave segreta
            { expiresIn: '1h' } // Scadenza del token
        );

        res.status(200).json({ message: 'Login effettuato con successo!', token });
    });
});


// Endpoint per caricare un nuovo post (autenticazione obbligatoria)
app.post('/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    // Rimuoviamo il campo `time`
    const { description, place, date } = req.body;

    if (!description || !place || !date) {
        return res.status(400).send('Descrizione, luogo e data sono obbligatori!');
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // Modifica la query per includere solo i campi presenti nel database
    const query = 'INSERT INTO posts (user_id, description, place, date, photo_url) VALUES (?, ?, ?, ?, ?)';
    
    // Rimuovi `time` dai valori passati alla query
    db.query(query, [req.user.id, description, place, date, imageUrl], (err) => {
        if (err) {
            console.error('Errore durante l\'inserimento del post nel database:', err.message);
            return res.status(500).send('Errore durante il salvataggio del post nel database');
        }

        res.status(200).send('Post caricato con successo!');
    });
});

// Verifica se l'utente ha già segnalato il post
app.get('/posts/:postId/isReported', authenticateToken, (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id; // ID dell'utente autenticato

    // Verifica se esiste una segnalazione per questo post da parte dell'utente
    const checkQuery = `
        SELECT 1 FROM reports WHERE post_id = ? AND user_id = ?
    `;
    db.query(checkQuery, [postId, userId], (err, results) => {
        if (err) {
            console.error('Errore nella verifica della segnalazione:', err.message);
            return res.status(500).json({ message: 'Errore nel server.' });
        }

        // Se esiste una segnalazione, restituisci true
        if (results.length > 0) {
            return res.json({ reported: true });
        }

        // Se non esiste una segnalazione, restituisci false
        res.json({ reported: false });
    });
});

// Aggiungi la segnalazione per un post
// Segnalazione di un post
app.post('/posts/:postId/report', authenticateToken, (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id; // ID dell'utente autenticato

    // Verifica se l'utente ha già segnalato il post
    const checkQuery = `
        SELECT 1 FROM reports WHERE post_id = ? AND user_id = ?
    `;
    db.query(checkQuery, [postId, userId], (err, results) => {
        if (err) {
            console.error('Errore nella verifica della segnalazione:', err.message);
            return res.status(500).json({ message: 'Errore nel server.' });
        }

        // Se esiste una segnalazione, restituisci una risposta
        if (results.length > 0) {
            return res.status(400).json({ message: 'Hai già segnalato questo post.' });
        }

        // Inserisci una nuova segnalazione
        const insertQuery = `
            INSERT INTO reports (post_id, user_id) VALUES (?, ?)
        `;
        db.query(insertQuery, [postId, userId], (err, results) => {
            if (err) {
                console.error('Errore nell\'inserimento della segnalazione:', err.message);
                return res.status(500).json({ message: 'Errore nel server.' });
            }

            // Successo nella segnalazione
            res.status(200).json({ message: 'Post segnalato con successo!' });
        });
    });
});

// Endpoint per verificare l'email
app.get('/verify-email', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('<p>Token di verifica mancante!</p>');
    }

    const query = 'SELECT * FROM users WHERE verification_token = ?';
    db.query(query, [token], (err, results) => {
        if (err) {
            console.error('Errore durante la verifica dell\'email:', err.message);
            return res.status(500).send('<p>Errore del server.</p>');
        }

        if (results.length === 0) {
            return res.status(404).send('<p>Token di verifica non valido!</p>');
        }

        const user = results[0];

        const updateQuery = 'UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?';
        db.query(updateQuery, [user.id], (err) => {
            if (err) {
                console.error('Errore durante l\'aggiornamento del database:', err.message);
                return res.status(500).send('<p>Errore nel completamento della verifica.</p>');
            }

            res.send(`
                <html>
                    <head>
                        <meta http-equiv="refresh" content="5;url=http://192.168.1.16:3000/login" />
                    </head>
                    <body>
                        <p>Email verificata con successo! Sarai reindirizzato alla pagina del feed tra 5 secondi...</p>
                    </body>
                </html>
            `);            
        });
    });
});

// Ottieni tutti i commenti di un post specifico (inclusi eventuali risposte ai commenti)
app.get('/comments/:postId', authenticateToken, (req, res) => {
    const { postId } = req.params;

    const query = `
        SELECT * FROM comments 
        WHERE post_id = ? 
        ORDER BY created_at ASC`; // Ordina i commenti in base alla data di creazione

    db.query(query, [postId], (err, results) => {
        if (err) {
            console.error('Errore nel caricamento dei commenti:', err.message);
            return res.status(500).json({ message: 'Errore del server durante il caricamento dei commenti.' });
        }

        res.status(200).json(results);
    });
});

// Aggiungi un commento a un post o rispondi a un altro commento
app.post('/comments/:postId', authenticateToken, (req, res) => {
    const { postId } = req.params;
    const { comment, parent_id = null } = req.body; // `parent_id` è opzionale
    const userId = req.user?.id; // Verifica che req.user sia definito

    if (!comment) {
        return res.status(400).json({ message: 'Il contenuto del commento è obbligatorio.' });
    }

    if (!userId) {
        console.error('Errore: userId non trovato nel token!');
        return res.status(401).json({ message: 'Utente non autenticato.' });
    }

    console.log("💬 Ricevuta richiesta per aggiungere commento:", { postId, parent_id, comment, userId });

    const query = `
        INSERT INTO comments (post_id, parent_id, comment, created_by, created_at, updated_at, likes, dislikes, report_count, status) 
        VALUES (?, ?, ?, ?, NOW(), NOW(), 0, 0, 0, 'visible')`;

    db.query(query, [postId, parent_id, comment, userId], (err, results) => {
        if (err) {
            console.error('❌ Errore SQL:', err); // Aggiunto log errore SQL
            return res.status(500).json({ message: 'Errore del server durante l\'inserimento del commento.', error: err.message });
        }

        res.status(201).json({ message: 'Commento aggiunto con successo!', commentId: results.insertId });
    });
});

// Elimina un commento
app.delete('/comments/:commentId', authenticateToken, (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id; // Utente autenticato

    // Controlla se il commento esiste e se l'utente è il creatore
    const checkQuery = `SELECT * FROM comments WHERE id = ?`;
    db.query(checkQuery, [commentId], (err, results) => {
        if (err) {
            console.error('Errore nel controllo del commento:', err.message);
            return res.status(500).json({ message: 'Errore del server.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Commento non trovato.' });
        }

        const comment = results[0];

        // Verifica che l'utente possa eliminare il commento
        if (comment.created_by !== userId) {
            return res.status(403).json({ message: 'Non hai i permessi per eliminare questo commento.' });
        }

        // Se il commento ha risposte, segna lo stato come "deleted" invece di eliminarlo
        const checkRepliesQuery = `SELECT * FROM comments WHERE parent_id = ?`;
        db.query(checkRepliesQuery, [commentId], (err, replies) => {
            if (err) {
                console.error('Errore nel controllo delle risposte:', err.message);
                return res.status(500).json({ message: 'Errore del server.' });
            }

            if (replies.length > 0) {
                const updateQuery = `UPDATE comments SET status = 'deleted', comment = 'Questo commento è stato eliminato.' WHERE id = ?`;
                db.query(updateQuery, [commentId], (err) => {
                    if (err) {
                        console.error('Errore nell\'aggiornamento dello stato del commento:', err.message);
                        return res.status(500).json({ message: 'Errore del server.' });
                    }
                    res.status(200).json({ message: 'Commento eliminato (marcato come eliminato perché ha risposte).' });
                });
            } else {
                // Nessuna risposta, quindi eliminiamo il commento
                const deleteQuery = `DELETE FROM comments WHERE id = ?`;
                db.query(deleteQuery, [commentId], (err) => {
                    if (err) {
                        console.error('Errore nell\'eliminazione del commento:', err.message);
                        return res.status(500).json({ message: 'Errore del server.' });
                    }
                    res.status(200).json({ message: 'Commento eliminato con successo!' });
                });
            }
        });
    });
});

// Aggiorna il numero di like/dislike di un commento
app.post('/comments/:commentId/react', authenticateToken, (req, res) => {
    const { commentId } = req.params;
    const { action } = req.body; // "like" o "dislike"

    let query;
    if (action === 'like') {
        query = `UPDATE comments SET likes = likes + 1 WHERE id = ?`;
    } else if (action === 'dislike') {
        query = `UPDATE comments SET dislikes = dislikes + 1 WHERE id = ?`;
    } else {
        return res.status(400).json({ message: 'Azione non valida.' });
    }

    db.query(query, [commentId], (err) => {
        if (err) {
            console.error('Errore nella reazione al commento:', err.message);
            return res.status(500).json({ message: 'Errore del server.' });
        }
        res.status(200).json({ message: 'Reazione aggiornata con successo!' });
    });
});

// Segnala un commento
app.post('/comments/:commentId/report', authenticateToken, (req, res) => {
    const { commentId } = req.params;

    const query = `UPDATE comments SET report_count = report_count + 1 WHERE id = ?`;
    db.query(query, [commentId], (err) => {
        if (err) {
            console.error('Errore nella segnalazione del commento:', err.message);
            return res.status(500).json({ message: 'Errore del server.' });
        }
        res.status(200).json({ message: 'Commento segnalato con successo!' });
    });
});

// Endpoint per segnalare un commento
app.post('/report-comment', (req, res) => {
    const { comment_id, reported_by, reason, comment } = req.body;

    if (!comment_id || !reported_by || !reason) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori!' });
    }

    const query = 'INSERT INTO reports (post_id, reported_by, reason, comment, timestamp) VALUES (?, ?, ?, ?, NOW())';
    db.query(query, [comment_id, reported_by, reason, comment], (err, results) => {
        if (err) {
            console.error('Errore durante la segnalazione del commento:', err.message);
            return res.status(500).json({ message: 'Errore del server durante la segnalazione del commento.' });
        }

        res.status(200).json({ message: 'Commento segnalato con successo!' });
    });
});

// Endpoint per segnalare un post
app.post('/report-post', (req, res) => {
    const { post_id, reported_by, reason, comment } = req.body;

    if (!post_id || !reported_by || !reason) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori!' });
    }

    const query = 'INSERT INTO reports (post_id, reported_by, reason, comment, timestamp) VALUES (?, ?, ?, ?, NOW())';
    db.query(query, [post_id, reported_by, reason, comment], (err, results) => {
        if (err) {
            console.error('Errore durante la segnalazione del post:', err.message);
            return res.status(500).json({ message: 'Errore del server durante la segnalazione del post.' });
        }

        res.status(200).json({ message: 'Post segnalato con successo!' });
    });
});

//feed endpoint
app.get('/feed', authenticateToken, (req, res) => {
    // Caricamento del feed
    const feedQuery = 'SELECT * FROM posts ORDER BY timestamp DESC';
    db.query(feedQuery, (err, posts) => {
        if (err) {
            console.error('Errore durante il caricamento del feed:', err.message);
            return res.status(500).json({ message: 'Errore del server durante il caricamento del feed.' });
        }

        // Aggiungi la formattazione della data
        const formattedPosts = posts.map(post => {
            // Verifica e formatta correttamente la data del timestamp
            const date = new Date(post.timestamp);
            post.formattedDate = date.toLocaleString(); // Formatta la data secondo la tua esigenza
            return post;
        });

        res.status(200).json(formattedPosts);
    });
});


const port = 5000;
app.listen(port, () => {
    console.log(`Server in ascolto sulla porta ${port}`);
});