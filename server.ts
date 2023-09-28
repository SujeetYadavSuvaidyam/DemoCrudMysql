import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import connection from './Config db/db';
import cors from 'cors'
import bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2/typings/mysql/lib/protocol/packets/RowDataPacket';
import jwt from 'jsonwebtoken';
const JWT_SECRET = 'your_jwt_secret';
const app = express();
app.use(cors())
app.use(bodyParser.json());

app.get('/user', authenticateToken, (req: Request, res: Response) => {
    res.send({ message: "Hello World" })
})


app.get('/st', (req: Request, res: Response) => {
    const sql = "select * from students"
    connection.query(sql, (error, data) => {
        if (error) {
            console.log('error')
        } else {
            return res.json(data)
        }
    })
});
app.post('/po', (req: Request, res: Response) => {
    const sql = req.body;
    const insert = 'insert into students set ?'
    connection.query(insert, sql, (error, data) => {
        if (error) {
            console.log('error', error)
        } else {
            return res.json({ message: 'Post Created', data })
        }
    })
})
app.put('/:id', (req: Request, res: Response) => {
    const sql = [req.body, req.params.id];
    const insert = 'update students set ? where id=?'
    connection.query(insert, sql, (error, data) => {
        if (error) {
            console.log('error')
        } else {
            return res.json(data)
        }
    })
})
app.delete('/:id', (req: Request, res: Response) => {
    const sql = req.params.id;
    const insert = 'delete from students  where id=?'
    connection.query(insert, sql, (error, data) => {
        if (error) {
            console.log('error')
        } else {
            return res.json(data)
        }
    })
})


app.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            username: username,
            email: email,
            password: hashedPassword,
        };

        const query = 'INSERT INTO register SET ?';
        connection.query(query, newUser, (err, result) => {
            if (!username) {
                res.send({ message: "Please username enter" })
                return;
            } else if (err) {
                console.error('Error registering user:', err);
                res.status(500).json({ message: 'Already user exits' });
                return;
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (error) {
        // console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
    }

});
app.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const query = 'SELECT * FROM register WHERE email = ?';
        connection.query(query, email, async (err, results) => {
            if (err) {
                console.error('Error logging in:', err);
                res.status(500).json({ error: 'Error logging in' });
                return;
            }
            // console.log(results)
            if ((results as any[]).length === 0) {
                res.status(401).json({ error: 'Invalid credentialssss' });
                return;
            }
            const user = (results as RowDataPacket[])[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
                expiresIn: '1h', // Token expires in 1 hour
            });

            return res.status(200).json({ message: 'Login successful', token });

        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Error logging in' });
    }

})
interface CustomRequest extends Request {
    decoded?: string | undefined;
}
function authenticateToken(req: CustomRequest, res: Response, next: NextFunction) {
    try {
        let token = req.headers.token;
        // console.log(token)
        if (token) {
            let decoded = jwt.verify(token as any, JWT_SECRET);
            req.decoded = decoded as any;
            // console.log(req.decoded)
            next();
        } else {
            return res.status(401).json({ message: "Token not found Please enter token in header" });
        }
    } catch (error) {
        return res.status(500).json({ message: `internal Server error",${error}` });
    }
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});