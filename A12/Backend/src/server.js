require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const rateLimit = require("express-rate-limit");

const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rateLimiter = rateLimit({
    windowMs: 30 * 1000, // 1 minute window
    max: 5, // Limit each IP to 3 requests per windowMs
    message: "Too many requests from this IP, please try again after a minute",
});

const S3_BUCKET =
    process.env.REACT_APP_S3_BUCKET_NAME || "tictactoe-bucket-test";

const SNS_TOPIC_ARN = process.env.REACT_APP_SNS_TOPIC_ARN;

const s3Config = {
    region: process.env.REACT_APP_AWS_REGION || undefined,
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || undefined,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || undefined,
    sessionToken: process.env.REACT_APP_AWS_SESSION_TOKEN || undefined,
};

const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use("/rankings", rateLimiter);
// app.use("/game-history/:email", rateLimiter);
// app.use("/profile-pic/:email", rateLimiter);
// app.use("/upload", rateLimiter);
// app.use("/subscribe-sns", rateLimiter);
// app.use("/unsubscribe-sns", rateLimiter);
// app.use("/sns-subscription-status/:email", rateLimiter);

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: S3_BUCKET,
        acl: "public-read",
        key: (req, file, cb) => {
            const email = req.body.email;
            console.log("Email received:", email);
            const fileName = `${email}-profilepic${path.extname(
                file.originalname
            )}`;
            cb(null, fileName);
        },
    }),
});

let gameData = {
    board: ["", "", "", "", "", "", "", "", ""],
    currentPlayer: "X",
    winner: null,
    gameOver: false,
    winningCombination: -1,
    oldGame: false,
};

playerNum = 0;
lastNotificationTime = 0;
const playerList = new Map();
const playerEmails = new Map();

function getEmailByRole(role) {
    for (let [id, playerRole] of playerList.entries()) {
        if (playerRole === role) {
            return playerEmails.get(id);
        }
    }
    return null;
}

function saveGameResult(email, result, enemy_email) {
    const params = {
        TableName: "GameResults",
        Item: {
            email: email,
            enemy: enemy_email,
            timestamp: Date.now(),
            result: result, // 'win', 'lose', 'draw'
        },
    };

    return dynamoDb.put(params).promise();
}

function getNextPlayerRole() {
    const values = Array.from(playerList.values());

    if (values.includes("X") && !values.includes("O")) {
        return "O";
    } else if (!values.includes("X") && values.includes("O")) {
        return "X";
    } else if (!values.includes("X") && !values.includes("O")) {
        return "X";
    } else {
        return null;
    }
}

io.on("connection", (socket) => {
    socket.on("setEmail", (email) => {
        playerEmails.set(socket.id, email);
    });

    if (playerList.size < 2) {
        console.log("Player connected! Socket: " + socket.id);
        playerNum++;
        console.log("Number of players: ", playerNum);
        let role = getNextPlayerRole();
        socket.emit("playerRole", role);
        playerList.set(socket.id, role);
        console.log(playerEmails);
        console.log(playerList);

        if (playerNum == 1) {
            socket.emit("waiting");
        }
        if (playerNum == 2) {
            io.sockets.emit("gameState", gameData);
        }
    } else {
        console.log("Observer connected! Socket: " + socket.id);
        socket.emit("observe");
        socket.emit("gameState", gameData);
    }

    socket.on("disconnect", () => {
        if (playerList.has(socket.id)) {
            console.log(
                "Player " + playerList.get(socket.id) + " disconnected!"
            );
            playerNum--;
            console.log("Number of players: ", playerNum);
            playerList.delete(socket.id);
            playerEmails.delete(socket.id);
        } else {
            console.log("Observer " + socket.id + " disconnected!");
        }
    });

    socket.on("makeMove", (index) => {
        if (
            !gameData.gameOver &&
            gameData.board[index] === "" &&
            playerList.has(socket.id)
        ) {
            gameData.board[index] = gameData.currentPlayer;
            gameData.winningCombination = checkForWinner();
            const winnerEmail = getEmailByRole(gameData.currentPlayer);
            const loserEmail = getEmailByRole(
                gameData.currentPlayer === "X" ? "O" : "X"
            );

            if (gameData.winningCombination >= 0) {
                gameData.gameOver = true;
                gameData.winner = gameData.currentPlayer;

                saveGameResult(winnerEmail, "win", loserEmail);
                saveGameResult(loserEmail, "lose", winnerEmail);

                const currentTime = Date.now();
                if (currentTime - lastNotificationTime > 10000) {
                    // 10 seconds
                    lastNotificationTime = currentTime;
                    io.emit("updateRanking", {
                        winnerEmail: winnerEmail,
                        loserEmail: loserEmail,
                        result: "player1",
                        winner: gameData.winner,
                        alreadySent: gameData.oldGame,
                    });
                }
            } else if (!gameData.board.includes("")) {
                gameData.gameOver = true;

                saveGameResult(winnerEmail, "draw", loserEmail);
                saveGameResult(loserEmail, "draw", winnerEmail);
            } else {
                gameData.currentPlayer =
                    gameData.currentPlayer === "X" ? "O" : "X";
            }
            io.emit("gameState", gameData);
            if (gameData.gameOver) gameData.oldGame = true;
            // console.log("Win Cond: " + gameData.winningCombination);
        }
    });

    socket.on("resetGame", () => {
        resetGame();
        io.emit("gameState", gameData);
    });
});

function checkForWinner() {
    const { board } = gameData;
    const winConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // rows
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // columns
        [0, 4, 8],
        [2, 4, 6], // diagonals
    ];

    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (board[a] !== "" && board[a] === board[b] && board[b] === board[c]) {
            return i;
        }
    }

    return -1;
}

function resetGame() {
    gameData = {
        board: ["", "", "", "", "", "", "", "", ""],
        currentPlayer: gameData.currentPlayer === "X" ? "O" : "X",
        winner: null,
        gameOver: false,
        winningCombination: -1,
        oldGame: false,
    };
}

app.get("/", (req, res) => {
    res.send("Tutaj działa backend");
});

app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        console.error("No file received");
        return res.status(400).send({ error: "No file received" });
    }
    res.status(200).send({ fileUrl: req.file.location });
});

app.get("/profile-pic/:email", async (req, res) => {
    const email = req.params.email;
    const baseFileName = `${email}-profilepic`;
    const possibleExtensions = ["jpg", "jpeg", "png"];

    const checkFile = async (extension) => {
        const fileName = `${baseFileName}.${extension}`;
        const params = {
            Bucket: S3_BUCKET,
            Key: fileName,
        };

        return new Promise((resolve, reject) => {
            s3.headObject(params, (err, data) => {
                if (err) {
                    if (err.code === "NotFound") {
                        resolve(false);
                    } else {
                        reject(err);
                    }
                } else {
                    const fileUrl = s3.getSignedUrl("getObject", params);
                    resolve(fileUrl);
                }
            });
        });
    };

    try {
        let fileUrl = null;

        for (const extension of possibleExtensions) {
            fileUrl = await checkFile(extension);
            if (fileUrl) {
                break;
            }
        }

        if (fileUrl) {
            res.status(200).send({ fileUrl });
        } else {
            res.status(404).send("Profile picture not found");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error checking profile picture");
    }
});

app.get("/game-history/:email", async (req, res) => {
    const email = req.params.email;

    const params = {
        TableName: "GameResults",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
            ":email": email,
        },
    };

    try {
        const data = await dynamoDb.query(params).promise();
        res.status(200).json(data.Items);
    } catch (error) {
        console.error("Error fetching game history:", error);
        res.status(500).send("Error fetching game history");
    }
});

// Endpoint to subscribe to SNS notifications
app.post("/subscribe-sns", async (req, res) => {
    const { email } = req.body;

    const params = {
        Protocol: "EMAIL",
        TopicArn: SNS_TOPIC_ARN,
        Endpoint: email,
    };

    try {
        const data = await sns.subscribe(params).promise();
        res.status(200).json({ message: "Subscribed successfully", data });
    } catch (error) {
        console.error("Error subscribing:", error);
        res.status(500).send("Error subscribing");
    }
});

// Endpoint to unsubscribe from SNS notifications
app.post("/unsubscribe-sns", async (req, res) => {
    const { email } = req.body;

    const listParams = {
        TopicArn: SNS_TOPIC_ARN,
    };

    try {
        const data = await sns.listSubscriptionsByTopic(listParams).promise();
        const subscription = data.Subscriptions.find(
            (sub) => sub.Endpoint === email
        );

        if (subscription && subscription.SubscriptionArn) {
            const unsubscribeParams = {
                SubscriptionArn: subscription.SubscriptionArn,
            };

            await sns.unsubscribe(unsubscribeParams).promise();
            res.status(200).json({ message: "Unsubscribed successfully" });
        } else {
            res.status(404).json({ message: "Subscription not found" });
        }
    } catch (error) {
        console.error("Error unsubscribing:", error);
        res.status(500).send("Error unsubscribing");
    }
});

// Endpoint to check SNS subscription status
app.get("/sns-subscription-status/:email", async (req, res) => {
    const email = req.params.email;

    const params = {
        TopicArn: SNS_TOPIC_ARN,
    };

    try {
        const data = await sns.listSubscriptionsByTopic(params).promise();
        const subscription = data.Subscriptions.find(
            (sub) => sub.Endpoint === email
        );
        if (subscription) {
            const isVerified = !subscription.SubscriptionArn.startsWith(
                "PendingConfirmation"
            );
            res.status(200).json({
                isSubscribed: true,
                isVerified: isVerified,
                subscription,
            });
        } else {
            res.status(404).json({
                isSubscribed: false,
                isVerified: true,
                message: "Not subscribed",
            });
        }
    } catch (error) {
        console.error("Error checking subscription status:", error);
        res.status(500).json({
            isSubscribed: false,
            isVerified: true,
            message: "Error checking subscription status",
        });
    }
});

// Endpoint to get player ranking
app.get("/ranking", rateLimiter, async (req, res) => {
    const params = {
        TableName: "GameRankings",
        ScanIndexForward: false,
        Limit: 10,
    };

    try {
        const data = await dynamoDb.scan(params).promise();
        res.status(200).json(data.Items);
    } catch (error) {
        console.error("Error fetching player ranking:", error);
        res.status(500).send("Error fetching player ranking");
    }
});

server.listen(PORT, () => {
    console.log("Server is running on port", PORT);
});

app.get("/test-s3", async (req, res) => {
    try {
        const params = {
            Bucket: S3_BUCKET,
        };
        const data = await s3.listObjectsV2(params).promise();
        res.status(200).json({
            message: "Successfully connected to S3",
            data: data,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error connecting to S3",
            error: error.message,
        });
    }
});
