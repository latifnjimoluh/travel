import { execSync } from 'child_process';
import nodemailer from 'nodemailer';
import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";
 
// Créer une instance de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fonction pour récupérer les détails du dernier commit
function getCommitDetails() {
    const commitInfo = execSync('git log -1 --pretty=format:"%H - %an <%ae> - %s"').toString();
    const commitDetails = execSync('git log -1 --pretty=format:"Commit par : %an<br>Email : %ae<br>Message : %s<br>Date : %ad"').toString();
    return { commitInfo, commitDetails };
}

// Fonction pour récupérer les modifications du dernier commit
function getDiff() {
    return execSync('git diff HEAD~1 HEAD').toString();
}

// Fonction pour analyser le code via Gemini
async function analyzeCodeWithGemini(code) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Veuillez examiner le code suivant puis fournis le nom des fichiers modifiés, la modification effectuée et suggérer des améliorations. Et reponds uniquement en français:\n\n${code}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const text = response.text();
    return text || 'Aucune suggestion d\'amélioration disponible.';
}

// Fonction principale pour exécuter le script
async function main() {
    const { commitInfo, commitDetails } = getCommitDetails();
    const diff = getDiff();

    console.log('Informations du dernier commit:', commitInfo);
    console.log('Détails du commit:', commitDetails);
    console.log('Différences du dernier commit:', diff);

    // Si le diff est vide ou n'a pas de code, on peut arrêter ici
    if (!diff.trim()) {
        console.log('Aucune modification de code à analyser.');
        return;
    }

    const geminiSuggestions = await analyzeCodeWithGemini(diff);

    const combinedSuggestions = `
        <strong>Suggestions d'amélioration via Gemini :</strong><br>
        <pre>${geminiSuggestions}</pre>
    `;

    console.log('Suggestions d\'amélioration via Gemini:', combinedSuggestions);

    const emailMatch = commitInfo.match(/<(.*?)>/);
    let userEmail = emailMatch ? emailMatch[1] : '';

    if (!userEmail.includes('@gmail.com')) {
        const username = userEmail.substring(userEmail.indexOf('+') + 1, userEmail.indexOf('@'));
        userEmail = `${username}@gmail.com`; // Créer l'adresse e-mail
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', // true pour SSL, false pour TLS
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Notification Git" <${process.env.SMTP_USERNAME}>`,
        to: userEmail,
        subject: "Nouveau commit effectué",
        html: `
            <html>
            <head>
                <title>Notification de Commit</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        background-color: #ffffff;
                        border-radius: 5px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        padding: 20px;
                    }
                    h1 {
                        color: #333;
                    }
                    pre {
                        background-color: #eee;
                        border-left: 3px solid #007bff;
                        padding: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Nouveau Commit Effectué !</h1>
                    <p>Voici les détails du dernier commit :</p>
                    <pre>${commitDetails}</pre>
                    <p>${combinedSuggestions}</p>
                    <p>Merci de votre attention.</p>
                </div>
            </body>
            </html>
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Erreur lors de l'envoi de l'email : ${error.message}`);
        } else {
            console.log(`Notification de commit envoyée à ${userEmail} !`);
        }
    });
}

// Exécuter le script principal
main();
